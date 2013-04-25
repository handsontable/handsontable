/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * This module uses Mutation Observers to dynamically adjust which nodes will
 * generate Pointer Events.
 *
 * All nodes that wish to generate Pointer Events must have the attribute
 * `touch-action` set to `none`.
 */
(function(scope) {
  var dispatcher = scope.dispatcher;
  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  var map = Array.prototype.map.call.bind(Array.prototype.map);
  var installer = {
    ATTRIB: 'touch-action',
    SELECTOR: '[touch-action]',
    EMITTER: 'none',
    XSCROLLER: 'pan-x',
    YSCROLLER: 'pan-y',
    SCROLLER: /^(?:pan-x pan-y)|(?:pan-y pan-x)|scroll$/,
    OBSERVER_INIT: {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['touch-action']
    },
    watchSubtree: function(inScope) {
      observer.observe(inScope, this.OBSERVER_INIT);
    },
    enableOnSubtree: function(inScope) {
      var scope = inScope || document;
      this.watchSubtree(inScope);
      if (scope === document && document.readyState !== 'complete') {
        this.installOnLoad();
      } else {
        this.installNewSubtree(scope);
      }
    },
    installNewSubtree: function(inScope) {
      forEach(this.findElements(inScope), this.addElement, this);
    },
    findElements: function(inScope) {
      var scope = inScope || document;
      if (scope.querySelectorAll) {
        return scope.querySelectorAll(this.SELECTOR);
      }
      return [];
    },
    touchActionToScrollType: function(inTouchAction) {
      var t = inTouchAction;
      if (t === this.EMITTER) {
        return 'none';
      } else if (t === this.XSCROLLER) {
        return 'X';
      } else if (t === this.YSCROLLER) {
        return 'Y';
      } else if (this.SCROLLER.exec(t)) {
        return 'XY';
      }
    },
    removeElement: function(inEl) {
      dispatcher.unregisterTarget(inEl);
      // remove touch-action from shadow
      var s = scope.targetFinding.shadow(inEl);
      if (s) {
        dispatcher.unregisterTarget(s);
      }
    },
    addElement: function(inEl) {
      var a = inEl.getAttribute && inEl.getAttribute(this.ATTRIB);
      var st = this.touchActionToScrollType(a);
      if (st) {
        dispatcher.registerTarget(inEl, st);
        // set touch-action on shadow as well
        var s = scope.targetFinding.shadow(inEl);
        if (s) {
          dispatcher.registerTarget(s, st);
        }
      }
    },
    elementChanged: function(inEl) {
      this.removeElement(inEl);
      this.addElement(inEl);
    },
    concatLists: function(inAccum, inList) {
      for (var i = 0, l = inList.length, o; i < l && (o = inList[i]); i++) {
        inAccum.push(o);
      }
      return inAccum;
    },
    // register all touch-action = none nodes on document load
    installOnLoad: function() {
      document.addEventListener('DOMContentLoaded', this.installNewSubtree.bind(this, document));
    },
    flattenMutationTree: function(inNodes) {
      // find children with touch-action
      var tree = map(inNodes, this.findElements, this);
      // make sure the added nodes are accounted for
      tree.push(inNodes);
      // flatten the list
      return tree.reduce(this.concatLists, []);
    },
    mutationWatcher: function(inMutations) {
      inMutations.forEach(this.mutationHandler, this);
    },
    mutationHandler: function(inMutation) {
      var m = inMutation;
      if (m.type === 'childList') {
        var added = this.flattenMutationTree(m.addedNodes);
        added.forEach(this.addElement, this);
        var removed = this.flattenMutationTree(m.removedNodes);
        removed.forEach(this.removeElement, this);
      } else if (m.type === 'attributes') {
        this.elementChanged(m.target);
      }
    },
  };
  var boundWatcher = installer.mutationWatcher.bind(installer);
  scope.installer = installer;
  scope.register = installer.enableOnSubtree.bind(installer);
  // imperatively set the touch action of an element, document, or shadow root
  // use 'auto' to unset the touch-action
  scope.setTouchAction = function(inEl, inTouchAction) {
    var st = this.touchActionToScrollType(inTouchAction);
    if (st) {
      dispatcher.registerTarget(inEl, st);
    } else {
      dispatcher.unregisterTarget(inEl);
    }
  }.bind(installer);
  var MO = window.MutationObserver || window.WebKitMutationObserver;
  if (!MO) {
    installer.watchSubtree = function(){
      console.warn('PointerEventsPolyfill: MutationObservers not found, touch-action will not be dynamically detected');
    };
  } else {
    var observer = new MO(boundWatcher);
  }
})(window.PointerEventsPolyfill);
