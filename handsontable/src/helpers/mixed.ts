import { toSingleLine } from './templateLiteralTag';
import { warn, error } from './console';
import {
  hasTypedKeyTag,
  extractTypedKeyData,
  classifyTypedKeyState,
  getLicenseGrants,
  UNRESTRICTED_GRANTS,
} from '../utils/typedLicenseKey';
import type { LicenseLifecycle, LicenseGrants } from '../utils/typedLicenseKey';

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

/* eslint-disable dot-notation, no-useless-escape, max-len, no-bitwise, computed-property-spacing, jsdoc/require-jsdoc, no-restricted-globals, no-console, prefer-const, no-unused-expressions, no-plusplus, space-infix-ops, comma-spacing, no-nested-ternary */
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

/**
 * The parameters a typed-key message needs to fill in its placeholders: the days
 * left until expiry (active/ending states), the formatted expiry date, and the
 * formatted hard-stop date (subscription soft stop).
 */
type TypedMessageParams = {
  daysRemaining?: number | null;
  expiryDate?: string;
  hardStopDate?: string;
};

/**
 * Formats a day count with a correctly pluralized unit ("1 day", "2 days"), so
 * the last-day trial message does not read "expires in 1 days".
 *
 * @param {number|null|undefined} days The number of days.
 * @returns {string}
 */
function _formatDays(days: number | null | undefined): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * One console notification for a typed-license state: its severity and the copy
 * builder. Kept as a single record (not parallel severity/message maps) so a new
 * state cannot be added to one without the other - a `console[undefined](...)`
 * at init is impossible. Severity is a warning while the license still works
 * (trial running, subscription ending) and an error once it has stopped.
 */
type TypedConsoleNotification = {
  severity: 'warn' | 'error';
  message: (params: TypedMessageParams) => string;
};

/**
 * License sentences the spec repeats verbatim across surfaces - the bottom bar (here), the badge
 * popover, and the hard-stop lock screen (`utils/licenseBranding/content.ts`). Keeping one constant
 * per sentence means a legal/marketing wording change lands in every surface at once, instead of
 * drifting when only one copy is updated.
 */
export const LICENSE_EXPIRED_TITLE = 'Your Handsontable license has expired.';
export const PURCHASE_COMMERCIAL_LICENSE_TEXT =
  'To continue using Handsontable, you need to purchase a commercial license.';
export const RENEW_LICENSE_TEXT =
  'To continue using Handsontable, you need to renew your license.';

/**
 * The console notification for each typed-license lifecycle state that talks to
 * the developer. Silent states (freemium, comfortably-valid subscription, valid
 * perpetual) have no entry. The wording is fixed by the license spec.
 */
const typedConsoleNotifications: Record<string, TypedConsoleNotification> = {
  trial_active: {
    severity: 'warn',
    message: ({ daysRemaining }) => toSingleLine`
      Your Handsontable trial license key expires in ${_formatDays(daysRemaining)}. To continue using\x20
      Handsontable contact sales@handsontable.com to purchase a valid commercial license.`,
  },
  trial_expired: {
    severity: 'error',
    message: ({ expiryDate }) => toSingleLine`
      Your Handsontable trial license key expired on ${expiryDate}. To continue using Handsontable\x20
      contact sales@handsontable.com to purchase a valid commercial license.`,
  },
  trial_expired_hard: {
    severity: 'error',
    message: ({ expiryDate }) => toSingleLine`
      Your Handsontable trial license key expired on ${expiryDate}. You may no longer use Handsontable under\x20
      the trial license. To continue using the software contact sales@handsontable.com to purchase a valid license.`,
  },
  sub_ending: {
    severity: 'warn',
    message: ({ expiryDate }) => toSingleLine`
      Your Handsontable subscription license expires on ${expiryDate}.\x20
      To renew your license contact sales@handsontable.com.`,
  },
  sub_expired: {
    severity: 'error',
    message: ({ expiryDate, hardStopDate }) => toSingleLine`
      Your Handsontable subscription license key expired on ${expiryDate}. The software will become inactive on\x20
      ${hardStopDate}. To renew your license contact sales@handsontable.com.`,
  },
  sub_expired_hard: {
    severity: 'error',
    message: ({ expiryDate }) => toSingleLine`
      Your Handsontable subscription license key expired on ${expiryDate}. To continue using the software\x20
      contact sales@handsontable.com to purchase a valid license key.`,
  },
};

/**
 * The bottom-bar (DOM) copy for the typed states that show one: only the
 * soft-stopped trial (the hard stops render the Core-owned lock screen instead -
 * see `utils/licenseBranding/lockScreen.ts`). The lapsed perpetual license reuses
 * the legacy `expired` bar.
 */
const typedDomMessages: Record<string, (params: TypedMessageParams) => string> = {
  trial_expired: () => toSingleLine`
    ${LICENSE_EXPIRED_TITLE} ${PURCHASE_COMMERCIAL_LICENSE_TEXT}\x20
    <a href="mailto:sales@handsontable.com">Contact Sales</a>.`,
};

export function _injectProductInfo(
  { className, key, element, releaseDate }: {
    className?: string;
    key?: string;
    element?: HTMLElement;
    releaseDate?: string;
  }
): HTMLElement | null {
  // Typed keys ([TRIAL], [FREE], [SUB], [PERP]) are routed to their own path
  // BEFORE any legacy normalization runs. The legacy branch below is left exactly
  // as-is, so every existing key keeps behaving the same. The tag test is a cheap
  // prefix check, so a legacy key pays almost nothing for it.
  if (typeof key === 'string' && hasTypedKeyTag(key)) {
    return _injectTypedProductInfo({ className, key, element, releaseDate });
  }

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

      return messageNode;
    }
  }

  return null;
}

/**
 * Formats an epoch-millisecond timestamp as a UTC calendar date (for example
 * "August 27, 2026"), the same wording the legacy expired message uses. Exported
 * for the branding popover copy, so every license surface formats dates the same
 * way.
 *
 * @param {number} timestamp The time to format, in epoch milliseconds.
 * @returns {string}
 */
export function _formatUtcDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(timestamp);
}

/**
 * Converts the build release date ("dd/mm/yyyy", as injected at build time) into
 * the epoch milliseconds of its UTC midnight, so a perpetual key can be checked
 * static-against-static (airgap-safe), exactly like the legacy path.
 *
 * @param {string} releaseDate The build release date in "dd/mm/yyyy".
 * @returns {number}
 */
function _releaseDateToTimestamp(releaseDate: string): number {
  const [dd, mm, yyyy] = `${releaseDate}`.split('/').map(Number);

  return Date.UTC(yyyy, mm - 1, dd);
}

/**
 * The non-typed lifecycle states: the legacy 25-character family classified the
 * same way the frozen legacy emitter classifies it (valid, expired, missing,
 * non-commercial), plus "invalid" (a broken legacy key or an unreadable typed
 * key).
 */
type NonTypedLifecycleState = 'legacy_valid' | 'legacy_expired' | 'missing' | 'non_commercial' | 'invalid';

/**
 * The lifecycle facet a consumer reads: the typed states plus the non-typed
 * states. The typed-only fields are `null` for the non-typed states (except
 * `expiryTimestamp`, which a legacy-expired key carries too), so a caller can
 * read `.state` uniformly.
 */
export interface LicenseLifecycleFacet {
  state: LicenseLifecycle['state'] | NonTypedLifecycleState;
  keyType: LicenseLifecycle['keyType'] | null;
  daysRemaining: number | null;
  expiryTimestamp: number | null;
  hardStopTimestamp: number | null;
}

/**
 * The resolved license state handed to the UI and (later) the feature gates:
 * the lifecycle facet (what the license IS right now) and the grants facet (what
 * it UNLOCKS). `grants` is never null - the same query API serves legacy keys
 * (unlock everything) and typed keys (unlock what the payload lists).
 */
export interface LicenseStateDescriptor {
  lifecycle: LicenseLifecycleFacet;
  grants: LicenseGrants;
}

/**
 * Builds the lifecycle facet for a non-typed license state (the legacy
 * 25-character family, a missing key, the non-commercial key, or an unreadable
 * typed key).
 *
 * @param {string} state The non-typed state.
 * @param {number|null} [expiryTimestamp] The expiration time (epoch milliseconds)
 *                                        of a legacy-expired key.
 * @returns {LicenseLifecycleFacet}
 */
function _nonTypedLifecycle(state: NonTypedLifecycleState, expiryTimestamp: number | null = null): LicenseLifecycleFacet {
  return {
    state,
    keyType: null,
    daysRemaining: null,
    expiryTimestamp,
    hardStopTimestamp: null,
  };
}

/**
 * Classifies a non-typed license key into its lifecycle state. This mirrors -
 * read-only - the exact checks of the frozen legacy branch of
 * `_injectProductInfo` (the non-commercial comparison, the empty-key test, the
 * key schema checksum, and the release-days versus validity-days comparison), so
 * the branding UI sees the same state the legacy console/DOM messaging acts on.
 * The legacy emitter itself is untouched.
 *
 * @param {string} [key] The license key from the grid settings.
 * @param {string} [releaseDate] The build release date ("dd/mm/yyyy").
 * @returns {LicenseLifecycleFacet}
 */
function _classifyLegacyKey(key?: string, releaseDate?: string): LicenseLifecycleFacet {
  const isNonCommercial = typeof key === 'string' &&
    (key.toLowerCase() === 'non-commercial-and-evaluation' || key.toLowerCase() === 'ht68e-1f2b7-47158-70b05-0842f');

  if (isNonCommercial) {
    return _nonTypedLifecycle('non_commercial');
  }
  if (isEmpty(key)) {
    return _nonTypedLifecycle('missing');
  }

  const normalizedKey = _norm(key || '') as string;

  if (!_checkKeySchema(normalizedKey)) {
    return _nonTypedLifecycle('invalid');
  }

  // `||`, not `??`: a caller resolving the build constant in a broken way passes '' (not
  // undefined), and the empty string must still fall back to the build-time value.
  const resolvedReleaseDate = releaseDate || process.env.HOT_RELEASE_DATE || '';
  const [dd, mm, yyyy] = resolvedReleaseDate.split('/').map(Number);
  const releaseDays = Math.floor(Date.UTC(yyyy, mm - 1, dd) / 8.64e7);
  const keyValidityDays = _extractTime(normalizedKey);

  if (releaseDays > keyValidityDays) {
    return _nonTypedLifecycle('legacy_expired', (keyValidityDays + 1) * 8.64e7);
  }

  return _nonTypedLifecycle('legacy_valid');
}

/**
 * Resolves the full license state (lifecycle + grants) of a license key. This is
 * the single entry point shared by the console/DOM notification and the branding
 * UI, so the key is classified once. A non-typed or unreadable key resolves to
 * UNRESTRICTED grants on purpose: introducing add-on gating must never take a
 * feature away from an existing customer, and an invalid key nags - it does not
 * strip features.
 *
 * @param {string} [key] The license key from the grid settings.
 * @param {string} [releaseDate] The build release date ("dd/mm/yyyy").
 * @returns {LicenseStateDescriptor}
 */
export function _getLicenseState(key?: string, releaseDate?: string): LicenseStateDescriptor {
  // The `*.handsontable.com` bypass applies to the whole license state, not just
  // the console path. This is the single point that both consumers (the console/
  // DOM notification and the branding dialog) read, so honoring the bypass here
  // keeps them consistent - without it, the app-blocking hard-stop dialog would
  // render on Handsontable's own site.
  if (_ignored()) {
    return { lifecycle: _nonTypedLifecycle('legacy_valid'), grants: UNRESTRICTED_GRANTS };
  }

  if (typeof key !== 'string' || !hasTypedKeyTag(key)) {
    return { lifecycle: _classifyLegacyKey(key, releaseDate), grants: UNRESTRICTED_GRANTS };
  }

  const keyData = extractTypedKeyData(key);

  if (keyData === null) {
    return { lifecycle: _nonTypedLifecycle('invalid'), grants: UNRESTRICTED_GRANTS };
  }

  // `||`, not `??`: a caller resolving the build constant in a broken way passes '' (not
  // undefined), and the empty string must still fall back to the build-time value.
  const resolvedReleaseDate = releaseDate || process.env.HOT_RELEASE_DATE || '';
  const lifecycle = classifyTypedKeyState(keyData, {
    now: Date.now(),
    buildTimestamp: _releaseDateToTimestamp(resolvedReleaseDate),
  });

  // A checksum-valid key that grants no Handsontable license (for example an
  // HyperFormula-only key) is not a valid Handsontable license, so it messages
  // as invalid. Its grants stay UNRESTRICTED though - this null-from-classify
  // case must NOT fall through to `getLicenseGrants(keyData)`, or an invalid key
  // would wrongly report Handsontable as not-granted (the opposite of the
  // single-API guarantee that invalid keys unlock everything).
  if (lifecycle === null) {
    return { lifecycle: _nonTypedLifecycle('invalid'), grants: UNRESTRICTED_GRANTS };
  }

  return { lifecycle, grants: getLicenseGrants(keyData) };
}

/**
 * Emits the console and DOM notifications for a typed license key. The console
 * message fires at most once per page (the shared `_notified` flag) and picks
 * warn/error by state; the DOM bottom bar is shown only for the soft-stopped
 * trial and the lapsed perpetual license. The `*.handsontable.com` bypass forces
 * a silent, valid state, exactly like the legacy path.
 *
 * @param {object} params The notification parameters.
 * @param {string} [params.className] The notification element class name.
 * @param {string} [params.key] The typed license key.
 * @param {HTMLElement} [params.element] The container to append the bar into.
 * @param {string} [params.releaseDate] The build release date ("dd/mm/yyyy").
 * @returns {HTMLElement|null} The appended bar element, or `null` when none is shown.
 */
function _injectTypedProductInfo(
  { className, key, element, releaseDate }: {
    className?: string;
    key?: string;
    element?: HTMLElement;
    releaseDate?: string;
  }
): HTMLElement | null {
  if (_ignored()) {
    return null;
  }

  const { lifecycle } = _getLicenseState(key, releaseDate);
  const { state } = lifecycle;
  const hotVersion = process.env.HOT_VERSION;
  const expiryDate = lifecycle.expiryTimestamp === null ? undefined : _formatUtcDate(lifecycle.expiryTimestamp);
  const hardStopDate = lifecycle.hardStopTimestamp === null ? undefined : _formatUtcDate(lifecycle.hardStopTimestamp);

  if (!_notified) {
    let consoleMessage = '';
    let consoleMethod: 'warn' | 'error' = 'warn';

    if (state === 'invalid') {
      consoleMessage = consoleMessages.invalid({});
    } else if (state === 'perp_expired') {
      consoleMessage = consoleMessages.expired({ keyValidityDate: expiryDate, hotVersion });
    } else if (Object.prototype.hasOwnProperty.call(typedConsoleNotifications, state)) {
      const notification = typedConsoleNotifications[state];

      consoleMessage = notification.message({ daysRemaining: lifecycle.daysRemaining, expiryDate, hardStopDate });
      consoleMethod = notification.severity;
    }

    if (consoleMessage) {
      (consoleMethod === 'error' ? error : warn)(consoleMessage);
      _notified = true;
    }
  }

  let domMessage = '';

  if (state === 'trial_expired') {
    domMessage = typedDomMessages.trial_expired({});
  } else if (state === 'perp_expired') {
    domMessage = domMessages.expired({ keyValidityDate: expiryDate, hotVersion });
  } else if (state === 'invalid') {
    // An unreadable typed key renders the legacy invalid bar, keeping the
    // "console once, DOM on every instance" invariant the legacy path has.
    domMessage = domMessages.invalid({});
  }

  if (!domMessage || !element) {
    return null;
  }

  // Use the target element's own document so an iframe-hosted grid builds its bar nodes in the
  // right realm (the global `document` would be the loading window's).
  const ownerDocument = element.ownerDocument;
  const messageNode = ownerDocument.createElement('div');
  const innerNode = ownerDocument.createElement('div');

  messageNode.className = `handsontable ${className}`;
  innerNode.className = `${className}_inner`;
  innerNode.innerHTML = domMessage;

  messageNode.appendChild(innerNode);
  element.appendChild(messageNode);

  return messageNode;
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
