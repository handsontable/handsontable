/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function() {
  var thisFile = 'pointerevents.js';
  var libLocation = '';

  var require = function(inSrc) {
    document.write('<script src="' + libLocation + inSrc + '"></script>');
  };

  var s = document.querySelector('script[src $= "' + thisFile + '"]');
  if (s) {
    libLocation = s.src.slice(0, -thisFile.length);
  }

  document.write('<link rel="stylesheet" href="' + libLocation + 'touch-action.css">');
  [
    '../third_party/mutation_summary/mutation_summary.js',
    'PointerEvent.js',
    'sidetable.js',
    'initialize.js',
    'pointermap.js',
    'dispatcher.js',
    'installer.js',
    'findTarget.js',
    'platform-events.js',
    'capture.js'
  ].forEach(require);
})();
