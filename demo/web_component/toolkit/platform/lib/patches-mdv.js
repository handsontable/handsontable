/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function() {
  // MDV hook for processing created dom before bindings are made. We upgrade
  // so custom elements get a chance to deal with bindings mdv is about to make.
  HTMLTemplateElement.__instanceCreated = function(inNode) {
    // TODO(sorvell): workaround for
    // https://code.google.com/p/chromium/issues/detail?id=229125
    document.adoptNode(inNode);
    document.upgradeElements(inNode);
  };
  
  // dirtyCheck with logging
  window.dirtyCheck = function() {
    logFlags.data && console.group("Model.dirtyCheck()"); 
    check();
    logFlags.data && console.groupEnd(); 
  };
  
  // call notifyChanges in Model scope
  var check = function() {
    Model.notifyChanges();
  };
  
  var dirtyCheckPollInterval = 125;
  
  // polling dirty checker
  window.addEventListener('WebComponentsReady', function() {
    // timeout keeps the profile clean
    //setTimeout(function() {
      //console.profile('initial model dirty check');
      dirtyCheck();
      //console.profileEnd();
    //}, 0);
    setInterval(check, dirtyCheckPollInterval);
  });
})();

