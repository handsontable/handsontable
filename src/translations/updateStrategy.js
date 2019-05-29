import { toUpperCaseFirst } from '.././helpers/string';
import * as strategies from './updateStrategies';

/**
 * @class UpdateStrategy
 */
class UpdateStrategy {
  /**
   * Visually indexed, updated list.
   *
   * @returns {String}
   */
  static get DEFAULT_STRATEGY() {
    return 'visuallyIndexedUpdated';
  }

  constructor(name = UpdateStrategy.DEFAULT_STRATEGY) {
    this.strategy = null;

    this.setStrategy(name);
  }

  /**
   * Set strategy behaviors for binding rows with headers.
   *
   * @param name
   */
  setStrategy(name) {
    const Strategy = strategies[toUpperCaseFirst(name)];

    if (!Strategy) {
      throw new Error(`Map update strategy "${name}" does not exist.`);
    }

    this.strategy = new Strategy();
  }

  /**
   * Alias for `getItemsAfterInsertion` of strategy class.
   *
   * @param {*} params
   */
  getItemsAfterInsertion(...params) {
    return this.strategy.getItemsAfterInsertion(...params);
  }

  /**
   * Alias for `getItemsAfterInsertion` of strategy class.
   *
   * @param {*} params
   */
  getItemsAfterRemoval(...params) {
    return this.strategy.getItemsAfterRemoval(...params);
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

export default UpdateStrategy;
