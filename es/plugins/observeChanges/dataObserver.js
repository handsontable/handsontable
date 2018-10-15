var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import jsonpatch from './../../../lib/jsonpatch/json-patch-duplex';
import localHooks from '../../mixins/localHooks';
import { mixin } from '../../helpers/object';
import { cleanPatches } from './utils';

/**
 * @class DataObserver
 * @plugin ObserveChanges
 */

var DataObserver = function () {
  function DataObserver(observedData) {
    _classCallCheck(this, DataObserver);

    /**
     * Observed source data.
     *
     * @type {Array}
     */
    this.observedData = null;
    /**
     * JsonPatch observer.
     *
     * @type {Object}
     */
    this.observer = null;
    /**
     * Flag which determines if observer is paused or not. Paused observer doesn't emit `change` hooks.
     *
     * @type {Boolean}
     * @default false
     */
    this.paused = false;

    this.setObservedData(observedData);
  }

  /**
   * Set data to observe.
   *
   * @param {*} observedData
   */


  _createClass(DataObserver, [{
    key: 'setObservedData',
    value: function setObservedData(observedData) {
      var _this = this;

      if (this.observer) {
        jsonpatch.unobserve(this.observedData, this.observer);
      }
      this.observedData = observedData;
      this.observer = jsonpatch.observe(this.observedData, function (patches) {
        return _this.onChange(patches);
      });
    }

    /**
     * Check if observer was paused.
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isPaused',
    value: function isPaused() {
      return this.paused;
    }

    /**
     * Pause observer (stop emitting all detected changes).
     */

  }, {
    key: 'pause',
    value: function pause() {
      this.paused = true;
    }

    /**
     * Resume observer (emit all detected changes).
     */

  }, {
    key: 'resume',
    value: function resume() {
      this.paused = false;
    }

    /**
     * JsonPatch on change listener.
     *
     * @private
     * @param {Array} patches An array of object passed from jsonpatch.
     */

  }, {
    key: 'onChange',
    value: function onChange(patches) {
      this.runLocalHooks('change', cleanPatches(patches));
    }

    /**
     * Destroy observer instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      jsonpatch.unobserve(this.observedData, this.observer);
      this.observedData = null;
      this.observer = null;
    }
  }]);

  return DataObserver;
}();

mixin(DataObserver, localHooks);

export default DataObserver;