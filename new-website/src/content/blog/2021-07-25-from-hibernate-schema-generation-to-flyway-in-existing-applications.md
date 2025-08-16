---
title: "From Hibernate schema generation to Flyway in existing applications"
description: "Step-by-step guide to migrate from Hibernate schema generation to Flyway for database migrations in existing Java applications."
pubDate: "2021-07-25"
heroImage: ../../assets/posts/from-hibernate-to-flyway/post_photo.png
categories: ["java"]
permalink: "java/2021/07/25/from-hibernate-schema-generation-to-flyway-in-existing-applications.html"
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

> Although the automatic schema generation is very useful for testing and prototyping purposes, in a production environment, it's much more flexible to manage the schema using incremental migration scripts.


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

One detail to consider is if the project relies on certain values to be present in the database, for example, a table filled with states, permissions, etc, you will need to include those in your migration script as well.

### 2. Add Flyway to your application
Add the Flyway dependency to your project:

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
    <version>7.11.0</version>
</dependency>
```

Then, configure Flyway to run when your application starts:

```java
@Component
public class FlywayMigration {
    
    @Value("${spring.datasource.url}")
    private String url;
    
    @Value("${spring.datasource.username}")
    private String username;
    
    @Value("${spring.datasource.password}")
    private String password;
    
    @PostConstruct
    public void migrate() {
        Flyway flyway = Flyway.configure()
            .dataSource(url, username, password)
            .baselineOnMigrate(true)
            .load();
        flyway.migrate();
    }
}
```

### 3. Disable Hibernate schema generation
Update your `application.properties` to disable Hibernate schema generation:

```properties
# Disable Hibernate schema generation
spring.jpa.hibernate.ddl-auto=validate
# or completely disable it
# spring.jpa.hibernate.ddl-auto=none
```

### 4. Create your migration scripts
Place your SQL migration scripts in `src/main/resources/db/migration/` with the naming convention `V1__Initial_schema.sql`, `V2__Add_user_table.sql`, etc.

Example first migration script (`V1__Initial_schema.sql`):

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Testing
Make sure to test your migration thoroughly:

1. **Test with existing database**: Run your application against an existing database to ensure the baseline works correctly.
2. **Test with new database**: Run your application against a fresh database to ensure all migrations work from scratch.
3. **Compare schemas**: Use tools like `mysqldiff` to compare the schema generated by your migrations with the original production schema.

## Deployment
When deploying to production:

1. The `baselineOnMigrate=true` option will create the `flyway_schema_history` table and mark the current state as the baseline.
2. Future migrations will be applied incrementally.
3. Monitor the deployment carefully to ensure no issues arise.

## Conclusion
Migrating from Hibernate schema generation to Flyway requires careful planning and testing, but the benefits of having explicit control over your database schema evolution are worth the effort. The key is to be methodical and test thoroughly before deploying to production.
