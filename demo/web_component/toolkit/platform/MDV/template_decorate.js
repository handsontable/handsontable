/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function() {
  var decorateAll = function(inNode) {
    Array.prototype.forEach.call(inNode.querySelectorAll('template'),
    HTMLTemplateElement.decorate);
  }
  
  HTMLTemplateElement.decorateAll = hasMDV ? function(){} : decorateAll;
})();