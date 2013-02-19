/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function() {
  var thisFile = 'pointergestures.js';
  var libLocation = '';
  var require = function(inSrc) {
    document.write('<script src="' + libLocation + inSrc + '"></script>');
  };

  var s = document.querySelector('script[src $= "' + thisFile + '"]');
  if (s) {
    libLocation = s.src.slice(0, -thisFile.length);
  }

  [
    'PointerEvents/src/pointerevents.js',
    'PointerGestureEvent.js',
    'initialize.js',
    'dispatcher.js',
    'hold.js',
    'track.js',
    'flick.js',
    'tap.js'
  ].forEach(require);
})();
