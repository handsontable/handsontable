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

(function(global) {

function ArrayFuzzer() {}

ArrayFuzzer.valMax = 16;
ArrayFuzzer.arrayLengthMax = 64;
ArrayFuzzer.operationCount = 16;

function randInt(start, end) {
  return Math.round(Math.random()*(end-start) + start);
}

function randArray() {
  var args = [];
  var count = randInt(0, ArrayFuzzer.arrayLengthMax);

  while(count-- > 0) {
    args.push(randInt(0, ArrayFuzzer.valMax));
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
    arr[randInt(0, arr.length)] = randInt(0, ArrayFuzzer.valMax);
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

ArrayFuzzer.prototype.go = function() {
  var orig = this.arr = randArray();
  randomArrayOperations(this.arr, ArrayFuzzer.operationCount);
  var copy = this.copy = this.arr.slice();

  var observer = new ChangeSummary(function(summaries) {
    ChangeSummary.applySplices(copy, orig, summaries[0].splices);
  });

  observer.observeArray(this.arr);
  randomArrayOperations(this.arr, ArrayFuzzer.operationCount);
  observer.deliver();
}

global.ArrayFuzzer = ArrayFuzzer;

})(this);