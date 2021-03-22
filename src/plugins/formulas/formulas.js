// big work in progress.

import { BasePlugin } from '../base';

import { HyperFormula } from 'hyperformula'

export const PLUGIN_KEY = 'formulas';
export const PLUGIN_PRIORITY = 260;

/**
 * The formulas plugin.
 *
 * @plugin Formulas
 */
export class Formulas extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Formulas#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    /* eslint-disable no-unneeded-ternary */
    return this.hot.getSettings()[PLUGIN_KEY] ? true : false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const settings = this.hot.getSettings()[PLUGIN_KEY];

    /**
     * The HyperFormula instance that will be used for this instance of Handsontable.
     * @type {HyperFormula}
     */
    this.hyperformula = HyperFormula.buildEmpty({
      licenseKey: 'non-commercial-and-evaluation' // TODO
    });

    this.sheetName = this.hyperformula.addSheet()

    this.addHook('afterLoadData', (...args) => this.onAfterLoadData(...args))
    this.addHook('modifyData', (...args) => this.onModifyData(...args))
    this.addHook('modifySourceData', (...args) => this.onModifySourceData(...args))

    // TODO list out hooks from my local plugin/old plugin/todo

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    // TODO add tests for this line
    this.hyperformula.destroy()

    super.disablePlugin();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }

  onAfterLoadData(data) {
    if (!this.isEnabled) {
      return
    }

    this.hyperformula.setSheetContent(this.sheetName, data)
  }

  onModifyData(row, column, valueHolder, ioMode) {
    if (!this.enabled) {
      // TODO check if this line is actually ever reached
      return
    }

    const address = {
      row: this.hot.toVisualRow(row),
      col: column,
      sheet: this.hyperformula.getSheetId(this.sheetName)
    }

    if (ioMode === 'get') {
      const cellValue = this.hyperformula.getCellValue(address)

      // If `cellValue` is an object it is expected to be an error
      const value = (typeof cellValue === 'object' && cellValue !== null) ? cellValue.value : cellValue

      valueHolder.value = value
    } else {
      this.hyperformula.setCellContents(address, valueHolder.value)
    }
  }

  onModifySourceData(row, col, valueHolder) {
    const address = {
      row: this.hot.toVisualRow(row),
      col,
      sheet: this.hyperformula.getSheetId(this.sheetName)
    }

    valueHolder.value = this.hyperformula.getCellSerialized(address)
  }
}
