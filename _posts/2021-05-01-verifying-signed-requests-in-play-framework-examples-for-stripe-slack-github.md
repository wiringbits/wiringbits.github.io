---
layout: post
title:  "Verifying signed requests in Play Framework | examples for Stripe/Slack/Github"
date:   2021-05-01 09:35:32 -0700
categories: scala playframework
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
Depending on how you integrate with slack, you may need to handle Slack requests in many urls, this is one example on how to verify that those requests came from Slack.

```scala
  def isSlackSignatureValid(timestamp: String, body: String, slackSignature: String): Boolean = {
    import javax.crypto.Mac
    import javax.crypto.spec.SecretKeySpec
    import javax.xml.bind.DatatypeConverter

    val secret = new SecretKeySpec(config.slackSigningSecret.getBytes, "HmacSHA256")
    val payload = s"v0:$timestamp:$body"

    val mac = Mac.getInstance("HmacSHA256")
    mac.init(secret)

    val signatureBytes = mac.doFinal(payload.getBytes)
    val expectedSignature = s"v0=${DatatypeConverter.printHexBinary(signatureBytes).toLowerCase}"
    slackSignature == expectedSignature
  }

  def slackRequest() = Action.async(parse.byteString) { request =>
    val timestampOpt = request.headers.get("X-Slack-Request-Timestamp")
    val signatureOpt = request.headers.get("X-Slack-Signature")

    (timestampOpt, signatureOpt) match {
      case (Some(timestamp), Some(signature)) =>
        Future {
          val valid = isSlackSignatureValid(timestamp, new String(request.body.toArray, "UTF-8"), signature)
          logger.debug(s"Request accepted: $valid")
          if (valid) {
            val body = FormUrlEncodedParser.parse(new String(request.body.toArray))
            // let's do something with the request body
            Ok("")
          } else {
            Forbidden
          }
        }

      case (None, _) =>
        logger.debug("Rejecting request without timestamp")
        Future.successful(Forbidden)

      case (_, None) =>
        logger.debug("Rejecting request without signature")
        Future.successful(Forbidden)
    }
  }
```

First, the `isSlackSignatureValid` function is defined, and then, such function is invoked with the request body parsed from the raw bytes.

The same points from Stripe apply, getting the request as bytes is what matters the most, also, run the signature verification in a custom execution context.

At last, its worth adding that `DatatypeConverter` is used for simplicity but such class doesn't exist in the newest Java versions.


### Github
Github uses a very similar approach to Slack, the main difference is that the request body is a JSON, and the usage of SHA1 instead of SHA256, but, overall, the trick is the same, parse the request as bytes:

```scala
  def doHMACSHA1(value: Array[Byte], secretKey: String): String = {
    import javax.crypto.Mac
    import javax.crypto.spec.SecretKeySpec
    import javax.xml.bind.DatatypeConverter
    val signingKey = new SecretKeySpec(secretKey.getBytes, "HmacSHA1")
    val mac = Mac.getInstance("HmacSHA1")
    mac.init(signingKey)
    val rawHmac = mac.doFinal(value)
    DatatypeConverter.printHexBinary(rawHmac)
  }

  def verifyGithubSignature(githubSecret: String, githubDigest: String, data: Array[Byte]): Unit = {
    val ourDigest = doHMACSHA1(data, githubSecret)
    if (ourDigest equalsIgnoreCase githubDigest) {
      ()
    } else {
      throw new RuntimeException(
        s"Invalid hmac from github, expected = $ourDigest, github = $githubDigest"
      )
    }
  }

  def githubHandler(): Action[ByteString] = Action.async(parse.byteString) { implicit request =>
    val rawRequest = request.body.toArray

    val signature = request.headers
      .get("HTTP_X_HUB_SIGNATURE")
      .getOrElse("sha1=")
      .split("=")
      .lift(1)
      .getOrElse("")
    
    for {
      _ <- Future {
        verifyGithubSignature(
          githubSecret = config.githubSecret,
          githubDigest = signature,
          data = rawRequest
        )
      }

      // We trust that github sent the request because the signature matches, so, we must get JSON
      json = Json.parse(rawRequest)
      githubEvent = request.headers.get("X-GitHub-Event")
    } yield Ok("")
  }
```

Of course, the same remarks from Stripe/Slack apply.

## More
By now, you should understand that the key point while verifying a signed request is to get the same data that was sent to you, which is simpler when parsing the request as bytes.

The source code for this page can be found [here](https://github.com/wiringbits/wiringbits.github.io/blob/master/_posts/2021-05-01-verifying-signed-requests-in-play-framework-examples-for-stripe-slack-github.md).
