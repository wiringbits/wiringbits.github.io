---
title: "Notes about loading configuration | Examples for Play Framework and Spring Boot"
description: "Best practices for loading configuration in applications with examples for Play Framework and Spring Boot, including typed models and environment variable overrides."
pubDate: "2021-12-30"
heroImage: ../../assets/posts/load-config-notes/post_photo.jpg
categories: ["wiringbits"]
permalink: "wiringbits/2021/12/30/notes-about-loading-configuration-examples-for-play-framework-and-spring-boot.html"
---

Loading configuration is a crucial part for most applications, still, I have seen many projects where configuration layer didn't get much love.

This post summarizes the process we have followed to load configuration our projects, while the examples are for Play Framework and Spring Boot, most ideas are agnostic to the framework/language.

In summary:
1. It should be clear what a configuration entry is for, with reasonable defaults.
1. Prefer small typed models to represent a configuration unit.
1. Allow overriding environment-dependent entries with environment variables.
1. Fail-fast, most configuration models should be loaded eagerly when the application starts, a wrong configuration would prevent the application from starting.
1. Log the loaded config to easily understand what's going on when the application starts (masking secrets).
1. Configuration models should be immutable.

## Details
Let me dive into the suggested approach, the examples use:
- [Play Framework](https://www.playframework.com/documentation/2.8.x/ConfigFile) which uses [HOCON files](https://github.com/lightbend/config), commonly loading the configuration from the `application.conf` file.
- [Spring Boot](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html) loading the configuration from a properties file, commonly called `application.properties`.


### 1. It should be clear what a configuration entry is for, with reasonable defaults
How many times have you got into a new project that requires lots of tries to get it running? Unfortunately, it seems that this is more common than what I would expect, we have experienced this problem in most of the projects we have inherited.

While a good README is a sane expectation for any project, it is also ideal to document what are the configuration entries for.

For example, this HOCON piece defines an exchange fee percent but what's it all about? it could either be `[0, 100]` or `[0, 1]`, such ambiguity could be avoided by adding small comment.

```hocon
# Play Framework
exchangeFees {
    BTC {
        percent = 1
    }
}
```

When you have the context about the project, these comments could seem unnecessary and noisy, but, they are pretty valuable when you are in a hurry fixing a config problem for a production incident, or, when getting back to a project after a long time, of course, this helps a lot to new developers jumping into the project.

I have seen this to happen commonly with API Keys, for example, while most developers would understand how to get these AWS keys, the permissions that need to be associated with the keys is an unknown, assigning the wrong permissions would lead to runtime errors which can be avoided.

```properties
# Spring Boot
aws.region=us-east-1
aws.accessKeyId=REPLACE_ME
# Required permissions: s3:GetObject, s3:PutObject for bucket my-app-bucket
aws.secretAccessKey=REPLACE_ME
```

### 2. Prefer small typed models to represent a configuration unit
Instead of accessing configuration values directly from the configuration object, prefer creating small typed models that represent a configuration unit.

Play Framework example:
```scala
case class DatabaseConfig(
  url: String,
  username: String,
  password: String,
  maxConnections: Int = 10
)

object DatabaseConfig {
  def load(config: Config): DatabaseConfig = {
    val dbConfig = config.getConfig("database")
    DatabaseConfig(
      url = dbConfig.getString("url"),
      username = dbConfig.getString("username"),
      password = dbConfig.getString("password"),
      maxConnections = dbConfig.getInt("maxConnections")
    )
  }
}
```

Spring Boot example:
```java
@ConfigurationProperties(prefix = "database")
@Component
public class DatabaseConfig {
    private String url;
    private String username;
    private String password;
    private int maxConnections = 10;
    
    // getters and setters
}
```

### 3. Allow overriding environment-dependent entries with environment variables
Environment variables are crucial for deployment flexibility, especially in containerized environments.

Play Framework example:
```hocon
database {
  url = "jdbc:postgresql://localhost:5432/myapp"
  url = ${?DATABASE_URL}
  username = "myapp"
  username = ${?DATABASE_USERNAME}
  password = "secret"
  password = ${?DATABASE_PASSWORD}
}
```

Spring Boot example:
```properties
database.url=jdbc:postgresql://localhost:5432/myapp
database.username=myapp
database.password=secret
```

Spring Boot automatically supports environment variable overrides using the `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` format.

### 4. Fail-fast with eager configuration loading
Load and validate configuration when the application starts, not when it's first used.

Play Framework example:
```scala
@Singleton
class ConfigModule @Inject()(config: Config) {
  // Load all configs eagerly
  val databaseConfig: DatabaseConfig = DatabaseConfig.load(config)
  val awsConfig: AwsConfig = AwsConfig.load(config)
  
  // Validate critical configs
  require(databaseConfig.url.nonEmpty, "Database URL cannot be empty")
  require(awsConfig.accessKeyId.nonEmpty, "AWS access key cannot be empty")
}
```

Spring Boot example:
```java
@Component
@Validated
public class ConfigValidator {
    
    @Autowired
    private DatabaseConfig databaseConfig;
    
    @PostConstruct
    public void validate() {
        if (databaseConfig.getUrl().isEmpty()) {
            throw new IllegalStateException("Database URL cannot be empty");
        }
    }
}
```

### 5. Log the loaded config (masking secrets)
Logging configuration helps with debugging and understanding the application state.

```scala
// Play Framework
class ConfigModule @Inject()(config: Config) {
  val databaseConfig: DatabaseConfig = DatabaseConfig.load(config)
  
  logger.info(s"Database config loaded: url=${databaseConfig.url}, " +
    s"username=${databaseConfig.username}, " +
    s"password=${"*" * databaseConfig.password.length}")
}
```

### 6. Configuration models should be immutable
Use immutable data structures for configuration to prevent accidental modifications.

```scala
// Play Framework - case classes are immutable by default
case class ApiConfig(
  baseUrl: String,
  timeout: Duration,
  retries: Int
)
```

```java
// Spring Boot - use final fields
@ConfigurationProperties(prefix = "api")
public final class ApiConfig {
    private final String baseUrl;
    private final Duration timeout;
    private final int retries;
    
    public ApiConfig(String baseUrl, Duration timeout, int retries) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
        this.retries = retries;
    }
    
    // only getters, no setters
}
```

## Conclusion
Following these practices will make your configuration layer more maintainable, debuggable, and deployment-friendly. The key is to treat configuration as a first-class citizen in your application architecture.
