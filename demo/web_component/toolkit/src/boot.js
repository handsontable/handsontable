/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

// add a notation about toolkit document modifications
document.write('<!-- begin Toolkit injections -->\n');

// mobile compatibility tags
// TODO(sjmiles): we probably cannot get away with forcing these in general
document.write('<!-- injected meta tags for mobile -->\n');
document.write('<meta name="apple-mobile-web-app-capable" content="yes">\n');
document.write('<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n');

// FOUC prevention tactic
document.write('<!-- injected FOUC prevention -->\n');
document.write('<style>body {opacity: 0;}</style>');

// done with write
document.write('<!-- end Toolkit injections -->\n');

window.addEventListener('WebComponentsReady', function() {
  document.body.style.webkitTransition = 'opacity 0.3s';
  document.body.style.opacity = 1;
});

})();
