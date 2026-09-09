import { debounce } from '../../helpers/function';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

const DEFAULT_DISPLAY_DELAY = 250;
const DEFAULT_HIDE_DELAY = 250;

/**
 * Display switch for the Comments plugin. Manages the time of delayed displaying / hiding comments.
 *
 * @private
 * @class DisplaySwitch
 */
class DisplaySwitch {
  /**
   * Flag to determine if comment can be showed or hidden. State `true` mean that last performed action
   * was an attempt to show comment element. State `false` mean that it was attempt to hide comment element.
   *
   * @type {boolean}
   */
  wasLastActionShow = true;
  /**
   * Registers a local hook listener scoped to this instance. Provided by the `localHooks` mixin.
   */
  declare addLocalHook: (key: string, callback: Function) => void;
  /**
   * Executes all local hook listeners registered under the given name. Provided by the `localHooks` mixin.
   */
  declare runLocalHooks: Function;
  /**
   * Removes all local hook listeners. Provided by the `localHooks` mixin.
   */
  declare clearLocalHooks: Function;
  /**
   * Show comment after predefined delay. It keeps reference to immutable `debounce` function.
   *
   * @type {Function}
   */
  showDebounced: (((...args: unknown[]) => unknown) & { cancel: () => void }) | null = null;
  /**
   * Reference to timer, run by `setTimeout`, which is hiding comment.
   *
   * @type {number}
   */
  hidingTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initializes the display switch and configures the debounced show delay.
   */
  constructor(displayDelay: number) {
    this.updateDelay(displayDelay);
  }

  /**
   * Responsible for hiding comment after proper delay.
   */
  hide() {
    this.wasLastActionShow = false;

    this.hidingTimer = setTimeout(() => {
      if (this.wasLastActionShow === false) {
        this.runLocalHooks('hide');
      }
    }, DEFAULT_HIDE_DELAY);
  }

  /**
   * Responsible for showing comment after proper delay.
   *
   * @param {object} range Coordinates of selected cell.
   */
  show(range: object) {
    this.wasLastActionShow = true;
    this.showDebounced?.(range);
  }

  /**
   * Cancel hiding comment.
   */
  cancelHiding() {
    this.wasLastActionShow = true;

    clearTimeout(this.hidingTimer ?? undefined);
    this.hidingTimer = null;
  }

  /**
   * Keeps the comment that is on screen on screen: cancels a pending hide, and drops a pending
   * show as well.
   *
   * Dropping the show is what separates this from `cancelHiding()`, and it is required rather than
   * tidy. `cancelHiding()` also sets `wasLastActionShow` back to `true`, which is the only thing
   * suppressing a show that a `hide()` had already overruled - so cancelling a hide on its own
   * revives that show, and the comment on screen is replaced by another cell's a moment later.
   * The caller here is reacting to the pointer resting ON the editor, where the comment already
   * displayed is the one that belongs there.
   */
  keepVisible() {
    this.showDebounced?.cancel();
    this.cancelHiding();
  }

  /**
   * Update the switch settings.
   *
   * @param {number} displayDelay Delay of showing the comments (in milliseconds).
   */
  updateDelay(displayDelay = DEFAULT_DISPLAY_DELAY) {
    this.showDebounced = debounce((range) => {
      if (this.wasLastActionShow) {
        const r = range as { from: { row: number; col: number } };

        this.runLocalHooks('show', r.from.row, r.from.col);
      }
    }, displayDelay);
  }

  /**
   * Destroy the switcher.
   */
  destroy() {
    this.clearLocalHooks();
  }
}

mixin(DisplaySwitch, localHooks);

export default DisplaySwitch;
