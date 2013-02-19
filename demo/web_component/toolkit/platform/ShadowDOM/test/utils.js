/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

$ = document.querySelector.bind(document);

extractHtml = function(inCode) {
  var rx = /\/\*[\w\t\n\r]*([\s\S]*?)[\w\t\n\r]*\*\//;
  var html = inCode.toString().match(rx)[1];
  return html;
};

render = function(inCode) {
  $("#work").innerHTML = extractHtml(inCode);
};


var ShadowRoot = function(inNameOrNode, inTemplateName) {
  // resolve a node
  var node = typeof inNameOrNode == "string" ?
    $("#work > " + inNameOrNode) : inNameOrNode;
  // make ShadowRoot
  var root = new ShadowDOM.ShadowRoot(node);
  // stamp content
  root.appendChild(
    $("#work > template#" + inTemplateName).content.cloneNode(true));
  // distribute
  ShadowDOM.distribute(node);
  return root;
};

testImpls = function(inTest, inExpected, skipWebkit) {
  if (!skipWebkit) {
    it("WebKit", function() {
      ShadowDOM = WebkitShadowDOM;
      verify(inExpected, actualContent(inTest()));
      // show the actual test code in source view
      this.test.fn = inTest;
    });
  }
  it("Shim", function() {
    ShadowDOM = ShimShadowDOM;
    verify(inExpected, actualContent(inTest()));
    this.test.fn = inTest;
  });
};

verify = function(inExpected, inActual) {
  if (inExpected != inActual) {
    console.group("failure");
    console.log("actual:");
    console.log(inActual);
    console.log("expected:");
    console.log(inExpected);
    console.groupEnd();
    var err = new Error('Unexpected output: expected: [' +
      inExpected + '] actual: [' + inActual + ']');
    // docs say I get a diff, but I don't
    err.expected = inExpected;
    err.actual = inActual;
    throw err;
  }
};

actualContent = function(inNode) {
  if (ShadowDOM == WebkitShadowDOM) {
    return getVisualOuterHtml(inNode).trim().replace(/[\n]/g, '');
  } else {
    return inNode.outerHTML.trim().replace(/[\n]/g, '');
  }
};

escapeHTML = function(s) {
  return s && s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

findOlderSubtree = function(inNode) {
  var n  = inNode;
  while (n && !n.olderSubtree) {
    n = n.parentNode;
  }
  return n.olderSubtree;
};

getVisualOuterHtml = function(inNode) {
  var html = '';
  var outer = inNode.outerHTML;
  var nodes = inNode.shadow ? inNode.shadow.childNodes : inNode.childNodes;
  if (nodes.length) {
    // begin tag and attributes
    html += outer ? outer.substring(0, outer.indexOf('>') + 1) : '';
    // iterate child nodes
    Array.prototype.forEach.call(nodes, function(n) {
      if (n.tagName == 'SHADOW') {
        html += getVisualOuterHtml({shadow: findOlderSubtree(n)});
      } else if (n.tagName == 'CONTENT') {
        Array.prototype.forEach.call(n.getDistributedNodes(), function(dn) {
          html += getVisualOuterHtml(dn);
        });
      } else if (n.nodeType == Node.ELEMENT_NODE) {
        html += getVisualOuterHtml(n);
      } else {
        html += escapeHTML(n.textContent) || '';
      }
    });
    // end tag
    html += outer ? '</' + inNode.tagName.toLowerCase() + '>' : '';
  } else {
    html += outer || escapeHTML(inNode.textContent) || '';
  }
  return html;
};
