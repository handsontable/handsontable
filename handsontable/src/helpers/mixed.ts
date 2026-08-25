import { toSingleLine } from './templateLiteralTag';
import {
  isEntitlementKey,
  extractEntitlementKeyData,
  getProductEntitlement,
  classifyEntitlement,
  resolveChannels,
  getLicenseGrants,
  UNRESTRICTED_GRANTS,
  HANDSONTABLE_PRODUCT,
} from '../utils/entitlementLicenseKey';
import type { LicenseLifecycle, LicenseGrants, LicenseChannels } from '../utils/entitlementLicenseKey';

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
// The entitlement-key console message is deduplicated PER KEY, and deliberately SEPARATE from the
// legacy `_notified` flag above - do NOT merge them. Two reasons for each half:
//
// Separate from `_notified`, because the frozen legacy path sets it even when it prints nothing (a
// non-commercial key's console message is empty), so a shared flag would let a silent non-commercial
// grid initialized first suppress a later entitlement key's warning.
//
// Keyed by the key string rather than a single boolean, because these messages have severity tiers
// the legacy path never had: a notice window prints `warn`, every stop prints `error`. With one flag,
// a page whose first grid holds a trial in its notice period would print that warning and silence the
// expired license on the second grid entirely - a `warn` masking an `error`. Per key, each distinct
// license still speaks exactly once, and two grids sharing one key still print once between them.
const _entitlementNotified = new Set<string>();

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

/**
 * One piece of a license bar message: a run of text, or a link.
 *
 * The messages used to be HTML strings assigned to `innerHTML`. That is a Trusted Types sink, so
 * a page enforcing `require-trusted-types-for 'script'` threw while rendering the bar. Describing
 * the message as parts and building the nodes touches no sink, and keeps the copy - which is
 * transcribed from the license specification - in exactly one place.
 */
type MessagePart = string | { text: string; href: string; target?: string };

/**
 * Renders license bar message parts into an element.
 *
 * @param {HTMLElement} target The element to fill.
 * @param {Array} parts The message parts.
 * @param {Document} ownerDocument The document to build the nodes in.
 */
function _renderMessageParts(target: HTMLElement, parts: MessagePart[], ownerDocument: Document) {
  parts.forEach((part) => {
    if (typeof part === 'string') {
      target.appendChild(ownerDocument.createTextNode(part));

      return;
    }

    const anchorElement = ownerDocument.createElement('a');

    anchorElement.setAttribute('href', part.href);

    if (part.target) {
      anchorElement.setAttribute('target', part.target);
    }

    anchorElement.textContent = part.text;
    target.appendChild(anchorElement);
  });
}

const domMessages: Record<string, (params: { keyValidityDate?: string; hotVersion?: string }) => MessagePart[]> = {
  invalid: () => [
    'The license key for Handsontable is invalid. ',
    { text: 'Read more', href: 'https://handsontable.com/docs/tutorial-license-key.html', target: '_blank' },
    ' on how to install it properly or contact us at ',
    { text: 'support@handsontable.com', href: 'mailto:support@handsontable.com' },
    '.',
  ],
  expired: ({ keyValidityDate, hotVersion }: { keyValidityDate?: string; hotVersion?: string }) => [
    `The license key for Handsontable expired on ${keyValidityDate}, and is not valid for the installed ` +
      `version ${hotVersion}. `,
    { text: 'Renew', href: 'https://handsontable.com/pricing', target: '_blank' },
    ` your license key or downgrade to a version released prior to ${keyValidityDate}. If you need any ` +
      'help, contact us at ',
    { text: 'sales@handsontable.com', href: 'mailto:sales@handsontable.com' },
    '.',
  ],
  missing: () => [
    'The license key for Handsontable is missing. Use your purchased key to activate the product. ' +
      'Alternatively, you can activate Handsontable to use for non-commercial purposes by ' +
      'passing the key: \'non-commercial-and-evaluation\'. ',
    { text: 'Read more', href: 'https://handsontable.com/docs/tutorial-license-key.html', target: '_blank' },
    ' about it in the documentation or contact us at ',
    { text: 'support@handsontable.com', href: 'mailto:support@handsontable.com' },
    '.',
  ],
  non_commercial: () => [],
};

/**
 * The parameters an entitlement-key message fills its placeholders with: the
 * whole days left until the last licensed day, the governing date exactly as
 * the key carries it (a bare "YYYY-MM-DD" string), and the installed version.
 */
type EntitlementMessageParams = {
  daysRemaining?: number | null;
  licensedUntil?: string;
  hotVersion?: string;
};

/**
 * Builds the "expires ..." clause of a trial message from a day count. Shared with the badge
 * popover (`utils/licenseBranding/content.ts`), which prints the same sentence.
 *
 * Two counts need their own wording. `1` takes the singular unit, so the message does not read
 * "expires in 1 days". `0` is the LAST LICENSED DAY - the named day is licensed in full - and it
 * reads "expires today", because "expires in 0 days" describes a license that has already lapsed.
 * The specification pins the wording for the general case only; the two edges are ours.
 *
 * @param {number|null|undefined} days The whole days left until the last licensed day.
 * @returns {string}
 */
export function _formatExpiryClause(days: number | null | undefined): string {
  if (days === 0) {
    return 'expires today';
  }

  return `expires in ${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * Marks a date as the UTC calendar day it is. Every message that prints a
 * `usage_until` date carries the marker, because the day is compared against
 * the clock in UTC and a reader in another timezone would otherwise read it as
 * their own. A `release_until` date carries no marker - no clock takes part in
 * the maintenance check.
 *
 * @param {string|undefined} isoDate The date the key carries.
 * @returns {string}
 */
function _utcDay(isoDate: string | undefined): string {
  return `${isoDate} (UTC)`;
}

/**
 * One console notification for an entitlement-license state: its severity and
 * the copy builder. Kept as a single record (not parallel severity/message
 * maps) so a new state cannot be added to one without the other - a
 * `console[undefined](...)` at init is impossible. Severity is a warning while
 * the license still works and an error once it has stopped.
 */
type EntitlementConsoleNotification = {
  severity: 'warn' | 'error';
  message: (params: EntitlementMessageParams) => string;
};

/**
 * License sentences the specification repeats verbatim across surfaces - the bottom bar (here), the
 * badge popover, and the hard-stop lock screen (`utils/licenseBranding/content.ts`). Keeping one
 * constant per sentence means a legal or marketing wording change lands on every surface at once,
 * instead of drifting when only one copy is updated.
 */
export const _LICENSE_EXPIRED_TITLE = 'Your Handsontable license key has expired.';
export const _PURCHASE_LICENSE_TEXT = 'To continue using Handsontable, you need to purchase a license.';

/**
 * The message a lapsed subscription prints, from its first day past the term onwards.
 *
 * @param {EntitlementMessageParams} params The message parameters.
 * @returns {string}
 */
function _subscriptionExpiredMessage({ licensedUntil }: EntitlementMessageParams): string {
  return toSingleLine`
    Your Handsontable subscription license expired on ${_utcDay(licensedUntil)}. To continue using the\x20
    software, contact sales@handsontable.com to purchase a valid license key.`;
}

/**
 * The console notification for each lifecycle state that talks to the
 * developer, transcribed from the license specification. Silent states (a
 * license comfortably inside its term, a build covered by its maintenance date)
 * have no entry, and neither does a hard-stopped non-trial license: its
 * soft-stop message persists instead.
 */
const entitlementConsoleNotifications: Partial<Record<LicenseStateKey, EntitlementConsoleNotification>> = {
  trial_notice: {
    severity: 'warn',
    message: ({ daysRemaining }) => toSingleLine`
      Your Handsontable license key ${_formatExpiryClause(daysRemaining)}.\x20
      ${_PURCHASE_LICENSE_TEXT}`,
  },
  trial_soft_stop: {
    severity: 'error',
    message: ({ licensedUntil }) => toSingleLine`
      Your Handsontable trial license key expired on ${_utcDay(licensedUntil)}.\x20
      ${_PURCHASE_LICENSE_TEXT}`,
  },
  trial_hard_stop: {
    severity: 'error',
    message: ({ licensedUntil }) => toSingleLine`
      Your Handsontable trial license key expired on ${_utcDay(licensedUntil)}. You may no longer use\x20
      Handsontable under the trial license. To continue using the software, contact\x20
      sales@handsontable.com to purchase a valid license.`,
  },
  usage_notice: {
    severity: 'warn',
    message: ({ licensedUntil }) => toSingleLine`
      Your Handsontable subscription license expires on ${_utcDay(licensedUntil)}.\x20
      To renew your license, contact sales@handsontable.com.`,
  },
  usage_soft_stop: {
    severity: 'error',
    message: _subscriptionExpiredMessage,
  },
  // Past its grace period, a non-trial license keeps saying exactly what it said inside it: 18.1
  // never blocks a paying customer, so the soft-stop message persists instead of escalating.
  usage_hard_stop: {
    severity: 'error',
    message: _subscriptionExpiredMessage,
  },
  release_expired: {
    severity: 'error',
    message: ({ licensedUntil, hotVersion }) => toSingleLine`
      The license key for Handsontable expired on ${licensedUntil}, and is not valid for the installed\x20
      version ${hotVersion}. Renew your license key or downgrade to a version released on or before\x20
      ${licensedUntil}. If you need any help, contact us at sales@handsontable.com.`,
  },
};

/**
 * The bottom-bar (DOM) copy for the states that show one: the soft-stopped
 * trial and a build past its maintenance date. Three states render the
 * Core-owned lock screen instead of a bar (see `_BLOCKING_MODAL_STATES` below
 * and `utils/licenseBranding/lockScreen.ts`), and a non-trial license never
 * renders a bar - it is developer-facing only in 18.1.
 */
const entitlementDomMessages:
Partial<Record<LicenseStateKey, (params: EntitlementMessageParams) => MessagePart[]>> = {
  trial_soft_stop: () => [
    `${_LICENSE_EXPIRED_TITLE} ${_PURCHASE_LICENSE_TEXT} `,
    { text: 'Contact Sales', href: 'mailto:sales@handsontable.com' },
    '.',
  ],
  release_expired: ({ licensedUntil, hotVersion }) => [
    `The license key for Handsontable expired on ${licensedUntil}, and is not valid for the installed ` +
      `version ${hotVersion}. `,
    { text: 'Renew', href: 'https://handsontable.com/pricing', target: '_blank' },
    ` your license key or downgrade to a version released on or before ${licensedUntil}. ` +
      'If you need any help, contact us at ',
    { text: 'sales@handsontable.com', href: 'mailto:sales@handsontable.com' },
    '.',
  ],
};

/**
 * The states that render the Core-owned blocking modal (`utils/licenseBranding/lockScreen.ts`)
 * INSTEAD of a bottom bar: a lapsed trial, a key that cannot be read, and a key that was never set.
 * The last two spellings are shared by the legacy emitter's own state vocabulary below and by
 * `LicenseStateKey`, so one list governs both paths.
 *
 * MUST list every key of `LOCK_CONTENT` (`utils/licenseBranding/content.ts`), the routing table for
 * the modal - `licenseBranding.unit.js` asserts the two agree. `trial_hard_stop` shows no bar today
 * only because `entitlementDomMessages` happens to have no entry for it; naming it here makes the
 * withdrawal deliberate, so adding hard-stop bar copy later cannot put a bar underneath a
 * non-dismissable lock. The list is NOT imported from `content.ts`: that module imports the shared
 * copy constants from here, and the dependency must not become a cycle.
 *
 * The console message is unaffected - it still prints for these states. Only the bottom bar is
 * withdrawn, because the modal now carries its sentences and two license surfaces saying the same
 * thing at once would be noise.
 *
 * Frozen, and underscore-prefixed like every other license symbol here: `index.ts` copies every
 * non-underscore export of this module onto the public `Handsontable.helper`, and a live array
 * there could be emptied from a console to switch the blocking off at runtime.
 *
 * @type {readonly string[]}
 */
export const _BLOCKING_MODAL_STATES = Object.freeze(['trial_hard_stop', 'invalid', 'missing']);

/**
 * Tells whether a license state speaks through the blocking modal rather than the bottom bar.
 *
 * @param {string} state The license state, in either path's vocabulary.
 * @returns {boolean}
 */
function _rendersBlockingModal(state: string): boolean {
  return _BLOCKING_MODAL_STATES.indexOf(state) !== -1;
}

/**
 * Strips surrounding whitespace from a license key.
 *
 * A key pasted out of an email or a chat window commonly carries a trailing space or newline. The
 * legacy 25-character alphabet has no whitespace in it, so an untrimmed key fails the checksum and
 * reads as `invalid` - which, from 18.1 on, BLOCKS the grid. A paying customer must not be locked
 * out by a stray space.
 *
 * Applied at the head of BOTH license entry points (`_injectProductInfo` and `_getLicenseState`),
 * never inside either one: the classifier's whole contract is that it reaches the same verdict as
 * the frozen emitter, so trimming for one and not the other would desync them (the emitter would
 * say `invalid` and withhold the bar while the classifier said `legacy_valid` and withheld the lock,
 * leaving the key silently unreported). The frozen interior of the emitter is untouched - this
 * normalizes its input, exactly like the entitlement reader's own `trim()` in `detectFormat.ts`.
 *
 * @param {string} [key] The license key from the grid settings.
 * @returns {string|undefined} The key without surrounding whitespace.
 */
function _trimKey(key?: string): string | undefined {
  return typeof key === 'string' ? key.trim() : key;
}

export function _injectProductInfo(
  { className, key, element, releaseDate }: {
    className?: string;
    key?: string;
    element?: HTMLElement;
    releaseDate?: string;
  }
): HTMLElement | null {
  // Reassigning the parameter, exactly as the frozen body below does with `_norm`: the legacy branch
  // needs `key` to stay one mutable binding.
  key = _trimKey(key);

  // An entitlement key is routed to its own path BEFORE any legacy normalization runs. The legacy
  // branch below is left exactly as-is, so every existing key keeps behaving the same. The shape
  // test is two string scans, so a legacy key pays almost nothing for it.
  if (isEntitlementKey(key)) {
    return _injectEntitlementProductInfo({ className, key, element, releaseDate });
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

  if (domMessageState !== 'valid' && !_rendersBlockingModal(domMessageState) && element) {
    const message = domMessages[domMessageState]({
      keyValidityDate,
      hotVersion,
    });

    if (message.length > 0) {
      const ownerDocument = element.ownerDocument;
      const messageNode = ownerDocument.createElement('div');
      const innerNode = ownerDocument.createElement('div');

      messageNode.className = `handsontable ${className}`;
      innerNode.className = `${className}_inner`;
      _renderMessageParts(innerNode, message, ownerDocument);

      messageNode.appendChild(innerNode);
      element.appendChild(messageNode);

      return messageNode;
    }
  }

  return null;
}
/* eslint-enable dot-notation, no-useless-escape, max-len, no-bitwise, computed-property-spacing, jsdoc/require-jsdoc, no-restricted-globals, no-console, prefer-const, no-unused-expressions, no-plusplus, space-infix-ops, comma-spacing, no-nested-ternary */
// ^ Everything ABOVE this line is the frozen legacy path, which needs those exemptions. Everything
// BELOW is ordinary new code and is linted normally - most importantly `no-restricted-globals`, so a
// bare `document` in the entitlement DOM builder is an error rather than a silent regression.

/**
 * Formats an epoch-millisecond timestamp as the bare "YYYY-MM-DD" UTC calendar date every license
 * message prints. An entitlement key carries its dates as such strings already - this is only used
 * for the one date the legacy path derives from a timestamp.
 *
 * @param {number} timestamp The time to format, in epoch milliseconds.
 * @returns {string}
 */
export function _formatIsoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Converts the build release date ("dd/mm/yyyy", as injected at build time) into the bare
 * "YYYY-MM-DD" string a `release_until` date is compared against. The comparison is text against
 * text - no clock takes part, so it holds on an airgapped machine and cannot differ between two
 * timezones. Returns '' when the build date is unavailable, which the classification reads as
 * "unknown" and fails open on.
 *
 * @param {string} releaseDate The build release date in "dd/mm/yyyy".
 * @returns {string}
 */
function _releaseDateToIsoDate(releaseDate: string): string {
  const [dd, mm, yyyy] = `${releaseDate}`.split('/');

  if (!dd || !mm || !yyyy) {
    return '';
  }

  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/**
 * The states outside the entitlement format: the legacy 25-character family classified the same way
 * the frozen legacy emitter classifies it (valid, expired, missing, non-commercial), plus "invalid"
 * (a broken legacy key, or an entitlement key that cannot be read).
 */
type NonEntitlementLifecycleState = 'legacy_valid' | 'legacy_expired' | 'missing' | 'non_commercial' | 'invalid';

/**
 * The lifecycle facet a consumer reads: the entitlement states plus the states outside the format.
 * The entitlement-only fields fall back to `false`/`null` for the latter (except `licensedUntil`,
 * which a legacy-expired key carries too), so a caller can read `.state` uniformly.
 */
export interface LicenseLifecycleFacet {
  state: LicenseLifecycle['state'] | NonEntitlementLifecycleState;
  isTrial: boolean;
  daysRemaining: number | null;
  licensedUntil: string | null;
}

/**
 * Every lifecycle state a state-keyed table can hold an entry for. The console/DOM notification
 * tables here and the badge/lock content tables in `utils/licenseBranding/content.ts` are keyed by
 * this union rather than `string`, so the compiler rejects a typoed or unknown state key - a
 * `string` key would compile fine and silently drop that state's entry.
 */
export type LicenseStateKey = LicenseLifecycleFacet['state'];

/**
 * The resolved license state handed to the UI and (later) the feature gates: the lifecycle facet
 * (what the license IS right now), the channels it leaves open (where it may say so), and the
 * grants facet (what it UNLOCKS). `grants` is never null - the same query API serves legacy keys
 * (unlock everything) and entitlement keys (unlock what the payload lists).
 */
export interface LicenseStateDescriptor {
  lifecycle: LicenseLifecycleFacet;
  channels: LicenseChannels;
  grants: LicenseGrants;
}

/**
 * Both notification channels open - what every key outside the entitlement format gets, since only
 * an entitlement key can carry the flags that close one.
 *
 * @type {LicenseChannels}
 */
const OPEN_CHANNELS: LicenseChannels = Object.freeze({ console: true, ui: true });

/**
 * Builds the lifecycle facet for a state outside the entitlement format (the legacy 25-character
 * family, a missing key, the non-commercial key, or an unreadable entitlement key).
 *
 * @param {string} state The state outside the entitlement format.
 * @param {string|null} [licensedUntil] The expiration date ("YYYY-MM-DD") of a legacy expired key.
 * @returns {LicenseLifecycleFacet}
 */
function _nonEntitlementLifecycle(
  state: NonEntitlementLifecycleState,
  licensedUntil: string | null = null,
): LicenseLifecycleFacet {
  return {
    state,
    isTrial: false,
    daysRemaining: null,
    licensedUntil,
  };
}

/**
 * Classifies a legacy license key into its lifecycle state. This mirrors - read-only - the exact
 * checks of the frozen legacy branch of `_injectProductInfo` (the non-commercial comparison, the
 * empty-key test, the key schema checksum, and the release-days versus validity-days comparison),
 * so the branding UI sees the same state the legacy console/DOM messaging acts on. The legacy
 * emitter itself is untouched.
 *
 * @param {string} [key] The license key from the grid settings.
 * @param {string} [releaseDate] The build release date ("dd/mm/yyyy").
 * @returns {LicenseLifecycleFacet}
 */
function _classifyLegacyKey(key?: string, releaseDate?: string): LicenseLifecycleFacet {
  const isNonCommercial = typeof key === 'string' &&
    (key.toLowerCase() === 'non-commercial-and-evaluation' || key.toLowerCase() === 'ht68e-1f2b7-47158-70b05-0842f');

  if (isNonCommercial) {
    return _nonEntitlementLifecycle('non_commercial');
  }
  if (isEmpty(key)) {
    return _nonEntitlementLifecycle('missing');
  }

  const normalizedKey = _norm(key || '') as string;

  if (!_checkKeySchema(normalizedKey)) {
    return _nonEntitlementLifecycle('invalid');
  }

  // `??`, exactly as the frozen emitter above resolves it - reaching the same verdict it does is
  // this function's whole contract. With `||`, an explicitly empty `releaseDate` would fall through
  // to the build-time value here while the emitter keeps the empty string, and the two would
  // disagree about one key: the emitter reads no date at all (so the key is valid) while this reads
  // the build date (so the key may be expired).
  const resolvedReleaseDate = releaseDate ?? process.env.HOT_RELEASE_DATE ?? '';
  const [dd, mm, yyyy] = resolvedReleaseDate.split('/').map(Number);
  const releaseDays = Math.floor(Date.UTC(yyyy, mm - 1, dd) / 8.64e7);
  const keyValidityDays = _extractTime(normalizedKey);

  if (releaseDays > keyValidityDays) {
    return _nonEntitlementLifecycle('legacy_expired', _formatIsoDate((keyValidityDays + 1) * 8.64e7));
  }

  return _nonEntitlementLifecycle('legacy_valid');
}

/**
 * Resolves the full license state (lifecycle + channels + grants) of a license key. This is the
 * single entry point shared by the console/DOM notification and the branding UI, so the key is
 * classified once. A key outside the entitlement format, and an unreadable one, resolve to
 * UNRESTRICTED grants on purpose: introducing capability gating must never take a feature away from
 * an existing customer, and an invalid key nags - it does not strip features.
 *
 * @param {string} [rawKey] The license key from the grid settings, trimmed here before any classification.
 * @param {string} [releaseDate] The build release date ("dd/mm/yyyy").
 * @returns {LicenseStateDescriptor}
 */
export function _getLicenseState(rawKey?: string, releaseDate?: string): LicenseStateDescriptor {
  // The same trim the emitter applies, and for the same reason: this function must reach the emitter's
  // verdict, so both have to see the same key.
  const key = _trimKey(rawKey);

  // The `*.handsontable.com` bypass applies to the whole license state, not just the console path.
  // This is the single point that both consumers (the console/DOM notification and the branding UI)
  // read, so honoring the bypass here keeps them consistent - without it, the app-blocking hard-stop
  // lock would render on Handsontable's own site.
  if (_ignored()) {
    return {
      lifecycle: _nonEntitlementLifecycle('legacy_valid'),
      channels: OPEN_CHANNELS,
      grants: UNRESTRICTED_GRANTS,
    };
  }

  if (!isEntitlementKey(key)) {
    return {
      lifecycle: _classifyLegacyKey(key, releaseDate),
      channels: OPEN_CHANNELS,
      grants: UNRESTRICTED_GRANTS,
    };
  }

  const keyData = extractEntitlementKeyData(key as string);
  // A key that grants no Handsontable license - an HyperFormula-only key, for example - is not a
  // Handsontable license, so it messages as invalid. Another product's entry never invalidates the
  // key on its own: one install can be licensed for one product and not for another.
  const entitlement = keyData === null ? null : getProductEntitlement(keyData, HANDSONTABLE_PRODUCT);

  // The grants of an unreadable or foreign key stay UNRESTRICTED - this case must NOT fall through
  // to `getLicenseGrants`, or an invalid key would report Handsontable as not-granted, the opposite
  // of the guarantee that an invalid key unlocks everything.
  if (keyData === null || entitlement === null) {
    return {
      lifecycle: _nonEntitlementLifecycle('invalid'),
      channels: OPEN_CHANNELS,
      grants: UNRESTRICTED_GRANTS,
    };
  }

  // `||`, not `??`: a caller resolving the build constant in a broken way passes '' (not
  // undefined), and the empty string must still fall back to the build-time value.
  const resolvedReleaseDate = releaseDate || process.env.HOT_RELEASE_DATE || '';
  const lifecycle = classifyEntitlement(entitlement, {
    now: Date.now(),
    buildDate: _releaseDateToIsoDate(resolvedReleaseDate),
  });

  return {
    lifecycle,
    channels: resolveChannels(entitlement),
    grants: getLicenseGrants(keyData),
  };
}

/**
 * Emits the console and DOM notifications for an entitlement license key. The console message fires
 * at most once per page and per key (via the entitlement-only `_entitlementNotified` set, kept
 * separate from the legacy `_notified`) and picks warn/error by state; the DOM bottom bar is shown for the
 * soft-stopped trial and for a build past its maintenance date. A key carrying `no-console-warns` or
 * `no-ui-warns` keeps that channel shut, and the `*.handsontable.com` bypass silences both, exactly
 * like the legacy path.
 *
 * @param {object} params The notification parameters.
 * @param {string} [params.className] The notification element class name.
 * @param {string} [params.key] The entitlement license key.
 * @param {HTMLElement} [params.element] The container to append the bar into.
 * @param {string} [params.releaseDate] The build release date ("dd/mm/yyyy").
 * @returns {HTMLElement|null} The appended bar element, or `null` when none is shown.
 */
function _injectEntitlementProductInfo(
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

  const { lifecycle, channels } = _getLicenseState(key, releaseDate);
  const { state } = lifecycle;
  const params: EntitlementMessageParams = {
    daysRemaining: lifecycle.daysRemaining,
    licensedUntil: lifecycle.licensedUntil ?? undefined,
    hotVersion: process.env.HOT_VERSION,
  };

  if (channels.console && !_entitlementNotified.has(key ?? '')) {
    // An unreadable key reuses the frozen legacy copy - it is the same failure, and the
    // specification leaves the wording of the invalid-key message open.
    const notification = state === 'invalid'
      ? { severity: 'warn' as const, message: () => consoleMessages.invalid({}) }
      : entitlementConsoleNotifications[state];

    if (notification) {
      // The global `console`, not the `helpers/console` wrappers: importing them would put this
      // module - the leaf that `function`, `object`, `string` and `dateTime` all import - at the top
      // of a cycle (`console` imports `substitute` from `string`, and `string` imports from here).
      // The frozen legacy path prints the same way. Disabled per line, not per file - the blanket
      // exemptions end above, so everything else here is linted normally.
      // eslint-disable-next-line no-console, no-restricted-globals
      console[notification.severity](notification.message(params));
      _entitlementNotified.add(key ?? '');
    }
  }

  if (!channels.ui || !element || _rendersBlockingModal(state)) {
    return null;
  }

  const buildDomMessage = entitlementDomMessages[state];

  if (!buildDomMessage) {
    return null;
  }

  // Use the target element's own document so an iframe-hosted grid builds its bar nodes in the
  // right realm (the global `document` would be the loading window's).
  const ownerDocument = element.ownerDocument;
  const messageNode = ownerDocument.createElement('div');
  const innerNode = ownerDocument.createElement('div');

  messageNode.className = `handsontable ${className}`;
  innerNode.className = `${className}_inner`;
  _renderMessageParts(innerNode, buildDomMessage(params), ownerDocument);

  messageNode.appendChild(innerNode);
  element.appendChild(messageNode);

  return messageNode;
}

/* eslint-disable dot-notation, no-useless-escape, max-len, no-bitwise, computed-property-spacing, jsdoc/require-jsdoc, prefer-const, no-unused-expressions, no-plusplus, space-infix-ops, comma-spacing, no-nested-ternary */
// The last of the frozen legacy validation: the obfuscated 25-character key-schema checksum. It
// carries the same exemptions as the emitter at the top of the file, re-opened here so the ordinary
// code between the two is linted normally.
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
