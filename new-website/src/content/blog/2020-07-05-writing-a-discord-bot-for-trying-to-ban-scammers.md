---
title: "Writing a Discord bot for trying to ban scammers"
description: "Building a Discord bot to detect and ban scammers who impersonate team members using similar usernames with invisible characters and unicode tricks."
pubDate: "2020-07-05"
heroImage: ../../assets/posts/writing-discord-bot/post_photo.jpg
categories: ["wiringbits"]
permalink: "wiringbits/2020/07/06/writing-a-discord-bot-for-trying-to-ban-scammers.html"
---

One of the projects we are involved in is a cryptocurrency, we contribute mostly to the ecosystem around it, like maintaining it's [Block Explorer](https://xsnexplorer.io), as well as the services behind it's [Decentralized Exchange](https://link.medium.com/aSEA6vMyj7).

As most cryptocurrencies, it has a [Discord](https://discord.com/) community, and as most communities, we have to deal with spam frequently, gladly, there are already several bots to help on that problem.

Sadly, we frequently face scams, scammers join our community setting usernames (or nicknames) to be very similar to the ones from the official team members, so that they can impersonate official members, then, keep contacting legitimate users until finding someone willing to trust the scammer.

Some examples for this is using non-printable/invisible characters or unicode characters that look like normal characters.

For example, use `Ctrl+F` to look for `AlexITC` on this text, it won't highlight `AlexㅤITC` because it's using an invisible character.

I got the feeling that writing a bot to ban such scammers shouldn't take much time, hence, I did it, this post is all about it.

I must admit that I thought it was a task for half a day but I likely ended up investing around 10 hours to get it working mostly due to being new to the Discord APIs, with a couple extra hours to get the code cleaner to open source it.


## Try it

Just go to the [discord-scammer-detector-bot](https://github.com/wiringbits/discord-scammer-detector-bot) project, and follow the instructions to get the Bot running.

You still need to create a [Discord app](https://discord.com/developers/applications), transform it to a bot, and set the token on the project.

Then, install the bot on your discord server, just go to `https://discord.com/oauth2/authorize?client_id=[YOUR-CLIENT-ID]&scope=bot` after setting your application's client id.

And that's it!

If you like to get it deployed to a server, there is an ansible script to get it ready with a single command, just follow the proper [instructions](https://github.com/wiringbits/discord-scammer-detector-bot/tree/master/infra/deployment).



## How it works

Most of the work requires being able to interact with the Discord server, in this case I gave a try to the [AckCord](https://github.com/Katrix/AckCord) library, mostly because it's written in Scala, which is the language i used to write the bot, until now, it has worked without problems.

Besides the integration with Discord, the core problem is how to measure the similarity between two strings, for what I took the [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance), gladly, apache-commons has a good [implementation](https://commons.apache.org/sandbox/commons-text/jacoco/org.apache.commons.text.similarity/LevenshteinDistance.java.html).

In summary, given two strings, the algorithm computes the minimum number of changes (insert/delete/replace) to convert one string into the other one, for example `distance("AlexITC", "AlexITC.")` returns `1`.

Now, just define how strict the scammer detector should be (higher number means it's more strict), in my case I use `2` which should be good to catch simple attempts without bothering legitimate users.

But, that's not enough, because the scammer can just use more than 2 invisible characters to bypass this rule, in order to avoid this, we can normalize the strings to use ASCII characters only, which is tricky and I'll likely continue updating the approach for a while.

I plan to keep polishing the detection rules for a while, for now, instead of kicking users out, potential scammers get posted in a channel to let the admins handle it manually, eventually, the bot should get good enough to kick them out.


## Future

There are lots of possibilities to improve this bot, the time will tell what gets implemented, for example:

- Ban potential scammers automatically
- Detect team members from the discord servers instead of requiring the members to be placed in the config file.
- Analyze existing members when the bot gets installed.
- Improve the string normalization mechanism.
- Support more Discord servers dynamically instead of requiring them to be in enabled in the config file.

Hopefully this will reduce the number of scams on our community, and even better, in other communities too.

### Discussions:

- [Hackernews](https://news.ycombinator.com/item?id=23747592)
