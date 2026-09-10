import { normalizeSchemes, type LinkScheme } from '../../utils/cellLinks';
import type { LinkifyOptions } from './linkifyCell';
import type { AutoLinkSettings } from './autoLink';

/**
 * The settings with every key resolved, ready for `linkifyCell`.
 */
export type ResolvedAutoLinkSettings = Omit<LinkifyOptions, 'baseUrl'>;

/**
 * Resolves the `schemes` override against the base schemes. A column or cell `schemes` REPLACES the
 * grid-level list for those cells - it is a standard cascading override, not a merge - and every
 * level, grid, column, and cell alike, is limited to the same fixed four-scheme allowlist (`http`,
 * `https`, `mailto`, `tel`): a level can only narrow that allowlist, never widen it. A non-empty
 * array whose every entry is unknown to the allowlist (a typo, for instance) normalizes to an empty
 * array - and an empty array from `normalizeSchemes` reads as a mistake here, not as "no links from
 * this cell", so it falls back to the base schemes instead of failing closed. An EXPLICIT empty array
 * stays empty: the author asked for no links from this cell, and that request must not be
 * second-guessed.
 *
 * @param {LinkScheme[]} baseSchemes The grid-level schemes, already resolved.
 * @param {unknown} overrideSchemes The cell- or column-level `schemes` value, unvalidated.
 * @returns {LinkScheme[]} The resolved schemes.
 */
function resolveSchemesOverride(
  baseSchemes: readonly LinkScheme[], overrideSchemes: unknown
): readonly LinkScheme[] {
  if (!Array.isArray(overrideSchemes)) {
    return baseSchemes;
  }

  if (overrideSchemes.length === 0) {
    return [];
  }

  const normalized = normalizeSchemes(overrideSchemes);

  return normalized.length === 0 ? baseSchemes : normalized;
}

/**
 * Merges a cell- or column-level `autoLink` object over the grid-level resolved settings. Every key is
 * validated again here, because a cell-level object never passes the plugin's `SETTINGS_VALIDATORS`.
 *
 * @param {ResolvedAutoLinkSettings} base The grid-level settings, already resolved.
 * @param {AutoLinkSettings} override The cell- or column-level `autoLink` object.
 * @returns {ResolvedAutoLinkSettings} The merged settings.
 */
export function resolveAutoLinkSettings(
  base: ResolvedAutoLinkSettings, override: AutoLinkSettings
): ResolvedAutoLinkSettings {
  return {
    target: override.target === '_self' || override.target === '_blank' ? override.target : base.target,
    schemes: resolveSchemesOverride(base.schemes, override.schemes),
    inline: typeof override.inline === 'boolean' ? override.inline : base.inline,
    strict: typeof override.strict === 'boolean' ? override.strict : base.strict,
    classNames: typeof override.className === 'string'
      ? override.className.split(/\s+/).filter(name => name !== '')
      : base.classNames,
  };
}

/**
 * Resolves a column- or cell-level `autoLink` override, memoized per `override` object in `cache`.
 * `#resolveSettings` (`autoLink.ts`) reads the same override object on every render pass a cell is
 * painted, so without this the merge-and-validate work in `resolveAutoLinkSettings` would repeat on
 * every render for a cell that never changed its override.
 *
 * @param {WeakMap<object, ResolvedAutoLinkSettings>} cache The cache to read from and populate.
 * @param {ResolvedAutoLinkSettings} base The grid-level settings, already resolved.
 * @param {AutoLinkSettings} override The cell- or column-level `autoLink` object.
 * @returns {ResolvedAutoLinkSettings} The merged settings - the identical object on every call for
 * the same `override`, until the cache is cleared.
 */
export function resolveAutoLinkSettingsCached(
  cache: WeakMap<object, ResolvedAutoLinkSettings>,
  base: ResolvedAutoLinkSettings,
  override: AutoLinkSettings
): ResolvedAutoLinkSettings {
  let resolved = cache.get(override);

  if (resolved === undefined) {
    resolved = resolveAutoLinkSettings(base, override);
    cache.set(override, resolved);
  }

  return resolved;
}
