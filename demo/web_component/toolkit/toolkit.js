/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/* 
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {
  
var thisFile = 'toolkit.js';
var scopeName = 'Toolkit';
var modules = [
  'platform/platform.js',
  'src/lang.js',
  'src/oop.js',
  'src/register.js',
  'src/bindProperties.js',
  'src/bindMDV.js',
  'src/attrs.js',
  'src/marshal.js',
  'src/events.js',
  'src/observeProperties.js',
  'src/styling.js',
  'src/shimStyling.js',
  'src/path.js',
  'src/job.js',
  'src/boot.js'
];

// export 

window[scopeName] = {
  entryPointName: thisFile,
  modules: modules
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
