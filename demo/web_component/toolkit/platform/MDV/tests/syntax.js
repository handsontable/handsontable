// Copyright 2013 Google Inc.

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

suite('Syntax', function() {

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

  test('Registration', function() {
    var model = { foo: 'bar'};
    var testData = [
      {
        model: model,
        path: 'foo',
        name: 'textContent',
        nodeType: Node.TEXT_NODE,
        tagName: undefined
      },
      {
        model: model,
        path: '',
        name: 'bind',
        nodeType: Node.ELEMENT_NODE,
        tagName: 'TEMPLATE'
      },
      {
        model: model,
        path: 'foo',
        name: 'textContent',
        nodeType: Node.TEXT_NODE,
        tagName: undefined
      },
    ];

    HTMLTemplateElement.syntax['Test'] = {
      getBinding: function(model, path, name, node) {
        var data = testData.shift();

        assert.strictEqual(data.model, model);
        assert.strictEqual(data.path, path);
        assert.strictEqual(data.name, name);
        assert.strictEqual(data.nodeType, node.nodeType);
        assert.strictEqual(data.tagName, node.tagName);
      }
    };

    var div = createTestHtml(
        '<template bind syntax="Test">{{ foo }}' +
        '<template bind>{{ foo }}</template></template>');
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);
    assert.strictEqual('bar', div.lastChild.textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[2].tagName)
    assert.strictEqual('Test', div.childNodes[2].getAttribute('syntax'))

    assert.strictEqual(0, testData.length);

    delete HTMLTemplateElement.syntax['Test'];
  });

  test('Basic', function() {
    var model = { foo: 2, bar: 4 };

    HTMLTemplateElement.syntax['2x'] = {
      getBinding: function(model, path, name, node) {
        var match = path.match(/2x:(.*)/);
        if (match == null)
          return;

        path = match[1].trim();
        var binding = new CompoundBinding(function(values) {
          return values['value'] * 2;
        });

        binding.bind('value', model, path);
        return binding;
      }
    };

    var div = createTestHtml(
        '<template bind syntax="2x">' +
        '{{ foo }} + {{ 2x: bar }} + {{ 4x: bar }}</template>');
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual(2, div.childNodes.length);
    assert.strictEqual('2 + 8 + ', div.lastChild.textContent);

    model.foo = 4;
    model.bar = 8;
    Model.notifyChanges();
    assert.strictEqual('4 + 16 + ', div.lastChild.textContent);

    delete HTMLTemplateElement.syntax['2x'];
  });

  test('Different Sub-Template Syntax', function() {
    var model = { foo: 'bar'};

    var testData = [
      {
        model: model,
        path: 'foo',
        name: 'textContent',
        nodeType: Node.TEXT_NODE,
        tagName: undefined
      },
      {
        model: model,
        path: '',
        name: 'bind',
        nodeType: Node.ELEMENT_NODE,
        tagName: 'TEMPLATE'
      }
    ];

    HTMLTemplateElement.syntax['Test'] = {
      getBinding: function(model, path, name, node) {
        var data = testData.shift();

        assert.strictEqual(data.model, model);
        assert.strictEqual(data.path, path);
        assert.strictEqual(data.name, name);
        assert.strictEqual(data.nodeType, node.nodeType);
        assert.strictEqual(data.tagName, node.tagName);
      }
    };

    var test2Data = [
      {
        model: model,
        path: 'foo',
        name: 'textContent',
        nodeType: Node.TEXT_NODE,
        tagName: undefined
      },
    ];

    HTMLTemplateElement.syntax['Test2'] = {
      getBinding: function(model, path, name, node) {
        var data = test2Data.shift();

        assert.strictEqual(data.model, model);
        assert.strictEqual(data.path, path);
        assert.strictEqual(data.name, name);
        assert.strictEqual(data.nodeType, node.nodeType);
        assert.strictEqual(data.tagName, node.tagName);
      }
    };

    var div = createTestHtml(
        '<template bind syntax="Test">{{ foo }}' +
        '<template bind syntax="Test2">{{ foo }}</template></template>');
    HTMLTemplateElement.bindTree(div, model);
    Model.notifyChanges();
    assert.strictEqual(4, div.childNodes.length);
    assert.strictEqual('bar', div.lastChild.textContent);
    assert.strictEqual('TEMPLATE', div.childNodes[2].tagName)
    assert.strictEqual('Test2', div.childNodes[2].getAttribute('syntax'))

    assert.strictEqual(0, testData.length);
    assert.strictEqual(0, test2Data.length);

    delete HTMLTemplateElement.syntax['Test'];
    delete HTMLTemplateElement.syntax['Test2'];
  });
});