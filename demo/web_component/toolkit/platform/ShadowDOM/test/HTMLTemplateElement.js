/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('HTML Template Element', function() {

  test('content', function() {
    var div = document.createElement('div');
    div.innerHTML = '<template><a></a><b></b></template>';
    var template = div.firstChild;
    var content = template.content;

    assert.isNull(template.firstChild);
    assert.equal(content.childNodes.length, 2);
    assert.equal(content.firstChild.tagName, 'A');
    assert.equal(content.lastChild.tagName, 'B');
  });

  test('document', function() {
    var div = document.createElement('div');
    div.innerHTML = '<template><a></a></template><template><b></b></template>';
    var templateA = div.firstChild;
    var templateB= div.lastChild;
    var contentA = templateA.content;
    var contentB = templateB.content;

    assert.notEqual(templateA.ownerDocument, contentB.ownerDocument);
    assert.equal(contentA.ownerDocument, contentB.ownerDocument);
  });

  test('get innerHTML', function() {
    var div = document.createElement('div');
    div.innerHTML = '<template><a></a><b></b></template>';
    var template = div.firstChild;

    assert.equal(template.innerHTML, '<a></a><b></b>');
  });

  test('set innerHTML', function() {
    var div = document.createElement('div');
    div.innerHTML = '<template><a></a><b></b></template>';
    var template = div.firstChild;
    template.innerHTML = 'c<d></d>e';

    assert.equal(template.innerHTML, 'c<d></d>e');

    expectStructure(template, {
      parentNode: div
    })

    var content = template.content;
    var c = content.firstChild;
    var d = c.nextSibling;
    var e = d.nextSibling;

    assert.equal(c.textContent, 'c');
    assert.equal(d.tagName, 'D');
    assert.equal(e.textContent, 'e');

    expectStructure(content, {
      firstChild: c,
      lastChild: e
    });
    expectStructure(c, {
      parentNode: content,
      nextSibling: d
    });
    expectStructure(d, {
      parentNode: content,
      previousSibling: c,
      nextSibling: e
    });
    expectStructure(e, {
      parentNode: content,
      previousSibling: d
    });
  });

});