// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function() {

var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

var bindAttributeParser = new BindAttributeParser;

var templateAttributeDirectives = {
  'template': true,
  'iterate': true,
  'instantiate': true,
  'ref': true
}

var semanticTemplateElements = {
  'THEAD': true,
  'TBODY': true,
  'TFOOT': true,
  'TH': true,
  'TR': true,
  'TD': true,
  'COLGROUP': true,
  'COL': true,
  'OPTION': true
}

var allTemplatesSelectors = 'template, ' +
    Object.keys(semanticTemplateElements).map(function(tagName) {
      return tagName.toLowerCase() + '[template]';
    }).join(', ');

function allTemplatesFromNode(node) {
  return node.querySelectorAll(allTemplatesSelectors);
}

function isAttributeTemplate(el) {
  return semanticTemplateElements[el.tagName] &&
      el.hasAttribute('template');
}

function isTemplateElement(el) {
  return el.tagName == 'TEMPLATE' || isAttributeTemplate(el);
}

document.addEventListener('DOMContentLoaded', function(e) {
  var templates = allTemplatesFromNode(document);
  forEach(templates, HTMLTemplateElement.decorate);
}, false);

function hasPlaceHolder(text) {
  return /\{\{((.|\n)+?)\}\}/.test(text);
}

function getPropertyNameForBinding(nodeName) {
  if (nodeName == 'modelscope')
    return 'modelScope';
  return nodeName;
}

/**
 * Builds a structure that represents the position of the bindings in this DOM
 * tree.
 * @param {Node} node The node to generate the representation for.
 * @return {Object}
 */
function buildBindingsRepresentation(node) {
  var placeHolderBindings = {};
  var attributeBindings = {}
  var anyPlaceHolderBindings = false;
  var anyAttributeBindings = false;
  var anyTemplates = false;
  var modelScope = '';
  // Bindings may exist *on* "attribute-Template" elements
  // (e.g. <tr template iterate class="{{ foo }}"). Avoid building the
  // binding representation for those bindings on the template element.
  // Once the "semantic template" is separated from its prototype
  // (cloneAndSeperateAttributeTemplate), the bindings representation can be
  // built.
  if (node.nodeType == Node.ELEMENT_NODE &&
      !isTemplateElement(node)) {
    for (var i = 0; i < node.attributes.length; i++) {
      var attr = node.attributes[i];
      if (hasPlaceHolder(attr.nodeValue)) {
        var propertyName = getPropertyNameForBinding(attr.nodeName);
        placeHolderBindings[propertyName] = attr.nodeValue;
        anyPlaceHolderBindings = true;

        // TODO(rafaelw): Hack alert. This may or may not be the "right" thing
        // to do, but the motivation is to make bindings work in webkit. The
        // issue is that assigning null to an input.value in webkit returns
        // the value to what's stored in the attribute map. If we pull the
        // binding text out preemptively, "the right thing happens". Sadly,
        // the "right" thing won't happen in IE. <sigh>
        node.setAttribute(attr.name, '');
      } else if (attr.nodeName == 'modelscope') {
        modelScope = attr.nodeValue;
      } else if (attr.nodeName == 'bind') {
        var tokens = bindAttributeParser.parse(attr.nodeValue);
        tokens.forEach(function(token) {
          attributeBindings[token.property] = token;
        });
        anyAttributeBindings = true;
      }
    }
  } else if (node.nodeType == Node.TEXT_NODE) {
    if (hasPlaceHolder(node.textContent)) {
      placeHolderBindings['textContent'] = node.textContent;
      anyPlaceHolderBindings = true;
    }
  }

  var descr = {};
  var anyNested = false;
  // Don't traverse into templates. Templates gets stamped out by the iterator.
  if (!isTemplateElement(node)) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var repr = buildBindingsRepresentation(node.childNodes[i]);
      if (repr) {
        descr[i] = repr;
        anyNested = true;
      }
    }
  } else {
    anyTemplates = true;
  }

  if (!anyAttributeBindings &&
      !anyPlaceHolderBindings &&
      !anyNested &&
      !anyTemplates)
    return null;

  if (anyPlaceHolderBindings)
    descr.placeHolderBindings_ = placeHolderBindings;
  if (anyAttributeBindings)
    descr.attributeBindings_ = attributeBindings;
  if (modelScope)
    descr.modelScope = modelScope;
  return descr;
}

/**
 * This creates a data structure containting the phantom bindings from a binding
 * description. This data structure looks enough like a DOM tree as needed by
 * the bindings (parentElement, templateScope_ and modelScope). Once the DOM is
 * ready this data structure is traversed and the bindings are transferred to
 * the DOM.
 * @param {Object} desc The binding description.
 * @param {Object} parent The parent element or phantom element.
 * @param {string} templateScope The template scope.
 * @return {object} An object similar to the binding description except that it
 *     has bindings in it.
 */
function createPhantomInstance(desc, parent, templateScope) {
  var phantom = {};
  for (var key in desc) {
    phantom[key] = createPhantomInstanceInner(desc[key], parent, templateScope);
  }
  return phantom;
}

function createPhantomInstanceInner(desc, parent, opt_templateScope) {
  var phantom = {
    parentElement: parent
  };

  if (opt_templateScope)
    phantom.templateScope_ = opt_templateScope;

  // This needs to happen first because the b.bindTo() below in
  // case: 'bindings_' depends on it being set properly.
  if ('modelScope' in desc) {
    phantom.modelScope = desc.modelScope;
  }

  for (var key in desc) {
    switch (key) {
      case 'placeHolderBindings_':
        phantom.bindings_ = phantom.bindings_ || {};
        for (var name in desc.placeHolderBindings_) {
          var b = phantom.bindings_[name] =
              new PlaceHolderBinding(desc.placeHolderBindings_[name]);
          b.sync_ = false;
          b.bindTo(phantom, name);
        }
        break;

      case 'attributeBindings_':
        phantom.bindings_ = phantom.bindings_ || {};
        for (var name in desc.attributeBindings_) {
          // This is a BindAttributeParser.Token
          var token = desc.attributeBindings_[name];
          var b;
          b = phantom.bindings_[name] = new AttributeBinding(token);
          b.sync_ = false;
          b.bindTo(phantom, name);
        }
        break;

      case 'modelScope':
        break; // Already done above. Ignore.

      default:
        phantom[key] = createPhantomInstanceInner(desc[key], phantom);
    }
  }

  return phantom;
}

function isIndex(s) {
  // toUint32: s >>> 0
  return s == String(s >>> 0);
}

/**
 * This transfers the temporary bindings to a node and its subtree.
 * @param {Node} node The node to transfer the bindings to.
 * @param {Object} phantom The object with the bindings.
 */
function transferBindingsToNode(node, phantom, templateScope) {
  if (!phantom) {
    // If no phantom bindings, we still need to ensure that the nodes have the
    // right templateScope.
    node.templateScope_ = templateScope;
    return;
  }

  // templateScope_ needs to be handled first because it can affect
  // the value of pathToOwner when bindings are bound to nodes.
  if ('templateScope_' in phantom)
    node.templateScope_ = phantom.templateScope_;

  for (var key in phantom) {
    if (key == 'bindings_') {
      node.bindings_ = node.bindings_ || {};
      for (var name in phantom.bindings_) {
        var b = node.bindings_[name] = phantom.bindings_[name];
        b.rebindTo(node);
        b.sync_ = true;
      }
    } else if (isIndex(key)) {
      transferBindingsToNode(node.childNodes[key], phantom[key]);
    }
  }
}

function cloneAndSeperateAttributeTemplate(templateElement) {
  var clone = templateElement.cloneNode(false);
  var attribs = templateElement.attributes;
  var count = attribs.length;
  while (count-- > 0) {
    var attrib = attribs[count];
    if (templateAttributeDirectives[attrib.name])
      clone.removeAttribute(attrib.name);
    else
      templateElement.removeAttribute(attrib.name);
  }

  return clone;
}

/**
 * Creates a snapshot of the DOM and binding descriptions for a template and
 * puts it on the iterator for that template.
 * @param {TemplateIterator} iterator
 */
function createSnapshot(iterator) {
  var templateElement = iterator.templateElement;

  var templateDomRoot = iterator.templateDom_ =
      templateElement.ownerDocument.createDocumentFragment();
  var bindings = iterator.bindingDescriptions_ = {};

  if (isAttributeTemplate(templateElement)) {
    // The template element is also a semantic element (e.g. <td>, <option>).
    // In the case, the "separated" semantic element (the element minus its
    // template-related directives) must be cloned and used as the root of
    // the templateDom.
    var newRoot = cloneAndSeperateAttributeTemplate(templateElement);
    templateDomRoot.appendChild(newRoot);
    templateDomRoot = newRoot;
    bindings[0] = buildBindingsRepresentation(newRoot) || {};
    bindings = bindings[0];
  }

  function recursiveExtract(template) {
    HTMLTemplateElement.decorate(template);
    // Getting the template iterator creates it if does not already exist.
    template.templateIterator;
  }

  var i = 0;
  while (templateElement.hasChildNodes()) {
    // Move original element to the snapshot document fragment.
    var child = templateDomRoot.appendChild(templateElement.firstChild);
    var b = buildBindingsRepresentation(child);
    if (b)
      bindings[i] = b
    i++;

    // Find template nodes and extract their DOM too.
    if (child.nodeType == Node.ELEMENT_NODE) {
      if (isTemplateElement(child)) {
        recursiveExtract(child);
      } else {
        // TODO(rafaelw): Consider speeding up: This will visit deeply nested
        // templates multiple times. This is currently ok because
        // HTMLTemplateElement.templateIterator exists early if it has already
        // snapshotted its templateDom & bindings.
        var templates = allTemplatesFromNode(child);
        forEach(templates, recursiveExtract);
      }
    }
  }
}

/**
 * Recursively removes all bindings from a DOM tree.
 * @param {Node} node The root of the tree to remove the bindings for.
 */
function removeBindings(node) {
  // TODO(arv): This should use the binding description to reduce DOM walking.
  for (var prop in node.bindings_) {
    node.removeBinding(prop);
  }

  for (var i = 0; i < node.childNodes.length; i++) {
    removeBindings(node.childNodes[i]);
  }
}

/**
 * Destructs all template iterators in a DOM tree.
 * @param {Node} node The root of the tree to destruct he templates for.
 */
function destructTemplates(node) {
  if (node.nodeType != Node.ELEMENT_NODE)
    return;

  function destructTemplate(el) {
    if (el.templateIterator_) {
      el.templateIterator_.destruct();
      el.templateIterator_ = undefined;
    }
  }

  // TODO(rafaelw): This is somewhat inefficient. Consider speeding up.
  // If there are nested templates, this will cause inner templates
  // to be visited multiple times.
  var templates = allTemplatesFromNode(node);
  for (var i = templates.length - 1; i >= 0; i--) {
    destructTemplate(templates[i]);
  }

  if (isTemplateElement(node))
    destructTemplate(node);
}

function inDocument(node) {
  return node.ownerDocument.compareDocumentPosition(node) &
      Node.DOCUMENT_POSITION_CONTAINED_BY;
}


/**
 * This represents a <template> element.
 * @constructor
 * @extends {HTMLElement}
 */
HTMLTemplateElement = function() {
  var el = document.createElement('template');
  HTMLTemplateElement.decorate(el);
  return el;
};

var hasProto = '__proto__' in {};

function copyOwnProperties(from, to) {
  Object.getOwnPropertyNames(from).forEach(function(name) {
    Object.defineProperty(to, name,
                          Object.getOwnPropertyDescriptor(from, name));
  });
}

HTMLTemplateElement.decorate = function(el) {
  if (el.templateIsDecorated_)
    return;

  // Note: because we need to treat some semantic elements as template elements
  // (like tr or td), but don't want to reassign their proto (gecko doesn't
  // like that), we copyOwnProperties for those elements.
  if (el.tagName == "TEMPLATE" && hasProto)
    el.__proto__ = HTMLTemplateElement.prototype;
  else
    copyOwnProperties(HTMLTemplateElement.prototype, el);
  el.decorate();
};

var htmlElement = this.HTMLUnknownElement || HTMLElement;

HTMLTemplateElement.prototype = createObject({
  // Gecko is more picky with the prototype than WebKit. Make sure to use the
  // same prototype as created in the constructor.
  __proto__: htmlElement.prototype,

  decorate: function() {
    this.templateIsDecorated_ = true;
    this.maybeApplyTemplate_();
  },

  get instantiate() {
    return this.getAttribute('instantiate');
  },

  set instantiate(instantiate) {
    var oldVal = this.instantiate;
    if (instantiate == null)
      this.removeAttribute('instantiate');
    else
      this.setAttribute('instantiate', instantiate);
    if (instantiate != oldVal) {
      this.removeAttribute('iterate');
      this.maybeApplyTemplate_();
    }
  },

  get iterate() {
    return this.getAttribute('iterate');
  },

  set iterate(iterate) {
    var oldVal = this.iterate;
    if (iterate == null)
      this.removeAttribute('iterate');
    else
      this.setAttribute('iterate', iterate);
    if (iterate != oldVal) {
      this.removeAttribute('instantiate');
      this.maybeApplyTemplate_();
    }
  },

  get ref() {
    var ref = this.getAttribute('ref');
    return ref ? this.ownerDocument.getElementById(ref) : null;
  },

  templateIterator_: null,

  get templateIterator() {
    // new TemplateIterator sets templateIterator_.
    return this.templateIterator_ || new TemplateIterator(this);
  },

  maybeApplyTemplate_: function() {
    // Templates that are not in the document should not yet be started.
    if (!inDocument(this))
      return;

    this.templateIterator.start();
  }
});


/**
 * The class responsible for building a template.
 * @param {HTMLTemplateElement} templateElement The template element this
 *     builds instances for.
 * @param {TemplateIterator=} opt_fromIterator This is used when the template
 *     iterator is created from another iterator so that we can reference the
 *     other iterators snapshot.
 * @constructor
 */
function TemplateIterator(templateElement, opt_fromIterator) {
  this.instancesToRemove_ = [];
  templateElement.templateIterator_ = this;
  this.templateElement = templateElement;

  this.boundHandleModelMutation = this.handleModelMutation.bind(this);
  this.boundHandleNewModel = this.handleNewModel.bind(this);

  if (opt_fromIterator) {
    this.templateDom_ = opt_fromIterator.templateDom;
    this.bindingDescriptions_ = opt_fromIterator.bindingDescriptions;
  } else {
    // Get these to get them to cache...
    this.templateDom;
    this.bindingDescriptions;
  }
}

function isIterateTemplate(iterator) {
  return iterator.templateElement.iterate !== null;
}

TemplateIterator.prototype = {
  firstInstance_: null,
  lastInstance_: null,
  instancesToRemove_: null,

  get templateDom() {
    if (this.templateDom_)
      return this.templateDom_;

    var ref = this.templateElement.ref;
    if (ref)
      return this.templateDom_ = ref.templateIterator.templateDom;

    createSnapshot(this);
    return this.templateDom_;
  },

  get bindingDescriptions() {
    if (this.bindingDescriptions_)
      return this.bindingDescriptions_;

    var ref = this.templateElement.ref;
    if (ref) {
      return this.bindingDescriptions_ =
          ref.templateIterator.bindingDescriptions;
    }

    createSnapshot(this);
    return this.bindingDescriptions_;
  },

  /**
   * Starts the iterator. At this point we
   */
  start: function() {
    if (!inDocument(this.templateElement))
      throw Error('Trying to start a template that is not in the document');

    // Setup bindingSource
    this.bindingSource = new BindingSource(undefined,  // source (default DOM)
                                           this.basePath,
                                           new IdentityTransform());
    this.bindingSource.bindTo(this.templateElement,
                              '',  // property (can safely be ignored)
                              this.boundHandleNewModel);
    // Begin observing model
    this.handleNewModel(this.bindingSource.value);
  },

  handleNewModel: function(model, oldModel) {
    var iterate = this.templateElement.iterate != null;
    var instantiate = this.templateElement.instantiate != null;

    if (oldModel)
      Model.stopObservingPropertySet(oldModel, this.boundHandleModelMutation);

    if (!iterate && !instantiate)
      this.rootModelChanged_(0);
    else if (isIterateTemplate(this))
      this.rootModelChanged_(model == null ? 0 : model.length);
    else if (oldModel === undefined || model === undefined)
      this.rootModelChanged_(model == undefined ? 0 : 1);

    if (model)
      Model.observePropertySet(model, this.boundHandleModelMutation);
  },

  rootModelChanged_: function(count) {
    this.clear();
    var templateElement = this.templateElement;
    var fullPath = Path.join(templateElement.templateScope_, this.basePath);

    for (var i = 0; i < count; i++) {
      var instance = new TemplateInstance(this,
                                          this.getInstancePath(fullPath, i));
      this.addInstance(instance);
    }

    this.syncDom_();
  },

  /**
   * The path on the template element. For instantiate template this reflects
   * the instantiate property of the template element and for iterate templates
   * this reflects the iterate property.
   * @type {string}
   */
  get basePath() {
    if (isIterateTemplate(this))
      return this.templateElement.iterate;
    return this.templateElement.instantiate;
  },

  /**
   * The path to use on an instance.
   * @param {string} base The computed path of the template.
   * @param {number} index The index of the instance. This is only used for
   *     iteration templates.
   */
  getInstancePath: function(base, index) {
    if (isIterateTemplate(this))
      return Path.join(base, index);
    return base;
  },

  /**
   * Removes the instance(s) that was created by this template.
   */
  clear: function() {
    var instance = this.firstInstance_;
    while (instance) {
      var current = instance;
      instance = instance.next;
      this.removeInstance(current);
    }
    this.firstInstance_ = null;
    this.lastInstance_ = null;
    this.syncDom_();
  },


  destruct: function() {
    this.clear();
    this.bindingSource.unbind();
    this.bindingSource = null;
  },

  /**
   * The last node that is managed by this iterator. This includes nodes that are
   * indirectly managed by this iterator due to nested templates.
   * @type {Node}
   */
  get lastManagedNode() {
    if (!this.lastInstance_)
      return this.templateElement;
    return this.lastInstance_.lastManagedNode;
  },

  addInstance: function(instance, beforeInstance) {
    // Update next/previous pointers.
    if (beforeInstance == null) {
      if (this.lastInstance_) {
        this.lastInstance_.next = instance;
        instance.previous = this.lastInstance_;
      }
      this.lastInstance_ = instance;

      if (!this.firstInstance_)
        this.firstInstance_ = instance;
    } else {
      if (beforeInstance.previous) {
        beforeInstance.previous.next = instance;
        instance.previous = beforeInstance.previous;
      }

      instance.next = beforeInstance;
      beforeInstance.previous = instance;

      if (beforeInstance == this.firstInstance_)
        this.firstInstance_ = instance;
    }
  },

  /**
   * Synchronizes the DOM of the instances.
   * @private
   */
  syncDom_: function() {
    // Remove instances from last to first so that their "previous" pointers
    // stay valid during iteration.
    for (var i = this.instancesToRemove_.length - 1; i >= 0; i--) {
      this.instancesToRemove_[i].syncDom();
    }
    this.instancesToRemove_ = [];

    for (var inst = this.firstInstance_; inst; inst = inst.next) {
      inst.syncDom();
    }
  },

  /**
   * Removes an instance. This marks the instance to be removed. The actual DOM
   * will get updated in the next call to syncDom.
   * @param {TemplateInstance} instance The instance to remove.
   */
  removeInstance: function(instance) {
    var previous = instance.previous;
    var next = instance.next;
    instance.remove();
    if (previous)
      previous.next = next;
    if (next)
      next.previous = previous;

    if (this.firstInstance_ == instance)
      this.firstInstance_ = next;
    if (this.lastInstance_ == instance)
      this.lastInstance_ = previous;

    this.instancesToRemove_.push(instance);
  },

  /**
   * @param {number} index The index where to get tne instance at.
   * @return {TemplateInstance} The instance at the given index or null if out
   *     bounds.
   */
  getInstanceAt: function(index) {
    var instance = this.firstInstance_;
    for (var i = 0; instance && i < index ; i++) {
      instance = instance.next;
    }

    return instance;
  },

  /**
   * Handles a mutation to the model. This only handles splice mutations.
   * @param {Object} c An object describing the change.
   */
  handleModelMutation: function(index, removed, addCount) {
    // TODO(arv): Detect when an item was removed and added in the same splice.
    // For example, arr.splice(0, 2, arr[1], arr[0]), moves two elements and
    // we should just move the DOM nodes.

    var removeCount = removed.length;

    // iterate to index
    var instance = this.getInstanceAt(index);

    // Remove
    for (var i = 0; i < removeCount; i++) {
      var current = instance;
      instance = instance.next;
      this.removeInstance(current);
    }

    var templateElement = this.templateElement;
    var fullPath = Path.join(templateElement.templateScope_, this.basePath);

    // Add
    for (var i = 0; i < addCount; i++) {
      var newInstance = new TemplateInstance(this, Path.join(fullPath, index));
      index++;
      this.addInstance(newInstance, instance);
    }

    if (addCount != removeCount) {
      // Update the bindings for the remaining elements.
      for (; instance; instance = instance.next) {
        instance.templateScope = Path.join(fullPath, index);
        index++;
      }
    }

    this.syncDom_();
  }
};

function createTemplateDelimiter() {
  return document.createComment('template-instance');
}

function isTemplateDelimiter(node) {
  return node.nodeType == Node.COMMENT_NODE &&
      node.textContent == 'template-instance';
}

/**
 * This represents a set of nodes that have been instantiated from a template
 * iterator.
 * @param {TemplateIterator} iterator The template iterator that owns this
 *     instance.
 * @param {string} templateScope The path from the parent of the template to the
 *     instance.
 * @constructor
 */
function TemplateInstance(iterator, templateScope) {
  this.templateIterator = iterator;
  this.templateScope_ = templateScope;

  var bindingDescriptions = iterator.bindingDescriptions;
  var parentNode = iterator.templateElement.parentNode;
  this.phantomBindings_ =
      createPhantomInstance(bindingDescriptions, parentNode, templateScope);
}

TemplateInstance.prototype = createObject({
  next: null,
  previous: null,

  domCreated_: false,
  dirtyTemplateScope_: false,
  removed_: false,
  phantomBindings_: null,

  get firstNode() {
    if (!this.previous)
      return this.templateIterator.templateElement.nextSibling;
    else
      return this.previous.lastManagedNode.nextSibling;
  },

  get lastNode() {
    return this.lastNode_;
  },

  /**
   * This returns the last node that is inside this instance or a template
   * owned by this instance.
   * @type {Node}
   */
  get lastManagedNode() {
    var node = this.lastNode;
    if (isTemplateElement(node)) {
      var iterator = node.templateIterator_;
      if (iterator)
        return iterator.lastManagedNode;
    }

    return node;
  },

  /**
   * Creates the DOM for the instance.
   * @private
   */
  createDom_: function() {
    var iterator = this.templateIterator;
    var templateElement = iterator.templateElement;
    var parentNode = templateElement.parentNode;
    var templateDom = iterator.templateDom;
    var templateScope = this.templateScope_;
    var bindingDescriptions = iterator.bindingDescriptions;

    var refNode;
    if (!this.previous)
      refNode = templateElement.nextSibling;
    else
      refNode = this.previous.lastManagedNode.nextSibling;

    var clone = templateDom.cloneNode(true);

    // Cloning does not forward the template iterator so we do it manually.
    var orgTemplates = allTemplatesFromNode(templateDom);
    var cloneTemplates = allTemplatesFromNode(clone);

    for (var i = 0; i < orgTemplates.length; i++) {
      HTMLTemplateElement.decorate(cloneTemplates[i]);
      // Assign a new template iterator which is a clone of the original template
      // iterator.
      new TemplateIterator(cloneTemplates[i], orgTemplates[i].templateIterator);
    }

    function buildNestedTemplate(template) {
      template.templateIterator.start();
    }

    for (var i = 0; clone.hasChildNodes(); i++) {
      var node = clone.removeChild(clone.firstChild);
      parentNode.insertBefore(node, refNode);
      transferBindingsToNode(node, this.phantomBindings_[i], templateScope);

      // Also init newly created template elements.
      if (isTemplateElement(node)) {
        buildNestedTemplate(node);
      } else if (node.nodeType == Node.ELEMENT_NODE) {
        // Note: this is not in danger of visiting deeply nested templates
        // since this instance is in the DOM and all templates in the DOM
        // will have had there prototype DOM lifted into their templateDom
        // property.
        var templates = allTemplatesFromNode(node);
        forEach(templates, buildNestedTemplate);
      }
    }

    var instanceTerminator = createTemplateDelimiter();
    parentNode.insertBefore(instanceTerminator, refNode);
    this.lastNode_ = instanceTerminator;

    // We don't need the phantom bindings any more.
    this.phantomBindings_ = null;

    this.dirtyTemplateScope_ = false;
    this.domCreated_ = true;
  },

  /**
   * Removes the instance from the DOM and removes the bindings.
   */
  remove: function() {
    // We don't clear previous at this point because we need to use
    // it during removeDom_ to find the first node of this instance.
    this.next = null;
    this.removed_ = true;
  },

  /**
   * Removes the actual DOM.
   * @private
   */
  removeDom_: function() {
    var parentNode = this.templateIterator.templateElement.parentNode;

    var node = this.firstNode;
    while (node && !isTemplateDelimiter(node)) {
      destructTemplates(node);
      // Note: We need to remove the bindings before extracting from the
      // document, otherwise the BindingSources will re-parent to the root
      // nodes of the instance and fire.
      removeBindings(node);
      var next = node.nextSibling;
      parentNode.removeChild(node);
      delete node.templateScope_;
      node = next;
    }
    if (node)
      parentNode.removeChild(node);
    this.previous = null;
  },

  set templateScope(templateScope) {
    if (this.phantomBindings_) {
      for (var key in this.phantomBindings_) {
        this.phantomBindings_[key].templateScope_ = templateScope;
      }
    }

    this.templateScope_ = templateScope;
    this.dirtyTemplateScope_ = true;
  },

  /**
   * Synchronizes the DOM of the instance. This creates the DOM nodes if needed,
   * updates the templateScope if needed and removes the DOM as needed.
   */
  syncDom: function() {
    if (this.removed_) {
      this.removeDom_();
      return;
    }

    if (!this.domCreated_)
      this.createDom_();

    if (this.dirtyTemplateScope_)
      this.updateTemplateScope_();
  },

  /**
   * Updates the |templateScope_| on all the nodes.
   * @private
   */
  updateTemplateScope_: function() {
    var templateScope = this.templateScope_;
    var node = this.firstNode;
    while (node && !isTemplateDelimiter(node)) {
      node.templateScope_ = templateScope;
      if (isTemplateElement(node) && node.templateIterator_)
        node = node.templateIterator_.lastManagedNode;
      node = node.nextSibling;
    }
    this.dirtyTemplateScope_ = false;
  }
});

this.HTMLTemplateElement = HTMLTemplateElement;
// Expose for testing
this.HTMLTemplateElement.allTemplatesSelectors = allTemplatesSelectors;

})();
