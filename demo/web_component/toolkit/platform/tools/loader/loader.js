/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {
  
var scope = window.Loader = {};
var flags = {};

// convert url arguments to flags

if (!flags.noOpts) {
  location.search.slice(1).split('&').forEach(function(o) {
    o = o.split('=');
    o[0] && (flags[o[0]] = o[1] || true);
  });
}

// process global logFlags

parseLogFlags(flags);

function load(scopeName) {
  // imports

  var scope = window[scopeName];
  var entryPointName = scope.entryPointName;
  var processFlags = scope.processFlags;

  // acquire attributes and base path from entry point

  var entryPoint = findScript(entryPointName);
  var base = entryPoint.basePath;
  
  // acquire common flags
  var flags = Loader.flags;

  // convert attributes to flags
  var flags = Loader.flags;
  for (var i=0, a; (a=entryPoint.attributes[i]); i++) {
    if (a.name !== 'src') {
      flags[a.name] = a.value || true;
    }
  }

  // parse log flags into global
  parseLogFlags(flags);

  // exports

  scope.basePath = base;
  scope.flags = flags;

  // process flags for dynamic dependencies

  if (processFlags) {
    processFlags.call(scope, flags);
  }

  // post-process imports

  var modules = scope.modules || [];
  var sheets = scope.sheets || [];

  // write script tags for dependencies

  modules.forEach(function(src) {
    document.write('<script src="' + base + src + '"></script>');
  });

  // write link tags for styles

  sheets.forEach(function(src) {
    document.write('<link rel="stylesheet" href="' + base + src + '">');
  }); 
}

// utility method

function findScript(fileName) {
  var script = document.querySelector('script[src*="' + fileName + '"]');
  var src = script.attributes.src.value;
  script.basePath = src.slice(0, src.indexOf(fileName));
  return script;
}

function parseLogFlags(flags) {
  var logFlags = window.logFlags = window.logFlags || {};
  if (flags.log) {
    flags.log.split(',').forEach(function(f) {
      logFlags[f] = true;
    });
  }
}

scope.flags = flags;
scope.load = load;  

})();
