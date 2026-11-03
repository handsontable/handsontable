import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';
import { areEquivalentSettingsValue } from './helpers';

/**
 * Only these settings use deep comparison when diffing props for `updateSettings(false)`. Other
 * object settings (for example `mergeCells`, `cell`, `nestedHeaders`, hooks) stay on strict
 * reference equality so we avoid expensive deep walks and accidental false positives where functions
 * or class instances would not compare meaningfully by keys alone.
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
   * @returns {object} Handsontable-compatible settings object.
   */
  static getSettings(
    properties: HotTableProps,
    {
      prevProps = {},
      isInit = false,
      initOnlySettingKeys = [],
      currentSettings
    }: {
      prevProps?: HotTableProps;
      isInit?: boolean;
      initOnlySettingKeys?: Array<keyof Handsontable.GridSettings>;
      currentSettings?: Handsontable.GridSettings;
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
        (newSettings as any)[key] = getForwardedValue(key, properties[key as keyof HotTableProps], isInit);
      }
    });

    if (!isInit) {
      Object.keys(prevProps).forEach((key) => {
        if (
          !Object.prototype.hasOwnProperty.call(properties, key) &&
          prevProps[key as keyof HotTableProps] !== undefined &&
          isHookKey(key)
        ) {
          (newSettings as any)[key] = null;
        }
      });
    }

    return newSettings;
  }
}
