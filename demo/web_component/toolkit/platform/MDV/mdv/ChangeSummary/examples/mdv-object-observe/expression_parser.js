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

var ExpressionParser = (function() {

  function ExpressionParser() {}

  function strip(s) {
    return s.replace(/\s/g, '');
  }

  function syntaxError() {
    throw Error('Binding expression syntax error');
  }

  ExpressionParser.prototype = {
    parse: function(s) {
      // Expression = 'expr' '(' Params ')' Expression
      // Params = path ('@' Ident)?

      var re = /^expr\s*\(([^)]*)\s*\)\s*((?:.|\n)*)$/m;
      var m = s.match(re);
      if (m == null)
        syntaxError();

      var args = strip(m[1]);
      args = args ? args.split(',') : [];
      // Wrap expression in parentheses to avoid Automatic Semicolon Insertion
      // issues with return.
      var functionBody = 'return (' + m[2] + ')';

      var deps = [], aliases = [];
      args.forEach(function(arg) {
        var parts = arg.split('@');
        var path = strip(parts[0]);

        if (!path)
          syntaxError();

        var path = new Path(path);

        var alias;
        if (parts.length > 1)
          alias = strip(parts[1]);
        else
          alias = path.slice(-1);

        if (alias.length == 0)
          syntaxError();

        deps.push({path: path});
        aliases.push(alias);
      });

      return {
        deps: deps,
        func: Function.apply(null, aliases.concat(functionBody))
      };
    }
  };

  return ExpressionParser;
})();
