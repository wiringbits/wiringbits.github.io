---
layout: post
title:  "Using an HTTP proxy on Play Framework's WSClient"
date:   2021-01-10 20:35:32 -0700
categories: scala
post_photo: assets/posts/using-http-proxy/post_photo.jpg
---

If you ever had the need to use http proxies from your JVM-based apps, you likely faced the pain involed with the Java [Authenticator](https://docs.oracle.com/javase/8/docs/api/java/net/Authenticator.html). Gladly, [Play Framework's WSClient](https://www.playframework.com/documentation/2.8.x/ScalaWS) has a cleaner way/

Instead of polluting the global scope with custom authenticators, you just need to create an instance of `play.api.libs.ws.WSProxyServer`, which can be set to every request while using the `WSClient`, like this:

```scala
import play.api.libs.ws.{DefaultWSProxyServer, WSClient}

val proxy = DefaultWSProxyServer(
  host = "myserver.com", // no protocol on purpose
  port = 8000,
  principal = Some(username), // needed if basic-authentication is required
  password = Some(password), // needed if basic-authentication is required
  protocol = Some("https")
)

def f(ws: WSClient) = {
  ws.url("https://wiringbits.net").withProxyServer(proxy)
}
```

That's it, far simpler than dealing with the Java way.

The source code for this page can be found [here](https://github.com/wiringbits/wiringbits.github.io/blob/master/_posts/2021-01-10-using-an-http-proxy-on-playframework-wsclient.md).
