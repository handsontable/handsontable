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

// Only exposed for testing.
function BindingSource(source, path, transform) {
  this.source = source;
  this.path = new Path(path);
  this.sourceName = this.path.length > 0 ?
      this.path.get(this.path.length - 1) : '';
  this.transform = transform || new IdentityTransform();
}

function Binding(source, path, transform) {
  if (arguments.length < 3 && typeof source == 'string') {
    transform = path;
    path = source;
    source = undefined;
  }
  this.sources_ = [new BindingSource(source, path, transform)];
}

function PlaceHolderBinding(tokenString) {
  this.tokenString_ = tokenString;
}

function AttributeBinding(token) {
  switch (token.type) {
    case 'dep':
      this.deps_ = [token.value];
      break;
    case 'expr':
      this.deps_ = token.value.deps;
      this.func_ = token.value.func;
      break;
    default:
      throw Error('Unknown token type ' + token.type);
  }
}

(function() {

var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

var bindAttributeParser = new BindAttributeParser;

function isObject(obj) {
  return obj === Object(obj);
}

Object.defineProperty(HTMLElement.prototype, 'bind', {
  get: function() {
    return this.getAttribute('bind') || '';
  },
  set: function(value) {
    this.setAttribute('bind', value);
    var tokens = bindAttributeParser.parse(value);
    tokens.forEach(function(token) {
      this.addBinding(token.property, new AttributeBinding(token));
    }, this);
  },
  configurable: true,
  enumerable: true
});

document.addEventListener('DOMContentLoaded', function(e) {
  var boundElements = document.querySelectorAll(':not(template) [bind]');
  forEach(boundElements, function(elt) {
    elt.bind = elt.getAttribute('bind');
  });
}, false);

document.addEventListener('DOMNodeInserted', function(e) {
  // Webkit seems to fire DOMNodeInserted for Text and Comment nodes.
  if (e.target.nodeType !== Node.ELEMENT_NODE)
    return;
  if (e.target.hasAttribute('bind'))
    e.target.bind = e.target.getAttribute('bind');
}, false);

var placeHolderParser = new PlaceHolderParser;

function prepareNewBinding(binding) {
  // TODO(arv): Do we want to support this coercion? Should the getter return
  // the string?
  if (typeof binding == 'string')
    return new PlaceHolderBinding(binding);

  return binding;
}

function addBinding(property, binding) {
  // Don't unbind, then bind again the same binding. It'll cause the transform
  // fire.
  if (this.bindings_ &&
      this.bindings_[property] &&
      this.bindings_[property] === binding) {
    return;
  }

  this.removeBinding(property, !!binding);

  if (binding) {
    this.bindings_[property] = prepareNewBinding(binding);
    this.bindings_[property].bindTo(this, property);
  }
}

function removeBinding(property, aboutToRebind) {
  if (!this.bindings_) {
    this.bindings_ = {};
    return;
  }

  if (this.bindings_[property]) {
    this.bindings_[property].unbind();
    delete this.bindings_[property];

    // This is the last binding, so we need to clear modelOwner cache
    // all the way to bindingOwner because we can no longer be sure
    // that anyone is listener.
    if (!aboutToRebind && Object.keys(this.bindings_).length == 0)
      clearModelOwnerAndPathCache(this);
  }
}

HTMLElement.prototype.addBinding = addBinding;
HTMLElement.prototype.removeBinding = removeBinding;
Text.prototype.addBinding = addBinding;
Text.prototype.removeBinding = removeBinding;

Object.defineProperty(Text.prototype, 'binding', {
  get: function() {
    return this.bindings_['textContent'];
  },
  set: function(binding) {
    this.addBinding('textContent', binding);
  },
  configurable: true,
  enumerable: true
});

function isBindableInputProperty(type, property) {
  switch (type) {
    case 'checkbox':
    case 'radio':
      return property == 'checked';
    case 'select-multiple':
    case 'select-one':
      return property == 'value' || property == 'selectedIndex';
    default:
      return property == 'value';
  }
}

function getEventForInputType(type) {
  switch (type) {
    case 'checkbox':
      return 'click';
    case 'radio':
    case 'select-multiple':
    case 'select-one':
      return 'change';
    default:
      return 'input';
  }
}

function bindsTwoWay(element) {
  return (element instanceof HTMLInputElement) ||
      (element instanceof HTMLSelectElement) ||
      (element instanceof HTMLTextAreaElement);
}

function sourceIsDOMNode(source) {
  return source && 'parentElement' in source;
}

function isNodeInDocument(node) {
  var doc = node.ownerDocument;
  while (node.parentNode) {
    node = node.parentNode;
  }
  return node === doc;
}

// |element| is assumed to be an HTMLInputElement with |type| == 'radio'.
// Returns an array containing all radio buttons other than |element| that
// have the same |name|, either in the form that |element| belongs to or,
// if no form, in the document tree to which |element| belongs.
//
// This implementation is based upon the HTML spec definition of a
// "radio button group":
//   http://www.whatwg.org/specs/web-apps/current-work/multipage/number-state.html#radio-button-group
//
function getAssociatedRadioButtons(element) {
  if (!isNodeInDocument(element))
    return [];
  var filter = Array.prototype.filter.call.bind(Array.prototype.filter);
  if (element.form) {
    return filter(element.form.elements, function(el) {
      return el != element &&
          el instanceof HTMLInputElement &&
          el.type == 'radio' &&
          el.name == element.name;
    });
  } else {
    var radios = element.ownerDocument.querySelectorAll(
        'input[type="radio"][name="' + element.name + '"]');
    return filter(radios, function(el) {
      return el != element && !el.form;
    });
  }
}

function addBindingSourceToModelOwner(element, bindingSource) {
  if (!element)
    return;
  if (!element.boundSources_) {
    element.boundSources_ = [bindingSource];
    return;
  }

  var index = element.boundSources_.indexOf(bindingSource);
  if (index >= 0)
    return;

  element.boundSources_.push(bindingSource);
}

function removeBindingSourceFromModelOwner(element, bindingSource) {
  if (!element || !element.boundSources_)
    return;
  var index = element.boundSources_.indexOf(bindingSource);
  if (index < 0)
    return;
  element.boundSources_.splice(index, 1);
  if (element.boundSources_.length == 0)
    element.boundSources_ = null;
}

BindingSource.prototype = {
  source: null,
  path: null,

  toString: function() {
    return JSON.stringify({ source: this.source, path: this.path });
  },

  bindTo: function(target, property, callback, ignoreModelScope) {
    this.target = target;
    this.property = property;
    // We need a locally bound function in case our binding has multiple
    // sources observing at the same path.
    var self = this;
    this.callback = function(value, oldValue) {
      if (self.observation.value === value)
        return;
      self.observation.value = value;
      callback(value, oldValue);
    };
    this.ignoreModelScope = ignoreModelScope;
    this.resetPaths();
  },

  rebindTo: function(target) {
    this.target = target;
  },

  unbind: function() {
    if (this.observation) {
      Model.stopObserving(this.observation.source,
                          this.observation.path,
                          this.callback);
      this.observation = undefined;
    }

    if (this.modelOwner) {
      removeBindingSourceFromModelOwner(this.modelOwner, this);
      this.modelOwner = null;
    }

    this.target = null;
    this.callback = null;
  },

  resetPaths: function(ownerCacheToken) {
    var source = this.source || this.target;
    var path = this.path;

    // Model source isn't DOM-bound
    if (this.path.isNamed || !sourceIsDOMNode(source)) {
      // Already listening. Non-DOM-bound models don't change path.
      if (this.observation)
        return;

      if (this.path.isNamed) {
        source = this.target.ownerDocument.models;
        path = path.forwardPath;
      }
    } else {
      // DOM-bound model.
      var ownerAndPath = getModelOwnerAndPath(source,
                                              false,  // ignoreLocalScope
                                              this.ignoreModelScope,
                                              ownerCacheToken);
      source = ownerAndPath[0];

      // Joining the owner path and this.path will properly handle the case
      // where this.path is absolute or relative.
      path = Path.join(ownerAndPath[1], this.path);

      // Use path.forwardPath here because 'model' is essentially 'above'
      // the root, so if fullPath is absolute, we wouldn't want to loose the
      // 'model' portion of the effectivePath.
      path = Path.join('model', path.forwardPath);

      // TOOD(rafaelw): Error in some reasonable way.
      if (!path.valid || path.ancestorLevels > 0)
        path = new Path;

      var oldOwner = this.modelOwner;
      this.modelOwner = source;

      if (oldOwner && oldOwner != this.modelOwner) {
        removeBindingSourceFromModelOwner(oldOwner, this);
        addBindingSourceToModelOwner(this.modelOwner, this);
      } else if (!oldOwner) {
        // This bindingSource has never been attached.
        addBindingSourceToModelOwner(this.modelOwner, this);
      }

      this.pathToOwner = path;
    }

    if (this.observation) {
      Model.stopObserving(this.observation.source,
                          this.observation.path,
                          this.callback);

    }
    var newValue = Model.observe(source, path, this.callback);
    this.observation = this.observation || {};
    this.observation.source = source;
    this.observation.path = path;

    if (this.observation.hasOwnProperty('value') &&
        this.observation.value !== newValue)
      this.callback.call(null, newValue, this.observation.value);
    else
      this.observation.value = newValue; // Happens on first-time bind.
                                         // Binding.bindTo triggers
                                         // dependencyChanged
  },

  get value() {
    var value;
    try {
      value = this.transform.toTarget(this.observation.value,
                                      this.sourceName,
                                      this.target,
                                      this.property);
    } catch (ex) {
      console.error('Uncaught exception within binding: ', ex);
    }

    return value;
  },

  set value(newValue) {
    var value;
    try {
      value = this.transform.toSource(newValue,
                                      this.sourceName,
                                      this.target,
                                      this.property);
    } catch (ex) {
      console.error('Uncaught exception within binding: ', ex);
    }

    this.observation.value = value;

    var source = this.observation.source;
    var property = this.observation.path;

    if (property.length == 0)
      return; // Can't assign to an object with no path.

    if (property.length > 1) {
      source = Model.getValueAtPath(source, property.slice(0, property.length - 1));
      property = property.slice(property.length - 1);
    }

    if (!isObject(source))
      return; // Can't assign to a scalar.

    source[property.toString()] = value;
  }
}

var JS_PROP = 1;
var ATTR = 2;
var BOOL_ATTR = 3;

function getPropertyKind(object, name) {
  if (object instanceof Element) {
    var lcName = name.toLowerCase();
    var kind = getAttributeKind(object.tagName, name);
    switch (kind) {
      case (AttributeKind.BOOLEAN):
        if (lcName == 'checked')
          return JS_PROP;
        return BOOL_ATTR;

      case (AttributeKind.KNOWN):
        if (lcName == 'value')
          return JS_PROP;
        return ATTR;

      case (AttributeKind.EVENT_HANDLER):
      case (AttributeKind.UNKNOWN):
        return JS_PROP;
    }
  }

  return JS_PROP;
}

/**
 * Converts a name to a camle case name.
 * @param {string} name The name to camel case.
 * @return {string} The camel cased name
 */
function getPropertyName(name) {
  return name.replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
}

function setProperty(object, name, value) {
  if (object && name) {
    var kind = getPropertyKind(object, name);
    switch (kind) {
      case JS_PROP:
        object[getPropertyName(name)] = value;
        break;
      case BOOL_ATTR:
        if (value)
          object.setAttribute(name, '');
        else
          object.removeAttribute(name);
        break;
      case ATTR:
        if (value === undefined)
          object.removeAttribute(name);
        else
          object.setAttribute(name, value);
        break;
    }
  }
}

function getProperty(object, name) {
  if (object && name) {
    var kind = getPropertyKind(object, name);
    switch (kind) {
      case JS_PROP:
        return object[getPropertyName(name)];
      case ATTR:
        return object.getAttribute(name);
      case BOOL_ATTR:
        return object.hasAttribute(name);
    }
  }
}

Binding.prototype = {
  sync__: true,
  dirty_: false,

  set sync_(sync_) {
    if (this.sync__ == sync_)
      return;

    this.sync__ = sync_;
    if (this.dirty_)
      this.dependencyChanged();
  },

  get sources() {
    return this.sources_;
  },

  get isTwoWay() {
    return this.target_ &&
           bindsTwoWay(this.target_) &&
           isBindableInputProperty(this.target_.type, this.property_);
  },

  maybeSetupTwoWayBinding: function() {
    if (this.isTwoWay) {
      if (!this.boundTargetChanged_) {
        this.boundTargetChanged_ = this.targetChanged.bind(this);
      }

      this.target_.addEventListener(getEventForInputType(this.target_.type),
                                    this.boundTargetChanged_,
                                    false);
    }
  },

  /**
   * Binds the binding to the targets model and property.
   * @param {HTMLElement|TextNode} target The node that has the model.
   * @param {string} property Name of the property to observe.
   */
  bindTo: function(target, property) {
    this.target_ = target;
    this.property_ = property;
    if (!this.boundDependencyChanged)
      this.boundDependencyChanged = this.dependencyChanged.bind(this);

    var ignoreModelScope = this.property_ == 'modelScope';
    this.sources.forEach(function(source) {
      source.bindTo(this.target_, this.property_, this.boundDependencyChanged,
                    ignoreModelScope);
    }, this);

    // Execute the transform now.
    this.dependencyChanged();

    this.maybeSetupTwoWayBinding();
  },

  rebindTo: function(target) {
    this.target_ = target;
    this.sources.forEach(function(source) {
      source.rebindTo(target);
    });
    this.maybeSetupTwoWayBinding();
  },

  unbind: function() {
    this.sources.forEach(function(source) {
      source.unbind();
    });

    if (this.isTwoWay) {
      this.target_.removeEventListener(getEventForInputType(this.target_.type),
                                      this.boundTargetChanged_,
                                      false);
    }

    this.target_ = null;
    this.property_ = null;
  },

  dependencyChanged: function() {
    if (!this.sync__) {
      this.dirty_ = true;
      return;
    }

    var args = this.sources.map(function(source) {
      try {
        return source.value;
      } catch (ex) {
        console.error('Uncaught exception within binding: ', ex);
        return undefined;
      }
    });

    var output;
    try {
      output = this.format.apply(this, args);
    } catch (ex) {
      console.error('Uncaught exception within binding: ', ex);
    }

    // This target is always a value of a DOM node. In general assigning
    // undefined to a DOM node value isn't of any use. null has the effect
    // of removing an attribute, so we just assume that undefined is null
    // for the DOM's purposes.
    if (output === undefined)
      output = null;

    setProperty(this.target_, this.property_, output);
  },

  /**
   * Callback for when the target changed. This is used for two way binding,
   * such as when the value changes in a text input.
   */
  targetChanged: function() {
    var newValue;
    try {
      newValue = this.parse(getProperty(this.target_, this.property_));
    } catch (ex) {
      console.error('Uncaught exception within binding: ', ex);
    }

    var sources = this.sources;

    // It's unclear how much sense it makes to "push" values to more than
    // one source model path, but for now, we say that it's well defined
    // for the first path and undefined for any subsequent paths (no value
    // pushed back). One possibility is that parse() could return a map of
    // path => parsedValue. This would allow (for instance) PlaceHolderParser
    // to attempt to token match and parse out multiple values.
    if (sources.length == 0)
      return;

    sources[0].value = newValue;

    if (this.target_ instanceof HTMLInputElement &&
        this.target_.type == 'radio' &&
        newValue) {
      getAssociatedRadioButtons(this.target_).forEach(function(r) {
        if (r.bindings_ &&
            r.bindings_.checked &&
            r.bindings_.checked.sources &&
            r.bindings_.checked.sources.length &&
            r.bindings_.checked.sources[0].value) {
          // Set the value directly to avoid an infinite call stack.
          r.bindings_.checked.sources[0].value = false;
        }
      });
    }

    // We need to run the work queue so that changes to the affected model
    // can be picked up.
    // TODO(rafaelw): If the platform finally implements something like the
    // window.notifyObservers, it will cause the following issue:
    // HTMLInputElements will optimistically update its "view" on UI input.
    // If script (say listening to the same event we are) later "rejects" the
    // update by setting the value back, the observation semantics won't detect
    // any change, but nothing will tell the input that it assumption failed.
    // This will cause element_bindings:testInputElementTextBinding() to fail.
    // Fix this when we implement "observation contexts" which can have a
    // a finalize step.
    Model.dirtyCheck();
  },

  format: function() {
    if (arguments.length == 0)
      return undefined;
    if (arguments.length == 1)
      return arguments[0];

    return Array.prototype.join.call(arguments, ', ');
  },

  parse: function(value) {
    return value;
  }
};

PlaceHolderBinding.prototype = createObject({
  __proto__: Binding.prototype,

  get sources() {
    if (this.sources_)
      return this.sources_;

    if (!this.tokens_)
      this.tokens_ = placeHolderParser.parse(this.tokenString_);

    var sources = [];
    function push(dep) {
      var transform = Transform.create(dep.transformName, dep.transformArgs);
      sources.push(new BindingSource(undefined, dep.path, transform));
    }

    this.tokens_.forEach(function(token) {
      var type = token.type;
      var value = token.value;
      if (type == 'dep')
        push(value);
      else if (type == 'expr')
        value.deps.forEach(push);
    });

    this.sources_ = sources;
    return this.sources_;
  },

  format: function() {
    var args = Array.prototype.slice.apply(arguments);

    if (!this.tokens_)
      this.tokens_ = placeHolderParser.parse(this.tokenString_);

    var results = this.tokens_.map(function(token) {
      var type = token.type;
      var value = token.value;
      if (type == 'text')
        return value;

      if (type == 'expr') {
        var expressionArguments = args.splice(0, value.deps.length);
        return value.func.apply(this.target_, expressionArguments);
      }

      return args.shift();
    }, this);

    // If we got a single result pass it along without doing a toString
    // coercion.
    // TODO(arv): Treat null/undefined as '' for strings?
    if (results.length == 1)
      return results[0];

    return results.join('');
  }
});

AttributeBinding.prototype = createObject({
  __proto__: Binding.prototype,

  get sources() {
    if (this.sources_)
      return this.sources_;

    var sources = [];
    this.deps_.forEach(function(dep) {
      var transform = Transform.create(dep.transformName, dep.transformArgs);
      sources.push(new BindingSource(undefined, dep.path, transform));
    });

    this.sources_ = sources;
    return this.sources_;
  },

  format: function() {
    var args = Array.prototype.slice.apply(arguments);
    if (this.func_) {
      var expressionArguments = args.splice(0, this.deps_.length);
      return this.func_.apply(this.target_, expressionArguments);
    }
    if (args.length == 1)
      return args[0];

    // NOTE: this should never happen, non-expr AttributeBindings only have
    // a single BindingSource.
    return args.join(',');
  }
});

})();
