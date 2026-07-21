import type { TypedKeyData, TypedKeyType, LicenseLifecycle, LicenseState } from './types';
import { getProductPayload } from './extractKeyData';
import { parseIsoDateToTimestamp } from './encoding';
import {
  HANDSONTABLE_PRODUCT,
  DEFAULT_GRACE_DAYS,
  SUBSCRIPTION_ENDING_SOON_DAYS,
  MILLISECONDS_PER_DAY,
} from './constants';

/**
 * The time references a typed license is classified against. `now` drives the
 * trial and subscription states (wall clock); `buildTimestamp` drives the
 * perpetual state (the build release date, so the check is static-vs-static and
 * airgap-safe).
 */
export interface LicenseTimeReference {
  now: number;
  buildTimestamp: number;
}

/**
 * The Handsontable license parameters pulled out of a verified payload before
 * classification: the expiry (`null` for a never-expiring freemium key) and the
 * grace period in days.
 */
interface HandsontableLicenseInput {
  expiryTimestamp: number | null;
  graceDays: number;
}

/**
 * Reads the Handsontable license parameters from a verified typed key. Returns
 * `null` when the key does not grant Handsontable - such a key is not a valid
 * Handsontable license and is handled as invalid upstream, not classified here.
 *
 * @param {TypedKeyData} keyData The verified typed key data.
 * @returns {HandsontableLicenseInput|null}
 */
function readHandsontableLicense(keyData: TypedKeyData): HandsontableLicenseInput | null {
  const product = getProductPayload(keyData.payload, HANDSONTABLE_PRODUCT);

  if (product === null) {
    return null;
  }

  const expiryTimestamp = product.exp === undefined ? null : parseIsoDateToTimestamp(`${product.exp}`);

  // A hard-stop key carries its grace in the payload; the default only guards a
  // verified payload that somehow omits it.
  const graceDays = typeof product.grace === 'number'
    ? product.grace
    : (DEFAULT_GRACE_DAYS[keyData.keyType] ?? 0);

  return { expiryTimestamp, graceDays };
}

/**
 * Whole days from `now` until `expiry`, rounded up. A gap of a few hours still
 * counts as one day left, which matches the "expires in N days" wording.
 *
 * @param {number} expiryTimestamp The expiry time in epoch milliseconds.
 * @param {number} now The current time in epoch milliseconds.
 * @returns {number}
 */
function daysUntil(expiryTimestamp: number, now: number): number {
  return Math.ceil((expiryTimestamp - now) / MILLISECONDS_PER_DAY);
}

/**
 * Classifies a trial license into its active / soft-stop / hard-stop state.
 *
 * @param {number} expiryTimestamp The trial expiry in epoch milliseconds.
 * @param {number} hardStopTimestamp The hard-stop time in epoch milliseconds.
 * @param {number} now The current time in epoch milliseconds.
 * @returns {LicenseState}
 */
function classifyTrial(expiryTimestamp: number, hardStopTimestamp: number, now: number): LicenseState {
  if (now < expiryTimestamp) {
    return 'trial_active';
  }

  return now < hardStopTimestamp ? 'trial_expired' : 'trial_expired_hard';
}

/**
 * Classifies a subscription license into its active / ending-soon / expired /
 * hard-stop state.
 *
 * @param {number} expiryTimestamp The subscription expiry in epoch milliseconds.
 * @param {number} hardStopTimestamp The hard-stop time in epoch milliseconds.
 * @param {number} now The current time in epoch milliseconds.
 * @returns {LicenseState}
 */
function classifySubscription(expiryTimestamp: number, hardStopTimestamp: number, now: number): LicenseState {
  if (now < expiryTimestamp) {
    return daysUntil(expiryTimestamp, now) > SUBSCRIPTION_ENDING_SOON_DAYS ? 'sub_active' : 'sub_ending';
  }

  return now < hardStopTimestamp ? 'sub_expired' : 'sub_expired_hard';
}

/**
 * Builds the lifecycle facet for a hard-stop key type (trial or subscription).
 *
 * @param {TypedKeyType} keyType The key type.
 * @param {HandsontableLicenseInput} input The Handsontable license parameters.
 * @param {number} now The current time in epoch milliseconds.
 * @returns {LicenseLifecycle|null}
 */
function classifyHardStop(
  keyType: TypedKeyType,
  input: HandsontableLicenseInput,
  now: number,
): LicenseLifecycle | null {
  if (input.expiryTimestamp === null) {
    return null;
  }

  const { expiryTimestamp } = input;
  const hardStopTimestamp = expiryTimestamp + (input.graceDays * MILLISECONDS_PER_DAY);
  const state = keyType === 'trial'
    ? classifyTrial(expiryTimestamp, hardStopTimestamp, now)
    : classifySubscription(expiryTimestamp, hardStopTimestamp, now);

  return {
    state,
    keyType,
    daysRemaining: daysUntil(expiryTimestamp, now),
    expiryTimestamp,
    hardStopTimestamp,
  };
}

/**
 * Classifies a verified typed license key into its lifecycle facet: the
 * time-based state plus the raw days-left and timestamps the messaging layer
 * formats. Trial and subscription keys are measured against `now`; a perpetual
 * key against the build release date; a freemium key never expires. Returns
 * `null` when the key does not grant Handsontable or carries an expiry it
 * needs but does not have - both are handled as invalid upstream.
 *
 * @param {TypedKeyData} keyData The verified typed key data.
 * @param {LicenseTimeReference} time The time references to classify against.
 * @returns {LicenseLifecycle|null}
 */
export function classifyTypedKeyState(
  keyData: TypedKeyData,
  time: LicenseTimeReference,
): LicenseLifecycle | null {
  const input = readHandsontableLicense(keyData);

  if (input === null) {
    return null;
  }

  const { keyType } = keyData;

  if (keyType === 'freemium') {
    return {
      state: 'freemium',
      keyType,
      daysRemaining: null,
      expiryTimestamp: null,
      hardStopTimestamp: null,
    };
  }

  if (keyType === 'perpetual') {
    if (input.expiryTimestamp === null) {
      return null;
    }

    // Fail OPEN when the build date is unavailable (`NaN` - a bundler consuming the source without
    // the build-time define step, a broken build): every comparison against NaN is false, so
    // without this guard a VALID perpetual key would classify as expired. The legacy path in the
    // same broken environment stays valid, and a paying customer must never see "expired" because
    // of a build defect.
    const maintenanceCovered = Number.isNaN(time.buildTimestamp) ||
      time.buildTimestamp <= input.expiryTimestamp;

    return {
      state: maintenanceCovered ? 'perp_valid' : 'perp_expired',
      keyType,
      daysRemaining: null,
      expiryTimestamp: input.expiryTimestamp,
      hardStopTimestamp: null,
    };
  }

  return classifyHardStop(keyType, input, time.now);
}
