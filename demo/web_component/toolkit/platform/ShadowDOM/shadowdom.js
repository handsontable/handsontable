/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

scope = scope || {};

var thisFile = "shadowdom.js";

var source, base = "";

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

// if needed, acquire flags
if (!scope.flags) {
  var flags = {};
  // acquire flags from script tag attributes
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

  // support exportas directive
  if (flags.exportas) {
    window[flags.exportas] = scope;
  }
  window.__exported_components_polyfill_scope__ = scope;

  scope.flags = flags;

  console.log(flags);
}

scope.flags.shadow = scope.flags.shadow || 'shim';

var require = function(inSrc) {
  document.write('<script src="' + base + inSrc + '"></script>');
};

var fileSets = {
  webkit: [
    'webkit/WebkitShadowDOM.js',
    'ShadowDOMImpl.js'
  ],
  shim: [
    'shim/LightDOM.js',
    'shim/Changeling.js',
    'shim/Projection.js',
    'shim/ShimShadowDOM.js',
    'inspector/inspector.js',
    'ShadowDOMImpl.js'
  ],
  // load both webkit and shim
  testing: [
    '../lib/lang.js',
    'webkit/WebkitShadowDOM.js',
    'shim/LightDOM.js',
    'shim/Changeling.js',
    'shim/Projection.js',
    'shim/ShimShadowDOM.js',
    'ShadowDOMImpl.js'
  ],
  polyfill: [
    '../../ShadowDOM/map.js',
    '../../ShadowDOM/sidetable.js',
    '../../ShadowDOM/domreflectionutils.js',
    '../../ShadowDOM/domoverrides.js',
    '../../ShadowDOM/paralleltrees.js',
    '../../ShadowDOM/ShadowRoot.js',
    'polyfill/JsShadowDOM.js',
    'ShadowDOMImpl.js'
  ]
}

fileSets[scope.flags.shadow].forEach(require);

})(window.__exported_components_polyfill_scope__);
