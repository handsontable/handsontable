/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Parallel Trees', function() {

  var wrap = ShadowDOMPolyfill.wrap;
  var unwrap = ShadowDOMPolyfill.unwrap;
  var visual = ShadowDOMPolyfill.visual;

  suite('Visual', function() {

    test('removeAllChildNodes wrapper', function() {
      var div = document.createElement('div');
      div.textContent = 'a';
      var textNode = div.firstChild;

      visual.removeAllChildNodes(div);

      expectStructure(unwrap(div), {});
      expectStructure(unwrap(textNode), {});

      expectStructure(div, {
        firstChild: textNode,
        lastChild: textNode
      });

      expectStructure(textNode, {
        parentNode: div
      });
    });

    test('removeAllChildNodes wrapper with 3 child nodes', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a><b></b><c></c>';
      var a = div.firstChild;
      var b = a.nextSibling;
      var c = div.lastChild;

      visual.removeAllChildNodes(div);

      expectStructure(unwrap(div), {});
      expectStructure(unwrap(a), {});
      expectStructure(unwrap(b), {});
      expectStructure(unwrap(c), {});

      expectStructure(div, {
        firstChild: a,
        lastChild: c
      });

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      expectStructure(c, {
        parentNode: div,
        previousSibling: b
      });
    });

    test('appendChild, start with no children', function() {
      var div = document.createElement('div');
      var textNode = document.createTextNode('hello');

      expectStructure(div, {});
      expectStructure(textNode, {});
      unwrapAndExpectStructure(div, {});
      unwrapAndExpectStructure(textNode, {});

      visual.appendChild(div, textNode);

      unwrapAndExpectStructure(div, {
        firstChild: textNode,
        lastChild: textNode
      });

      unwrapAndExpectStructure(textNode, {
        parentNode: div
      });

      expectStructure(div, {});
      expectStructure(textNode, {});
    });

    test('appendChild, start with one child', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a>';
      var a = div.firstChild;
      var b = document.createElement('b');

      visual.appendChild(div, b);

      unwrapAndExpectStructure(div, {
        firstChild: a,
        lastChild: b
      });

      unwrapAndExpectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      unwrapAndExpectStructure(b, {
        parentNode: div,
        previousSibling: a
      });

      expectStructure(div, {
        firstChild: a,
        lastChild: a
      });

      expectStructure(a, {
        parentNode: div
      });
      expectStructure(b, {});
    });

    test('appendChild, start with two children', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a><b></b>';
      var a = div.firstChild;
      var b = div.lastChild;
      var c = document.createElement('c');

      visual.appendChild(div, c);

      unwrapAndExpectStructure(div, {
        firstChild: a,
        lastChild: c
      });

      unwrapAndExpectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      unwrapAndExpectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      unwrapAndExpectStructure(c, {
        parentNode: div,
        previousSibling: b
      });

      expectStructure(div, {
        firstChild: a,
        lastChild: b
      });

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a
      });

      expectStructure(c, {});
    });

    test('appendChild with document fragment', function() {
      var div = document.createElement('div');
      var df = document.createDocumentFragment();
      var a = df.appendChild(document.createElement('a'));
      var b = df.appendChild(document.createElement('b'));

      visual.appendChild(div, df);

      unwrapAndExpectStructure(div, {
        firstChild: a,
        lastChild: b
      });

      unwrapAndExpectStructure(df, {});

      unwrapAndExpectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      unwrapAndExpectStructure(b, {
        parentNode: div,
        previousSibling: a
      });

      expectStructure(div, {});

      expectStructure(df, {
        firstChild: a,
        lastChild: b
      });

      expectStructure(a, {
        parentNode: df,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: df,
        previousSibling: a
      });
    });

    test('appendChild with document fragment again', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a>';
      var a = div.lastChild;
      var df = document.createDocumentFragment();
      var b = df.appendChild(document.createElement('b'));
      var c = df.appendChild(document.createElement('c'));
      div.appendChild(df);

      expectStructure(df, {});

      expectStructure(div, {
        firstChild: a,
        lastChild: c
      });

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      expectStructure(c, {
        parentNode: div,
        previousSibling: b
      });

      unwrapAndExpectStructure(df, {});

      unwrapAndExpectStructure(div, {
        firstChild: a,
        lastChild: c
      });

      unwrapAndExpectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      unwrapAndExpectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      unwrapAndExpectStructure(c, {
        parentNode: div,
        previousSibling: b
      });

    });

    test('removeChild, start with one child', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a>';
      var a = div.firstChild;

      visual.removeChild(div, a);

      unwrapAndExpectStructure(div, {});
      unwrapAndExpectStructure(a, {});

      expectStructure(div, {
        firstChild: a,
        lastChild: a
      });

      expectStructure(a, {
        parentNode: div
      });
    });

    test('removeChild, start with two children, remove first', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a><b></b>';
      var a = div.firstChild;
      var b = div.lastChild;

      visual.removeChild(div, a);

      unwrapAndExpectStructure(div, {
        firstChild: b,
        lastChild: b
      });

      unwrapAndExpectStructure(a, {});

      unwrapAndExpectStructure(b, {
        parentNode: div
      });

      expectStructure(div, {
        firstChild: a,
        lastChild: b
      });

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a
      });
    });

    test('removeChild, start with two children, remove last', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a><b></b>';
      var a = div.firstChild;
      var b = div.lastChild;

      visual.removeChild(div, b);

      unwrapAndExpectStructure(div, {
        firstChild: a,
        lastChild: a
      });

      unwrapAndExpectStructure(a, {
        parentNode: div
      });

      unwrapAndExpectStructure(b, {});

      expectStructure(div, {
        firstChild: a,
        lastChild: b
      });

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a
      });
    });

    test('removeChild, start with three children, remove middle', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a><b></b><c></c>';
      var a = div.firstChild;
      var b = a.nextSibling;
      var c = div.lastChild;

      visual.removeChild(div, b);

      unwrapAndExpectStructure(div, {
        firstChild: a,
        lastChild: c
      });

      unwrapAndExpectStructure(a, {
        parentNode: div,
        nextSibling: c
      });

      unwrapAndExpectStructure(b, {});

      unwrapAndExpectStructure(c, {
        parentNode: div,
        previousSibling: a
      });

      expectStructure(div, {
        firstChild: a,
        lastChild: c
      });

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      expectStructure(c, {
        parentNode: div,
        previousSibling: b
      });
    });
  });

  suite('Logical', function() {
    suite('removeAllChildNodes', function() {
      test('simple', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><b></b><c></c>';
        var a = div.firstChild;
        var b = a.nextSibling;
        var c = div.lastChild;

        div.textContent = '';

        unwrapAndExpectStructure(div, {});
        unwrapAndExpectStructure(a, {});
        unwrapAndExpectStructure(b, {});
        unwrapAndExpectStructure(c, {});


        expectStructure(div, {});
        expectStructure(a, {});
        expectStructure(b, {});
        expectStructure(c, {});
      });

      test('with wrappers before removal', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><b></b><c></c>';
        var a = div.firstChild;
        var b = a.nextSibling;
        var c = div.lastChild;

        div.textContent = '';

        unwrapAndExpectStructure(div, {});
        unwrapAndExpectStructure(a, {});
        unwrapAndExpectStructure(b, {});
        unwrapAndExpectStructure(c, {});

        expectStructure(div, {});
        expectStructure(a, {});
        expectStructure(b, {});
        expectStructure(c, {});
      });

      test('change visual first', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><b></b><c></c>';
        var a = div.firstChild;
        var b = a.nextSibling;
        var c = div.lastChild;

        visual.removeAllChildNodes(div);

        unwrapAndExpectStructure(div, {});
        unwrapAndExpectStructure(a, {});
        unwrapAndExpectStructure(b, {});
        unwrapAndExpectStructure(c, {});

        div.textContent = '';

        expectStructure(div, {});
        expectStructure(a, {});
        expectStructure(b, {});
        expectStructure(c, {});
      });
    });

    suite('appendChild', function() {
      test('simple', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><b></b>';
        var a = div.firstChild;
        var b = a.nextSibling;
        var c = document.createElement('c');

        div.appendChild(c);

        unwrapAndExpectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        unwrapAndExpectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        unwrapAndExpectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        unwrapAndExpectStructure(c, {
          parentNode: div,
          previousSibling: b
        });

        expectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: b
        });
      });

      test('with wrappers before', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><b></b>';
        var a = div.firstChild;
        var b = a.nextSibling;
        var c = document.createElement('c');

        div.appendChild(c);

        unwrapAndExpectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        unwrapAndExpectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        unwrapAndExpectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        unwrapAndExpectStructure(c, {
          parentNode: div,
          previousSibling: b
        });

        expectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: b
        });
      });

      test('change visual first', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><b></b>';
        var a = div.firstChild;
        var b = a.nextSibling;
        var c = document.createElement('c');

        visual.removeAllChildNodes(div);

        div.appendChild(c);

        unwrapAndExpectStructure(div, {
          firstChild: c,
          lastChild: c
        });
        unwrapAndExpectStructure(a, {});
        unwrapAndExpectStructure(b, {});
        unwrapAndExpectStructure(c, {
          parentNode: div
        });

        expectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: b
        });
      });
    });

    suite('insertBefore', function() {
      test('simple', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><c></c>';
        var a = div.firstChild;
        var c = a.nextSibling;
        var b = document.createElement('b');

        div.insertBefore(b, c);

        unwrapAndExpectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        unwrapAndExpectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        unwrapAndExpectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        unwrapAndExpectStructure(c, {
          parentNode: div,
          previousSibling: b
        });

        expectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: b
        });
      });

      test('with wrappers before', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><c></c>';
        var a = div.firstChild;
        var c = a.nextSibling;
        var b = document.createElement('b');

        div.insertBefore(b, c);

        unwrapAndExpectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        unwrapAndExpectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        unwrapAndExpectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        unwrapAndExpectStructure(c, {
          parentNode: div,
          previousSibling: b
        });

        expectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: b
        });
      });

      test('change visual first', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><c></c>';
        var a = div.firstChild;
        var c = a.nextSibling;
        var b = document.createElement('b');

        visual.removeAllChildNodes(div);

        div.insertBefore(b, c);

        unwrapAndExpectStructure(div, {});
        unwrapAndExpectStructure(a, {});
        unwrapAndExpectStructure(b, {});
        unwrapAndExpectStructure(c, {});

        expectStructure(div, {
          firstChild: a,
          lastChild: c
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: b
        });

        // swap a and b
        div.insertBefore(b, a);

        expectStructure(div, {
          firstChild: b,
          lastChild: c
        });
        expectStructure(b, {
          parentNode: div,
          nextSibling: a
        });
        expectStructure(a, {
          parentNode: div,
          previousSibling: b,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: a
        });

        // swap a and c
        div.insertBefore(c, a);

        expectStructure(div, {
          firstChild: b,
          lastChild: a
        });
        expectStructure(b, {
          parentNode: div,
          nextSibling: c
        });
        expectStructure(c, {
          parentNode: div,
          previousSibling: b,
          nextSibling: a
        });
        expectStructure(a, {
          parentNode: div,
          previousSibling: c
        });
      });
    });

    test('insertBefore with document fragment', function() {
      var div = document.createElement('div');
      var c = div.appendChild(document.createElement('c'));
      var df = document.createDocumentFragment();
      var a = df.appendChild(document.createElement('a'));
      var b = df.appendChild(document.createElement('b'));

      visual.removeAllChildNodes(div);
      visual.removeAllChildNodes(df);

      div.insertBefore(df, c);

      unwrapAndExpectStructure(div, {});
      unwrapAndExpectStructure(df, {});
      unwrapAndExpectStructure(a, {});
      unwrapAndExpectStructure(b, {});
      unwrapAndExpectStructure(c, {});

      expectStructure(div, {
        firstChild: a,
        lastChild: c
      });

      expectStructure(df, {});

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      expectStructure(c, {
        parentNode: div,
        previousSibling: b
      });
    });

    test('insertBefore with document fragment again', function() {
      var div = document.createElement('div');
      div.innerHTML = '<a></a><d></d>';
      var a = div.firstChild;
      var d = div.lastChild;

      var df = document.createDocumentFragment();
      var b = df.appendChild(document.createElement('b'));
      var c = df.appendChild(document.createElement('c'));

      div.insertBefore(df, d);

      expectStructure(df, {});

      expectStructure(div, {
        firstChild: a,
        lastChild: d
      });

      expectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      expectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      expectStructure(c, {
        parentNode: div,
        previousSibling: b,
        nextSibling: d
      });

      expectStructure(d, {
        parentNode: div,
        previousSibling: c
      });

      unwrapAndExpectStructure(df, {});

      unwrapAndExpectStructure(div, {
        firstChild: a,
        lastChild: d
      });

      unwrapAndExpectStructure(a, {
        parentNode: div,
        nextSibling: b
      });

      unwrapAndExpectStructure(b, {
        parentNode: div,
        previousSibling: a,
        nextSibling: c
      });

      unwrapAndExpectStructure(c, {
        parentNode: div,
        previousSibling: b,
        nextSibling: d
      });

      unwrapAndExpectStructure(d, {
        parentNode: div,
        previousSibling: c
      });
    });

    suite('replaceChild', function() {
      test('simple', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><c></c>';
        var a = div.firstChild;
        var c = a.nextSibling;
        var b = document.createElement('b');

        div.replaceChild(b, c);

        unwrapAndExpectStructure(div, {
          firstChild: a,
          lastChild: b
        });
        unwrapAndExpectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        unwrapAndExpectStructure(b, {
          parentNode: div,
          previousSibling: a
        });
        unwrapAndExpectStructure(c, {});

        expectStructure(div, {
          firstChild: a,
          lastChild: b
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a
        });
        expectStructure(c, {});
      });

      test('with wrappers before', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><c></c>';
        var a = div.firstChild;
        var c = a.nextSibling;
        var b = document.createElement('b');

        div.replaceChild(b, c);

        expectStructure(div, {
          firstChild: a,
          lastChild: b
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a
        });
        expectStructure(c, {});

        expectStructure(div, {
          firstChild: a,
          lastChild: b
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a
        });
        expectStructure(c, {});
      });

      test('change visual first', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><c></c>';
        var a = div.firstChild;
        var c = a.nextSibling;
        var b = document.createElement('b');

        visual.removeAllChildNodes(div);

        div.replaceChild(b, c);

        unwrapAndExpectStructure(div, {});
        unwrapAndExpectStructure(a, {});
        unwrapAndExpectStructure(b, {});
        unwrapAndExpectStructure(c, {});

        expectStructure(div, {
          firstChild: a,
          lastChild: b
        });
        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });
        expectStructure(b, {
          parentNode: div,
          previousSibling: a
        });
        expectStructure(c, {});

        // Remove a
        div.replaceChild(b, a);

        expectStructure(div, {
          firstChild: b,
          lastChild: b
        });
        expectStructure(a, {});
        expectStructure(b, {
          parentNode: div
        });
        expectStructure(c, {});

        // Swap b with c
        div.replaceChild(c, b);

        expectStructure(div, {
          firstChild: c,
          lastChild: c
        });
        expectStructure(a, {});
        expectStructure(b, {});
        expectStructure(c, {
          parentNode: div
        });
      });

      test('replaceChild with document fragment', function() {
        var div = document.createElement('div');
        div.innerHTML = '<a></a><e></e><d></d>';
        var a = div.firstChild;
        var e = a.nextSibling;
        var d = e.nextSibling;
        var df = document.createDocumentFragment();
        var b = df.appendChild(document.createElement('b'));
        var c = df.appendChild(document.createElement('c'));

        div.replaceChild(df, e);

        expectStructure(df, {});
        expectStructure(e, {});

        expectStructure(div, {
          firstChild: a,
          lastChild: d
        });

        expectStructure(a, {
          parentNode: div,
          nextSibling: b
        });

        expectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });

        expectStructure(c, {
          parentNode: div,
          previousSibling: b,
          nextSibling: d
        });

        expectStructure(d, {
          parentNode: div,
          previousSibling: c
        });

        unwrapAndExpectStructure(df, {});
        unwrapAndExpectStructure(e, {});

        unwrapAndExpectStructure(div, {
          firstChild: a,
          lastChild: d
        });

        unwrapAndExpectStructure(a, {
          parentNode: div,
          nextSibling: b
        });

        unwrapAndExpectStructure(b, {
          parentNode: div,
          previousSibling: a,
          nextSibling: c
        });

        unwrapAndExpectStructure(c, {
          parentNode: div,
          previousSibling: b,
          nextSibling: d
        });

        unwrapAndExpectStructure(d, {
          parentNode: div,
          previousSibling: c
        });

      });

    });

  });

  test('innerHTML', function() {
    var doc = wrap(document);
    var div = doc.createElement('div');
    div.innerHTML = '<a></a>';
    visual.removeAllChildNodes(div);
    var a = div.firstChild;

    div.innerHTML = '<b></b>';

    assert.equal(div.firstChild.tagName, 'B');
  });

});