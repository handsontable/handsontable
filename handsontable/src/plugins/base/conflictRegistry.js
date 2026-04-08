import { throwWithCause } from '../../helpers/errors';

/**
 * @typedef {object} HardConflictRegistration
 * @property {string} blockedKey Plugin or other key that must not enable while the conflict applies (usually a
 *   `PLUGIN_KEY`).
 * @property {string} incompatibleSettingKey Top-level Handsontable setting key that triggers the conflict when its
 *   value is truthy (`!!settings[incompatibleSettingKey]`). Shown in console warnings.
 */

/** @type {HardConflictRegistration[]} */
const hardConflicts = [];

/**
 * @param {Handsontable.DefaultSettings} settings Current instance settings.
 * @param {string} incompatibleSettingKey Top-level settings key to read.
 * @returns {boolean} Whether that setting is considered active (truthy).
 */
function isIncompatibleSettingActive(settings, incompatibleSettingKey) {
  return !!settings[incompatibleSettingKey];
}

/**
 * Registers hard conflicts. The plugin or feature identified by `blockedKey` cannot enable while any matching
 * registration has an active incompatible setting (`!!settings[incompatibleSettingKey]`).
 *
 * Call shapes (second argument is always named `incompatibleSettingKeys` in code; it is either one string or a string
 * array):
 *
 * 1. **Single pair** — `registerConflict(blockedTargetKey, incompatibleSettingKeys)` with `incompatibleSettingKeys` a
 *    string.
 * 2. **One setting blocks several targets** — `registerConflict(blockedTargetKeys[], incompatibleSettingKeys)` with
 *    `incompatibleSettingKeys` a string.
 * 3. **One target blocked by several settings** — `registerConflict(blockedTargetKey, incompatibleSettingKeys)` with
 *    `incompatibleSettingKeys` a string array (for example Pagination, DataProvider).
 *
 * @param {string|string[]} blockedTargetKeyOrKeys Key or keys that must stay disabled (typically `PLUGIN_KEY` values).
 * @param {string|string[]} incompatibleSettingKeys One top-level setting key, or an array of keys, that trigger the
 *   conflict when truthy in `settings`.
 */
export function registerConflict(blockedTargetKeyOrKeys, incompatibleSettingKeys) {
  if (Array.isArray(blockedTargetKeyOrKeys)) {
    if (typeof incompatibleSettingKeys !== 'string') {
      throwWithCause(
        'registerConflict(blockedTargetKeys[], incompatibleSettingKeys) expects incompatibleSettingKeys ' +
          'to be a string.',
      );
    }

    for (let i = 0; i < blockedTargetKeyOrKeys.length; i += 1) {
      hardConflicts.push({
        blockedKey: blockedTargetKeyOrKeys[i],
        incompatibleSettingKey: incompatibleSettingKeys,
      });
    }

    return;
  }

  if (typeof blockedTargetKeyOrKeys !== 'string') {
    throwWithCause('registerConflict expects a string blocked target key when the first argument is not an array.');
  }

  const blockedKey = blockedTargetKeyOrKeys;

  if (Array.isArray(incompatibleSettingKeys)) {
    for (let i = 0; i < incompatibleSettingKeys.length; i += 1) {
      const incompatibleSettingKey = incompatibleSettingKeys[i];

      if (typeof incompatibleSettingKey !== 'string') {
        throwWithCause(
          'registerConflict(blockedTargetKey, incompatibleSettingKeys) expects incompatibleSettingKeys ' +
            'to be a string array.',
        );
      }

      hardConflicts.push({
        blockedKey,
        incompatibleSettingKey,
      });
    }

    return;
  }

  if (typeof incompatibleSettingKeys === 'string') {
    hardConflicts.push({
      blockedKey,
      incompatibleSettingKey: incompatibleSettingKeys,
    });

    return;
  }

  throwWithCause('Invalid registerConflict arguments.');
}

/**
 * Returns the first hard conflict entry that applies to `blockedKey` for the given `settings`.
 *
 * @param {Handsontable.DefaultSettings} settings Current instance settings.
 * @param {string} blockedKey Key being enabled (usually a plugin `PLUGIN_KEY`).
 * @returns {HardConflictRegistration|null}
 */
export function getHardConflict(settings, blockedKey) {
  for (let i = 0; i < hardConflicts.length; i += 1) {
    const entry = hardConflicts[i];

    if (entry.blockedKey === blockedKey && isIncompatibleSettingActive(settings, entry.incompatibleSettingKey)) {
      return entry;
    }
  }

  return null;
}
