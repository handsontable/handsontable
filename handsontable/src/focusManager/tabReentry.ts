import type { HotInstance } from '../core/types';

/**
 * The state a <kbd>Tab</kbd> back into the grid reads, per Handsontable instance.
 */
interface TabReentryState {
  /**
   * The cell a <kbd>Tab</kbd> back into the grid lands on, in visual coordinates, or `undefined`.
   */
  coords: Record<string, number> | undefined;
  /**
   * Whether the grid's selection was last removed by a <kbd>Tab</kbd> out of the grid, as
   * opposed to an outside click, an API call, or anything else that deselects.
   */
  leftByTab: boolean;
}

/**
 * The state of each instance. Kept here rather than on the focus manager, so it never becomes part
 * of the public type of `hot.getFocusManager()`.
 */
const states = new WeakMap<HotInstance, TabReentryState>();

/**
 * Returns the state of an instance, creating it on first use.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {TabReentryState} The instance's state.
 */
function stateOf(hot: HotInstance): TabReentryState {
  let state = states.get(hot);

  if (state === undefined) {
    state = { coords: undefined, leftByTab: false };
    states.set(hot, state);
  }

  return state;
}

/**
 * Returns the cell a <kbd>Tab</kbd> back into the grid lands on.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {object|undefined} The cell's `row` and `col`, or `undefined` when there is none.
 */
export function getTabReentryCoords(hot: HotInstance): Record<string, number> | undefined {
  return stateOf(hot).coords;
}

/**
 * Sets the cell a <kbd>Tab</kbd> back into the grid lands on.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {object|undefined} coords The cell's `row` and `col`, or `undefined` to forget it.
 */
export function setTabReentryCoords(hot: HotInstance, coords: Record<string, number> | undefined): void {
  stateOf(hot).coords = coords;
}

/**
 * Tells whether the grid's current lack of a selection comes from a <kbd>Tab</kbd> out of the grid.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {boolean} `true` when a <kbd>Tab</kbd> out of the grid removed the selection last.
 */
export function wasLeftByTab(hot: HotInstance): boolean {
  return stateOf(hot).leftByTab;
}

/**
 * Records what removed the grid's selection, or that a selection exists again.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {boolean} leftByTab `true` when a <kbd>Tab</kbd> out of the grid removed it.
 */
export function setLeftByTab(hot: HotInstance, leftByTab: boolean): void {
  stateOf(hot).leftByTab = leftByTab;
}
