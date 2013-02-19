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

var AttributeKind = {
  UNKNOWN: 0,
  KNOWN: 1,
  BOOLEAN: 2,
  EVENT_HANDLER: 3
};

var getAttributeKind = (function() {

  // This is generated using data from:
  // http://simon.html5.org/html-elements
  var globalMap = {
    accesskey: true,
    'class': true,
    contenteditable: true,
    contextmenu: true,
    dir: true,
    draggable: true,
    dropzone: true,
    hidden: true,
    id: true,
    itemid: true,
    itemprop: true,
    itemref: true,
    itemscope: true,
    itemtype: true,
    lang: true,
    role: true,
    spellcheck: true,
    style: true,
    tabindex: true,
    title: true,
    translate: true
  };

  // This is generated using data from:
  // http://simon.html5.org/html-elements
  var eventHandlerMap = {
    onabort: true,
    onblur: true,
    oncanplay: true,
    oncanplaythrough: true,
    onchange: true,
    onclick: true,
    oncontextmenu: true,
    ondblclick: true,
    ondrag: true,
    ondragend: true,
    ondragenter: true,
    ondragleave: true,
    ondragover: true,
    ondragstart: true,
    ondrop: true,
    ondurationchange: true,
    onemptied: true,
    onended: true,
    onerror: true,
    onfocus: true,
    onformchange: true,
    onforminput: true,
    oninput: true,
    oninvalid: true,
    onkeydown: true,
    onkeypress: true,
    onkeyup: true,
    onload: true,
    onloadeddata: true,
    onloadedmetadata: true,
    onloadstart: true,
    onmousedown: true,
    onmousemove: true,
    onmouseout: true,
    onmouseover: true,
    onmouseup: true,
    onmousewheel: true,
    onpause: true,
    onplay: true,
    onplaying: true,
    onprogress: true,
    onratechange: true,
    onreset: true,
    onreadystatechange: true,
    onseeked: true,
    onseeking: true,
    onselect: true,
    onshow: true,
    onstalled: true,
    onsubmit: true,
    onsuspend: true,
    ontimeupdate: true,
    onvolumechange: true,
    onwaiting: true
  };

  // This is generated using data from:
  // http://simon.html5.org/html-elements
  var knownMap = {
    a: {
      href: true,
      target: true,
      ping: true,
      rel: true,
      media: true,
      hreflang: true,
      type: true
    },
    abbr: {},
    address: {},
    area: {
      alt: true,
      coords: true,
      shape: true,
      href: true,
      target: true,
      ping: true,
      rel: true,
      media: true,
      hreflang: true,
      type: true
    },
    article: {},
    aside: {},
    audio: {
      src: true,
      crossorigin: true,
      preload: true,
      autoplay: true,
      mediagroup: true,
      loop: true,
      muted: true,
      controls: true
    },
    b: {},
    base: {
      href: true,
      target: true
    },
    bdi: {},
    bdo: {},
    blockquote: {
      cite: true
    },
    body: {
      onafterprint: true,
      onbeforeprint: true,
      onbeforeunload: true,
      onblur: true,
      onerror: true,
      onfocus: true,
      onhashchange: true,
      onload: true,
      onmessage: true,
      onoffline: true,
      ononline: true,
      onpagehide: true,
      onpageshow: true,
      onpopstate: true,
      onresize: true,
      onscroll: true,
      onstorage: true,
      onunload: true
    },
    br: {},
    button: {
      autofocus: true,
      disabled: true,
      form: true,
      formaction: true,
      formenctype: true,
      formmethod: true,
      formnovalidate: true,
      formtarget: true,
      name: true,
      type: true,
      value: true
    },
    canvas: {
      width: true,
      height: true
    },
    caption: {},
    cite: {},
    code: {},
    col: {
      span: true
    },
    colgroup: {
      span: true
    },
    command: {
      type: true,
      label: true,
      icon: true,
      disabled: true,
      checked: true,
      radiogroup: true,
      command: true
    },
    data: {
      value: true
    },
    datalist: {
      option: true
    },
    dd: {},
    del: {
      cite: true,
      datetime: true
    },
    details: {
      open: true
    },
    dfn: {},
    div: {},
    dl: {},
    dt: {},
    em: {},
    embed: {
      src: true,
      type: true,
      width: true,
      height: true
    },
    fieldset: {
      disabled: true,
      form: true,
      name: true
    },
    figcaption: {},
    figure: {},
    footer: {},
    form: {
      'accept-charset': true,
      action: true,
      autocomplete: true,
      enctype: true,
      method: true,
      name: true,
      novalidate: true,
      target: true
    },
    h1: {},
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    h6: {},
    head: {},
    header: {},
    hgroup: {},
    hr: {},
    html: {
      manifest: true
    },
    i: {},
    iframe: {
      src: true,
      srcdoc: true,
      name: true,
      sandbox: true,
      seamless: true,
      width: true,
      height: true
    },
    img: {
      alt: true,
      src: true,
      crossorigin: true,
      usemap: true,
      ismap: true,
      width: true,
      height: true
    },
    input: {
      accept: true,
      alt: true,
      autocomplete: true,
      autofocus: true,
      checked: true,
      dirname: true,
      disabled: true,
      form: true,
      formaction: true,
      formenctype: true,
      formmethod: true,
      formnovalidate: true,
      formtarget: true,
      height: true,
      list: true,
      max: true,
      maxlength: true,
      min: true,
      multiple: true,
      name: true,
      pattern: true,
      placeholder: true,
      readonly: true,
      required: true,
      size: true,
      src: true,
      step: true,
      type: true,
      value: true,
      width: true
    },
    ins: {
      cite: true,
      datetime: true
    },
    kbd: {},
    keygen: {
      autofocus: true,
      challenge: true,
      disabled: true,
      form: true,
      keytype: true,
      name: true
    },
    label: {
      form: true,
      'for': true
    },
    legend: {},
    li: {
      value: true
    },
    link: {
      href: true,
      rel: true,
      media: true,
      hreflang: true,
      type: true,
      sizes: true
    },
    map: {
      name: true
    },
    mark: {},
    menu: {
      type: true,
      label: true
    },
    meta: {
      name: true,
      'http-equiv': true,
      content: true,
      charset: true
    },
    meter: {
      value: true,
      min: true,
      max: true,
      low: true,
      high: true,
      optimum: true
    },
    nav: {},
    noscript: {},
    object: {
      data: true,
      type: true,
      typemustmatch: true,
      name: true,
      usemap: true,
      form: true,
      width: true,
      height: true
    },
    ol: {
      reversed: true,
      start: true
    },
    optgroup: {
      disabled: true,
      label: true
    },
    option: {
      disabled: true,
      label: true,
      selected: true,
      value: true
    },
    output: {
      'for': true,
      form: true,
      name: true
    },
    p: {},
    param: {
      name: true,
      value: true
    },
    pre: {},
    progress: {
      value: true,
      max: true
    },
    q: {
      cite: true
    },
    rp: {},
    rt: {},
    ruby: {},
    s: {},
    samp: {},
    script: {
      src: true,
      async: true,
      defer: true,
      type: true,
      charset: true
    },
    section: {},
    select: {
      autofocus: true,
      disabled: true,
      form: true,
      multiple: true,
      name: true,
      required: true,
      size: true
    },
    small: {},
    source: {
      src: true,
      type: true,
      media: true
    },
    span: {},
    strong: {},
    style: {
      media: true,
      type: true,
      scoped: true
    },
    sub: {},
    summary: {},
    sup: {},
    table: {
      border: true
    },
    tbody: {},
    td: {
      colspan: true,
      rowspan: true,
      headers: true
    },
    textarea: {
      autofocus: true,
      cols: true,
      dirname: true,
      disabled: true,
      form: true,
      maxlength: true,
      name: true,
      placeholder: true,
      readonly: true,
      required: true,
      rows: true,
      wrap: true
    },
    tfoot: {},
    th: {
      colspan: true,
      rowspan: true,
      headers: true,
      scope: true
    },
    thead: {},
    time: {
      datetime: true,
      pubdate: true
    },
    title: {},
    tr: {},
    track: {
      'default': true,
      kind: true,
      label: true,
      src: true,
      srclang: true
    },
    u: {},
    ul: {},
    'var': {},
    video: {
      src: true,
      crossorigin: true,
      poster: true,
      preload: true,
      autoplay: true,
      mediagroup: true,
      loop: true,
      muted: true,
      controls: true,
      width: true,
      height: true
    },
    wbr: {}
  };

  // This is taken directly from the spec by searching for "boolean attribute"
  var booleanMap = {
    async: true,
    autofocus: true,
    autoplay: true,
    checked: true,
    controls: true,
    'default': true,
    defer: true,
    disabled: true,
    formnovalidate: true,
    hidden: true,
    ismap: true,
    itemscope: true,
    loop: true,
    multiple: true,
    muted: true,
    novalidate: true,
    open: true,
    pubdate: true,
    readonly: true,
    required: true,
    reversed: true,
    scoped: true,
    seamless: true,
    selected: true,
    truespeed: true
  };

  function getAttributeKind(tagName, name) {
    var lcName = name.toLowerCase();

    if (isEventHandler(lcName))
      return AttributeKind.EVENT_HANDLER;

    if (isGlobalAttribute(lcName) ||
        isKnownAttribute(tagName.toLowerCase(), lcName)) {
      if (isBooleanAttribute(lcName))
        return AttributeKind.BOOLEAN;
      return AttributeKind.KNOWN;
    }

    return AttributeKind.UNKNOWN;
  }

  function isGlobalAttribute(lcName) {
    if (lcName in globalMap)
      return true;

    // aria-*
    // data-*
    return /^aria-|data-/.test(lcName);
  }

  function isEventHandler(lcName) {
    if (!/^on./.test(lcName))
      return false;

    return lcName in eventHandlerMap;
  }

  function isKnownAttribute(lcTagName, lcName) {
    if (!(lcTagName in knownMap))
      return false;

    return lcName in knownMap[lcTagName];
  }

  function isBooleanAttribute(name) {
    return name in booleanMap;
  }

  return getAttributeKind;
})();
