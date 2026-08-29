/**
 * The license key formats a Handsontable build can be handed. Only
 * "entitlement" is read by this module; every other format is routed to the
 * legacy path.
 */
export type LicenseKeyFormat =
  | 'entitlement'
  | 'legacy'
  | 'non-commercial-and-evaluation'
  | 'unknown';

/**
 * What one product entry of a verified key grants. Exactly one of
 * `usage_until` / `release_until` is present - the pair replaces the contract
 * type, which the payload does not carry. `notice` and `grace` are the warning
 * and soft-stop windows, in days, and arrive in the key rather than living in
 * the library. Unknown extra fields survive verification untouched, so a field
 * added to the format later stays visible to the layers above.
 */
export interface ProductEntitlement {
  capabilities: string[];
  usage_until?: string;
  release_until?: string;
  notice: number;
  grace: number;
  flags: string[];
  [field: string]: unknown;
}

/**
 * The machine-readable data of a verified entitlement license key: what it
 * grants, keyed by product name. Presence means licensed. A product this build
 * does not know is kept and ignored - one install can be licensed for one
 * product and not for another, and the unknown one must not take down the
 * known ones.
 */
export interface EntitlementKeyData {
  products: { [productName: string]: ProductEntitlement };
}

/**
 * The lifecycle state of a license, derived from the governing date of the
 * product entry:
 *
 *   - `usage_until` runs the notice -> soft stop -> hard stop windows against
 *     the current UTC instant. The `trial_*` states are the same windows on a
 *     key carrying the `trial` flag - they differ in what the user is told and
 *     shown, not in how they are measured.
 *   - `release_until` compares the build release date against the maintenance
 *     date as text. No clock takes part, so the verdict never changes.
 */
export type LicenseState =
  | 'usage_valid'
  | 'usage_notice'
  | 'usage_soft_stop'
  | 'usage_hard_stop'
  | 'trial_valid'
  | 'trial_notice'
  | 'trial_soft_stop'
  | 'trial_hard_stop'
  | 'release_valid'
  | 'release_expired';

/**
 * The lifecycle facet of a license: the state, whether the key is a trial, the
 * whole UTC days left until the last licensed day (`null` when no clock is
 * involved), and the governing date as the bare "YYYY-MM-DD" string the
 * payload carries. The date is never re-derived from a timestamp - the string
 * in the key is what the messages print.
 */
export interface LicenseLifecycle {
  state: LicenseState;
  isTrial: boolean;
  daysRemaining: number | null;
  licensedUntil: string | null;
}

/**
 * Which notification channels the license leaves open. A product entry may
 * carry `no-console-warns` (nothing reaches the console) and `no-ui-warns`
 * (nothing is rendered on top of the grid); both are the default for a key
 * issued for external, end-user-facing use.
 */
export interface LicenseChannels {
  console: boolean;
  ui: boolean;
}

/**
 * What a license unlocks. `unrestricted` is the legacy-and-fallback shortcut -
 * every query answers "granted" for it, so the same API serves legacy keys
 * (unlock everything) and entitlement keys (unlock exactly the tokens the
 * payload lists) without the caller branching on the key family.
 */
export interface LicenseGrants {
  unrestricted: boolean;
  products: { [productName: string]: { capabilities: string[] } };
}
