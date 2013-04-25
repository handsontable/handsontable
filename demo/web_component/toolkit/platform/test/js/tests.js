/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

htmlSuite('loader and build', function() {
  htmlTest('html/dev-loader.html');
  htmlTest('html/dev-loader-swizzled.html');
  htmlTest('html/production-loader.html');
  htmlTest('html/production-loader-forcepoly.html');
});

htmlSuite('integration', function() {
  htmlTest('html/web-components.html');
  htmlTest('html/smoke.html');
  htmlTest('html/smoke.html?shadow=polyfill');
  htmlTest('html/strawkit.html');
  htmlTest('html/strawkit.html?shadow=polyfill');
});