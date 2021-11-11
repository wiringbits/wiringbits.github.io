---
layout: post
title:  "Run Chrome with your own ssh proxy"
date:   2021-11-10 19:35:32 -0700
categories: wiringbits
post_photo: assets/posts/proxied-chrome/post_photo.jpg
---

One of the project we have worked with required us to deal with 3rd-party services that could be accessed only from the US, given that we are based in Mexico, which can be problematic.

This short post explains the workaround we used to overcome that issue.

## Summary

In short:
- Let's take any VPS where you have ssh access to, this VPS will be used to send all the chrome traffic to internet (just like if Chrome was running in the VPS): `ssh -nNT -D 2000 user@ipaddress`
- Launch Chrome with a custom profile that uses the socks proxy: `/usr/bin/google-chrome --user-data-dir="$HOME/chrome-proxy-profile" --proxy-server="socks5://localhost:2000"`

## Details

The way I do this is by defining an alias for each command, which makes it simpler to laucn the proxied chrome, editing either `~/.bashrc`/`~/.zshrc` or a file loaded when your shell starts, including these lines is enough:

```bash
alias run-proxy='ssh -nNT -D 2000 user@ipaddress'
alias proxied-chrome='/usr/bin/google-chrome --user-data-dir="$HOME/chrome-proxy-profile" --proxy-server="socks5://localhost:2000"'
```

Then, open a terminal to invoke `run-proxy`, and then, open another terminal to invoke `proxied-chrome`.

`run-proxy` opens a socks5 proxy in `localhost:2000`, while `proxied-chrome` creates a new chrome session with a specific directory for storing the chrome data, which is handy to separate the work done for a specific project.


## More

If you don't have any server to use as a proxy, [vultr](https://www.vultr.com) has servers starting from $2.50 and the [AWS free tier](https://aws.amazon.com/free/) includes EC2 instances that are enough.
