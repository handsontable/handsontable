/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/*
  This is a limited shim for shadowDOM css styling.
  https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles
  
  The intention here is to support only the styling features which can be 
  relatively simply implemented. The goal is to allow users to avoid the 
  most obvious pitfalls and do so without compromising performance significantly. 
  For shadowDOM styling that's not covered here, a set of best practices
  can be provided that should allow users to accomplish more complex styling.

  The following is a list of specific shadowDOM styling features and a brief
  discussion of the approach used to shim.

  Shimmed features:

  * @host: ShadowDOM allows styling of the shadowRoot's host element using the 
  @host rule. To shim this feature, the @host styles are reformatted and 
  prefixed with a given scope name and promoted to a document level stylesheet.
  For example, given a scope name of .foo, a rule like this:
  
    @host {
      * {
        background: red;
      }
    }
  
  becomes:
  
    .foo {
      background: red;
    }
  
  * functional encapsultion: Styles defined within shadowDOM, apply only to 
  dom inside the shadowDOM. To shim this feature, non-@host rules within 
  style elements are prefixed with a given scope name. Thus, they apply via
  a descendent selector to the dom inside the shadowRoot.
  For example, given a scope name of .foo, a rule like this:
  
    div {
      font-weight: bold;
    }
  
  becomes:
  
    .foo div {
      font-weight: bold;
    }
  
  Unaddressed shadowDOM styling features:
  
  * upper/lower bound encapsulation: Styles which are defined outside a
  shadowRoot should not cross the shadowDOM boundary and should not apply
  inside a shadowRoot.

  This styling behavior is not emulated. Some possible ways to do this that 
  were rejected due to complexity and/or performance concerns include: (1) reset
  every possible property for every possible selector for a given scope name;
  (2) re-implement css in javascript.
  
  As an alternative, users should make sure to use selectors
  specific to the scope in which they are working.
  
  * ::distributed: This behavior is not emulated. It's often not necessary
  to style the contents of a specific insertion point and instead, descendants
  of the host element can be styled selectively. Users can also create an 
  extra node around an insertion point and style that node's contents
  via descendent selectors. For example, with a shadowRoot like this:
  
    <style>
      content::-webkit-distributed(div) {
        background: red;
      }
    </style>
    <content></content>
  
  could become:
  
    <style>
      / *@polyfill .content-container div * / 
      content::-webkit-distributed(div) {
        background: red;
      }
    </style>
    <div class="content-container">
      <content></content>
    </div>
  
  Note the use of @polyfill in the comment above a shadowDOM specific style
  declaration. This is a directive to the styling shim to use the selector 
  in comments in lieu of the next selector when running under polyfill.
  
  * ::pseudo: This behavior is not emulated. Users can create an extra 
  rule to target the pseudo node directly. Given a shadowRoot like this:
  
    <div pseudo="x-special">Special</div>
  
  This can be styled using native and polyfilled shadowDOM as follows:
  
    / *@polyfill x-foo [pseudo=x-special] * /
    x-foo::x-special {
      color: orange;
    }
*/
(function(scope) {

var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
var concat = Array.prototype.concat.call.bind(Array.prototype.concat);
var slice = Array.prototype.slice.call.bind(Array.prototype.slice);

var stylizer = {
  hostRuleRe: /@host[^{]*{(([^}]*?{[^{]*?}[\s\S]*?)+)}/gim,
  selectorRe: /([^{]*)({[\s\S]*?})/gim,
  hostFixableRe: /^[.\[:]/,
  cssCommentRe: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim, 
  cssPolyfillCommentRe: /\/\*@polyfill ([^*]*\*+([^/*][^*]*\*+)*\/)([^{]*?){/gim, 
  selectorReSuffix: '([>\\s~+\[.,{:][\\s\\S]*)?$',
  hostRe: /@host/gim,
  cache: {},
  shimStyling: function(inElementElement) {
    if (window.ShadowDOMPolyfill) {
      // use caching to make working with styles nodes easier and to facilitate
      // lookup of extendee
      stylizer.cacheDefinition(inElementElement);
      stylizer.shimShadowDOMStyling(inElementElement.styles, 
        inElementElement.options.name);
    }
  },
  // Shim styles to be placed inside a shadowRoot.
  // 1. shim @host rules and inherited @host rules
  // 2. shim scoping: apply .scoped when available or pseudo-scoping when not 
  // (e.g. a selector 'div' becomes 'x-foo div')
  shimShadowDOMStyling: function(inStyles, inScope) {
    if (window.ShadowDOMPolyfill) {
      stylizer.shimPolyfillDirectives(inStyles, inScope);
      stylizer.shimAtHost(inStyles, inScope);
      stylizer.shimScoping(inStyles, inScope);
    }
  },
  //TODO(sorvell): use SideTable
  cacheDefinition: function(inElementElement) {
    var name = inElementElement.options.name;
    var template = inElementElement.querySelector('template');
    var content = template && templateContent(template);
    var styles = content && content.querySelectorAll('style');
    inElementElement.styles = styles ? slice(styles) : [];
    inElementElement.templateContent = content;
    stylizer.cache[name] = inElementElement;
  },
  /*
   * Process styles to convert native ShadowDOM rules that will trip
   * up the css parser; we rely on decorating the stylesheet with comments.
   * 
   * For example, we convert this rule:
   * 
   * (comment start) @polyfill @host g-menu-item (comment end)
   * shadow::-webkit-distributed(g-menu-item) {
   * 
   * to this:
   * 
   * scopeName g-menu-item {
   *
  **/
  shimPolyfillDirectives: function(inStyles, inScope) {
    if (inStyles) {
      forEach(inStyles, function(s) {
        s.textContent = this.convertPolyfillDirectives(s.textContent, inScope);
      }, this);
    }
  },
  // form: @host { .foo { declarations } }
  // becomes: scopeName.foo { declarations }
  shimAtHost: function(inStyles, inScope) {
    var styles = this.findAtHostStyles(inStyles, inScope);
    if (styles) {
      var cssText = this.convertAtHostStyles(styles, inScope);
      this.addCssToDocument(cssText);
    }
  },
  /* Ensure styles are scoped. Pseudo-scoping takes a rule like:
   * 
   *  .foo {... } 
   *  
   *  and converts this to
   *  
   *  scopeName .foo { ... }
  */
  shimScoping: function(inStyles, inScope) {
    if (inStyles) {
      this.applyPseudoScoping(inStyles, inScope);
    }
  },
  convertPolyfillDirectives: function(inCssText, inScope) {
    var r = '', cssText = inCssText, l = 0, matches;
    while (matches=this.cssPolyfillCommentRe.exec(cssText)) {
      r += cssText.substring(l, matches.index);
      // remove end comment delimiter (*/)
      r += matches[1].slice(0, -2) + '{';
      l = this.cssPolyfillCommentRe.lastIndex;
    }
    r += cssText.substring(l, cssText.length);
    return r;
  },
  findAtHostStyles: function(inStyles, inScope) {
    var styles = inStyles;
    var definition = this.cache[inScope];
    var shadow = definition.templateContent && 
      definition.templateContent.querySelector('shadow');
    if (shadow) {
      var extendee = this.findExtendee(inScope);
      if (extendee) {
        var extendeeName = extendee.options.name;
        var extendeeStyles = this.findAtHostStyles(extendee.styles, extendeeName);
        styles = concat(slice(extendeeStyles), slice(styles));
      }
    }
    return styles;
  },
  findExtendee: function(inScope) {
    var elt = this.cache[inScope];
    return elt && this.cache[elt.options.extends];
  },
  // consider styles that do not include component name in the selector to be
  // unscoped and in need of promotion; 
  // for convenience, also consider keyframe rules this way.
  findAtHostRules: function(cssRules, inMatcher) {
    return Array.prototype.filter.call(cssRules, this.isHostRule.bind(this, inMatcher));
  },
  isHostRule: function(inMatcher, cssRule) {
    return (cssRule.selectorText && cssRule.selectorText.match(inMatcher)) ||
      (cssRule.cssRules && this.findAtHostRules(cssRule.cssRules, inMatcher).length) ||
      (cssRule.type == CSSRule.WEBKIT_KEYFRAMES_RULE);
  },
  convertAtHostStyles: function(inStyles, inScope) {
    var cssText = this.stylesToCssText(inStyles);
    var r = '', l=0, matches;
    while (matches=this.hostRuleRe.exec(cssText)) {
      r += cssText.substring(l, matches.index);
      r += this.scopeHostCss(matches[1], inScope);
      l = this.hostRuleRe.lastIndex;
    }
    r += cssText.substring(l, cssText.length);
    var selectorRe = new RegExp('^' + inScope + this.selectorReSuffix, 'm');
    var cssText = this.rulesToCss(this.findAtHostRules(this.cssToRules(r),
      selectorRe));
    return cssText;
  },
  scopeHostCss: function(cssText, inScope) {
    var r = '', matches;
    while (matches = this.selectorRe.exec(cssText)) {
      r += this.scopeHostSelector(matches[1], inScope) +' ' + matches[2] + '\n\t';
    }
    return r;
  },
  scopeHostSelector: function(selector, inScope) {
    var r = [], parts = selector.split(',');
    parts.forEach(function(p) {
      p = p.trim();
      // selector: * -> name
      if (p.indexOf('*') >= 0) {
        p = p.replace('*', inScope);   
      // selector: .foo -> name.foo, [bar] -> name[bar]
      } else if (p.match(this.hostFixableRe)) {
        p = inScope + p;
      }
      r.push(p);
    }, this);
    return r.join(', ');
  },
  applyPseudoScoping: function(inStyles, inScope) {
    forEach(inStyles, function(s) {
      if (s.parentNode) {
        s.parentNode.removeChild(s);
      }
    });
    // TODO(sorvell): remove @host rules (use cssom rather than regex?)
    var cssText = this.stylesToCssText(inStyles).replace(this.hostRuleRe, '');
    var rules = this.cssToRules(cssText);
    this.pseudoScopeRules(rules, inScope);
    var cssText = this.rulesToCss(rules);
    this.addCssToDocument(cssText);
  },
  // change a selector like 'div' to 'name div'
  pseudoScopeRules: function(cssRules, inScope) {
    forEach(cssRules, function(rule) {
      if (rule.selectorText) {
        rule.selectorText = this.pseudoScopeSelector(rule.selectorText, inScope);
      } else if (rule.cssRules) {
        this.pseudoScopeRules(rule.cssRules, inScope);
      }
    }, this);
  },
  pseudoScopeSelector: function(selector, name) {
    var r = [], parts = selector.split(',');
    parts.forEach(function(p) {
      r.push(name + ' ' + p.trim());
    });
    return r.join(', ');
  },
  stylesToCssText: function(inStyles, inPreserveComments) {
    var cssText = '';
    forEach(inStyles, function(s) {
      cssText += s.textContent + '\n\n';
    });
    // strip comments for easier processing
    if (!inPreserveComments) {
      cssText = this.stripCssComments(cssText);
    }
    return cssText;
  },
  stripCssComments: function(inCssText) {
    return inCssText.replace(this.cssCommentRe, '');
  },
  cssToRules: function(inCssText) {
    var style = document.createElement('style');
    style.textContent = inCssText;
    document.head.appendChild(style);
    var rules = style.sheet.cssRules;
    style.parentNode.removeChild(style);
    return rules;
  },
  rulesToCss: function(inRules) {
    for (var i=0, css=[]; i < inRules.length; i++) {
      css.push(inRules[i].cssText);
    }
    return css.join('\n\n');
  },
  addCssToDocument: function(inCssText) {
    if (inCssText) {
      this.getSheet().appendChild(document.createTextNode(inCssText));
    }
  },
  // support for creating @host rules
  getSheet: function() {
    if (!this.sheet) {
      this.sheet = document.createElement("style");
    }
    return this.sheet;
  },
  apply: function() {
    this.addCssToDocument('style { display: none !important; }\n');
    // TODO(sorvell): change back to insertBefore when ShadowDOM polyfill
    // supports this.
    document.head.appendChild(this.getSheet());
    //document.head.insertBefore(this.getSheet(), doc.head.children[0]);
  }
};

document.addEventListener('WebComponentsReady', function() {
  stylizer.apply();
})

// exports
Toolkit.shimStyling = stylizer.shimStyling;
Toolkit.shimShadowDOMStyling = stylizer.shimShadowDOMStyling;

})(window);