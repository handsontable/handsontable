web-animations-js
=================

An emulator of the Web Animations specification

Installation instructions
========================

* git clone http://github.com/web-animations/web-animations-js
* cd web-animations-js
* git submodule init
* git submodule update

Running tests
============

* make sure that the testharness submodule is up-to-date (see installation instructions)
* python -m SimpleHTTPServer (from within web-animations-js directory)
* http://localhost:8000/test/test-runner.html (to auto-run tests) or http://localhost:8000/test/test-harness.html (to manually explore tests)

A note on prefix handling and experimental features
===================================================

In order to work in as many browsers as feasible, we have decided to take the following approach to prefix handling:
* the polyfill will automatically detect the correctly prefixed name to use when writing animated properties back to
  the platform.
* where possible, the polyfill will *only* accept unprefixed versions of experimental features. Hence, for example:

    <code>new Animation(elem, {"transform" : "translate(100px, 100px)"}, 2);</code>

  will work in all browsers that implement a conforming version of transform, but

    <code>new Animation(elem, {"-webkit-transform": "translate(100px, 100px)"}, 2);</code>
    
  will not work anywhere.
* when the polyfill requires features to implement functionality that is not inherently specified using those
  features (for example, calc is required in order to implement merging between lengths with different units) 
  then the polyfill will provide a console warning in browsers where these features are absent.
