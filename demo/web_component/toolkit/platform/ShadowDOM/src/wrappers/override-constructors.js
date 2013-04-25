// Copyright 2013 The Toolkitchen Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var isWrapperFor = scope.isWrapperFor;

  Object.getOwnPropertyNames(scope.wrappers).forEach(function(name) {
    window[name] = scope.wrappers[name]
  });

  // This is a list of the elements we currently override the global constructor
  // for.
  var elements = {
    'a': 'HTMLAnchorElement',
    'applet': 'HTMLAppletElement',
    'area': 'HTMLAreaElement',
    'audio': 'HTMLAudioElement',
    'br': 'HTMLBRElement',
    'base': 'HTMLBaseElement',
    'body': 'HTMLBodyElement',
    'button': 'HTMLButtonElement',
    'canvas': 'HTMLCanvasElement',
    // 'command': 'HTMLCommandElement',  // Not fully implemented in Gecko.
    'dl': 'HTMLDListElement',
    'datalist': 'HTMLDataListElement',
    'dir': 'HTMLDirectoryElement',
    'div': 'HTMLDivElement',
    'embed': 'HTMLEmbedElement',
    'fieldset': 'HTMLFieldSetElement',
    'font': 'HTMLFontElement',
    'form': 'HTMLFormElement',
    'frame': 'HTMLFrameElement',
    'frameset': 'HTMLFrameSetElement',
    'hr': 'HTMLHRElement',
    'head': 'HTMLHeadElement',
    'h1': 'HTMLHeadingElement',
    'html': 'HTMLHtmlElement',
    'iframe': 'HTMLIFrameElement',

    // Uses HTMLSpanElement in Firefox.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=843881
    // 'image',

    'input': 'HTMLInputElement',
    'li': 'HTMLLIElement',
    'label': 'HTMLLabelElement',
    'legend': 'HTMLLegendElement',
    'link': 'HTMLLinkElement',
    'map': 'HTMLMapElement',
    // 'media', Covered by audio and video
    'menu': 'HTMLMenuElement',
    'menuitem': 'HTMLMenuItemElement',
    'meta': 'HTMLMetaElement',
    'meter': 'HTMLMeterElement',
    'del': 'HTMLModElement',
    'ol': 'HTMLOListElement',
    'object': 'HTMLObjectElement',
    'optgroup': 'HTMLOptGroupElement',
    'option': 'HTMLOptionElement',
    'output': 'HTMLOutputElement',
    'p': 'HTMLParagraphElement',
    'param': 'HTMLParamElement',
    'pre': 'HTMLPreElement',
    'progress': 'HTMLProgressElement',
    'q': 'HTMLQuoteElement',
    'script': 'HTMLScriptElement',
    'select': 'HTMLSelectElement',
    'source': 'HTMLSourceElement',
    'span': 'HTMLSpanElement',
    'style': 'HTMLStyleElement',
    'caption': 'HTMLTableCaptionElement',
    // WebKit and Moz are wrong:
    // https://bugs.webkit.org/show_bug.cgi?id=111469
    // https://bugzilla.mozilla.org/show_bug.cgi?id=848096
    // 'td': 'HTMLTableCellElement',
    'col': 'HTMLTableColElement',
    'table': 'HTMLTableElement',
    'tr': 'HTMLTableRowElement',
    'thead': 'HTMLTableSectionElement',
    'tbody': 'HTMLTableSectionElement',
    'textarea': 'HTMLTextAreaElement',
    'title': 'HTMLTitleElement',
    'ul': 'HTMLUListElement',
    'video': 'HTMLVideoElement',
  };

  function overrideConstructor(tagName) {
    var nativeConstructorName = elements[tagName];
    var nativeConstructor = window[nativeConstructorName];
    if (!nativeConstructor)
      return;
    var element = document.createElement(tagName);
    var wrapperConstructor = element.constructor;
    window[nativeConstructorName] = wrapperConstructor;
  }

  Object.keys(elements).forEach(overrideConstructor);

  // Export for testing.
  scope.knownElements = elements;

})(this.ShadowDOMPolyfill);