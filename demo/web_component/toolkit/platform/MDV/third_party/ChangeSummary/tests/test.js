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

suite('Basic Tests', function() {
  var observer;
  var summaries;
  var callbackCount = 0;

  function doSetup() {
    observer = new ChangeSummary(function(s) {
      callbackCount++;
      summaries = s;
    });
  }
  setup(doSetup);

  function doTeardown() {
    summaries = observer.disconnect();
    assert.isUndefined(summaries);
    callbackCount = 0;
  }
  teardown(doTeardown);

  // TODO(rafaelw): This is a little weak.
  function ensureNonSparse(arr) {
    for (var i = 0; i < arr.length; i++) {
      if (i in arr)
        continue;
      arr[i] = undefined;
    }
  }

  function assertSummary(expect, skipDeliver) {
    if (!skipDeliver)
      observer.deliver();

    var summary = summaries[0];
    assert.strictEqual(expect.object, summary.object);

    if (summary.added || summary.removed || summary.changed || summary.pathChanged) {
      summary.oldValues = {};
      function addOldValues(type) {
        if (!summary[type])
          return;

        Object.keys(summary[type]).forEach(function(prop) {
          summary.oldValues[prop] = summary.getOldValue(prop);
        });
      };
      addOldValues('added');
      addOldValues('removed');
      addOldValues('changed');
      addOldValues('pathChanged');
      delete summary.getOldValue;
    }

    if (expect.splices)
      expect.splices.forEach(function(splice) { ensureNonSparse(splice.removed); });

    assert.deepEqual(expect, summary);

    summaries = undefined;
    callbackCount = 0;
  }

  function assertNoSummary() {
    observer.deliver();
    assert.equal(0, callbackCount);
    summaries = undefined;
  }

  function applySplicesAndAssertDeepEqual(orig, copy) {
    summaries = undefined;
    observer.deliver();
    if (summaries && summaries.length &&
        summaries[0].splices && summaries[0].splices.length) {
      assert.strictEqual(orig, summaries[0].object);

      ChangeSummary.applySplices(copy, orig, summaries[0].splices);
    }

    ensureNonSparse(orig);
    ensureNonSparse(copy);
    assert.deepEqual(orig, copy);
  }

  test('No Delivery On Eval', function() {
    if (typeof Object.observe !== 'function')
      return;

    var obj = {};
    var count = 0;
    function callback() {
      count++;
    }

    Object.observe(obj, callback);
    obj.id = 1;
    Function('var i = 1;');
    eval('var i = 1;');
    assert.equal(0, count);
  });

  test('Delivery Until No Changes', function() {
    doTeardown();

    var arr = [0, 1, 2, 3, 4];
    var callbackCount = 0;
    var observer = new ChangeSummary(function() {
      callbackCount++;
      arr.shift();
    });

    observer.observeArray(arr);
    arr.shift();
    observer.deliver();

    assert.equal(5, callbackCount);
    doSetup();
  });

  test('Degenerate Values', function() {
    assert.equal(null, observer.observePath(null, ''));
    assert.equal(null, ChangeSummary.getValueAtPath(null, ''));
    observer.unobservePath(null, ''); // shouldn't throw

    var foo = {};
    assert.equal(foo, observer.observePath(foo, ''));
    assert.equal(foo, ChangeSummary.getValueAtPath(foo, ''));
    observer.unobservePath(foo, ''); // shouldn't throw

    assert.equal(3, observer.observePath(3, ''));
    assert.equal(3, ChangeSummary.getValueAtPath(3, ''));
    observer.unobservePath(3, ''); // shouldn't throw

    assert.equal(undefined, observer.observePath(undefined, 'a'));
    assert.equal(undefined, ChangeSummary.getValueAtPath(undefined, 'a'));
    observer.unobservePath(undefined, ''); // shouldn't throw

    var bar = { id: 23 };
    assert.equal(undefined, observer.observePath(bar, 'a/3!'));
    assert.equal(undefined, ChangeSummary.getValueAtPath(bar, 'a/3!'));
    observer.unobservePath(undefined, 'a/3!'); // shouldn't throw
  });

  test('Observe NaN', function() {
    var foo = { val: 1 };
    observer.observePath(foo, 'val');
    foo.val = 0/0;

    // Can't use assertSummary because deepEqual() will fail with NaN
    observer.deliver();
    var summary = summaries[0];
    assert.strictEqual(1, summary.getOldValue('val'));
    assert.isTrue(isNaN(summary.pathChanged.val));
  });

  test('GetValueAtPath', function() {
    var obj = {
      a: {
        b: {
          c: 1
        }
      }
    };

    assert.strictEqual(obj.a, ChangeSummary.getValueAtPath(obj, 'a'));
    assert.strictEqual(obj.a.b, ChangeSummary.getValueAtPath(obj, 'a.b'));
    assert.strictEqual(1, ChangeSummary.getValueAtPath(obj, 'a.b.c'));

    obj.a.b.c = 2;
    assert.strictEqual(2, ChangeSummary.getValueAtPath(obj, 'a.b.c'));

    obj.a.b = {
      c: 3
    };
    assert.strictEqual(3, ChangeSummary.getValueAtPath(obj, 'a.b.c'));

    obj.a = {
      b: 4
    };
    assert.strictEqual(undefined, ChangeSummary.getValueAtPath(obj, 'a.b.c'));
    assert.strictEqual(4, ChangeSummary.getValueAtPath(obj, 'a.b'));
  });

  test('SetValueAtPath', function() {
    var obj = {};
    ChangeSummary.setValueAtPath(obj, 'foo', 3);
    assert.equal(3, obj.foo);

    var bar = { baz: 3 };

    ChangeSummary.setValueAtPath(obj, 'bar', bar);
    assert.equal(bar, obj.bar);

    ChangeSummary.setValueAtPath(obj, 'bar.baz.bat', 'not here');
    assert.equal(undefined, ChangeSummary.getValueAtPath(obj, 'bar.baz.bat'));
  });

  test('SetValueBackToSame', function() {
    var obj = {};
    ChangeSummary.setValueAtPath(obj, 'foo', 3);
    assert.equal(3, obj.foo);
    assert.equal(3, observer.observePath(obj, 'foo'));

    ChangeSummary.setValueAtPath(obj, 'foo', 2);
    assert.equal(2, observer.observePath(obj, 'foo'));

    ChangeSummary.setValueAtPath(obj, 'foo', 3);
    assert.equal(3, observer.observePath(obj, 'foo'));

    assertNoSummary();
  });

  test('observeArray(non-array) throws', function() {
    var obj = {};
    assert.throws(function () { observer.observeArray(obj); });
  });

  test('observeObject(array)', function() {
    var arr = [];
    observer.observeObject(arr);

    arr.length = 5;
    arr.foo = 'bar';
    arr[3] = 'baz';

    assertSummary({
      object: arr,
      added: {
        foo: 'bar',
        '3': 'baz'
      },
      removed: {},
      changed: {
        'length': 5
      },
      oldValues: {
        length: 0,
        foo: undefined,
        '3': undefined
      }
    });
  });

  test('Summary Shape', function() {
    var arr = [ 0 ];

    observer.observeObject(arr);
    observer.observeArray(arr);
    observer.observePath(arr, '1');
    observer.observePath(arr, 'foo.bar');

    arr[0] = 1;

    assertSummary({
      object: arr,
      added: {},
      removed: {},
      changed: {
        '0': 1
      },
      pathChanged: {},
      splices: [{
        index: 0,
        removed: [0],
        addedCount: 1
      }],
      oldValues: {
        '0': 0
      }
    });

    arr.foo = {};
    assertSummary({
      object: arr,
      added: {
        'foo': arr.foo
      },
      removed: {},
      changed: {},
      pathChanged: {},
      splices: [],
      oldValues: {
        'foo': undefined
      }
    });

    arr.foo.bar = 5;
    assertSummary({
      object: arr,
      added: {},
      removed: {},
      changed: {},
      pathChanged: {
        'foo.bar': 5
      },
      splices: [],
      oldValues: {
        'foo.bar': undefined
      }
    });
  });

  test('Disconnect and Reconnect', function() {
    var arr = [ 0 ];

    observer.observeObject(arr);
    observer.observeArray(arr);
    observer.observePath(arr, '1');
    observer.observePath(arr, 'foo.bar');

    arr[0] = 1;

    assertSummary({
      object: arr,
      added: {},
      removed: {},
      changed: {
        '0': 1
      },
      pathChanged: {},
      splices: [{
        index: 0,
        removed: [0],
        addedCount: 1
      }],
      oldValues: {
        '0': 0
      }
    });

    summaries = observer.disconnect();
    assert.isUndefined(summaries);
    assert.throws(function() {
      observer.deliver();
    });

    arr.foo = { bar: 'baz' };
    arr.push(2);
    observer.connect();
    assertNoSummary();

    arr.foo.bar = 'bat';
    arr.bag = 'boo';
    arr.pop();

    assertSummary({
      object: arr,
      added: {
        'bag': 'boo'
      },
      removed: {
        '1': undefined
      },
      changed: {
        'length': 1
      },
      pathChanged: {
        'foo.bar': 'bat',
        '1': undefined
      },
      splices: [{
        index: 1,
        removed: [2],
        addedCount: 0
      }],
      oldValues: {
        '1': 2,
        'bag': undefined,
        'foo.bar': 'baz',
        'length': 2
      }
    });

    arr.pop();
    summaries = observer.disconnect();
     assertSummary({
      object: arr,
      added: {},
      removed: {
        '0': undefined
      },
      changed: {
        'length': 0
      },
      pathChanged: {},
      splices: [{
        index: 0,
        removed: [1],
        addedCount: 0
      }],
      oldValues: {
        '0': 1,
        'length': 1
      }
    }, true);
  });

  test('Observe and Unobserve - Paths', function() {
    var arr = {};

    arr.foo = 'bar';
    observer.observePath(arr, 'foo');
    arr.foo = 'baz';
    arr.bat = 'bag';
    observer.observePath(arr, 'bat');

    assertSummary({
      object: arr,
      pathChanged: {
        'foo': 'baz'
      },
      oldValues: {
        'foo': 'bar'
      }
    });

    arr.foo = 'bar';
    observer.unobservePath(arr, 'foo');
    arr.bat = 'boo';
    observer.observePath(arr, 'bat');
    arr.bat = 'boot';

    assertSummary({
      object: arr,
      pathChanged: {
        'bat': 'boot'
      },
      oldValues: {
        'bat': 'bag'
      }
    });
  });

  test('Observe and Unobserve - Object', function() {
    var obj = {};

    obj.foo = 'bar';
    observer.observeObject(obj);
    obj.foo = 'baz';
    obj.bat = 'bag';
    obj.blaz = 'foo';
    observer.observeObject(obj);
    delete obj.foo;
    delete obj.blaz;

    assertSummary({
      object: obj,
      added: {
        'bat': 'bag'
      },
      removed: {
        'foo': undefined
      },
      changed: {},
      oldValues: {
        'foo': 'bar',
        'bat': undefined
      }
    });

    obj.foo = 'blarg';
    observer.unobserveObject(obj);
    obj.bar = 'blaz';
    assertNoSummary();
  });

  test('Observe and Unobserve - Array', function() {
    var arr = [];

    arr.push(0);
    observer.observeArray(arr);
    arr.push(1);
    observer.observeArray(arr);
    arr.push(2);

    assertSummary({
      object: arr,
      splices: [{
        index: 1,
        removed: [],
        addedCount: 2
      }]
    });

    arr.pop();
    observer.unobserveArray(arr);

    arr.unshift(0);
    assertNoSummary();
  });

  test('Observe Object', function() {
    var model = {};

    observer.observeObject(model);
    model.id = 0;
    assertSummary({
      object: model,
      added: {
        id: 0
      },
      removed: {},
      changed: {},
      oldValues: {
        id: undefined
      }
    });

    delete model.id;
    assertSummary({
      object: model,
      added: {},
      removed: {
        id: undefined
      },
      changed: {},
      oldValues: {
        id: 0
      }
    });

    // Stop observing -- shouldn't see an event
    observer.unobserveObject(model);
    model.id = 101;
    assertNoSummary();

    // Re-observe -- should see an new event again.
    observer.observeObject(model);
    model.id2 = 202;;
    assertSummary({
      object: model,
      added: {
        id2: 202
      },
      removed: {},
      changed: {},
      oldValues: {
        id2: undefined
      }
    });
  });

  test('Notify', function() {
    if (typeof Object.getNotifier !== 'function')
      return;

    var model = {
      a: {}
    }

    var _b = 2;

    Object.defineProperty(model.a, 'b', {
      get: function() { return _b; },
      set: function(b) {
        Object.getNotifier(this).notify({
          type: 'updated',
          name: 'b',
          oldValue: _b
        });

        _b = b;
      }
    });

    observer.observePath(model, 'a.b');
    _b = 3; // won't be observed.
    assertNoSummary();

    model.a.b = 4; // will be observed.
    assertSummary({
      object: model,
      pathChanged: {
        'a.b': 4
      },
      oldValues: {
        'a.b': 2
      },
    });
  });

  test('Object Delete Add Delete', function() {
    var model = { id: 1 };

    observer.observeObject(model);
    // If mutation occurs in seperate "runs", two events fire.
    delete model.id;
    assertSummary({
      object: model,
      added: {},
      removed: {
        id: undefined
      },
      changed: {},
      oldValues: {
        id: 1
      }
    });

    model.id = 1;
    assertSummary({
      object: model,
      added: {
        id: 1
      },
      removed: {},
      changed: {},
      oldValues: {
        id: undefined
      }
    });

    // If mutation occurs in the same "run", no events fire (nothing changed).
    delete model.id;
    model.id = 1;
    assertNoSummary();
  });

  test('Observe All', function() {
    var model = { foo: 1, bar: 2, bat: 3 };
    observer.observeObject(model);
    observer.observePath(model, 'foo');

    model.foo = 2;
    model.bar = 3;
    assertSummary({
      object: model,
      added: {},
      removed: {},
      changed: {
        foo: 2,
        bar: 3
      },
      pathChanged: {
        foo: 2
      },
      oldValues: {
        foo: 1,
        bar: 2
      }
    });

    model.bar = 4;
    assertSummary({
      object: model,
      added: {},
      removed: {},
      changed: {
        bar: 4
      },
      pathChanged: {},
      oldValues: {
        bar: 3
      }
    });

    model.foo = 5;
    model.baz = 6;
    delete model.bat;
    assertSummary({
      object: model,
      added: {
        baz: 6
      },
      removed: {
        bat: undefined
      },
      changed: {
        foo: 5
      },
      pathChanged: {
        foo: 5
      },
      oldValues: {
        bat: 3,
        baz: undefined,
        foo: 2
      },
    });
  });

  test('Path Value Triple Equals', function() {
    var model = { };
    observer.observePath(model, 'foo');

    model.foo = null;
    assertSummary({
      object: model,
      pathChanged: {
        foo: null
      },
      oldValues: {
        foo: undefined
      }
    });

    model.foo = undefined;
    assertSummary({
      object: model,
      pathChanged: {
        foo: undefined
      },
      oldValues: {
        foo: null
      }
    });
  });

  test('Path Value Simple', function() {
    var model = { };
    observer.observePath(model, 'foo');

    model.foo = 1;
    assertSummary({
      object: model,
      pathChanged: {
        foo: 1
      },
      oldValues: {
        foo: undefined
      }
    });

    model.foo = 2;
    assertSummary({
      object: model,
      pathChanged: {
        foo: 2
      },
      oldValues: {
        foo: 1
      }
    });

    delete model.foo;
    assertSummary({
      object: model,
      pathChanged: {
        foo: undefined
      },
      oldValues: {
        foo: 2
      }
    });
  });

  test('Path Value With Indices', function() {
    var model = [];
    observer.observePath(model, '0');

    model.push(1);
    assertSummary({
      object: model,
      pathChanged: {
        0: 1
      },
      oldValues: {
        0: undefined
      }
    });
  });

  test('Path Value Lots of Paths', function() {
    var model = {};

    var notificationSequence = '';
    function createCallback() {
      return function(obj) {
        notificationSequence += obj.val;
      };
    }

    observer.observePath(model, 'data.a.c');
    observer.observePath(model, 'data.a.d');
    observer.observePath(model, 'data.b.e');
    observer.observePath(model, 'data.b.f');
    observer.observePath(model, 'data.b');
    observer.observePath(model, 'data.a');
    observer.observePath(model, 'data');
    observer.observeObject(model);

    model.data = {
      a: {
        c: 1,
        d: 2
      },
      b: {
        e: 3,
        f: 4
      }
    };

    assertSummary({
      object: model,
      added: {
        data: model.data
      },
      removed: {},
      changed: {},
      pathChanged: {
        'data': model.data,
        'data.a': model.data.a,
        'data.b': model.data.b,
        'data.a.c': 1,
        'data.a.d': 2,
        'data.b.e': 3,
        'data.b.f': 4
      },
      oldValues: {
        'data': undefined,
        'data.a': undefined,
        'data.b': undefined,
        'data.a.c': undefined,
        'data.a.d': undefined,
        'data.b.e': undefined,
        'data.b.f': undefined
      },
    });
  });

  test('Path Observation', function() {
    var model = {
      a: {
        b: {
          c: 'hello, world'
        }
      }
    };

    observer.observePath(model, 'a.b.c');

    model.a.b.c = 'hello, mom';
    assertSummary({
      object: model,
      pathChanged: {
        'a.b.c': 'hello, mom'
      },
      oldValues: {
        'a.b.c': 'hello, world'
      }
    });

    model.a.b = {
      c: 'hello, dad'
    };
    assertSummary({
      object: model,
      pathChanged: {
        'a.b.c': 'hello, dad'
      },
      oldValues: {
        'a.b.c': 'hello, mom'
      }
    });

    model.a = {
      b: {
        c: 'hello, you'
      }
    };
    assertSummary({
      object: model,
      pathChanged: {
        'a.b.c': 'hello, you'
      },
      oldValues: {
        'a.b.c': 'hello, dad'
      }
    });

    model.a.b = 1;
    assertSummary({
      object: model,
      pathChanged: {
        'a.b.c': undefined
      },
      oldValues: {
        'a.b.c': 'hello, you'
      }
    });

    // Stop observing
    observer.unobservePath(model, 'a.b.c');

    model.a.b = {c: 'hello, back again -- but not observing'};
    assertNoSummary();

    // Resume observing
    observer.observePath(model, 'a.b.c', observer);

    model.a.b.c = 'hello. Back for reals';
    assertSummary({
      object: model,
      pathChanged: {
        'a.b.c': 'hello. Back for reals'
      },
      oldValues: {
        'a.b.c': 'hello, back again -- but not observing',
      }
    });

    // Try to stop observing at different path. Scopes are different,
    // so this should have no effect.
    observer.unobservePath(model.a, 'b.c');
    model.a.b.c = 'hello. scopes are different';
    assertSummary({
      object: model,
      pathChanged: {
        'a.b.c': 'hello. scopes are different'
      },
      oldValues: {
        'a.b.c': 'hello. Back for reals'
      }
    });
  });

  test('Multiple Observations Are Collapsed', function() {
    var model = {id: 1};

    observer.observePath(model, 'id');
    observer.observePath(model, 'id');

    model.id = 2;

    assertSummary({
      object: model,
      pathChanged: {
        'id': 2
      },
      oldValues: {
        'id': 1
      }
    });
  });

  test('Exception Doesnt Stop Notification', function() {
    var model = { id: 1 };
    var count = 0;

    observer.observeObject(model);

    var observer2 = new ChangeSummary(function() {
      callbackCount++;
      throw 'Bad';
    });
    observer2.observeObject(model);

    var observer3 = new ChangeSummary(function() {
      callbackCount++;
      throw 'Bad';
    });
    observer3.observeObject(model);

    var observer4 = new ChangeSummary(function() {
      callbackCount++;
      throw 'Bad';
    });
    observer4.observeObject(model);

    model.id = 2;
    model.id2 = 2;

    observer.deliver();
    observer2.deliver();
    observer3.deliver();
    observer4.deliver();

    assert.equal(4, callbackCount);
  });

  test('Set Same', function() {
    var model = [1];

    observer.observeArray(model);
    model[0] = 1;

    assertNoSummary();
  });

  test('Set To Same As Prototype', function() {
    var model = {
      __proto__: {
        id: 1
      }
    };

    observer.observePath(model, 'id');
    model.id = 1;

    assertNoSummary();
  });

  test('Set Read Only', function() {
    var model = {};
    Object.defineProperty(model, 'x', {
      configurable: true,
      writable: false,
      value: 1
    });

    observer.observePath(model, 'x');
    model.x = 2;

    assertNoSummary();
  });

  test('Set Undefined', function() {
    var model = {};

    observer.observeObject(model);

    model.x = undefined;
    assertSummary({
      object: model,
      added: {
        x: undefined
      },
      removed: {},
      changed: {},
      oldValues: {
        x: undefined
      }
    });
  });

  test('Set Shadows', function() {
    var model = {
      __proto__: {
        x: 1
      }
    };

    observer.observePath(model, 'x');
    model.x = 2;
    assertSummary({
      object: model,
      pathChanged: {
        x: 2
      },
      oldValues: {
        x: 1
      }
    });
  });

  test('Delete With Same Value On Prototype', function() {
    var model = {
      __proto__: {
        x: 1,
      },
      x: 1
    };

    observer.observePath(model, 'x');
    delete model.x;
    assertNoSummary();
  });

  test('Delete With Different Value On Prototype', function() {
    var model = {
      __proto__: {
        x: 1,
      },
      x: 2
    };

    observer.observePath(model, 'x');
    delete model.x;
    assertSummary({
      object: model,
      pathChanged: {
        'x': 1
      },
      oldValues: {
        'x': 2
      }
    });
  });

  test('Delete Of Non Configurable', function() {
    var model = {};
    Object.defineProperty(model, 'x', {
      configurable: false,
      value: 1
    });

    observer.observePath(model, 'x');
    delete model.x;
    assertNoSummary();
  });

  test('Array', function() {
    var model = [0, 1];

    observer.observeArray(model);

    model[0] = 2;

    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [0],
        addedCount: 1
      }]
    });

    model[1] = 3;
    assertSummary({
      object: model,
      splices: [{
        index: 1,
        removed: [1],
        addedCount: 1
      }]
    });
  });

  test('Array Splice', function() {

    var model = [0, 1]

    observer.observeArray(model);

    model.splice(1, 1, 2, 3); // [0, 2, 3]
    assertSummary({
      object: model,
      splices: [{
        index: 1,
        removed: [1],
        addedCount: 2
      }]
    });

    model.splice(0, 1); // [2, 3]
    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [0],
        addedCount: 0
      }]
    });

    model.splice();
    assertNoSummary();

    model.splice(0, 0);
    assertNoSummary();

    model.splice(0, -1);
    assertNoSummary();

    model.splice(-1, 0, 1.5); // [2, 1.5, 3]
    assertSummary({
      object: model,
      splices: [{
        index: 1,
        removed: [],
        addedCount: 1
      }]
    });

    model.splice(3, 0, 0); // [2, 1.5, 3, 0]
    assertSummary({
      object: model,
      splices: [{
        index: 3,
        removed: [],
        addedCount: 1
      }]
    });

    model.splice(0); // []
    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [2, 1.5, 3, 0],
        addedCount: 0
      }]
    });
  });

  test('Array Splice Truncate And Expand With Length', function() {
    var model = ['a', 'b', 'c', 'd', 'e'];

    observer.observeArray(model);

    model.length = 2;

    assertSummary({
      object: model,
      splices: [{
        index: 2,
        removed: ['c', 'd', 'e'],
        addedCount: 0
      }]
    });

    model.length = 5;

    assertSummary({
      object: model,
      splices: [{
        index: 2,
        removed: [],
        addedCount: 3
      }]
    });
  });

  test('Array Splice Delete Too Many', function() {
    var model = ['a', 'b', 'c'];

    observer.observeArray(model);

    model.splice(2, 3); // ['a', 'b']
    assertSummary({
      object: model,
      splices: [{
        index: 2,
        removed: ['c'],
        addedCount: 0
      }]
    });
  });

  test('Array Length', function() {
    var model = [0, 1];

    observer.observeArray(model);

    model.length = 5; // [0, 1, , , ,];
    assertSummary({
      object: model,
      splices: [{
        index: 2,
        removed: [],
        addedCount: 3
      }]
    });

    model.length = 1;
    assertSummary({
      object: model,
      splices: [{
        index: 1,
        removed: [1, , , ,],
        addedCount: 0
      }]
    });

    model.length = 1;
    assertNoSummary();
  });

  test('Array Push', function() {
    var model = [0, 1];

    observer.observeArray(model);

    model.push(2, 3); // [0, 1, 2, 3]
    assertSummary({
      object: model,
      splices: [{
        index: 2,
        removed: [],
        addedCount: 2
      }]
    });

    model.push();
    assertNoSummary();
  });

  test('Array Pop', function() {
    var model = [0, 1];

    observer.observeArray(model);

    model.pop(); // [0]
    assertSummary({
      object: model,
      splices: [{
        index: 1,
        removed: [1],
        addedCount: 0
      }]
    });

    model.pop(); // []
    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [0],
        addedCount: 0
      }]
    });

    model.pop();
    assertNoSummary();
  });

  test('Array Shift', function() {
    var model = [0, 1];

    observer.observeArray(model);
    model.shift(); // [1]
    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [0],
        addedCount: 0
      }]
    });

    model.shift(); // []
    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [1],
        addedCount: 0
      }]
    });

    model.shift();
    assertNoSummary();
  });

  test('Array Unshift', function() {
    var model = [0, 1];

    observer.observeArray(model);
    model.unshift(-1); // [-1, 0, 1]
    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [],
        addedCount: 1
      }]
    });

    model.unshift(-3, -2); // []
    assertSummary({
      object: model,
      splices: [{
        index: 0,
        removed: [],
        addedCount: 2
      }]
    });

    model.unshift();
    assertNoSummary();
  });

  test('Array Tracker Contained', function() {
    var model = ['a', 'b'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(1, 1);
    model.unshift('c', 'd', 'e');
    model.splice(1, 2, 'f');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Delete Empty', function() {
    var model = [];
    var copy = model.slice();
    observer.observeArray(model);

    delete model[0];
    model.splice(0, 0, 'a', 'b', 'c');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Right Non Overlap', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(0, 1, 'e');
    model.splice(2, 1, 'f', 'g');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Left Non Overlap', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(3, 1, 'f', 'g');
    model.splice(0, 1, 'e');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Right Adjacent', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(1, 1, 'e');
    model.splice(2, 1, 'f', 'g');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Left Adjacent', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(2, 2, 'e');
    model.splice(1, 1, 'f', 'g');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Right Overlap', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(1, 1, 'e');
    model.splice(1, 1, 'f', 'g');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Left Overlap', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(2, 1, 'e', 'f', 'g');  // a b [e f g] d
    model.splice(1, 2, 'h', 'i', 'j'); // a [h i j] f g d

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Prefix And Suffix One In', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.unshift('z');
    model.push('z');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Shift One', function() {
    var model = [16, 15, 15];
    var copy = model.slice();
    observer.observeArray(model);

    model.shift('z');

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Update Delete', function() {
    var model = ['a', 'b', 'c', 'd'];
    var copy = model.slice();
    observer.observeArray(model);

    model.splice(2, 1, 'e', 'f', 'g');  // a b [e f g] d
    model[0] = 'h';
    delete model[1];

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Update After Delete', function() {
    var model = ['a', 'b', 'c', 'd'];
    delete model[2];

    var copy = model.slice();
    observer.observeArray(model);

    model[2] = 'e';

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Delete Mid Array', function() {
    var model = ['a', 'b', 'c', 'd'];

    var copy = model.slice();
    observer.observeArray(model);

    delete model[2];

    applySplicesAndAssertDeepEqual(model, copy);
  });

  test('Array Tracker Fuzzer', function() {
    doTeardown();

    var testCount = 256;

    console.log('Fuzzing spliceProjection ' + testCount +
                ' passes with ' + ArrayFuzzer.operationCount + ' operations each.');

    console.time('fuzzer');
    for (var i = 0; i < testCount; i++) {
      console.log('pass: ' + i);
      var fuzzer = new ArrayFuzzer();
      fuzzer.go();
      ensureNonSparse(fuzzer.arr);
      ensureNonSparse(fuzzer.copy);
      assert.deepEqual(fuzzer.arr, fuzzer.copy);
    }
    console.timeEnd('fuzzer');

    doSetup();
  });

  function assertEditDistance(orig, expectDistance) {
    summaries = undefined;
    observer.deliver();
    var actualDistance = 0;

    if (summaries && summaries.length &&
        summaries[0].splices && summaries[0].splices.length) {

      assert.equal(orig, summaries[0].object);
      var splices = summaries[0].splices;
      splices.forEach(function(splice) {
        actualDistance += splice.addedCount += splice.removed.length;
      });
    }

    assert.deepEqual(expectDistance, actualDistance);
  }

  test('Array Tracker No Proxies Edits', function() {
    model = [];
    observer.observeArray(model);
    model.length = 0;
    model.push(1, 2, 3);
    assertEditDistance(model, 3);
    observer.unobserveArray(model);

    model = ['x', 'x', 'x', 'x', '1', '2', '3'];
    observer.observeArray(model);
    model.length = 0;
    model.push('1', '2', '3', 'y', 'y', 'y', 'y');
    assertEditDistance(model, 8);
    observer.unobserveArray(model);

    model = ['1', '2', '3', '4', '5'];
    observer.observeArray(model);
    model.length = 0;
    model.push('a', '2', 'y', 'y', '4', '5', 'z', 'z');
    assertEditDistance(model, 7);
    observer.unobserveArray(model);
  });

  test('Multiple Changes At Once', function() {
    var model = {
      a: {b: 'ab'},
      c: {d: 'cd'}
    };

    observer.observePath(model, 'a.b');
    observer.observePath(model, 'c.d');
    observer.deliver();

    model.a = {b: 1};
    model.c = {d: 2};

    assertSummary({
      object: model,
      pathChanged: {
        'a.b': 1,
        'c.d': 2
      },
      oldValues: {
        'a.b': 'ab',
        'c.d': 'cd'
      },
    });
  });
});