---
layout: post
title:  "From Hibernate schema generation to Flyway in existing applications"
date:   2021-07-25 09:35:32 -0700
categories: java
post_photo: assets/posts/from-hibernate-to-flyway/post_photo.png
---

Recently, we got to work in a couple of Java projects that depend on Hibernate to evolve the production SQL schema, this post explains the approach we followed in order to move to [Flyway](https://flywaydb.org/).

The post assumes that you are already familiar with the problem and got to this post while looking for potential solutions.

## Summary
While letting Hibernate handle the SQL schema evolution (`hbm2ddl`) is usually discouraged, sometimes you do not have control on the choices made from previous developers, which was our case.


In short, the steps we followed in both projects are:
1. Dump the existing SQL schema from the production database, use it to generate the first Flyway migration script.
2. Add the necessary code to execute Flyway when the application starts, enabling the [baselineOnMigrate](https://flywaydb.org/documentation/usage/api/javadoc.html) option, as well as disabling Hibernate schema evolution option (`hbm2ddl`), or set it to `validate`.
3. Clean out your code to **NOT** define the schema constraints, otherwise, Hibernate schema valdation could fail.
4. Test the integration locally with an existing database as well as with a new database, make sure the schema generated is the same as the one from the dump (I know, it is tedious work but better to be safe), having integration tests for this is crucial, otherwise, your work will be harder.
5. Deploy your application, which should generate the flyway control table (by default `flyway_schema_history`).


## The problem
Incremental SQL migration scripts allow us to keep a sane control on how your schema evolves. Even Hibernate [docs](https://docs.jboss.org/hibernate/orm/5.4/userguide/html_single/Hibernate_User_Guide.html#schema-generation) mentions it:

> Although the automatic schema generation is very useful for testing and prototyping purposes, in a production environment, it’s much more flexible to manage the schema using incremental migration scripts.


Letting Hibernate manage the schema evolution has several drawbacks, these are the ones I can remember:
- Duplicate or non-sense constraints/indexes.
- Human unreadable names in constraints/indexes.
- Poor control on how the schema evolves.

Besides those, one of our inherited projects got a cyclic foreign key dependency, table `A` depended on table `B` which depended on table `A`.


## Show me the code
The next sections explain more details on how we handled the problem.

### 1. Dump the existing SQL schema from the production database
In MySQL, `mysqldump db_name > schema.sql` would write the `db_name` database schema to the `schema.sql` file, you will need to grab most of the creation statements to produce your first Flyway migration script.

Be aware that you will need to analyze the dump carefuly, sometimes the tables are not in the right order.

This will be your first SQL migration script, while this is not necessary for existing environment, it will allow to easily launch a new environment without the need to create the schema manually.

One detail to consider is if the project relies on certain values to be present in the database, for example, a table filled with states, permissions, etc,

In the case of Hibernate/MySQL, this table is very likely required in your first migration script, otherwise, you application won't start (adapt it to whatever matches your schema):

```sql
-- given that we already have code depending on this table, we need to create it manually
CREATE TABLE `hibernate_sequence` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- initialize it with a value, otherwise, hibernate will fail when the app starts
INSERT INTO `hibernate_sequence` VALUES (1);
```


### 2. Add the necessary code to execute Flyway when the application starts
Once you get the schema creation script, let's add the necessary code to get flyway applying the migration scripts when the application starts.

The key for this process to work is to enable the `baselineOnMigrate` flyway option, in short, it will create the flyway control table (`flyway_schema_history`), setting the first row as the existing migration script you created in the previous step, without it, the flyway process fails because it detects that the database has an existing schema without the flyway control table.

Let me showcase some examples on how to do it.

#### Spring Boot
The `application.properties` file can be used to configure flyway, like this:

```properties
# Trigger flyway when the application starts
spring.flyway.enabled=true

# Necessary because our production environment does not have the flyway control table
spring.flyway.baselineOnMigrate=true

# Necessary to avoid liquibase trying to handle migrations
spring.liquibase.enabled=false

# Necessary to avoid hibernate applying migrations but allow it to validate the schema against the code entities
spring.jpa.hibernate.ddl-auto=validate
```

#### Pure Hibernate
When bootstraping Hibernate with code, these are the changes we had to make:

```java
dataConfig.setHibernateHdm2dllAuto("validate");
```

Then, make sure to invoke Flyway when the application starts, like:

```java
Flyway.configure()
    .dataSource(...)
    .baselineOnMigrate(true) // important!
    .load()
    .migrate();
```

You will likely prefer to log or validate the migration result from flyway.


### 3. Clean out your code to NOT define the schema constraints
When Hibernate handles the schema evolution, the column definitions should be removed, otherwise, Hibernate schema valdation could fail, for example, let's assume you have a Hibernate entity, like:

```java
@Entity
class DemoEntity {
  @Column(columnDefinition = "boolean default false", nullable = false)
  private Boolean enabled = Boolean.FALSE;
}
```

The constraints need to be removed, this is a way to do so:

```java
@Entity
class DemoEntity {
  @Column(name = "enabled")
  private Boolean enabled = Boolean.FALSE;
}
```

You can either go and change everything at once, or just change the ones that are causing problems when the application starts.

### 4. Test the integration locally
Once the previous steps are ready, you must test the integration carefully, these are the steps we followed.

#### New environment
This test makes sure that any new developers will be able to get the application working without much effort (at least on what relates to the database):
1. Create a new database.
2. Configure your application to connect to the new database.
3. Run the application, which should start smoothly.
4. Verify that the database has the schema created.
5. Run as many tests as possible to your application flow, any issues found should get you back to the previous steps and repeat.


#### Existing enviroment
This is the most important test because it is how the application will behave once it gets deployed to production:
1. Clone the production environment, either, dump the database into a local one, take an snapshot and restore it in new database, or whatever approach adapts to you, what matters is that your database has the data.
2. Configure your application to connect to the cloned database.
3. Run the application, which should start smoothly.
4. Verify that the database got the flyway control table created (`flyway_schema_history`) which includes a single row, the only available migration script.
5. Run as many tests as possible to your application flow, any issues found should get you back to the previous steps and repeat.

There is a potential tricky detail, nn the rare case that you get to work in a database that used flyway in the past, then, started using Hibernate migrations, the best way we found is to delete the flyway control table before running the application (which is done before step `3`).


### 5. Deploy your application

Now that you are ready, it is time to deploy the application and make sure it works as expected, just follow what's described in the previous section(see `Existing enviroment` above) but using the production environment/database.




## More
I hope that this could be useful for people getting into a similar problem, when we got to deal with it, I didn't found a detailed explanation on how to proceed.

The source code for this page can be found [here](https://github.com/wiringbits/wiringbits.github.io/blob/master/_posts/2021-07-25-from-hibernate-schema-generation-to-flyway-in-existing-applications.md).
