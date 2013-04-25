/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Shadow DOM reprojection', function() {

  var unwrap = ShadowDOMPolyfill.unwrap;

  function getVisualInnerHtml(el) {
    el.offsetWidth;
    return unwrap(el).innerHTML;
  }

  test('Reproject', function() {

    var host = document.createElement('div');
    host.innerHTML = '<a></a>';
    var a = host.firstChild;

    var shadowRoot = host.createShadowRoot();
    shadowRoot.innerHTML = '<p><b></b><content></content></p>';
    var p = shadowRoot.firstChild;
    var b = p.firstChild;
    var content = p.lastChild;

    var pShadowRoot = p.createShadowRoot();
    pShadowRoot.innerHTML =
        'a: <content select=a></content>b: <content select=b></content>';
    var textNodeA = pShadowRoot.firstChild;
    var contentA = pShadowRoot.childNodes[1];
    var textNodeB = pShadowRoot.childNodes[2]
    var contentB = pShadowRoot.childNodes[3];

    function testRender() {
      host.offsetWidth;
      assert.strictEqual(getVisualInnerHtml(host),
                         '<p>a: <a></a>b: <b></b></p>');

      expectStructure(host, {
        firstChild: a,
        lastChild: a
      });

      expectStructure(a, {
        parentNode: host
      });


      expectStructure(shadowRoot, {
        firstChild: p,
        lastChild: p
      });

      expectStructure(p, {
        parentNode: shadowRoot,
        firstChild: b,
        lastChild: content,
      });

      expectStructure(b, {
        parentNode: p,
        nextSibling: content
      });

      expectStructure(content, {
        parentNode: p,
        previousSibling: b
      });


      expectStructure(pShadowRoot, {
        firstChild: textNodeA,
        lastChild: contentB
      });

      expectStructure(textNodeA, {
        parentNode: pShadowRoot,
        nextSibling: contentA
      });

      expectStructure(contentA, {
        parentNode: pShadowRoot,
        previousSibling: textNodeA,
        nextSibling: textNodeB
      });

      expectStructure(textNodeB, {
        parentNode: pShadowRoot,
        previousSibling: contentA,
        nextSibling: contentB
      });

      expectStructure(contentB, {
        parentNode: pShadowRoot,
        previousSibling: textNodeB
      });
    }

    testRender();
    testRender();

  });
});