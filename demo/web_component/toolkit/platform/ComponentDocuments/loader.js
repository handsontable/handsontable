/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

// NOTE: uses 'window' and 'document' globals

scope = scope || {};
scope.flags = scope.flags || {};

// imports

var log = scope.flags.logloader;
var path = scope.ComponentDocuments.path;

// TODO(sjmiles): these implementations are ad-hoc, and have minimal error
// checking
// 
// There is no spec yet, but there is this:
// http://lists.w3.org/Archives/Public/public-webapps/2012JulSep/0587.html

var xhr = {
  ok: function(inRequest) {
    return (inRequest.status >= 200 && inRequest.status < 300)
        || (inRequest.status == 304);
  },
  load: function(url, next, context) {
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.addEventListener('readystatechange', function(e) {
      if (request.readyState === 4) {
        next.call(context, !xhr.ok(request) && request,
          request.response);
      }
    });
    request.send();
  }
};

var makeDocument = function(inHTML, inName) {
  var doc = document.implementation.createHTMLDocument('component');
  doc.body.innerHTML = inHTML;
  doc.name = inName;
  return doc;
};

// caching parallel loader

// load N resources asynchronously and in parallel with completion tracking and
// deduping
// resources are not parsed or evaluated (except for HTMLDocuments), but are
// merely placed in a cache for in-order traversal later
// HTMLDocuments are constructed so they can be traversed themselves
// uses Node.js-style asynchrony convention: callbacks take two parameters:
// err, response

var loader = {
  // caching
  cache: {},
  pending: {},
  display: function(inUrl) {
    return "..." + inUrl.split("/").slice(-2).join("/");
  },
  nodeUrl: function(inNode) {
    return path.nodeUrl(inNode);
  },
  loadFromNode: function(inNode, inNext) {
    var url = loader.nodeUrl(inNode);
    if (!this.cached(url, inNext)) {
      this.request(url, inNext);
    }
  },
  cached: function(inUrl, inNext) {
    var data = this.cache[inUrl];
    if (data !== undefined) {
      if (data == this.pending) {
        var p = data[inUrl] = data[inUrl] || [];
        p.push(inNext);
      } else {
        log && console.log(loader.display(inUrl), "cached or pending");
        inNext(null, this.cache[inUrl], inUrl);
      }
      return true;
    }
    return false;
  },
  request: function(inUrl, inNext) {
    this.cache[inUrl] = this.pending;
    //
    var onload = function(err, response) {
      log && console.log("(" + inUrl, "loaded)");
      this.cache[inUrl] = response;
      inNext(err, response, inUrl);
      this.resolvePending(inUrl);
    };
    //
    xhr.load(inUrl, onload.bind(this));
  },
  resolvePending: function(inUrl) {
    var p = this.pending[inUrl];
    if (p) {
      p.forEach(function(next) {
        log && console.log(loader.display(inUrl), "resolved via cache");
        next(null, null, inUrl);
      });
      this.pending[inUrl] = null;
    }
  },
  // completion tracking
  oncomplete: nop,
  inflight: 0,
  push: function() {
    this.inflight++;
  },
  pop: function() {
    if (--this.inflight == 0) {
      this.oncomplete();
    }
  },
  load: function(inNode, inNext) {
    this.push();
    this.loadFromNode(inNode, function(err, response) {
      inNext(err, response);
      this.pop();
    }.bind(this));
  },
  // hook to store HTMLDocuments in cache
  docs: {},
  loadDocument: function(inNode, inNext) {
    this.push();
    this.loadFromNode(inNode, function(err, response, url) {
      inNext(err, this.docs[url] = (this.docs[url]
         || makeDocument(response, url)));
      this.pop();
    }.bind(this));
  },
  fetchFromCache: function(inNode) {
    var url = loader.nodeUrl(inNode);
    var data = this.docs[url] || this.cache[url];
    if (data === undefined) {
      log && console.error(url + " was not in cache");
    }
    return data;
  }
};

// web component resource loader

var componentLoader = {
  _preload: function(inNode) {
    $$(inNode, "link[rel=components]").forEach(function(n) {
      loader.loadDocument(n, function(err, response) {
        if (!err) {
          componentLoader._preload(response);
        }
      });
    });
    $$(inNode, "element link[rel=stylesheet],element script[src]").forEach(function(n) {
      loader.load(n, nop);
    });
    if (!loader.inflight) {
      loader.oncomplete();
    }
  },
  preload: function(inDocument, inNext) {
    loader.oncomplete = inNext;
    componentLoader._preload(inDocument);
  },
  fetch: function(inNode) {
    return loader.fetchFromCache(inNode);
  }
};

// exports

scope.ComponentDocuments = scope.ComponentDocuments ||  {};

// TODO(sjmiles): ComponentDocuments.loader.loader is not satisfying, refactor

scope.ComponentDocuments.loader = {
  xhr: xhr,
  makeDocument: makeDocument,
  loader: loader,
  componentLoader: componentLoader
};

})(window.__exported_components_polyfill_scope__);
