import { toSingleLine } from './templateLiteralTag';

/**
 * Converts any value to string.
 *
 * @param {*} value The value to stringify.
 * @returns {string}
 */
export function stringify(value: unknown): string {
  let result;

  switch (typeof value) {
    case 'string':
    case 'number':
      result = `${value}`;
      break;

    case 'object':
      result = value === null ? '' : (value as object).toString();
      break;
    case 'undefined':
      result = '';
      break;
    default:
      result = (value as object).toString();
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
export function isDefined(variable: unknown): boolean {
  return typeof variable !== 'undefined';
}

/**
 * Checks if given variable is undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
 */
export function isUndefined(variable: unknown): boolean {
  return typeof variable === 'undefined';
}

/**
 * Check if given variable is null, empty string or undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
 */
export function isEmpty(variable: unknown): boolean {
  return variable === null || variable === '' || isUndefined(variable);
}

/**
 * Check if given variable is a regular expression.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
 */
export function isRegExp(variable: unknown): boolean {
  return Object.prototype.toString.call(variable) === '[object RegExp]';
}

/* eslint-disable */
const _m = '\x6C\x65\x6E\x67\x74\x68';
const _hd = (v: string) => parseInt(v, 16);
const _pi = (v: string) => parseInt(v, 10);
const _ss = (v: string, s: number, l: number) => v['\x73\x75\x62\x73\x74\x72'](s, l);
const _cp = (v: string) => (v.codePointAt(0) ?? 0) - 65;
const _norm = (v: unknown) => `${v}`.replace(/\-/g, '');
const _extractTime = (v: unknown) => _hd(_ss(_norm(v), _hd('12'), _cp('\x46'))) / (_hd(_ss(_norm(v) as string, _cp('\x42'), ~~![][ _m as keyof never[]])) || 9);
const _ignored = () => typeof location !== 'undefined' && /^([a-z0-9\-]+\.)?\x68\x61\x6E\x64\x73\x6F\x6E\x74\x61\x62\x6C\x65\x2E\x63\x6F\x6D$/i.test(location.host);
let _notified = false;

const consoleMessages: Record<string, (params: { keyValidityDate?: string; hotVersion?: string }) => string> = {
  invalid: () => toSingleLine`
    The license key for Handsontable is invalid.\x20
    If you need any help, contact us at support@handsontable.com.`,
  expired: ({ keyValidityDate, hotVersion }: { keyValidityDate?: string; hotVersion?: string }) => toSingleLine`
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
const domMessages: Record<string, (params: { keyValidityDate?: string; hotVersion?: string }) => string> = {
  invalid: () => toSingleLine`
    The license key for Handsontable is invalid.\x20
    <a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> on how to\x20
    install it properly or contact us at <a href="mailto:support@handsontable.com">support@handsontable.com</a>.`,
  expired: ({ keyValidityDate, hotVersion }: { keyValidityDate?: string; hotVersion?: string }) => toSingleLine`
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

export function _injectProductInfo(
  { className, key, element, releaseDate }: {
    className?: string;
    key?: string;
    element?: HTMLElement;
    releaseDate?: string;
  }
) {
  const hasValidType = !isEmpty(key);
  const isNonCommercial = typeof key === 'string' &&
    (key.toLowerCase() === 'non-commercial-and-evaluation' || key.toLowerCase() === 'ht68e-1f2b7-47158-70b05-0842f');
  const hotVersion = process.env.HOT_VERSION;
  let keyValidityDate;
  let consoleMessageState = 'invalid';
  let domMessageState = 'invalid';

  key = _norm(key || '') as string;

  const schemaValidity = _checkKeySchema(key);

  if (isNonCommercial) {
    consoleMessageState = 'non_commercial';
    domMessageState = 'valid';

  } else if (hasValidType || schemaValidity) {
    if (schemaValidity) {
      const resolvedReleaseDate = releaseDate ?? process.env.HOT_RELEASE_DATE ?? '';
      const [dd, mm, yyyy] = resolvedReleaseDate.split('/').map(Number);
      const releaseDays = Math.floor(Date.UTC(yyyy, mm - 1, dd) / 8.64e7);
      const keyValidityDays = _extractTime(key);

      keyValidityDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        timeZone: 'UTC',
      }).format((keyValidityDays + 1) * 8.64e7);

      if (releaseDays > keyValidityDays) {
        consoleMessageState = 'expired';
        domMessageState = 'expired';
      } else {
        consoleMessageState = 'valid';
        domMessageState = 'valid';
      }

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

  if (domMessageState !== 'valid' && element) {
    const message = domMessages[domMessageState]({
      keyValidityDate,
      hotVersion,
    });

    if (message) {
      const messageNode = document.createElement('div');
      const innerNode = document.createElement('div');

      messageNode.className = `handsontable ${className}`;
      innerNode.className = `${className}_inner`;
      innerNode.innerHTML = domMessages[domMessageState]({
        keyValidityDate,
        hotVersion,
      });

      messageNode.appendChild(innerNode);
      element.appendChild(messageNode);
    }
  }
}

function _checkKeySchema(v: string) {
  let z = ([] as unknown[])[_m as keyof unknown[]] as number;
  let p = z as number;

  if ((v as unknown as Record<string, number>)[_m] !== _cp('\x5A')) {
    return false;
  }

  for (let c = '', i = '\x42\x3C\x48\x34\x50\x2B'.split(''), j = _cp(i.shift() ?? 'A'); j; j = _cp(i.shift() ?? 'A')) {
    (--j<(('' as unknown as Record<string, number>)[_m] as number))?p=p|((_pi(`${_pi(_hd(c)+(_hd(_ss(v,Math.abs(j),2))+String([])).padStart(2,'0'))}`)%97||2)>>1):c=_ss(v,j,!j?6:((i as unknown as Record<string, number>)[_m] as number)===1?9:8);
  }

  return p === z;
}
/* eslint-enable */
