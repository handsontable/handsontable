/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Shadow DOM', function() {

  var unwrap = ShadowDOMPolyfill.unwrap;

  function getVisualInnerHtml(el) {
    el.offsetWidth;
    return unwrap(el).innerHTML;
  }

  function normalizeInnerHtml(s) {
    // IE9 - Even though the attribute name is stored as "checked" innerHTML
    // upper case the name.
    return s.replace(/CHECKED=""/g, 'checked=""')
  }

  function testRender(descr, hostInnerHtml, shadowRoots,
                      expectedOuterHtml, opt_beforeRender) {
    test(descr, function() {
      var host = document.createElement('div');
      host.innerHTML = hostInnerHtml;

      if (typeof shadowRoots === 'string')
        shadowRoots = [shadowRoots];
      shadowRoots.forEach(function(html) {
        var shadowRoot = host.createShadowRoot();
        shadowRoot.innerHTML = html;
      });

      if (opt_beforeRender)
        opt_beforeRender(host);

      assert.strictEqual(normalizeInnerHtml(getVisualInnerHtml(host)),
          normalizeInnerHtml(expectedOuterHtml));
    });
  }

  testRender('Empty shadow', 'abc', '', '');
  testRender('Simple shadow', 'abc', 'def', 'def');
  testRender('Fallback shadow', 'abc',
             '<content select="xxx">fallback</content>', 'fallback');
  testRender('Content', 'abc',
             '<content>fallback</content>', 'abc');
  testRender('Content before', 'abc',
             'before<content>fallback</content>', 'beforeabc');
  testRender('Content after', 'abc',
             '<content>fallback</content>after', 'abcafter');

  suite('content', function() {
    testRender('no select', '<a href="">Link</a> <b>bold</b>',
               '<content></content>',
               '<a href="">Link</a> <b>bold</b>');
    testRender('select ""', '<a href="">Link</a> <b>bold</b>',
               '<content select=""></content>',
               '<a href="">Link</a> <b>bold</b>');
    testRender('select *', '<a href="">Link</a> <b>bold</b>',
               '<content select="*"></content>',
               '<a href="">Link</a><b>bold</b>');

    testRender('select .a',
               '<a class="a">a</a> <a class="b">b</a>',
               '<content select=".a"></content>',
               '<a class="a">a</a>');

    testRender('select .b .a',
               '<a class="a">a</a> <a class="b">b</a>',
               '<content select=".b"></content><content select=".a"></content>',
               '<a class="b">b</a><a class="a">a</a>');
  });

  suite('Nested shadow roots', function() {
    testRender('2 levels deep', 'host', ['oldest shadow', '<shadow></shadow>'],
               'oldest shadow');
    testRender('4 levels deep', 'host',
               ['oldest shadow', '<shadow></shadow>', '<shadow></shadow>',
                '<shadow></shadow>'],
               'oldest shadow');
    testRender('4 levels deep. A bit more interesting', 'host',
               ['a', 'b<shadow></shadow>c', 'd<shadow></shadow>e',
                'f<shadow></shadow>g'],
               'fdbaceg');

    testRender('content and shadow',
               '<a></a><b></b><c></c>',
               [
                 '<content select="a"></content>',
                 '<shadow></shadow><content select="b"></content>',
                 '<content select="c"></content><shadow></shadow>'
               ],
               '<c></c><a></a><b></b>');
  });

  suite('matches criteria', function() {
    suite('empty select attribute', function() {
      testRender('Content has no select attribute so everything should match',
                 'a <b>c</b> d',
                 '<content></content>',
                 'a <b>c</b> d');
      testRender('Content has empty select attribute so everything should ' +
                    'match',
                 'a <b>c</b> d',
                 '<content select=""></content>',
                 'a <b>c</b> d');
      testRender('Content has an all whitespace select attribute so ' +
                     'everything should match',
                 'a <b>c</b> d',
                 '<content select=" \n \t "></content>',
                 'a <b>c</b> d');
    });

    suite('universal selector', function() {
      testRender('*',
                 '<a></a> <b></b> <c></c>',
                 '<content select="*"></content>',
                 '<a></a><b></b><c></c>');
      testRender('With whitespace',
                 '<a></a> <b></b> <c></c>',
                 '<content select=" * "></content>',
                 '<a></a><b></b><c></c>');

    });

    suite('type selector', function() {
      testRender('b',
                 '<a></a> <b></b> <c></c>',
                 '<content select="b"></content>',
                 '<b></b>');
      testRender('case',
                 '<a></a> <b></b> <c></c>',
                 '<content select="B"></content>',
                 '<b></b>');
    });

    suite('class selector(s)', function() {
      testRender('Single',
                 '<a class="a b"></a><a class="b a"></a><a class="b"></a>',
                 '<content select=".a"></content>',
                 '<a class="a b"></a><a class="b a"></a>');
      testRender('With whitespace',
                 '<a class="a b"></a><a class="b a"></a><a class="b"></a>',
                 '<content select=" .a "></content>',
                 '<a class="a b"></a><a class="b a"></a>');
      testRender('Multiple',
                 '<a class="a b"></a><a class="b a"></a><a class="b"></a>',
                 '<content select=".a.b"></content>',
                 '<a class="a b"></a><a class="b a"></a>');
    });

    suite('ID selector', function() {
      testRender('Simple',
                 '<a id="a"></a><a id="b"></a>',
                 '<content select="#a"></content>',
                 '<a id="a"></a>');
      testRender('Two elements with the same ID',
                 '<a id="a"></a><a id="a"></a>',
                 '<content select="#a"></content>',
                 '<a id="a"></a><a id="a"></a>');
    });

    suite('Attribute selector(s)', function() {
      testRender('Simple',
                 '<a id="a"></a><a id="b"></a>',
                 '<content select="[id]"></content>',
                 '<a id="a"></a><a id="b"></a>');
      testRender('Attribute with value',
                 '<a id="a"></a><a id="b"></a>',
                 '<content select="[id=b]"></content>',
                 '<a id="b"></a>');
      testRender('whitespace separated list',
                 '<a data-test="a b c"></a><a data-test="abc"></a>',
                 '<content select="[data-test~=b]"></content>',
                 '<a data-test="a b c"></a>');
    });

    suite('pseudo-class selector(s)', function() {
      testRender(':link',
                 '<a></a><a href="#"></a>',
                 '<content select=":link"></content>',
                 '<a href="#"></a>');

      // :visited cannot be queried in JS.

      // :target is not supported. matchesSelector(':target') does not seem to
      // work in WebKit nor Firefox.

      testRender(':enabled',
                 '<button disabled></button><button></button>',
                 '<content select=":enabled"></content>',
                 '<button></button>');
      testRender(':disabled',
                 '<button disabled></button><button></button>',
                 '<content select=":disabled"></content>',
                 '<button disabled=""></button>');

      testRender(':checked',
                 '<input type=checkbox><input type=checkbox checked>',
                 '<content select=":checked"></content>',
                 /Firefox/.test(navigator.userAgent) ?
                     '<input checked="" type="checkbox">' :
                     '<input type="checkbox" checked="">');
      testRender(':indeterminate',
                 '<input type=checkbox><input type=checkbox>',
                 '<content select=":indeterminate"></content>',
                 '<input type="checkbox">',
                 function(host) {
                   host.firstChild.indeterminate = true;
                 });

      // The following are not supported. They depend on ordering.
      // :nth-child()
      // :nth-last-child()
      // :nth-of-type()
      // :nth-last-of-type()
      // :first-child
      // :last-child
      // :first-of-type
      // :last-of-type
    });

  });

  suite('Nested shadow hosts', function() {

    test('Child has a shadow host', function() {
      var host = document.createElement('div');
      host.innerHTML = '<a>3</a>';

      var a = host.firstChild;

      var hostShadowRoot = host.createShadowRoot();
      hostShadowRoot.innerHTML = '1<content></content>5';

      var aShadowRoot = a.createShadowRoot();
      aShadowRoot.innerHTML = '2<content></content>4';

      assert.strictEqual(getVisualInnerHtml(host), '1<a>234</a>5');
    });

    test('Shadow DOM has a shadow host', function() {
      var host = document.createElement('div');
      host.innerHTML = '6';

      var hostShadowRoot = host.createShadowRoot();
      hostShadowRoot.innerHTML = '1<a>3</a>5<content></content>7';

      var a = hostShadowRoot.firstChild.nextSibling;

      var aShadowRoot = a.createShadowRoot();
      aShadowRoot.innerHTML = '2<content></content>4';

      assert.strictEqual(getVisualInnerHtml(host), '1<a>234</a>567');
    });

  });

  suite('insertionParent', function() {

    test('none', function() {
      var div = document.createElement('div');
      assert.isNull(div.insertionParent);
    })

    test('content', function() {
      var host = document.createElement('div');
      host.innerHTML = '<a>3</a>';
      var a = host.firstChild;
      var tn3 = a.firstChild;

      assert.isNull(host.insertionParent);
      assert.isNull(a.insertionParent);
      assert.isNull(tn3.insertionParent);

      var hostShadowRoot = host.createShadowRoot();
      hostShadowRoot.innerHTML = '1<content></content>5';
      var tn1 = hostShadowRoot.firstChild;
      var content1 = hostShadowRoot.firstElementChild;
      var tn5 = hostShadowRoot.lastChild;

      host.offsetWidth;
      assert.equal(a.insertionParent, content1);
      assert.isNull(tn1.insertionParent);
      assert.isNull(tn3.insertionParent);
      assert.isNull(tn5.insertionParent);

      var aShadowRoot = a.createShadowRoot();
      aShadowRoot.innerHTML = '2<content></content>4';
      var tn2 = aShadowRoot.firstChild;
      var content2 = aShadowRoot.firstElementChild;
      var tn4 = aShadowRoot.firstChild;

      host.offsetWidth;
      assert.equal(a.insertionParent, content1);
      assert.isNull(tn1.insertionParent);
      assert.isNull(tn2.insertionParent);
      assert.equal(tn3.insertionParent, content2);
      assert.isNull(tn4.insertionParent);
      assert.isNull(tn5.insertionParent);
    });

  });

});