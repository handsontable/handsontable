/* 
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {
  
  function addResolvePath(inPrototype, inElement) {
    var root = calcElementPath(inElement);
    inPrototype.resolvePath = function(inPath) {
      return root + inPath;
    }
  }
  
  function urlToPath(inUrl) {
    if (inUrl) {
      var parts = inUrl.split('/');
      parts.pop();
      parts.push('');
      return parts.join('/');
    } else {
      return '';
    }
  }
  
  function calcElementPath(inElement) {
    return urlToPath(inElement.ownerDocument.URL 
      || inElement.ownerDocument._URL 
      // TODO(sorvell): ShadowDOM polyfill pollution; WebComponents works on
      // non-wrapped documents and stores _url there
      || inElement.ownerDocument.impl._URL);
  }
  
  // exports
  Toolkit.addResolvePath = addResolvePath;
})();