/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

scope = scope || {};

// imports

var CustomDOMElements = scope.CustomDOMElements;
var path = scope.ComponentDocuments.path;
var componentLoader = scope.ComponentDocuments.loader.componentLoader;

// debuggable script injection
//
// this technique allows the component scripts to be
// viewable and debuggable in inspector scripts
// tab (each script is named "(program)" unless
// the user-agent supports source maps).

var context;

// invoke inScript in inContext scope
var inject = function(inScript, inContext, inName, inSourceUrl) {
  // set (highlander) context
  context = inContext;
  // compose script
  var code = "componentScript('" 
    + inName 
    + "', function(){"
    + inScript 
    + "});"
    + "\n//@ sourceURL=" + inSourceUrl + "\n"
  ;
  scope.ComponentDocuments.parser.injectScript(code);
};

// global necessary for script injection
window.componentScript = function(inName, inFunc) {
  inFunc.call(context);
};

// Custom DOM Elements SECTION 7.2

window.HTMLElementElement = function(inElement) {
  this.element = inElement;
  this.name = inElement.getAttribute("name");
  this.constructorName = inElement.getAttribute("constructor");
  this.extendsName = inElement.getAttribute("extends") || "div";
  this.template = inElement.querySelector("template");
  // TODO(sjmiles): ad hoc polyfill for <template> element
  this.template = elementParser.normalizeTemplate(this.template);
  this.generatedConstructor = function() {
    return this.instantiate();
  }
  if (!this.name) {
    console.error('name attribute is required.');
    return;
  }
  this.register(inElement);
};

HTMLElementElement.prototype = {
  lifecycle: function(inLifecycle) {
    this.lifecycleImpl = inLifecycle;
  },
  instantiate: function() {
    return CustomDOMElements.instantiate(this.prototype, this.template,
      this.lifecycleImpl);
  },
  register: function(element) {
    // fix css paths for inline style elements
    elementParser.adjustTemplateCssPaths(element, this.template);
    elementParser.adjustTemplateAttrPaths(element, this.template);
    // load component stylesheets
    elementParser.sheets(element, this.template);
    // ensure all style tags are scoped.
    elementParser.scopeStyles(element, this.template);
    // apply @host styles.
    elementParser.applyHostStyles(this.template, this.name);
    //
    // to register a custom element, I need
    //
    //  prototype
    //  lifcycle
    //  template
    //
    // I have template right away
    //
    // I don't get lifecycle or prototype until
    // executing user's code
    //
    // so, execute user's code right away
    //
    // but user may want to cache the reference to generatedConstructor
    // so I have to make a 'real one', but I cannot use the canonical
    // constructor-generation algorithm because I am missing pieces
    //
    // Gambit: make a custom generatedConstructor that binds
    // to an object that is filled in later (instead of
    // a closure)
    //
    // evaluate components scripts
    //
    elementParser.scripts(element, this);
    //
    // now we have the user supplied prototype and lifecycle
    //console.log("registering", this.name);
    //console.log(this.generatedConstructor.prototype);
    //console.log(this.lifecycleImpl);
    //
    // we need to reprocess the prototype (cheating because
    // prototype is not a property defintion object as called for
    // by the spec; it happens to work now due CustomDOMElements is
    // implemented to take a regular map)
    //
    this.prototype = CustomDOMElements.generatePrototype(this.extendsName,
      this.generatedConstructor.prototype);
    // TODO(sjmiles): putting name on prototype not in spec
    this.prototype.is = this.name;
    //
    // can't use canonical register method because we've already
    // generated a constructor
    //
    // we almost implement 'definition', except for lifecycleImpl
    //
    var definition = {
      name: this.name,
      path: elementParser.calcElementPath(element),
      prototype: this.prototype,
      template: this.template,
      lifecycle: this.lifecycleImpl || {}
    };
    CustomDOMElements.addDefinition(this.name, definition);
    CustomDOMElements.upgradeElements(document, definition);
    //
    // optionally install the constructor on the global object
    if (this.constructorName) {
      window[this.constructorName] = this.generatedConstructor;
    }
  }
};

var URL_ATTRS = ['href', 'src', 'action'];
var URL_ATTRS_SELECTOR = '[' + URL_ATTRS.join('],[') + ']';
var URL_TEMPLATE_SEARCH = '{{.*}}';

var elementParser = {
  parse: function(element) {
    new HTMLElementElement(element);
  },
  scripts: function(element, htmlElementElement) {
    // accumulate all script content from the element declaration
    var script = [];
    forEach($$(element, "script"), function(s) {
      script.push(s.textContent);
    });
    // if there is any code, inject it
    if (script.length) {
      inject(script.join(';\n'), htmlElementElement, htmlElementElement.name,
        htmlElementElement.element.ownerDocument.name);
    }
  },
  normalizeTemplate: function(inTemplate) {
    if (inTemplate && !inTemplate.content) {
      HTMLTemplateElement.decorate(inTemplate);
    }
    return inTemplate;
  },
  adjustTemplateCssPaths: function(element, template) {
    if (template) {
      var docUrl = path.documentUrlFromNode(element);
      forEach($$(template.content, "style"), function(s) {
        s.textContent = this.makeCssUrlsRelative(s.textContent, docUrl);
      }.bind(this));
    }
  },
  makeCssUrlsRelative: function(inCssText, inBaseUrl) {
    return inCssText.replace(/url\([^)]*\)/g, function(inMatch) {
      // find the url path, ignore quotes in url string
      var urlPath = inMatch.replace(/["']/g, "").slice(4, -1);
      urlPath = path.resolveUrl(inBaseUrl, urlPath);
      urlPath = path.makeRelPath(document.URL, urlPath);
      return "url(" + urlPath + ")";
    });
  },
  calcElementPath: function(element) {
    var docUrl = path.documentUrlFromNode(element);
    return path.makeRelPath(document.URL, path.urlToPath(docUrl));
  },
  adjustTemplateAttrPaths: function(element, template) {
    if (template) {
      var docUrl = path.documentUrlFromNode(element);
      this._adjustTemplateAttrPaths(template, docUrl);
    }
  },
  _adjustTemplateAttrPaths: function(template, inUrl) {
    var templateContent = template.content || template;
    // search for attributes that host urls in templates
    forEach($$(templateContent, URL_ATTRS_SELECTOR), function(n) {
      URL_ATTRS.forEach(function(v) {
        var attr = n.attributes[v];
        if (attr && attr.value && (attr.value.search(URL_TEMPLATE_SEARCH) < 0)) {
          attr.value = path.resolveUrl(inUrl, attr.value);
        }
      });
    }.bind(this));
    // now search for templates in templates
    forEach($$(templateContent, 'template'), function(n) {
      this._adjustTemplateAttrPaths(n, inUrl);
    }.bind(this));
  },
  sheets: function(element, template) {
    var sheet = [];
    if (template) {
      //console.group("sheets");
      forEach($$(element, "link[rel=stylesheet]"), function(s) {
        var styles = componentLoader.fetch(s);
        styles = this.makeCssUrlsRelative(styles, path.nodeUrl(s));
        sheet.push(styles);
      }.bind(this));
      if (sheet.length) {
        //console.log("sheets found (", sheet.length, "), injecting");
        var style = document.createElement("style");
        style.style.display = "none !important;";
        style.innerHTML = sheet.join('');
        template.content.appendChild(style);
      }
      //console.groupEnd();
    }
  },
  scopeStyles: function(element, template) {
    if (template) {
      forEach($$(template.content, "style"), function(s) {
        s.setAttribute("scoped", "");
      });
    }
  },
  hostRe:/(@host[^{]*)({[\s\S]*?})/gim,
  mediaRe: /(@media[^{]*)(({[\s\S]*?}[\s\S]*?)*)}/gim,
  applyHostStyles: function(template, name) {
    // strategy: apply a rule for each @host rule with @host replaced with
    // the component name into a stylesheet added at the top of head (so it's
    // least specific)
    if (template) {
      forEach($$(template.content, "style"), function(s) {
        // in lieu of parser, do a 2-step regexp for media queries...
        // process media query based rules and isolate
        var mediaCss = this.calcMediaStyles(s.textContent, name);
        // process other host rules
        var cssText = s.textContent.replace(this.mediaRe, '');
        var hostCss = this.calcHostStyles(cssText, name);
        this.addComponentsRule(hostCss);
        // add media rules last
        this.addComponentsRule(mediaCss);
      }, this);
    }
  },
  calcMediaStyles: function(inCssText, inName) {
    var rules = [], matches, innerCss;
    while (matches = this.mediaRe.exec(inCssText)) {
      innerCss = this.calcHostStyles(matches[2], inName);
      rules.push(matches[1] + '{\n' + innerCss + '\n}\n');
    }
    return rules.join('\n');
  },
  calcHostStyles: function(inCssText, inName) {
    var rules = [], matches;
    while (matches = this.hostRe.exec(inCssText)) {
      rules.push(this.convertHostRules(matches[1], inName) + " "
       + matches[2]);
    }
    return rules.join('\n');
  },
  // convert e.g. @host to x-foo, [is=x-foo]
  convertHostRules: function(selectors, name) {
    var o=[], parts = selectors.split(',');
    var h = '@host';
    parts.forEach(function(p) {
      if (p.indexOf(h) >= 0) {
        var r = p.trim();
        o.push(r.replace(h, name));
      }
    });
    return o.join(", ");
  },
  addComponentsRule: function(inCssText) {
    if (inCssText) {
      this.getComponentsSheet().appendChild(document.createTextNode(inCssText));
    }
  },
  // support for creating @host rules
  getComponentsSheet: function() {
    if (!this.componentsSheet) {
      this.componentsSheet = document.createElement("style");
      // make sure stylesheets aren't rendered
      this.addComponentsRule('style { display: none !important; }\n');
      //this.insertComponentsSheet();
    }
    return this.componentsSheet;
  },
  insertComponentsSheet: function() {
    document.head.insertBefore(this.getComponentsSheet(), document.head.children[0]);
  }
};

var elementUpgrader = {
  initialize: function() {
    this._upgradeElements = CustomDOMElements.upgradeElements;
    CustomDOMElements.upgradeElements = nop;
  },
  go: function() {
    elementParser.insertComponentsSheet();
    CustomDOMElements.upgradeElements = this._upgradeElements;
    CustomDOMElements.upgradeAll(document);
    CustomDOMElements.watchDOM(document);
    
  }
};

// exports

scope.CustomDOMElements.elementParser = elementParser;
scope.CustomDOMElements.elementUpgrader = elementUpgrader;

})(window.__exported_components_polyfill_scope__);