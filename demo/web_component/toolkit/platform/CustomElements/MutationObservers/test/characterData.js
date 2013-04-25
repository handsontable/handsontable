/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('JsMutationObserver characterData', function() {

  test('characterData', function() {
    var text = document.createTextNode('abc');
    var observer = new JsMutationObserver(function() {});
    observer.observe(text, {
      characterData: true
    });
    text.data = 'def';
    text.data = 'ghi';

    var records = observer.takeRecords();
    assert.strictEqual(records.length, 2);

    expectRecord(records[0], {
      type: 'characterData',
      target: text
    });
    expectRecord(records[1], {
      type: 'characterData',
      target: text
    });
  });

  test('characterData with old value', function() {
    var text = document.createTextNode('abc');
    var observer = new JsMutationObserver(function() {});
    observer.observe(text, {
      characterData: true,
      characterDataOldValue: true
    });
    text.data = 'def';
    text.data = 'ghi';

    var records = observer.takeRecords();
    assert.strictEqual(records.length, 2);

    expectRecord(records[0], {
      type: 'characterData',
      target: text,
      oldValue: 'abc'
    });
    expectRecord(records[1], {
      type: 'characterData',
      target: text,
      oldValue: 'def'
    });
  });

  test('characterData change in subtree should not generate a record',
      function() {
    var div = document.createElement('div');
    var text = div.appendChild(document.createTextNode('abc'));
    var observer = new JsMutationObserver(function() {});
    observer.observe(div, {
      characterData: true
    });
    text.data = 'def';
    text.data = 'ghi';

    var records = observer.takeRecords();
    assert.strictEqual(records.length, 0);
  });

  test('characterData change in subtree',
      function() {
    var div = document.createElement('div');
    var text = div.appendChild(document.createTextNode('abc'));
    var observer = new JsMutationObserver(function() {});
    observer.observe(div, {
      characterData: true,
      subtree: true
    });
    text.data = 'def';
    text.data = 'ghi';

    var records = observer.takeRecords();
    assert.strictEqual(records.length, 2);

    expectRecord(records[0], {
      type: 'characterData',
      target: text
    });
    expectRecord(records[1], {
      type: 'characterData',
      target: text
    });
  });

});