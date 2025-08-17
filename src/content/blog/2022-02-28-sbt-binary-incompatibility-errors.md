---
title: "Sbt binary incompatibilty errors"
description: "How to diagnose and fix sbt binary incompatibility errors when plugins prevent sbt from loading properly."
pubDate: "2022-02-28"
heroImage: ../../assets/posts/sbt-binary-incompatibility/post_photo.png
categories: ["scala"]
permalink: "scala/2022/02/28/sbt-binary-incompatibility-errors.html"
---

Have you ever seen an error like this when loading `sbt`? this short post explains a way to deal with it:

```
[info] Loading global plugins from /home/dell/.sbt/1.0/plugins
[info] Loading settings for project sample-api-build from plugins.sbt ...
[info] Loading project definition from /home/dell/projects/sample/sample-api/project
[warn] There may be incompatibilities among your library dependencies; run 'evicted' to see detailed eviction warnings.
[error] java.lang.NoSuchMethodError: sbt/Def$.ifS(Lsbt/internal/util/Init$Initialize;Lsbt/internal/util/Init$Initialize;Lsbt/internal/util/Init$Initialize;)Lsbt/internal/util/Init$Initialize; (loaded from file:/home/dell/.sbt/boot/scala-2.12.10/org.scala-sbt/sbt/1.3.10/main-settings_2.12-1.3.10.jar by java.net.URLClassLoader@ad9e5a72) called from class wartremover.WartRemover$ (loaded from file:/home/dell/.cache/coursier/v1/https/repo1.maven.org/maven2/org/wartremover/sbt-wartremover_2.12_1.0/2.4.17/sbt-wartremover-2.4.17.jar by sbt.internal.PluginManagement$PluginClassLoader@853e7c98).
[error] Use 'last' for the full log.
Project loading failed: (r)etry, (q)uit, (l)ast, or (i)gnore? 
```


## What we know

These are the known details:

1. There seems to be a binary-incompatibility problem with our project dependencies ([ref](https://docs.scala-lang.org/overviews/core/binary-compatibility-for-library-authors.html)).
2. The error message suggests you to run `sbt evicted` which is impossible because sbt refuses to load.
3. The error mentions `sbt-wartremover`, hence, the problem is about the sbt plugings, removing the plugin will likely get rid of the problem.


## How to approach this

While this is likely well-known to people very familiar with sbt, it wasn't for me:

1. Let's update `project/plugins.sbt` to include this line `enablePlugins(SbtPlugin)`
2. Go to the `project` directory and run `sbt evicted`

Now, you get the dependency issues diplayed, like:

```
[warn] Found version conflict(s) in library dependencies; some are suspected to be binary incompatible:
[warn] 	* net.java.dev.jna:jna:5.6.0 is selected over {4.5.0, 4.5.0}
[warn] 	    +- io.methvin:directory-watcher:0.10.1                (depends on 5.6.0)
[warn] 	    +- org.scala-sbt:io_2.12:1.2.2                        (depends on 4.5.0)
[warn] 	    +- net.java.dev.jna:jna-platform:4.5.0                (depends on 4.5.0)
[warn] 	* org.scala-lang.modules:scala-xml_2.12:1.3.0 is selected over {1.2.0, 1.1.1, 1.0.6}
[warn] 	    +- org.scoverage:scalac-scoverage-plugin_2.12.14:1.4.8 (depends on 1.3.0)
[warn] 	    +- org.scala-lang:scala-compiler:2.12.14              (depends on 1.0.6)
[warn] 	    +- com.typesafe.sbt:sbt-native-packager:1.7.2 (sbtVersion=1.0, scalaVersion=2.12) (depends on 1.1.1)
[warn] 	    +- com.typesafe.play:twirl-api_2.12:1.5.0             (depends on 1.2.0)
[warn] 	* org.webjars:webjars-locator-core:0.36 is selected over 0.32
[warn] 	    +- com.typesafe.sbt:sbt-web:1.4.4 (scalaVersion=2.12, sbtVersion=1.0) (depends on 0.36)
[warn] 	    +- com.typesafe:npm_2.12:1.2.1                        (depends on 0.32)
[warn] 	* org.eclipse.jgit:org.eclipse.jgit:5.12.0.202106070339-r is selected over 4.9.0.201710071750-r
[warn] 	    +- org.scoverage:sbt-coveralls:1.3.1 (sbtVersion=1.0, scalaVersion=2.12) (depends on 5.12.0.202106070339-r)
[warn] 	    +- com.typesafe.sbt:sbt-git:1.0.0 (sbtVersion=1.0, scalaVersion=2.12) (depends on 4.9.0.201710071750-r)
```

Apparently, there is no binary-incompatibility between the dependencies.

The problem was introduced when adding the `sbt-wartremover` plugin but nothing related shows up in the evicted dependencies.

In my case, it turned out that the `sbt-wartremover` plugin I depended on required a newer sbt version while my project had sbt 1.3.


## Conclusion
Long time ago, I experienced a similar problem which involved binary-incompatibility and I had to ask the community for help, after some years, I got into this again which motivated me write about this.

This is one non-obvious issue which can be very confusing unless you have been in Scala for a while.
