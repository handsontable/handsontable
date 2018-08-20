import moment from 'moment';
import { toSingleLine } from './templateLiteralTag';

/**
 * Converts any value to string.
 *
 * @param {*} value
 * @returns {String}
 */
export function stringify(value) {
  let result;

  switch (typeof value) {
    case 'string':
    case 'number':
      result = `${value}`;
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
export function isDefined(variable) {
  return typeof variable !== 'undefined';
}

/**
 * Checks if given variable is undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {Boolean}
 */
export function isUndefined(variable) {
  return typeof variable === 'undefined';
}

/**
 * Check if given variable is null, empty string or undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {Boolean}
 */
export function isEmpty(variable) {
  return variable === null || variable === '' || isUndefined(variable);
}

/**
 * Check if given variable is a regular expression.
 *
 * @param {*} variable Variable to check.
 * @returns {Boolean}
 */
export function isRegExp(variable) {
  return Object.prototype.toString.call(variable) === '[object RegExp]';
}

/* eslint-disable */
const _m = '\x6C\x65\x6E\x67\x74\x68';
const _hd = (v) => parseInt(v, 16);
const _pi = (v) => parseInt(v, 10);
const _ss = (v, s, l) => v['\x73\x75\x62\x73\x74\x72'](s, l);
const _cp = (v) => v['\x63\x6F\x64\x65\x50\x6F\x69\x6E\x74\x41\x74'](0) - 65;
const _norm = (v) => `${v}`.replace(/\-/g, '');
const _extractTime = (v) => _hd(_ss(_norm(v), _hd('12'), _cp('\x46'))) / (_hd(_ss(_norm(v), _cp('\x42'), ~~![][_m])) || 9);
const _ignored = () => typeof location !== 'undefined' && /^([a-z0-9\-]+\.)?\x68\x61\x6E\x64\x73\x6F\x6E\x74\x61\x62\x6C\x65\x2E\x63\x6F\x6D$/i.test(location.host);
let _notified = false;

export function _injectProductInfo(key, element) {
  key = _norm(key || '');

  let warningMessage = '';
  let showDomMessage = true;
  const schemaValidity = _checkKeySchema(key);
  const ignored = _ignored();
  const trial = isEmpty(key) || key === 'trial';

  if (trial || schemaValidity) {
    if (schemaValidity) {
      const releaseTime = Math.floor(moment(process.env.HOT_RELEASE_DATE, 'DD/MM/YYYY').toDate().getTime() / 8.64e7);
      const keyGenTime = _extractTime(key);

      if (keyGenTime > 45000 || keyGenTime !== parseInt(keyGenTime, 10)) {
        warningMessage = 'The license key provided to Handsontable Pro is invalid. Make sure you pass it correctly.';
      }

      if (!warningMessage) {
        if (releaseTime > keyGenTime + 1) {
          warningMessage = toSingleLine`
          Your license key of Handsontable Pro has expired.‌‌‌‌ 
          Renew your maintenance plan at https://handsontable.com or downgrade to the previous version of the software.
          `;
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
    const message = document.createElement('div');

    message.id = 'hot-display-license-info';
    message.appendChild(document.createTextNode('Evaluation version of Handsontable Pro.'));
    message.appendChild(document.createElement('br'));
    message.appendChild(document.createTextNode('Not licensed for production use.'));

    element.parentNode.insertBefore(message, element.nextSibling);
  }
}

function _checkKeySchema(v) {
  let z = [][_m];
  let p = z;

  if (v[_m] !== _cp('\x5A')) {
    return false;
  }

  for (let c = '', i = '\x42\x3C\x48\x34\x50\x2B'.split(''), j = _cp(i.shift()); j; j = _cp(i.shift() || 'A')) {
    --j<''[_m]?p=p|(_pi(`${_pi(_hd(c)+(_hd(_ss(v,Math.abs(j),2))+[]).padStart(2,'0'))}`)%97||2)>>1:c=_ss(v,j,!j?6:i[_m]===1?9:8);
  }

  return p === z;
}
/* eslint-enable */
