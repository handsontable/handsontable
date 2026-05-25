import type { HotInstance } from '../../../core/types';
import { arrayEach } from '../../../helpers/array';
import { throwWithCause } from '../../../helpers/errors';
import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import { LinkedPhysicalIndexToValueMap as IndexToValueMap } from '../../../translations';

/**
 * @private
 * @class BaseComponent
 */
export class BaseComponent {
  /**
   * The Handsontable instance.
   *
   * @type {Core}
   */
  declare hot: HotInstance | null;
  /**
   * The component uniq id.
   *
   * @type {string}
   */
  id;
  /**
   * List of registered component UI elements.
   *
   * @type {Array}
   */
  elements: unknown[] = [];
  /**
   * Flag which determines if element is hidden.
   *
   * @type {boolean}
   */
  hidden = false;
  /**
   * The component states id.
   *
   * @type {string}
   */
  stateId = '';
  /**
   * Index map which stores component states for each column.
   *
   * @type {LinkedPhysicalIndexToValueMap|null}
   */
  state;

  constructor(hotInstance: HotInstance, { id, stateless = true }: { id: string; stateless?: boolean }) {
    this.hot = hotInstance;
    this.id = id;
    this.stateId = `Filters.component.${this.id}`;
    this.state = stateless ? null : this.hot.columnIndexMapper.registerMap(this.stateId, new IndexToValueMap());
  }

  /**
   * Gets the list of elements from which the component is built.
   *
   * @returns {BaseUI[]}
   */
  getElements() {
    return this.elements;
  }

  /**
   * Reset elements to its initial state.
   */
  reset() {
    arrayEach(this.elements, ui => (ui as { reset: () => void }).reset());
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
  restoreState(physicalColumn: number) {
    if (this.state) {
      this.setState(this.state.getValueAtIndex(physicalColumn));
    }
  }

  /**
   * The custom logic for component state restoring.
   */
  setState(_value?: unknown) {
    throwWithCause('The state setting logic is not implemented');
  }

  /**
   * Saves the component state to the given physical column index. The method
   * internally calls the `getState` method, which returns the current state of
   * the component.
   *
   * @param {number} physicalColumn The physical column index.
   */
  saveState(physicalColumn: number) {
    if (this.state) {
      this.state.setValueAtIndex(physicalColumn, this.getState());
    }
  }

  /**
   * The custom logic for component state gathering (for stateful components).
   */
  getState() {
    throwWithCause('The state gathering logic is not implemented');
  }

  /**
   * Destroy element.
   */
  destroy() {
    this.hot.columnIndexMapper.unregisterMap(this.stateId);
    this.clearLocalHooks();
    arrayEach(this.elements, ui => (ui as { destroy: () => void }).destroy());
    this.state = null;
    this.elements = null;
    this.hot = null;
  }
}

export interface BaseComponent {
  addLocalHook(key: string, callback: Function): this;
  removeLocalHook(key: string, callback: Function): this;
  runLocalHooks(key: string, ...args: unknown[]): void;
  clearLocalHooks(): this;
}

mixin(BaseComponent, localHooks);
