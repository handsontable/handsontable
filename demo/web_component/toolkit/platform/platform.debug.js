/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

// imports

var flags = scope.flags;
var base = scope.basePath;

// module dependencies

var ShadowDOMNative = [
  'lib/patches-shadowdom-native.js'
];

var ShadowDOMPolyfill = [
  'ShadowDOM/shadowdom.js',
  'lib/patches-shadowdom-polyfill.js',
  'lib/querySelector.js'
];

var Lib = [
  'lib/lang.js',
  'lib/dom.js',
  'lib/template.js',
  'lib/inspector.js',
];

var MDV = [
  'MDV/mdv.js',
  'lib/patches-mdv.js'
];

var Pointer = [
  'PointerGestures/src/pointergestures.js'
];

var WebElements = [
  'HTMLImports/html-imports.js',
  'CustomElements/custom-elements.js'
];

// failure to detect native shadowDOM, or a 'truthy' value for any of these 
// flags results in polyfill
flags.shadow = (flags.shadowdom || flags.shadow || flags.polyfill || 
    !HTMLElement.prototype.webkitCreateShadowRoot) && 'polyfill';

// select ShadowDOM impl

var ShadowDOM = flags.shadow ? ShadowDOMPolyfill : ShadowDOMNative;

// construct active dependency list

modules = [].concat(
  Lib,
  ShadowDOM,
  WebElements,
  Pointer,
  MDV
);

// write script tags for dependencies

modules.forEach(function(inSrc) {
  document.write('<script src="' + base + inSrc + '"></script>');
});

})(Platform);
