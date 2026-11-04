import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';
import { areEquivalentSettingsValue, copySettingsValue } from './helpers';

/**
 * These settings are compared with the previous props, or for the size settings with the grid's live
 * value, by the rules below. Every other setting but `data` is compared with a copy of the value last
 * passed to the grid (`isSameAsForwarded()`).
 *
 * `rowHeights`, `minRowHeights` (the row height floor) and `colWidths` are here because passing any
 * of them re-declares the sizes and discards the ones the user produced by dragging
 * (`ManualRowResize` / `ManualColumnResize`). A re-render must not do that, and a React app commonly
 * writes the value inline (`rowHeights={[50, 50]}`), which is a new array on every render and never
 * reference-equal. All three hold plain numbers, strings or arrays of them, so the deep walk is
 * cheap. The Vue wrapper already skips unchanged keys this way.
 */
const DEEP_COMPARABLE_SETTINGS: Array<keyof Handsontable.GridSettings> = [
  'dataSchema', 'columns', 'rowHeights', 'minRowHeights', 'colWidths'
];

/**
 * The size settings are compared against the grid's live settings rather than the previous props,
 * which is what the Angular and Vue wrappers already do. Comparing against props alone would stop
 * re-asserting the prop after anything changed the size through the instance ref.
 */
const COMPARED_AGAINST_LIVE_SETTINGS: Array<keyof Handsontable.GridSettings> = [
  'rowHeights', 'minRowHeights', 'colWidths'
];

/**
 * Settings that core resets only on `null`. For these, core reads `undefined` as "leave the current
 * value", so forwarding the `undefined` default would keep the old size on the root element. `null`
 * restores the root element's initial inline size, which is what a fresh mount without the prop gives.
 */
const CLEARED_BY_NULL_SETTINGS = new Set<string>(['height', 'width']);

/**
 * Settings forwarded on every update, changed or not. An app may change the rows of its `data` array
 * in place and re-render to show them, and passing the array again is what reloads them.
 */
const ALWAYS_FORWARDED_SETTINGS: Array<keyof Handsontable.GridSettings> = ['data'];

/**
 * Settings compared by reference only. The sheets bar writes renames and added sheets into the
 * `sheets` array it was given, so a new array is a new workbook even when its content matches, and
 * walking every sheet's rows on each render would cost as much as the data itself. The Vue wrapper
 * compares `sheets` the same way.
 */
const REFERENCE_COMPARED_SETTINGS: Array<keyof Handsontable.GridSettings> = ['sheetsBar'];

/**
 * Copies of the values last passed to the grid, by setting name. The component keeps one per grid
 * instance and passes it to every update.
 */
export type ForwardedSettings = Map<string, unknown>;

/**
 * Checks whether an update would pass a setting with the value it passed last time. Passing it again
 * is not a no-op: core re-applies the plugins it names, and a plugin re-applied with its own settings
 * drops the state the user gave it (Filters' conditions, Pagination's page, the server total of a
 * `dataProvider` grid, and a refetch). A React app passes every prop on each render, often as an
 * inline object, so the value is compared by content (`areEquivalentSettingsValue()`: functions and
 * class instances by reference). The comparison is with a copy of the value last passed, not with the
 * grid's live value: an object the app changed in place is the same reference the grid holds, so only
 * the copy shows the change, and with the sheets bar on the live value is the visible sheet's own.
 *
 * @param {string} key The setting name.
 * @param {*} value The value the update would pass.
 * @param {ForwardedSettings} [forwardedSettings] The values last passed to the grid.
 * @returns {boolean}
 */
function isSameAsForwarded(
  key: keyof Handsontable.GridSettings,
  value: unknown,
  forwardedSettings?: ForwardedSettings,
): boolean {
  if (!forwardedSettings?.has(key) || ALWAYS_FORWARDED_SETTINGS.includes(key)) {
    return false;
  }

  const forwardedValue = forwardedSettings.get(key);

  return REFERENCE_COMPARED_SETTINGS.includes(key) ?
    forwardedValue === value :
    areEquivalentSettingsValue(forwardedValue, value);
}

/**
 * Records the value an update passes to the grid, for the next update to compare with.
 *
 * @param {string} key The setting name.
 * @param {*} value The value passed.
 * @param {ForwardedSettings} [forwardedSettings] The values last passed to the grid.
 */
function recordForwarded(
  key: keyof Handsontable.GridSettings,
  value: unknown,
  forwardedSettings?: ForwardedSettings,
): void {
  if (!forwardedSettings || ALWAYS_FORWARDED_SETTINGS.includes(key)) {
    return;
  }

  forwardedSettings.set(key, REFERENCE_COMPARED_SETTINGS.includes(key) ? value : copySettingsValue(value));
}

/**
 * Checks whether a setting is a hook, by the rule core's `updateSettings()` uses in `core.ts`: a
 * registered or a deprecated hook name.
 *
 * @param {string} key The setting name.
 * @returns {boolean}
 */
function isHookKey(key: string): boolean {
  return Handsontable.hooks.isRegistered(key) || Handsontable.hooks.isDeprecated(key);
}

/**
 * Returns the value that clears a setting whose prop went from a value to `undefined`: `null` for a
 * hook (it removes the callback) and for `height` and `width` (it resets the root element's size),
 * and the option's default for anything else.
 *
 * @param {string} key The setting name.
 * @returns {*} The value to forward to `updateSettings()`.
 */
function getClearedValue(key: string): unknown {
  if (isHookKey(key) || CLEARED_BY_NULL_SETTINGS.has(key)) {
    return null;
  }

  return (Handsontable.DefaultSettings as any)[key];
}

/**
 * Checks whether a hook value holds a callback core registers: a function or an array of them. Core
 * ignores any other value for a hook, so `false` from `afterChange={on && logChange}` would leave the
 * previous callback running.
 *
 * @param {*} value The hook value.
 * @returns {boolean}
 */
function isHookCallback(value: unknown): boolean {
  return typeof value === 'function' || Array.isArray(value);
}

/**
 * Returns the value to forward for a prop that is passed: the option's cleared value for `undefined`,
 * `null` for a hook prop that holds no callback on an update, and the prop value otherwise.
 *
 * @param {string} key The setting name.
 * @param {*} value The prop value.
 * @param {boolean} isInit Whether the grid is being initialized.
 * @returns {*} The value to forward to `updateSettings()`.
 */
function getForwardedValue(key: string, value: unknown, isInit: boolean): unknown {
  if (value === undefined) {
    return getClearedValue(key);
  }

  if (!isInit && isHookKey(key) && !isHookCallback(value)) {
    return null;
  }

  return value;
}

export class SettingsMapper {
  /**
   * Parse component settings into Handsontable-compatible settings.
   *
   * A prop whose value is `undefined` counts as not passed and is left out, so the option keeps its
   * default. An own `undefined` key would shadow that default in the settings cascade. On an update
   * of a prop that had a value in the previous props, the option's default is forwarded instead, so
   * the grid matches a fresh mount with the same props (`copyPaste={on ? false : undefined}` turns
   * copy and paste back on). `height` and `width` are forwarded as `null`, because core leaves the
   * size in place for `undefined` (`height={full ? undefined : 400}` clears the height).
   * A hook has no default to fall back to, so a hook prop that had a callback and is now `undefined`
   * is forwarded as `null`, which removes the callback (`afterChange={on ? logChange : undefined}`).
   * So is a hook prop that had a callback and is no longer passed at all, and, on an update, a hook
   * prop that holds anything but a callback (`afterChange={on && logChange}` gives `false`).
   * For an option that is not a hook, `null` and `false` are real values and are forwarded.
   *
   * @param {object} properties Object containing properties from the HotTable object.
   * @param {object} additionalSettings Additional settings.
   * @param {boolean} additionalSettings.isInit Flag determining whether the settings are being set during initialization.
   * @param {string[]} additionalSettings.initOnlySettingKeys Array of keys that can be set only during initialization.
   * @param {HotTableProps} additionalSettings.prevProps The component's props before the current update.
   * @param {Handsontable.GridSettings} additionalSettings.currentSettings The grid's current live settings.
   * @param {ForwardedSettings} additionalSettings.forwardedSettings The values last passed to the grid. A
   * setting whose value equals the one recorded there is left out, and every setting passed is recorded.
   * @returns {object} Handsontable-compatible settings object.
   */
  static getSettings(
    properties: HotTableProps,
    {
      prevProps = {},
      isInit = false,
      initOnlySettingKeys = [],
      currentSettings,
      forwardedSettings,
    }: {
      prevProps?: HotTableProps;
      isInit?: boolean;
      initOnlySettingKeys?: Array<keyof Handsontable.GridSettings>;
      currentSettings?: Handsontable.GridSettings;
      forwardedSettings?: ForwardedSettings;
    } = {}): Handsontable.GridSettings {
    const shouldSkipProp = (key: keyof Handsontable.GridSettings) => {
      if (isInit) {
        return false;
      }

      // Checked before the value comparison below. The two lists do not overlap today, but a
      // changed deep-comparable key used to return early and skip this guard entirely, which would
      // have forwarded an init-only key to `updateSettings` as soon as one joined both lists.
      if (initOnlySettingKeys.includes(key)) {
        return true;
      }

      if (DEEP_COMPARABLE_SETTINGS.includes(key)) {
        const comparedValue = currentSettings && COMPARED_AGAINST_LIVE_SETTINGS.includes(key) ?
          currentSettings[key] :
          prevProps[key];

        return areEquivalentSettingsValue(comparedValue, properties[key]);
      }

      return false;
    };
    const isNotPassed = (key: keyof HotTableProps) => {
      return properties[key] === undefined && (isInit || prevProps[key] === undefined);
    };
    const newSettings: Handsontable.GridSettings = {};

    Object.keys(properties).forEach((key) => {
      if (
        key !== 'children' &&
        !isNotPassed(key as keyof HotTableProps) &&
        !shouldSkipProp(key as keyof Handsontable.GridSettings)
      ) {
        const settingKey = key as keyof Handsontable.GridSettings;
        const value = getForwardedValue(key, properties[key as keyof HotTableProps], isInit);

        if (
          isInit ||
          DEEP_COMPARABLE_SETTINGS.includes(settingKey) ||
          !isSameAsForwarded(settingKey, value, forwardedSettings)
        ) {
          (newSettings as any)[key] = value;
          recordForwarded(settingKey, value, forwardedSettings);
        }
      }
    });

    if (!isInit) {
      Object.keys(prevProps).forEach((key) => {
        if (
          !Object.hasOwn(properties, key) &&
          prevProps[key as keyof HotTableProps] !== undefined &&
          isHookKey(key)
        ) {
          (newSettings as any)[key] = null;
          recordForwarded(key as keyof Handsontable.GridSettings, null, forwardedSettings);
        }
      });
    }

    return newSettings;
  }
}
