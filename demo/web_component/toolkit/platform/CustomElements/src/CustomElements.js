/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * Implements `document.register`
 * @module CustomElements
*/

/**
 * Polyfilled extensions to the `document` object.
 * @class Document
*/

(function(scope) {

scope = scope || {flags:{}};

/**
 * Registers a custom tag name with the document.
 *
 * When a registered element is created, a `readyCallback` method is called
 * in the scope of the element. The `readyCallback` method can be specified on
 * either `inOptions.prototype` or `inOptions.lifecycle` with the latter taking
 * precedence.
 *
 * @method register
 * @param {String} inName The tag name to register. Must include a dash ('-'),
 *    for example 'x-component'.
 * @param {Object} inOptions
 *    @param {String} [inOptions.extends]
 *      (_off spec_) Tag name of an element to extend (or blank for a new
 *      element). This parameter is not part of the specification, but instead
 *      is a hint for the polyfill because the extendee is difficult to infer.
 *      Remember that the input prototype must chain to the extended element's
 *      prototype (or HTMLElement.prototype) regardless of the value of
 *      `extends`.
 *    @param {Object} inOptions.prototype The prototype to use for the new
 *      element. The prototype must inherit from HTMLElement.
 *    @param {Object} [inOptions.lifecycle]
 *      Callbacks that fire at important phases in the life of the custom
 *      element.
 *
 * @example
 *      FancyButton = document.register("fancy-button", {
 *        extends: 'button',
 *        prototype: Object.create(HTMLButtonElement.prototype, {
 *          readyCallback: {
 *            value: function() {
 *              console.log("a fancy-button was created",
 *            }
 *          }
 *        })
 *      });
 * @return {Function} Constructor for the newly registered type.
 */
function register(inName, inOptions) {
  //console.warn('document.register("' + inName + '", ', inOptions, ')');
  // construct a defintion out of options
  // TODO(sjmiles): probably should clone inOptions instead of mutating it
  var definition = inOptions || {};
  if (!inName) {
    // TODO(sjmiles): replace with more appropriate error (Erik can probably
    // offer guidance)
    throw new Error('Name argument must not be empty');
  }
  // record name
  definition.name = inName;
  // must have a prototype, default to an extension of HTMLElement
  // TODO(sjmiles): probably should throw if no prototype, check spec
  if (!definition.prototype) {
    // TODO(sjmiles): replace with more appropriate error (Erik can probably
    // offer guidance)
    throw new Error('Options missing required prototype property');
  }
  // ensure a lifecycle object so we don't have to null test it
  definition.lifecycle = definition.lifecycle || {};
  // build a list of ancestral custom elements (for native base detection)
  // TODO(sjmiles): we used to need to store this, but current code only
  // uses it in 'resolveTagName': it should probably be inlined
  definition.ancestry = ancestry(definition.extends);
  // extensions of native specializations of HTMLElement require localName
  // to remain native, and use secondary 'is' specifier for extension type
  resolveTagName(definition);
  // some platforms require modifications to the user-supplied prototype
  // chain
  resolvePrototypeChain(definition);
  // 7.1.5: Register the DEFINITION with DOCUMENT
  registerDefinition(inName, definition);
  // 7.1.7. Run custom element constructor generation algorithm with PROTOTYPE
  // 7.1.8. Return the output of the previous step.
  definition.ctor = generateConstructor(definition);
  definition.ctor.prototype = definition.prototype;
  // blanket upgrade (?)
  document.upgradeElements();
  return definition.ctor;
}

function ancestry(inExtends) {
  var extendee = registry[inExtends];
  if (extendee) {
    return ancestry(extendee.extends).concat([extendee]);
  }
  return [];
}

function resolveTagName(inDefinition) {
  // if we are explicitly extending something, that thing is our
  // baseTag, unless it represents a custom component
  var baseTag = inDefinition.extends;
  // if our ancestry includes custom components, we only have a
  // baseTag if one of them does
  for (var i=0, a; (a=inDefinition.ancestry[i]); i++) {
    baseTag = a.is && a.tag;
  }
  // our tag is our baseTag, if it exists, and otherwise just our name
  inDefinition.tag = baseTag || inDefinition.name;
  if (baseTag) {
    // if there is a base tag, use secondary 'is' specifier
    inDefinition.is = inDefinition.name;
  }
}

function resolvePrototypeChain(inDefinition) {
  // TODO(sjmiles): contains ShadowDOM polyfill pollution
  // if we don't support __proto__ we need to locate the native level
  // prototype for precise mixing in
  if (!Object.__proto__) {
    if (inDefinition.is) {
      // for non-trivial extensions, work out both prototypes
      //var inst = domCreateElement(inDefinition.tag);
      var inst = document.createElement(inDefinition.tag);
      var native = Object.getPrototypeOf(inst);
    } else {
      // otherwise, use the default
      native = HTMLElement.prototype;
    }
  }
  // cache this in case of mixin
  inDefinition.native = native;
}

// SECTION 4

function instantiate(inDefinition) {
  // 4.a.1. Create a new object that implements PROTOTYPE
  // 4.a.2. Let ELEMENT by this new object
  //
  // the custom element instantiation algorithm must also ensure that the
  // output is a valid DOM element with the proper wrapper in place.
  //
  return upgrade(domCreateElement(inDefinition.tag), inDefinition);
}

function upgrade(inElement, inDefinition) {
  // make 'element' implement inDefinition.prototype
  implement(inElement, inDefinition);
  // some definitions specify an 'is' attribute
  if (inDefinition.is) {
    inElement.setAttribute('is', inDefinition.is);
  }
  // flag as upgraded
  inElement.__upgraded__ = true;
  // we require child nodes be upgraded before ready
  upgradeElements(inElement);
  // lifecycle management
  lifecycle(inElement, inDefinition);
  // OUTPUT
  return inElement;
}

function implement(inElement, inDefinition) {
  // prototype swizzling is best
  if (Object.__proto__) {
    inElement.__proto__ = inDefinition.prototype;
  } else {
    // where above we can re-acquire inPrototype via
    // getPrototypeOf(Element), we cannot do so when
    // we use mixin, so we install a magic reference
    customMixin(inElement, inDefinition.prototype, inDefinition.native);
    inElement.__proto__ = inDefinition.prototype;
  }
}

function customMixin(inTarget, inSrc, inNative) {
  // TODO(sjmiles): 'used' allows us to only copy the 'youngest' version of
  // any property. This set should be precalculated. We also need to
  // consider this for supporting 'super'.
  var used = {};
  // start with inSrc
  var p = inSrc;
  // sometimes the default is HTMLUnknownElement.prototype instead of
  // HTMLElement.prototype, so we add a test
  // the idea is to avoid mixing in native prototypes, so adding
  // the second test is WLOG
  while (p !== inNative && p !== HTMLUnknownElement.prototype) {
    var keys = Object.getOwnPropertyNames(p);
    for (var i=0, k; k=keys[i]; i++) {
      if (!used[k]) {
        Object.defineProperty(inTarget, k,
            Object.getOwnPropertyDescriptor(p, k));
        used[k] = 1;
      }
    }
    p = Object.getPrototypeOf(p);
  }
}

function lifecycle(inElement, inDefinition) {
  // attach insert|removeCallback to respective events
  listenInsertRemove(inElement, inDefinition);
  // attach MutationObserver to listen for attribute changes
  listenAttributes(inElement, inDefinition);
  // invoke readyCallback
  callback('readyCallback', inDefinition, inElement);
}

var MO = window.MutationObserver || window.WebKitMutationObserver 
    || window.JsMutationObserver;
if (!MO) {
  console.warn("no mutation observer support");
}  

function listenAttributes(inElement, inDefinition) {
  if (MO) {
    var observer = new MO(function(mutations) {
      mutations.forEach(function(mx) {    
        if (mx.type === 'attributes') {
          callback('attributeChangedCallback', inDefinition, inElement, 
              [mx.attributeName, mx.oldValue]);
        }
      })
    });
    // TODO(sjmiles): ShadowDOMPolyfill Intrusion
    if (window.ShadowDOMPolyfill && inElement.impl) {
      inElement = ShadowDOMPolyfill.unwrap(inElement);
    }
    observer.observe(inElement, {attributes: true, attributeOldValue: true});
  }
  return observer;
}

function listenInsertRemove(inElement, inDefinition) {
  var listen = function(inType, inCallbackName) {
    inElement.addEventListener(inType, function(inEvent) {
      if (inEvent.target === inElement) {
        inEvent.stopPropagation();
        callback(inCallbackName, inDefinition, inElement);
      }
    }, false);
  };
  listen('DOMNodeInserted', 'insertedCallback');
  listen('DOMNodeRemoved', 'removedCallback');
}

var emptyArgs = [];
function callback(inName, inDefinition, inElement, inArgs) {
  var cb = inDefinition.lifecycle[inName] || inElement[inName];
  if (cb) {
    cb.apply(inElement, inArgs || emptyArgs);
  }
}

// element registry (maps tag names to definitions)

var registry = {};
var registrySlctr = '';

function registerDefinition(inName, inDefinition) {
  registry[inName] = inDefinition;
  registrySlctr += (registrySlctr ? ',' : '');
  if (inDefinition.extends) {
    registrySlctr += inDefinition.tag + '[is=' + inDefinition.is + '],';
  }
  registrySlctr += inName;
}

function generateConstructor(inDefinition) {
  return function() {
    return instantiate(inDefinition);
  };
}

function createElement(inTag) {
  var definition = registry[inTag];
  if (definition) {
    return new definition.ctor();
  }
  return domCreateElement(inTag);
}

/**
 * Upgrade an element to a custom element. Upgrading an element
 * causes the custom prototype to be applied, an `is` attribute to be attached
 * (as needed), and invocation of the `readyCallback`.
 * `upgradeElement` does nothing is the element is already upgraded, or
 * if it matches no registered custom tag name.
 *
 * @method ugpradeElement
 * @param {Element} inElement The element to upgrade.
 * @return {Element} The upgraded element.
 */
function upgradeElement(inElement) {
  if (!inElement.__upgraded__ && (inElement.nodeType === Node.ELEMENT_NODE)) {
    var type = inElement.getAttribute('is') || inElement.localName;
    var definition = registry[type];
    return definition && upgrade(inElement, definition);
  }
}

/**
 * Upgrade all elements under `inRoot` that match selector `inSlctr`.
 * causes the custom prototype to be applied, an `is` attribute to be attached
 * (as needed), and invocation of the `readyCallback`.
 * `upgradeElement` does nothing is the element is already upgraded, or
 * if it matches no registered custom tag name.
 *
 * @method ugpradeElements
 * @param {Node} inRoot The root of the DOM subtree in which elements are to
 *  be upgraded.
 * @param {String} [inSlctr] An optional selector for matching specific
 * elements, otherwise all register element types are upgraded.
 */
function upgradeElements(inRoot, inSlctr) {
  var root = inRoot || document;
  if (root.querySelectorAll) {
    var slctr = inSlctr || registrySlctr;
    if (slctr) {
      var nodes = root.querySelectorAll(slctr);
      forEach(nodes, upgradeElement);
    }
  }
}

// utilities

var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

function watchDOM(inRoot) {
  domObserver.observe(inRoot, {childList: true, subtree: true});
}

// capture native createElement before we override it
var domCreateElement = document.createElement.bind(document);

// exports

document.register = document.webkitRegister || document.register;

if (!document.register || scope.flags.register !== 'native') {
  if (MO) {
    var domObserver = new MO(function(mutations) {
      mutations.forEach(function(mx) {
        if (mx.type == 'childList') {
          forEach(mx.addedNodes, function(n) {
            // this node may need upgrade (if so, subtree is upgraded here)
            if (!upgradeElement(n)) {
              // or maybe not, but then the subtree may need upgrade
              upgradeElements(n);
            }
          });
        }
      })
    });
  }
  document.register = register;
  document.createElement = createElement; // override
  document.upgradeElement = upgradeElement;
  document.upgradeElements = upgradeElements;
  document.watchDOM = watchDOM;
} else {
  var nop = function() {};
  document.upgradeElement = nop;
  document.upgradeElements = nop;
  document.watchDOM = nop;
}

})(window.CustomElements);
