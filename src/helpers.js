/**
 * DOM helper optimized for maximum performance
 * It is recommended for Handsontable plugins and renderers, because it is much faster than jQuery
 * @type {WalkonableDom}
 */
Handsontable.Dom = new WalkontableDom();

/**
 * Returns true if keyCode represents a printable character
 * @param {Number} keyCode
 * @return {Boolean}
 */
Handsontable.helper.isPrintableChar = function (keyCode) {
  return ((keyCode == 32) || //space
    (keyCode >= 48 && keyCode <= 57) || //0-9
    (keyCode >= 96 && keyCode <= 111) || //numpad
    (keyCode >= 186 && keyCode <= 192) || //;=,-./`
    (keyCode >= 219 && keyCode <= 222) || //[]{}\|"'
    keyCode >= 226 || //special chars (229 for Asian chars)
    (keyCode >= 65 && keyCode <= 90)); //a-z
};

/**
 * Converts a value to string
 * @param value
 * @return {String}
 */
Handsontable.helper.stringify = function (value) {
  switch (typeof value) {
    case 'string':
    case 'number':
      return value + '';
      break;

    case 'object':
      if (value === null) {
        return '';
      }
      else {
        return value.toString();
      }
      break;

    case 'undefined':
      return '';
      break;

    default:
      return value.toString();
  }
};

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc
 * @param index
 * @returns {String}
 */
Handsontable.helper.spreadsheetColumnLabel = function (index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26, 10);
  }
  return columnLabel;
};

/**
 * Checks if value of n is a numeric one
 * http://jsperf.com/isnan-vs-isnumeric/4
 * @param n
 * @returns {boolean}
 */
Handsontable.helper.isNumeric = function (n) {
    var t = typeof n;
    return t == 'number' ? !isNaN(n) && isFinite(n) :
           t == 'string' ? !n.length ? false :
           n.length == 1 ? /\d/.test(n) :
           /^\s*[+-]?\s*(?:(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(n) :
           t == 'object' ? !!n && typeof n.valueOf() == "number" && !(n instanceof Date) : false;
};

/**
 * Checks if child is a descendant of given parent node
 * http://stackoverflow.com/questions/2234979/how-to-check-in-javascript-if-one-element-is-a-child-of-another
 * @param parent
 * @param child
 * @returns {boolean}
 */
Handsontable.helper.isDescendant = function (parent, child) {
  var node = child.parentNode;
  while (node != null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

/**
 * Generates a random hex string. Used as namespace for Handsontable instance events.
 * @return {String} - 16 character random string: "92b1bfc74ec4"
 */
Handsontable.helper.randomString = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + s4() + s4();
};

/**
 * Inherit without without calling parent constructor, and setting `Child.prototype.constructor` to `Child` instead of `Parent`.
 * Creates temporary dummy function to call it as constructor.
 * Described in ticket: https://github.com/warpech/jquery-handsontable/pull/516
 * @param  {Object} Child  child class
 * @param  {Object} Parent parent class
 * @return {Object}        extended Child
 */
Handsontable.helper.inherit = function (Child, Parent) {
  function Bridge() {
  }

  Bridge.prototype = Parent.prototype;
  Child.prototype = new Bridge();
  Child.prototype.constructor = Child;
  return Child;
};

/**
 * Perform shallow extend of a target object with extension's own properties
 * @param {Object} target An object that will receive the new properties
 * @param {Object} extension An object containing additional properties to merge into the target
 */
Handsontable.helper.extend = function (target, extension) {
  for (var i in extension) {
    if (extension.hasOwnProperty(i)) {
      target[i] = extension[i];
    }
  }
};

/**
 * Factory for columns constructors.
 * @param {Object} GridSettings
 * @param {Array} conflictList
 * @return {Object} ColumnSettings
 */
Handsontable.helper.columnFactory = function (GridSettings, conflictList) {
  var i = 0, len = conflictList.length, ColumnSettings = function () {
  };

  // Inherit prototype from grid settings
  ColumnSettings.prototype = new GridSettings();

  // Clear conflict settings
  for (; i < len; i++) {
    ColumnSettings.prototype[conflictList[i]] = void 0;
  }

  return ColumnSettings;
};

Handsontable.helper.translateRowsToColumns = function (input) {
  var i
    , ilen
    , j
    , jlen
    , output = []
    , olen = 0;

  for (i = 0, ilen = input.length; i < ilen; i++) {
    for (j = 0, jlen = input[i].length; j < jlen; j++) {
      if (j == olen) {
        output.push([]);
        olen++;
      }
      output[j].push(input[i][j])
    }
  }
  return output;
};

Handsontable.helper.to2dArray = function (arr) {
  var i = 0
    , ilen = arr.length;
  while (i < ilen) {
    arr[i] = [arr[i]];
    i++;
  }
};

Handsontable.helper.extendArray = function (arr, extension) {
  var i = 0
    , ilen = extension.length;
  while (i < ilen) {
    arr.push(extension[i]);
    i++;
  }
};

/**
 * Returns cell renderer or editor function directly or through lookup map
 */
Handsontable.helper.getCellMethod = function (methodName, methodFunction) {
  if (typeof methodFunction === 'string') {
    var result = Handsontable.cellLookup[methodName][methodFunction];
    if (result === void 0) {
      throw new Error('You declared cell ' + methodName + ' "' + methodFunction + '" as a string that is not mapped to a known function. Cell ' + methodName + ' must be a function or a string mapped to a function in Handsontable.cellLookup.' + methodName + ' lookup object');
    }
    return result;
  }
  else {
    return methodFunction;
  }
};

/**
 * Determines if the given DOM element is an input field placed outside of HOT.
 * Notice: By 'input' we mean input, textarea and select nodes
 * @param element - DOM element
 * @returns {boolean}
 */
Handsontable.helper.isOutsideInput = function (element) {
  var inputs = ['INPUT', 'SELECT', 'TEXTAREA'];

  return inputs.indexOf(element.nodeName) > -1 && element.className.indexOf('handsontableInput') == -1;
};

/**
 * Determines whether given object is an Array.
 * Note: String is not an Array
 * @param {*} obj
 * @returns {boolean}
 */
Handsontable.helper.isArray = function(obj){
  return Array.isArray ? Array.isArray(obj) : Object.prototype.toString.call(obj) == '[object Array]';
};