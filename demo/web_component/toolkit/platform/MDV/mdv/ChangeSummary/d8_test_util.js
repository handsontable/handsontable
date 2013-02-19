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

/*
 * This file allows the tests to run in d8. e.g.
 *
 *  path/to/d8 change_summary.js test.js d8_test_util.js --harmony-collections
 *
 */

this.console = this.console || {};
this.console.log = print;
this.console.error = print;
var timeMap = {};
this.console.time = function(what) {
  timeMap[what] = new Date();
};
this.console.timeEnd = function(what) {
  if (!timeMap[what])
    return;
  print(what + ": " + (new Date().getTime() - timeMap[what].getTime()) + 'ms');
  timeMap[what] = undefined;
};
this.output = print;

/*
 * NOTE: This copies the minimal set of functions from closure's testing.jsunit package
 * to allow test.js to run in the d8 shell. test.html loads the testing library over http
 * from source control.
 *
 * http://code.google.com/p/closure-library/
 */

function _trueTypeOf(something) {
  var result = typeof something;
  try {
    switch (result) {
      case 'string':
        break;
      case 'boolean':
        break;
      case 'number':
        break;
      case 'object':
      case 'function':
        switch (something.constructor) {
          case new String('').constructor:
            result = 'String';
            break;
          case new Boolean(true).constructor:
            result = 'Boolean';
            break;
          case new Number(0).constructor:
            result = 'Number';
            break;
          case new Array().constructor:
            result = 'Array';
            break;
          case new RegExp().constructor:
            result = 'RegExp';
            break;
          case new Date().constructor:
            result = 'Date';
            break;
          case Function:
            result = 'Function';
            break;
          default:
            var m = something.constructor.toString().match(
                /function\s*([^( ]+)\(/);
            if (m) {
              result = m[1];
            } else {
              break;
            }
        }
        break;
    }
  } finally {
    result = result.substr(0, 1).toUpperCase() + result.substr(1);
    return result;
  }
}

function _displayStringForValue(aVar) {
  var result = '<' + aVar + '>';
  if (!(aVar === null || aVar === undefined)) {
    result += ' (' + _trueTypeOf(aVar) + ')';
  }
  return result;
}

function fail(failureMessage) {
  throw Error('Call to fail(): ' + failureMessage);
}

function argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) {
  return args.length == expectedNumberOfNonCommentArgs + 1;
}

function commentArg(expectedNumberOfNonCommentArgs, args) {
  if (argumentsIncludeComments(expectedNumberOfNonCommentArgs, args)) {
    return args[0];
  }

  return null;
}

function nonCommentArg(desiredNonCommentArgIndex,
    expectedNumberOfNonCommentArgs, args) {
  return argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) ?
      args[desiredNonCommentArgIndex] :
      args[desiredNonCommentArgIndex - 1];
}

function _validateArguments(expectedNumberOfNonCommentArgs, args) {
  var valid = args.length == expectedNumberOfNonCommentArgs ||
      args.length == expectedNumberOfNonCommentArgs + 1 &&
      typeof args[0] == 'string';
  _assert(null, valid, 'Incorrect arguments passed to assert function');
}

function _assert(comment, booleanValue, failureMessage) {
  if (!booleanValue) {
    throw Error(failureMessage + ': ' + comment);
  }
}

function assertEquals(a, b, opt_c) {
  _validateArguments(2, arguments);
  var var1 = nonCommentArg(1, 2, arguments);
  var var2 = nonCommentArg(2, 2, arguments);
  _assert(commentArg(2, arguments), var1 === var2,
          'Expected ' + _displayStringForValue(var1) + ' but was ' +
          _displayStringForValue(var2));
}

function assertTrue(a, opt_b) {
  _validateArguments(1, arguments);
  var comment = commentArg(1, arguments);
  var booleanValue = nonCommentArg(1, 1, arguments);

  _assert(comment, typeof booleanValue == 'boolean',
      'Bad argument to assertTrue(boolean)');
  _assert(comment, booleanValue, 'Call to assertTrue(boolean) with false');
}

function assertFalse(a, opt_b) {
  _validateArguments(1, arguments);
  var comment = commentArg(1, arguments);
  var booleanValue = nonCommentArg(1, 1, arguments);

  _assert(comment, typeof booleanValue == 'boolean',
      'Bad argument to assertFalse(boolean)');
  _assert(comment, !booleanValue, 'Call to assertFalse(boolean) with true');
}

function assertUndefined(a, opt_b) {
  _validateArguments(1, arguments);
  var aVar = nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), aVar === undefined,
      'Expected ' + _displayStringForValue(undefined) +
      ' but was ' + _displayStringForValue(aVar));
}

for (var prop in this) {
  if (prop.match(/^test/) && typeof this[prop] == 'function') {
    output(prop + '...');
    if (typeof this['setUp'] == 'function')
      this.setUp();
    this[prop]();
    if (typeof this['tearDown'] == 'function')
      this.tearDown();
    output('...passed.');
  }
}