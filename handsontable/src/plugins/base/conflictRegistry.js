/**
 * @typedef {object} HardConflictRegistration
 * @property {string} ownerPluginKey Plugin that owns the conflict (for example `dataProvider`).
 * @property {function(Handsontable.DefaultSettings): boolean} predicate When `true`, listed plugins must not enable.
 * @property {string[]} blockedPluginKeys Values of `PLUGIN_KEY` for plugins that stay disabled while the predicate holds.
 */

/** @type {HardConflictRegistration[]} */
const hardConflicts = [];

/**
 * Registers a hard conflict: when `predicate(settings)` is true, plugins in `blockedPluginKeys` must not enable.
 * The owning plugin (for example DataProvider) is responsible for calling this at module load.
 *
 * @param {string} ownerPluginKey Owner `PLUGIN_KEY`.
 * @param {function(Handsontable.DefaultSettings): boolean} predicate Whether the conflict is active for the given settings.
 * @param {string[]} blockedPluginKeys `PLUGIN_KEY` values to block.
 */
export function registerConflict(ownerPluginKey, predicate, blockedPluginKeys) {
  hardConflicts.push({
    ownerPluginKey,
    predicate,
    blockedPluginKeys,
  });
}

/**
 * Returns the first registered hard conflict that applies to `pluginKey` under `settings`.
 *
 * @param {Handsontable.DefaultSettings} settings Current instance settings.
 * @param {string} pluginKey `PLUGIN_KEY` of the plugin being enabled.
 * @returns {HardConflictRegistration|null}
 */
export function getHardConflict(settings, pluginKey) {
  for (let i = 0; i < hardConflicts.length; i += 1) {
    const entry = hardConflicts[i];

    if (entry.blockedPluginKeys.includes(pluginKey) && entry.predicate(settings)) {
      return entry;
    }
  }

  return null;
}
