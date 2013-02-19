/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function() {
  var check = function() {
    Model.notifyChanges();
  };
  window.dirtyCheck = function() {
    logFlags.data && console.group("Model.dirtyCheck()"); 
    check();
    logFlags.data && console.groupEnd(); 
  };
  window.addEventListener('WebComponentsReady', function() {
    // timeout keeps the profile clean
    //setTimeout(function() {
      //console.profile('initial model dirty check');
      dirtyCheck();
      //console.profileEnd();
    //}, 0);
    setInterval(check, 125);
  });
})();