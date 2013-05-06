UNOFFICIAL GITHUB BUTTONS
=========================

Showcase your GitHub (repo's) success with these three simple, static buttons featuring dynamic watch, fork and follower counts and a link to your GitHub repo or profile page.

To get started, checkout http://ghbtns.com!



Usage
-----

These buttons are hosted via GitHub Pages, meaning all you need to do is include an iframe and you're set. Once included, you can configure it with various options. Here's the include:

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=USERNAME&repo=REPONAME&type=BUTTONTYPE"
  allowtransparency="true" frameborder="0" scrolling="0" width="62" height="20"></iframe>
```

### Requirements

`user`<br>
GitHub username that owns the repo<br>

`repo`<br>
GitHub repository to pull the forks and watchers counts

`type`<br>
Type of button to show: `watch`, `fork`, or `follow`

### Optional

`count`<br>
Show the optional watchers or forks count: *none* by default or `true`

`size`<br>
Optional flag for using a larger button: *none* by default or `large`



Examples
--------

**Basic Watch button**

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=markdotto&repo=github-buttons&type=watch"
  allowtransparency="true" frameborder="0" scrolling="0" width="62" height="20"></iframe>
```

**Basic Fork button**

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=markdotto&repo=github-buttons&type=fork"
  allowtransparency="true" frameborder="0" scrolling="0" width="53" height="20"></iframe>
```

**Basic Follow button**

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=markdotto&type=follow"
  allowtransparency="true" frameborder="0" scrolling="0" width="132" height="20"></iframe>
```

**Watch with count**

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=markdotto&repo=github-buttons&type=watch&count=true"
  allowtransparency="true" frameborder="0" scrolling="0" width="110" height="20"></iframe>
```

**Fork with count**

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=markdotto&repo=github-buttons&type=fork&count=true"
  allowtransparency="true" frameborder="0" scrolling="0" width="95" height="20"></iframe>
```

**Follow with count**

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=markdotto&type=follow&count=true"
  allowtransparency="true" frameborder="0" scrolling="0" width="165" height="20"></iframe>
```

**Large Watch button with count**

``` html
<iframe src="http://ghbtns.com/github-btn.html?user=markdotto&repo=github-buttons&type=watch&count=true&size=large"
  allowtransparency="true" frameborder="0" scrolling="0" width="170" height="30"></iframe>
```

Limitations
-----------

For the first version, functionality is limited and some concessions were made:

- Width and height must be specificed for all buttons (which actually adds some control for those with OCD like myself).
- All attributes must be passed through via URL parameters.
- CSS and javascript are all included in the same HTML file to reduce complexity and requests.

**Usage with SSL**

In order to avoid `insecure content` warnings when using GitHub Buttons on a page behind an SSL certificate, simply host a copy of the `github-btn.html` file on your secure directory and substitute your domain in the iframe include: 

``` html
<iframe src="https://YOURDOMAIN.com/github-btn.html?user=USERNAME&repo=REPONAME&type=BUTTONTYPE"
  allowtransparency="true" frameborder="0" scrolling="0" width="62" height="20"></iframe>
```

More refinement and functionalty is planned with open-sourcing--any help is always appreciated!



Bug tracker
-----------

Have a bug? Please create an issue here on GitHub at https://github.com/mdo/github-buttons/issues.



Twitter account
---------------

Keep up to date on announcements and more by following Mark on Twitter, <a href="http://twitter.com/mdo">@mdo</a>.



Authors
-------

**Mark Otto**

+ http://twitter.com/mdo
+ http://github.com/mdo



Copyright and license
---------------------

Copyright 2011 Mark Otto.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this work except in compliance with the License.
You may obtain a copy of the License in the LICENSE file, or at:

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
