import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { keyWithTier } from './xlsxLicenseKeys';
import { buildTestKey } from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/buildTestKey';

/**
 * The license tiers of the build under test, read from `handsontable/dist/manifest.json` when a test
 * asks, never written here: which features a tier includes is decided where keys are issued and can
 * change at any time, so no spec may name a real tier or assume what it holds.
 */
interface ManifestCapability {
  id: string;
  kind: string;
  name: string;
  licensing: string;
  gate: string | null;
  tiers: string[];
}

/**
 * A sold plugin's license token as the manifest lists it, in the shape of the plugin's static `LICENSE`.
 */
export interface PluginLicenseEntry {
  capability: string;
  name: string;
  gate: string;
  tiers: string[];
}

interface Manifest {
  tiers: string[];
  capabilities: ManifestCapability[];
}

const MANIFEST_PATH = fileURLToPath(new URL('../../handsontable/dist/manifest.json', import.meta.url));

let manifest: Manifest | null = null;

/**
 * Reads the manifest of the build under test once, on first use, so a spec that never asks about tiers
 * loads without a build.
 *
 * @returns {Manifest}
 */
function readManifest(): Manifest {
  if (manifest === null) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;

    if (!Array.isArray(manifest.tiers)) {
      throw new Error(`${MANIFEST_PATH} has no top-level "tiers" list: rebuild the core.`);
    }
  }

  return manifest;
}

/**
 * Returns the tiers a feature lists in the manifest.
 *
 * @param {string} id The feature id, for example `'xlsx:styles'`.
 * @returns {string[]}
 */
function tiersOf(id: string): string[] {
  const capability = readManifest().capabilities.find(entry => entry.id === id);

  if (!capability) {
    throw new Error(`The manifest has no feature "${id}".`);
  }

  return capability.tiers;
}

/**
 * Every tier of the manifest, in its order.
 *
 * @returns {string[]}
 */
export function manifestTiers(): string[] {
  return [...readManifest().tiers];
}

/**
 * The tiers the manifest lists for a feature.
 *
 * @param {string} id The feature id, for example `'feat:filters'`.
 * @returns {string[]}
 */
export function featureTiers(id: string): string[] {
  return [...tiersOf(id)];
}

/**
 * Every plugin the manifest sells (`kind: 'plugin'`, `licensing: 'token'`), with the token, the display
 * name, the gate and the tiers its static `LICENSE` must carry in the built bundle.
 *
 * @returns {PluginLicenseEntry[]}
 */
export function soldPluginLicenses(): PluginLicenseEntry[] {
  return readManifest().capabilities
    .filter(entry => entry.kind === 'plugin' && entry.licensing === 'token')
    .map(entry => ({ capability: entry.id, name: entry.name, gate: entry.gate as string, tiers: [...entry.tiers] }));
}

/**
 * A perpetual key that names no tier and covers the builds released on or before `releaseUntil`. Whether
 * a build is past it is decided by the release date the build inlined, never by the clock.
 *
 * @param {string} releaseUntil The last covered release day, `YYYY-MM-DD`.
 * @returns {string}
 */
export function releaseKeyUntil(releaseUntil: string): string {
  return buildTestKey({
    products: {
      handsontable: {
        capabilities: ['core'],
        release_until: releaseUntil,
        notice: 60,
        grace: 90,
        flags: [],
      },
    },
  });
}

/**
 * The first tier of the manifest that lists every one of the features.
 *
 * @param {string[]} ids The feature ids.
 * @returns {string | null} The tier, or `null` when no tier lists them all.
 */
function tierWithEvery(ids: readonly string[]): string | null {
  return manifestTiers().find(tier => featuresMissingFrom(tier, ids).length === 0) ?? null;
}

/**
 * The features of `ids` a tier does not list, in the order of `ids`.
 *
 * @param {string} tier The tier.
 * @param {string[]} ids The feature ids.
 * @returns {string[]}
 */
export function featuresMissingFrom(tier: string, ids: readonly string[]): string[] {
  return ids.filter(id => !tiersOf(id).includes(tier));
}

/**
 * The first tier of the manifest that lists every one of the features. It throws when no tier lists them
 * all, so the test fails rather than passing on a key that switched some of them off.
 *
 * @param {string[]} ids The feature ids.
 * @returns {string}
 */
export function requiredTierWithEvery(ids: readonly string[]): string {
  const tier = tierWithEvery(ids);

  if (tier === null) {
    throw new Error(`No tier of the manifest lists every one of ${ids.join(', ')}.`);
  }

  return tier;
}

/**
 * A preset of the license capabilities fixture: the made-up tier its key names (`null` for a key that
 * names none), the plugin features the fixture adds that tier to before it builds the grid, and the
 * key's product flags. The made-up tiers are unknown to the build, so the fixture is the only thing
 * that gives them features, and no real tier decides what a preset unlocks.
 */
export interface LicensePreset {
  tier: string | null;
  features: string[];
  flags: string[];
}

/**
 * The nine plugins on by default, which a grid with no options asks the key about.
 */
const BASE_FEATURES = [
  'feat:auto_column_size',
  'feat:autofill',
  'feat:checkbox_header',
  'feat:copy_paste',
  'feat:drag_to_scroll',
  'feat:export_file',
  'feat:import_file',
  'feat:undo_redo',
  'feat:view_state',
];

/**
 * The presets. A tier unlocks only the features it lists, so each lists what its plugins require
 * too (Filters: the column menu and hidden rows; the column menu: auto column size).
 */
export const LICENSE_PRESETS = {
  // The default plugins only.
  'tier-base': { tier: 'e2e_base', features: BASE_FEATURES, flags: [] },
  // The default plugins and the column menu, not Filters.
  'tier-column-menu': { tier: 'e2e_column_menu', features: [...BASE_FEATURES, 'feat:dropdown_menu'], flags: [] },
  // The default plugins and Filters, with what Filters requires.
  'tier-filters': {
    tier: 'e2e_filters',
    features: [...BASE_FEATURES, 'feat:filters', 'feat:dropdown_menu', 'feat:hidden_rows'],
    flags: [],
  },
  // `tier-base` with UI warnings silenced.
  'tier-no-ui': { tier: 'e2e_no_ui', features: BASE_FEATURES, flags: ['no-ui-warns'] },
  // The column menu only, with what it requires: none of the default plugins but auto column size.
  'tier-minimal': { tier: 'e2e_minimal', features: ['feat:dropdown_menu', 'feat:auto_column_size'], flags: [] },
  // A key that names no tier: it unlocks every feature.
  'no-tier': { tier: null, features: [], flags: [] },
  // A tier no feature lists: every gated feature stays off.
  'tier-unknown': { tier: 'zz_unknown', features: [], flags: [] },
} as const satisfies Record<string, LicensePreset>;

export type LicensePresetName = keyof typeof LICENSE_PRESETS;

/**
 * The key of a preset: a perpetual key naming the preset's tier and carrying its flags.
 *
 * @param {string} name The preset.
 * @returns {string}
 */
export function presetKey(name: LicensePresetName): string {
  const { tier, flags } = LICENSE_PRESETS[name] as LicensePreset;

  return keyWithTier(tier === null ? [] : [tier], [...flags]);
}

/**
 * Tells whether a name is a preset, for a caller that holds a plain string (the accessibility catalog's
 * `licensePreset`).
 *
 * @param {string} name The name.
 * @returns {boolean}
 */
export function isLicensePreset(name: string): name is LicensePresetName {
  return Object.prototype.hasOwnProperty.call(LICENSE_PRESETS, name);
}

/**
 * The license part of the fixture query for a preset: every preset's tier with its features (`presets`)
 * and the preset's key (`licenseKey`). The accessibility catalog names a preset
 * (`licensePreset` in `tests/a11y/pages.mjs`), and its TypeScript side appends this.
 *
 * @param {string} name The preset.
 * @returns {string}
 */
export function presetLicenseQuery(name: LicensePresetName): string {
  const presets: Record<string, string[]> = {};

  Object.values(LICENSE_PRESETS).forEach(({ tier, features }) => {
    if (tier !== null && features.length > 0) {
      presets[tier] = [...features];
    }
  });

  return `presets=${encodeURIComponent(JSON.stringify(presets))}&licenseKey=${encodeURIComponent(presetKey(name))}`;
}

/**
 * The fixture query for a preset and the options the grid asks for (`plugins`).
 *
 * @param {string} name The preset.
 * @param {string} plugins The options the grid asks for.
 * @returns {string}
 */
export function presetQuery(name: LicensePresetName, plugins: string): string {
  return `${presetLicenseQuery(name)}&plugins=${plugins}`;
}
