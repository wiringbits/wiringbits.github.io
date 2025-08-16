---
title: "Verifying signed requests in Play Framework | examples for Stripe/Slack/Github"
description: "How to verify signed requests in Play Framework with practical examples for Stripe, Slack, and Github webhook integrations."
pubDate: "2021-05-01"
heroImage: ../../assets/posts/verify-signed-request/post_photo.png
categories: ["scala", "playframework"]
permalink: "scala/playframework/2021/05/01/verifying-signed-requests-in-play-framework-examples-for-stripe-slack-github.html"
---

Verifying a signed request is a common task when you work with services that require a webhook integration, this post covers how to do that with Play Framework, with examples for some polular services, Github, Stripe, and Slack.

Before going to the code, its worth reading [How (not) to sign a JSON object](https://latacora.micro.blog/2019/07/24/how-not-to.html), which should give you an understanding of the problem's complexity.


## Summary
In simple terms, you should avoid any custom request parser in your controller, and read the bytes as they were sent, because the signature won't match if you let play parse the request into any data type other than bytes (let it be `AnyContent`/`JsValue`/etc).


## Show me the code
Let's go to the code examples, while every service uses a slightly different mechanism, at the end, what matters is to not alter the request by parsing the bytes.

### Stripe
The Stripe case is pretty simple thanks to their [Java SDK](https://github.com/stripe/stripe-java):

```scala
  def stripeWebhook() = Action.async(parse.byteString) { request =>
    import com.stripe.net.Webhook
    val rawRequest = request.body.toArray
    val payload = new String(rawRequest, "UTF-8")
    val sigHeaderMaybe = request.headers.get("Stripe-Signature")
    sigHeaderMaybe match {
      case Some(signature) =>
        Future { Webhook.constructEvent(payload, signature, config.stripeWebhookSigningSecret) }
          .recover {
            case NonFatal(ex) =>
              logger.trace("Failed to process stripe webhook", ex)
              BadRequest("Invalid request")
          }

      case _ => Future.successful(BadRequest("Invalid request"))
    }
  }
```

Its worth adding that the `Webhook.constructEvent` call is an expensive CPU-operation that you are better running in a different execution context than the default one, also, this method needs to be linked to your routes file, like:

```
POST /webhooks/stripe controllers.WebhooksController.stripeWebhook()
```

### Slack
The Slack case is a bit more complex, because they don't provide a Java SDK for verifying the signature, but, it's not too hard to implement:

```scala
  def slackWebhook() = Action.async(parse.byteString) { request =>
    val rawRequest = request.body.toArray
    val payload = new String(rawRequest, "UTF-8")
    val timestampMaybe = request.headers.get("X-Slack-Request-Timestamp")
    val signatureMaybe = request.headers.get("X-Slack-Signature")

    (timestampMaybe, signatureMaybe) match {
      case (Some(timestamp), Some(signature)) =>
        val isValid = verifySlackSignature(timestamp, payload, signature, config.slackSigningSecret)
        if (isValid) {
          // Process the webhook
          Future.successful(Ok("OK"))
        } else {
          Future.successful(BadRequest("Invalid signature"))
        }

      case _ => Future.successful(BadRequest("Invalid request"))
    }
  }

  private def verifySlackSignature(timestamp: String, payload: String, signature: String, signingSecret: String): Boolean = {
    val baseString = s"v0:$timestamp:$payload"
    val expectedSignature = s"v0=${hmacSha256(baseString, signingSecret)}"
    signature == expectedSignature
  }

  private def hmacSha256(data: String, key: String): String = {
    import javax.crypto.Mac
    import javax.crypto.spec.SecretKeySpec
    import java.nio.charset.StandardCharsets

    val mac = Mac.getInstance("HmacSHA256")
    val secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256")
    mac.init(secretKeySpec)
    val hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8))
    hash.map("%02x".format(_)).mkString
  }
```

### Github
The Github case is similar to Slack, but they use a different header and algorithm:

```scala
  def githubWebhook() = Action.async(parse.byteString) { request =>
    val rawRequest = request.body.toArray
    val payload = new String(rawRequest, "UTF-8")
    val signatureMaybe = request.headers.get("X-Hub-Signature-256")

    signatureMaybe match {
      case Some(signature) =>
        val isValid = verifyGithubSignature(payload, signature, config.githubWebhookSecret)
        if (isValid) {
          // Process the webhook
          Future.successful(Ok("OK"))
        } else {
          Future.successful(BadRequest("Invalid signature"))
        }

      case _ => Future.successful(BadRequest("Invalid request"))
    }
  }

  private def verifyGithubSignature(payload: String, signature: String, secret: String): Boolean = {
    val expectedSignature = s"sha256=${hmacSha256(payload, secret)}"
    signature == expectedSignature
  }
```

## More
If you are working with other services, the pattern is usually the same:
1. Read the request as bytes using `parse.byteString`
2. Get the signature from the headers
3. Compute the expected signature using the service's algorithm
4. Compare the signatures

Remember to always use a constant-time comparison for the signatures to avoid timing attacks, though for simplicity, the examples above use simple string comparison.

## Conclusion
Verifying signed requests is crucial for webhook security. The key is to read the raw bytes and avoid any parsing that might alter the request body before signature verification.
