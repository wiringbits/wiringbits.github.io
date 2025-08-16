---
title: "Reading fingerprints from devices on webapps"
description: "Have you ever wondered how can you read a fingerprint from a device on a web app? A practical guide to implementing fingerprint reading in web applications."
pubDate: "2020-03-20"
heroImage: ../../assets/posts/reading-fingerprint/post_photo.png
categories: ["wiringbits"]
permalink: "wiringbits/2020/03/20/reading-fingerprints-from-devices-on-webapps.html"
---

Have you ever wondered how can you read a fingerprint from a device on a web app? If you are an experienced engineer, you may think it's obvious, but long time ago, it wasn't obvious to me that I ended up asking on [stackoverflow](https://stackoverflow.com/questions/25511693/how-to-capture-fingerprint-using-html-and-verifinger), and based on my experience, I wasn't alone.

The problem is that for security reasons, web browsers aren't allowed to access peripheral devices, which include USB devices (at least that was the true for a long time), back then, the options were the following:

- Use an embedded privileged app on the webpage (like applets running on Java, or ActiveX, etc), this app can captures the fingerprint and sends it to the JavaScript code running on the website.
- Use local http server that reads the fingerprint, which means that the webapp talks to its own server and the local server that actually connects to the fingerprint reader.

Right now, we have the option to [WebUSB](https://en.wikipedia.org/wiki/WebUSB) which is supported by [Chrome](https://developers.google.com/web/updates/2016/03/access-usb-devices-on-the-web) but sadly, I haven't seen any fingerprint SDK supporting this protocol, and applets and other privileged apps don't work on current browsers anymore, so, we are back to expose a local http server.

A year ago (2019), we were required to do such a similar task, and one of junior developers was able to create a decent PoC that we are able to share with the world, check it out on our [Github](https://github.com/wiringbits/fingerprint-reader-daemon).

The way to use this app, it's to run it locally on the users' computer, which allows your web app to read the fingerprint by asking the local server to do so.

Hopefully it can help anyone that's stuck on this common task.
