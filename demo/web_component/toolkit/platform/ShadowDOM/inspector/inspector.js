(function() {
  var inspector;

  window.sinspect = function(inNode, inProxy) {
    if (!inspector) {
      inspector = window.open('', 'ShadowDOM Inspector');
      inspector.document.write(extractHtml(containHtml.toString()));
      inspector.document.close();
      inspector.api = {
        shadowize: shadowize
      };
    }
    inspect(inNode || document.body, inProxy);
  };

  var crumbs = [];

  var displayCrumbs = function() {
    // alias our document
    var d = inspector.document;
    // get crumbbar
    var cb = d.querySelector('#crumbs');
    // clear crumbs
    cb.textContent = '';
    // build new crumbs
    for (var i=0, c; c=crumbs[i]; i++) {
      var a = d.createElement('a');
      a.href = '#';
      a.textContent = c.localName;
      a.idx = i;
      a.onclick = function(event) {
        var c;
        while (crumbs.length > this.idx) {
          c = crumbs.pop();
        }
        inspect(c.shadow || c, c);
        event.preventDefault();
      };
      cb.appendChild(d.createElement('li')).appendChild(a);
    }
  };

  var inspect = function(inNode, inProxy) {
    // alias our document
    var d = inspector.document;
    // reset list of drillable nodes
    drillable = [];
    // memoize our crumb proxy
    var proxy = inProxy || inNode;
    crumbs.push(proxy);
    // update crumbs
    displayCrumbs();
    // reflect local tree
    d.body.querySelector('#tree').innerHTML =
        '<pre>' + output(inNode, inNode.childNodes) + '</pre>';
  };

  var containHtml = function() {
  /*
  <!DOCTYPE html>
  <!--
  Copyright 2012 The Toolkitchen Authors. All rights reserved.
  Use of this source code is governed by a BSD-style
  license that can be found in the LICENSE file.
  -->
  <html>
    <head>
      <title>ShadowDOM Inspector</title>
      <style>
        body {
        }
        pre {
          font: 9pt "Courier New", monospace;
          line-height: 1.5em;
        }
        tag {
          color: purple;
        }
        ul {
           Xpadding: 8px 15px;
           margin: 0;
           padding: 0;
           list-style: none;
           Xbackground-color: #f5f5f5;
           Xborder-radius: 4px;
        }
        li {
           display: inline-block;
           background-color: #f1f1f1;
           padding: 4px 6px;
           border-radius: 4px;
           margin-right: 4px;
        }
      </style>
    </head>
    <body>
      <ul id="crumbs">
      </ul>
      <div id="tree"></div>
    </body>
  </html>
  */
  };

  var extractHtml = function(inCode) {
      var rx = /\/\*[\w\t\n\r]*([\s\S]*?)[\w\t\n\r]*\*\//;
      var html = inCode.toString().match(rx)[1];
      return html;
  };

  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

  var blacklist = function(inNode) {
    return inNode.localName == 'style';
  };

  var output = function(inNode, inChildNodes, inIndent) {
    if (blacklist(inNode)) {
      return '';
    }
    var indent = inIndent || '';
    if (inNode.localName) {
      inChildNodes = ShadowDOM.localNodes(inNode);
      var info = indent + describe(inNode);
      // if only textNodes
      // TODO(sjmiles): make correct for ShadowDOM
      if (!inNode.children.length) {
        info += catTextContent(inChildNodes);
      } else {
        if (inNode.localName == 'content') {
          inChildNodes = inNode.getDistributedNodes();
        }
        info += '<br/>';
        var ind = indent + '&nbsp;&nbsp;';
        forEach(inChildNodes, function(n) {
          info += output(n, n.childNodes, ind);
        });
        info += indent;
      }
      info += '<tag>&lt;/' + inNode.localName + '&gt;</tag>' + '<br/>';
    } else {
      var text = inNode.textContent.trim();
      info = text ? indent + '"' + text + '"' + '<br/>' : '';
    }
    return info;
  };

  var catTextContent = function(inChildNodes) {
    var info = '';
    forEach(inChildNodes, function(n) {
      info += n.textContent.trim();
    });
    return info;
  };

  var drillable = [];

  var describe = function(inNode) {
    var tag = '<tag>' + '&lt;';
    if (inNode.shadow) {
      tag += ' <button idx="' + drillable.length +
        '" onclick="api.shadowize.call(this)">' + inNode.localName + '</button>';
      drillable.push(inNode);
    } else {
      tag += inNode.localName;
    }
    forEach(inNode.attributes, function(a) {
      tag += ' ' + a.name + (a.value ? '="' + a.value + '"' : '');
    });
    tag += '&gt;'+ '</tag>';
    return tag;
  };

  // remote api

  shadowize = function() {
    var idx = Number(this.attributes.idx.value);
    //alert(idx);
    var node = drillable[idx];
    if (node) {
      sinspect(node.shadow, node)
    } else {
      console.log("bad shadowize node");
      console.dir(this);
    }
  };
})();


