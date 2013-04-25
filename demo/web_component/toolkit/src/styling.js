/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {

  // imports
  var log = window.logFlags || {};

  var doc = window.ShadowDOMPolyfill ? ShadowDOMPolyfill.wrap(document) : document;

  /**
   * Install external stylesheets loaded in <element> elements into the 
   * element's template.
   * @param inElementElement The <element> element to style.
   */
  function installSheets(inElementElement) {
    installLocalSheets(inElementElement);
    installGlobalStyles(inElementElement);
  }
  
  /**
   * Takes external stylesheets loaded in an <element> element and moves
   * their content into a <style> element inside the <element>'s template.
   * The sheet is then removed from the <element>. This is done only so 
   * that if the element is loaded in the main document, the sheet does
   * not become active.
   * Note, ignores sheets with the attribute 'toolkit-scope'.
   * @param inElementElement The <element> element to style.
   */
  function installLocalSheets(inElementElement) {
    var sheets = inElementElement.querySelectorAll('[rel=stylesheet]');
    var template = inElementElement.querySelector('template');
    if (template) {
      var content = templateContent(template);
    }
    if (content) {
      forEach(sheets, function(sheet) {
        if (!sheet.hasAttribute(SCOPE_ATTR)) {
          // in case we're in document, remove from element
          sheet.parentNode.removeChild(sheet);
          var style = createStyleElementFromSheet(sheet);
          if (style) {
            content.insertBefore(style, content.firstChild);
          }
        }
      });
    }
  }
  
  /**
   * Promotes external stylesheets and <style> elements with the attribute 
   * toolkit-scope='global' into global scope.
   * This is particularly useful for defining @keyframe rules which 
   * currently do not function in scoped or shadow style elements.
   * (See wkb.ug/72462)
   * @param inElementElement The <element> element to style.
  */
  // TODO(sorvell): remove when wkb.ug/72462 is addressed.
  function installGlobalStyles(inElementElement) {
    var styles = inElementElement.globalStyles || 
      (inElementElement.globalStyles = findStyles(inElementElement, 'global'));
    applyStylesToScope(styles, doc.head);
  }
  
  
  /**
   * Installs external stylesheets and <style> elements with the attribute 
   * toolkit-scope='controller' into the scope of inElement. This is intended
   * to be a called during custom element construction. Note, this incurs a per
   * instance cost and should be used sparingly.
   * The need for this type of styling should go away when the shadowDOM spec
   * addresses these issues:
   * 
   * https://www.w3.org/Bugs/Public/show_bug.cgi?id=21391
   * https://www.w3.org/Bugs/Public/show_bug.cgi?id=21390
   * https://www.w3.org/Bugs/Public/show_bug.cgi?id=21389
   * 
   * @param inElement The custom element instance into whose controller (parent)
   * scope styles will be installed.
   * @param inElementElement The <element> containing controller styles.
  */
  // TODO(sorvell): remove when spec issues are addressed
  function installControllerStyles(inElement, inElementElement) {
      var styles = inElementElement.controllerStyles || 
        (inElementElement.controllerStyles = findStyles(inElementElement, 'controller'));
      async.queue(function() {
        var scope = findStyleController(inElement);
        if (scope) {
          applyStylesToScope(styles, scope);
        }
      });
  }
  
  // queue a series of functions to occur async.
  var async = {
    list: [],
    queue: function(inFn) {
      if (inFn) {
        async.list.push(inFn);
      }
      async.queueFlush();
    },
    queueFlush: function() {
      if (!async.flushing) {
        async.flushing = true;
        requestAnimationFrame(async.flush);
      }
    },
    flush: function() {
      async.list.forEach(function(fn) {
        fn();
      });
      async.list = [];
      async.flusing = false;
    }
    
  }
  
  function findStyleController(inNode) {
    // find the shadow root that contains inNode
    var n = inNode;
    while (n.parentNode && n.localName != 'shadow-root') {
      n = n.parentNode;
    }
    return n == doc ? doc.head : n;
  };

  function createStyleElementFromSheet(inSheet) {
    if (inSheet.__resource) {
      var style = doc.createElement('style');
      style.textContent = inSheet.__resource;
      return style;
    } else {
      console.warn('Could not find content for stylesheet', inSheet);
    }
  }

  function applyStylesToScope(inStyles, inScope) {
    inStyles.forEach(function(style) {
      inScope.appendChild(style.cloneNode(true));
    });
  }
  
  var eltProto = HTMLElement.prototype;
  var matches = eltProto.matches || eltProto.matchesSelector || 
      eltProto.webkitMatchesSelector || eltProto.mozMatchesSelector;
  function matchesSelector(inNode, inSelector) {
    if (matches) {
      return matches.call(inNode, inSelector);
    }
  }
  
  // TODO(sorvell): it would be better to identify blocks of rules within
  // style declarations than require different style/link elements.
  function findStyles(inElementElement, inDescriptor) {
    var styleList = [];
    // handle stylesheets
    var sheets = inElementElement.querySelectorAll('[rel=stylesheet]');
    var selector = '[' + SCOPE_ATTR + '=' + inDescriptor + ']';
    Array.prototype.forEach.call(sheets, function(sheet) {
      if (matchesSelector(sheet, selector)) {
        // in case we're in document, remove from element
        sheet.parentNode.removeChild(sheet);
        styleList.push(createStyleElementFromSheet(sheet));
      }
    });
    // handle style elements
    var styles = inElementElement.querySelectorAll('style');
    Array.prototype.forEach.call(styles, function(style) {
      if (matchesSelector(style, selector)) {
        // in case we're in document, remove from element
        style.parentNode.removeChild(style);
        styleList.push(style);
      }
    });
    return styleList;
  }
  
  var SCOPE_ATTR = 'toolkit-scope';
  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  
  // exports
  Toolkit.installSheets = installSheets;
  Toolkit.installControllerStyles = installControllerStyles;
})();