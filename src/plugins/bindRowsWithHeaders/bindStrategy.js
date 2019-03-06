import { rangeEach } from '../../helpers/number';
import { toUpperCaseFirst } from '../../helpers/string';
import * as strategies from './bindStrategies';

/**
 * @class BindStrategy
 * @plugin BindRowsWithHeaders
 */
class BindStrategy {
  /**
   * Loose bind mode.
   *
   * @returns {String}
   */
  static get DEFAULT_STRATEGY() {
    return 'loose';
  }

  constructor() {
    this.strategy = null;
  }

  /**
   * Set strategy behaviors for binding rows with headers.
   *
   * @param name
   */
  setStrategy(name) {
    const Strategy = strategies[toUpperCaseFirst(name)];

    if (!Strategy) {
      throw new Error(`Bind strategy "${name}" does not exist.`);
    }
    this.strategy = new Strategy();
  }

  /**
   * Reset current map array and create a new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  createMap(length) {
    const strategy = this.strategy;
    const originLength = length === void 0 ? strategy._arrayMap.length : length;

    strategy._arrayMap.length = 0;

    rangeEach(originLength - 1, (itemIndex) => {
      strategy._arrayMap.push(itemIndex);
    });
  }

  /**
   * Alias for createRow of strategy class.
   *
   * @param {*} params
   */
  createRow(...params) {
    this.strategy.createRow(...params);
  }

  /**
   * Alias for removeRow of strategy class.
   *
   * @param {*} params
   */
  removeRow(...params) {
    this.strategy.removeRow(...params);
  }

  /**
   * Alias for getValueByIndex of strategy class.
   *
   * @param {*} params
   */
  translate(...params) {
    return this.strategy.getValueByIndex(...params);
  }

  /**
   * Clear array map.
   */
  clearMap() {
    this.strategy.clearMap();
  }

  /**
   * Destroy class.
   */
  destroy() {
    if (this.strategy) {
      this.strategy.destroy();
    }
    this.strategy = null;
  }
}

export default BindStrategy;
