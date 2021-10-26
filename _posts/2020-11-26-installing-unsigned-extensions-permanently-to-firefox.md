---
layout: post
title:  "Installing unsigned extensions permanently to Firefox"
date:   2020-11-26 20:35:32 -0700
categories: browser-extensions
post_photo: /assets/slack.jpg
---

If you have worked with browser extension on Firefox, you likely go to `about:debugging` for installing the extensions temporary, while useful for development, the extension gets removed once Firefox restarts.

Sometimes you may need to test how the extension behaves when Firefox starts, or, just want to leave your extension installed without signing it with the Developer Hub.


## Summary

Gladly, there is a simple solution:
1. Update your extension manifest to include custom `browser_specific_settings`.
2. Disable signature checks while installing extensions.
3. Package your extension as a zip file.
4. Install the extension.
5. Enable signature checks while installing extensions.


### Step 1
Update your `manifest.json` to include a new key, the `id` could be any email:

```json
"browser_specific_settings": {
  "gecko": {
    "id": "test@gmail.com"
  }
}
```

### Step 2
Go to `about:config`, change `xpinstall.signatures.required` to `false`.

### Step 3
Simply run `zip -r -FS ../my-extension.zip * --exclude '*.git*'`.

### Step 4
Go to `about:addons`, and choose the `Install Add-on from file` option, choose the zip file created in the previous step.

### Step 5
Go to `about:config`, change `xpinstall.signatures.required` to `true`.

That's it, you have installed an unsigned extension permanently.

The source code for this page can be found [here](https://github.com/wiringbits/wiringbits.github.io/blob/master/_posts/2020-11-26-installing-unsigned-extensions-permanently-to-firefox.md).
