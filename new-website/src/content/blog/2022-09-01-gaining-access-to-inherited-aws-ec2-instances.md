---
title: "Gaining access to inherited AWS EC2 instances"
description: "How to gain access to inherited AWS EC2 instances using user data scripts when traditional connection methods don't work."
pubDate: "2022-09-01"
heroImage: ../../assets/posts/gaining-access-to-inherited-aws-ec2-instances/post_photo.jpg
categories: ["aws"]
permalink: "aws/2022/09/01/gaining-access-to-inherited-aws-ec2-instances.html"
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

## More

This approach works because:
- User data scripts run as root during instance startup
- You can modify SSH authorized keys to grant yourself access
- The instance doesn't need to be running when you modify the user data

Remember to:
- Stop the instance before modifying user data
- Replace the placeholder SSH key with your actual public key
- Start the instance after updating the user data
- Remove the user data script after gaining access for security
