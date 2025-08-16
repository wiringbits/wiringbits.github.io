---
title: "Define a nice repl for your scala app"
description: "How to use sbt console as a nice repl for your Scala app with initialization scripts and custom configuration."
pubDate: "2020-05-03"
heroImage: ../../assets/posts/define-nice-repl-scala/post_photo.png
categories: ["scala"]
permalink: "scala/2020/05/03/define-a-nice-repl-for-your-scala-app.markdown.html"
---

In this short post, I would like to explain how to use `sbt console` as a nice repl for your app, which is a common practice in interpreted languages (like Ruby, Python, JavaScript), I have been willing to do something similar on Scala for a while but until today I actually tried, gladly, it's surprisignly simple.

As you very likely know, running `sbt console` in a project gives you a [Scala repl](https://docs.scala-lang.org/overviews/repl/overview.html) which includes your app sources as well as it's dependencies (see the [official sbt docs](https://www.scala-sbt.org/1.x/docs/Command-Line-Reference.html#Configuration-level+tasks)). While this is handy, it misses specific details for your app, like commonly required methods while experimenting.

The way to get this involves a couple of sbt options:
- [Run a initialization script when entering the scala repl](https://www.scala-sbt.org/1.x/docs/Howto-Scala.html#Define+the+initial+commands+evaluated+when+entering+the+Scala+REPL)
- [Exclude files from being compiled](https://www.scala-sbt.org/1.x/docs/Howto-Customizing-Paths.html#Include%2Fexclude+files+in+the+source+directory)

In summary, let's add the `console.scala` file to the root of your project, which can look like (add any common imports or initializing code specific to your app):

```scala
println("Initialize repl")
```

Update your `build.sbt` to exclude the file from compiling, (otherwise, sbt may complain compiling your script), and to set the initialization script, which can be as simple as:

```scala
// initialization script for the console
val consoleInitialCommandsFile = "console.scala"
excludeFilter := HiddenFileFilter || consoleInitialCommandsFile
lazy val consoleScript = scala.util.Try(scala.io.Source.fromFile(consoleInitialCommandsFile).mkString).getOrElse("")
initialCommands in console := consoleScript
```

You can even build several entrypoints for different purposes by extending this idea, which should help your team to speed up experimenting, in my case, it's pretty useful to have a handy websocket client for my server without the complexity of building one.


## More
If you have enabled the fatal-warnings compiler option (and most likely you should), the Scala repl becomes unusable, but, it's easily fixed by disabling that options and other noisy options just when running the console, include the following on your `build.sbt`:

```scala
// Some options are very noisy when using the console and prevent us using it smoothly, let's disable them
val consoleDisabledOptions = Seq("-Xfatal-warnings", "-Ywarn-unused", "-Ywarn-unused-import")
scalacOptions in (Compile, console) ~= (_ filterNot consoleDisabledOptions.contains)
```
