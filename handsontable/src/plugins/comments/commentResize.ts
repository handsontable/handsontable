import type { HotInstance } from '../../core/types';
import type { Context } from '../../shortcuts/context';
import { armPick, type ArmedPick } from '../../utils/armedPick';
import { announce } from '../../utils/a11yAnnouncer';
import * as C from '../../i18n/constants';
import type CommentEditor from './commentEditor';

/**
 * The pixels an arrow key changes the size of the comment editor by, and the pixels it changes it by with `Shift`.
 */
const STEP = 10;
const SMALL_STEP = 1;
/**
 * The smallest size the keyboard and a click can give the comment editor.
 */
const MIN_SIZE = 40;
/**
 * The side of the square at the corner of the editor where the browser draws its resize grip, in pixels.
 */
const GRIP_SIZE = 16;
/**
 * How far the pointer may move between the press on the grip and the release, in pixels, for them to be a click.
 */
const CLICK_TOLERANCE = 3;
/**
 * The class the editor carries while a pick waits for its click.
 */
const ARMED_CLASS_NAME = 'ht-comment-resize--armed';

/**
 * The two ways to resize the comment editor without dragging its grip: a resize mode driven by the arrow keys, and
 * "click, then click" (a click on the grip arms it, the next click on the grid names the corner of the editor). The
 * grip itself is the browser's, so a drag is left to it. The editor reports every size change to the plugin, which
 * saves it as the box size of the comment, so nothing here stores a size.
 */
export class CommentResize {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;

  /**
   * The comment editor.
   */
  #editor: CommentEditor;

  /**
   * The size the editor had when the keyboard resize started, or `null` when the keyboard resize is not on.
   */
  #keyboardStart: { width: number, height: number } | null = null;

  /**
   * The pick waiting for the click that names the corner of the editor, or `null` when none is.
   */
  #pick: ArmedPick | null = null;

  /**
   * Where the last primary press on the editor landed, and whether it landed on the grip.
   */
  #press: { x: number, y: number, onGrip: boolean } | null = null;

  /**
   * @param {HotInstance} hot The Handsontable instance.
   * @param {CommentEditor} editor The comment editor.
   */
  constructor(hot: HotInstance, editor: CommentEditor) {
    this.#hot = hot;
    this.#editor = editor;
  }

  /**
   * Registers the shortcuts that start the keyboard resize and steer it, in the context of the comment editor. The
   * ones that steer it sit before the shortcuts of the plugin, so `Escape` and `Enter` end the resize and do not
   * close the editor.
   *
   * @param {Context} context The shortcut context of the comment editor.
   * @param {string} group The group of the shortcuts of the plugin.
   */
  registerShortcuts(context: Context, group: string) {
    const whileActive = {
      runOnlyIf: () => this.#keyboardStart !== null,
      group,
      relativeToGroup: group,
      position: 'before' as const,
    };
    // wider (taller) is the arrow that points away from the start of the editor: down, and the inline end
    const growsWith = (key: string) => {
      if (key === 'ArrowDown') {
        return true;
      }

      return (key === 'ArrowRight') !== this.#hot.isRtl() && (key === 'ArrowRight' || key === 'ArrowLeft');
    };

    context.addShortcut({
      keys: [['Control/Meta', 'Alt', 'R']],
      callback: () => {
        this.#startKeyboardResize();

        return false;
      },
      runOnlyIf: () => this.#keyboardStart === null && this.#editor.isVisible() && this.#editor.isFocused(),
      group,
    });
    context.addShortcut({
      keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].flatMap(key => [[key], ['Shift', key]]),
      callback: (event: KeyboardEvent) => {
        const amount = (growsWith(event.key) ? 1 : -1) * (event.shiftKey ? SMALL_STEP : STEP);
        const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';

        this.#step(horizontal ? amount : 0, horizontal ? 0 : amount);

        return false;
      },
      ...whileActive,
    });
    context.addShortcut({
      keys: [['Enter']],
      callback: () => {
        this.#endKeyboardResize(true);

        return false;
      },
      ...whileActive,
    });
    context.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.#endKeyboardResize(false);

        return false;
      },
      ...whileActive,
    });
  }

  /**
   * Records a press on the editor, to tell a click on the grip from the start of a drag of it.
   *
   * @param {MouseEvent} event The `mousedown` event of the editor.
   */
  onInputMouseDown(event: MouseEvent) {
    // A press on the editor ends the pick that waits, as a press on the handle of a column or a row does.
    if (this.#pick) {
      this.#pick.cancel();
      this.#press = null;

      return;
    }

    this.#press = event.button === 0 ?
      { x: event.clientX, y: event.clientY, onGrip: this.#isOnGrip(event.clientX, event.clientY) } : null;
  }

  /**
   * Arms the "click, then click" resize when the release ends a click on the grip that did not drag it. The browser
   * keeps the grip to itself, and it is the release that always arrives, not a `click` event.
   *
   * @param {MouseEvent} event The `mouseup` event of the editor.
   */
  onInputMouseUp = (event: MouseEvent) => {
    const press = this.#press;

    this.#press = null;

    if (!press?.onGrip || this.#pick || this.#keyboardStart) {
      return;
    }

    if (Math.abs(event.clientX - press.x) > CLICK_TOLERANCE || Math.abs(event.clientY - press.y) > CLICK_TOLERANCE) {
      return;
    }

    this.#startPick();
  };

  /**
   * Ends whatever resize is waiting, without changing the size. The plugin calls it when it hides the editor.
   */
  cancel() {
    this.#keyboardStart = null;
    this.#pick?.cancel();
  }

  /**
   * Tells whether the point is on the corner where the browser draws the resize grip: the bottom corner of the
   * inline end of the editor.
   *
   * @param {number} x The horizontal position in the viewport.
   * @param {number} y The vertical position in the viewport.
   * @returns {boolean}
   */
  #isOnGrip(x: number, y: number): boolean {
    const input = this.#editor.getInputElement();

    if (!input) {
      return false;
    }

    const rect = input.getBoundingClientRect();
    const inInlineEnd = this.#hot.isRtl() ? x <= rect.left + GRIP_SIZE : x >= rect.right - GRIP_SIZE;

    return inInlineEnd && y >= rect.bottom - GRIP_SIZE;
  }

  /**
   * Starts waiting for the click that names the corner of the editor. The editor takes the focus, which holds it open
   * while the pointer crosses the grid, and the press that picks does not take it away.
   */
  #startPick() {
    const input = this.#editor.getInputElement();

    if (!input) {
      return;
    }

    this.#editor.focus();
    input.classList.add(ARMED_CLASS_NAME);
    this.#pick = armPick({
      doc: this.#hot.rootDocument,
      root: this.#hot.rootElement,
      isAnchor: target => target instanceof Node && input.contains(target),
      onPick: event => this.#applyPickedSize(event),
      onEnd: (reason) => {
        this.#pick = null;
        input.classList.remove(ARMED_CLASS_NAME);

        if (reason === 'escape') {
          announce(String(this.#hot.getTranslatedPhrase(C.ARMED_PICK_CANCELED) ?? ''), 'polite');
        }
      },
    });

    announce(String(this.#hot.getTranslatedPhrase(C.ARMED_PICK_STARTED) ?? ''), 'polite');
  }

  /**
   * Gives the editor the size that puts its corner on the click.
   *
   * @param {MouseEvent} event The click that picked the corner.
   */
  #applyPickedSize(event: MouseEvent) {
    const input = this.#editor.getInputElement();

    if (!input) {
      return;
    }

    const rect = input.getBoundingClientRect();
    const width = this.#hot.isRtl() ? rect.right - event.clientX : event.clientX - rect.left;

    const height = event.clientY - rect.top;

    this.#editor.setSize(Math.max(MIN_SIZE, Math.round(width)), Math.max(MIN_SIZE, Math.round(height)));
    this.#announceSize();
  }

  /**
   * Starts the keyboard resize: the arrow keys change the size, `Enter` keeps it and `Escape` puts the old one back.
   */
  #startKeyboardResize() {
    this.#pick?.cancel();
    this.#keyboardStart = this.#editor.getSize();
    announce(String(this.#hot.getTranslatedPhrase(C.MANUAL_RESIZE_COMMENT_STARTED) ?? ''), 'polite');
  }

  /**
   * Changes the size of the editor.
   *
   * @param {number} width The pixels to add to the width.
   * @param {number} height The pixels to add to the height.
   */
  #step(width: number, height: number) {
    const size = this.#editor.getSize();

    this.#editor.setSize(Math.max(MIN_SIZE, size.width + width), Math.max(MIN_SIZE, size.height + height));
    this.#announceSize();
  }

  /**
   * Ends the keyboard resize.
   *
   * @param {boolean} keep Whether to keep the size. Otherwise the size the resize started with comes back.
   */
  #endKeyboardResize(keep: boolean) {
    const start = this.#keyboardStart;

    this.#keyboardStart = null;

    if (keep) {
      this.#announceSize();

    } else if (start) {
      this.#editor.setSize(start.width, start.height);
      announce(String(this.#hot.getTranslatedPhrase(C.ARMED_PICK_CANCELED) ?? ''), 'polite');
    }
  }

  /**
   * Announces the size of the editor.
   */
  #announceSize() {
    const { width, height } = this.#editor.getSize();
    const widthPhrase = this.#hot.getTranslatedPhrase(C.MANUAL_RESIZE_WIDTH, { size: Math.round(width) });
    const heightPhrase = this.#hot.getTranslatedPhrase(C.MANUAL_RESIZE_HEIGHT, { size: Math.round(height) });

    announce(`${widthPhrase ?? ''}, ${heightPhrase ?? ''}`, 'polite');
  }
}
