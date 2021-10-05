import { arrayEach } from '../../../helpers/array';
import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import { LinkedPhysicalIndexToValueMap as IndexToValueMap } from '../../../translations';

/**
 * @plugin Filters
 * @class BaseComponent
 */
class BaseComponent {
  constructor(hotInstance, { id, stateless = true }) {
    /**
     * The Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * The component uniq id.
     *
     * @type {string}
     */
    this.id = id;
    /**
     * List of registered component UI elements.
     *
     * @type {Array}
     */
    this.elements = [];
    /**
     * Flag which determines if element is hidden.
     *
     * @type {boolean}
     */
    this.hidden = false;
    /**
     * The component states id.
     *
     * @type {string}
     */
    this.stateId = `Filters.component.${this.id}`;
    /**
     * Index map which stores component states for each column.
     *
     * @type {LinkedPhysicalIndexToValueMap|null}
     */
    this.state = stateless ? null : this.hot.columnIndexMapper.registerMap(this.stateId, new IndexToValueMap());
  }

  /**
   * Reset elements to its initial state.
   */
  reset() {
    arrayEach(this.elements, ui => ui.reset());
  }

  /**
   * Hide component.
   */
  hide() {
    this.hidden = true;
  }

  /**
   * Show component.
   */
  show() {
    this.hidden = false;
  }

  /**
   * Check if component is hidden.
   *
   * @returns {boolean}
   */
  isHidden() {
    return this.hot === null || this.hidden;
  }

  /**
   * Restores the component state from the given physical column index. The method
   * internally calls the `setState` method. The state then is individually processed
   * by each component.
   *
   * @param {number} physicalColumn The physical column index.
   */
  restoreState(physicalColumn) {
    if (this.state) {
      this.setState(this.state.getValueAtIndex(physicalColumn));
    }
  }

  /**
   * The custom logic for component state restoring.
   */
  setState() {
    throw new Error('The state setting logic is not implemented');
  }

  /**
   * Saves the component state to the given physical column index. The method
   * internally calls the `getState` method, which returns the current state of
   * the component.
   *
   * @param {number} physicalColumn The physical column index.
   */
  saveState(physicalColumn) {
    if (this.state) {
      this.state.setValueAtIndex(physicalColumn, this.getState());
    }
  }

  /**
   * The custom logic for component state gathering (for stateful components).
   */
  getState() {
    throw new Error('The state gathering logic is not implemented');
  }

  /**
   * Destroy element.
   */
  destroy() {
    this.hot.columnIndexMapper.unregisterMap(this.stateId);
    this.clearLocalHooks();
    arrayEach(this.elements, ui => ui.destroy());
    this.state = null;
    this.elements = null;
    this.hot = null;
  }
}

mixin(BaseComponent, localHooks);

export default BaseComponent;
