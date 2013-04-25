(function() {
  var inspector;

  window.sinspect = function(inNode, inProxy) {
    if (!inspector) {
      inspector = window.open('', 'ShadowDOM Inspector', null, true);
      inspector.document.write(inspectorHTML);
      //inspector.document.close();
      inspector.api = {
        shadowize: shadowize
      };
    }
    inspect(inNode || wrap(document.body), inProxy);
  };

  var inspectorHTML = [
    '<!DOCTYPE html>',
    '<html>',
    '  <head>',
    '    <title>ShadowDOM Inspector</title>',
    '    <style>',
    '      body {',
    '      }',
    '      pre {',
    '        font: 9pt "Courier New", monospace;',
    '        line-height: 1.5em;',
    '      }',
    '      tag {',
    '        color: purple;',
    '      }',
    '      ul {',
    '         margin: 0;',
    '         padding: 0;',
    '         list-style: none;',
    '      }',
    '      li {',
    '         display: inline-block;',
    '         background-color: #f1f1f1;',
    '         padding: 4px 6px;',
    '         border-radius: 4px;',
    '         margin-right: 4px;',
    '      }',
    '    </style>',
    '  </head>',
    '  <body>',
    '    <ul id="crumbs">',
    '    </ul>',
    '    <div id="tree"></div>',
    '  </body>',
    '</html>'
  ].join('\n');
  
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

  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

  var blacklisted = {STYLE:1, SCRIPT:1, "#comment": 1, TEMPLATE: 1};
  var blacklist = function(inNode) {
    return blacklisted[inNode.nodeName];
  };

  var output = function(inNode, inChildNodes, inIndent) {
    if (blacklist(inNode)) {
      return '';
    }
    var indent = inIndent || '';
    if (inNode.localName || inNode.nodeType == 11) {
      var name = inNode.localName || 'shadow-root';
      //inChildNodes = ShadowDOM.localNodes(inNode);
      var info = indent + describe(inNode);
      // if only textNodes
      // TODO(sjmiles): make correct for ShadowDOM
      /*if (!inNode.children.length && inNode.localName !== 'content' && inNode.localName !== 'shadow') {
        info += catTextContent(inChildNodes);
      } else*/ {
        // TODO(sjmiles): native <shadow> has no reference to its projection
        if (name == 'content' /*|| name == 'shadow'*/) {
          inChildNodes = inNode.getDistributedNodes();
        }
        info += '<br/>';
        var ind = indent + '&nbsp;&nbsp;';
        forEach(inChildNodes, function(n) {
          info += output(n, n.childNodes, ind);
        });
        info += indent;
      }
      if (!({br:1}[name])) {
        info += '<tag>&lt;/' + name + '&gt;</tag>';
        info += '<br/>';
      }
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
    var name = inNode.localName || 'shadow-root';
    if (inNode.webkitShadowRoot || inNode.shadowRoot) {
      tag += ' <button idx="' + drillable.length +
        '" onclick="api.shadowize.call(this)">' + name + '</button>';
      drillable.push(inNode);
    } else {
      tag += name || 'shadow-root';
    }
    if (inNode.attributes) {
      forEach(inNode.attributes, function(a) {
        tag += ' ' + a.name + (a.value ? '="' + a.value + '"' : '');
      });
    }
    tag += '&gt;'+ '</tag>';
    return tag;
  };

  // remote api

  shadowize = function() {
    var idx = Number(this.attributes.idx.value);
    //alert(idx);
    var node = drillable[idx];
    if (node) {
      inspect(node.webkitShadowRoot || node.shadowRoot, node)
    } else {
      console.log("bad shadowize node");
      console.dir(this);
    }
  };
})();


