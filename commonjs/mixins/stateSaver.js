'use strict';

exports.__esModule = true;

var _stateSaver;

var _object = require('./../helpers/object');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var MIXIN_NAME = 'stateSaver';
var STATE_PREFIX = 'state_';
var PROP_PREFIX = '_states';

var getState = function getState(object, stateId) {
  return object[PROP_PREFIX][STATE_PREFIX + stateId];
};

var setState = function setState(object, stateId, value) {
  object[PROP_PREFIX][STATE_PREFIX + stateId] = value;
};

/**
 * Mixin object to extend functionality for save/restore object state.
 *
 * @type {Object}
 */
var stateSaver = (_stateSaver = {}, _defineProperty(_stateSaver, PROP_PREFIX, {}), _defineProperty(_stateSaver, 'getCachedState', function getCachedState(stateId) {
  return getState(this, stateId);
}), _defineProperty(_stateSaver, 'setCachedState', function setCachedState(stateId, value) {
  setState(this, stateId, value);
}), _defineProperty(_stateSaver, 'saveState', function saveState(stateId) {
  setState(this, stateId, this.getState());
}), _defineProperty(_stateSaver, 'restoreState', function restoreState(stateId) {
  this.setState(getState(this, stateId));
}), _defineProperty(_stateSaver, 'hasSavedState', function hasSavedState(stateId) {
  return getState(this, stateId) !== void 0;
}), _defineProperty(_stateSaver, 'clearState', function clearState(stateId) {
  setState(this, stateId);
}), _defineProperty(_stateSaver, 'clearStates', function clearStates() {
  this[PROP_PREFIX] = {};
}), _stateSaver);

(0, _object.defineGetter)(stateSaver, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false
});

exports.default = stateSaver;