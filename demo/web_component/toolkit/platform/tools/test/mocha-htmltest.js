/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {
  var thisFile = 'lib/mocha-htmltest.js';
  var base = '';

  mocha.htmlbase = function(htmlbase) {
    base = htmlbase;
  };

  (function() {
    var s$ = document.querySelectorAll('script[src]');
    Array.prototype.forEach.call(s$, function(s) {
      var src = s.getAttribute('src');
      var re = new RegExp(thisFile + '[^\\\\]*');
      var match = src.match(re);
      if (match) {
        base = src.slice(0, -match[0].length);
      }
    });
  })();

  var next, iframe;

  var listener = function(event) {
    if (event.data === 'ok') {
      next();
    } else if (event.data && event.data.error) {
      throw event.data.error;
    }
  };

  function htmlSetup() {
    window.addEventListener("message", listener);
    iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; left: -9000em; width:768px; height: 1024px';
    document.body.appendChild(iframe);
  }

  function htmlTeardown() {
    window.removeEventListener('message', listener);
    document.body.removeChild(iframe);
  }

  function htmlTest(src) {
    test(src, function(done) {
      next = done;
      var url = base + src;
      var delimiter = url.indexOf('?') < 0 ? '?' : '&';
      iframe.src = url + delimiter + Math.random();
    });
  };

  function htmlSuite(inName, inFn) {
    suite(inName, function() {
      setup(htmlSetup);
      teardown(htmlTeardown);
      inFn();
    });
  };

  window.htmlTest = htmlTest;
  window.htmlSuite = htmlSuite;
})();
