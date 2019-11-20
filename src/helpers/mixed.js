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

const consoleMessages = {
  invalid: () => toSingleLine`
    The license key for Handsontable is invalid.\x20
    If you need any help, contact us at support@handsontable.com.`,
  expired: ({ keyValidityDate, hotVersion }) => toSingleLine`
    The license key for Handsontable expired on ${keyValidityDate}, and is not valid for the installed\x20
    version ${hotVersion}. Renew your license key at handsontable.com or downgrade to a version released prior\x20
    to ${keyValidityDate}. If you need any help, contact us at sales@handsontable.com.`,
  missing: () => toSingleLine`
    The license key for Handsontable is missing. Use your purchased key to activate the product.\x20
    Alternatively, you can activate Handsontable to use for non-commercial purposes by\x20
    passing the key: 'non-commercial-and-evaluation'. If you need any help, contact\x20
    us at support@handsontable.com.`,
  non_commercial: () => '',
};
const domMessages = {
  invalid: () => toSingleLine`
    The license key for Handsontable is invalid.\x20
    <a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> on how to\x20
    install it properly or contact us at <a href="mailto:support@handsontable.com">support@handsontable.com</a>.`,
  expired: ({ keyValidityDate, hotVersion }) => toSingleLine`
    The license key for Handsontable expired on ${keyValidityDate}, and is not valid for the installed\x20
    version ${hotVersion}. <a href="https://handsontable.com/pricing" target="_blank">Renew</a> your\x20
    license key or downgrade to a version released prior to ${keyValidityDate}. If you need any\x20
    help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.`,
  missing: () => toSingleLine`
    The license key for Handsontable is missing. Use your purchased key to activate the product.\x20
    Alternatively, you can activate Handsontable to use for non-commercial purposes by\x20
    passing the key: 'non-commercial-and-evaluation'.\x20
    <a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> about it in\x20
    the documentation or contact us at <a href="mailto:support@handsontable.com">support@handsontable.com</a>.`,
  non_commercial: () => '',
};

export function _injectProductInfo(key, element) {
  const hasValidType = !isEmpty(key);
  const isNonCommercial = typeof key === 'string' && key.toLowerCase() === 'non-commercial-and-evaluation';
  const hotVersion = process.env.HOT_VERSION;
  let keyValidityDate;
  let consoleMessageState = 'invalid';
  let domMessageState = 'invalid';

  key = _norm(key || '');

  const schemaValidity = _checkKeySchema(key);

  if (hasValidType || isNonCommercial || schemaValidity) {
    if (schemaValidity) {
      const releaseDate = moment(process.env.HOT_RELEASE_DATE, 'DD/MM/YYYY');
      const releaseDays = Math.floor(releaseDate.toDate().getTime() / 8.64e7);
      const keyValidityDays = _extractTime(key);

      keyValidityDate = moment((keyValidityDays + 1) * 8.64e7, 'x').format('MMMM DD, YYYY');

      if (releaseDays > keyValidityDays) {
        const daysAfterRelease = moment().diff(releaseDate, 'days');

        consoleMessageState = daysAfterRelease <= 1 ? 'valid' : 'expired';
        domMessageState = daysAfterRelease <= 15 ? 'valid' : 'expired';
      } else {
        consoleMessageState = 'valid';
        domMessageState = 'valid';
      }

    } else if (isNonCommercial) {
      consoleMessageState = 'non_commercial';
      domMessageState = 'valid';

    } else {
      consoleMessageState = 'invalid';
      domMessageState = 'invalid';
    }

  } else {
    consoleMessageState = 'missing';
    domMessageState = 'missing';
  }

  if (_ignored()) {
    consoleMessageState = 'valid';
    domMessageState = 'valid';
  }

  if (!_notified && consoleMessageState !== 'valid') {
    const message = consoleMessages[consoleMessageState]({
      keyValidityDate,
      hotVersion,
    });

    if (message) {
      console[consoleMessageState === 'non_commercial' ? 'info' : 'warn'](consoleMessages[consoleMessageState]({
        keyValidityDate,
        hotVersion,
      }));
    }
    _notified = true;
  }

  if (domMessageState !== 'valid' && element.parentNode) {
    const message = domMessages[domMessageState]({
      keyValidityDate,
      hotVersion,
    });

    if (message) {
      const messageNode = document.createElement('div');

      messageNode.id = 'hot-display-license-info';
      messageNode.innerHTML = domMessages[domMessageState]({
        keyValidityDate,
        hotVersion,
      });
      element.parentNode.insertBefore(messageNode, element.nextSibling);
    }
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
