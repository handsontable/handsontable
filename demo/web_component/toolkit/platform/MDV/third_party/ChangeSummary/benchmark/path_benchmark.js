// Copyright 2013 Google Inc.
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

// Run ArrayFuzzer under d8, e.g.
// path/to/d8 change_summary tests/d8_path_test.js (--harmony)


(function(global) {
  var objectCount = 1000;
  var cycles = 200;
  var objects;
  var observer = new ChangeSummary(function() {});

  function createAndObservePaths() {
    objects = [];
    for (var i = 0; i < objectCount; i++) {
      var object = {
        foo: {
          bar: {
            baz: '0'
          }
        }
      };

      observer.observePath(object, 'foo.bar.baz');
      objects.push(object);
    }
  }

  function unobservePaths() {
    for (var i = 0; i < objectCount; i++) {
      observer.unobservePath(objects[i], 'foo.bar.baz');
    }
  }

  function mutatePathsAndDeliver(mutationFreq, root) {
    var modVal = Math.floor(100/mutationFreq);

    for (var i = 0; i < cycles; i++) {
      for (var j = 0; j < objects.length; j++) {
        if (modVal === Infinity || j % modVal != 0)
          continue;

        if (root)
          objects[j]['foo'] = { bar: { baz: '' + i }};
        else
          objects[j]['foo']['bar']['baz'] = '' + i;
      }

      observer.deliver();
    }
  }

  global.createAndObservePaths = createAndObservePaths;
  global.unobservePaths = unobservePaths;
  global.mutatePathsAndDeliver = mutatePathsAndDeliver;
})(this);
