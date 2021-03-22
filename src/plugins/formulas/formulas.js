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

    this.hyperformula = HyperFormula.buildEmpty();

    // TODO list out hooks from my local plugin/old plugin/todo

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }

  onAfterLoadData(...args) {
    if (!this.isEnabled) {
      return
    }

    const {width, height} = this.hyperFormula.getSheetDimensions()
    // hf.setSheetContent()
  }
}
