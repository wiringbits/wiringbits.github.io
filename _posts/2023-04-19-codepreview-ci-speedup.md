---
layout: post
title:  "Reducing our Scala CI workflow by half without changing any code"
date: 2023-04-19 12:35:32 -0700
categories: scala
post_photo: assets/posts/reducing-codepreview-runtime/post_photo.png
---

Keeping a short runtime for CI workflows is ideal, this posts details the results from an experiment we did to speed up our CI workflow for a Scala project integrated with [CodePreview](https://codepreview.io).

Instead of preparing a dummy project to run the experiments, we'll do everything on a real-world project - the [Scala-webapp-template](https://github.com/wiringbits/scala-webapp-template) - which is the base for many of the projects from our company.

This experiment aims to see how fast we can get without changing any code from the project, which is something that most Scala projects should be able to follow.


## Summary

For the impatient, this is a summary:

1. Our workflow is commonly taking 17 minutes to execute on a github-runner ([example](https://github.com/wiringbits/scala-webapp-template/actions/runs/4746225072/jobs/8429581801?pr=361)).
2. There are two obvious bottlenecks in our workflow, the `Compile` phase which is taking ~6 minutes, and, the [CodePreview](https://codepreview.io) step that's taking ~9 minutes. 
3. By optimizing the workflow with the github-runner, we were able to reduce the CI runtime to 15 minutes, where the `Compile` phase went down to only 2 minutes! The rest of the time is being spent on the [CodePreview](https://codepreview.io) phase (still ~8 minutes), the setup/post-setup actions taking the remaining ~3 minutes.
4. By setting up a self-hosted runner, we have been able to lower the compile phase to 1 minute! The complete workflow execution was lowered to 6 minutes (less than half comparing to the initial runtime).
5. For some reason, DigitalOcean droplets are outperforming AWS EC2 instances but the margin isn't that big.

The improvements are outstanding given the required effort to set this up.


## Context

The project's tech stack is:

1. Scala (backend).
2. Scala.js (frontend, requires node.js and scalablytyped).
3. Ansible (deployment scripts).
4. Github actions (the CI).
5. [setup-everything-scala](https://github.com/japgolly/setup-everything-scala) (a convenient action that setups jdk/scala/node + coursier cache).

In order to avoid doing repetitive actions multiple times, the CI workflow is composed by a single job that does everything (compile -> deploy preview).

The commit history is at this [PR](https://github.com/wiringbits/scala-webapp-template/pull/361) where you can see the iterative experiments described in this post.

For the purpose of this post, we're running the CI workflows with the existing coursier cache, this cache has most of the required JVM libraries already downloaded, this is because the `setup-everything-scala` action already includes this with no extra effort required from our side.


### CodePreview

[CodePreview](https://codepreview.io) is a service that launches a new preview environment with every Pull Request, including backend/frontend and its necessary dependencies, for the case of this project, we are deploying a Scala backend app + 2 Scala.js frontend apps, the only dependency is a Postgres database which is re-created on every deployment.

Different to other alternatives, [CodePreview](https://codepreview.io) does not use Kubernetes nor Docker, allowing its customers to pay a single price for unlimited users.


## Current CI process

These are the steps required to create create a preview environment ([execution flow](https://github.com/wiringbits/scala-webapp-template/actions/runs/4746225072/jobs/8429581801?pr=361)):

![Workflow 1](/assets/posts/codepreview-speedup-ci/workflow-01.png)

From here, we can see that the bottlenecks are the `Compile` phase and the CodePreview step.

Let's start by paying attention to the first bottleneck, the `Compile` phase which is taking ~6m minutes (with cached dependencies).

> [Referenced commit](https://github.com/wiringbits/scala-webapp-template/pull/361/commits/51800d9b329a63d3acc929a802a413eadff679aa)


## Github runner

Let's see how fast we can get by taking advantage of Github runners.


### Github runner - 1st try - Cache ScalablyTyped generated jars

ScalablyTyped is one of our more costly steps in our Scala.js modules, this is because we are depending on a few huge js libraries, by caching `~/.ivy2/local`, we cache the artifacts generated by ScalablyTyped, still, the huge `node_modules/` directory isn't cached by this ([execution flow](https://github.com/wiringbits/scala-webapp-template/actions/runs/4746800437/jobs/8430891404?pr=361)):

![Workflow 2](/assets/posts/codepreview-speedup-ci/workflow-02.png)

The `Compile` phase is still taking ~6m, there is no apparent improvement so far, let's run the workflow again to take advantage of the recently cached jars ([execution flow](https://github.com/wiringbits/scala-webapp-template/actions/runs/4746800437/jobs/8433912767)):

![Workflow 2](/assets/posts/codepreview-speedup-ci/workflow-02-b.png)

We finally start getting progress, the `Compile` phase has improved considerably, going from 6m18s to 3m39s.

> [Referenced commit](https://github.com/wiringbits/scala-webapp-template/pull/361/commits/e02fdc5b561ef148bfe6b829733ef993e50aa15c)




### Github runner - 2nd try - Cache **/target directory

In Scala, the `target/` directories include the compiled and the auto-generated code, think about this, when you pull code from a repository, `sbt` uses incremental compilation ,recompiling only the changed files ([execution flow](https://github.com/wiringbits/scala-webapp-template/actions/runs/4748121145/jobs/8434155950)):

![Workflow 3](/assets/posts/codepreview-speedup-ci/workflow-03.png)

The compile time has been reduced from 6m18s to 2m19s!

Let's run the same workflow again, this time, `Compile` phase took 2m04s, a very similar result ([execution flow](https://github.com/wiringbits/scala-webapp-template/actions/runs/4748121145/jobs/8435191755)):

![Workflow 3-b](/assets/posts/codepreview-speedup-ci/workflow-03-b.png)


> [Referenced commit](https://github.com/wiringbits/scala-webapp-template/pull/361/commits/259ad225fe9a88abfbd139654df56e1847e6d8b2)



### Github runner summary

We have been able to speed-up one of the slowest CI steps from ~6 minutes to only ~2 minutes! This is a considerable improvement, and, you can easily take advantage of this for any other Scala project.


## Self-hosted runner

From now, we'll see how fast we can get the CodePreview step, the `Compile` phase will likely get affected but it isn't a bottleneck anymore.

Github-actions provides VMs with 4 cpu's and 8G memory ([ref](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)).

We can get the runtime faster by increasing the CI resources, which requires a [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners), in this case, our budget would define how fast we can get.

The self-hosted runner can also help on reducing the overall runtime by pre-installing the necessary tools to our VM, for example:

1. `Install ansible` takes ~30s.
2. `Cache action` takes ~30s.
3. `Setup Scala` takes ~50s.
4. Extra steps requiring a few seconds, take ~30s.


This means that we could reduce most steps to negligible times, having two steps to improve:

1. `Compile` phase taking ~2m.
2. `Create preview env` taking ~8m.


### Self-hosted runner - 1st try

Let's create a `t2.large` VM from AWS, configured with all dependencies to complete the CodePreview workflow + set it up as a self-hosted runner at Github. I have selected this instance because it is the most similar to the VM provided by Github.

![custom-runner-aws-instance-01](/assets/posts/codepreview-speedup-ci/custom-runner-aws-instance-01.png)

Run the CI workflow a few times to take advantage of the cache ([workflow execution](https://github.com/wiringbits/scala-webapp-template/actions/runs/4749504380/jobs/8437184898)):

![self-hosted-workflow-1](/assets/posts/codepreview-speedup-ci/self-hosted-workflow-01.png)

The results are amazing! Almost all steps take a negligible time now, the only slow step is the CodePreview one which is mostly composed by Ansible scripts:

1. `Compile` phase is now taking only ~20 seconds!
2. CodePreview step is still taking ~7 minutes, a minor improvement from previous tries.
3. The whole workflow is taking ~8 minutes which is half than how we started.

At this stage, increasing the self-hosted runner resources seems to be the only way to go from now.


> [Referenced commit](https://github.com/wiringbits/scala-webapp-template/pull/361/commits/da440913932f24371fc20a271e553249090f6a3c)






### Self-hosted runner - 2nd try

Let's increase the resources, we'll follow the same steps than the 1st try but use a `t2.xlarge` VM from AWS:

![custom-runner-aws-instance-2](/assets/posts/codepreview-speedup-ci/custom-runner-aws-instance-02.png)


Unfortunately, we didn't get a noticeable improvement, `Compile` phase is still taking ~30 seconds and `CodePreview` step is taking slightly less than 7 minutes ([workflow execution](https://github.com/wiringbits/scala-webapp-template/actions/runs/4749504380/jobs/8437817337)):

![self-hosted-workflow-01](/assets/posts/codepreview-speedup-ci/self-hosted-workflow-02.png)




### Self-hosted runner - 3rd try

Let's increase the resources once more, we'll follow the same steps than the 1st try but use a `t2.2xlarge` VM from AWS:

![custom-runner-aws-instance-3](/assets/posts/codepreview-speedup-ci/custom-runner-aws-instance-03.png)

The `Compile` phase says the same while the `CodePreview` step is now running in 6 minutes, a decent improvement ([workflow execution](https://github.com/wiringbits/scala-webapp-template/actions/runs/4749504380/jobs/8438179826)):

![self-hosted-workflow-3](/assets/posts/codepreview-speedup-ci/self-hosted-workflow-03.png)


### Self-hosted runner - 4th try (DigitalOcean)

A few weeks ago, I have tried running this optimization with a self-hosted runner from a DigitalOcean Droplet, the overall runtime got as low as 6 minutes which I find very reasonable given that the workflow involves a lot of expensive steps:

![custom-runner-digitalocean](/assets/posts/codepreview-speedup-ci/custom-runner-digitalocean.png)


**NOTE**: Unfortunately, DigitalOcean is facing an incident right now which has prevented me from creating such a Droplet, given that my workflow was executed in a private repository, I can't share access to it.


## Further optimizations

This post has covered the [CodePreview](https://codepreview.io) step which is now the bottleneck, there are some ways to optimize this out:

1. Given that the job startup/cleanup times are negligible, we can create many jobs to deploy all the apps in parallel (backend/web/admin), my hypothesis is that we can get the step to run in half of its time (3 minutes), which would be an outstanding result but I'm yet to try this out.
2. We could use `fastLinkJS` instead of `fullLinkJS` to save 1 or 2 minutes while deploying the Scala.js apps, given that there are 2 apps, the saved time could be wort it, even better if combined with concurrent deploys.
3. The Ansible scripts haven't been optimized, we can likely save some seconds from this, still, the gains won't likely be as much as running the deployments concurrently.
4. The Ansible scripts execution time also depend on the server hosting the previews, increasing those resources would likely make the workflow faster, reducing a few extra seconds.


## Conclusion

If your CI process involves only compiling the code without running any tests, you can easily get the runtime to 1 minute, which is amazing! Even including a step to prepare a production build would slow this down to less than 2 minutes (yes, there are companies having projects with no automated tests at all):

![custom-runner-compile-only](/assets/posts/codepreview-speedup-ci/custom-runner-compile-only.png)

In another post, I'll explore how to optimize a different workflow that executes many integration tests, such a workflow is [28 minutes](https://github.com/wiringbits/scala-webapp-template/actions/runs/4721411680/jobs/8374651178). I wonder how much we can improve this, I have the feeling that we could get this to execute in less than 10 minutes without much effort.

What alternative approaches have you taken? and, what have been your results?