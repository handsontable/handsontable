/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {

var IMPORT_LINK_TYPE = 'import';

// highlander object represents a primary document (the argument to 'parse')
// at the root of a tree of documents

var HTMLImports = {
  documents: {},
  preloadSelectors: [
    'link[rel=' + IMPORT_LINK_TYPE + ']',
    'script[src]',
    'link[rel=stylesheet]'
  ].join(','),
  load: function(inDocument, inNext) {
    // construct a loader instance
    loader = new Loader(HTMLImports.loaded, inNext);
    // alias the loader cache (for debugging)
    HTMLImports.cache = loader.cache;
    // add nodes from document into loader queue
    HTMLImports.preload(inDocument);
  },
  preload: function(inDocument) {
    // all preloadable nodes in inDocument
    var nodes = inDocument.querySelectorAll(HTMLImports.preloadSelectors);
    // only load imports from the main document
    // TODO(sjmiles): do this by altering the selector list instead
    if (inDocument === document) {
      nodes = Array.prototype.filter.call(nodes, function(n) {
        return isDocumentLink(n);
      });
    }
    // add these nodes to loader's queue
    loader.addNodes(nodes);
  },
  loaded: function(inUrl, inElt, inResource) {
    if (isDocumentLink(inElt)) {
      var document = HTMLImports.documents[inUrl];
      // if we've never seen a document at this url
      if (!document) {
        // generate an HTMLDocument from data
        document = makeDocument(inResource, inUrl);
        // resolve resource paths relative to host document
        path.resolvePathsInHTML(document);
        // cache document
        HTMLImports.documents[inUrl] = document;
        // add nodes from this document to the loader queue
        HTMLImports.preload(document);
      }
      // store document resource
      inElt.content = inElt.__resource = document;
    } else {
      inElt.__resource = inResource;
      // resolve stylesheet resource paths relative to host document
      if (isStylesheetLink(inElt)) {
        path.resolvePathsInStylesheet(inElt);
      }
    }
  }
};

function isDocumentLink(inElt) {
  return isLinkRel(inElt, IMPORT_LINK_TYPE);
}

function isStylesheetLink(inElt) {
  return isLinkRel(inElt, 'stylesheet');
}

function isLinkRel(inElt, inRel) {
  return (inElt.localName === 'link' && inElt.getAttribute('rel') === inRel);
}

function inMainDocument(inElt) {
  return inElt.ownerDocument === document ||
    // TODO(sjmiles): ShadowDOMPolyfill intrusion
    inElt.ownerDocument.impl === document;
}

function makeDocument(inHTML, inUrl) {
  // create a new HTML document
  var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
  // cache the new document's source url
  doc._URL = inUrl;
  // establish a relative path via <base>
  var base = doc.createElement('base');
  base.setAttribute('href', document.baseURI);
  doc.head.appendChild(base);
  // install html
  doc.body.innerHTML = inHTML;
  return doc;
}

var loader;

var Loader = function(inOnLoad, inOnComplete) {
  this.onload = inOnLoad;
  this.oncomplete = inOnComplete;
  this.inflight = 0;
  this.pending = {};
  this.cache = {};
};

Loader.prototype = {
  addNodes: function(inNodes) {
    // number of transactions to complete
    this.inflight += inNodes.length;
    // commence transactions
    forEach(inNodes, this.require, this);
    // anything to do?
    this.checkDone();
  },
  require: function(inElt) {
    var url = path.nodeUrl(inElt);
    // TODO(sjmiles): ad-hoc
    inElt.__nodeUrl = url;
    // deduplication
    if (!this.dedupe(url, inElt)) {
      // fetch this resource
      this.fetch(url, inElt);
    }
  },
  dedupe: function(inUrl, inElt) {
    if (this.pending[inUrl]) {
      // add to list of nodes waiting for inUrl
      this.pending[inUrl].push(inElt);
      // don't need fetch
      return true;
    }
    if (this.cache[inUrl]) {
      // complete load using cache data
      this.onload(inUrl, inElt, loader.cache[inUrl]);
      // finished this transaction
      this.tail();
      // don't need fetch
      return true;
    }
    // first node waiting for inUrl
    this.pending[inUrl] = [inElt];
    // need fetch (not a dupe)
    return false;
  },
  fetch: function(inUrl, inElt) {
    xhr.load(inUrl, function(err, resource) {
      this.receive(inUrl, inElt, err, resource);
    }.bind(this));
  },
  receive: function(inUrl, inElt, inErr, inResource) {
    if (!inErr) {
      loader.cache[inUrl] = inResource;
    }
    loader.pending[inUrl].forEach(function(e) {
      if (!inErr) {
        this.onload(inUrl, e, inResource);
      }
      this.tail();
    }, this);
    loader.pending[inUrl] = null;
  },
  tail: function() {
    --this.inflight;
    this.checkDone();
  },
  checkDone: function() {
    if (!this.inflight) {
      this.oncomplete();
    }
  }
};

var path = {
  nodeUrl: function(inNode) {
    return path.resolveUrl(document.URL, path.hrefOrSrc(inNode));
  },
  hrefOrSrc: function(inNode) {
    return inNode.getAttribute("href") || inNode.getAttribute("src");
  },
  documentUrlFromNode: function(inNode) {
    var url = path.getDocumentUrl(inNode.ownerDocument);
    // take only the left side if there is a #
    url = url.split('#')[0];
    return url;
  },
  getDocumentUrl: function(inDocument) {
    return inDocument &&
        // TODO(sjmiles): ShadowDOMPolyfill intrusion
        (inDocument._URL || (inDocument.impl && inDocument.impl._URL)
            || inDocument.URL)
                || '';
  },
  resolveUrl: function(inBaseUrl, inUrl, inRelativeToDocument) {
    if (this.isAbsUrl(inUrl)) {
      return inUrl;
    }
    var url = this.compressUrl(this.urlToPath(inBaseUrl) + inUrl);
    if (inRelativeToDocument) {
      url = path.makeRelPath(document.URL, url);
    }
    return url;
  },
  isAbsUrl: function(inUrl) {
    return /(^data:)|(^http[s]?:)|(^\/)/.test(inUrl);
  },
  urlToPath: function(inBaseUrl) {
    var parts = inBaseUrl.split("/");
    parts.pop();
    parts.push('');
    return parts.join("/");
  },
  compressUrl: function(inUrl) {
    var parts = inUrl.split("/");
    for (var i=0, p; i<parts.length; i++) {
      p = parts[i];
      if (p === "..") {
        parts.splice(i-1, 2);
        i -= 2;
      }
    }
    return parts.join("/");
  },
  // make a relative path from source to target
  makeRelPath: function(inSource, inTarget) {
    var s, t;
    s = this.compressUrl(inSource).split("/");
    t = this.compressUrl(inTarget).split("/");
    while (s.length && s[0] === t[0]){
      s.shift();
      t.shift();
    }
    for(var i = 0, l = s.length-1; i < l; i++) {
      t.unshift("..");
    }
    var r = t.join("/");
    return r;
  },
  resolvePathsInHTML: function(inRoot) {
    var docUrl = path.documentUrlFromNode(inRoot.body);
    // TODO(sorvell): MDV Polyfill Intrusion
    if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
      HTMLTemplateElement.bootstrap(inRoot);
    }
    var node = inRoot.body;
    // TODO(sorvell): ShadowDOM Polyfill Intrusion
    if ( window.ShadowDOMPolyfill) {
      node = ShadowDOMPolyfill.wrap(node);
    }
    path._resolvePathsInHTML(node, docUrl);
  },
  _resolvePathsInHTML: function(inRoot, inUrl) {
    path.resolveAttributes(inRoot, inUrl);
    path.resolveStyleElts(inRoot, inUrl);
    // handle templates, if supported
    if (window.templateContent) {
      var templates = inRoot.querySelectorAll('template');
      if (templates) {
        forEach(templates, function(t) {
          path._resolvePathsInHTML(templateContent(t), inUrl);
        });
      }
    }
  },
  resolvePathsInStylesheet: function(inSheet) {
    var docUrl = path.nodeUrl(inSheet);
    inSheet.__resource = path.resolveCssText(inSheet.__resource, docUrl);
  },
  resolveStyleElts: function(inRoot, inUrl) {
    var styles = inRoot.querySelectorAll('style');
    if (styles) {
      forEach(styles, function(style) {
        style.textContent = path.resolveCssText(style.textContent, inUrl);
      });
    }
  },
  resolveCssText: function(inCssText, inBaseUrl) {
    return inCssText.replace(/url\([^)]*\)/g, function(inMatch) {
      // find the url path, ignore quotes in url string
      var urlPath = inMatch.replace(/["']/g, "").slice(4, -1);
      urlPath = path.resolveUrl(inBaseUrl, urlPath, true);
      return "url(" + urlPath + ")";
    });
  },
  resolveAttributes: function(inRoot, inUrl) {
    // search for attributes that host urls
    var nodes = inRoot && inRoot.querySelectorAll(URL_ATTRS_SELECTOR);
    if (nodes) {
      forEach(nodes, function(n) {
        this.resolveNodeAttributes(n, inUrl);
      }, this);
    }
  },
  resolveNodeAttributes: function(inNode, inUrl) {
    URL_ATTRS.forEach(function(v) {
      var attr = inNode.attributes[v];
      if (attr && attr.value &&
         (attr.value.search(URL_TEMPLATE_SEARCH) < 0)) {
        var urlPath = path.resolveUrl(inUrl, attr.value, true);
        attr.value = urlPath;
      }
    });
  }
};

var URL_ATTRS = ['href', 'src', 'action'];
var URL_ATTRS_SELECTOR = '[' + URL_ATTRS.join('],[') + ']';
var URL_TEMPLATE_SEARCH = '{{.*}}';

var xhr = {
  async: true,
  ok: function(inRequest) {
    return (inRequest.status >= 200 && inRequest.status < 300)
        || (inRequest.status === 304);
  },
  load: function(url, next, nextContext) {
    var request = new XMLHttpRequest();
    request.open('GET', url + '?' + Math.random(), xhr.async);
    request.addEventListener('readystatechange', function(e) {
      if (request.readyState === 4) {
        next.call(nextContext, !xhr.ok(request) && request,
          request.response, url);
      }
    });
    request.send();
  }
};

var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

// exports

window.HTMLImports = HTMLImports;

// bootstrap

// IE shim for CustomEvent
if (typeof window.CustomEvent !== 'function') {
  window.CustomEvent = function(inType) {
     var e = document.createEvent('HTMLEvents');
     e.initEvent(inType, true, true);
     return e;
  };
}

window.addEventListener('load', function() {
  // preload document resource trees
  HTMLImports.load(document, function() {
    // TODO(sjmiles): ShadowDOM polyfill pollution
    var doc = window.ShadowDOMPolyfill ? ShadowDOMPolyfill.wrap(document)
        : document;
    // send HTMLImportsLoaded when finished
    doc.body.dispatchEvent(
      new CustomEvent('HTMLImportsLoaded', {bubbles: true})
    );
  });
});

})();
