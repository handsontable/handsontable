import { normalizeSchemesWithFallback } from '../../utils/cellLinks';
import type { LinkifyOptions } from './linkifyCell';
import type { AutoLinkSettings } from './autoLink';

/**
 * The settings with every key resolved, ready for `linkifyCell`.
 */
export type ResolvedAutoLinkSettings = Omit<LinkifyOptions, 'baseUrl'>;

/**
 * Merges a cell- or column-level `autoLink` object over the grid-level resolved settings. Every key is
 * validated again here, because a cell-level object never passes the plugin's `SETTINGS_VALIDATORS`.
 *
 * A column or cell `schemes` REPLACES the grid-level list for those cells - it is a standard cascading
 * override, not a merge - and every level, grid, column, and cell alike, is limited to the same fixed
 * four-scheme allowlist (`http`, `https`, `mailto`, `tel`): a level can only narrow that allowlist,
 * never widen it. `normalizeSchemesWithFallback` is what keeps a typo'd, all-unknown `schemes` array
 * from failing closed (falls back to the grid-level `base.schemes` instead), while an EXPLICIT empty
 * array stays empty - the author asked for no links from this cell, and that request is not
 * second-guessed.
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
    schemes: normalizeSchemesWithFallback(override.schemes, base.schemes),
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
