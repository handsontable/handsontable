import type { HotInstance } from '../../core/types';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type EventManager from '../../eventManager';
import {
  addClass,
  eventTargetEl,
  hasClass,
  removeClass,
  outerHeight,
  outerWidth,
  isDetached
} from '../../helpers/dom/element';
import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { armPick, type ArmedPick } from '../armedPick';
import { announce } from '../a11yAnnouncer';
import * as C from '../../i18n/constants';
import { EDITOR_EDIT_GROUP, GRID_GROUP } from '../../shortcuts/contexts';
import {
  getElementScaleFactor,
  normalizeVisualDelta,
  shouldRefreshHandleAfterAutoResize,
  shouldSkipResizeHandlePositioning,
} from './utils';
import type { ResizeAxis } from './axis';
import type { OperationHold } from '../../core/operationScope';

/**
 * The pixels an arrow key changes the size by in the keyboard resize, and the pixels it changes it by with `Shift`.
 */
const STEP = 10;
const SMALL_STEP = 1;
/**
 * The keys the keyboard resize uses, and the modifiers pressed with them.
 */
const KEYBOARD_RESIZE_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Shift', 'Control', 'Alt', 'Meta',
]);

/**
 * A resize hook either axis fires.
 */
type ResizeHookName = ResizeAxis['beforeResizeHook'] | ResizeAxis['afterResizeHook'];

/**
 * What the gesture asks of the plugin that owns it.
 */
export interface ResizeGestureOwner {
  /**
   * Checks whether the owning plugin is currently switched on – the runtime flag that
   * `disablePlugin()` clears. Deliberately not called `isEnabled()`: `BasePlugin#isEnabled()` asks a
   * different question, whether the plugin option is truthy in the settings, and that stays true
   * through the `disablePlugin(); enablePlugin();` cycle `updatePlugin()` runs. Wiring this to the
   * settings answer would re-open the `afterMouseDownTimeout()` trap below.
   */
  isActive(): boolean;
  /**
   * Returns the size the owner would store for the given size, without storing it. The drag tracks
   * the pointer with it and writes nothing until the release.
   */
  clampSize(size: number): number;
  /**
   * Stores a size for a visual index and returns it after the minimum is applied. Nothing is stored
   * while the owner is disabled, for an index that does not exist, or for a size that is not finite; the
   * clamped size is returned all the same. The gesture records its own undo step, so this must not open one.
   */
  setManualSize(index: number, size: number): number;
  /**
   * Returns how much wider (taller) a header renders than the size the owner stores for it, because
   * something else adds to the stored size on every render. The drag starts from the stored size, so
   * that what it stores is the pointer's travel on top of it. Optional: an owner whose headers render
   * exactly their stored size leaves it out. The resize hooks and the stored size then report the size
   * without the overhead.
   */
  getRenderedOverhead?(index: number): number;
}

/**
 * Walks up from an element to the header cell that contains it.
 *
 * @param {HTMLElement} element The element to start from.
 * @returns {HTMLElement|null}
 */
function getClosestTHParent(element: HTMLElement): HTMLElement | null {
  if (element.tagName !== 'TABLE') {
    if (element.tagName === 'TH') {
      return element;
    }

    return getClosestTHParent(element.parentNode as HTMLElement);
  }

  return null;
}

/**
 * The drag gesture shared by the `ManualRowResize` and `ManualColumnResize` plugins: the resize
 * handle shown over a header edge, the guide shown while dragging, the press, double-click and
 * autoresize state, and the resize hooks fired when a drag ends.
 *
 * The gesture is written once, in terms of the axis being resized. `ResizeAxis#orientation` decides
 * which CSS property moves with the pointer and which one stays put, so a row moves the handle's
 * `top` while a column moves its inline edge. The inline edge flips under RTL, and RTL can change
 * through `updateSettings()`, so every CSS property is resolved when it is written rather than once
 * at construction.
 */
export class ResizeGesture {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * The axis being resized.
   */
  #axis: ResizeAxis;
  /**
   * The plugin that owns the gesture and stores the sizes.
   */
  #owner: ResizeGestureOwner;
  /**
   * The header the handle is currently positioned against.
   */
  #currentTH: HTMLTableHeaderCellElement | null = null;
  /**
   * The visual index of the header the handle is positioned against.
   */
  #currentIndex: number | null = null;
  /**
   * The visual indexes a drag resizes: every selected one when the drag starts inside a header
   * selection, otherwise just the dragged one.
   */
  #selectedIndexes: number[] = [];
  /**
   * The size the pointer currently describes.
   */
  #currentSize: number | null = null;
  /**
   * The size the release stores: the clamped pointer size during a drag, or the size a resize hook
   * answered with.
   */
  #newSize: number | null = null;
  /**
   * The pointer coordinate, along the resized axis, when the drag started.
   */
  #startPointer: number | null = null;
  /**
   * The size the owner stores for the header when the handle was positioned: the rendered size
   * without the owner's overhead. The release stores the drag from here.
   */
  #startSize: number | null = null;
  /**
   * The size the header rendered at when the handle was positioned. The handle and the guide sit
   * on the rendered edge.
   */
  #startRenderedSize: number | null = null;
  /**
   * How much wider the header renders than its stored size when the handle was positioned.
   */
  #startOverhead = 0;
  /**
   * The header's offset, along the resized axis, when the handle was positioned.
   */
  #startOffset: number | null = null;
  /**
   * The CSS scale applied to the header along the resized axis.
   */
  #scaleFactor = 1;
  /**
   * Whether the header is anchored to the inline-end edge of the grid (the frozen end columns). Its
   * inline-end edge never moves when the column is resized, the inline-start edge does. So the handle
   * sits on the inline-start edge, and dragging towards the inline start makes the column wider.
   */
  #anchoredAtInlineEnd = false;
  /**
   * The draggable resize handle.
   */
  #handle: HTMLElement;
  /**
   * The guide that shows the size being dragged.
   */
  #guide: HTMLElement;
  /**
   * Whether a drag is in progress.
   */
  #pressed = false;
  /**
   * The undo step a press opened and holds until the press ends, so the autosize a held second press
   * runs and the size its release stores are one step. A drag writes no size before the release.
   */
  #pendingStep: OperationHold | null = null;
  /**
   * Whether a context menu has just opened over the handle.
   */
  #isTriggeredByRMB = false;
  /**
   * The number of presses on the handle inside the current double-click window.
   */
  #dblclick = 0;
  /**
   * The pending double-click window, or `null` when none is armed.
   */
  #autoresizeTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * The "click, then click" gesture waiting for the click that names the size, or `null` when none is.
   */
  #pick: ArmedPick | null = null;

  /**
   * Whether the press that is ending found a pick waiting. That press ends it, and its release must not arm a new one.
   */
  #pressEndedPick = false;

  /**
   * Whether the keyboard resize mode is on: the handle and the guide follow the arrow keys, like a drag follows the
   * pointer, and nothing is stored until `Enter`.
   */
  #keyboardActive = false;

  /**
   * Creates the handle and the guide. Neither is attached until the pointer reaches a header.
   *
   * @param {HotInstance} hot The Handsontable instance.
   * @param {ResizeAxis} axis The axis being resized.
   * @param {ResizeGestureOwner} owner The plugin that owns the gesture.
   */
  constructor(hot: HotInstance, axis: ResizeAxis, owner: ResizeGestureOwner) {
    this.#hot = hot;
    this.#axis = axis;
    this.#owner = owner;
    this.#handle = hot.rootDocument.createElement('DIV');
    this.#guide = hot.rootDocument.createElement('DIV');

    addClass(this.#handle, axis.handleClassName);
    addClass(this.#guide, axis.guideClassName);
  }

  /**
   * Binds the pointer listeners through the owning plugin's event manager, so that
   * `BasePlugin#disablePlugin()` removes them.
   *
   * @param {EventManager} eventManager The owning plugin's event manager.
   */
  bindEvents(eventManager: EventManager) {
    const { rootElement, rootWindow } = this.#hot;

    eventManager.addEventListener(rootElement, 'mouseover', this.#onMouseOver);
    eventManager.addEventListener(rootElement, 'mousedown', this.#onMouseDown);
    eventManager.addEventListener(rootWindow, 'mousemove', this.#onMouseMove);
    eventManager.addEventListener(rootWindow, 'mouseup', this.#onMouseUp);
    eventManager.addEventListener(this.#handle, 'contextmenu', this.#onContextMenu);
    this.#hot.addHook('afterUndo', this.#onHistoryRestored);
    this.#hot.addHook('afterRedo', this.#onHistoryRestored);
    this.#hot.addHook('afterSelection', this.#onSelectionChange);
    this.#hot.addHook('beforeKeyDown', this.#onBeforeKeyDown);
  }

  /**
   * Registers the keyboard shortcuts of the resize in the grid context: the one that starts the resize, and the ones
   * that steer it while it runs. The owning plugin calls it from `enablePlugin()` and `unregisterShortcuts()` from
   * `disablePlugin()` and `destroy()`.
   */
  registerShortcuts() {
    const context = this.#hot.getShortcutManager().getContext('grid');
    const group = this.#axis.shortcutsGroup;
    const vertical = this.#isVertical();
    const arrows = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    // Wider (taller) is the arrow that points away from the start of the header: down, and the inline end.
    const growsWith = (key: string) => (vertical ? key === 'ArrowDown' : (key === 'ArrowRight') !== this.#hot.isRtl());
    const whileActive = {
      runOnlyIf: () => this.#keyboardActive,
      group,
      relativeToGroup: GRID_GROUP,
      position: 'before' as const,
      // the grid's own arrow keys, Enter and Escape must not run after these
      stopPropagation: true,
    };

    context?.addShortcut({
      keys: [['Control/Meta', 'Alt', 'R']],
      callback: () => {
        this.startKeyboardResize();

        // `false` ends the walk through the actions of the key, so the grid does not take the letter as an edit
        return false;
      },
      runOnlyIf: () => !this.#keyboardActive && this.#getKeyboardTarget() !== null,
      group,
      // the key is a letter, which the grid would otherwise take as the start of an edit
      stopPropagation: true,
      relativeToGroup: GRID_GROUP,
      position: 'before',
    });
    context?.addShortcut({
      keys: arrows.flatMap(key => [[key], ['Shift', key]]),
      callback: (event: KeyboardEvent) => {
        this.#stepKeyboardResize(growsWith(event.key) ? 1 : -1, event.shiftKey ? SMALL_STEP : STEP);

        return false;
      },
      ...whileActive,
    });
    context?.addShortcut({
      keys: [['Enter']],
      callback: () => {
        this.#endKeyboardResize(true);

        return false;
      },
      ...whileActive,
      // the grid opens the editor on Enter from the group of the editor, not from its default one
      relativeToGroup: EDITOR_EDIT_GROUP,
    });
    context?.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.#endKeyboardResize(false);

        return false;
      },
      ...whileActive,
    });
  }

  /**
   * Removes the shortcuts `registerShortcuts()` added and ends a keyboard resize that is running, without storing
   * anything: its header and indexes would be stale when the plugin is enabled again. A waiting pick stays, as it
   * does through `detach()`.
   */
  unregisterShortcuts() {
    this.#hot.getShortcutManager().getContext('grid')?.removeShortcutsByGroup(this.#axis.shortcutsGroup);

    if (this.#keyboardActive) {
      this.#keyboardActive = false;
      this.#newSize = this.#startSize;
      this.#hideHandleAndGuide();
    }
  }

  /**
   * Starts the keyboard way to resize: the handle and the guide show the size, the arrow keys change it, `Enter` stores
   * it and `Escape` leaves the size as it was. It resizes what a drag of the header's handle would: the selected
   * headers when the selection holds the whole of them, the header of the focused cell or header otherwise.
   *
   * @returns {boolean} `true` when the resize started.
   */
  startKeyboardResize(): boolean {
    const target = this.#getKeyboardTarget();

    if (!target || this.#keyboardActive) {
      return false;
    }

    this.#pick?.cancel();
    this.#startRenderedSize = null;
    this.#setupHandlePosition(target.header as HTMLTableHeaderCellElement);

    if (this.#currentIndex !== target.index || this.#startRenderedSize === null) {
      return false;
    }

    this.#keyboardActive = true;
    this.#newSize = this.#startSize;
    this.#currentSize = this.#startRenderedSize;
    this.#startPointer = 0;
    this.#setupGuidePosition();
    announce(String(this.#hot.getTranslatedPhrase(this.#axis.keyboardStartedPhrase) ?? ''), 'polite');

    return true;
  }

  /**
   * Finds the header the keyboard resize starts on: the one of the selection's highlight, when the axis answers for
   * the selection, the header can be resized and it is drawn.
   *
   * @returns {{ index: number, header: HTMLElement } | null}
   */
  #getKeyboardTarget(): { index: number, header: HTMLElement } | null {
    if (!this.#owner.isActive() || !this.#axis.ownsSelection(this.#hot)) {
      return null;
    }

    const highlight = this.#hot.getSelectedRangeLast()?.highlight;
    const index = highlight ? this.#axis.getCoordsIndex(highlight) : null;

    if (index === null || index < 0) {
      return null;
    }

    const header = this.#axis.getHeaderCell(this.#hot, index);

    return header && this.#axis.canResizeHeader(header) ? { index, header } : null;
  }

  /**
   * Changes the size the keyboard resize describes, and moves the handle and the guide to it.
   *
   * @param {1|-1} direction `1` to grow, `-1` to shrink.
   * @param {number} amount The pixels to change by.
   */
  #stepKeyboardResize(direction: 1 | -1, amount: number) {
    if (!this.#keyboardActive) {
      return;
    }

    this.#newSize = this.#owner.clampSize((this.#currentSize ?? 0) + (direction * amount) - this.#startOverhead);
    this.#currentSize = this.#newSize + this.#startOverhead;
    this.#refreshHandlePosition();
    this.#refreshGuidePosition();
    this.#announceSize();
  }

  /**
   * Ends the keyboard resize, storing the size it describes, or leaving the size as it was.
   *
   * @param {boolean} apply Whether to store the size.
   */
  #endKeyboardResize(apply: boolean) {
    if (!this.#keyboardActive) {
      return;
    }

    this.#keyboardActive = false;
    this.#hideHandleAndGuide();

    if (apply) {
      this.#runInStep(() => this.#storeNewSize());
      this.#announceSize();
    } else {
      this.#newSize = this.#startSize;
      announce(String(this.#hot.getTranslatedPhrase(C.ARMED_PICK_CANCELED) ?? ''), 'polite');
    }

    if (this.#currentTH?.isConnected) {
      this.#setupHandlePosition(this.#currentTH);
    }
  }

  /**
   * Announces the size of the keyboard resize.
   */
  #announceSize() {
    const phrase = this.#hot.getTranslatedPhrase(this.#axis.sizePhrase, { size: this.#newSize ?? 0 });

    announce(String(phrase ?? ''), 'polite');
  }

  /**
   * Returns the rendered size the pointer described last (the owner's overhead included), or `null`
   * before the first drag.
   *
   * @returns {number|null}
   */
  getCurrentSize(): number | null {
    return this.#currentSize;
  }

  /**
   * Detaches the resize handle and the resize guide from the root element and clears their active
   * state. The owning plugin calls it from `disablePlugin()` and `destroy()`, and the context menu
   * handler calls it too, so a plugin that is turned off leaves nothing of its own in the container.
   *
   * Both elements are detached with `remove()`, which is a no-op on an element that has no
   * parent. The guide is attached only once a "mousedown" over the handle reaches
   * `#onMouseDown`, so a context menu opened over a merely hovered handle reaches a guide that
   * was never attached, and `removeChild` threw there (DEV-2708).
   *
   * The pressed flag is deliberately NOT reset here, and that is a trade rather than a safe
   * default. `updatePlugin()` runs `disablePlugin(); enablePlugin();` on any `updateSettings()`
   * carrying the plugin's own key, which is what a framework wrapper sends on every re-render -
   * clearing the flag there would make the "mouseup" that ends an in-flight drag take the idle
   * branch, so the drag would be dropped with no after-resize hook and the dragged size never
   * confirmed. That path is common, so it wins. The context menu handler resets the flag at its own
   * call site, where aborting the drag is the point.
   *
   * The undo step the press holds is closed here, though. A drag writes no size before its
   * "mouseup", so that "mouseup" records the drag in a step of its own (`#runInStep()`), and a
   * real disable, whose "mouseup" never arrives, leaves no step held.
   *
   * Two consequences to know, neither introduced here. On a real disable – the plugin option set to
   * `false` rather than a re-init – `super.disablePlugin()` clears the events, so the "mouseup" never
   * arrives and the flag stays latched true; after a later re-enable `#onMouseMove` then reads
   * plain pointer movement as a drag, and the next "mouseup" stores a size from a stale start
   * offset. And a drag in
   * flight when the re-init fires loses both elements until its "mouseup" positions the handle
   * again, because `enablePlugin()` does not re-attach them and `#onMouseOver` early-returns while
   * the flag is set – the resize itself still lands, so that one is visual only. An
   * `event.buttons === 0` check in `#onMouseMove` would close the latch, but the frozen Jasmine
   * helpers simulate "mousemove" without `buttons`, so it reds 41 of the 147 specs in the two plugin
   * suites and belongs with a sweep of those instead.
   */
  detach() {
    // A pick and a keyboard resize survive it, as a drag does: `updatePlugin()` runs it on every wrapper re-render.
    this.#hideHandleAndGuide();
    this.#handle.remove();
    this.#guide.remove();
    this.#closeStep();
  }

  /**
   * Ends a drag without storing a size, the way opening a context menu over it does. The owner calls it
   * when the grid's data is replaced under the drag: the indexes it resizes belong to the data that
   * left, and the release would resize the tracks of the data that replaced it. It also ends the
   * double-click window, or the pending auto-size timer would auto-size the same index on the data that
   * replaced it, with a size and an undo step the user never asked for.
   */
  abort() {
    this.#dblclick = 0;
    // The indexes of a waiting pick and of a keyboard resize belong to the data that left, as a drag's do.
    this.#endWaitingResizes();

    if (!this.#pressed) {
      return;
    }

    this.detach();
    this.#pressed = false;
  }

  /**
   * Ends the "click, then click" pick and the keyboard resize, without storing a size and without an announcement.
   */
  #endWaitingResizes() {
    this.#pick?.cancel();
    this.#pressEndedPick = false;

    if (this.#keyboardActive) {
      this.#keyboardActive = false;
      this.#newSize = this.#startSize;
      this.#hideHandleAndGuide();
    }
  }

  /**
   * Removes the undo and redo listeners and detaches the handle and the guide.
   */
  destroy() {
    this.#hot.removeHook('afterUndo', this.#onHistoryRestored);
    this.#hot.removeHook('afterRedo', this.#onHistoryRestored);
    this.#hot.removeHook('afterSelection', this.#onSelectionChange);
    this.#hot.removeHook('beforeKeyDown', this.#onBeforeKeyDown);
    this.#endWaitingResizes();
    this.detach();
  }

  /**
   * Ends the double-click window, and applies the auto-size when the window saw a double-click.
   * A held second press hides the guide here rather than on mouseup (DEV-1038). A second press
   * that already moved the pointer is a drag: the press stays so mouseup can still save a size.
   *
   * @fires Hooks#beforeRowResize
   * @fires Hooks#afterRowResize
   * @fires Hooks#beforeColumnResize
   * @fires Hooks#afterColumnResize
   */
  afterMouseDownTimeout() {
    // A double-click arms this through `hot._registerTimeout`, which is only cleared by
    // `Core#destroy()` – so an `updateSettings()` turning the plugin off inside the 500ms window
    // leaves it pending on a plugin that is already off. Everything below would then be wrong: it
    // runs the resize hooks, writes through `setManualSize()` into a size map `disablePlugin()` has
    // already unregistered, renders, and ends by appending the handle back into the container the
    // teardown just cleaned. Reset the state the way a completed run does, so `#onMouseDown` can arm
    // a fresh timer after a re-enable – it only does so while `#autoresizeTimeout` is null.
    if (!this.#owner.isActive()) {
      this.#autoresizeTimeout = null;
      this.#dblclick = 0;

      return;
    }

    const shouldRefreshHandlePosition = shouldRefreshHandleAfterAutoResize(this.#currentTH, this.#dblclick);
    const render = () => {
      this.#hot.render();
    };
    const resize = (index: number, forceRender?: boolean) => {
      const hookNewSize = this.#runResizeHook(this.#axis.beforeResizeHook, index, true);

      if (hookNewSize === false) {
        return;
      }

      if (typeof hookNewSize === 'number') {
        this.#newSize = hookNewSize;
      }

      // A double-click stores the size the auto-size plugin answered the before-resize hook with.
      this.#owner.setManualSize(index, this.#newSize ?? 0);
      this.#runResizeHook(this.#axis.afterResizeHook, index, true);

      if (forceRender) {
        render();
      }
    };

    if (this.#dblclick >= 2) {
      // DEV-1038: the second mousedown already showed the guide, and autosize runs from this
      // timer rather than from mouseup. A hold after that press therefore used to leave the
      // guide `active` until the button came up. Hide it now. Do not detach – that is the
      // DEV-2719 flicker, and `#hideHandleAndGuide()` only strips `active`.
      //
      // `#newSize` is reset to `#startSize` on every press and updated on mousemove, so they
      // still matching means a still hold: end the press so a later mousemove cannot
      // overwrite the autosize, and so the matching mouseup takes the idle branch instead of
      // firing the drag-end hooks a second time. A press that already moved is a drag – keep
      // `#pressed` so later mousemove/mouseup continue. `#setupHandlePosition` below then
      // resets `#startSize` the way a completed autosize always did.
      this.#hideHandleAndGuide();

      const endsPress = this.#newSize === this.#startSize;

      if (endsPress) {
        this.#pressed = false;
      }

      this.#runInStep(() => {
        if (this.#selectedIndexes.length > 1) {
          arrayEach(this.#selectedIndexes, index => resize(index));
          render();

        } else {
          arrayEach(this.#selectedIndexes, index => resize(index, true));
        }
      });

      if (endsPress) {
        this.#closeStep();
      }
    }

    this.#autoresizeTimeout = null;
    this.#dblclick = 0;

    if (shouldRefreshHandlePosition && this.#currentTH) {
      this.#setupHandlePosition(this.#currentTH);
    }
  }

  /**
   * Checks whether the axis is resized vertically.
   *
   * @returns {boolean}
   */
  #isVertical() {
    return this.#axis.orientation === 'vertical';
  }

  /**
   * Returns the CSS property of the inline start edge, which flips under RTL.
   *
   * @returns {'left'|'right'}
   */
  #inlineStartProp(): 'left' | 'right' {
    return this.#hot.isRtl() ? 'right' : 'left';
  }

  /**
   * Returns the CSS property that moves with the pointer.
   *
   * @returns {'top'|'left'|'right'}
   */
  #alongProp(): 'top' | 'left' | 'right' {
    return this.#isVertical() ? 'top' : this.#inlineStartProp();
  }

  /**
   * Returns the CSS property that stays put while the pointer moves.
   *
   * @returns {'top'|'left'|'right'}
   */
  #acrossProp(): 'top' | 'left' | 'right' {
    return this.#isVertical() ? this.#inlineStartProp() : 'top';
  }

  /**
   * Returns the CSS property for the extent across the resized axis.
   *
   * @returns {'width'|'height'}
   */
  #acrossExtentProp(): 'width' | 'height' {
    return this.#isVertical() ? 'width' : 'height';
  }

  /**
   * Measures an element along the resized axis.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  #measureAlong(element: HTMLElement) {
    return this.#isVertical() ? outerHeight(element) : outerWidth(element);
  }

  /**
   * Measures an element across the resized axis.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  #measureAcross(element: HTMLElement) {
    return this.#isVertical() ? outerWidth(element) : outerHeight(element);
  }

  /**
   * Reads the pointer coordinate along the resized axis.
   *
   * @param {MouseEvent} event The mouse event.
   * @returns {number}
   */
  #readPointer(event: MouseEvent) {
    return this.#isVertical() ? event.pageY : event.pageX;
  }

  /**
   * Fires a resize hook with the size the axis reports for it.
   *
   * @param {string} hookName The hook to fire.
   * @param {number} index The visual index being resized.
   * @param {boolean} isDoubleClick Whether the resize comes from a double-click.
   * @returns {*} The value the hook returned.
   */
  #runResizeHook(hookName: ResizeHookName, index: number, isDoubleClick: boolean) {
    return this.#hot.runHooks(
      hookName, this.#axis.getHookSize(this.#hot, index, this.#newSize), index, isDoubleClick,
    );
  }

  /**
   * Positions the resize handle against a header.
   *
   * @param {HTMLTableHeaderCellElement} TH The header to position the handle against.
   */
  #setupHandlePosition(TH: HTMLTableHeaderCellElement) {
    if (shouldSkipResizeHandlePositioning(TH, this.#dblclick)) {
      return;
    }

    this.#currentTH = TH;

    const cellCoords = this.#hot.view._wt.wtTable.getCoords(TH);

    if (!cellCoords) {
      return;
    }

    const renderableIndex = this.#axis.getCoordsIndex(cellCoords);

    // Ignore the headers of the other axis.
    if (renderableIndex === null || renderableIndex < 0) {
      return;
    }

    const headerAcrossSize = this.#measureAcross(TH);
    const headerPosition = this.#axis.getHeaderPosition(this.#hot, TH, cellCoords);

    this.#currentIndex = this.#axis.getIndexMapper(this.#hot).getVisualFromRenderableIndex(renderableIndex);
    this.#selectedIndexes = this.#collectSelectedIndexes();

    if (this.#currentIndex === null) {
      return;
    }

    // Resizing element beyond the current selection (also when there is no selection).
    if (!this.#selectedIndexes.includes(this.#currentIndex)) {
      this.#selectedIndexes = [this.#currentIndex];
    }

    if (!headerPosition) {
      return;
    }

    const alongOffset = this.#isVertical() ? headerPosition.top : headerPosition.start;
    const acrossOffset = this.#isVertical() ? headerPosition.start : headerPosition.top;

    this.#anchoredAtInlineEnd = this.#axis.isAnchoredAtInlineEnd?.(this.#hot, TH) === true;
    this.#startRenderedSize = this.#measureAlong(TH);
    // The band's first header renders wider than its column by the freeze-line overlap, which is not its size.
    this.#startOverhead = (this.#owner.getRenderedOverhead?.(this.#currentIndex) ?? 0) +
      (this.#axis.getFreezeLineOverlap?.(this.#hot, TH) ?? 0);
    this.#startSize = this.#startRenderedSize - this.#startOverhead;

    const frozenEdge = this.#getFrozenEdge(this.#currentIndex);
    // On the edge before the end band the line a user sees is the band's, which covers this header's border.
    const edgeShift = frozenEdge.after && !this.#anchoredAtInlineEnd ?
      this.#axis.getEndBandEdgeShift?.(this.#hot) ?? 0 : 0;

    // The handle sits on the edge that moves: the inline-end one, or the inline-start one for a
    // header anchored to the inline end of the grid.
    this.#startOffset = alongOffset - 6 - edgeShift - (this.#anchoredAtInlineEnd ? this.#startRenderedSize : 0);
    this.#scaleFactor = getElementScaleFactor(TH, this.#axis.orientation);

    this.#handle.style[this.#alongProp()] = `${this.#startOffset + this.#startRenderedSize}px`;
    this.#handle.style[this.#acrossProp()] = `${acrossOffset}px`;
    this.#handle.style[this.#acrossExtentProp()] = `${headerAcrossSize}px`;
    this.#handle.classList.toggle('ht-resize-handle--freeze-before', frozenEdge.before);
    this.#handle.classList.toggle('ht-resize-handle--freeze-after', frozenEdge.after);
    this.#hot.rootElement.appendChild(this.#handle);
  }

  /**
   * Tells whether the edge the handle sits on is the edge of a frozen band: `before` when the band ends there
   * (the first rows or columns), `after` when it starts there (the last ones). The handle carries them as
   * `--freeze-before` and `--freeze-after`; the marks only describe the grid, and a stylesheet that draws something
   * on the frozen edge uses them to keep the handle clear of it.
   *
   * @param {number} visualIndex The visual index of the header the handle belongs to.
   * @returns {{ before: boolean, after: boolean }}
   */
  #getFrozenEdge(visualIndex: number): { before: boolean; after: boolean } {
    const hot = this.#hot;
    const vertical = this.#isVertical();
    // the number of tracks before the edge the handle sits on
    const tracksBefore = this.#anchoredAtInlineEnd ? visualIndex : visualIndex + 1;
    const total = vertical ? hot.countRows() : hot.countCols();
    // The bands the grid DRAWS: with `limitFixedToViewport` they can be smaller than the configured counts, and a
    // freeze bar sits on the drawn line.
    const before = vertical ? hot.view.countFixedRowsTop() : hot.view.countFixedColumnsStart();
    const after = vertical ? hot.view.countFixedRowsBottom() : hot.view.countFixedColumnsEnd();

    return {
      before: !!before && tracksBefore === before,
      after: !!after && tracksBefore === total - after,
    };
  }

  /**
   * Collects the visual indexes a drag resizes when it starts inside a header selection.
   *
   * @returns {number[]}
   */
  #collectSelectedIndexes() {
    const { selection } = this.#hot;
    const selectedIndexes: number[] = [];
    const isFullySelected = selection.isSelectedByCorner() || this.#axis.isSelectedByHeader(this.#hot);

    if (selection.isSelected() && isFullySelected) {
      const selectionRanges = this.#hot.getSelectedRange() ?? [];
      const seenIndexes = new Set<number>();

      arrayEach(selectionRanges, (selectionRange) => {
        const fromIndex = this.#axis.getCoordsIndex((selectionRange as CellRange).getTopStartCorner());
        const toIndex = this.#axis.getCoordsIndex((selectionRange as CellRange).getBottomEndCorner());

        if (fromIndex === null || toIndex === null) {
          return;
        }

        // Add every selected index for resize action.
        rangeEach(fromIndex, toIndex, (index) => {
          if (!seenIndexes.has(index)) {
            seenIndexes.add(index);
            selectedIndexes.push(index);
          }
        });
      });
    }

    return selectedIndexes;
  }

  /**
   * Moves the resize handle to the size the pointer describes.
   */
  #refreshHandlePosition() {
    const startSize = this.#startRenderedSize ?? 0;
    const currentSize = this.#currentSize ?? 0;
    // A header anchored to the inline end grows towards the inline start, so its handle moves that way.
    const handleSize = this.#anchoredAtInlineEnd ? (2 * startSize) - currentSize : currentSize;

    this.#handle.style[this.#alongProp()] = `${(this.#startOffset ?? 0) + handleSize}px`;
  }

  /**
   * Attaches the resize guide next to the handle, spanning the table.
   */
  #setupGuidePosition() {
    const handleAcrossSize = this.#measureAcross(this.#handle);
    const handleAcrossEnd = Number.parseInt(this.#handle.style[this.#acrossProp()], 10) + handleAcrossSize;
    const tableAcrossSize = this.#isVertical() ? this.#hot.view.getTableWidth() : this.#hot.view.getTableHeight();

    addClass(this.#handle, 'active');
    addClass(this.#guide, 'active');

    this.#guide.style[this.#acrossProp()] = `${handleAcrossEnd}px`;
    this.#refreshGuidePosition();
    this.#guide.style[this.#acrossExtentProp()] = `${tableAcrossSize - handleAcrossSize}px`;
    this.#hot.rootElement.appendChild(this.#guide);
  }

  /**
   * Moves the resize guide along with the handle.
   */
  #refreshGuidePosition() {
    this.#guide.style[this.#alongProp()] = this.#handle.style[this.#alongProp()];
  }

  /**
   * Hides both the resize handle and the resize guide. It does not detach either of them – see
   * `detach()`, and do not move the detach in here: `#onMouseUp` calls this and then positions the
   * handle again, which early-returns on the second "mouseup" of a double-click, so a detach here
   * would leave the handle gone for the 500ms until `afterMouseDownTimeout()` restores it.
   */
  #hideHandleAndGuide() {
    removeClass(this.#handle, 'active');
    removeClass(this.#guide, 'active');
  }

  /**
   * A new selection ends the keyboard resize without storing anything: the size belonged to the header that had the
   * focus.
   */
  #onSelectionChange = () => {
    this.#endKeyboardResize(false);
  };

  /**
   * A key the keyboard resize does not use ends it without storing anything: the arrow keys, `Enter`, `Escape` and
   * the modifiers stay with the resize, and any other key (a character that opens the editor, `Delete`, `Tab`) is for
   * the grid, which would otherwise act with the guide still drawn.
   *
   * @param {KeyboardEvent} event The keydown event.
   */
  #onBeforeKeyDown = (event: KeyboardEvent) => {
    if (this.#keyboardActive && !KEYBOARD_RESIZE_KEYS.has(event.key)) {
      this.#endKeyboardResize(false);
    }
  };

  /**
   * Repositions the attached handle from the header it belongs to.
   */
  #onHistoryRestored = () => {
    // The press holds an empty undo step, so undo stays available. Rebuilding the snapshot
    // here would make the next mousemove apply the original pointer delta to the new size.
    if (this.#pressed || !this.#handle.isConnected) {
      return;
    }

    // Undo can remove the hovered header. Positioning then returns early and the handle
    // stays over the empty space where that header was.
    if (this.#currentTH === null || !this.#currentTH.isConnected) {
      this.detach();

      return;
    }

    this.#setupHandlePosition(this.#currentTH);
  };

  /**
   * "mouseover" listener – positions the handle over the hovered header.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseOver = (event: MouseEvent) => {
    const target = eventTargetEl(event)!;

    // Workaround for #6926 – if the `event.target` is temporarily detached, we can skip this callback and wait for
    // the next `onmouseover`.
    if (isDetached(target)) {
      return;
    }

    // A "mouseover" action is triggered right after executing "contextmenu" event. It should be ignored.
    if (this.#isTriggeredByRMB === true) {
      return;
    }

    // The handle stays on the header it armed, or the click that picks the size would resize another one.
    if (this.#pick || this.#keyboardActive) {
      return;
    }

    if (!this.#axis.isHeaderElement(this.#hot, target)) {
      return;
    }

    const th = getClosestTHParent(target);

    if (th && this.#axis.canResizeHeader(th) && !this.#pressed) {
      this.#setupHandlePosition(th as HTMLTableHeaderCellElement);
    }
  };

  /**
   * "mousedown" listener – starts a drag on the handle, and counts it towards a double-click.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseDown = (event: MouseEvent) => {
    const target = eventTargetEl(event)!;

    if (target.parentNode !== this.#hot.rootElement) {
      return;
    }

    if (hasClass(target, this.#axis.handleClassName) && this.#currentTH) {
      // A press on the handle ends the pick that waits for a click, and its release must not arm another one.
      this.#pressEndedPick = this.#pick !== null;
      this.#pick?.cancel();
      this.#endKeyboardResize(false);
      this.#setupHandlePosition(this.#currentTH);
      this.#setupGuidePosition();
      this.#pressed = true;
      // A step still held here was left by a drag whose "mouseup" never arrived. Close it, so this
      // press starts a fresh one.
      this.#closeStep();
      this.#openStep();

      if (this.#autoresizeTimeout === null) {
        this.#autoresizeTimeout = this.#hot._registerTimeout(() => this.afterMouseDownTimeout(), 500);
      }

      this.#dblclick += 1;
      this.#startPointer = this.#readPointer(event);
      this.#newSize = this.#startSize;
      // A handle press never reaches `onCellMouseDown`, which is what listens for a header TH.
      this.#hot.listen();
    }
  };

  /**
   * "mousemove" listener – tracks the size the pointer describes and moves the handle and guide.
   * Nothing is stored until the release: a step that settles during the drag (an edit made while
   * the button is down) must not record a half-dragged size.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseMove = (event: MouseEvent) => {
    if (!this.#pressed) {
      return;
    }

    const pointerChange = this.#readPointer(event) - (this.#startPointer ?? 0);
    // The inline axis runs the other way under RTL; the block axis never does.
    const visualChange = this.#isVertical() ? pointerChange : pointerChange * this.#hot.getDirectionFactor();
    const change = normalizeVisualDelta(this.#anchoredAtInlineEnd ? -visualChange : visualChange, this.#scaleFactor);

    // The handle follows the rendered size, and the release stores the size without the overhead.
    this.#currentSize = (this.#startRenderedSize ?? 0) + change;
    this.#newSize = this.#owner.clampSize(this.#currentSize - this.#startOverhead);

    this.#refreshHandlePosition();
    this.#refreshGuidePosition();
  };

  /**
   * "mouseup" listener – ends a drag, stores the dragged size and confirms it through the resize
   * hooks. The size is stored before the hooks run, because the row axis reports the height it reads
   * back (see `ResizeAxis#getHookSize`).
   *
   * @fires Hooks#beforeRowResize
   * @fires Hooks#afterRowResize
   * @fires Hooks#beforeColumnResize
   * @fires Hooks#afterColumnResize
   */
  #onMouseUp = () => {
    if (!this.#pressed) {
      return;
    }

    const wasPlainClick = this.#newSize === this.#startSize && this.#dblclick === 1 && !this.#pressEndedPick;

    this.#pressEndedPick = false;
    this.#hideHandleAndGuide();
    this.#pressed = false;

    this.#runInStep(() => this.#storeNewSize());
    this.#closeStep();

    if (this.#currentTH) {
      this.#setupHandlePosition(this.#currentTH);
    }

    // A click on the handle that dragged nothing is the first click of "click, then click". A double-click is the
    // auto-size, so its second press ends the pick (`#onMouseDown`).
    if (wasPlainClick && !this.#isTriggeredByRMB) {
      this.#startPick();
    }
  };

  /**
   * Stores the size the drag, the pick or the keyboard described for every index it resizes, then confirms it through
   * the resize hooks. The size is stored before the hooks run, because the row axis reports the height it reads back
   * (see `ResizeAxis#getHookSize`). A size equal to the start size changes nothing.
   *
   * @fires Hooks#beforeRowResize
   * @fires Hooks#afterRowResize
   * @fires Hooks#beforeColumnResize
   * @fires Hooks#afterColumnResize
   */
  #storeNewSize() {
    if (this.#newSize === this.#startSize) {
      return;
    }

    const render = () => {
      this.#hot.render();
    };
    const resize = (index: number, forceRender?: boolean) => {
      const hookNewSize = this.#runResizeHook(this.#axis.beforeResizeHook, index, false);

      if (hookNewSize === false) {
        this.#owner.setManualSize(index, this.#startSize ?? 0);
        this.#newSize = this.#startSize;

      } else if (typeof hookNewSize === 'number') {
        this.#newSize = hookNewSize;
        this.#owner.setManualSize(index, this.#newSize);
      }

      if (forceRender) {
        render();
      }

      if (hookNewSize !== false) {
        this.#runResizeHook(this.#axis.afterResizeHook, index, false);
      }
    };
    const draggedSize = this.#newSize ?? 0;

    arrayEach(this.#selectedIndexes, (index) => {
      this.#owner.setManualSize(index, draggedSize);
    });

    if (this.#selectedIndexes.length > 1) {
      arrayEach(this.#selectedIndexes, index => resize(index));
      render();

    } else {
      arrayEach(this.#selectedIndexes, index => resize(index, true));
    }
  }

  /**
   * Starts waiting for the click that names the size, the single-pointer way to do what a drag of the handle does. The
   * header stays the one the handle was on, however far the pointer goes before the click, so `#currentTH` and the
   * indexes of the press are what the click resizes.
   */
  #startPick() {
    if (this.#pick || !this.#currentTH) {
      return;
    }

    const { rootDocument, rootElement } = this.#hot;

    this.#handle.classList.add('ht-resize-handle--armed');
    this.#pick = armPick({
      doc: rootDocument,
      root: rootElement,
      // a press on the handle is left to it: it ends the pick (`#onMouseDown`), or becomes a drag or a double-click
      isAnchor: target => target instanceof Node && this.#handle.contains(target),
      onPick: event => this.#applyPickedSize(event),
      onEnd: (reason) => {
        this.#pick = null;
        this.#handle.classList.remove('ht-resize-handle--armed');

        if (reason === 'escape') {
          announce(String(this.#hot.getTranslatedPhrase(C.ARMED_PICK_CANCELED) ?? ''), 'polite');
        }
      },
    });

    // The first release of a double-click arms the pick too, and the second press ends it: announce only a pick that
    // outlived the double-click window.
    const pick = this.#pick;

    this.#hot._registerTimeout(() => {
      if (this.#pick === pick) {
        announce(String(this.#hot.getTranslatedPhrase(C.ARMED_PICK_STARTED) ?? ''), 'polite');
      }
    }, 500);
  }

  /**
   * Resizes to the size a click describes: the distance from the start of the header to the click, along the axis. A
   * click that lands at the start of the header or before it picks the owner's minimum, as a drag past it does.
   *
   * @param {MouseEvent} event The click that picked the size.
   */
  #applyPickedSize(event: MouseEvent) {
    const header = this.#currentTH;

    if (!header?.isConnected || this.#startSize === null || !this.#owner.isActive() || !this.#isStillOnIndex(header)) {
      return;
    }

    const rect = header.getBoundingClientRect();
    const rtl = this.#hot.isRtl();
    let rendered: number;

    if (this.#isVertical()) {
      rendered = event.clientY - rect.top;
    } else if (this.#anchoredAtInlineEnd) {
      rendered = rtl ? event.clientX - rect.left : rect.right - event.clientX;
    } else {
      rendered = rtl ? rect.right - event.clientX : event.clientX - rect.left;
    }

    this.#currentSize = normalizeVisualDelta(rendered, this.#scaleFactor);
    this.#newSize = this.#owner.clampSize(this.#currentSize - this.#startOverhead);
    this.#runInStep(() => this.#storeNewSize());
    this.#setupHandlePosition(header as HTMLTableHeaderCellElement);
  }

  /**
   * Tells whether a header still belongs to the index the handle was set up for. The grid recycles its header
   * elements when it scrolls, so one that the pick waited on can be another column or row by the time the click comes.
   *
   * @param {HTMLElement} header The header the handle was set up against.
   * @returns {boolean}
   */
  #isStillOnIndex(header: HTMLElement): boolean {
    const coords = this.#hot.view._wt.wtTable.getCoords(header);
    const renderableIndex = coords ? this.#axis.getCoordsIndex(coords) : null;

    if (renderableIndex === null || renderableIndex < 0) {
      return false;
    }

    return this.#axis.getIndexMapper(this.#hot).getVisualFromRenderableIndex(renderableIndex) === this.#currentIndex;
  }

  /**
   * Opens the undo step of a press and holds it until the press ends.
   */
  #openStep() {
    const scope = this.#hot._getOperationScope();

    scope.run(this.#axis.operationName, this.#axis.operationSource, () => {
      this.#pendingStep = scope.hold();
    });
  }

  /**
   * Runs a resize in the undo step of the press, or in a step of its own when no press holds one.
   *
   * @param {Function} callback The resize.
   */
  #runInStep(callback: () => void) {
    if (this.#pendingStep !== null) {
      this.#pendingStep.resume(callback);
    } else {
      this.#hot.runOperation(this.#axis.operationName, callback, this.#axis.operationSource);
    }
  }

  /**
   * Releases the undo step of a press, which records it.
   */
  #closeStep() {
    const step = this.#pendingStep;

    this.#pendingStep = null;
    step?.release();
  }

  /**
   * "contextmenu" listener on the handle – detaches the handle and guide and aborts any drag.
   */
  #onContextMenu = () => {
    // Also closes the step of the drag, which stored no size yet: an aborted drag keeps the size
    // it started from.
    this.detach();
    this.#endWaitingResizes();

    this.#pressed = false;
    this.#isTriggeredByRMB = true;

    // There is thrown "mouseover" event right after opening a context menu. This flag inform that handle
    // shouldn't be drawn just after removing it.
    (this.#hot as Record<string, (cb: () => void) => void>)._registerMicrotask(() => {
      this.#isTriggeredByRMB = false;
    });
  };
}
