// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function assertArraysEquivalent() {
  var msg = '', a, b;
  if (arguments.length == 3) {
    msg = arguments[0];
    a = arguments[1];
    b = arguments[2];
  } else {
    a = arguments[0];
    b = arguments[1];
  }
  if (a === b)
    return;
  assertEquals('different type', typeof a, typeof b);
  assertEquals('different length', a.length, b.length);
  for (var i = 0; i < a.length; i++) {
    assertEquals('index ' + i, a[i], b[i]);
  }
}

function assertObjectsEquivalent(a, b) {
  var keys = Object.keys(a);

  assertEquals(keys.length, Object.keys(b).length);
  keys.forEach(function(prop) {
    assertTrue(b.hasOwnProperty(prop));
    assertEquals(a[prop], b[prop]);
  });
}

var observer;
var summaries;
var callbackCount = 0;

function setUp() {
  observer = new ChangeSummary(function(s) {
    callbackCount++;
    summaries = s;
  });
}

function tearDown() {
  summaries = observer.disconnect();
  assertUndefined(summaries);
  callbackCount = 0;
  expectedCallbackCount = 0;
}

var expectedCallbackCount = 0;

function assertSplicesEqual(expect, actual) {
  if (expect === actual)
    return;
  assertEquals(expect.length, actual.length);
  expect.forEach(function(splice, index) {
    var actualSplice = actual[index];
    assertEquals(splice.index, actualSplice.index);
    assertArraysEquivalent(splice.removed, actualSplice.removed);
    assertEquals(splice.addedCount, actualSplice.addedCount);
  });
}

function assertSummary(expect) {
  expectedCallbackCount++;
  observer.deliver();

  assertEquals(expectedCallbackCount, callbackCount);

  assertEquals(1, summaries.length);
  var summary = summaries[0];
  assertEquals(expect.object, summary.object);
  delete summary.object;

  var getOldValue = summary.getOldValue;
  delete summary.getOldValue;

  Object.keys(summary).forEach(function(changeType) {
    if (changeType == 'splices') {
      assertSplicesEqual(expect.splices, summary.splices);
      return;
    }

    var newValues = summary[changeType];
    assertObjectsEquivalent(expect[changeType], summary[changeType]);

    Object.keys(newValues).forEach(function(propOrPath) {
      assertEquals(expect.oldValues[propOrPath], getOldValue(propOrPath));
    });
  });

  summaries = undefined;
}

function assertNoSummary() {
  observer.deliver();
  assertEquals(expectedCallbackCount, callbackCount);
  summaries = undefined;
}

function applySplices(orig, copy) {
  summaries = undefined;
  observer.deliver();
  if (summaries && summaries.length &&
      summaries[0].splices && summaries[0].splices.length) {
    assertEquals(orig, summaries[0].object);
    var splices = summaries[0].splices;
    splices.forEach(function(splice) {
      var spliceArgs = [splice.index, splice.removed.length];
      var addIndex = splice.index;
      while (addIndex < splice.index + splice.addedCount) {
        spliceArgs.push(orig[addIndex]);
        addIndex++;
      }

      Array.prototype.splice.apply(copy, spliceArgs);
    });
  }

  assertArraysEquivalent(orig, copy);
}

function testNoDeliveryOnEval() {
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
  assertEquals(0, count);
}

function testDeliveryUntilNoChanges() {
  tearDown();

  var arr = [0, 1, 2, 3, 4];
  var callbackCount = 0;
  observer = new ChangeSummary(function() {
    callbackCount++;
    arr.shift();
  });

  observer.observeArray(arr);
  arr.shift();
  observer.deliver();

  assertEquals(5, callbackCount);
  setUp();
}

function testDegenerateValues() {
  assertEquals(null, observer.observePath(null, ''));
  assertEquals(null, ChangeSummary.getValueAtPath(null, ''));
  observer.unobservePath(null, ''); // shouldn't throw

  var foo = {};
  assertEquals(foo, observer.observePath(foo, ''));
  assertEquals(foo, ChangeSummary.getValueAtPath(foo, ''));
  observer.unobservePath(foo, ''); // shouldn't throw

  assertEquals(3, observer.observePath(3, ''));
  assertEquals(3, ChangeSummary.getValueAtPath(3, ''));
  observer.unobservePath(3, ''); // shouldn't throw

  assertEquals(undefined, observer.observePath(undefined, 'a'));
  assertEquals(undefined, ChangeSummary.getValueAtPath(undefined, 'a'));
  observer.unobservePath(undefined, ''); // shouldn't throw

  var bar = { id: 23 };
  assertEquals(undefined, observer.observePath(bar, 'a/3!'));
  assertEquals(undefined, ChangeSummary.getValueAtPath(bar, 'a/3!'));
  observer.unobservePath(undefined, 'a/3!'); // shouldn't throw
}

function testSetValues() {
  var obj = {};
  ChangeSummary.setValueAtPath(obj, 'foo', 3);
  assertEquals(3, obj.foo);

  var bar = { baz: 3 };

  ChangeSummary.setValueAtPath(obj, 'bar', bar);
  assertEquals(bar, obj.bar);

  ChangeSummary.setValueAtPath(obj, 'bar.baz.bat', 'not here');
  assertEquals(undefined, ChangeSummary.getValueAtPath(obj, 'bar.baz.bat'));
}

function testObserveObject() {
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
}

function testNotify() {
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
}

function testObjectDeleteAddDelete() {
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
}

function testObserveAll() {
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
}

function testPathValueTripleEquals() {
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
}

function testPathValueSimple() {
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
}

function testPathValueBreadthFirstNotification() {
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
}

function testPathObservation() {
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
}

function testMultipleObservationsAreCollapsed() {
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
}

function testExceptionDoesntStopNotification() {
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

  assertEquals(4, callbackCount);
}

function testSetSame() {
  var model = [1];

  observer.observeArray(model);
  model[0] = 1;

  assertNoSummary();
}

function testSetToSameAsPrototype() {
  var model = {
    __proto__: {
      id: 1
    }
  };

  observer.observePath(model, 'id');
  model.id = 1;

  assertNoSummary();
}

function testSetReadOnly() {
  var model = {};
  Object.defineProperty(model, 'x', {
    configurable: true,
    writable: false,
    value: 1
  });

  observer.observePath(model, 'x');
  model.x = 2;

  assertNoSummary();
}

function testSetUndefined() {
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
}

function testSetShadows() {
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
}

function testDeleteWithSameValueOnPrototype() {
  var model = {
    __proto__: {
      x: 1,
    },
    x: 1
  };

  observer.observePath(model, 'x');
  delete model.x;
  assertNoSummary();
}


function testDeleteWithDifferentValueOnPrototype() {
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
}

function testDeleteOfNonConfigurable() {
  var model = {};
  Object.defineProperty(model, 'x', {
    configurable: false,
    value: 1
  });

  observer.observePath(model, 'x');
  delete model.x;
  assertNoSummary();
}

function testArray() {
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
}

function testArraySplice() {

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
}

function testArraySpliceTruncateAndExpandWithLength() {
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

}

function testArraySpliceDeleteTooMany() {
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
}

function testArrayLength() {
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
}

function testArrayPush() {
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
}

function testArrayPop() {
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
}

function testArrayShift() {
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
}

function testArrayUnshift() {
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
}

function testArrayTrackerContained() {
  var model = ['a', 'b'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(1, 1);
  model.unshift('c', 'd', 'e');
  model.splice(1, 2, 'f');

  applySplices(model, copy);
}

function testArrayTrackerDeleteEmpty() {
  var model = [];
  var copy = model.slice();
  observer.observeArray(model);

  delete model[0];
  model.splice(0, 0, 'a', 'b', 'c');

  applySplices(model, copy);
}

function testArrayTrackerRightNonOverlap() {
  var model = ['a', 'b', 'c', 'd'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(0, 1, 'e');
  model.splice(2, 1, 'f', 'g');

  applySplices(model, copy);
}

function testArrayTrackerLeftNonOverlap() {
  var model = ['a', 'b', 'c', 'd'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(3, 1, 'f', 'g');
  model.splice(0, 1, 'e');

  applySplices(model, copy);
}

function testArrayTrackerRightAdjacent() {
  var model = ['a', 'b', 'c', 'd'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(1, 1, 'e');
  model.splice(2, 1, 'f', 'g');

  applySplices(model, copy);
}

function testArrayTrackerLeftAdjacent() {
  var model = ['a', 'b', 'c', 'd'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(2, 2, 'e');
  model.splice(1, 1, 'f', 'g');

  applySplices(model, copy);
}

function testArrayTrackerRightOverlap() {
  var model = ['a', 'b', 'c', 'd'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(1, 1, 'e');
  model.splice(1, 1, 'f', 'g');

  applySplices(model, copy);
}

function testArrayTrackerLeftOverlap() {
  var model = ['a', 'b', 'c', 'd'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(2, 1, 'e', 'f', 'g');  // a b [e f g] d
  model.splice(1, 2, 'h', 'i', 'j'); // a [h i j] f g d

  applySplices(model, copy);
}

function testArrayTrackerUpdateDelete() {
  var model = ['a', 'b', 'c', 'd'];
  var copy = model.slice();
  observer.observeArray(model);

  model.splice(2, 1, 'e', 'f', 'g');  // a b [e f g] d
  model[0] = 'h';
  delete model[1];

  applySplices(model, copy);
}

function testArrayTrackerUpdateAfterDelete() {
  var model = ['a', 'b', 'c', 'd'];
  delete model[2];

  var copy = model.slice();
  observer.observeArray(model);

  model[2] = 'e';

  applySplices(model, copy);
}

function testArrayTrackerDeleteMidArray() {
  var model = ['a', 'b', 'c', 'd'];

  var copy = model.slice();
  observer.observeArray(model);

  delete model[2];

  applySplices(model, copy);
}

function randInt(start, end) {
  return Math.round(Math.random()*(end-start) + start);
}

function randArray() {
  var args = [];
  var count = randInt(0, arrayLengthMax);

  while(count-- > 0) {
    args.push(randInt(0, valMax));
  }

  return args;
}

function randomArrayOperation(arr) {
  function empty() {
    return [];
  }

  var operations = {
    push: randArray,
    unshift: randArray,
    pop: empty,
    shift: empty,
    splice: function() {
      var args = [];
      args.push(randInt(-arr.length*2, arr.length*2), randInt(0, arr.length*2));
      args = args.concat(randArray());
      return args;
    }
  };

  // Do a splice once for each of the other operations.
  var operationList = ['splice', 'update',
                       'splice', 'delete',
                       'splice', 'push',
                       'splice', 'pop',
                       'splice', 'shift',
                       'splice', 'unshift'];

  var operation = operationList[randInt(0, operationList.length - 1)];
  if (operation == 'delete') {
    var index = randInt(0, arr.length - 1);
    delete arr[index];
  } else if (operation == 'update') {
    arr[randInt(0, arr.length - 1)] = randInt(0, valMax);
  } else {
    var opArgs = operations[operation]();
    var func = arr[operation];
    func.apply(arr, opArgs);
  }
}

function randomArrayOperations(arr, count) {
  for (var i = 0; i < count; i++) {
    randomArrayOperation(arr);
  }
}

var valMax = 16;
var arrayLengthMax = 64;
var testCount = 256;
var operationCount = 16;

function testArrayTrackerFuzzer() {
  console.log('Fuzzing spliceProjection ' + testCount +
              ' passes with ' + operationCount + ' operations each.');

  console.time('fuzzer');
  tearDown();
  for (var i = 0; i < testCount; i++) {
    console.log('pass: ' + i);
    var model = randArray();

    randomArrayOperations(model, operationCount);

    var copy = model.slice();

    setUp();
    observer.observeArray(model);

    randomArrayOperations(model, operationCount);

    applySplices(model, copy);
    tearDown();
  }

  setUp();
  console.timeEnd('fuzzer');
}

function assertEditDistance(tracker, distance) {
  var splices = tracker.splices || [];
  var calcDistance = 0;
  splices.forEach(function(splice) {
    calcDistance += splice.addedCount;
    calcDistance += splice.deleteCount;
  });

  assertEquals(distance, calcDistance);
}

function assertEditDistance(orig, expectDistance) {
  summaries = undefined;
  observer.deliver();
  var actualDistance = 0;

  if (summaries && summaries.length &&
      summaries[0].splices && summaries[0].splices.length) {

    assertEquals(orig, summaries[0].object);
    var splices = summaries[0].splices;
    splices.forEach(function(splice) {
      actualDistance += splice.addedCount += splice.removed.length;
    });
  }

  assertArraysEquivalent(expectDistance, actualDistance);
}

function testArrayTrackerNoProxiesEdits() {
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
}
