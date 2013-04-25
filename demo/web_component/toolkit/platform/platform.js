/* 
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {
  
var thisFile = 'platform.js';
var scopeName = 'Platform';

function processFlags(flags) {
  this.modules = [flags.debug ? 'platform.debug.js' : 'platform.min.js'];
}

// export 

window[scopeName] = {
  entryPointName: thisFile,
  processFlags: processFlags
};

// bootstrap

var script = document.querySelector('script[src*="' + thisFile + '"]');
var src = script.attributes.src.value;
var basePath = src.slice(0, src.indexOf(thisFile));

if (!window.Loader) {
  var path = basePath + 'tools/loader/loader.js';
  document.write('<script src="' + path + '"></script>');
} 
document.write('<script>Loader.load("' + scopeName + '")</script>');
  
})();
