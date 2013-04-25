/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Events', function() {

  var adjustRelatedTarget = ShadowDOMPolyfill.adjustRelatedTarget;
  var unwrap = ShadowDOMPolyfill.unwrap;
  var wrap = ShadowDOMPolyfill.wrap;

  function createMouseOverEvent(relatedTarget) {
    var event = document.createEvent('MouseEvent');
    event.initMouseEvent(
        'mouseover',  // typeArg
        true,  // canBubbleArg
        false,  // cancelableArg
        window,  // viewArg
        0,  // detailArg
        0,  // screenXArg
        0,  // screenYArg
        0,  // clientXArg
        0,  // clientYArg
        false,  // ctrlKeyArg
        false,  // altKeyArg
        false,  // shiftKeyArg
        false,  // metaKeyArg
        0,  // buttonArg
        relatedTarget);  // relatedTargetArg
    return event;
  }

  var div, a, b, c, d, e, f, content, sr;

  function createTestTree() {
    var doc = wrap(document);
    div = doc.createElement('div');
    div.innerHTML = '<a></a><b><c></c><d></d></b>';
    a = div.firstChild;
    b = div.lastChild;
    c = b.firstChild;
    d = b.lastChild;

    sr = b.createShadowRoot();
    sr.innerHTML = '<e></e><content></content><f></f>';
    e = sr.firstChild;
    content = e.nextSibling;
    f = sr.lastChild;

    // dispatchEvent with a mouseover does not work in WebKit if the element
    // is not in the document.
    // https://bugs.webkit.org/show_bug.cgi?id=113336
    doc.body.appendChild(div);

    div.offsetWidth;  // trigger recalc
  }

  teardown(function() {
    if (div) {
      div.parentNode.removeChild(div);
    }
    div = a = b = c = d = e = f = content = sr = undefined;
  });

  test('addEventListener', function() {
    div = document.createElement('div');
    wrap(document).body.appendChild(div);
    var div1 = div.appendChild(document.createElement('div'));
    var div2 = div.appendChild(document.createElement('div'));
    var calls = 0;
    function f(e) {
      calls++;
    }

    div1.addEventListener('click', f, true);
    div2.addEventListener('click', f, true);

    div1.click();
    div2.click();
    assert.equal(calls, 2);

    div1.removeEventListener('click', f, true);

    div1.click();
    div2.click();
    assert.equal(calls, 3);

    div2.removeEventListener('click', f, true);

    div1.click();
    div2.click();
    assert.equal(calls, 3);
  });

  test('removeEventListener', function() {
    div = document.createElement('div');
    wrap(document).body.appendChild(div);
    var calls = 0;
    function f(e) {
      calls++;
    }
    function g(e) {
      calls++;
    }

    div.addEventListener('click', f, true);
    div.addEventListener('click', g, true);

    div.click();
    assert.equal(calls, 2);

    div.removeEventListener('click', f, true);

    var event = document.createEvent('MouseEvent');
    event.initMouseEvent(
        'click',  // type
        true,  // canBubble
        true,  // cancelable
        window,  // view
        0,  // detail
        0,  // screenX
        0,  // screenY
        0,  // clientX
        0,  // clientY
        false,  // ctrlKey
        false,  // altKey
        false,  // shiftKey
        false,  // metaKey
        0,  // button
        null);  // relatedTarget
    div.dispatchEvent(event);
    assert.equal(calls, 3);
  });

  test('event', function() {
    var div = document.createElement('div');
    var calls = 0;
    var f;
    div.addEventListener('x', f = function(e) {
      calls++;
      assert.equal(this, div);
      assert.equal(e.target, div);
      assert.equal(e.currentTarget, div);
      assert.equal(e.type, 'x');
    }, false);
    var e = document.createEvent('Event');
    e.initEvent('x', true, true);
    div.dispatchEvent(e);
    assert.equal(calls, 1);

    div.removeEventListener('x', f, false);
    var e2 = document.createEvent('Event');
    e2.initEvent('x', true, true);
    div.dispatchEvent(e2);
    assert.equal(calls, 1);
  });

  test('mouse event', function() {
    div = document.createElement('div');
    wrap(document).body.appendChild(div);
    var called = false;
    div.addEventListener('click', function(e) {
      called = true;
      assert.equal(this, div);
      assert.equal(e.target, div);
      assert.equal(e.currentTarget, div);
      assert.equal(e.relatedTarget, null);
      assert.equal(e.type, 'click');
    }, false);
    div.click();
    assert.isTrue(called);
  });

  test('stopPropagation', function() {
    var a = document.createElement('a');
    a.innerHTML = '<b><c>d</c></b>';
    var b = a.firstChild;
    var c = b.firstChild;

    var log = [];
    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
      e.stopPropagation();
    }, true);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    c.click();
    assertArrayEqual(log, [a, Event.CAPTURING_PHASE, b, Event.CAPTURING_PHASE]);
  });

  test('stopPropagation during bubble', function() {
    var a = document.createElement('a');
    a.innerHTML = '<b><c>d</c></b>';
    var b = a.firstChild;
    var c = b.firstChild;

    var log = [];
    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
      e.stopPropagation();
    }, false);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    c.click();
    assertArrayEqual(log, [
      a, Event.CAPTURING_PHASE,
      b, Event.CAPTURING_PHASE,
      c, Event.AT_TARGET,
      c, Event.AT_TARGET,
      b, Event.BUBBLING_PHASE
    ]);
  });

  test('stopPropagation at target', function() {
    var a = document.createElement('a');
    a.innerHTML = '<b><c>d</c></b>';
    var b = a.firstChild;
    var c = b.firstChild;

    var log = [];
    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
      e.stopPropagation();
    }, true);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    c.click();
    assertArrayEqual(log, [
      a, Event.CAPTURING_PHASE,
      b, Event.CAPTURING_PHASE,
      c, Event.AT_TARGET,
      c, Event.AT_TARGET
    ]);
  });

  test('stopImmediatePropagation', function() {
    var a = document.createElement('a');
    a.innerHTML = '<b><c>d</c></b>';
    var b = a.firstChild;
    var c = b.firstChild;

    var log = [];
    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    a.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
      e.stopImmediatePropagation();
    }, true);

    b.addEventListener('click', function(e) {
      log.push('FAIL', e.currentTarget, e.eventPhase);
    }, true);

    b.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, true);

    c.addEventListener('click', function(e) {
      log.push(e.currentTarget, e.eventPhase);
    }, false);

    c.click();
    assertArrayEqual(log, [a, Event.CAPTURING_PHASE, b, Event.CAPTURING_PHASE]);
  });

  test('click with shadow', function() {
    function addListener(target, currentTarget, opt_phase) {
      var phases;
      if (opt_phase === Event.AT_TARGET)
        phases = [opt_phase];
      else
        phases = [Event.CAPTURING_PHASE, Event.BUBBLING_PHASE];

      calls += phases.length;

      phases.forEach(function(phase) {
        var capture = phase === Event.CAPTURING_PHASE;
        currentTarget.addEventListener('click', function f(e) {
          calls--;
          if (e.target === e.currentTarget)
            phase = Event.AT_TARGET;
          assert.equal(e.eventPhase, phase);
          assert.equal(e.target, target);
          assert.equal(e.currentTarget, currentTarget);
          assert.equal(e.currentTarget, this);
          currentTarget.removeEventListener('click', f, capture);
        }, capture);
      });
    }

    var div = document.createElement('div');
    div.innerHTML = '<a><b></b></a>';
    var a = div.firstChild;
    var b = a.firstChild;
    var sr = div.createShadowRoot();
    sr.innerHTML = '<p><content></content></p>';
    var p = sr.firstChild;
    var content = p.firstChild;

    div.offsetWidth;  // trigger recalc

    var calls = 0;

    addListener(b, div);
    addListener(b, sr);
    addListener(b, p);
    addListener(b, content);
    addListener(b, a);
    addListener(b, b, Event.AT_TARGET);
    b.click();
    assert.equal(calls, 0);

    addListener(div, div);
    addListener(content, sr);
    addListener(content, p);
    addListener(content, content, Event.AT_TARGET);
    content.click();
    assert.equal(calls, 0);

    var sr2 = div.createShadowRoot();
    sr2.innerHTML = '<q><shadow></shadow></q>';
    var q = sr2.firstChild;
    var shadow = q.firstChild;

    div.offsetWidth;  // trigger recalc

    addListener(b, div);
    addListener(b, sr2);
    addListener(b, q);
    addListener(b, shadow);
    addListener(b, sr);
    addListener(b, p);
    addListener(b, content);
    addListener(b, a);
    addListener(b, b, Event.AT_TARGET);

    b.click();
    assert.equal(calls, 0);
  });

  test('adjustRelatedTarget', function() {
    var div = document.createElement('div');
    div.innerHTML = '<a></a><b><c></c><d></d></b>';
    var a = div.firstChild;
    var b = div.lastChild;
    var c = b.firstChild;
    var d = b.lastChild;

    assert.equal(adjustRelatedTarget(c, d), d);

    var sr = b.createShadowRoot();
    sr.innerHTML = '<e></e><content></content><f></f>';
    var e = sr.firstChild;
    var content = e.nextSibling;
    var f = sr.lastChild;

    div.offsetWidth;  // trigger recalc

    assert.equal(adjustRelatedTarget(a, e), b);
    assert.equal(adjustRelatedTarget(e, f), f);
    assert.equal(adjustRelatedTarget(b, f), b);
  });

  test('mouseover retarget to host', function() {
    createTestTree();

    var calls = 0;
    var event = createMouseOverEvent(e);
    a.addEventListener('mouseover', function handler(event) {
      calls++;
      assert.equal(event.target, a);
      assert.equal(event.relatedTarget, b);  // adjusted to parent
      a.removeEventListener('mouseover', handler);
    });
    a.dispatchEvent(event);
    assert.equal(1, calls);
  });

  test('mouse over should not escape shadow dom', function() {
    createTestTree();

    var calls = 0;
    var event = createMouseOverEvent(e);
    a.addEventListener('mouseover', function handler(event) {
      calls++;
      a.removeEventListener('mouseover', handler);
    });
    a.addEventListener('mouseover', function handler(event) {
      calls++;
      a.removeEventListener('mouseover', handler, true);
    }, true);
    f.dispatchEvent(event);
    assert.equal(0, calls);
  });

  test('click listen on shadow root', function() {
    createTestTree();

    var calls = 0;
    sr.addEventListener('click', function handler(event) {
      calls++;
      assert.equal(event.target, f);
      assert.equal(event.currentTarget, sr);
      sr.removeEventListener('click', handler);
    });
    f.click();
    assert.equal(1, calls);
  });

  test('mouse over listen on shadow root', function() {
    // This one only works when we run fewer tests.
    // TODO(arv): Figure out why.
    return;

    createTestTree();

    var calls = 0;
    var event = createMouseOverEvent(e);
    sr.addEventListener('mouseover', function handler(event) {
      calls++;
      assert.equal(event.target, f);
      assert.equal(event.currentTarget, sr);
      assert.equal(event.relatedTarget, e);
      sr.removeEventListener('mouseover', handler);
    });
    f.dispatchEvent(event);
    assert.equal(1, calls);
  });

  test('click should be treated as AT_TARGET on the host when a click ' +
       'happened in its shadow', function() {
    createTestTree();

    var calls = 0;
    b.addEventListener('click', function handler(event) {
      calls++;
      assert.equal(event.eventPhase, Event.AT_TARGET);
      b.removeEventListener('click', handler, false);
    }, false);
    e.addEventListener('click', function handler(event) {
      calls++;
      e.removeEventListener('click', handler, false);
    }, false);
    e.click();
    assert.equal(2, calls);
  });

  test('Handle invalid event listener', function() {
    var div = document.createElement('div');
    div.addEventListener('click', undefined);
    div.click();
  });

  test('new Event', function() {
    var e = new Event('x', {bubbles: true, cancelable: true});
    assert.equal(e.type, 'x');
    assert.equal(e.bubbles, true);
    assert.equal(e.cancelable, true);
    assert.instanceOf(e, Event);
  });

  test('new CustomEvent', function() {
    var e = new CustomEvent('x', {detail: 42});
    assert.equal(e.type, 'x');
    assert.equal(e.detail, 42);
    assert.instanceOf(e, CustomEvent);
  });

  test('new MouseEvent', function() {
    var div = document.createElement('div');
    var e = new MouseEvent('mouseover', {relatedTarget: div});
    assert.equal(e.type, 'mouseover');
    assert.equal(e.relatedTarget, div);
    assert.instanceOf(e, MouseEvent);
  });

  /**
   * Creates a deep tree, (all nodes but the leaf have 1 child)
   */
  function getPropagationTree() {
    var tree = {};
    var div = tree.div = document.createElement('div');
    div.innerHTML = '<a><b><c></c></b></a>';
    var a = tree.a = div.firstChild;
    var b = tree.b = a.firstChild;
    var c = tree.c = b.firstChild;
    var sr = tree.sr = b.createShadowRoot();
    sr.innerHTML = '<d><content></content></d>';
    var d = tree.d = sr.firstChild;
    var content = tree.content = d.firstChild;
    var sr2 = tree.sr2 = d.createShadowRoot();
    sr2.innerHTML = '<e><content></content></e>';
    var e = tree.e = sr2.firstChild;
    var content2 = tree.content2 = e.firstChild;

    div.offsetWidth;

    return tree;
  }

  function getDisplayName(node) {
    if (!node)
      return String(node);
    return node.displayName;
  }

  function getPhaseName(event) {
    switch (event.eventPhase) {
      case Event.BUBBLING_PHASE:
        return 'BUBBLING_PHASE';
      case Event.AT_TARGET:
        return 'AT_TARGET';
      case Event.CAPTURING_PHASE:
        return 'CAPTURING_PHASE';
    }
  }

  function addListeners(tree, type, log) {
    Object.keys(tree).forEach(function(key) {
      var node = tree[key];
      node.displayName = key;
      [true, false].forEach(function(capture) {
        node.addEventListener(type, function f(e) {
          assert.equal(e.currentTarget, node);
          assert.equal(e.currentTarget, this);
          log.push(getDisplayName(node) + ', ' +
                   getDisplayName(e.target) + ', ' +
                   getDisplayName(e.relatedTarget) + ', ' +
                   getPhaseName(e));
        }, capture);
      });
    });
  }

  test('propagation (bubbles)', function() {
    var tree = getPropagationTree();
    var log = [];
    addListeners(tree, 'x', log);

    var e = new Event('x', {bubbles: true});
    tree.c.dispatchEvent(e);

    var expected = [
      'div, c, undefined, CAPTURING_PHASE',
      'a, c, undefined, CAPTURING_PHASE',
      'b, c, undefined, CAPTURING_PHASE',
      'sr, c, undefined, CAPTURING_PHASE',
      'd, c, undefined, CAPTURING_PHASE',
      'sr2, c, undefined, CAPTURING_PHASE',
      'e, c, undefined, CAPTURING_PHASE',
      'content2, c, undefined, CAPTURING_PHASE',
      'content, c, undefined, CAPTURING_PHASE',
      'c, c, undefined, AT_TARGET',
      'c, c, undefined, AT_TARGET',
      'content, c, undefined, BUBBLING_PHASE',
      'content2, c, undefined, BUBBLING_PHASE',
      'e, c, undefined, BUBBLING_PHASE',
      'sr2, c, undefined, BUBBLING_PHASE',
      'd, c, undefined, BUBBLING_PHASE',
      'sr, c, undefined, BUBBLING_PHASE',
      'b, c, undefined, BUBBLING_PHASE',
      'a, c, undefined, BUBBLING_PHASE',
      'div, c, undefined, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);

    log.length = 0;
    var e = new Event('x', {bubbles: true});
    tree.e.dispatchEvent(e);

    var expected = [
      'div, b, undefined, CAPTURING_PHASE',
      'a, b, undefined, CAPTURING_PHASE',
      'sr, d, undefined, CAPTURING_PHASE',
      'sr2, e, undefined, CAPTURING_PHASE',
      'e, e, undefined, AT_TARGET',
      'e, e, undefined, AT_TARGET',
      'sr2, e, undefined, BUBBLING_PHASE',
      'd, d, undefined, AT_TARGET',
      'd, d, undefined, AT_TARGET',
      'sr, d, undefined, BUBBLING_PHASE',
      'b, b, undefined, AT_TARGET',
      'b, b, undefined, AT_TARGET',
      'a, b, undefined, BUBBLING_PHASE',
      'div, b, undefined, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);
  });

  test('propagation (bubbles: false)', function() {
    var tree = getPropagationTree();
    var log = [];
    addListeners(tree, 'x', log);

    var e = new Event('x', {bubbles: false});
    tree.c.dispatchEvent(e);

    var expected = [
      'div, c, undefined, CAPTURING_PHASE',
      'a, c, undefined, CAPTURING_PHASE',
      'b, c, undefined, CAPTURING_PHASE',
      'sr, c, undefined, CAPTURING_PHASE',
      'd, c, undefined, CAPTURING_PHASE',
      'sr2, c, undefined, CAPTURING_PHASE',
      'e, c, undefined, CAPTURING_PHASE',
      'content2, c, undefined, CAPTURING_PHASE',
      'content, c, undefined, CAPTURING_PHASE',
      'c, c, undefined, AT_TARGET',
      'c, c, undefined, AT_TARGET'
    ];
    assertArrayEqual(expected, log);

    log.length = 0;
    var e = new Event('x', {bubbles: false});
    tree.e.dispatchEvent(e);

    var expected = [
      'div, b, undefined, CAPTURING_PHASE',
      'a, b, undefined, CAPTURING_PHASE',
      'sr, d, undefined, CAPTURING_PHASE',
      'sr2, e, undefined, CAPTURING_PHASE',
      'e, e, undefined, AT_TARGET',
      'e, e, undefined, AT_TARGET',
      'd, d, undefined, AT_TARGET',
      'd, d, undefined, AT_TARGET',
      'b, b, undefined, AT_TARGET',
      'b, b, undefined, AT_TARGET',
    ];
    assertArrayEqual(expected, log);
  });

  test('retarget order', function() {
    var tree = {};
    var div = tree.div = document.createElement('div');
    // wrap(document).body.appendChild(div);
    div.innerHTML = '<c></c><d></d>';
    var c = tree.c = div.firstChild;
    var d = tree.d = div.lastChild;
    var sr = tree.sr = div.createShadowRoot();
    sr.innerHTML = '<a><content></content></a>';
    var a = tree.a = sr.firstChild;
    var content = tree.content = a.firstChild;
    var sr2 = tree.sr2 = a.createShadowRoot();
    sr2.innerHTML = '<b><content></content></b>';
    var b = tree.b = sr2.firstChild;
    var content2 = tree.content2 = b.firstChild;
    var sr3 = tree.sr3 = b.createShadowRoot();
    sr3.innerHTML = '<content></content>';
    var content3 = tree.content3 = sr3.firstChild;

    div.offsetWidth;

    var log = [];
    addListeners(tree, 'mouseover', log);

    // move from d to c, both in the light dom.
    var event = new MouseEvent('mouseover', {relatedTarget: d, bubbles: true});
    c.dispatchEvent(event);
    var expected = [
      'div, c, d, CAPTURING_PHASE',
      'sr, c, d, CAPTURING_PHASE',
      'a, c, d, CAPTURING_PHASE',
      'sr2, c, d, CAPTURING_PHASE',
      'b, c, d, CAPTURING_PHASE',
      'sr3, c, d, CAPTURING_PHASE',
      'content3, c, d, CAPTURING_PHASE',
      'content2, c, d, CAPTURING_PHASE',
      'content, c, d, CAPTURING_PHASE',
      'c, c, d, AT_TARGET',
      'c, c, d, AT_TARGET',
      'content, c, d, BUBBLING_PHASE',
      'content2, c, d, BUBBLING_PHASE',
      'content3, c, d, BUBBLING_PHASE',
      'sr3, c, d, BUBBLING_PHASE',
      'b, c, d, BUBBLING_PHASE',
      'sr2, c, d, BUBBLING_PHASE',
      'a, c, d, BUBBLING_PHASE',
      'sr, c, d, BUBBLING_PHASE',
      'div, c, d, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);

    // Move from c to b (b in light, c in a shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: c, bubbles: true});
    b.dispatchEvent(event);
    var expected = [
      'sr, a, c, CAPTURING_PHASE',
      'sr2, b, c, CAPTURING_PHASE',
      'b, b, c, AT_TARGET',
      'b, b, c, AT_TARGET',
      'sr2, b, c, BUBBLING_PHASE',
      'a, a, c, AT_TARGET',
      'a, a, c, AT_TARGET',
      'sr, a, c, BUBBLING_PHASE',
      'div, div, c, AT_TARGET',
      'div, div, c, AT_TARGET',
    ];
    assertArrayEqual(expected, log);

    // Move from b to c (b in light, c in a shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: b, bubbles: true});
    c.dispatchEvent(event);
    var expected = [
      'div, c, div, CAPTURING_PHASE',
      'sr, c, a, CAPTURING_PHASE',
      'a, c, a, CAPTURING_PHASE',
      'sr2, c, b, CAPTURING_PHASE',
      'b, c, b, CAPTURING_PHASE',
      'sr3, c, b, CAPTURING_PHASE',
      'content3, c, b, CAPTURING_PHASE',
      'content2, c, b, CAPTURING_PHASE',
      'content, c, a, CAPTURING_PHASE',
      'c, c, div, AT_TARGET',
      'c, c, div, AT_TARGET',
      'content, c, a, BUBBLING_PHASE',
      'content2, c, b, BUBBLING_PHASE',
      'content3, c, b, BUBBLING_PHASE',
      'sr3, c, b, BUBBLING_PHASE',
      'b, c, b, BUBBLING_PHASE',
      'sr2, c, b, BUBBLING_PHASE',
      'a, c, a, BUBBLING_PHASE',
      'sr, c, a, BUBBLING_PHASE',
      'div, c, div, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);

    // a
    // + sr
    //   + b

    // Move from a to b (both in shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: a, bubbles: true});
    b.dispatchEvent(event);
    var expected = [
      'sr2, b, a, CAPTURING_PHASE',
      'b, b, a, AT_TARGET',
      'b, b, a, AT_TARGET',
      'sr2, b, a, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);

    // Move from b to a (both in shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: b, bubbles: true});
    a.dispatchEvent(event);
    var expected = [];
    assertArrayEqual(expected, log);
  });

test('retarget order (multiple shadow roots)', function() {
    var tree = {};
    var div = tree.div = document.createElement('div');
    // wrap(document).body.appendChild(div);
    div.innerHTML = '<c></c><d></d>';
    var c = tree.c = div.firstChild;
    var d = tree.d = div.lastChild;
    var sr = tree.sr = div.createShadowRoot();
    sr.innerHTML = '<a><content></content></a>';
    var a = tree.a = sr.firstChild;
    var content = tree.content = a.firstChild;
    var sr2 = tree.sr2 = div.createShadowRoot();
    sr2.innerHTML = '<b><shadow></shadow></b>';
    var b = tree.b = sr2.firstChild;
    var shadow = tree.shadow = b.firstChild;
    var sr3 = tree.sr3 = div.createShadowRoot();
    sr3.innerHTML = '<shadow></shadow>';
    var shadow2 = tree.shadow2 = sr3.firstChild;

    div.offsetWidth;

    var log = [];
    addListeners(tree, 'mouseover', log);

    // move from d to c, both in the light dom.
    var event = new MouseEvent('mouseover', {relatedTarget: d, bubbles: true});
    c.dispatchEvent(event);
    var expected = [
      'div, c, d, CAPTURING_PHASE',
      'sr3, c, d, CAPTURING_PHASE',
      'shadow2, c, d, CAPTURING_PHASE',
      'sr2, c, d, CAPTURING_PHASE',
      'b, c, d, CAPTURING_PHASE',
      'shadow, c, d, CAPTURING_PHASE',
      'sr, c, d, CAPTURING_PHASE',
      'a, c, d, CAPTURING_PHASE',
      'content, c, d, CAPTURING_PHASE',
      'c, c, d, AT_TARGET',
      'c, c, d, AT_TARGET',
      'content, c, d, BUBBLING_PHASE',
      'a, c, d, BUBBLING_PHASE',
      'sr, c, d, BUBBLING_PHASE',
      'shadow, c, d, BUBBLING_PHASE',
      'b, c, d, BUBBLING_PHASE',
      'sr2, c, d, BUBBLING_PHASE',
      'shadow2, c, d, BUBBLING_PHASE',
      'sr3, c, d, BUBBLING_PHASE',
      'div, c, d, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);


    // Move from c to b (b in light, c in a shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: c, bubbles: true});
    b.dispatchEvent(event);
    var expected = [
      'sr3, shadow2, c, CAPTURING_PHASE',
      'sr2, b, c, CAPTURING_PHASE',
      'b, b, c, AT_TARGET',
      'b, b, c, AT_TARGET',
      'sr2, b, c, BUBBLING_PHASE',
      'shadow2, shadow2, c, AT_TARGET',
      'shadow2, shadow2, c, AT_TARGET',
      'sr3, shadow2, c, BUBBLING_PHASE',
      'div, div, c, AT_TARGET',
      'div, div, c, AT_TARGET',
    ];
    assertArrayEqual(expected, log);

    // Move from b to c (b in light, c in a shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: b, bubbles: true});
    c.dispatchEvent(event);
    var expected = [
      'div, c, div, CAPTURING_PHASE',
      'sr3, c, shadow2, CAPTURING_PHASE',
      'shadow2, c, shadow2, CAPTURING_PHASE',
      'sr2, c, b, CAPTURING_PHASE',
      'b, c, b, CAPTURING_PHASE',
      'shadow, c, b, CAPTURING_PHASE',
      'sr, c, div, CAPTURING_PHASE',
      'a, c, div, CAPTURING_PHASE',
      'content, c, div, CAPTURING_PHASE',
      'c, c, div, AT_TARGET',
      'c, c, div, AT_TARGET',
      'content, c, div, BUBBLING_PHASE',
      'a, c, div, BUBBLING_PHASE',
      'sr, c, div, BUBBLING_PHASE',
      'shadow, c, b, BUBBLING_PHASE',
      'b, c, b, BUBBLING_PHASE',
      'sr2, c, b, BUBBLING_PHASE',
      'shadow2, c, shadow2, BUBBLING_PHASE',
      'sr3, c, shadow2, BUBBLING_PHASE',
      'div, c, div, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);

    // a
    // + sr
    //   + b

    // Move from a to b (both in shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: a, bubbles: true});
    b.dispatchEvent(event);
    var expected = [
      'sr2, b, shadow, CAPTURING_PHASE',
      'b, b, shadow, AT_TARGET',
      'b, b, shadow, AT_TARGET',
      'sr2, b, shadow, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);

    // Move from b to a (both in shadow)
    log.length = 0;
    var event = new MouseEvent('mouseover', {relatedTarget: b, bubbles: true});
    a.dispatchEvent(event);
    var expected = [
      'sr2, shadow, b, CAPTURING_PHASE',
      'b, shadow, b, CAPTURING_PHASE',
      'sr, a, div, CAPTURING_PHASE',
      'a, a, div, AT_TARGET',
      'a, a, div, AT_TARGET',
      'sr, a, div, BUBBLING_PHASE',
      'shadow, shadow, b, AT_TARGET',
      'shadow, shadow, b, AT_TARGET',
      'b, shadow, b, BUBBLING_PHASE',
      'sr2, shadow, b, BUBBLING_PHASE',
    ];
    assertArrayEqual(expected, log);
  });

  testIframe('window on load', 'on-load-test.html', function(result) {
    assertArrayEqual([true, true, true, true], result);
  });

  test('event wrap round trip', function() {
    var e = new Event('x');
    assert.equal(e, wrap(unwrap(e)));
  });

  test('mouse event wrap round trip', function() {
    var e = new MouseEvent('x');
    assert.equal(e, wrap(unwrap(e)));
  });


});
