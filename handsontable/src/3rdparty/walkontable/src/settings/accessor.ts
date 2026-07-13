import { objectEach } from '../../../../helpers/object';
import { throwWithCause } from '../../../../helpers/errors';
import type { StylesHandler } from '../types';
import type { SettingsPort } from '../ports';
import { getDefaults } from './defaults';

/**
 * @class Settings
 */
export default class Settings implements SettingsPort {

  /**
   * Reference to settings.
   *
   * @protected
   * @type {object}
   */
  settings: Record<string, unknown> = {};

  /**
   * The defaults values of settings.
   * Void 0 means it is required, null means it can be empty.
   *
   * @public
   * @type {Readonly<object>}
   */
  defaults: Record<string, unknown> = Object.freeze(getDefaults(this));

  /**
   * @param {object} settings The user defined settings.
   */
  constructor(settings: Record<string, unknown>) {
    objectEach(this.defaults, (value: unknown, key: string) => {
      if (settings[key] !== undefined) {
        this.settings[key] = settings[key];

      } else if (value === undefined) {
        throwWithCause(`A required setting "${key}" was not provided`);

      } else {
        this.settings[key] = value;
      }
    });
  }

  /**
   * Update settings.
   *
   * @param {object|string} settings The singular settings to update or if passed as object to merge with.
   * @param {*} value The value to set if the first argument is passed as string.
   * @returns {Settings}
   */
  update(settings: string | Record<string, unknown>, value?: unknown) {
    if (value === undefined) { // settings is object
      objectEach(settings as Record<string, unknown>, (settingValue: unknown, key: string) => {
        this.settings[key] = settingValue;
      });
    } else { // if value is defined then settings is the key
      this.settings[settings as string] = value;
    }

    return this;
  }

  /**
   * Get setting by name.
   *
   * @param {$Keys<SettingsPure>} key The settings key to retrieve.
   * @param {*} [param1] Additional parameter passed to the options defined as function.
   * @param {*} [param2] Additional parameter passed to the options defined as function.
   * @param {*} [param3] Additional parameter passed to the options defined as function.
   * @param {*} [param4] Additional parameter passed to the options defined as function.
   * @returns {*}
   */
  getSetting(key: 'stylesHandler'): StylesHandler;
  /* eslint-disable jsdoc/require-jsdoc -- TypeScript overload signatures share the JSDoc of the first overload above */
  getSetting(key: 'preventOverflow'): 'horizontal' | 'vertical' | false;
  getSetting(key: 'rtlMode'): boolean;
  getSetting(key: 'isDataViewInstance'): boolean;
  getSetting(key: 'fixedColumnsStart'): number;
  getSetting(key: 'fixedRowsTop'): number;
  getSetting(key: 'fixedRowsBottom'): number;
  getSetting(key: 'totalRows'): number | undefined;
  getSetting(key: 'totalColumns'): number | undefined;
  getSetting(key: 'rowHeaderWidth'): number | undefined;
  getSetting(key: 'defaultColumnWidth'): number | undefined;
  getSetting(key: 'viewportRowRenderingThreshold'): number | 'auto';
  getSetting(key: 'viewportColumnRenderingThreshold'): number | 'auto';
  getSetting(key: 'viewportRowRenderingOffsetIsAuto'): boolean;
  getSetting(key: 'viewportColumnRenderingOffsetIsAuto'): boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSetting<T = any>(key: string, param1?: any, param2?: unknown, param3?: unknown, param4?: unknown): T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSetting(key: string, param1?: any, param2?: unknown, param3?: unknown, param4?: unknown): unknown {
    if (typeof this.settings[key] === 'function') {
      return (this.settings[key] as (...args: unknown[]) => unknown)(param1, param2, param3, param4);

    } else if (param1 !== undefined && Array.isArray(this.settings[key])) {
      return (this.settings[key] as Array<unknown>)[param1 as number];

    }

    return this.settings[key];
  }
  /* eslint-enable jsdoc/require-jsdoc */

  /**
   * Get a setting value without any evaluation.
   *
   * @param {string} key The settings key to retrieve.
   * @returns {*}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSettingPure<T = any>(key: string): T;
  // eslint-disable-next-line jsdoc/require-jsdoc -- TypeScript overload implementation; documented in the overload signature above
  getSettingPure(key: string) {
    return this.settings[key];
  }

  /**
   * Checks if setting exists.
   *
   * @param {boolean} key The settings key to check.
   * @returns {boolean}
   */
  has(key: string) {
    return !!this.settings[key];
  }
}
