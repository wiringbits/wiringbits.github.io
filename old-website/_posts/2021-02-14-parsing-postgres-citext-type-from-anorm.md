---
layout: post
title:  "Parsing postgres citext type from anorm"
date:   2021-02-14 12:35:32 -0700
categories: scala
post_photo: assets/posts/parsing-postgres-citext/post_photo.jpg
---

When working with Play Framework, using [anorm](https://playframework.github.io/anorm/) for the database layer is a common choice, while its a pretty handy library, it doesn't support lots of custom postgres features, like parsing results that use the [citext extension](https://www.postgresql.org/docs/current/citext.html). This post shows how to parse such `CITEXT` types.

In summary, we need to create a custom column mapper that transforms a `PGobject` to a `String` when the object type is `citext`, which avoids the `TypeDoesNotMatch` error that is thrown when you try to parse a `citext` column to a `String`.

## The citext column mapper

This is a way to define the citext column mapper, which needs to be referenced any time you are parsing a `citext` column:

```scala
object CommonParsers {
  import anorm.{Column, MetaDataItem, TypeDoesNotMatch}
  import org.postgresql.util.PGobject

  val citextToString: Column[String] = Column.nonNull {
    case (value, meta) =>
      val MetaDataItem(qualified, _, clazz) = meta
      value match {
        case str: String => Right(str)
        case obj: PGobject if "citext" equalsIgnoreCase obj.getType => Right(obj.getValue)
        case _ =>
          Left(
            TypeDoesNotMatch(
              s"Cannot convert $value: ${value.asInstanceOf[AnyRef].getClass} to String for column $qualified, class = $clazz"
            )
          )
      }
  }
}
```

## Usage

To ilustrate the usage, let's define a simple table that uses the `citext` type:

```sql
CREATE EXTENSION IF NOT EXISTS CITEXT;

CREATE TABLE users(
  user_id UUID NOT NULL,
  email CITEXT NOT NULL,
  CONSTRAINT users_id_pk PRIMARY KEY (user_id),
);
```

Proceed to write the query:

```scala
object UsersDAO {
  import anorm._

  private val parser = SqlParser.str("email")(CommonParsers.citextToString))

  def getEmails(implicit conn: Connection): List[String] = {
    SQL"""SELECT email FROM users """.as(parser.*)
  }
}
```

## More
The astute reader has noticed that our `citextToString` mapper knows how to deal with the `String` type, which allows to define it as a implicit value, which means that if all your parsers have that mapper in scope, you won't even need to specify when you are expecting a `citext` type.
