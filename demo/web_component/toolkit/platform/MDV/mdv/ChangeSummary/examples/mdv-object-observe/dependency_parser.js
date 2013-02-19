// Copyright 2011 Google Inc.
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

var DependencyParser = (function() {

  /**
   * DependencyParser is partially responsible for parsing binding dependencies.
   * Any declarative binding NOT usign the "expr() ..." syntax will be passed
   * through the DependencyParser. A dependency has the form
   *
   *     path [| transformName(var_args)]
   *
   * The output of parse() is an object containing |path|, and possibly
   * |transformName| and |transformArgs|. |path| is the string portion to the
   * left of the optional pipe ('|') portion, which should be parsed into a
   * Path, and |transformName| and |transformArgs| are a string and array
   * respectively of the parsed transform name and arguments to be used if one
   * was found.
   */
  function DependencyParser() {}

  function syntaxError() {
    throw Error('Dependency syntax error');
  }

  var stringArg = /^(?:"([^"]*)"|'([^']*)')$/;
  // TODO(rafaelw): The follow RegExp doesn't allow any ')' in the arguments
  // of transform names, so the following would fail:
  //     {{ path | trans("arg_)_1") }}
  var transformPart = /^([a-z_]+[a-z_\d]*)(?:\(([^\)]*)\))?$/i;

  DependencyParser.prototype = {
    parse: function(s) {
      var retval = {
        path: s.trim(),
        transformName: undefined,
        transformArgs: []
      };

      var index = s.indexOf('|');
      if (index < 0)
        return retval;

      retval.path = s.substring(0, index).trim();
      s = s.substring(index + 1).trim();

      var m = s.match(transformPart);
      if (m == null)
        syntaxError();

      retval.transformName = m[1].trim();
      var transformArgsString = m[2];
      if (transformArgsString)
        transformArgsString = transformArgsString.trim();
      var args = transformArgsString ? transformArgsString.split(',') : [];

      retval.transformArgs = args.map(function(arg) {
        arg = arg.trim();

        if (arg === '')
          return undefined;

        // String arg
        if (stringArg.test(arg)) {
          var m = arg.match(stringArg);
          return m[1] || m[2];
        }

        switch(arg) {
          case 'true':
            return true;
          case 'false':
            return false;
          case 'null':
            return null;
          default:
            var number = Number(arg);
            return !isNaN(number) ? number : undefined;
        }
      });

      return retval;
    }
  };

  return DependencyParser;
})();
