import { defineGetter } from './../helpers/object';

const MIXIN_NAME = 'stateSaver';
const STATE_PREFIX = 'state_';
const PROP_PREFIX = '_states';

const getState = function(object, stateId) {
  return object[PROP_PREFIX][STATE_PREFIX + stateId];
};

const setState = function(object, stateId, value) {
  object[PROP_PREFIX][STATE_PREFIX + stateId] = value;
};

/**
 * Mixin object to extend functionality for save/restore object state.
 *
 * @type {Object}
 */
const stateSaver = {
  /**
   * Internal states storage.
   */
  [PROP_PREFIX]: {},

  /**
   * Get cached state.
   *
   * @param {String|Number} stateId State identification.
   * @returns {*}
   */
  getCachedState(stateId) {
    return getState(this, stateId);
  },

  /**
   * Set state directly.
   *
   * @param {String|Number} stateId State identification.
   * @param {*} value
   */
  setCachedState(stateId, value) {
    setState(this, stateId, value);
  },

  /**
   * Save state object at given id.
   *
   * @param {String|Number} stateId State identification.
   */
  saveState(stateId) {
    setState(this, stateId, this.getState());
  },

  /**
   * Restore state object from given id.
   *
   * @param {String|Number} stateId State identification.
   */
  restoreState(stateId) {
    this.setState(getState(this, stateId));
  },

  /**
   * Returns `true` if state exists at given state id.
   *
   * @param {String|Number} stateId State identification.
   * @returns Boolean
   */
  hasSavedState(stateId) {
    return getState(this, stateId) !== void 0;
  },

  /**
   * Clear saved state.
   *
   * @param {String|Number} stateId State identification.
   */
  clearState(stateId) {
    setState(this, stateId);
  },

  /**
   * Clear all previously saved states of this object.
   */
  clearStates() {
    this[PROP_PREFIX] = {};
  }
};

defineGetter(stateSaver, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stateSaver;
