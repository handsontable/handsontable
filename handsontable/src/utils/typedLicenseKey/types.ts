/**
 * The typed license key types Handsontable recognizes. Resolved from the type
 * tag that prefixes the key (`[TRIAL]`, `[FREE]`, `[SUB]`, `[PERP]`).
 */
export type TypedKeyType = 'trial' | 'freemium' | 'subscription' | 'perpetual';

/**
 * A single product entry inside a typed key payload. Every field is optional -
 * which fields are present depends on the key type and the product (only a
 * hard-stop key's licensed product carries `exp`/`grace`, only mode-aware
 * products carry `mode`, only add-on-capable products carry `addons`). The
 * reader treats unknown tier/mode/add-on strings leniently so an older build
 * still reads a newer key.
 */
export interface TypedKeyProductPayload {
  tier?: string;
  mode?: string;
  addons?: string[];
  exp?: string;
  grace?: number;
}

/**
 * The decoded, checksum-verified payload of a typed license key. It is the
 * single source of truth for what the key grants. `v` is the format version
 * stamped at generation.
 */
export interface TypedKeyPayload {
  v: number;
  holder?: string;
  iss?: string;
  ref?: string;
  products: { [productName: string]: TypedKeyProductPayload };
}

/**
 * The data extracted from a verified typed license key.
 */
export interface TypedKeyData {
  keyType: TypedKeyType;
  payload: TypedKeyPayload;
  expiryTimestamp: number | null;
}

/**
 * The lifecycle state of a typed license, derived from the key type and the
 * current time (trial, subscription) or the build release date (perpetual).
 */
export type LicenseState =
  | 'trial_active'
  | 'trial_expired'
  | 'trial_expired_hard'
  | 'freemium'
  | 'sub_active'
  | 'sub_ending'
  | 'sub_expired'
  | 'sub_expired_hard'
  | 'perp_valid'
  | 'perp_expired';

/**
 * The lifecycle facet of a typed license: the time-based state, the days left
 * until expiry (`null` when the notion does not apply), and the raw expiry and
 * hard-stop timestamps for the messaging layer to format.
 */
export interface LicenseLifecycle {
  state: LicenseState;
  keyType: TypedKeyType;
  daysRemaining: number | null;
  expiryTimestamp: number | null;
  hardStopTimestamp: number | null;
}

/**
 * What one product entitles the holder to, normalized from the payload.
 */
export interface ProductGrant {
  tier: string;
  mode: string;
  addons: string[];
}

/**
 * The entitlements facet of a license: what it unlocks. `unrestricted` is the
 * legacy-and-fallback shortcut - every query answers "granted" for it, so the
 * same grants API serves legacy keys (unlock everything) and typed keys (unlock
 * exactly what the payload lists) without the caller branching on key family.
 */
export interface LicenseGrants {
  unrestricted: boolean;
  products: { [productName: string]: ProductGrant };
}
