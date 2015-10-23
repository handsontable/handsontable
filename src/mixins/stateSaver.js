
import {arrayEach} from './../helpers/array';
import {defineGetter} from './../helpers/object';

const MIXIN_NAME = 'stateSaver';
const STATE_PREFIX = 'state_';

/**
 * Mixin object to extend functionality for save/restore object state.
 *
 * @type {Object}
 */
const stateSaver = {
  /**
   * Internal states storage.
   */
  _states: {},

  /**
   * Save state object at given id.
   *
   * @param {String|Number} stateId
   */
  saveState(stateId) {
    this._states[STATE_PREFIX + stateId] = this.getState();
  },

  /**
   * Restore state object from given id.
   *
   * @param {String|Number} stateId
   */
  restoreState(stateId) {
    this.setState(this._states[STATE_PREFIX + stateId]);
  },

  /**
   * Returns `true` if state exists at given state id.
   *
   * @param {String|Number} stateId
   * @returns Boolean
   */
  hasSavedState(stateId) {
    return this._states[STATE_PREFIX + stateId] !== void 0;
  }
};

defineGetter(stateSaver, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export {stateSaver};

// For tests only!
Handsontable.utils = Handsontable.utils || {};
Handsontable.utils.stateSaver = stateSaver;
