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

// Run ArrayFuzzer under d8, e.g.
// path/to/d8 change_summary.js tests/array_fuzzer.js tests/d8_array_fuzzer.js (--harmony)

function checkEqual(arr1, arr2) {
  if (arr1.length != arr2.length)
    throw 'Lengths not equal: ' + arr1.length + ', ' + arr2.length;
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i])
      throw 'Value at i: ' + i + ' not equal: ' + arr1[i] + ', ' + arr2[i];
  }
}

print(typeof Object.observe);

var t1 = new Date();
for (var i = 0; i < 256; i++) {
	print('pass: ' + i);
  var fuzzer = new ArrayFuzzer();
  fuzzer.go();
  checkEqual(fuzzer.arr, fuzzer.copy);
}
var t2 = new Date();
print('Finished in: ' + (t2.getTime() - t1.getTime()) + 'ms');
