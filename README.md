# Run

To run locally execute `bundle install` and then `bundle exec jekyll serve` 

It is recommended to use [rbenv](https://github.com/rbenv/rbenv) which picks the right Ruby version automatically.

Linux:
The fastest way is to get ruby 3.x
```sh
sudo apt-get install ruby-full ruby-bundler
echo 'export GEM_HOME=$HOME/.gem' >> $HOME/.bashrc
```


### Floating logo

To add the minified logo branding to a wirinbits network site add the following html to the head section

```html
  <!-- loads Erbaum font  -->
  <link rel="stylesheet" href="https://use.typekit.net/hhf5syi.css">
  <!-- loads floatingLogo -->
  <script src="https://wiringbits.net/assets/floatingLogo/main.js"
    data-img_src="https://wiringbits.net/assets/branding/wiringbits-logo-mark-full-color-rgb.svg"
    data-font_fam="erbaum"
    data-tip="Powered by Wiringbits"
    data-website="https://wiringbits.net"
    data-utm_medium="referrer">
  </script>
```
