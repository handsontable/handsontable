/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

scope = scope || {};

// NOTE: use attributes on the script tag for this file as directives

// export="[name]"		exports polyfill scope into window as 'name'
// shimShadow         use shim version of ShadowDOM (otherwise native)

// NOTE: uses 'window' and 'document' globals

// directives

var thisFile = 'platform.js';

var source, base = '';

(function() {
  var s$ = document.querySelectorAll('[src]');
  Array.prototype.forEach.call(s$, function(s) {
    var src = s.getAttribute('src');
    if (src.slice(-thisFile.length) == thisFile) {
      source = s;
      base = src.slice(0, -thisFile.length);
    }
  });
  source = source || {
    getAttribute: nop
  };
})();

// acquire flags from script tag attributes

var flags = {};
for (var i=0, a; (a = source.attributes[i]); i++) {
  flags[a.name] = a.value || true;
}

// acquire flags from url

if (!flags.noOpts) {
  var opts = location.search.slice(1).split('&');
  for (var i=0, o; (o = opts[i]); i++) {
    o = o.split('=');
    flags[o[0]] = o[1] || true;
  }
}

// process log flags

var logFlags = {};
if (flags.log) {
  var logs = flags.log.split(',');
  for (var i=0, f; f=logs[i]; i++) {
    logFlags[f] = true;
  }
}
window.logFlags = logFlags;

console.log(flags);

// support exportas directive

if (flags.exportas) {
  window[flags.exportas] = scope;
}
window.__exported_components_polyfill_scope__ = scope;

// module exports

scope.flags = flags;

var require = function(inSrc) {
  document.write('<script src="' + base + inSrc + '"></script>');
};

[
  'lib/lang.js',
  'lib/dom_token_list.js',
  'PointerGestures/src/pointergestures.js',
  'MDV/mdv.js',
  'ShadowDOM/shadowdom.js',
  'ComponentDocuments/path.js',
  'ComponentDocuments/loader.js',
  'ComponentDocuments/parser.js',
  'CustomDOMElement/CustomDOMElements.js',
  'CustomDOMElement/HTMLElementElement.js',
  'lib/boot.js'
].forEach(require);

})(window.__exported_components_polyfill_scope__);
