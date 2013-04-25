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

suite('Path Benchmarks', function() {
  setup(function() {
    createAndObservePaths();
  });

  teardown(function() {
    unobservePaths();
  });

  test('Path Benchmark - Leaf - 0% Changed', function() {
    mutatePathsAndDeliver(0);
  });

  test('Path Benchmark - Leaf - 1% Changed', function() {
    mutatePathsAndDeliver(1);
  });

  test('Path Benchmark - Leaf - 5% Changed', function() {
    mutatePathsAndDeliver(5);
  });

  test('Path Benchmark - Leaf - 10% Changed', function() {
    mutatePathsAndDeliver(10);
  });

  test('Path Benchmark - Leaf - 20% Changed', function() {
    mutatePathsAndDeliver(20);
  });

  test('Path Benchmark - Root - 0% Changed', function() {
    mutatePathsAndDeliver(0, true);
  });

  test('Path Benchmark - Root - 1% Changed', function() {
    mutatePathsAndDeliver(1, true);
  });

  test('Path Benchmark - Root - 5% Changed', function() {
    mutatePathsAndDeliver(5, true);
  });

  test('Path Benchmark - Root - 10% Changed', function() {
    mutatePathsAndDeliver(10, true);
  });

  test('Path Benchmark - Root - 20% Changed', function() {
    mutatePathsAndDeliver(20, true);
  });

});

suite('Object Benchmarks', function() {
  setup(function() {
    createAndObserveObjects();
  });

  teardown(function() {
    unobserveObjects();
  });

  test('Object Benchmark - 0% Changed', function() {
    mutateObjectsAndDeliver(0);
  });

  test('Object Benchmark - 1% Changed', function() {
    mutateObjectsAndDeliver(1);
  });

  test('Object Benchmark - 5% Changed', function() {
    mutateObjectsAndDeliver(5);
  });

  test('Object Benchmark - 10% Changed', function() {
    mutateObjectsAndDeliver(10);
  });

  test('Object Benchmark - 20% Changed', function() {
    mutateObjectsAndDeliver(20);
  });
});

suite('Array Benchmarks', function() {
  setup(function() {
    createAndObserveArrays();
  });

  teardown(function() {
    unobserveArrays();
  });

  test('Array Benchmark - Push/Pop - 0% Changed', function() {
    mutateArraysAndDeliver(0, 'push', 'pop');
  });

  test('Array Benchmark - Push/Pop - 1% Changed', function() {
    mutateArraysAndDeliver(1, 'push', 'pop');
  });

  test('Array Benchmark - Push/Pop - 5% Changed', function() {
    mutateArraysAndDeliver(5, 'push', 'pop');
  });

  test('Array Benchmark - Push/Pop - 10% Changed', function() {
    mutateArraysAndDeliver(10, 'push', 'pop');
  });

  test('Array Benchmark - Push/Pop - 20% Changed', function() {
    mutateArraysAndDeliver(20, 'push', 'pop');
  });

  test('Array Benchmark - Unshift/Shift - 0% Changed', function() {
    mutateArraysAndDeliver(0, 'unshift', 'shift');
  });

  test('Array Benchmark - Unshift/Shift - 1% Changed', function() {
    mutateArraysAndDeliver(1, 'unshift', 'shift');
  });

  test('Array Benchmark - Unshift/Shift - 5% Changed', function() {
    mutateArraysAndDeliver(5, 'unshift', 'shift');
  });

  test('Array Benchmark - Unshift/Shift - 10% Changed', function() {
    mutateArraysAndDeliver(10, 'unshift', 'shift');
  });

  test('Array Benchmark - Unshift/Shift - 20% Changed', function() {
    mutateArraysAndDeliver(20, 'unshift', 'shift');
  });

  test('Array Benchmark - Update - 0% Changed', function() {
    mutateArraysAndDeliver(0, 'update');
  });

  test('Array Benchmark - Update - 1% Changed', function() {
    mutateArraysAndDeliver(1, 'update');
  });

  test('Array Benchmark - Update - 5% Changed', function() {
    mutateArraysAndDeliver(5, 'update');
  });

  test('Array Benchmark - Update - 10% Changed', function() {
    mutateArraysAndDeliver(10, 'update');
  });

  test('Array Benchmark - Update - 20% Changed', function() {
    mutateArraysAndDeliver(20, 'update');
  });
});