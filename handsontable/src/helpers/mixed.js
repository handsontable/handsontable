import { toSingleLine } from './templateLiteralTag';

/**
 * Converts any value to string.
 *
 * @param {*} value The value to stringify.
 * @returns {string}
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
 * @returns {boolean}
 */
export function isDefined(variable) {
  return typeof variable !== 'undefined';
}

/**
 * Checks if given variable is undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
 */
export function isUndefined(variable) {
  return typeof variable === 'undefined';
}

/**
 * Check if given variable is null, empty string or undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
 */
export function isEmpty(variable) {
  return variable === null || variable === '' || isUndefined(variable);
}

/**
 * Check if given variable is a regular expression.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
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
const _extractTime = (v) => {
  const n = _norm(v);
  if (n[_m] !== 25) return 0;

  if (_ss(n, _cp('A'), 2) === '\x68\x74') {
    return _hd(_ss(n, _hd('12'), _cp('\x46'))) / (_hd(_ss(n, _cp('F'), ~~![][_m])) || 9);
  }
  return _hd(_ss(n, _hd('12'), _cp('\x46'))) / (_hd(_ss(n, _cp('\x42'), ~~![][_m])) || 9);
};
const _ignored = () => typeof location !== 'undefined' && /^([a-z0-9\-]+\.)?\x68\x61\x6E\x64\x73\x6F\x6E\x74\x61\x62\x6C\x65\x2E\x63\x6F\x6D$/i.test(location.host);
let _notified = false;

const consoleMessages = {
  invalid: () => toSingleLine`
    The license key for Handsontable is invalid.\x20
    If you need any help, contact us at support@handsontable.com.`,
  expired: ({ keyValidityDate, hotVersion, isTrial }) => toSingleLine`
    The ${isTrial ? 'trial' : ''} license key for Handsontable expired on ${keyValidityDate}, and is not valid for the installed\x20
    version ${hotVersion}.${isTrial ? '' : ` Renew your license key at handsontable.com or downgrade to a version released prior to ${keyValidityDate}.`} If you need any help, contact us at sales@handsontable.com.`,
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
    <a href="https://handsontable.com/docs/license-key/" target="_blank">Read more</a> on how to\x20
    install it properly or contact us at <a href="mailto:support@handsontable.com">support@handsontable.com</a>.`,
  expired: ({ keyValidityDate, hotVersion, isTrial }) => toSingleLine`
    The ${isTrial ? 'trial' : ''} license key for Handsontable expired on ${keyValidityDate}, and is not valid for the installed\x20
    version ${hotVersion}.${isTrial ? '' : ` <a href="https://handsontable.com/pricing" target="_blank">Renew</a> your license key or downgrade to a version released prior to ${keyValidityDate}.`} If you need any\x20
    help, contact us at <a href="mailto:sales@handsontable.com">sales@handsontable.com</a>.`,
  missing: () => toSingleLine`
    The license key for Handsontable is missing. Use your purchased key to activate the product.\x20
    Alternatively, you can activate Handsontable to use for non-commercial purposes by\x20
    passing the key: 'non-commercial-and-evaluation'.\x20
    <a href="https://handsontable.com/docs/license-key/" target="_blank">Read more</a> about it in\x20
    the documentation or contact us at <a href="mailto:support@handsontable.com">support@handsontable.com</a>.`,
  non_commercial: () => '',
};

export function _injectProductInfo(key, element, releaseDate) {
  const hasValidType = !isEmpty(key);
  const isNonCommercial = typeof key === 'string' && key.toLowerCase() === 'non-commercial-and-evaluation';
  const hotVersion = process.env.HOT_VERSION;
  let keyValidityDate;
  let consoleMessageState = 'invalid';
  let domMessageState = 'invalid';
  let isTrial;

  key = _norm(key || '');

  const schemaValidity = _checkKeySchema(key);

  if (hasValidType || isNonCommercial || schemaValidity) {
    if (schemaValidity) {
      const [dd, mm, yyyy] = releaseDate.split('/').map(Number);
      const releaseDays = Math.floor(Date.UTC(yyyy, mm - 1, dd) / 8.64e7);
      const keyValidityDays = _extractTime(key);

      keyValidityDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        timeZone: 'UTC',
      }).format((keyValidityDays + 1) * 8.64e7);

      isTrial = _ss(key, _cp('A'), 2) === '\x68\x74';

      const referenceDays = isTrial ? Math.floor(Date.now() / 8.64e7) : releaseDays;

      if (referenceDays > keyValidityDays) {
        consoleMessageState = 'expired';
        domMessageState = 'expired';
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
      isTrial,
    });

    if (message) {
      console[consoleMessageState === 'non_commercial' ? 'info' : 'warn'](consoleMessages[consoleMessageState]({
        keyValidityDate,
        hotVersion,
        isTrial,
      }));
    }
    _notified = true;
  }

  if (domMessageState !== 'valid' && element) {
    const message = domMessages[domMessageState]({
      keyValidityDate,
      hotVersion,
      isTrial,
    });

    if (message) {
      const messageNode = document.createElement('div');

      messageNode.className = 'handsontable hot-display-license-info';
      messageNode.innerHTML = domMessages[domMessageState]({
        keyValidityDate,
        hotVersion,
        isTrial,
      });

      element.appendChild(messageNode);
    }
  }
}

function _checkKeySchema(v) {
  let z = [][_m];
  let p = z;

  v = _norm(v);

  if (v[_m] !== _cp('\x5A')) {
    return false;
  }

  if (_ss(v, _cp('A'), 2) === '\x68\x74') {
    v = _ss(v, 2, _cp('X'));
    const _pid = '\x68\x74'.split('').map((x) => _cp(x) + _cp('\x41') + 65);
    const _tbl = [[_cp('A'), 5, _cp('F'), 2], [_cp('F'), _cp('J'), _cp('O'), 2], [_cp('O'), _cp('H'), _cp('V'), 2]];
    return _tbl.reduce((e, [bs, bl, ss, sl], c) => {
      const _block = _hd(_ss(v, bs, bl));
      const _sig = (_hd(_ss(v, ss, sl)) + []).padStart(2, '0');
      e |= ((_pi(String(_block) + _sig) % 97) || 2) >> 1;
      e |= (c === 0 || c === 1 ? (_hd(_ss(v, bs + (c === 1 ? 2 : 0), 2)) === _pi(_pid[c]) ? 0 : 1) : 0);
      return e;
    }, _cp('A')) === ([] + 1 >> 1);
  }

  for (let c = '', i = '\x42\x3C\x48\x34\x50\x2B'.split(''), j = _cp(i.shift()); j; j = _cp(i.shift() || 'A')) {
    --j<''[_m]?p=p|(_pi(`${_pi(_hd(c)+(_hd(_ss(v,Math.abs(j),2))+[]).padStart(2,'0'))}`)%97||2)>>1:c=_ss(v,j,!j?6:i[_m]===1?9:8);
  }

  return p === z;
}
/* eslint-enable */
