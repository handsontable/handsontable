Handsontable.helper = {};

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

Handsontable.helper.isMetaKey = function (keyCode) {
  var keyCodes = Handsontable.helper.keyCode;
  var metaKeys = [
    keyCodes.ARROW_DOWN,
    keyCodes.ARROW_UP,
    keyCodes.ARROW_LEFT,
    keyCodes.ARROW_RIGHT,
    keyCodes.HOME,
    keyCodes.END,
    keyCodes.DELETE,
    keyCodes.BACKSPACE,
    keyCodes.F1,
    keyCodes.F2,
    keyCodes.F3,
    keyCodes.F4,
    keyCodes.F5,
    keyCodes.F6,
    keyCodes.F7,
    keyCodes.F8,
    keyCodes.F9,
    keyCodes.F10,
    keyCodes.F11,
    keyCodes.F12,
    keyCodes.TAB,
    keyCodes.PAGE_DOWN,
    keyCodes.PAGE_UP,
    keyCodes.ENTER,
    keyCodes.ESCAPE,
    keyCodes.SHIFT,
    keyCodes.CAPS_LOCK,
    keyCodes.ALT
  ];

  return metaKeys.indexOf(keyCode) != -1;
};

Handsontable.helper.isCtrlKey = function (keyCode) {

  var keys = Handsontable.helper.keyCode;

  return [keys.CONTROL_LEFT, 224, keys.COMMAND_LEFT, keys.COMMAND_RIGHT].indexOf(keyCode) != -1;
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
 * Creates 2D array of Excel-like values "A1", "A2", ...
 * @param rowCount
 * @param colCount
 * @returns {Array}
 */
Handsontable.helper.createSpreadsheetData = function(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = [];
    for (j = 0; j < colCount; j++) {
      row.push(Handsontable.helper.spreadsheetColumnLabel(j) + (i + 1));
    }
    rows.push(row);
  }
  return rows;
};

Handsontable.helper.createSpreadsheetObjectData = function(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = {};
    for (j = 0; j < colCount; j++) {
      row['prop' + j] = Handsontable.helper.spreadsheetColumnLabel(j) + (i + 1);
    }
    rows.push(row);
  }
  return rows;
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
 * Generates a random hex string. Used as namespace for Handsontable instance events.
 * @return {String} - 16 character random string: "92b1bfc74ec4"
 */
Handsontable.helper.randomString = function () {
  return walkontableRandomString();
};

/**
 * Inherit without without calling parent constructor, and setting `Child.prototype.constructor` to `Child` instead of `Parent`.
 * Creates temporary dummy function to call it as constructor.
 * Described in ticket: https://github.com/handsontable/handsontable/pull/516
 * @param  {Object} Child  child class
 * @param  {Object} Parent parent class
 * @return {Object}        extended Child
 */
Handsontable.helper.inherit = function (Child, Parent) {
  Parent.prototype.constructor = Parent;
  Child.prototype = new Parent();
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
 * Perform deep extend of a target object with extension's own properties
 * @param {Object} target An object that will receive the new properties
 * @param {Object} extension An object containing additional properties to merge into the target
 */
Handsontable.helper.deepExtend = function (target, extension) {
  for (var key in extension) {
    if (extension.hasOwnProperty(key)) {
      if (extension[key] && typeof extension[key] === 'object') {
        if (!target[key]) {
          if (Array.isArray(extension[key])) {
            target[key] = [];
          }
          else {
            target[key] = {};
          }
        }
        Handsontable.helper.deepExtend(target[key], extension[key]);
      }
      else {
        target[key] = extension[key];
      }
    }
  }
};

/**
 * Perform deep clone of an object
 * WARNING! Only clones JSON properties. Will cause error when `obj` contains a function, Date, etc
 * @param {Object} obj An object that will be cloned
 * @return {Object}
 */
Handsontable.helper.deepClone = function (obj) {
  if (typeof obj === "object") {
    return JSON.parse(JSON.stringify(obj));
  }
  else {
    return obj;
  }
};

Handsontable.helper.getPrototypeOf = function (obj) {
  var prototype;

  /* jshint ignore:start */
  if(typeof obj.__proto__ == "object"){
    prototype = obj.__proto__;
  } else {
    var oldConstructor,
        constructor = obj.constructor;

    if (typeof obj.constructor == "function") {
      oldConstructor = constructor;

      if (delete obj.constructor){
        constructor = obj.constructor; // get real constructor
        obj.constructor = oldConstructor; // restore constructor
      }


    }

    prototype = constructor ? constructor.prototype : null; // needed for IE

  }
  /* jshint ignore:end */

  return prototype;
};

/**
 * Factory for columns constructors.
 * @param {Object} GridSettings
 * @param {Array} conflictList
 * @return {Object} ColumnSettings
 */
Handsontable.helper.columnFactory = function (GridSettings, conflictList) {
  function ColumnSettings () {}

  Handsontable.helper.inherit(ColumnSettings, GridSettings);

  // Clear conflict settings
  for (var i = 0, len = conflictList.length; i < len; i++) {
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
      output[j].push(input[i][j]);
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
 * Determines if the given DOM element is an input field.
 * Notice: By 'input' we mean input, textarea and select nodes
 * @param element - DOM element
 * @returns {boolean}
 */
Handsontable.helper.isInput = function (element) {
  var inputs = ['INPUT', 'SELECT', 'TEXTAREA'];

  return inputs.indexOf(element.nodeName) > -1;
};

/**
 * Determines if the given DOM element is an input field placed OUTSIDE of HOT.
 * Notice: By 'input' we mean input, textarea and select nodes
 * @param element - DOM element
 * @returns {boolean}
 */
Handsontable.helper.isOutsideInput = function (element) {
  return Handsontable.helper.isInput(element) && element.className.indexOf('handsontableInput') == -1;
};

Handsontable.helper.keyCode = {
  MOUSE_LEFT: 1,
  MOUSE_RIGHT: 3,
  MOUSE_MIDDLE: 2,
  BACKSPACE: 8,
  COMMA: 188,
  INSERT: 45,
  DELETE: 46,
  END: 35,
  ENTER: 13,
  ESCAPE: 27,
  CONTROL_LEFT: 91,
  COMMAND_LEFT: 17,
  COMMAND_RIGHT: 93,
  ALT: 18,
  HOME: 36,
  PAGE_DOWN: 34,
  PAGE_UP: 33,
  PERIOD: 190,
  SPACE: 32,
  SHIFT: 16,
  CAPS_LOCK: 20,
  TAB: 9,
  ARROW_RIGHT: 39,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  A: 65,
  X: 88,
  C: 67,
  V: 86
};

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects
 * @param {*} obj
 * @returns {boolean}
 */
Handsontable.helper.isObject = function (obj) {
  return Object.prototype.toString.call(obj) == '[object Object]';
};

Handsontable.helper.pivot = function (arr) {
  var pivotedArr = [];

  if(!arr || arr.length === 0 || !arr[0] || arr[0].length === 0){
    return pivotedArr;
  }

  var rowCount = arr.length;
  var colCount = arr[0].length;

  for(var i = 0; i < rowCount; i++){
    for(var j = 0; j < colCount; j++){
      if(!pivotedArr[j]){
        pivotedArr[j] = [];
      }

      pivotedArr[j][i] = arr[i][j];
    }
  }

  return pivotedArr;

};

Handsontable.helper.proxy = function (fun, context) {
  return function () {
    return fun.apply(context, arguments);
  };
};

/**
 * Factory that produces a function for searching methods (or any properties) which could be defined directly in
 * table configuration or implicitly, within cell type definition.
 *
 * For example: renderer can be defined explicitly using "renderer" property in column configuration or it can be
 * defined implicitly using "type" property.
 *
 * Methods/properties defined explicitly always takes precedence over those defined through "type".
 *
 * If the method/property is not found in an object, searching is continued recursively through prototype chain, until
 * it reaches the Object.prototype.
 *
 *
 * @param methodName {String} name of the method/property to search (i.e. 'renderer', 'validator', 'copyable')
 * @param allowUndefined {Boolean} [optional] if false, the search is continued if methodName has not been found in cell "type"
 * @returns {Function}
 */
Handsontable.helper.cellMethodLookupFactory = function (methodName, allowUndefined) {

  allowUndefined = typeof allowUndefined == 'undefined' ? true : allowUndefined;

  return function cellMethodLookup (row, col) {

    return (function getMethodFromProperties(properties) {

      if (!properties){

        return;                       //method not found

      }
      else if (properties.hasOwnProperty(methodName) && properties[methodName] !== void 0) { //check if it is own and is not empty

        return properties[methodName];  //method defined directly

      } else if (properties.hasOwnProperty('type') && properties.type) { //check if it is own and is not empty

        var type;

        if(typeof properties.type != 'string' ){
          throw new Error('Cell type must be a string ');
        }

        type = translateTypeNameToObject(properties.type);

        if (type.hasOwnProperty(methodName)) {
          return type[methodName]; //method defined in type.
        } else if (allowUndefined) {
          return; //method does not defined in type (eg. validator), returns undefined
        }

      }

      return getMethodFromProperties(Handsontable.helper.getPrototypeOf(properties));

    })(typeof row == 'number' ? this.getCellMeta(row, col) : row);

  };

  function translateTypeNameToObject(typeName) {
    var type = Handsontable.cellTypes[typeName];

    if(typeof type == 'undefined'){
      throw new Error('You declared cell type "' + typeName + '" as a string that is not mapped to a known object. ' +
                      'Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
    }

    return type;
  }

};

Handsontable.helper.isMobileBrowser = function (userAgent) {
  if(!userAgent) {
    userAgent = navigator.userAgent;
  }
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));

  // Logic for checking the specific mobile browser
  //
  /* var type = type != void 0 ? type.toLowerCase() : ''
    , result;
  switch(type) {
    case '':
      result = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      return result;
      break;
    case 'ipad':
      return navigator.userAgent.indexOf('iPad') > -1;
      break;
    case 'android':
      return navigator.userAgent.indexOf('Android') > -1;
      break;
    case 'windows':
      return navigator.userAgent.indexOf('IEMobile') > -1;
      break;
    default:
      throw new Error('Invalid isMobileBrowser argument');
      break;
  } */
};

Handsontable.helper.isTouchSupported = function () {
  return ('ontouchstart' in window);
};

Handsontable.helper.stopPropagation = function (event) {
  // ie8
  //http://msdn.microsoft.com/en-us/library/ie/ff975462(v=vs.85).aspx
  if (typeof (event.stopPropagation) === 'function') {
    event.stopPropagation();
  }
  else {
    event.cancelBubble = true;
  }
};

Handsontable.helper.pageX = function (event) {
  if (event.pageX) {
    return event.pageX;
  }

  var scrollLeft = Handsontable.Dom.getWindowScrollLeft();
  var cursorX = event.clientX + scrollLeft;

  return cursorX;
};

Handsontable.helper.pageY = function (event) {
  if (event.pageY) {
    return event.pageY;
  }

  var scrollTop = Handsontable.Dom.getWindowScrollTop();
  var cursorY = event.clientY + scrollTop;

  return cursorY;
};
