/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

scope = scope || {};

// imports

var componentLoader = scope.ComponentDocuments.loader.componentLoader;
var documentParser = scope.ComponentDocuments.parser;
var elementParser = scope.CustomDOMElements.elementParser;
var elementUpgrader = scope.CustomDOMElements.elementUpgrader;

// NOTE: uses 'window' and 'document' globals

// TODO(sorvell): add a timer that's inspectable after the fact
// this is helpful for testing on ios.
console.timer = function(inName) {
  console.timers[inName] = Date.now();
  console.time(inName);
}

console.timerEnd = function(inName) {
  console.timers[inName] = Date.now() - console.timers[inName];
  console.timeEnd(inName);
}

console.timers = {};

scope.ready = function() {
  elementUpgrader.initialize();
  componentLoader.preload(document, function() {
    documentParser.parse(document, elementParser.parse);
    console.timer('components upgrade');
    elementUpgrader.go();
    console.timerEnd('components upgrade');
    scope.webComponentsReady();
  });
};

scope.webComponentsReady = function() {
  var e = document.createEvent('Event');
  e.initEvent('WebComponentsReady', true, true);
  document.body.dispatchEvent(e);
};

scope.run = function() {
  document.addEventListener('DOMContentLoaded', scope.ready);
};

if (!scope.flags.runManually) {
  scope.run();
}

document.write('<!-- begin client-side injections -->\n');

// mobile compatibility tags
// TODO(sjmiles): we probably cannot get away with forcing these in general

document.write('<!-- injected meta tags for mobile -->\n');
document.write('<meta name="apple-mobile-web-app-capable" content="yes">\n');
document.write('<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n');

// FOUC prevention tactic

document.write('<!-- injected FOUC prevention -->\n');
document.write('<style>body {opacity: 0; }</style>');

// done with write

document.write('<!-- end client-side injections -->\n');

window.addEventListener('WebComponentsReady', function() {
  //document.body.style.webkitTransition = "opacity 0.3s";
  document.body.style.opacity = 1;
});

// we are using this object for cross-module support only
// use 'export' directive to get a global reference
// (see components-polyfill.js)

window.__exported_components_polyfill_scope__ = null;

})(window.__exported_components_polyfill_scope__);
