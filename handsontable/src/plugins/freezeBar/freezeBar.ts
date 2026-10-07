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

/**
 * The size that always stays scrollable, in pixels. The frozen area never grows into it.
 */
const MIN_SCROLLABLE_SIZE = 40;
const EDGES: readonly FreezeEdge[] = ['start', 'top', 'end', 'bottom'];

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

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
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
    const count = {
      top: settings.fixedRowsTop,
      bottom: settings.fixedRowsBottom,
      start: settings.fixedColumnsStart,
      end: settings.fixedColumnsEnd,
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

    EDGES.forEach(edge => this.#syncBar(edge));
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
    const host = available ? this.#getHost(edge, count) : null;
    let bar = this.#bars[edge];

    if (!host) {
      bar?.remove();

      return;
    }

    if (!bar) {
      bar = this.#createBar(edge);
      this.#bars[edge] = bar;
    }

    if (bar.parentNode !== host) {
      host.appendChild(bar);
    }

    bar.classList.toggle('ht-freeze-bar--empty', count === 0);
    this.#positionEmptyHandle(bar, edge, count === 0);
    bar.setAttribute('aria-valuenow', String(count));
    bar.setAttribute('aria-valuemax', String(this.#getMaxCount(edge)));
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
   */
  #positionEmptyHandle(bar: HTMLElement, edge: FreezeEdge, empty: boolean) {
    const style = bar.style;
    const view = this.hot.view;
    const rtl = this.hot.isRtl();

    style.left = '';
    style.right = '';
    style.top = '';
    style.bottom = '';

    if (!empty) {
      return;
    }

    if (edge === 'start') {
      style[rtl ? 'right' : 'left'] = `${view.getRowHeaderWidth()}px`;
    } else if (edge === 'end') {
      style[rtl ? 'left' : 'right'] = `${this.#getScrollbarSize(true)}px`;
    } else if (edge === 'top') {
      style.top = `${view.getColumnHeaderHeight()}px`;
    } else {
      style.bottom = `${this.#getScrollbarSize(false)}px`;
    }
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
    setAttribute(bar, [
      ['role', 'separator'],
      ['aria-orientation', columns ? 'vertical' : 'horizontal'],
      ['aria-valuemin', 0],
      A11Y_LABEL(this.hot.getTranslatedPhrase(columns ? C.FREEZE_BAR_COLUMNS : C.FREEZE_BAR_ROWS)),
    ]);

    bar.addEventListener('mousedown', event => this.#onPointerDown(edge, event));
    bar.addEventListener('keydown', event => this.#onKeyDown(edge, event));

    return bar;
  }

  /**
   * Starts a drag.
   *
   * @param {string} edge The edge.
   * @param {MouseEvent} event The event.
   */
  #onPointerDown(edge: FreezeEdge, event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const doc = this.hot.rootDocument;
    const columns = isColumnEdge(edge);
    const scale = getElementScaleFactor(this.hot.rootElement, columns ? 'horizontal' : 'vertical');
    const rootRect = this.hot.rootElement.getBoundingClientRect();
    const trackSizes = this.#getTrackSizes(edge);
    const maxCount = this.#getMaxCount(edge);
    const view = this.hot.view;
    // the pointer distance is measured from the edge of the data area, past the headers
    const headerSize = this.#getBandOrigin(edge);
    const fromLeft = columns && growsFromStart(edge) !== this.hot.isRtl();

    this.#drag = { edge, count: this.getFreezeCount(edge) };

    const onMove = (moveEvent: MouseEvent) => {
      const pointer = this.#getPointerOffset(moveEvent, rootRect, edge, fromLeft);
      const distance = normalizeVisualDelta(pointer, scale) - headerSize;

      this.#drag!.count = resolveFreezeCount({ distance, trackSizes, maxCount });
      this.#showGuide(edge, trackSizes, this.#drag!.count, headerSize, rootRect);
    };
    const finish = (commit: boolean) => {
      const drag = this.#drag;

      doc.removeEventListener('mousemove', onMove);
      doc.removeEventListener('mouseup', onUp);
      doc.removeEventListener('keydown', onKey, true);
      this.#hideGuide();
      this.#drag = null;
      this.#abortDrag = null;

      if (commit && drag) {
        this.#applyCount(edge, drag.count, 'drag');
      }
    };
    const onUp = () => finish(true);
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') {
        keyEvent.stopPropagation();
        finish(false);
      }
    };

    doc.addEventListener('mousemove', onMove);
    doc.addEventListener('mouseup', onUp);
    doc.addEventListener('keydown', onKey, true);
    this.#abortDrag = () => finish(false);
  }

  /**
   * Gets the distance of the pointer from the edge of the root element that the band grows from.
   *
   * @param {MouseEvent} event The event.
   * @param {DOMRect} rootRect The bounding rectangle of the root element.
   * @param {string} edge The edge.
   * @param {boolean} fromLeft `true` when the columns grow from the left edge.
   * @returns {number}
   */
  #getPointerOffset(event: MouseEvent, rootRect: DOMRect, edge: FreezeEdge, fromLeft: boolean): number {
    if (!isColumnEdge(edge)) {
      return growsFromStart(edge) ? event.clientY - rootRect.top : rootRect.bottom - event.clientY;
    }

    return fromLeft ? event.clientX - rootRect.left : rootRect.right - event.clientX;
  }

  /**
   * Gets the distance between the edge of the root element and the first track of the band: the headers for the
   * start and top bands, the scrollbar for the end and bottom bands.
   *
   * @param {string} edge The edge.
   * @returns {number}
   */
  #getBandOrigin(edge: FreezeEdge): number {
    const view = this.hot.view;

    return {
      start: view.getRowHeaderWidth(),
      top: view.getColumnHeaderHeight(),
      end: this.#getScrollbarSize(true),
      bottom: this.#getScrollbarSize(false),
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
   */
  #showGuide(edge: FreezeEdge, trackSizes: number[], count: number, headerSize: number, rootRect: DOMRect) {
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

    if (columns) {
      style[growsFromStart(edge) !== this.hot.isRtl() ? 'left' : 'right'] = `${offset}px`;
      style.top = '0';
      style.width = '2px';
      style.height = `${rootRect.height}px`;
    } else {
      style[growsFromStart(edge) ? 'top' : 'bottom'] = `${offset}px`;
      style.left = '0';
      style.height = '2px';
      style.width = `${rootRect.width}px`;
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
