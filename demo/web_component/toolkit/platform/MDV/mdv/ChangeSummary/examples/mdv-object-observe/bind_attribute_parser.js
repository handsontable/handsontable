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

function BindAttributeParser() {}

(function() {

/**
 * Separator of target name components.
 */
var LABEL_SEPARATOR = '\\.?';

/**
 * Characters in an unquoted target name component.
 */
var LABEL_ANY_CHAR = "[^':?;.]+";

/**
 * A single-quoted target name component. Between the quotes
 * are only escaped escape characters, escaped quotes, or characters
 * that are not quotes or escape characters, optionally preceded by an
 * escape character. There must be at least one character between the
 * quotes.
 *
 * We only support single quotes for quoting target name components.
 */
var LABEL_SINGLE_QUOTE = "'(\\\\\\\\|\\\\'|\\\\?[^'\\\\])+'";

/**
 * The end of the target part of a label: either colon
 * for value assignment or question mark for conditional assignment.
 */
var LABEL_TERMINATE = '[:?]';

/**
 * The following portion of the regular expression matches any
 * character except significant control characters such as separators
 * and literal denoting characters. Because the entire value portion
 * of the reg ex can match one or more times, this portion matches any
 * set of characters that fall outside of a literal.
 */
var VALUE_ANY_CHAR = '[^\'"\\/;]*';

/**
 * This matches single-quoted literals. It boils down to "one single
 * quote, followed by zero or more escaped backslashes or escaped
 * single quotes or escaped chars but not single quotes or backslashes
 * by themselves, followed by one single quote."
 */
var VALUE_SINGLE_QUOTE = "'(\\\\\\\\|\\\\'|\\\\?[^'\\\\])*'";

/**
 * As above, but for matching double-quoted literals.
 */
var VALUE_DOUBLE_QUOTE = '"(\\\\\\\\|\\\\"|\\\\?[^"\\\\])*"';

/**
 * This matches forward slash literals (regular expressions). It boils
 * down to "one forward slash, followed by zero or more escaped
 * backslashes or escaped forward slashes or escaped chars but not
 * forward slashes or backslashes by themselves, followed by one
 * forward slash."
 */
var VALUE_REGEXP_LITERAL = '/(\\\\\\\\|\\\\\\/|\\\\?[^\\/\\\\])*/';

/**
 * End of the value: optional semicolon.
 */
var VALUE_TERMINATE = ';?';

/**
 * This string matches the label portion of a label/value pair, up to
 * and including the separator.
 */
var LABEL_EXPRESSION =
    '\\s*' +
    '(' +
      LABEL_SEPARATOR +
      '(' +
        LABEL_ANY_CHAR +
        '|' +
        LABEL_SINGLE_QUOTE +
      ')' +
    ')+' +
    LABEL_TERMINATE;

/**
 * This regexp splits a list of label/value pairs into separate strings,
 * ready for processing with parseLabel().
 */
var ATTR_REGEXP = new RegExp(  // multiple instances of:
    LABEL_EXPRESSION +         // label, followed by:
    '(' +                      // value, one or more of:
      VALUE_ANY_CHAR +           // non-literal sequence, followed by:
      '(' +                      // zero or more of:
        VALUE_SINGLE_QUOTE +       // single quoted string
        '|' +                      // or
        VALUE_DOUBLE_QUOTE +       // double quoted string
        '|' +                      // or
        VALUE_REGEXP_LITERAL +     // regular expression literal
      ')*' +                     // end zero or more
    ')+' +                     // end one or more, followed by:
    VALUE_TERMINATE,           // an optional semicolon
    'g');                      // end of one instance

/**
 * Regular expression that matches from the start until the first
 * unquoted colon or question mark. Used to extract the target part
 * of a data binding expression.
 */
var LABEL_REGEXP = new RegExp('^' + LABEL_EXPRESSION);

/**
 * Regular expression that splits a label into segments separated by
 * unquoted periods. Used to parse the binding target expressions
 * into a path.
 */
var PARSE_LABEL_REGEXP = new RegExp(
    LABEL_SEPARATOR +
    '(' +
    LABEL_ANY_CHAR +
    '|' +
    LABEL_SINGLE_QUOTE +
    ')', 'g');

/**
 * Parses a single label/value pair into three pieces:
 *
 * (1) The label parsed into components with quotes removed and
 *     whitespace trimmed.
 * (2) The label separator (colon or question mark),
 * (3) The value expression up to the semicolon, whitespace trimmed.
 *
 * @param {string} expr A single label/value expression returned by match().
 * @return {Array} ret A tuple as described above. Empty if there was no match.
 */
function parseLabel(expr) {
  var match = expr.match(LABEL_REGEXP);
  if (!match)
    syntaxError();

  var labelTextRaw = match[0];
  var labelTextTrimmed = labelTextRaw.trim();
  var label = labelTextTrimmed.match(PARSE_LABEL_REGEXP);

  for (var i = 0; i < label.length; ++i) {
    label[i] = label[i].
        replace(/^\./, '').
        replace(/^'/, '').
        replace(/'$/, '').
        replace(/\\(.)/g, '$1').
        trim();
  }

  var labelLength = labelTextRaw.length;
  return [
      label,
      labelTextRaw.substr(labelLength - 1),
      expr.substr(labelLength).trim().replace(/;$/, '')
  ];
}

var expressionParser = new ExpressionParser;
var dependencyParser = new DependencyParser;

function syntaxError() {
  throw Error('Bind attribute syntax error');
}

BindAttributeParser.Token = function(type, property, value) {
  this.type = type;
  this.property = property;
  this.value = value;
};

BindAttributeParser.prototype.parse = function(s) {
  var result = [];
  var parts = s.match(ATTR_REGEXP);
  parts.forEach(function(part) {
    var parsed = parseLabel(part);
    if (parsed.length != 3)
      syntaxError();
    // TODO(adamk): Rather than re-joining these, treat
    // period-separated properties specially.
    var property = parsed[0].join('.');
    var value = parsed[2];
    var type = /^expr\s*\(/.test(value) ? 'expr' : 'dep';
    var parser = type == 'expr' ? expressionParser : dependencyParser;
    value = parser.parse(value);
    result.push(new BindAttributeParser.Token(type, property, value));
  });
  return result;
};

})();
