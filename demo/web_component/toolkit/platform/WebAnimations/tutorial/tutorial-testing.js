/*
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
var pass;
var completedTests;
var allDone;
var numTests;

// Call to initialize the testing environment.
function setupTutorialTests() {
  setState("Manual");
  var timeOfAnimation = document.createElement('div');
  timeOfAnimation.id = "animViewerText";
  timeOfAnimation.innerHTML = "Current animation time: 0.00";
  document.body.appendChild(timeOfAnimation);
  numTests = 0;
  completedTests = 0;
  allDone = false;
  pass = true;
}

// This function mimics the async_test function in testharness.js so that
// extra-asserts.js will run as intended for a tutorial.
function async_test(func, name, properties) {
  numTests++;
  step = function(func) {
    func();
    if (!pass) {
      parent.TryItDisplay.fail();
      allDone = true;
    };
  };

  done = function() {
    completedTests++;
    if (completedTests == numTests && !allDone) {
      allDone = true;
      parent.TryItDisplay.pass();
    };
  };
  return this;
}   

function assert_equals(actual, expected, description) {
  pass = (actual == expected);
}

function assert_approx_equals(actual, expected, epsilon, description) {
  var lowerBound = expected - (epsilon / 2) < actual;
  var upperBound = expected + (epsilon / 2) > actual;
  pass = (lowerBound && upperBound);
}

// This function is required to do nothing for tutorial testing,
// but extra-asserts calls it and thus without this function, 
// extra-asserts.js will cause the page to crash.
function add_completion_callback(anything) {
}

///////////////////////////////////////////////////////////////////////////////
//  Exposing functions to be accessed externally                             //
///////////////////////////////////////////////////////////////////////////////

window.setupTutorialTests = setupTutorialTests;
window.async_test = async_test;
window.assert_approx_equals = assert_approx_equals;
window.assert_equals = assert_equals;
window.add_completion_callback = add_completion_callback;
})();
