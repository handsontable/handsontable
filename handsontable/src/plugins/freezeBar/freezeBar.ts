import { BasePlugin } from '../base';
import { A11Y_LABEL } from '../../helpers/a11y';
import * as C from '../../i18n/constants';
import { setAttribute } from '../../helpers/dom/element';
import { getRenderedRowHeight } from '../../core/viewportScroll/scrollStrategies/singleScroll';
import { getMaxFittingFrozenCount } from '../../utils/frozenAreaFit';
import { getElementScaleFactor, normalizeVisualDelta } from '../../utils/manualResize/utils';
import { resolveFreezeCount } from './snapResolver';
import type { FreezeBarSettings, FreezeEdge, FreezeSource } from './types';

export const PLUGIN_KEY = 'freezeBar';
export const PLUGIN_PRIORITY = 380;

const SHORTCUTS_GROUP = PLUGIN_KEY;

/**
 * The size that always stays scrollable, in pixels. The frozen area never grows into it.
 */
const MIN_SCROLLABLE_SIZE = 40;
const EDGES: readonly FreezeEdge[] = ['start', 'top', 'end', 'bottom'];

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Frame {
  rootRect: DOMRect;
  /**
   * The part of the root element in view, without the scrollbars.
   */
  viewport: Rect;
  /**
   * The whole content of the grid, as if nothing were clipped.
   */
  content: Rect;
  /**
   * The viewport cut down to the content: where the frozen bands really are.
   */
  rendered: Rect;
}

const isColumnEdge = (edge: FreezeEdge) => edge === 'start' || edge === 'end';
const growsFromStart = (edge: FreezeEdge) => edge === 'start' || edge === 'top';

/**
 * @plugin FreezeBar
 * @class FreezeBar
 * @since 19.0.0
 *
 * @description
 * The plugin draws a bar on each edge of the frozen area. Drag the bar, or focus it and press the arrow keys, to
 * change the number of frozen rows or columns. The bar never reorders columns.
 *
 * The count is changed on the grid only. The plugin does not write it back to the settings you passed in, so an
 * application that keeps the counts in its own state copies them in the {@link Hooks#afterFreezeChange} hook.
 *
 * To configure this plugin see {@link Options#freezeBar}.
 *
 * @example
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   data: getData(),
 *   freezeBar: true,
 *   fixedColumnsStart: 1,
 * });
 * ```
 */
export class FreezeBar extends BasePlugin {
  /**
   * The key of the plugin, which is also the name of its option.
   *
   * @returns {string}
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * The enable order of the plugin. It enables after the plugins that hide or trim the tracks it measures.
   *
   * @returns {number}
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * The bar elements. A bar for an edge with frozen tracks lives in the overlay of that edge, so it stays on the
   * freeze line while the grid scrolls. An empty edge has no overlay to hold a bar, so its handle lives in the
   * root element.
   */
  #bars: Partial<Record<FreezeEdge, HTMLElement>> = {};
  /**
   * The guide that shows the snapped position while a bar is dragged.
   */
  #guide: HTMLElement | null = null;
  /**
   * The state of the drag in progress.
   */
  #drag: { edge: FreezeEdge, count: number } | null = null;
  /**
   * Ends the drag in progress without storing anything.
   */
  #abortDrag: (() => void) | null = null;
  /**
   * The measurements of the render being synchronized.
   */
  #frame: Frame | null = null;

  /**
   * Checks if the plugin is enabled in the settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterRender', this.#onAfterRender);
    this.addHook('afterScrollVertically', this.#onScroll);
    this.addHook('afterScrollHorizontally', this.#onScroll);
    this.#registerShortcuts();

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    // The bars stay, so a wrapper that re-sends its props on every commit neither drops the focus from a bar
    // nor cancels a drag. A bar of an axis that was switched off is removed by the sync.
    super.updatePlugin();
    this.#onAfterRender();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
    this.#unregisterShortcuts();
    this.#teardown();
  }

  /**
   * Gets the number of frozen rows or columns on the given edge.
   *
   * @param {string} edge The edge: `top`, `bottom`, `start` or `end`.
   * @returns {number}
   */
  getFreezeCount(edge: FreezeEdge): number {
    const settings = this.hot.getSettings();

    // the start band has priority, so the end band is the part of it that remains
    if (edge === 'end') {
      return this.hot.view.countFixedColumnsEnd();
    }

    const count = {
      top: settings.fixedRowsTop,
      bottom: settings.fixedRowsBottom,
      start: settings.fixedColumnsStart,
    }[edge];

    return Math.max(0, Math.floor(Number(count) || 0));
  }

  /**
   * Sets the number of frozen rows or columns on the given edge. The count is clamped to what fits the viewport.
   * The change can be canceled in the {@link Hooks#beforeFreezeChange} hook.
   *
   * @param {string} edge The edge: `top`, `bottom`, `start` or `end`.
   * @param {number} count The new count.
   * @returns {boolean} `true` when the count changed.
   */
  setFreezeCount(edge: FreezeEdge, count: number): boolean {
    return this.#applyCount(edge, count, 'api');
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#teardown();

    super.destroy();
  }

  /**
   * Writes the count and runs the hooks. The count is written on the table meta, not through `updateSettings()`:
   * a wrapper that re-sends its props would revert a count written to the global settings, a grid configured with
   * `fixedColumnsLeft` throws on `fixedColumnsStart`, and `fixedRowsTop` would silently disable Pagination.
   *
   * @param {string} edge The edge.
   * @param {number} requested The requested count.
   * @param {string} source What requested the change.
   * @returns {boolean} `true` when the count changed.
   */
  #applyCount(edge: FreezeEdge, requested: number, source: FreezeSource): boolean {
    if (!this.#isEdgeAvailable(edge)) {
      return false;
    }

    const oldCount = this.getFreezeCount(edge);
    const newCount = Math.max(0, Math.min(Math.floor(requested), this.#getMaxCount(edge)));

    if (!Number.isFinite(newCount) || newCount === oldCount) {
      return false;
    }

    if (this.hot.runHooks('beforeFreezeChange', edge, newCount, oldCount, source) === false) {
      return false;
    }

    this.runOperation('freeze_change', () => {
      const settings = this.hot.getSettings() as Record<string, unknown>;

      if (edge === 'start') {
        // the shared backing field of `fixedColumnsStart` and the legacy `fixedColumnsLeft`
        settings._fixedColumnsStart = newCount;
      } else {
        settings[{ top: 'fixedRowsTop', bottom: 'fixedRowsBottom', end: 'fixedColumnsEnd' }[edge]] = newCount;
      }
    });

    this.hot.render();
    this.hot.runHooks('afterFreezeChange', edge, newCount, oldCount, source);

    return true;
  }

  /**
   * Checks if the `showEmptyHandles` setting asks for a handle on an edge with nothing frozen.
   *
   * @returns {boolean}
   */
  #showsEmptyHandles(): boolean {
    const settings = this.hot.getSettings()[PLUGIN_KEY] as boolean | FreezeBarSettings | undefined;

    return typeof settings === 'object' && settings.showEmptyHandles === true;
  }

  /**
   * Checks if the bar of the edge is available: the axis is enabled, and the rows are not paginated.
   *
   * @param {string} edge The edge.
   * @returns {boolean}
   */
  #isEdgeAvailable(edge: FreezeEdge): boolean {
    const settings = this.hot.getSettings()[PLUGIN_KEY] as boolean | FreezeBarSettings | undefined;

    if (!settings) {
      return false;
    }

    const axisSetting = typeof settings === 'object' ? settings[isColumnEdge(edge) ? 'columns' : 'rows'] : true;

    if (axisSetting === false) {
      return false;
    }

    // A change on the table meta never reaches the conflict registry, so Pagination would stay enabled
    // next to fixed rows, a combination it does not support.
    return isColumnEdge(edge) || !this.hot.getPlugin('pagination')?.enabled;
  }

  /**
   * Gets the sizes of the tracks of an axis, in the visual order from the given edge. A hidden track has size 0.
   *
   * @param {string} edge The edge the tracks are counted from.
   * @returns {number[]}
   */
  #getTrackSizes(edge: FreezeEdge): number[] {
    const columns = isColumnEdge(edge);
    const total = columns ? this.hot.countCols() : this.hot.countRows();
    const sizes: number[] = [];

    for (let index = 0; index < total; index++) {
      const visual = growsFromStart(edge) ? index : total - 1 - index;

      sizes.push(this.#getTrackSize(columns, visual));
    }

    return sizes;
  }

  /**
   * Gets the size of one track.
   *
   * @param {boolean} column `true` for a column, `false` for a row.
   * @param {number} visualIndex The visual index.
   * @returns {number}
   */
  #getTrackSize(column: boolean, visualIndex: number): number {
    const mapper = column ? this.hot.columnIndexMapper : this.hot.rowIndexMapper;
    const physical = column ? this.hot.toPhysicalColumn(visualIndex) : this.hot.toPhysicalRow(visualIndex);

    if (physical === null || mapper.isHidden(physical)) {
      return 0;
    }

    if (column) {
      return this.hot.getColWidth(visualIndex);
    }

    return getRenderedRowHeight(this.hot, visualIndex) ?? this.hot.stylesHandler.getDefaultRowHeight(visualIndex) ?? 0;
  }

  /**
   * Gets the largest count the edge may take: what fits the viewport, and no more than the tracks that remain
   * after the opposite band. The start band has priority over the end band, and the top band over the bottom one.
   *
   * @param {string} edge The edge.
   * @returns {number}
   */
  #getMaxCount(edge: FreezeEdge): number {
    const columns = isColumnEdge(edge);
    const opposite: FreezeEdge = { start: 'end', end: 'start', top: 'bottom', bottom: 'top' }[edge] as FreezeEdge;
    const view = this.hot.view;
    const viewportSize = columns ?
      view.getWorkspaceWidth() - view.getRowHeaderWidth() :
      view.getWorkspaceHeight() - view.getColumnHeaderHeight();
    const trackSizes = this.#getTrackSizes(edge);
    const oppositeSizes = this.#getTrackSizes(opposite);
    const oppositeCount = Math.min(this.getFreezeCount(opposite), oppositeSizes.length);
    // the band with priority keeps its count, the other one gives way
    const oppositeHasPriority = edge === 'end' || edge === 'bottom';
    const oppositeBandSize = oppositeSizes.slice(0, oppositeCount).reduce((sum, size) => sum + size, 0);
    const fit = getMaxFittingFrozenCount({
      viewportSize,
      trackSizes,
      oppositeBandSize: oppositeHasPriority ? oppositeBandSize : 0,
      minScrollableSize: MIN_SCROLLABLE_SIZE,
    });

    return oppositeHasPriority ? Math.min(fit, trackSizes.length - oppositeCount) : fit;
  }

  /**
   * Brings the bars in line with the current frozen counts.
   */
  #onAfterRender = () => {
    if (!this.hot.view?._wt) {
      return;
    }

    // one measurement per render: a read after a write would force a layout for every bar
    this.#frame = EDGES.some(edge => this.#isEdgeAvailable(edge)) ? this.#measureFrame() : null;
    EDGES.forEach(edge => this.#syncBar(edge));
    this.#frame = null;
  };

  /**
   * Shows or hides the handles of the empty edges as the grid scrolls. A bar inside an overlay needs nothing: the
   * overlay keeps it on the freeze line.
   */
  #onScroll = () => {
    const empty = EDGES.filter(edge => this.#bars[edge]?.classList.contains('ht-freeze-bar--empty'));

    if (empty.length === 0 || !this.hot.view?._wt) {
      return;
    }

    const frame = this.#measureFrame();

    empty.forEach((edge) => {
      this.#bars[edge]!.hidden = !this.#isEdgeInView(edge, frame);
    });
  };

  /**
   * Creates the bar of an edge, or removes it when the edge is not available.
   *
   * @param {string} edge The edge.
   */
  #syncBar(edge: FreezeEdge) {
    const available = this.#isEdgeAvailable(edge);
    const count = available ? this.getFreezeCount(edge) : 0;
    // A bar sits in the overlay that holds the frozen tracks. With nothing frozen there is no overlay to
    // hold it, so the handle of an empty edge sits in the root element, on the edge of the data area.
    const existing = this.#bars[edge];
    // An edge with nothing frozen has no bar, unless the option asks for the handle. A bar that holds the focus
    // stays until it loses it, so a keyboard user who pressed Home can still grow the area again.
    const showEmpty = count > 0 || this.#showsEmptyHandles() ||
      (!!existing && this.hot.rootDocument.activeElement === existing);
    const host = available && showEmpty ? this.#getHost(edge, count) : null;
    let bar = existing;

    if (!host) {
      bar?.remove();

      return;
    }

    if (!bar) {
      bar = this.#createBar(edge);
      this.#bars[edge] = bar;
    }

    if (bar.parentNode !== host) {
      // moving a node blurs it, so a bar that holds the focus gets it back
      const hadFocus = this.hot.rootDocument.activeElement === bar;

      host.appendChild(bar);

      if (hadFocus) {
        bar.focus();
      }
    }

    const empty = count === 0;

    const frame = this.#frame ?? this.#measureFrame();

    bar.classList.toggle('ht-freeze-bar--empty', empty);
    this.#positionEmptyHandle(bar, edge, empty, frame);
    // With nothing frozen, the handle only makes sense where the edge of the data is in view. Scrolled to the
    // middle of the grid it would sit on half a cell, and the rows it counts are not the ones next to it.
    bar.hidden = empty && !this.#isEdgeInView(edge, frame);

    if (this.hot.getSettings().ariaTags) {
      bar.setAttribute('aria-valuenow', String(count));
    }
  }

  /**
   * Sets the largest value on the bar. The maximum walks the sizes of every track on the axis, so it is
   * resolved when the bar gets the focus or a drag starts, not on every render.
   *
   * @param {HTMLElement} bar The bar element.
   * @param {string} edge The edge.
   */
  #updateValueMax(bar: HTMLElement, edge: FreezeEdge) {
    if (this.hot.getSettings().ariaTags) {
      bar.setAttribute('aria-valuemax', String(this.#getMaxCount(edge)));
    }
  }

  /**
   * Gets the element that holds the bar of an edge.
   *
   * @param {string} edge The edge.
   * @param {number} count The number of frozen tracks on the edge.
   * @returns {HTMLElement|null}
   */
  #getHost(edge: FreezeEdge, count: number): HTMLElement | null {
    return count > 0 ? this.#getOverlayRoot(edge) : this.hot.rootElement;
  }

  /**
   * Places the handle of an empty edge on the edge of the data area, or clears the placement of a bar.
   *
   * @param {HTMLElement} bar The bar element.
   * @param {string} edge The edge.
   * @param {boolean} empty `true` when the edge has no frozen tracks.
   * @param {object} frame The measurements of the render.
   */
  #positionEmptyHandle(bar: HTMLElement, edge: FreezeEdge, empty: boolean, frame: Frame) {
    const style = bar.style;
    const view = this.hot.view;
    const rtl = this.hot.isRtl();
    const { rootRect, rendered, content } = frame;
    const columns = isColumnEdge(edge);

    style.left = '';
    style.right = '';
    style.top = '';
    style.bottom = '';
    style.width = '';
    style.height = '';

    // A bar is as long as the rendered table, not as the container: a grid whose content is narrower or shorter
    // than its container would otherwise show a bar that reaches past the last column or row. The overlay that holds
    // a bar is as large as the container, so it only needs a limit when the table is smaller.
    if (columns && content.bottom - content.top < rootRect.height) {
      style.height = `${content.bottom - content.top}px`;
    } else if (!columns && content.right - content.left < rootRect.width) {
      style.width = `${content.right - content.left}px`;
    }

    if (!empty) {
      return;
    }

    // the handle of an empty edge sits in the root element, along the rendered area
    if (columns) {
      style.top = `${rendered.top - rootRect.top}px`;
      style.bottom = 'auto';
      style.height = `${rendered.bottom - rendered.top}px`;
    } else {
      style.left = `${rendered.left - rootRect.left}px`;
      style.right = 'auto';
      style.width = `${rendered.right - rendered.left}px`;
    }

    if (edge === 'start') {
      style[rtl ? 'right' : 'left'] = `${view.getRowHeaderWidth()}px`;
      style[rtl ? 'left' : 'right'] = 'auto';
    } else if (edge === 'end') {
      // The handle sits inside the edge of the rendered area, not past it. The end edge is the right edge in LTR
      // and the left edge in RTL.
      style.right = 'auto';
      style.left = rtl ?
        `${rendered.left - rootRect.left}px` :
        `calc(${rendered.right - rootRect.left}px - var(--ht-sizing-size-1))`;
    } else if (edge === 'top') {
      style.top = `${view.getColumnHeaderHeight() + rendered.top - rootRect.top}px`;
      style.bottom = 'auto';
    } else {
      style.top = 'auto';
      style.bottom = `${rootRect.bottom - rendered.bottom}px`;
    }
  }

  /**
   * Checks if the first or last track of the edge is in view, so the freeze line of an empty edge is next to it.
   *
   * @param {string} edge The edge.
   * @param {object} frame The measurements of the render.
   * @returns {boolean}
   */
  #isEdgeInView(edge: FreezeEdge, { viewport, content }: Frame): boolean {
    const rtl = this.hot.isRtl();
    const tolerance = 1;

    return {
      top: content.top >= viewport.top - tolerance,
      bottom: content.bottom <= viewport.bottom + tolerance,
      start: rtl ? content.right <= viewport.right + tolerance : content.left >= viewport.left - tolerance,
      end: rtl ? content.left >= viewport.left - tolerance : content.right <= viewport.right + tolerance,
    }[edge];
  }

  /**
   * Gets the thickness of the scrollbar of the grid on an axis. The bands of the end edges sit before it.
   *
   * @param {boolean} vertical `true` for the vertical scrollbar, which takes width.
   * @returns {number}
   */
  #getScrollbarSize(vertical: boolean): number {
    const holder = this.hot.view._wt.wtTable.holder;

    return vertical ? holder.offsetWidth - holder.clientWidth : holder.offsetHeight - holder.clientHeight;
  }

  /**
   * Gets the root element of the overlay that holds the frozen tracks of an edge.
   *
   * @param {string} edge The edge.
   * @returns {HTMLElement|null}
   */
  #getOverlayRoot(edge: FreezeEdge): HTMLElement | null {
    const overlays = this.hot.view._wt.wtOverlays;
    const overlay = {
      start: overlays.inlineStartOverlay,
      top: overlays.topOverlay,
      end: overlays.inlineEndOverlay,
      bottom: overlays.bottomOverlay,
    }[edge];

    return (overlay?.clone?.wtTable?.holder?.parentNode as HTMLElement | undefined) ?? null;
  }

  /**
   * Builds the bar element of an edge.
   *
   * @param {string} edge The edge.
   * @returns {HTMLElement}
   */
  #createBar(edge: FreezeEdge): HTMLElement {
    const bar = this.hot.rootDocument.createElement('div');
    const columns = isColumnEdge(edge);

    bar.className = `ht-freeze-bar ht-freeze-bar--${edge}`;
    bar.tabIndex = 0;

    if (this.hot.getSettings().ariaTags) {
      setAttribute(bar, [
        ['role', 'separator'],
        ['aria-orientation', columns ? 'vertical' : 'horizontal'],
        ['aria-valuemin', 0],
        A11Y_LABEL(this.hot.getTranslatedPhrase(columns ? C.FREEZE_BAR_COLUMNS : C.FREEZE_BAR_ROWS)),
      ]);
    }

    bar.addEventListener('focus', () => this.#updateValueMax(bar, edge));
    bar.addEventListener('pointerdown', event => this.#onPointerDown(edge, event));
    bar.addEventListener('keydown', event => this.#onKeyDown(edge, event));

    return bar;
  }

  /**
   * Starts a drag.
   *
   * @param {string} edge The edge.
   * @param {PointerEvent} event The event.
   */
  #onPointerDown(edge: FreezeEdge, event: PointerEvent) {
    if (event.button !== 0 || !event.isPrimary || this.#drag) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // The rows or columns that get frozen are the first (or last) ones, so they must be in view for the guide to
    // show what the drag will freeze. The grid scrolls to that edge when the drag starts.
    this.#scrollToEdge(edge);

    const doc = this.hot.rootDocument;
    const columns = isColumnEdge(edge);
    const scale = getElementScaleFactor(this.hot.rootElement, columns ? 'horizontal' : 'vertical');
    const rootRect = this.hot.rootElement.getBoundingClientRect();
    const visibleRect = this.#measureFrame(rootRect).rendered;
    const trackSizes = this.#getTrackSizes(edge);
    const maxCount = this.#getMaxCount(edge);
    // the pointer distance is measured from the edge of the data area, past the headers
    const headerSize = this.#getBandOrigin(edge);
    const fromLeft = columns && growsFromStart(edge) !== this.hot.isRtl();

    this.#drag = { edge, count: this.getFreezeCount(edge) };
    this.#updateValueMax(event.currentTarget as HTMLElement, edge);

    const { pointerId } = event;

    // keeps the touch and pen stream on the bar when the finger leaves it
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      const pointer = this.#getPointerOffset(moveEvent, visibleRect, edge, fromLeft);
      const distance = normalizeVisualDelta(pointer, scale) - headerSize;

      this.#drag!.count = resolveFreezeCount({ distance, trackSizes, maxCount });
      this.#showGuide(edge, trackSizes, this.#drag!.count, headerSize, rootRect, visibleRect);
    };
    const finish = (commit: boolean) => {
      const drag = this.#drag;

      doc.removeEventListener('pointermove', onMove);
      doc.removeEventListener('pointerup', onUp);
      doc.removeEventListener('pointercancel', onCancel);
      doc.removeEventListener('keydown', onKey, true);
      this.#hideGuide();
      this.#drag = null;
      this.#abortDrag = null;

      if (commit && drag) {
        this.#applyCount(edge, drag.count, 'drag');
      }
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId === pointerId) {
        finish(true);
      }
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      // the browser took the gesture over, so nothing is stored
      if (cancelEvent.pointerId === pointerId) {
        finish(false);
      }
    };
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') {
        keyEvent.stopPropagation();
        finish(false);
      }
    };

    doc.addEventListener('pointermove', onMove);
    doc.addEventListener('pointerup', onUp);
    doc.addEventListener('pointercancel', onCancel);
    doc.addEventListener('keydown', onKey, true);
    this.#abortDrag = () => finish(false);
  }

  /**
   * Scrolls the grid along the axis of the edge, so the first or last tracks that a drag can freeze are in view.
   * The first or last scrollable track is the target, because the scroll never goes to a frozen one.
   *
   * @param {string} edge The edge.
   */
  #scrollToEdge(edge: FreezeEdge) {
    const columns = isColumnEdge(edge);
    const total = columns ? this.hot.countCols() : this.hot.countRows();
    const opposite: FreezeEdge = { start: 'end', end: 'start', top: 'bottom', bottom: 'top' }[edge] as FreezeEdge;
    const frozenHere = this.getFreezeCount(edge);

    // every track is frozen, so nothing scrolls
    if (total <= frozenHere + this.getFreezeCount(opposite)) {
      return;
    }

    const toStart = growsFromStart(edge);
    const index = toStart ? frozenHere : total - 1 - frozenHere;

    if (columns) {
      this.hot.scrollViewportTo({ col: index, horizontalSnap: toStart ? 'start' : 'end' });
    } else {
      this.hot.scrollViewportTo({ row: index, verticalSnap: toStart ? 'top' : 'bottom' });
    }
  }

  /**
   * Gets the distance of the pointer from the edge of the root element that the band grows from.
   *
   * @param {MouseEvent} event The event.
   * @param {object} visible The part of the root element the bands are pinned to.
   * @param {string} edge The edge.
   * @param {boolean} fromLeft `true` when the columns grow from the left edge.
   * @returns {number}
   */
  #getPointerOffset(event: MouseEvent, visible: Rect, edge: FreezeEdge, fromLeft: boolean): number {
    if (!isColumnEdge(edge)) {
      return growsFromStart(edge) ? event.clientY - visible.top : visible.bottom - event.clientY;
    }

    return fromLeft ? event.clientX - visible.left : visible.right - event.clientX;
  }

  /**
   * Measures the root element, the part of it in view, the content and the area the frozen bands are pinned to.
   * When the page scrolls an axis, the overlays stick to the viewport, so the root element's own edge may be
   * scrolled out of view. A grid whose content is narrower or shorter than its container ends before the container
   * does, and the end and bottom bands sit at the edge of the content.
   *
   * @param {DOMRect} [rootRect] The bounding rectangle of the root element, when it was just measured.
   * @returns {object}
   */
  #measureFrame(rootRect: DOMRect = this.hot.rootElement.getBoundingClientRect()): Frame {
    const { view, rootWindow } = this.hot;
    const byWindowX = view.isHorizontallyScrollableByWindow();
    const byWindowY = view.isVerticallyScrollableByWindow();
    const viewportElement = rootWindow.document.documentElement;
    const content = this.#getContentRect(rootRect);
    const rtl = this.hot.isRtl();
    const scrollbarX = this.#getScrollbarSize(true);
    const scrollbarY = this.#getScrollbarSize(false);
    const viewport: Rect = {
      left: (byWindowX ? Math.max(rootRect.left, 0) : rootRect.left) + (rtl ? scrollbarX : 0),
      right: (byWindowX ? Math.min(rootRect.right, viewportElement.clientWidth) : rootRect.right) -
        (rtl ? 0 : scrollbarX),
      top: byWindowY ? Math.max(rootRect.top, 0) : rootRect.top,
      bottom: (byWindowY ? Math.min(rootRect.bottom, viewportElement.clientHeight) : rootRect.bottom) - scrollbarY,
    };

    return {
      rootRect,
      viewport,
      content,
      rendered: {
        left: Math.max(viewport.left, content.left),
        right: Math.min(viewport.right, content.right),
        top: Math.max(viewport.top, content.top),
        bottom: Math.min(viewport.bottom, content.bottom),
      },
    };
  }

  /**
   * Gets the rectangle the whole grid content takes, headers included, as if nothing were clipped. Its far edges are
   * where the last column and the last row end.
   *
   * @param {DOMRect} rootRect The bounding rectangle of the root element.
   * @returns {object}
   */
  #getContentRect(rootRect: DOMRect): Rect {
    const { view } = this.hot;
    const holder = view._wt.wtTable.holder;
    const width = view.getTotalTableWidth();
    const top = rootRect.top - holder.scrollTop;

    // in RTL the content starts at the right edge and a scrolled holder has a negative `scrollLeft`
    if (this.hot.isRtl()) {
      const right = rootRect.right - holder.scrollLeft;

      return { left: right - width, right, top, bottom: top + view.getTotalTableHeight() };
    }

    const left = rootRect.left - holder.scrollLeft;

    return { left, right: left + width, top, bottom: top + view.getTotalTableHeight() };
  }

  /**
   * Gets the distance between the edge of the rendered area and the first track of the band: the headers for the
   * start and top bands, nothing for the end and bottom bands.
   *
   * @param {string} edge The edge.
   * @returns {number}
   */
  #getBandOrigin(edge: FreezeEdge): number {
    const view = this.hot.view;

    return {
      start: view.getRowHeaderWidth(),
      top: view.getColumnHeaderHeight(),
      end: 0,
      bottom: 0,
    }[edge];
  }

  /**
   * Shows the guide at the snapped position.
   *
   * @param {string} edge The edge.
   * @param {number[]} trackSizes The track sizes.
   * @param {number} count The snapped count.
   * @param {number} headerSize The size of the headers before the first track.
   * @param {DOMRect} rootRect The bounding rectangle of the root element.
   * @param {object} visibleRect The part of the root element the bands are pinned to.
   */
  #showGuide(
    edge: FreezeEdge,
    trackSizes: number[],
    count: number,
    headerSize: number,
    rootRect: DOMRect,
    visibleRect: Rect,
  ) {
    const columns = isColumnEdge(edge);
    const offset = headerSize + trackSizes.slice(0, count).reduce((sum, size) => sum + size, 0);

    if (!this.#guide) {
      this.#guide = this.hot.rootDocument.createElement('div');
      this.#guide.className = 'ht-freeze-bar-guide';
      this.hot.rootElement.appendChild(this.#guide);
    }

    const style = this.#guide.style;

    style.position = 'absolute';
    style.pointerEvents = 'none';
    style.left = 'auto';
    style.right = 'auto';
    style.top = 'auto';
    style.bottom = 'auto';

    // the offset is measured from the visible edge, the guide is placed from the root element's edge
    const fromLeft = growsFromStart(edge) !== this.hot.isRtl();
    const shift = {
      left: visibleRect.left - rootRect.left,
      right: rootRect.right - visibleRect.right,
      top: visibleRect.top - rootRect.top,
      bottom: rootRect.bottom - visibleRect.bottom,
    };

    if (columns) {
      style[fromLeft ? 'left' : 'right'] = `${offset + shift[fromLeft ? 'left' : 'right']}px`;
      style.top = `${shift.top}px`;
      style.width = 'var(--ht-sizing-size-0-5)';
      style.height = `${visibleRect.bottom - visibleRect.top}px`;
    } else {
      style[growsFromStart(edge) ? 'top' : 'bottom'] =
        `${offset + shift[growsFromStart(edge) ? 'top' : 'bottom']}px`;
      style.left = `${shift.left}px`;
      style.height = 'var(--ht-sizing-size-0-5)';
      style.width = `${visibleRect.right - visibleRect.left}px`;
    }
  }

  /**
   * Removes the guide.
   */
  #hideGuide() {
    this.#guide?.remove();
    this.#guide = null;
  }

  /**
   * Changes the count with the keyboard.
   *
   * @param {string} edge The edge.
   * @param {KeyboardEvent} event The event.
   */
  #onKeyDown(edge: FreezeEdge, event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const columns = isColumnEdge(edge);
    // The bar of a start or top band grows towards the end of the grid. The bar of an end or bottom band
    // grows towards the start, so its arrows point the other way. In RTL the horizontal arrows swap again.
    const rtl = columns && this.hot.isRtl();
    const forwardKey = columns ? 'ArrowRight' : 'ArrowDown';
    const backwardKey = columns ? 'ArrowLeft' : 'ArrowUp';
    const forward = growsFromStart(edge) ? forwardKey : backwardKey;
    const backward = growsFromStart(edge) ? backwardKey : forwardKey;
    const current = this.getFreezeCount(edge);
    const flip = columns && rtl ? -1 : 1;
    let target: number | null = null;

    if (event.key === forward) {
      target = current + flip;
    } else if (event.key === backward) {
      target = current - flip;
    } else if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = this.#getMaxCount(edge);
    }

    if (target === null) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // hidden tracks have no size, so a step over them would change nothing visible
    this.#applyCount(edge, this.#stepOverHidden(edge, current, target), 'keyboard');
  }

  /**
   * Moves a keyboard step past the hidden tracks next to the line.
   *
   * @param {string} edge The edge.
   * @param {number} current The current count.
   * @param {number} target The requested count.
   * @returns {number}
   */
  #stepOverHidden(edge: FreezeEdge, current: number, target: number): number {
    const sizes = this.#getTrackSizes(edge);
    const step = Math.sign(target - current);
    let next = Math.min(target, sizes.length);

    // a count that ends on a hidden track freezes nothing more than the count before it
    while (step !== 0 && next > 0 && next < sizes.length + (step > 0 ? 1 : 0) && sizes[next - 1] === 0) {
      next += step;
    }

    return Math.min(next, sizes.length);
  }

  /**
   * Registers the shortcut that moves the focus to the first bar. While the grid listens, Tab moves the cell
   * selection, so without it the bars could not be reached with the keyboard. F6 is the usual key for moving
   * between the panes of a page.
   */
  #registerShortcuts() {
    this.hot.getShortcutManager().getContext('grid')?.addShortcut({
      keys: [['F6']],
      callback: () => {
        const bar = EDGES.map(edge => this.#bars[edge]).find(candidate => candidate && !candidate.hidden);

        bar?.focus();

        return !!bar;
      },
      runOnlyIf: () => this.enabled,
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregisters the plugin's shortcut group.
   */
  #unregisterShortcuts() {
    this.hot.getShortcutManager().getContext('grid')?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Removes everything the plugin added to the DOM.
   */
  #teardown() {
    this.#abortDrag?.();
    this.#hideGuide();
    this.#drag = null;
    Object.values(this.#bars).forEach(bar => bar?.remove());
    this.#bars = {};
  }
}
