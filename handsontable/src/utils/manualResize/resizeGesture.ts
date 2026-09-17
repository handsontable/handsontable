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
import {
  getElementScaleFactor,
  normalizeVisualDelta,
  shouldRefreshHandleAfterAutoResize,
  shouldSkipResizeHandlePositioning,
} from './utils';
import type { ResizeAxis } from './axis';

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
   * Stores a size for a visual index and returns the size actually stored.
   */
  setManualSize(index: number, size: number): number;
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
   * The size stored by the last write.
   */
  #newSize: number | null = null;
  /**
   * The pointer coordinate, along the resized axis, when the drag started.
   */
  #startPointer: number | null = null;
  /**
   * The header's size when the handle was positioned.
   */
  #startSize: number | null = null;
  /**
   * The header's offset, along the resized axis, when the handle was positioned.
   */
  #startOffset: number | null = null;
  /**
   * The CSS scale applied to the header along the resized axis.
   */
  #scaleFactor = 1;
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
  }

  /**
   * Returns the size the pointer described last, or `null` before the first drag.
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
   * Two consequences to know, neither introduced here. On a real disable – the plugin option set to
   * `false` rather than a re-init – `super.disablePlugin()` clears the events, so the "mouseup" never
   * arrives and the flag stays latched true; after a later re-enable `#onMouseMove` then reads
   * plain pointer movement as a drag and writes sizes from a stale start offset. And a drag in
   * flight when the re-init fires loses both elements until its "mouseup" positions the handle
   * again, because `enablePlugin()` does not re-attach them and `#onMouseOver` early-returns while
   * the flag is set – the resize itself still lands, so that one is visual only. An
   * `event.buttons === 0` check in `#onMouseMove` would close the latch, but the frozen Jasmine
   * helpers simulate "mousemove" without `buttons`, so it reds 41 of the 147 specs in the two plugin
   * suites and belongs with a sweep of those instead.
   */
  detach() {
    this.#hideHandleAndGuide();
    this.#handle.remove();
    this.#guide.remove();
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
      // `#newSize` is reset to `#startSize` on every press and written on mousemove, so they
      // still matching means a still hold: end the press so a later mousemove cannot
      // overwrite the autosize, and so the matching mouseup takes the idle branch instead of
      // firing the drag-end hooks a second time. A press that already moved is a drag – keep
      // `#pressed` so later mousemove/mouseup continue. `#setupHandlePosition` below then
      // resets `#startSize` the way a completed autosize always did.
      this.#hideHandleAndGuide();

      if (this.#newSize === this.#startSize) {
        this.#pressed = false;
      }

      if (this.#selectedIndexes.length > 1) {
        arrayEach(this.#selectedIndexes, index => resize(index));
        render();

      } else {
        arrayEach(this.#selectedIndexes, index => resize(index, true));
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

    this.#startOffset = alongOffset - 6;
    this.#startSize = this.#measureAlong(TH);
    this.#scaleFactor = getElementScaleFactor(TH, this.#axis.orientation);

    this.#handle.style[this.#alongProp()] = `${this.#startOffset + this.#startSize}px`;
    this.#handle.style[this.#acrossProp()] = `${acrossOffset}px`;
    this.#handle.style[this.#acrossExtentProp()] = `${headerAcrossSize}px`;
    this.#hot.rootElement.appendChild(this.#handle);
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
    this.#handle.style[this.#alongProp()] = `${(this.#startOffset ?? 0) + (this.#currentSize ?? 0)}px`;
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
      this.#setupHandlePosition(this.#currentTH);
      this.#setupGuidePosition();
      this.#pressed = true;

      if (this.#autoresizeTimeout === null) {
        this.#autoresizeTimeout = this.#hot._registerTimeout(() => this.afterMouseDownTimeout(), 500);
      }

      this.#dblclick += 1;
      this.#startPointer = this.#readPointer(event);
      this.#newSize = this.#startSize;
    }
  };

  /**
   * "mousemove" listener – stores the size the pointer describes and moves the handle and guide.
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
    const change = normalizeVisualDelta(visualChange, this.#scaleFactor);

    this.#currentSize = (this.#startSize ?? 0) + change;

    arrayEach(this.#selectedIndexes, (index) => {
      this.#newSize = this.#owner.setManualSize(index, this.#currentSize ?? 0);
    });

    this.#refreshHandlePosition();
    this.#refreshGuidePosition();
  };

  /**
   * "mouseup" listener – ends a drag and confirms the size through the resize hooks.
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

    this.#hideHandleAndGuide();
    this.#pressed = false;

    if (this.#newSize !== this.#startSize) {
      if (this.#selectedIndexes.length > 1) {
        arrayEach(this.#selectedIndexes, index => resize(index));
        render();

      } else {
        arrayEach(this.#selectedIndexes, index => resize(index, true));
      }
    }

    if (this.#currentTH) {
      this.#setupHandlePosition(this.#currentTH);
    }
  };

  /**
   * "contextmenu" listener on the handle – detaches the handle and guide and aborts any drag.
   */
  #onContextMenu = () => {
    this.detach();

    this.#pressed = false;
    this.#isTriggeredByRMB = true;

    // There is thrown "mouseover" event right after opening a context menu. This flag inform that handle
    // shouldn't be drawn just after removing it.
    (this.#hot as Record<string, (cb: () => void) => void>)._registerMicrotask(() => {
      this.#isTriggeredByRMB = false;
    });
  };
}
