// Copyright 2013 The Toolkitchen Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var HTMLContentElement = scope.wrappers.HTMLContentElement;
  var Node = scope.wrappers.Node;
  var assert = scope.assert;
  var mixin = scope.mixin;
  var unwrap = scope.unwrap;
  var wrap = scope.wrap;

  /**
   * Updates the fields of a wrapper to a snapshot of the logical DOM as needed.
   * Up means parentNode
   * Sideways means previous and next sibling.
   * @param {!Node} wrapper
   */
  function updateWrapperUpAndSideways(wrapper) {
    wrapper.previousSibling_ = wrapper.previousSibling;
    wrapper.nextSibling_ = wrapper.nextSibling;
    wrapper.parentNode_ = wrapper.parentNode;
  }

  /**
   * Updates the fields of a wrapper to a snapshot of the logical DOM as needed.
   * Down means first and last child
   * @param {!Node} wrapper
   */
  function updateWrapperDown(wrapper) {
    wrapper.firstChild_ = wrapper.firstChild;
    wrapper.lastChild_ = wrapper.lastChild;
  }

  function updateAllChildNodes(parentNodeWrapper) {
    assert(parentNodeWrapper instanceof Node);
    for (var childWrapper = parentNodeWrapper.firstChild;
         childWrapper;
         childWrapper = childWrapper.nextSibling) {
      updateWrapperUpAndSideways(childWrapper);
    }
    updateWrapperDown(parentNodeWrapper);
  }

  // This object groups DOM operations. This is supposed to be the DOM as the
  // browser/render tree sees it.
  // When changes are done to the visual DOM the logical DOM needs to be updated
  // to reflect the correct tree.
  function removeAllChildNodes(parentNodeWrapper) {
    var parentNode = unwrap(parentNodeWrapper);
    updateAllChildNodes(parentNodeWrapper);
    parentNode.textContent = '';
  }

  function appendChild(parentNodeWrapper, childWrapper) {
    var parentNode = unwrap(parentNodeWrapper);
    var child = unwrap(childWrapper);
    if (child.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      updateAllChildNodes(childWrapper);

    } else {
      remove(childWrapper);
      updateWrapperUpAndSideways(childWrapper);
    }

    parentNodeWrapper.lastChild_ = parentNodeWrapper.lastChild;
    if (parentNodeWrapper.lastChild === parentNodeWrapper.firstChild)
      parentNodeWrapper.firstChild_ = parentNodeWrapper.firstChild;

    var lastChildWrapper = wrap(parentNode.lastChild);
    if (lastChildWrapper) {
      lastChildWrapper.nextSibling_ = lastChildWrapper.nextSibling;
    }

    parentNode.appendChild(child);
  }

  function removeChild(parentNodeWrapper, childWrapper) {
    var parentNode = unwrap(parentNodeWrapper);
    var child = unwrap(childWrapper);

    updateWrapperUpAndSideways(childWrapper);

    if (childWrapper.previousSibling)
      childWrapper.previousSibling.nextSibling_ = childWrapper;
    if (childWrapper.nextSibling)
      childWrapper.nextSibling.previousSibling_ = childWrapper;

    if (parentNodeWrapper.lastChild === childWrapper)
      parentNodeWrapper.lastChild_ = childWrapper;
    if (parentNodeWrapper.firstChild === childWrapper)
      parentNodeWrapper.firstChild_ = childWrapper;

    parentNode.removeChild(child);
  }

  function remove(nodeWrapper) {
    var node = unwrap(nodeWrapper)
    var parentNode = node.parentNode;
    if (parentNode)
      removeChild(wrap(parentNode), nodeWrapper);
  }

  var distributedChildNodesTable = new SideTable();
  var shadowDOMRendererTable = new SideTable();
  var nextOlderShadowTreeTable = new SideTable();
  var insertionParentTable = new SideTable();
  var eventParentTable = new SideTable();

  function distributeChildToInsertionPoint(child, insertionPoint) {
    getDistributedChildNodes(insertionPoint).push(child);
    insertionParentTable.set(child, insertionPoint);

    var eventParent = child;
    var tmp;
    while (tmp = eventParentTable.get(eventParent)) {
      eventParent = tmp;
    }
    if (eventParent !== insertionPoint)
      eventParentTable.set(eventParent, insertionPoint);
  }

  function resetDistributedChildNodes(insertionPoint) {
    var oldDistributed = getDistributedChildNodes(insertionPoint);
    if (oldDistributed) {
      oldDistributed.forEach(function(node) {
        eventParentTable.set(node, undefined);
      });
    }
    distributedChildNodesTable.set(insertionPoint, []);
  }

  function getDistributedChildNodes(insertionPoint) {
    return distributedChildNodesTable.get(insertionPoint);
  }

  function getChildNodesSnapshot(node) {
    var result = [], i = 0;
    for (var child = node.firstChild; child; child = child.nextSibling) {
      result[i++] = child;
    }
    return result;
  }

  /**
   * Visits all nodes in the tree that fulfils the |predicate|. If the |visitor|
   * function returns |false| the traversal is aborted.
   * @param {!Node} tree
   * @param {function(!Node) : boolean} predicate
   * @param {function(!Node) : *} visitor
   */
  function visit(tree, predicate, visitor) {
    // This operates on logical DOM.
    var nodes = getChildNodesSnapshot(tree);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (predicate(node)) {
        if (visitor(node) === false)
          return;
      } else {
        visit(node, predicate, visitor);
      }
    }
  }

  // http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#dfn-distribution-algorithm
  function distribute(tree, pool) {
    var anyRemoved = false;

    visit(tree, isActiveInsertionPoint,
        function(insertionPoint) {
          resetDistributedChildNodes(insertionPoint);
          for (var i = 0; i < pool.length; i++) {  // 1.2
            var node = pool[i];  // 1.2.1
            if (node === undefined)  // removed
              continue;
            if (matchesCriteria(node, insertionPoint)) {  // 1.2.2
              distributeChildToInsertionPoint(node, insertionPoint);  // 1.2.2.1
              pool[i] = undefined;  // 1.2.2.2
              anyRemoved = true;
            }
          }
        });

    if (!anyRemoved)
      return pool;

    var newPool = [];
    for (var i = 0; i < pool.length; i++) {
      if (pool[i] !== undefined)
        newPool.push(pool[i]);
    }
    return newPool;
  }

  // Matching Insertion Points
  // http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#matching-insertion-points

  // TODO(arv): Verify this... I don't remember why I picked this regexp.
  var selectorMatchRegExp = /^[*.:#[a-zA-Z_|]/;

  var allowedPseudoRegExp = new RegExp('^:(' + [
    'link',
    'visited',
    'target',
    'enabled',
    'disabled',
    'checked',
    'indeterminate',
    'nth-child',
    'nth-last-child',
    'nth-of-type',
    'nth-last-of-type',
    'first-child',
    'last-child',
    'first-of-type',
    'last-of-type',
    'only-of-type',
  ].join('|') + ')');


  function oneOf(object, propertyNames) {
    for (var i = 0; i < propertyNames.length; i++) {
      if (propertyNames[i] in object)
        return propertyNames[i];
    }
  }

  var matchesSelector = oneOf(document.documentElement,
      ['matchesSelector', 'msMatchesSelector', 'mozMatchesSelector',
      'webkitMatchesSelector']);

  /**
   * @param {Element} node
   * @oaram {Element} point The insertion point element.
   * @return {boolean} Whether the node matches the insertion point.
   */
  function matchesCriteria(node, point) {
    var select = point.getAttribute('select');
    if (!select)
      return true;

    // Here we know the select attribute is a non empty string.
    select = select.trim();
    if (!select)
      return true;

    if (node.nodeType !== Node.ELEMENT_NODE)
      return false;

    // TODO(arv): This does not seem right. Need to check for a simple selector.
    if (!selectorMatchRegExp.test(select))
      return false;

    if (select[0] === ':' &&!allowedPseudoRegExp.test(select))
      return false;

    try {
      return node[matchesSelector](select);
    } catch (ex) {
      // Invalid selector.
      return false;
    }
  }

  var request = oneOf(window, [
    'requestAnimationFrame',
    'mozRequestAnimationFrame',
    'webkitRequestAnimationFrame',
    'setTimeout'
  ]);

  var pendingDirtyRenderers = [];
  var renderTimer;

  function renderAllPending() {
    renderTimer = null;
    pendingDirtyRenderers.forEach(function(owner) {
      owner.render();
    });
    pendingDirtyRenderers = [];
  }

  function ShadowRenderer(host) {
    this.host = host;
    this.dirty = false;
    this.associateNode(host);
  }

  ShadowRenderer.prototype = {
    // http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#rendering-shadow-trees
    render: function() {
      if (!this.dirty)
        return;

      var host = this.host;
      this.treeComposition();
      var shadowDOM = host.shadowRoot;
      if (!shadowDOM)
        return;

      this.removeAllChildNodes(this.host);

      var shadowDOMChildNodes = getChildNodesSnapshot(shadowDOM);
      shadowDOMChildNodes.forEach(function(node) {
        this.renderNode(host, shadowDOM, node, false);
      }, this);

      this.dirty = false;
    },

    invalidate: function() {
      if (!this.dirty) {
        this.dirty = true;
        pendingDirtyRenderers.push(this);
        if (renderTimer)
          return;
        renderTimer = window[request](renderAllPending, 0);
      }
    },

    renderNode: function(visualParent, tree, node, isNested) {
      if (isShadowHost(node)) {
        this.appendChild(visualParent, node);
        var renderer = new ShadowRenderer(node);
        renderer.render();
      } else if (isInsertionPoint(node)) {
        this.renderInsertionPoint(visualParent, tree, node, isNested);
      } else if (isShadowInsertionPoint(node)) {
        this.renderShadowInsertionPoint(visualParent, tree, node);
      } else {
        this.renderAsAnyDomTree(visualParent, tree, node, isNested);
      }
    },

    renderAsAnyDomTree: function(visualParent, tree, child, isNested) {
      this.appendChild(visualParent, child);

      if (isShadowHost(child)) {
        render(child);
      } else {
        var parent = child;
        var logicalChildNodes = getChildNodesSnapshot(parent);
        logicalChildNodes.forEach(function(node) {
          this.renderNode(parent, tree, node, isNested);
        }, this);
      }
    },

    renderInsertionPoint: function(visualParent, tree, insertionPoint, isNested) {
      var distributedChildNodes = getDistributedChildNodes(insertionPoint);
      if (distributedChildNodes.length) {
        this.removeAllChildNodes(insertionPoint);

        distributedChildNodes.forEach(function(child) {
          if (isInsertionPoint(child) && isNested)
            this.renderInsertionPoint(visualParent, tree, child, isNested);
          else
            this.renderAsAnyDomTree(visualParent, tree, child, isNested);
        }, this);
      } else {
        this.renderFallbackContent(visualParent, insertionPoint);
      }
      this.remove(insertionPoint);
    },

    renderShadowInsertionPoint: function(visualParent, tree, shadowInsertionPoint) {
      var nextOlderTree = getNextOlderTree(tree);
      if (nextOlderTree) {
        // This makes ShadowRoot have its insertionParent be the <shadow>.
        insertionParentTable.set(nextOlderTree, shadowInsertionPoint);
        shadowInsertionPoint.olderShadowRoot_ = nextOlderTree;
        this.remove(shadowInsertionPoint);
        var shadowDOMChildNodes = getChildNodesSnapshot(nextOlderTree);
        shadowDOMChildNodes.forEach(function(node) {
          this.renderNode(visualParent, nextOlderTree, node, true);
        }, this);
      } else {
        this.renderFallbackContent(visualParent, shadowInsertionPoint);
      }
    },

    renderFallbackContent: function (visualParent, fallbackHost) {
      var logicalChildNodes = getChildNodesSnapshot(fallbackHost);
      logicalChildNodes.forEach(function(node) {
        this.appendChild(visualParent, node);
      }, this);
    },

    // http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#dfn-tree-composition
    treeComposition: function () {
      var shadowHost = this.host;
      var tree = shadowHost.shadowRoot;  // 1.
      var pool = [];  // 2.
      var shadowHostChildNodes = getChildNodesSnapshot(shadowHost);
      shadowHostChildNodes.forEach(function(child) {  // 3.
        if (isInsertionPoint(child)) {  // 3.2.
          var reprojected = getDistributedChildNodes(child);  // 3.2.1.
          // if reprojected is undef... reset it?
          if (!reprojected || !reprojected.length)  // 3.2.2.
            reprojected = getChildNodesSnapshot(child);
          pool.push.apply(pool, reprojected);  // 3.2.3.
        } else {
          pool.push(child); // 3.3.
        }
      });

      var shadowInsertionPoint, point;
      while (tree) {  // 4.
        // 4.1.
        shadowInsertionPoint = undefined;  // Reset every iteration.
        visit(tree, isActiveShadowInsertionPoint, function(point) {
          shadowInsertionPoint = point;
          return false;
        });
        point = shadowInsertionPoint;

        pool = distribute(tree, pool);  // 4.2.
        if (point) {  // 4.3.
          var nextOlderTree = getNextOlderTree(tree);  // 4.3.1.
          if (!nextOlderTree) {
            break;  // 4.3.1.1.
          } else {
            tree = nextOlderTree;  // 4.3.2.2.
            assignShadowTreeToShadowInsertionPoint(tree, point);  // 4.3.2.2.
            continue;  // 4.3.2.3.
          }
        } else {
          break;  // 4.4.
        }
      }
    },

    // Visual DOM mutation.
    appendChild: function(parent, child) {
      appendChild(parent, child);
      this.associateNode(child);
    },

    remove: function(node) {
      remove(node);
      this.associateNode(node);
    },

    removeAllChildNodes: function(parent) {
      removeAllChildNodes(parent);
      // TODO(arv): Does this need to associate all the nodes with this renderer?
    },

    associateNode: function(node) {
      // TODO: Clear when moved out of shadow tree.
      shadowDOMRendererTable.set(node, this);
    }
  };

  function isInsertionPoint(node) {
    // Should this include <shadow>?
    return node.tagName == 'CONTENT';
  }

  function isActiveInsertionPoint(node) {
    // <content> inside another <content> or <shadow> is considered inactive.
    return node.tagName === 'CONTENT';
  }

  function isShadowInsertionPoint(node) {
    return node.tagName === 'SHADOW';
  }

  function isActiveShadowInsertionPoint(node) {
    // <shadow> inside another <content> or <shadow> is considered inactive.
    return node.tagName === 'SHADOW';
  }

  function isShadowHost(shadowHost) {
    return !!shadowHost.shadowRoot;
  }

  /**
   * @param {WrapperShadowRoot} tree
   */
  function getNextOlderTree(tree) {
    return nextOlderShadowTreeTable.get(tree);
  }

  function getShadowTrees(host) {
    var trees = [];

    for (var tree = host.shadowRoot;
         tree;
         tree = nextOlderShadowTreeTable.get(tree)) {
      trees.push(tree);
    }
    return trees;
  }

  function assignShadowTreeToShadowInsertionPoint(tree, point) {
    // TODO: No one is reading the map below.
    // console.log('Assign %o to %o', tree, point);
    // treeToShadowInsertionPointMap.set(tree, point);
  }

  // http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#rendering-shadow-trees
  function render(host) {
    new ShadowRenderer(host).render();
  };

  Node.prototype.invalidateShadowRenderer = function() {
    // TODO: If this is in light DOM we only need to invalidate renderer if this
    // is a direct child of a ShadowRoot.
    // Maybe we should only associate renderers with direct child nodes of a
    // shadow root (and all nodes in the shadow dom).
    var renderer = shadowDOMRendererTable.get(this);
    if (!renderer)
      return false;

    renderer.invalidate();
    return true;
  };

  HTMLContentElement.prototype.getDistributedNodes = function() {
    // TODO(arv): We should associate the element with the shadow root so we
    // only have to rerender this ShadowRenderer.
    renderAllPending();
    return getDistributedChildNodes(this);
  };

  mixin(Node.prototype, {
    get insertionParent() {
      return insertionParentTable.get(this) || null;
    }
  });

  scope.ShadowRenderer = ShadowRenderer;
  scope.eventParentTable = eventParentTable;
  scope.getShadowTrees = getShadowTrees;
  scope.nextOlderShadowTreeTable = nextOlderShadowTreeTable;
  scope.renderAllPending = renderAllPending;

  // Exposed for testing
  scope.visual = {
    removeAllChildNodes: removeAllChildNodes,
    appendChild: appendChild,
    removeChild: removeChild
  };

})(this.ShadowDOMPolyfill);