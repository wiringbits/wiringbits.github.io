---
layout: post
title:  "Gaining access to inherited AWS EC2 instances"
date:   2022-09-01 12:35:32 -0700
categories: aws
post_photo: assets/posts/gaining-access-to-inherited-aws-ec2-instances/post_photo.jpg
---

We have worked in many inherited projects, most of the times, we are lucky enough to get the previous team to share the access to us, still, sometimes we need to figure everything out, in this post, I'll briefly describe how we gained access to an inherited EC2 instance.

## Summary

You will require to get access to a privileged AWS account, then, when none of the options from `Connect to instance` work for you.

You can leverage the instance [user data](https://aws.amazon.com/premiumsupport/knowledge-center/execute-user-data-ec2) to execute a script when the instance starts, such a script is executed with `root` user, meaning that you can do anything you like.

In this case, use the script to register your own ssh public key so that you are able to ssh into the instance.

## Details

By following the official [docs](https://aws.amazon.com/premiumsupport/knowledge-center/execute-user-data-ec2/), you can easily come up with a script that authorizes your own ssh key to log into the instance, for example, the last piece in the following snippet could be updated to authorize your ssh public key:

```shell
Content-Type: multipart/mixed; boundary="//"
MIME-Version: 1.0

--//
Content-Type: text/cloud-config; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="cloud-config.txt"

#cloud-config
cloud_final_modules:
- [scripts-user, always]

--//
Content-Type: text/x-shellscript; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="userdata.txt"

#!/bin/bash
/bin/echo "ssh-rsa ......." >> ~/.ssh/authorized_keys
--//--
```

Then, follow the process to put such user data into the inherited instance, it is mostly stopping the instance -> editing user data -> starting the instance.

Once the instance start, you could ssh into the instance.

Be aware that the process could get more complex if the instance prevents root login over ssh but you can tweak the script to enable that.

## Conclusion

It can be scary to not have access to an inherited server, still, most cloud providers have reasonable alternatives to recover such an access.
