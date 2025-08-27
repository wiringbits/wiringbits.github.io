---
layout: post
title:  "CI Workflow: Test-Summary"
date: 2023-10-23 06:20:32 -0700
categories: github actions
post_photo: assets/posts/test-summary/testforest-dashboard-logo.png
permalink: /blog/:slug
---

While working with a lot of tests one of the most tedious things is looking at logs to find which test(s) failed in GitHub Actions workflow, there are many tests library that logs EVERY thing of the implementation (which it is ideal) but this causes that when one of them fails you have to scroll almost infinitely in every log and to have to pay attention to logs so that you don't miss it.

This sitution caused to the Wiringbits team to find for a solution for our projects and our open source [scala-webapp-template](https://github.com/wiringbits/scala-webapp-template) project, and we found a practical and easy to use solution: [TestForest Dashboard](https://github.com/marketplace/actions/testforest-dashboard).


## TestForest Dashboard

This is an action from GitHub Actions that we can implement to our Workflow that doesn't need to hard configure to start working with it.

TestForest uses [JUnit XML](https://github.com/testmoapp/junitxml) file format and TAP test output from tests libraries that we can find them when we run tests locally in our projects that uses this formats, in our case we use [ScalaTest](https://www.scalatest.org/) for testing that produces JUnit XML file formats.

We can customize the output to show it in the build summary, upload a file with tests fails, and even send messages to a service like Slack, check [TestForest Dashboard action page](https://github.com/marketplace/actions/testforest-dashboard) for more information and check [examples](https://github.com/test-summary/examples) using this Action.


## Implementation to scala-webapp-template

We have implemented this workflow to our [scala-webapp-template PR implementation](https://github.com/wiringbits/scala-webapp-template/pull/438) project, giving to us an easy way to access to the tests that had failed in just few clicks saving us a lot of time looking at the logs.

The implementation was easy to do, we just had to add to .yml workflow the next step:

```yml
- name: Test summary
  if: always() # Always run, even if previous steps failed
  uses: test-summary/action@v2
  with:
    paths: "**/target/test-reports/*.xml"
```

Since we depend in more than one project, we have to get ALL test-reports dirs, that's we our path is `**/target/test-reports/*.xml`:

1. `**` is to find at any dir, including subdirs
2. `*.xml` is for any file that has .xml extension
3. `/target/test-reports` is where ScalaTest saves test reports from testing

Summary result in GitHub Summary:

![scala-webapp-template test summary](/assets/posts/test-summary/workflow-summary.png)


## Conclusion

GitHub Actions workflows helps us and our team to automate tasks throughout the software development lifecycle, today we checked an Action that we must have to have in our projects [TestForest Dashboard](https://github.com/marketplace/actions/testforest-dashboard) to save time and avoid the tedious task to find a tests that fails in test CI workflow.
