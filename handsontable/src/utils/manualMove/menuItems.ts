import type { HotInstance } from '../../core/types';
import * as C from '../../i18n/constants';
import type { KeyboardMove } from './keyboardMove';
import type { StepDirection } from './stepMove';

/**
 * The keys of the menu items that move the selected columns or rows one place.
 */
export const MOVE_COLUMN_LEFT = 'move_column_left';
export const MOVE_COLUMN_RIGHT = 'move_column_right';
export const MOVE_ROW_UP = 'move_row_up';
export const MOVE_ROW_DOWN = 'move_row_down';

/**
 * Builds a menu item that moves the selected block one place.
 *
 * @param {KeyboardMove} mover The mover of the axis.
 * @param {string} key The item key.
 * @param {string} phrase The i18n phrase of the item's name.
 * @param {Function} getDirection Returns the direction of the move for the instance.
 * @returns {object}
 */
function createMoveItem(
  mover: KeyboardMove,
  key: string,
  phrase: string,
  getDirection: (hot: HotInstance) => StepDirection,
) {
  return {
    key,
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(phrase) as string;
    },
    callback(this: HotInstance) {
      mover.step(getDirection(this));
    },
    // `executeCommand()` reaches an item the menu hides, and it gates on `disabled`, not `hidden`. A step the
    // plugin refuses (an edge, the frozen end columns) is disabled too, so a click never does nothing.
    disabled(this: HotInstance) {
      return !mover.canStep(getDirection(this));
    },
    hidden() {
      return !mover.appliesToSelection();
    },
  };
}

/**
 * Builds the two column items. "Left" and "right" are the sides on the screen, so a right-to-left grid moves
 * "left" toward the higher visual indexes.
 *
 * @param {KeyboardMove} mover The column mover.
 * @returns {object[]}
 */
export function createColumnMoveItems(mover: KeyboardMove) {
  return [
    createMoveItem(mover, MOVE_COLUMN_LEFT, C.CONTEXTMENU_ITEMS_MOVE_COLUMN_LEFT, hot => (hot.isRtl() ? 1 : -1)),
    createMoveItem(mover, MOVE_COLUMN_RIGHT, C.CONTEXTMENU_ITEMS_MOVE_COLUMN_RIGHT, hot => (hot.isRtl() ? -1 : 1)),
  ];
}

/**
 * Builds the two row items.
 *
 * @param {KeyboardMove} mover The row mover.
 * @returns {object[]}
 */
export function createRowMoveItems(mover: KeyboardMove) {
  return [
    createMoveItem(mover, MOVE_ROW_UP, C.CONTEXTMENU_ITEMS_MOVE_ROW_UP, () => -1),
    createMoveItem(mover, MOVE_ROW_DOWN, C.CONTEXTMENU_ITEMS_MOVE_ROW_DOWN, () => 1),
  ];
}
