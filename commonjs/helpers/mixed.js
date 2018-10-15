'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteral(['\n          Your license key of Handsontable Pro has expired.\u200C\u200C\u200C\u200C \n          Renew your maintenance plan at https://handsontable.com or downgrade to the previous version of the software.\n          '], ['\n          Your license key of Handsontable Pro has expired.\u200C\u200C\u200C\u200C \n          Renew your maintenance plan at https://handsontable.com or downgrade to the previous version of the software.\n          ']);

exports.stringify = stringify;
exports.isDefined = isDefined;
exports.isUndefined = isUndefined;
exports.isEmpty = isEmpty;
exports.isRegExp = isRegExp;
exports._injectProductInfo = _injectProductInfo;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _templateLiteralTag = require('./templateLiteralTag');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

/**
 * Converts any value to string.
 *
 * @param {*} value
 * @returns {String}
 */
function stringify(value) {
  var result = void 0;

  switch (typeof value === 'undefined' ? 'undefined' : _typeof(value)) {
    case 'string':
    case 'number':
      result = '' + value;
      break;

    case 'object':
      result = value === null ? '' : value.toString();
      break;
    case 'undefined':
      result = '';
      break;
    default:
      result = value.toString();
      break;
  }

  return result;
}

/**
 * Checks if given variable is defined.
 *
 * @param {*} variable Variable to check.
 * @returns {Boolean}
 */
function isDefined(variable) {
  return typeof variable !== 'undefined';
}

/**
 * Checks if given variable is undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {Boolean}
 */
function isUndefined(variable) {
  return typeof variable === 'undefined';
}

/**
 * Check if given variable is null, empty string or undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {Boolean}
 */
function isEmpty(variable) {
  return variable === null || variable === '' || isUndefined(variable);
}

/**
 * Check if given variable is a regular expression.
 *
 * @param {*} variable Variable to check.
 * @returns {Boolean}
 */
function isRegExp(variable) {
  return Object.prototype.toString.call(variable) === '[object RegExp]';
}

/* eslint-disable */
var _m = '\x6C\x65\x6E\x67\x74\x68';
var _hd = function _hd(v) {
  return parseInt(v, 16);
};
var _pi = function _pi(v) {
  return parseInt(v, 10);
};
var _ss = function _ss(v, s, l) {
  return v['\x73\x75\x62\x73\x74\x72'](s, l);
};
var _cp = function _cp(v) {
  return v['\x63\x6F\x64\x65\x50\x6F\x69\x6E\x74\x41\x74'](0) - 65;
};
var _norm = function _norm(v) {
  return ('' + v).replace(/\-/g, '');
};
var _extractTime = function _extractTime(v) {
  return _hd(_ss(_norm(v), _hd('12'), _cp('\x46'))) / (_hd(_ss(_norm(v), _cp('\x42'), ~~![][_m])) || 9);
};
var _ignored = function _ignored() {
  return typeof location !== 'undefined' && /^([a-z0-9\-]+\.)?\x68\x61\x6E\x64\x73\x6F\x6E\x74\x61\x62\x6C\x65\x2E\x63\x6F\x6D$/i.test(location.host);
};
var _notified = false;

function _injectProductInfo(key, element) {
  key = _norm(key || '');

  var warningMessage = '';
  var showDomMessage = true;
  var schemaValidity = _checkKeySchema(key);
  var ignored = _ignored();
  var trial = isEmpty(key) || key === 'trial';

  if (trial || schemaValidity) {
    if (schemaValidity) {
      var releaseTime = Math.floor((0, _moment2.default)('02/10/2018', 'DD/MM/YYYY').toDate().getTime() / 8.64e7);
      var keyGenTime = _extractTime(key);

      if (keyGenTime > 45000 || keyGenTime !== parseInt(keyGenTime, 10)) {
        warningMessage = 'The license key provided to Handsontable Pro is invalid. Make sure you pass it correctly.';
      }

      if (!warningMessage) {
        if (releaseTime > keyGenTime + 1) {
          warningMessage = (0, _templateLiteralTag.toSingleLine)(_templateObject);
        }
        showDomMessage = releaseTime > keyGenTime + 15;
      }
    } else {
      warningMessage = 'Evaluation version of Handsontable Pro. Not licensed for use in a production environment.';
    }
  } else {
    warningMessage = 'The license key provided to Handsontable Pro is invalid. Make sure you pass it correctly.';
  }
  if (ignored) {
    warningMessage = false;
    showDomMessage = false;
  }

  if (warningMessage && !_notified) {
    console[trial ? 'info' : 'warn'](warningMessage);
    _notified = true;
  }
  if (showDomMessage && element.parentNode) {
    var message = document.createElement('div');

    message.id = 'hot-display-license-info';
    message.appendChild(document.createTextNode('Evaluation version of Handsontable Pro.'));
    message.appendChild(document.createElement('br'));
    message.appendChild(document.createTextNode('Not licensed for production use.'));

    element.parentNode.insertBefore(message, element.nextSibling);
  }
}

function _checkKeySchema(v) {
  var z = [][_m];
  var p = z;

  if (v[_m] !== _cp('\x5A')) {
    return false;
  }

  for (var c = '', i = '\x42\x3C\x48\x34\x50\x2B'.split(''), j = _cp(i.shift()); j; j = _cp(i.shift() || 'A')) {
    --j < ''[_m] ? p = p | (_pi('' + _pi(_hd(c) + (_hd(_ss(v, Math.abs(j), 2)) + []).padStart(2, '0'))) % 97 || 2) >> 1 : c = _ss(v, j, !j ? 6 : i[_m] === 1 ? 9 : 8);
  }

  return p === z;
}
/* eslint-enable */