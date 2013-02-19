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

var PlaceHolderParser = (function() {

  var expressionParser = new ExpressionParser;
  var dependencyParser = new DependencyParser;

  function PlaceHolderParser() {}

  PlaceHolderParser.Token = function(type, value) {
    this.type = type;
    this.value = value;
  };

  PlaceHolderParser.prototype = {
    parse: function(s) {
      var result = [];
      var length = s.length;
      var index = 0, lastIndex = 0;
      while (lastIndex < length) {
        index = s.indexOf('{{', lastIndex);
        if (index < 0) {
          result.push(new PlaceHolderParser.Token('text', s.slice(lastIndex)));
          break;
        } else {
          // There is a non-empty text run before the next path token.
          if (index > 0 && lastIndex < index) {
            result.push(new PlaceHolderParser.Token('text',
                                                    s.slice(lastIndex, index)));
          }
          lastIndex = index + 2;
          index = s.indexOf('}}', lastIndex);
          if (index < 0) {
            var text = s.slice(lastIndex - 2);
            var lastToken = result[result.length - 1];
            if (lastToken && lastToken.type == 'text')
              lastToken.value += text;
            else
              result.push(new PlaceHolderParser.Token('text', text));
            break;
          }

          var value = s.slice(lastIndex, index).trim();
          var type = /^expr\s*\(/.test(value) ? 'expr' : 'dep';
          var parser = type == 'expr' ? expressionParser : dependencyParser;
          value = parser.parse(value);

          result.push(new PlaceHolderParser.Token(type, value));
          lastIndex = index + 2;
        }
      }
      return result;
    }
  };

  return PlaceHolderParser;
})();
