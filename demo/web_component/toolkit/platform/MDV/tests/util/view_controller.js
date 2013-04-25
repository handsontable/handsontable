// Copyright 2011 Google Inc.
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
suite('View Controller', function() {

  var testDiv;

  setup(function() {
    testDiv = document.body.appendChild(document.createElement('div'));
    testDiv.id = 'testDiv';
  });

  teardown(function() {
    document.body.removeChild(testDiv);
  });

  function dispatchEvent(type, target) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent(type, true, false);
    target.dispatchEvent(event);
  }

  function createTestHtml(s) {
    var div = document.getElementById('testDiv');
    div.innerHTML = s;

    Array.prototype.forEach.call(div.querySelectorAll('template'), function(t) {
      HTMLTemplateElement.decorate(t);
    });
  }

  test('Basic', function() {
    var ctorCount = 0;
    var clickCount = 0;
    var expectName = '';

    function Controller(root) {
      ctorCount++;
      this.model = [
        { name: 'one' },
        { name: 'two' },
        { name: 'three' }
      ];
    }
    Controller.prototype = {
      handleClick: function(item, e) {
        assert.strictEqual(expectName, item.name);
        clickCount++;
      }
    }
    window.Controller = Controller;

    createTestHtml('<ul data-controller="Controller">' +
                     '<template repeat="{{}}">' +
                       '<li data-action="click:handleClick">{{ name }}</li>' +
                     '</template>' +
                   '</ul>');

    Model.notifyChanges();
    var thirdInstance =
        document.getElementById('testDiv').childNodes[0].childNodes[3];
    expectName = 'three';
    assert.strictEqual(expectName, thirdInstance.textContent);
    dispatchEvent('click', thirdInstance);
    assert.strictEqual(1, clickCount);

    var secondInstance =
        document.getElementById('testDiv').childNodes[0].childNodes[2];
    expectName = 'two';
    assert.strictEqual(expectName, secondInstance.textContent);
    dispatchEvent('click', secondInstance);
    assert.strictEqual(2, clickCount);

    assert.strictEqual(1, ctorCount);
  });

});