---
title: "Notes about Play Framework and the ExecutionContext"
description: "Best practices for using ExecutionContext in Play Framework applications, avoiding common mistakes and ensuring proper thread pool management."
pubDate: "2020-03-22"
heroImage: ../../assets/posts/notes-about-play/post_photo.jpg
categories: ["scala", "playframework"]
permalink: "scala/playframework/2020/03/22/notes-about-play-framework-and-the-execution-context.html"
---

In Scala, we talk a lot about non-blocking or asynchronous operations, and while using [Play Framework](https://www.playframework.com), you are encouraged to use those, which forces you to deal with `Future[T]` and its tightly coupled dependency, the `ExecutionContext`.

While the [Play Framework - Thread Pools best practices](https://www.playframework.com/documentation/2.8.x/ThreadPools#Best-practices) docs do a good job explaining how to use the thread pools and execution contexts, new people to Scala tend to follow the same mistakes.

Here I'm detailing the approach we follow at [wiringbits](https://wiringbits.net), we hope you find it useful too.

As a summary:
- Avoid the global `ExecutionContext`.
- Avoid using the default `ExecutionContext` for everything.
- Avoid specific execution contexts that depend on akka, use a base trait instead.
- Ensure that your specific execution contexts are singletons.
- Ensure your tests use your specific execution contexts to avoid runtime errors.


## Avoid the global ExecutionContext
It should be clear that the global execution context must not be used in any place, while it's common to just add this line while experimenting, you shouldn't it:

```scala
import scala.concurrent.ExecutionContext.Implicits.global
```

Instead, use the default play execution context, which can be injected easily on the class constructor (unless you stopped using [Guice](https://github.com/google/guice) which is the default way to do [Dependency Injection](https://www.playframework.com/documentation/2.8.x/ScalaDependencyInjection)), like:

```scala
import javax.inject.Inject

import scala.concurrent.{ExecutionContext, Future}

class MyController @Inject() (implicit ec: ExecutionContext) { ... }
```


## Avoid using the default ExecutionContext for everything

Making the `ExecutionContext` dependency explicit has several advantages, what matters on this post is that it forces you to think about the operations your class/method is performing, when something may block the current thread, you are better using a typed execution context, like:

```scala
package net.wiringbits.executors

import javax.inject.{Inject, Singleton}

import akka.actor.ActorSystem
import play.api.libs.concurrent.CustomExecutionContext

import scala.concurrent.ExecutionContext

trait DatabaseExecutionContext extends ExecutionContext
object DatabaseExecutionContext {
    @Singleton
    class AkkaBased @Inject() (system: ActorSystem)
        extends CustomExecutionContext(system, "database.dispatcher")
        with DatabaseExecutionContext
}
```

Which requires you to update your `application.conf` to load the guice module and define the `database.dispatcher` thread pool, like:
```
play.modules.enabled += "net.wiringbits.modules.ExecutorsModule"

database.dispatcher {
  executor = "thread-pool-executor"
  throughput = 1
  thread-pool-executor {
    fixed-pool-size = ${fixedConnectionPool}
  }
}
```

This prevents using the wrong execution context for blocking operations, in this case for the database operations.

## Ensure that your specific execution contexts are singletons
Note that the custom context is marked as `Singleton`, if you read the [akka docs](https://github.com/akka/akka/blob/master/akka-actor/src/main/scala/akka/dispatch/Dispatchers.scala#L109), you'll understand, we need the same thread pool for every class:
```scala
/**
  * Returns a dispatcher as specified in configuration. Please note that this
  * method _may_ create and return a NEW dispatcher, _every_ call (depending on the `MessageDispatcherConfigurator`dispatcher config the id points to).
  */
```


## Avoid specific execution contexts that depend on akka, use a base trait instead
As you saw, we use a base trait, which allow us to write tests without needing to bring akka to them, but, you need to add the guice module to specify it's implementation, for example:
```scala
package net.wiringbits.modules

import com.google.inject.AbstractModule
import net.wiringbits.executors._

class ExecutorsModule extends AbstractModule {

  override def configure(): Unit = {
    bind(classOf[DatabaseExecutionContext]).to(classOf[DatabaseExecutionContext.AkkaBased]).asEagerSingleton()
  }
}
```

Then, you can easily fake the typed contexts for your tests:
```scala
implicit val globalEC: ExecutionContext = scala.concurrent.ExecutionContext.global

implicit val databaseEC: DatabaseExecutionContext = new DatabaseExecutionContext {
    override def execute(runnable: Runnable): Unit = globalEC.execute(runnable)

    override def reportFailure(cause: Throwable): Unit = globalEC.reportFailure(cause)
}
```


## Ensure your tests use you specific execution contexts to avoid runtime errors.
At last, as creating the custom execution context depends on the `application.conf` file (due to calling `CustomExecutionContext(system, "database.dispatcher")`), make sure that some of your tests use those specific contexts to catch runtime errors, otherwise, your application will likely fail to start due to the `ConfigurationException` being thrown by akka.


## More
This is the approach we use for our projects, feel free to check these examples:
- [DatabaseExecutionContext](https://github.com/X9Developers/block-explorer/blob/develop/server/app/com/xsn/explorer/executors/DatabaseExecutionContext.scala)
- [ExecutorsModule](https://github.com/X9Developers/block-explorer/blob/develop/server/app/com/xsn/explorer/modules/ExecutorsModule.scala)
- [The executors for testing](https://github.com/X9Developers/block-explorer/blob/develop/server/test/com/xsn/explorer/helpers/Executors.scala)
