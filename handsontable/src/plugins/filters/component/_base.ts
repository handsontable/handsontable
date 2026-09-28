import type { HotInstance } from '../../../core/types';
import { arrayEach } from '../../../helpers/array';
import { throwWithCause } from '../../../helpers/errors';
import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';

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
  /**
   * Predicate supplied by the owning plugin, re-evaluated on every read of `isHiddenInMenu()`.
   *
   * It answers questions the `hidden` flag cannot, because they depend on state that changes
   * between menu openings rather than on a `hide()`/`show()` call - which column the menu was
   * opened on, or whether a data provider filters server-side.
   *
   * @type {function(): boolean | undefined}
   */
  #hiddenWhen: (() => boolean) | undefined;

  /**
   * Initializes the filter component with a Handsontable instance, assigns the component ID, and optionally registers a column index map for stateful components.
   */
  constructor(hotInstance: HotInstance, { id, stateless = true, hiddenWhen }: {
    id: string; stateless?: boolean; hiddenWhen?: (() => boolean);
  }) {
    this.hot = hotInstance;
    this.id = id;
    this.stateId = `Filters.component.${this.id}`;
    this.#hiddenWhen = hiddenWhen;
    this.state = stateless
      ? null : this.hot.columnIndexMapper.createAndRegisterIndexMap(this.stateId, 'linkedPhysicalIndexToValue');
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
   * Answers the `hide()`/`show()` flag ONLY. `hiddenWhen` is deliberately not folded in: this is
   * also what `Filters.restoreComponents()` tests, and a component that merely does not render for
   * the open column must still restore its state, or the state map keeps whatever it held when the
   * menu was last confirmed.
   *
   * @returns {boolean}
   */
  isHidden() {
    return this.hot === null || this.hidden;
  }

  /**
   * Check if the component's menu item should render for the column the menu was opened on.
   *
   * Separate from `isHidden()` because the two questions have different answers and different
   * consumers: this one is re-evaluated per menu opening and is read only by the menu item
   * descriptor, so hiding an item never changes what the component stores.
   *
   * @returns {boolean}
   */
  isHiddenInMenu() {
    if (this.isHidden()) {
      return true;
    }

    return typeof this.#hiddenWhen === 'function' && this.#hiddenWhen();
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
  getState(): Record<string, unknown> | string {
    throwWithCause('The state gathering logic is not implemented');

    return {};
  }

  /**
   * Returns the menu item descriptor for this component (used to add it to the dropdown menu).
   *
   * @returns {object}
   */
  getMenuItemDescriptor(): Record<string, unknown> {
    throwWithCause('The menu item descriptor logic is not implemented');

    return {};
  }

  /**
   * Destroy element.
   */
  destroy() {
    this.hot?.columnIndexMapper.unregisterMap(this.stateId);
    this.clearLocalHooks();
    arrayEach(this.elements, ui => (ui as { destroy: () => void }).destroy());
    this.state = null;
    this.elements.length = 0;
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
