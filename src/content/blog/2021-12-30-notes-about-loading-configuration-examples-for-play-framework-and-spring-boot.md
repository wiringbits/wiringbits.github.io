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
aws.secretAccessKey=REPLACE_ME
```


### 2. Prefer small typed models to represent a configuration unit

I have frequently seen the configuration files logic propagated everywhere in the projects, just like a global context, still, most project components do not really need the whole configuration but minor pieces from it.

**Play Framework example**

Let's define the `application.conf`:

```hocon
aws {
  region = us-east-1
  accessKeyId = REPLACE_ME
  secretAccessKey = REPLACE_ME
}
```

Let's use the config, `SecretsManagerService.scala`:

```scala
import com.typesafe.config.ConfigFactory

class SecretsManagerService {
  private val config = ConfigFactory.load()
  private val accessKeyIdKey = config.getString("aws.accessKeyId")
  private val secretAccessKey = config.getString("aws.secretAccessKey")
  private val region = config.getString("aws.region")

  // uses the settings
  def magic(): Unit = ???
}
```


**Spring Boot example**

Let's define the config, `application.properties`:

```properties
aws.region=us-east-1
aws.accessKeyId=REPLACE_ME
aws.secretAccessKey=REPLACE_ME
```

Let's use the config, `SecretsManagerService.java`:
```java
import org.springframework.beans.factory.annotation.Value;

class SecretsManagerService {
  @Value("${aws.accessKeyId}")
  private String accessKeyId;

  @Value("${aws.secretAccessKey}")
  private String secretAccessKey;

  @Value("${aws.region}")
  private String region;

  public void magic() {
    // Uses the aws settings
  }
}
```

**What's wrong?**
While this approach works, there are many details that you can be improved, for example:

1. It is common that these AWS settings won't be used by a single class, propagating the same pattern around the project, if you ever want to rename the keys (think about a typo `regoin`), many files will be affected and the compiler can't help, getting you to use ctrl+shift+F (or `find`) which is far from ideal, if you miss fixing the typo in one class, you won't detect this until that piece of code gets executed.
2. These kind of keys need to change per environment, when the app goes to production you will need to use production keys, once the application is running, how do you know that you are using the right keys? it is ideal to add a log that allows verifying this when the application starts, in this case, you simply can't do that without obscure tricks because the classes may not be instantiated until the code gets executed.
3. It is time to write tests, you will find out that you have no simple way to test the `SecretsManagerService` with different configuration values, in the case of Spring Boot, you are stuck with a properties file per test suite, and, you need the spring suite just to run a simple test, Play Framework is not very different.
4. Notice how we are repeating `aws.*` many times, all classes depending on the configuration need to be aware of the global configuration structure, we could define a typed model that only expect the values to be there no matter who's the wrapper, accessing `region`/`accessKeyId`/`secretAccessKey` directly, which is more flexible.



### 3. Allow overriding environment-dependent entries with environment variables
I believe there isn't much to be said for justifying this point, it is really useful to have the flexibility to override most settings from environment variables.

Let's take this config:

```hocon
# application.conf
admin {
  email = blog@wiringbits.net
  email = ${?ADMIN_EMAIL}
}
```

```properties
# application.properties
admin.email=blog@wiringbits.net
```

Play Framework config approach is pretty handy because it allow us to optionally define settings from environment variables, `email = ${?ADMIN_EMAIL}` overrides the `email` key only when the `ADMIN_EMAIL` environment variable is present, requiring no changes to the config file!

While Spring Boot has a way to do this, it requires code changes instead of just updating the configuration file.


### 4. Fail-fast, most configuration models should be loaded eagerly when the application starts
This is specially useful when adding new entries to the configuration, it is easy to forget updating the production settings after adding new entries to the default settings.

When the configuration models are loaded eagerly, you will see an error just after deploying the new application's version, which allows you to notice and fix the problem right away.

On the other hand, when the configuration models are loaded lazily, the problem could go unnoticed for a longer period of time, hitting the application in an inconvenient time (specially if you release new versions at Friday nights).

Additionally, it can be useful to validate critical settings when the application starts.
Most of the time, it doesn't make sense to start an application if it can't even access its database (think about wrong credentials).


### 5. Log the loaded config to easily understand what’s going on when the application starts
Following the previous point, have you ever wondered if your configuration changes took effect in a production environment? This shouldn't be a problem if you log the loaded configuration after loading it eagerly (just make sure to mask secrets to avoid propagating those to the log aggregators).


### 6. Configuration models should be immutable
In 2021, immutability is a pattern that has become quite popular, I won't say much about this but the code is far simple when it gets an `AwsConfig` immutable object, for example, this could allow you to create an `AwsClient` once and use it through the application's lifecycle instead of creating it every time you need to deal with AWS.


## Show me the code

Let's dive into some examples that follow these practices.

**NOTE**: For simplicity, I'm ommiting the packages, as well as using Lombok avoid the Java boilerplate.


### Play Framework
The config (`application.conf`):

```hocon
# AWS access settings, the keys are expected to have access to read secrets from the AWS Secrets Manager
aws {
  # The region where the secrets are stored
  region = us-east-1
  region = ${?AWS_REGION}
  
  accessKeyId = REPLACE_ME
  accessKeyId = ${?AWS_ACCESS_KEY_ID}

  secretAccessKey = REPLACE_ME
  secretAccessKey = ${?AWS_SECRET_ACCESS_KEY}
}
```

The typed config object (`AwsConfig.scala`):
```scala
import play.api.Configuration

// A case class makes it handy for using different configs while writing tests
case class AwsConfig(region: String, accessKeyId: String, secretAccessKey: String) {
  // This is how secrets usually leak into logs
  override def toString: String = {
    // handy helper to mask secrets
    import StringUtils.Implicits._

    s"AwsConfig(region = $region, accessKeyId = ${accessKeyId.mask()}, secretAccessKey = ${secretAccessKey.mask()})"
  }
}

object AwsConfig {

  // A smart constructor that knows how to create the AwsConfig given a Play Configuration object
  def apply(config: Configuration): AwsConfig = {
    val region = config.get[String]("region")
    val accessKeyId = config.get[String]("accessKeyId")
    val secretAccessKey = config.get[String]("secretAccessKey")
    // named arguments prevent you from confusing the arguments order
    AwsConfig(region = region, accessKeyId = accessKeyId, secretAccessKey = secretAccessKey)
  }
}

// Just a helper to make it simple rendering secrets in the logs
object StringUtils {

  // simple function to display part of a string, for example `mask("wiringbits-password", 2, 2) == "wi...rd`
  def mask(value: String, prefixSize: Int, suffixSize: Int): String = {
    if (value.length <= prefixSize + suffixSize + 4) {
      // it is not secure to display this string, hide everything
      "..."
    } else {
      s"${value.take(prefixSize)}...${value.takeRight(suffixSize)}"
    }
  }

  object Implicits {

    implicit class StringUtilsExt(val string: String) extends AnyVal {
      def mask(prefix: Int = 2, suffix: Int = 2): String = StringUtils.mask(string, prefix, suffix)
    }
  }
}
```

The Guice module that initializes the config model (`ConfigModule.scala`):

```scala
import com.google.inject.{AbstractModule, Provides}
import org.slf4j.LoggerFactory
import play.api.Configuration

class ConfigModule extends AbstractModule {

  private val logger = LoggerFactory.getLogger(this.getClass)

  // This method knows how to build the AwsConfig given the global play config
  @Provides()
  def awsConfig(global: Configuration): AwsConfig = {
    // this is where we define the place to pick the aws config from
    val config = AwsConfig(global.get[Configuration]("aws"))

    // Let's log the loaded config to make
    logger.info(s"Config loaded: $config")
    config
  }
}
```

At last, we need to tell Play to load the Guice module by updating the `application.conf`:

```scala
play.modules.enabled += "ConfigModule"
```

Now, use the new `AwsConfig`, `AwsService.scala`:

```scala
import javax.inject.Inject

class AwsService @Inject()(config: AwsConfig) {}
```

That's it for Play, run your application, everything should be wired and working.

References:
- [https://www.playframework.com/documentation/2.8.x/ConfigFile](https://www.playframework.com/documentation/2.8.x/ConfigFile)
- [https://www.playframework.com/documentation/2.8.x/ScalaDependencyInjection](https://www.playframework.com/documentation/2.8.x/ScalaDependencyInjection)
- [https://github.com/google/guice](https://github.com/google/guice)




### Spring Boot
The config (`application.properties`):

```properties
# AWS access settings, the keys are expected to have access to read secrets from the AWS Secrets Manager
# The region where the secrets are stored
aws.region=us-east-1
aws.accessKeyId=REPLACE_ME
aws.secretAccessKey=REPLACE_ME
#
```

The typed config object (`AwsConfig.java`):
```java
import lombok.Builder;
import lombok.Data;

@Builder // the builder pattern allow us to build the object with named arguments
@Data // immutable class
public class AwsConfig {
  final String region;
  final String accessKeyId;
  final String secretAccessKey;

  public String toString() {
    return String.format("AwsConfig(%s, %s, %s)", region, StringUtils.mask(accessKeyId), StringUtils.mask(secretAccessKey));
  }
}

// Necessary to mask secrets
class StringUtils {
  // Masks a string, `mask("wiringbits-password") == "wi..."`
  public static String mask(String input) {
    if (input.length() <= 8) return "..."; // not enough characters, it is not safe to render
    else return input.substring(0, 2) + "..."; // take the prefix only, java stdlib is poor compared to scala
  }
}
```

Define a factory to load the config (`AwsConfigSpringFactory.java`):

```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
class AwsConfigSpringFactory {
  @Value("${aws.region}")
  String region;

  @Value("${aws.acessKeyId}")
  String accessKeyId;

  @Value("${aws.secretAccessKey}")
  String secretAccessKey;

  // Provides the config to Spring
  @Bean
  public AwsConfig loadAwsConfig() {
    // named arguemnts
    AwsConfig config = new AwsConfig.AwsConfigBuilder()
            .region(region)
            .accessKeyId(accessKeyId)
            .secretAccessKey(secretAccessKey)
            .build();
    
    // log the config
    log.info("Config loaded: {}", config);
    return config;
  }
}
```



Now, use the new `AwsConfig`, `AwsService.java`:

```java
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AwsService {
  private final AwsConfig config;

  public void magic() {
    // Do something with the config
  }
}
```

That's it for Spring Boot, run your application, everything should be wired and working.


## Conclusion
We have visited some useful details to consider when loading configuration files, as well as real-world examples. While these details may seem obvious, I have touched many projects which could benefit from these, Which is what motivated me to write the post.

I hope that the post can be useful for other developers.
