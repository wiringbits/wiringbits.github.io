---
title: "Using an HTTP proxy on Play Framework's WSClient"
description: "How to use HTTP proxies with Play Framework's WSClient without polluting the global scope with custom authenticators."
pubDate: "2021-01-10"
heroImage: ../../assets/posts/using-http-proxy/post_photo.jpg
categories: ["scala"]
permalink: "scala/2021/01/11/using-an-http-proxy-on-playframework-wsclient.html"
---

If you ever had the need to use http proxies from your JVM-based apps, you likely faced the pain involved with the Java [Authenticator](https://docs.oracle.com/javase/8/docs/api/java/net/Authenticator.html). Gladly, [Play Framework's WSClient](https://www.playframework.com/documentation/2.8.x/ScalaWS) has a cleaner way/

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
