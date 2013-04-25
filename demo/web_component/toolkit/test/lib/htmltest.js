/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

// if standalone
if (window.top === window) {
  // if standalone
  window.done = function() {
    var d = document.createElement('pre');
    d.style.cssText = 'padding: 6px; background-color: lightgreen;';
    d.textContent = 'Passed';
    document.body.insertBefore(d, document.body.firstChild);
  }
  window.onerror = function(x) {
    var d = document.createElement('pre');
    d.style.cssText = 'padding: 6px; background-color: #FFE0E0;';
    d.textContent = 'FAILED: ' + x;
    document.body.insertBefore(d, document.body.firstChild);
  };
} else
// if part of a test suite
{
  window.done = function() {
    parent.postMessage('ok', '*');
  }
  window.onerror = function(x) {
    parent.postMessage({error: x}, '*');
  };
}

