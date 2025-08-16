---
layout: post
title:  "Installing unsigned extensions permanently to Firefox Developer edition"
date:   2020-11-26 20:35:32 -0700
categories: browser-extensions
post_photo: assets/posts/install-unsigned-ext-firefox/post_photo.jpg
---

If you have worked with browser extension on Firefox, you likely go to `about:debugging` for installing the extensions temporary, while useful for development, the extension gets removed once Firefox restarts.

Sometimes you may need to test how the extension behaves when Firefox starts, or, just want to leave your extension installed without signing it with the Developer Hub.

**UPDATE 2023/Aug/11**: Unfortunately, this post seems obsolete now, while the approach worked in 2020, it does not work anymore for Firefox Release edition (the one most people use), you can see [Tomáš](https://github.com/TomasHubelbauer) research in a Github [thread](https://github.com/wiringbits/wiringbits.github.io/pull/38).

## Summary

Gladly, there is a simple solution if you are using Firefox Developer or the ESR build:
1. Update your extension manifest to include custom `browser_specific_settings`.
2. Disable signature checks while installing extensions.
3. Package your extension as a zip file.
4. Install the extension.
5. Enable signature checks while installing extensions.

Learn more at https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox.

**Note that it is not possible to configure `xpinstall.signatures.required` in Firefox Release!**
These steps will not work for you if you are using the stable version of Firefox.

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
