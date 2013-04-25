/* 
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
Toolkit = {
  register: function(inElement, inPrototype) {
    if (inElement === window) {
      return;
    }
    inElement.register({
      prototype: inPrototype,
      lifecycle: {
        readyCallback: function() {
          var template = inElement.querySelector('template');
          if (template) {
            var root = this.webkitCreateShadowRoot();
            root.appendChild(templateContent(template).cloneNode(true));
          }
          inPrototype.created.call(this);
        }
      }
    });
  }
};