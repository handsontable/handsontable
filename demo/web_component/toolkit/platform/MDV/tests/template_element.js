// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

suite('Template Element', function() {

  var testDiv;

  setup(function() {
    testDiv = document.body.appendChild(document.createElement('div'));
  })

  teardown(function() {
    document.body.removeChild(testDiv);
  });

  function createTestHtml(s) {
    var div = document.createElement('div');
    div.innerHTML = s;
    testDiv.appendChild(div);

    Array.prototype.forEach.call(div.querySelectorAll(
        HTMLTemplateElement.allTemplatesSelectors),
      function(t) {
        HTMLTemplateElement.decorate(t);
      }
    );

    return div;
  }

  function dispatchEvent(type, target) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent(type, true, false);
    target.dispatchEvent(event);
  }

  test('Template', function() {
    var div = createTestHtml(
        '<template bind={{}}>text</template>');
    HTMLTemplateElement.bindTree(div);
    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('text', div.lastChild.textContent);
  });

  test('Template-Empty Bind', function() {
    var div = createTestHtml(
        '<template bind>text</template>');
    HTMLTemplateElement.bindTree(div);
    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('text', div.lastChild.textContent);
  });

  test('TextTemplateWithNullStringBinding', function() {
    var div = createTestHtml(
        '<template bind={{}}>a{{b}}c</template>');
    var model =  {b: 'B'};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('aBc', div.lastChild.textContent);

    model.b = 'b';
    Model.notifyChanges();
    assert.strictEqual('abc', div.lastChild.textContent);

    model.b = undefined;
    Model.notifyChanges();
    assert.strictEqual('ac', div.lastChild.textContent);

    model = undefined;
    Model.notifyChanges();
    // setting model isn't observable.
    assert.strictEqual('ac', div.lastChild.textContent);
  });

  test('TextTemplateWithBindingPath', function() {
    var div = createTestHtml(
        '<template bind="{{ data }}">a{{b}}c</template>');
    var model =  { data: {b: 'B'} };
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('aBc', div.lastChild.textContent);

    model.data.b = 'b';
    Model.notifyChanges();
    assert.strictEqual('abc', div.lastChild.textContent);

    model.data = {b: 'X'};
    Model.notifyChanges();
    assert.strictEqual('aXc', div.lastChild.textContent);

    model.data = undefined;
    Model.notifyChanges();
    assert.strictEqual('ac', div.lastChild.textContent);
  });

  test('TextTemplateWithBindingAndConditional', function() {
    var div = createTestHtml(
        '<template bind="{{}}" if="{{ d }}">a{{b}}c</template>');
    var model =  {b: 'B', d: 1};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('aBc', div.lastChild.textContent);

    model.b = 'b';
    Model.notifyChanges();
    assert.strictEqual('abc', div.lastChild.textContent);

    model.d = '';
    Model.notifyChanges();
    assert.strictEqual(1, div.childNodes.length);

    model.d = 'here';
    model.b = 'd';

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('adc', div.lastChild.textContent);
  });

  test('TemplateWithTextBinding2', function() {
    var div = createTestHtml(
        '<template bind="{{ b }}">a{{value}}c</template>');
    assert.strictEqual(1, div.childNodes.length);
    var model = {b: {value: 'B'}};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('aBc', div.lastChild.textContent);

    model.b = {value: 'b'};
    Model.notifyChanges();
    assert.strictEqual('abc', div.lastChild.textContent);
  });

  test('TemplateWithAttributeBinding', function() {
    var div = createTestHtml(
        '<template bind="{{}}">' +
        '<div foo="a{{b}}c"></div>' +
        '</template>');
    var model = {b: 'B'};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('aBc', div.lastChild.getAttribute('foo'));

    model.b = 'b';
    Model.notifyChanges();
    assert.strictEqual('abc', div.lastChild.getAttribute('foo'));

    model.b = 'X';
    Model.notifyChanges();
    assert.strictEqual('aXc', div.lastChild.getAttribute('foo'));
  });

  test('TemplateWithConditionalBinding', function() {
    var div = createTestHtml(
        '<template bind="{{}}">' +
        '<div foo?="{{b}}"></div>' +
        '</template>');
    var model = {b: 'b'};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.isTrue(div.lastChild.hasAttribute('foo'));
    assert.isFalse(div.lastChild.hasAttribute('foo?'));
    assert.strictEqual('', div.lastChild.getAttribute('foo'));

    model.b = null;
    Model.notifyChanges();
    assert.isFalse(div.lastChild.hasAttribute('foo'));
  });

  test('Repeat', function() {
    var div = createTestHtml(
        '<template repeat="{{}}"">text</template>');

    var model = [0, 1, 2];
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);

    model.length = 1;
    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);

    model.push(3, 4);
    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);

    model.splice(1, 1);
    Model.notifyChanges();
    assert.strictEqual(3, div.childNodes.length);
  });

  test('Repeat-Empty', function() {
    var div = createTestHtml(
        '<template repeat>text</template>');

    var model = [0, 1, 2];
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);

    model.length = 1;
    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);

    model.push(3, 4);
    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);

    model.splice(1, 1);
    Model.notifyChanges();
    assert.strictEqual(3, div.childNodes.length);
  });

  test('Removal from iteration needs to unbind', function() {
    var div = createTestHtml(
        '<template repeat="{{}}"><a>{{v}}</a></template>');
    var model = [{v: 0}, {v: 1}, {v: 2}, {v: 3}, {v: 4}];
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();

    var as = [];
    for (var node = div.firstChild.nextSibling; node; node = node.nextSibling) {
      as.push(node);
    }
    var vs = model.slice();  // copy

    for (var i = 0; i < 5; i++) {
      assert.equal(as[i].textContent, String(i));
    }

    model.length = 3;
    Model.notifyChanges();
    for (var i = 0; i < 5; i++) {
      assert.equal(as[i].textContent, String(i));
    }

    vs[3].v = 33;
    vs[4].v = 44;
    Model.notifyChanges();
    for (var i = 0; i < 5; i++) {
      assert.equal(as[i].textContent, String(i));
    }
  });

  test('DOM Stability on Iteration', function() {
    var div = createTestHtml(
        '<template repeat="{{}}">{{}}</template>');
    var model = [1, 2, 3, 4, 5];
    HTMLTemplateElement.bindTree(div, model);

    function getInstanceNode(index) {
      var node = div.firstChild.nextSibling;
      while (index-- > 0) {
        node = node.nextSibling;
      }
      return node;
    }

    function setInstanceExpando(index, value) {
      getInstanceNode(index)['expando'] = value;
    }

    function getInstanceExpando(index) {
      return getInstanceNode(index)['expando'];
    }

    Model.notifyChanges();
    setInstanceExpando(0, 0);
    setInstanceExpando(1, 1);
    setInstanceExpando(2, 2);
    setInstanceExpando(3, 3);
    setInstanceExpando(4, 4);

    model.shift();
    model.pop();

    Model.notifyChanges();
    assert.strictEqual(1, getInstanceExpando(0));
    assert.strictEqual(2, getInstanceExpando(1));
    assert.strictEqual(3, getInstanceExpando(2));

    model.unshift(5);
    model[2] = 6;
    model.push(7);

    Model.notifyChanges();
    assert.strictEqual(undefined, getInstanceExpando(0));
    assert.strictEqual(1, getInstanceExpando(1));
    assert.strictEqual(undefined, getInstanceExpando(2));
    assert.strictEqual(3, getInstanceExpando(3));
    assert.strictEqual(undefined, getInstanceExpando(4));

    setInstanceExpando(0, 5);
    setInstanceExpando(2, 6);
    setInstanceExpando(4, 7);

    model.splice(2, 0, 8);

    Model.notifyChanges();
    assert.strictEqual(5, getInstanceExpando(0));
    assert.strictEqual(1, getInstanceExpando(1));
    assert.strictEqual(undefined, getInstanceExpando(2));
    assert.strictEqual(6, getInstanceExpando(3));
    assert.strictEqual(3, getInstanceExpando(4));
    assert.strictEqual(7, getInstanceExpando(5));
  });

  test('Repeat2', function() {
    var div = createTestHtml(
        '<template repeat="{{}}">{{value}}</template>');
    assert.strictEqual(1, div.childNodes.length);

    var model = [
      {value: 0},
      {value: 1},
      {value: 2}
    ];
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);
    assert.strictEqual('0', div.childNodes[1].textContent);
    assert.strictEqual('1', div.childNodes[2].textContent);
    assert.strictEqual('2', div.childNodes[3].textContent);

    model[1].value = 'One';
    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);
    assert.strictEqual('0', div.childNodes[1].textContent);
    assert.strictEqual('One', div.childNodes[2].textContent);
    assert.strictEqual('2', div.childNodes[3].textContent);

    model.splice(0, 1, {value: 'Zero'});
    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);
    assert.strictEqual('Zero', div.childNodes[1].textContent);
    assert.strictEqual('One', div.childNodes[2].textContent);
    assert.strictEqual('2', div.childNodes[3].textContent);
  });

  test('TemplateWithInputValue', function() {
    var div = createTestHtml(
        '<template bind="{{}}">' +
        '<input value="{{x}}">' +
        '</template>');
    var model = {x: 'hi'};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('hi', div.lastChild.value);

    model.x = 'bye';
    assert.strictEqual('hi', div.lastChild.value);
    Model.notifyChanges();
    assert.strictEqual('bye', div.lastChild.value);

    div.lastChild.value = 'hello';
    dispatchEvent('input', div.lastChild);
    assert.strictEqual('hello', model.x);
    Model.notifyChanges();
    assert.strictEqual('hello', div.lastChild.value);
  });

//////////////////////////////////////////////////////////////////////////////

  test('Decorated', function() {
    var div = createTestHtml(
        '<template bind="{{ XX }}" id="t1">' +
          '<p>Crew member: {{name}}, Job title: {{title}}</p>' +
        '</template>' +
        '<template bind="{{ XY }}" id="t2" ref="t1"></template>');

    var model = {
      XX: {name: 'Leela', title: 'Captain'},
      XY: {name: 'Fry', title: 'Delivery boy'},
      XZ: {name: 'Zoidberg', title: 'Doctor'}
    };
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();

    var t1 = document.getElementById('t1');
    var instance = t1.nextElementSibling;
    assert.strictEqual('Crew member: Leela, Job title: Captain', instance.textContent);

    var t2 = document.getElementById('t2');
    instance = t2.nextElementSibling;
    assert.strictEqual('Crew member: Fry, Job title: Delivery boy',
                 instance.textContent);

    assert.strictEqual(4, div.children.length);
    assert.strictEqual(4, div.childNodes.length);

    assert.strictEqual('P', div.childNodes[1].tagName);
    assert.strictEqual('P', div.childNodes[3].tagName);
  });

  test('DefaultStyles', function() {
    var t = document.createElement('template');
    HTMLTemplateElement.decorate(t);

    document.body.appendChild(t);
    assert.strictEqual('none', getComputedStyle(t, null).display);

    document.body.removeChild(t);
  });


  test('Bind', function() {
    var div = createTestHtml('<template bind="{{}}">Hi {{ name }}</template>');
    var model = {name: 'Leela'};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual('Hi Leela', div.childNodes[1].textContent);
  });

  test('BindImperative', function() {
    var div = createTestHtml(
        '<template>' +
          'Hi {{ name }}' +
        '</template>');
    var t = div.firstChild;

    var model = {name: 'Leela'};
    t.bind('bind', model);

    Model.notifyChanges();
    assert.strictEqual('Hi Leela', div.childNodes[1].textContent);
  });

  test('BindPlaceHolderHasNewLine', function() {
    var div = createTestHtml('<template bind="{{}}">Hi {{\nname\n}}</template>');
    var model = {name: 'Leela'};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual('Hi Leela', div.childNodes[1].textContent);
  });

  test('BindWithRef', function() {
    var id = 't' + Math.random();
    var div = createTestHtml(
        '<template id="' + id +'">' +
          'Hi {{ name }}' +
        '</template>' +
        '<template ref="' + id + '" bind="{{}}"></template>');

    var t1 = div.firstChild;
    var t2 = div.childNodes[1];

    assert.strictEqual(t1, t2.ref);

    var model = {name: 'Fry'};
    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual('Hi Fry', t2.nextSibling.textContent);
  });

  test('BindChanged', function() {
    var model = {
      XX: {name: 'Leela', title: 'Captain'},
      XY: {name: 'Fry', title: 'Delivery boy'},
      XZ: {name: 'Zoidberg', title: 'Doctor'}
    };

    var div = createTestHtml(
        '<template bind="{{ XX }}">Hi {{ name }}</template>');

    HTMLTemplateElement.bindTree(div, model);

    var t = div.firstChild;
    Model.notifyChanges();

    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('Hi Leela', t.nextSibling.textContent);

    t.bind('bind', model, 'XZ');
    Model.notifyChanges();

    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('Hi Zoidberg', t.nextSibling.textContent);
  });

  function assertNodesAre() {
    var expectedLength = arguments.length;
    assert.strictEqual(expectedLength + 1, div.childNodes.length);

    for (var i = 0; i < arguments.length; i++) {
      var targetNode = div.childNodes[i + 1];
      assert.strictEqual(arguments[i], targetNode.textContent);
    }
  }

  test('Repeat3', function() {
    div = createTestHtml('<template repeat="{{ contacts }}">Hi {{ name }}</template>');
    t = div.firstChild;

    var m = {
      contacts: [
        {name: 'Raf'},
        {name: 'Arv'},
        {name: 'Neal'}
      ]
    };

    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    assertNodesAre('Hi Raf', 'Hi Arv', 'Hi Neal');

    m.contacts.push({name: 'Alex'});
    Model.notifyChanges();
    assertNodesAre('Hi Raf', 'Hi Arv', 'Hi Neal', 'Hi Alex');

    m.contacts.splice(0, 2, {name: 'Rafael'}, {name: 'Erik'});
    Model.notifyChanges();
    assertNodesAre('Hi Rafael', 'Hi Erik', 'Hi Neal', 'Hi Alex');

    m.contacts.splice(1, 2);
    Model.notifyChanges();
    assertNodesAre('Hi Rafael', 'Hi Alex');

    m.contacts.splice(1, 0, {name: 'Erik'}, {name: 'Dimitri'});
    Model.notifyChanges();
    assertNodesAre('Hi Rafael', 'Hi Erik', 'Hi Dimitri', 'Hi Alex');

    m.contacts.splice(0, 1, {name: 'Tab'}, {name: 'Neal'});
    Model.notifyChanges();
    assertNodesAre('Hi Tab', 'Hi Neal', 'Hi Erik', 'Hi Dimitri', 'Hi Alex');

    m.contacts = [{name: 'Alex'}];
    Model.notifyChanges();
    assertNodesAre('Hi Alex');

    m.contacts.length = 0;
    Model.notifyChanges();
    assertNodesAre();
  });

  test('RepeatModelSet', function() {
    div = createTestHtml(
        '<template repeat="{{ contacts }}">' +
          'Hi {{ name }}' +
        '</template>');
    var m = {
      contacts: [
        {name: 'Raf'},
        {name: 'Arv'},
        {name: 'Neal'}
      ]
    };
    HTMLTemplateElement.bindTree(div, m);

    Model.notifyChanges();
    t = div.firstChild;

    assertNodesAre('Hi Raf', 'Hi Arv', 'Hi Neal');
  });

  test('RepeatEmptyPath', function() {
    div = createTestHtml('<template repeat="{{}}">Hi {{ name }}</template>');
    t = div.firstChild;

    var m = [
      {name: 'Raf'},
      {name: 'Arv'},
      {name: 'Neal'}
    ];
    HTMLTemplateElement.bindTree(div, m);

    Model.notifyChanges();

    assertNodesAre('Hi Raf', 'Hi Arv', 'Hi Neal');

    m.push({name: 'Alex'});
    Model.notifyChanges();
    assertNodesAre('Hi Raf', 'Hi Arv', 'Hi Neal', 'Hi Alex');

    m.splice(0, 2, {name: 'Rafael'}, {name: 'Erik'});
    Model.notifyChanges();
    assertNodesAre('Hi Rafael', 'Hi Erik', 'Hi Neal', 'Hi Alex');

    m.splice(1, 2);
    Model.notifyChanges();
    assertNodesAre('Hi Rafael', 'Hi Alex');

    m.splice(1, 0, {name: 'Erik'}, {name: 'Dimitri'});
    Model.notifyChanges();
    assertNodesAre('Hi Rafael', 'Hi Erik', 'Hi Dimitri', 'Hi Alex');

    m.splice(0, 1, {name: 'Tab'}, {name: 'Neal'});
    Model.notifyChanges();
    assertNodesAre('Hi Tab', 'Hi Neal', 'Hi Erik', 'Hi Dimitri', 'Hi Alex');

    m.length = 0;
    m.push({name: 'Alex'});
    Model.notifyChanges();
    assertNodesAre('Hi Alex');
  });

  test('RepeatNullModel', function() {
    div = createTestHtml('<template repeat="{{}}">Hi {{ name }}</template>');
    t = div.firstChild;

    var m = null;
    HTMLTemplateElement.bindTree(div, m);

    Model.notifyChanges();
    assert.strictEqual(1, div.childNodes.length);

    t.iterate = '';
    m = {};
    HTMLTemplateElement.bindTree(div, m);

    Model.notifyChanges();
    assert.strictEqual(1, div.childNodes.length);
  });

  test('RepeatReuse', function() {
    div = createTestHtml('<template repeat="{{}}">Hi {{ name }}</template>');
    t = div.firstChild;

    var m = [
      {name: 'Raf'},
      {name: 'Arv'},
      {name: 'Neal'}
    ];
    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    assertNodesAre('Hi Raf', 'Hi Arv', 'Hi Neal');
    var node1 = div.childNodes[1];
    var node2 = div.childNodes[2];
    var node3 = div.childNodes[3];

    m.splice(1, 1, {name: 'Erik'});
    Model.notifyChanges();
    assertNodesAre('Hi Raf', 'Hi Erik', 'Hi Neal');
    assert.strictEqual(node1, div.childNodes[1],
        'model[0] did not change so the node should not have changed');
    assert.notStrictEqual(node2, div.childNodes[2],
        'Should not reuse when replacing');
    assert.strictEqual(node3, div.childNodes[3],
        'model[2] did not change so the node should not have changed');

    node2 = div.childNodes[2];
    m.splice(0, 0, {name: 'Alex'});
    Model.notifyChanges();
    assertNodesAre('Hi Alex', 'Hi Raf', 'Hi Erik', 'Hi Neal');
  });

  test('TwoLevelsDeepBug', function() {
    div = createTestHtml(
      '<template bind="{{}}"><span><span>{{ foo }}</span></span></template>');

    var model = {foo: 'bar'};
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();

    assert.strictEqual('bar',
                 div.childNodes[1].childNodes[0].childNodes[0].textContent);
  });

  test('Checked', function() {
    var div = createTestHtml(
        '<template>' +
          '<input type="checkbox" checked="{{a}}">' +
        '</template>');
    var t = div.firstChild;
    var m = {
      a: true
    };
    t.bind('bind', m);
    Model.notifyChanges();

    var instanceInput = t.nextSibling;
    assert.isTrue(instanceInput.checked);

    instanceInput.checked = false;
    dispatchEvent('click', instanceInput);
    assert.isFalse(instanceInput.checked);

    instanceInput.checked = true;
    dispatchEvent('click', instanceInput);
    assert.isTrue(instanceInput.checked);
  });

  function nestedHelper(s, start) {
    var div = createTestHtml(s);

    var m = {
      a: {
        b: 1,
        c: {d: 2}
      },
    };

    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    var i = start;
    assert.strictEqual('1', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('2', div.childNodes[i++].textContent);

    m.a.b = 11;
    Model.notifyChanges();
    assert.strictEqual('11', div.childNodes[start].textContent);

    m.a.c = {d: 22};
    Model.notifyChanges();
    assert.strictEqual('22', div.childNodes[start + 2].textContent);
  }

  test('Nested', function() {
    nestedHelper(
        '<template bind="{{a}}">' +
          '{{b}}' +
          '<template bind="{{c}}">' +
            '{{d}}' +
          '</template>' +
        '</template>', 1);
  });

  test('NestedWithRef', function() {
    nestedHelper(
        '<template id="inner">{{d}}</template>' +
        '<template id="outer" bind="{{a}}">' +
          '{{b}}' +
          '<template ref="inner" bind="{{c}}"></template>' +
        '</template>', 2);
  });

  function nestedIterateInstantiateHelper(s, start) {
    var div = createTestHtml(s);

    var m = {
      a: [
        {
          b: 1,
          c: {d: 11}
        },
        {
          b: 2,
          c: {d: 22}
        }
      ]
    };

    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    var i = start;
    assert.strictEqual('1', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('11', div.childNodes[i++].textContent);
    assert.strictEqual('2', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('22', div.childNodes[i++].textContent);

    m.a[1] = {
      b: 3,
      c: {d: 33}
    };

    Model.notifyChanges();
    assert.strictEqual('3', div.childNodes[start + 3].textContent);
    assert.strictEqual('33', div.childNodes[start + 5].textContent);
  }

  test('NestedRepeatBind', function() {
    nestedIterateInstantiateHelper(
        '<template repeat="{{a}}">' +
          '{{b}}' +
          '<template bind="{{c}}">' +
            '{{d}}' +
          '</template>' +
        '</template>', 1);
  });

  test('NestedRepeatBindWithRef', function() {
    nestedIterateInstantiateHelper(
        '<template id="inner">' +
          '{{d}}' +
        '</template>' +
        '<template repeat="{{a}}">' +
          '{{b}}' +
          '<template ref="inner" bind="{{c}}"></template>' +
        '</template>', 2);
  });

  function nestedIterateIterateHelper(s, start) {
    var div = createTestHtml(s);

    var m = {
      a: [
        {
          b: 1,
          c: [{d: 11}, {d: 12}]
        },
        {
          b: 2,
          c: [{d: 21}, {d: 22}]
        }
      ]
    };

    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    var i = start;
    assert.strictEqual('1', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('11', div.childNodes[i++].textContent);
    assert.strictEqual('12', div.childNodes[i++].textContent);
    assert.strictEqual('2', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('21', div.childNodes[i++].textContent);
    assert.strictEqual('22', div.childNodes[i++].textContent);

    m.a[1] = {
      b: 3,
      c: [{d: 31}, {d: 32}, {d: 33}]
    };

    i = start + 4;
    Model.notifyChanges();
    assert.strictEqual('3', div.childNodes[start + 4].textContent);
    assert.strictEqual('31', div.childNodes[start + 6].textContent);
    assert.strictEqual('32', div.childNodes[start + 7].textContent);
    assert.strictEqual('33', div.childNodes[start + 8].textContent);
  }

  test('NestedRepeatBind', function() {
    nestedIterateIterateHelper(
        '<template repeat="{{a}}">' +
          '{{b}}' +
          '<template repeat="{{c}}">' +
            '{{d}}' +
          '</template>' +
        '</template>', 1);
  });

  test('NestedRepeatRepeatWithRef', function() {
    nestedIterateIterateHelper(
        '<template id="inner">' +
          '{{d}}' +
        '</template>' +
        '<template repeat="{{a}}">' +
          '{{b}}' +
          '<template ref="inner" repeat="{{c}}"></template>' +
        '</template>', 2);
  });

  test('NestedRepeatSelfRef', function() {
    var div = createTestHtml(
        '<template id="t" repeat="{{}}">' +
          '{{name}}' +
          '<template ref="t" repeat="{{items}}"></template>' +
        '</template>');

    var m = [
      {
        name: 'Item 1',
        items: [
          {
            name: 'Item 1.1',
            items: [
              {
                 name: 'Item 1.1.1',
                 items: []
              }
            ]
          },
          {
            name: 'Item 1.2'
          }
        ]
      },
      {
        name: 'Item 2',
        items: []
      },
    ];

    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    var i = 1;
    assert.strictEqual('Item 1', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('Item 1.1', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('Item 1.1.1', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('Item 1.2', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('Item 2', div.childNodes[i++].textContent);

    m[0] = {
      name: 'Item 1 changed'
    };

    i = 1;
    Model.notifyChanges();
    assert.strictEqual('Item 1 changed', div.childNodes[i++].textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[i++].tagName);
    assert.strictEqual('Item 2', div.childNodes[i++].textContent);
  });

  test('NestedIterateTableMixedSemanticNative', function() {
    if (!hasNativeTemplates)
      return;

    var div = createTestHtml(
        '<table><tbody>' +
          '<template repeat="{{}}">' +
            '<tr>' +
              '<td template repeat="{{}}" class="{{ val }}">{{ val }}</td>' +
            '</tr>' +
          '</template>' +
        '</tbody></table>');

    var m = [
      [{ val: 0 }, { val: 1 }],
      [{ val: 2 }, { val: 3 }]
    ];

    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    var i = 1;
    var tbody = div.childNodes[0].childNodes[0];

    // 1 for the <tr template>, 2 * (1 tr)
    assert.strictEqual(3, tbody.childNodes.length);

    // 1 for the <td template>, 2 * (1 td)
    assert.strictEqual(3, tbody.childNodes[1].childNodes.length);
    assert.strictEqual('0', tbody.childNodes[1].childNodes[1].textContent)
    assert.strictEqual('1', tbody.childNodes[1].childNodes[2].textContent)

    // 1 for the <td template>, 2 * (1 td)
    assert.strictEqual(3, tbody.childNodes[2].childNodes.length);
    assert.strictEqual('2', tbody.childNodes[2].childNodes[1].textContent)
    assert.strictEqual('3', tbody.childNodes[2].childNodes[2].textContent)

    // Asset the 'class' binding is retained on the semantic template (just check
    // the last one).
    assert.strictEqual('3', tbody.childNodes[2].childNodes[2].getAttribute("class"));
  });

  test('NestedIterateTable', function() {
    var div = createTestHtml(
        '<table><tbody>' +
          '<tr template repeat="{{}}">' +
            '<td template repeat="{{}}" class="{{ val }}">{{ val }}</td>' +
          '</tr>' +
        '</tbody></table>');

    var m = [
      [{ val: 0 }, { val: 1 }],
      [{ val: 2 }, { val: 3 }]
    ];

    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    var i = 1;
    var tbody = div.childNodes[0].childNodes[0];

    // 1 for the <tr template>, 2 * (1 tr)
    assert.strictEqual(3, tbody.childNodes.length);

    // 1 for the <td template>, 2 * (1 td)
    assert.strictEqual(3, tbody.childNodes[1].childNodes.length);
    assert.strictEqual('0', tbody.childNodes[1].childNodes[1].textContent)
    assert.strictEqual('1', tbody.childNodes[1].childNodes[2].textContent)

    // 1 for the <td template>, 2 * (1 td)
    assert.strictEqual(3, tbody.childNodes[2].childNodes.length);
    assert.strictEqual('2', tbody.childNodes[2].childNodes[1].textContent)
    assert.strictEqual('3', tbody.childNodes[2].childNodes[2].textContent)

    // Asset the 'class' binding is retained on the semantic template (just check
    // the last one).
    assert.strictEqual('3', tbody.childNodes[2].childNodes[2].getAttribute("class"));
  });

  test('NestedRepeatDeletionOfMultipleSubTemplates', function() {
    var div = createTestHtml(
        '<ul>' +
          '<template repeat="{{}}" id=t1>' +
            '<li>{{name}}' +
              '<ul>' +
                '<template ref=t1 repaet="{{items}}"></template>' +
              '</ul>' +
            '</li>' +
          '</template>' +
        '</ul>');

    var m = [
      {
        name: 'Item 1',
        items: [
          {
            name: 'Item 1.1'
          }
        ]
      }
    ];

    HTMLTemplateElement.bindTree(div, m);

    Model.notifyChanges();
    m.splice(0, 1);
    Model.notifyChanges();
  });

  test('DeepNested', function() {
    var div = createTestHtml(
      '<template bind="{{a}}">' +
        '<p>' +
          '<template bind="{{b}}">' +
            '{{ c }}' +
          '</template>' +
        '</p>' +
      '</template>');

    var m = {
      a: {
        b: {
          c: 42
        }
      }
    };
    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    assert.strictEqual('P', div.childNodes[1].tagName);
    assert.strictEqual('TEMPLATE', div.childNodes[1].firstChild.tagName);
    assert.strictEqual('42', div.childNodes[1].childNodes[1].textContent);
  });

  test('TemplateContentRemoved', function() {
    var div = createTestHtml('<template bind="{{}}">{{ }}</template>');
    var model = 42;

    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual('42', div.childNodes[1].textContent);
    assert.strictEqual('', div.childNodes[0].textContent);
  });

  test('TemplateContentRemovedEmptyArray', function() {
    var div = createTestHtml('<template iterate>Remove me</template>');
    var model = [];

    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual(1, div.childNodes.length);
    assert.strictEqual('', div.childNodes[0].textContent);
  });

  test('TemplateContentRemovedNested', function() {
    var div = createTestHtml(
        '<template bind="{{}}">' +
          '{{ a }}' +
          '<template bind="{{}}">' +
            '{{ b }}' +
          '</template>' +
        '</template>');

    var model = {
      a: 1,
      b: 2
    };
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();

    assert.strictEqual('', div.childNodes[0].textContent);
    assert.strictEqual('1', div.childNodes[1].textContent);
    assert.strictEqual('', div.childNodes[2].textContent);
    assert.strictEqual('2', div.childNodes[3].textContent);
  });

  test('BindWithUndefinedModel', function() {
    var div = createTestHtml('<template bind="{{}}" if="{{}}">{{ a }}</template>');

    var model = {a: 42};
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual('42', div.childNodes[1].textContent);

    model = undefined;
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual(1, div.childNodes.length);

    model = {a: 42};
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual('42', div.childNodes[1].textContent);
  });

  test('BindNested', function() {
    var div = createTestHtml(
        '<template bind="{{}}">' +
          'Name: {{ name }}' +
          '<template bind="{{wife}}" if="{{wife}}">' +
            'Wife: {{ name }}' +
          '</template>' +
          '<template bind="{{child}}" if="{{child}}">' +
            'Child: {{ name }}' +
          '</template>' +
        '</template>');

    var m = {
      name: 'Hermes',
      wife: {
        name: 'LaBarbara'
      }
    };
    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    assert.strictEqual(5, div.childNodes.length);
    assert.strictEqual('Name: Hermes', div.childNodes[1].textContent);
    assert.strictEqual('Wife: LaBarbara', div.childNodes[3].textContent);

    m.child = {name: 'Dwight'};
    Model.notifyChanges();
    assert.strictEqual(6, div.childNodes.length);
    assert.strictEqual('Child: Dwight', div.childNodes[5].textContent);

    delete m.wife;
    Model.notifyChanges();
    assert.strictEqual(5, div.childNodes.length);
    assert.strictEqual('Child: Dwight', div.childNodes[4].textContent);
  });

  test('BindRecursive', function() {
    var div = createTestHtml(
        '<template bind="{{}}" if="{{}}" id="t">' +
          'Name: {{ name }}' +
          '<template bind="{{friend}}" if="{{friend}}" ref="t"></template>' +
        '</template>');

    var m = {
      name: 'Fry',
      friend: {
        name: 'Bender'
      }
    };
    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    assert.strictEqual(5, div.childNodes.length);
    assert.strictEqual('Name: Fry', div.childNodes[1].textContent);
    assert.strictEqual('Name: Bender', div.childNodes[3].textContent);

    m.friend.friend = {name: 'Leela'};
    Model.notifyChanges();
    assert.strictEqual(7, div.childNodes.length);
    assert.strictEqual('Name: Leela', div.childNodes[5].textContent);

    m.friend = {name: 'Leela'};
    Model.notifyChanges();
    assert.strictEqual(5, div.childNodes.length);
    assert.strictEqual('Name: Leela', div.childNodes[3].textContent);
  });

  test('ChangeFromBindToRepeat', function() {
    var div = createTestHtml(
        '<template bind="{{a}}">' +
          '{{ length }}' +
        '</template>');
    var template = div.firstChild;

    var m = {
      a: [
        {length: 0},
        {
          length: 1,
          b: {length: 4}
        },
        {length: 2}
      ]
    };
    HTMLTemplateElement.bindTree(div, m);
    Model.notifyChanges();

    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('3', div.childNodes[1].textContent);

    template.unbind('bind');
    template.bind('repeat', m, 'a');
    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);
    assert.strictEqual('0', div.childNodes[1].textContent);
    assert.strictEqual('1', div.childNodes[2].textContent);
    assert.strictEqual('2', div.childNodes[3].textContent);

    template.unbind('repeat');
    template.bind('bind', m, 'a.1.b')

    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('4', div.childNodes[1].textContent);
  });

  test('ChangeRefId', function() {
    var div = createTestHtml(
        '<template id="a">a:{{ }}</template>' +
        '<template id="b">b:{{ }}</template>' +
        '<template repeat="{{}}">' +
          '<template ref="a" bind="{{}}"></template>' +
        '</template>');
    var model = [];
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();

    assert.strictEqual(3, div.childNodes.length);

    document.getElementById('a').id = 'old-a';
    document.getElementById('b').id = 'a';

    model.push(1, 2);
    Model.notifyChanges();

    assert.strictEqual(7, div.childNodes.length);
    assert.strictEqual('b:1', div.childNodes[4].textContent);
    assert.strictEqual('b:2', div.childNodes[6].textContent);
  });

  test('Content', function() {
    var div = createTestHtml(
        '<template><a></a></template>' +
        '<template><b></b></template>');
    var templateA = div.firstChild;
    var templateB = div.lastChild;
    var contentA = templateA.content;
    var contentB = templateB.content;
    assert.notStrictEqual(contentA, undefined);

    assert.notStrictEqual(templateA.ownerDocument, contentA.ownerDocument);
    assert.notStrictEqual(templateB.ownerDocument, contentB.ownerDocument);

    assert.strictEqual(templateA.ownerDocument, templateB.ownerDocument);
    assert.strictEqual(contentA.ownerDocument, contentB.ownerDocument);

    assert.strictEqual(templateA.ownerDocument.defaultView, window);
    assert.strictEqual(templateB.ownerDocument.defaultView, window);

    assert.strictEqual(contentA.ownerDocument.defaultView, null);
    assert.strictEqual(contentB.ownerDocument.defaultView, null);

    assert.strictEqual(contentA.firstChild, contentA.lastChild);
    assert.strictEqual(contentA.firstChild.tagName, 'A');

    assert.strictEqual(contentB.firstChild, contentB.lastChild);
    assert.strictEqual(contentB.firstChild.tagName, 'B');
  });

  test('NestedContent', function() {
    var div = createTestHtml(
        '<template>' +
        '<template></template>' +
        '</template>');
    var templateA = div.firstChild;
    var templateB = templateA.content.firstChild;

    assert.strictEqual(templateA.content.ownerDocument, templateB.ownerDocument);
    assert.strictEqual(templateA.content.ownerDocument,
                 templateB.content.ownerDocument);
  });

  function createShadowTestHtml(s) {
    var div = document.createElement('div');
    var root = div.webkitCreateShadowRoot();
    root.innerHTML = s;
    testDiv.appendChild(div);

    Array.prototype.forEach.call(root.querySelectorAll(
        HTMLTemplateElement.allTemplatesSelectors),
      function(t) {
        HTMLTemplateElement.decorate(t);
      }
    );

    return root;
  }

  test('BindShadowDOM', function() {
    if (HTMLElement.prototype.webkitCreateShadowRoot) {
      var root = createShadowTestHtml(
          '<template bind="{{}}">Hi {{ name }}</template>');
      var model = {name: 'Leela'};
      HTMLTemplateElement.bindTree(root, model);
      Model.notifyChanges();
      assert.strictEqual('Hi Leela', root.childNodes[1].textContent);
    }
  });

  // https://github.com/toolkitchen/mdv/issues/8
  test('UnbindingInNestedBind', function() {
    var div = createTestHtml(
      '<template bind="{{outer}}" if="{{outer}}" syntax="testHelper">' +
        '<template bind="{{inner}}" if="{{inner}}">' +
          '{{ age }}' +
        '</template>' +
      '</template>');

    var count = 0;
    var expectedAge = 42;
    HTMLTemplateElement.syntax['testHelper'] = {
      getBinding: function(model, path, name, node) {
        if (name != 'textContent' || path != 'age')
          return;

        assert.strictEqual(expectedAge, model.age);
        count++;
      }
    };

    var model = {
      outer: {
        inner: {
          age: 42
        }
      }
    };

    HTMLTemplateElement.bindTree(div, model);

    Model.notifyChanges();
    assert.strictEqual(1, count);

    var inner = model.outer.inner;
    model.outer = null;

    Model.notifyChanges();
    assert.strictEqual(1, count);

    model.outer = {inner: {age: 2}};
    expectedAge = 2;

    Model.notifyChanges();
    assert.strictEqual(2, count);

    testHelper = undefined;
  });

  // https://github.com/toolkitchen/mdv/issues/8
  test('DontCreateInstancesForAbandonedIterators', function() {
    var div = createTestHtml(
      '<template bind="{{}} {{}}">' +
        '<template bind="{{}}">Foo' +
        '</template>' +
      '</template>');
    HTMLTemplateElement.bindTree(div);
    Model.notifyChanges();
    assert.isFalse(!!ChangeSummary._errorThrownDuringCallback);
  });

  test('CreateIntance', function() {
    var div = createTestHtml(
      '<template bind="{{a}}">' +
        '<template bind="{{b}}">' +
          '{{text}}' +
        '</template>' +
      '</template>');
    var outer = div.firstChild;

    var instance = outer.createInstance(null, null);
    assert.strictEqual(instance.firstChild.ref, outer.content.firstChild);

    var instance2 =  outer.createInstance(null, null);
    assert.strictEqual(instance.firstChild.ref, instance2.firstChild.ref);
  });

  test('Bootstrap', function() {
    var div = document.createElement('div');
    div.innerHTML =
      '<template>' +
        '<div></div>' +
        '<template>' +
          'Hello' +
        '</template>' +
      '</template>';

    HTMLTemplateElement.bootstrap(div);
    var template = div.firstChild;
    assert.strictEqual(2, template.content.childNodes.length);
    var template2 = template.content.firstChild.nextSibling;
    assert.strictEqual(1, template2.content.childNodes.length);
    assert.strictEqual('Hello', template2.content.firstChild.textContent);

    var template = document.createElement('template');
    template.innerHTML =
      '<template>' +
        '<div></div>' +
        '<template>' +
          'Hello' +
        '</template>' +
      '</template>';

    HTMLTemplateElement.bootstrap(template);
    var template2 = template.content.firstChild;
    assert.strictEqual(2, template2.content.childNodes.length);
    var template3 = template2.content.firstChild.nextSibling;
    assert.strictEqual(1, template3.content.childNodes.length);
    assert.strictEqual('Hello', template3.content.firstChild.textContent);
  });

  test('__instanceCreated() hack', function() {
    var called = false;
    HTMLTemplateElement.__instanceCreated = function(node) {
      assert.strictEqual(Node.DOCUMENT_FRAGMENT_NODE, node.nodeType);
      called = true;
    }

    var div = createTestHtml('<template bind="{{}}">Foo</template>');
    assert.isFalse(called);

    HTMLTemplateElement.bindTree(div);
    Model.notifyChanges();
    assert.isTrue(called);

    HTMLTemplateElement.__instanceCreated = undefined;
  });
});