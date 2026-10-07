import { BasePlugin } from '../base';
import { A11Y_LABEL } from '../../helpers/a11y';
import * as C from '../../i18n/constants';
import { getDeepActiveElement, getTrimmingContainer, setAttribute } from '../../helpers/dom/element';
import { getMaxFittingFrozenCount, MIN_SCROLLABLE_SIZE } from '../../utils/frozenAreaFit';
import { getElementScaleFactor, normalizeVisualDelta } from '../../utils/manualResize/utils';
import { resolveFreezeCount } from './snapResolver';
import type { FreezeBarSettings, FreezeEdge, FreezeSource } from './types';

export const PLUGIN_KEY = 'freezeBar';
export const PLUGIN_PRIORITY = 380;

const SHORTCUTS_GROUP = PLUGIN_KEY;

/**
 * The shortest handle on a header corner, in pixels. A grid without headers has no corner to size it by.
 */
const MIN_HANDLE_LENGTH = 24;

/**
 * How far the pointer must move before a press becomes a drag, in pixels. A press that does not move is a click
 * that focuses the bar, and a wobble of a finger must not scroll the grid or change the count.
 */
const DRAG_THRESHOLD = 3;

/**
 * The distance a handle on the end or the bottom edge keeps from the edge of the last column or row when the grid
 * has the column or row resizer there, in pixels. The resizer is as wide as that.
 */
const RESIZER_CLEARANCE = 12;

/**
 * The corner overlays a freeze line crosses. The bar of an edge also runs through them, so it is as long as the
 * viewport and does not stop at the other frozen rows and columns.
 */
const CORNER_OVERLAYS: Record<FreezeEdge, string[]> = {
  top: ['topInlineStartCornerOverlay', 'topInlineEndCornerOverlay'],
  bottom: ['bottomInlineStartCornerOverlay', 'bottomInlineEndCornerOverlay'],
  start: ['topInlineStartCornerOverlay', 'bottomInlineStartCornerOverlay'],
  end: ['topInlineEndCornerOverlay', 'bottomInlineEndCornerOverlay'],
};

const EDGES: readonly FreezeEdge[] = ['start', 'top', 'end', 'bottom'];

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface OverlayLike {
  clone?: { wtTable?: { holder?: { parentNode?: HTMLElement | null } } };
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

const isEdge = (edge: unknown): edge is FreezeEdge => EDGES.includes(edge as FreezeEdge);
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
   * The pieces of a bar that lie in the corner overlays. They only draw and start a drag.
   */
  #segments: Partial<Record<FreezeEdge, Map<string, HTMLElement>>> = {};
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
   * The scrolling ancestors whose scroll the plugin listens to.
   */
  #scrollAncestors = new Set<HTMLElement>();
  /**
   * The styles last written to each bar, so a style is written only when its value changed.
   */
  #appliedStyles = new WeakMap<HTMLElement, Record<string, string>>();

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
    this.addHook('afterLanguageChange', this.#onAfterLanguageChange);
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
   * Gets the number of frozen rows or columns on the given edge. It is the count the grid draws: the start band
   * has priority over the end band, and with `limitFixedToViewport` a band that does not fit is cut down.
   *
   * @param {string} edge The edge: `top`, `bottom`, `start` or `end`.
   * @returns {number}
   */
  getFreezeCount(edge: FreezeEdge): number {
    if (!isEdge(edge)) {
      return 0;
    }

    const view = this.hot.view;
    const count = {
      top: view.countFixedRowsTop(),
      bottom: view.countFixedRowsBottom(),
      start: view.countFixedColumnsStart(),
      end: view.countFixedColumnsEnd(),
    }[edge];

    return Math.max(0, Math.floor(count));
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
    if (!isEdge(edge) || !this.#isEdgeAvailable(edge)) {
      return false;
    }

    const oldCount = this.getFreezeCount(edge);
    const target = Math.floor(requested);
    // Only a count that grows is cut down to what fits. A count the user did not touch stays, even when the grid
    // got smaller since, so a click on a bar or a step down never changes more than it was asked to.
    const grown = Math.max(oldCount, Math.min(target, this.#getMaxCount(edge)));
    const newCount = Math.max(0, target > oldCount ? grown : target);

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
  #getTrackSizes(edge: FreezeEdge, limits: { maxTracks?: number, sizeBudget?: number } = {}): number[] {
    const columns = isColumnEdge(edge);
    const total = columns ? this.hot.countCols() : this.hot.countRows();
    const { maxTracks = total, sizeBudget = Infinity } = limits;
    const sizes: number[] = [];
    let used = 0;

    // The walk stops when the tracks are used up or fill the budget: on a grid of a million rows, only the few
    // that can fit in the viewport matter.
    for (let index = 0; index < Math.min(total, maxTracks) && used < sizeBudget; index++) {
      const size = this.#getEdgeTrackSize(edge, index);

      sizes.push(size);
      used += size;
    }

    return sizes;
  }

  /**
   * Gets the size of one track, counted from the edge the band grows from.
   *
   * @param {string} edge The edge.
   * @param {number} indexFromEdge The position of the track, 0 for the one next to the edge.
   * @returns {number}
   */
  #getEdgeTrackSize(edge: FreezeEdge, indexFromEdge: number): number {
    const columns = isColumnEdge(edge);
    const total = columns ? this.hot.countCols() : this.hot.countRows();
    const visual = growsFromStart(edge) ? indexFromEdge : total - 1 - indexFromEdge;

    return this.hot.view.getFrozenTrackSize(columns, visual, true);
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
    const total = columns ? this.hot.countCols() : this.hot.countRows();
    const viewportSize = view.getFrozenViewportSize(columns);
    const oppositeCount = Math.min(this.getFreezeCount(opposite), total);
    // The band on the other edge takes its room first, so the two bands together never fill the viewport.
    const oppositeBandSize = this.#getTrackSizes(opposite, { maxTracks: oppositeCount })
      .reduce((sum, size) => sum + size, 0);
    // tracks past the viewport can not fit, so the walk stops there
    const trackSizes = this.#getTrackSizes(edge, { sizeBudget: viewportSize });
    const fit = getMaxFittingFrozenCount({
      viewportSize,
      trackSizes,
      oppositeBandSize,
      minScrollableSize: MIN_SCROLLABLE_SIZE,
    });

    return Math.min(fit, total - oppositeCount);
  }

  /**
   * Brings the bars in line with the current frozen counts.
   */
  #onAfterRender = () => {
    if (!this.hot.view?._wt) {
      return;
    }

    this.#syncScrollAncestors();
    // one measurement per render: a read after a write would force a layout for every bar
    this.#frame = EDGES.some(edge => this.#isEdgeAvailable(edge)) ? this.#measureFrame() : null;
    EDGES.forEach(edge => this.#syncBar(edge));
    this.#frame = null;
  };

  /**
   * Translates the accessible names of the bars again, because the language changed after they were built.
   */
  #onAfterLanguageChange = () => {
    EDGES.forEach((edge) => {
      const bar = this.#bars[edge];

      if (bar && this.hot.getSettings().ariaTags) {
        bar.setAttribute('aria-label', this.hot.getTranslatedPhrase(this.#getLabelKey(edge)));
      }
    });
  };

  /**
   * Gets the translation key of the accessible name of a bar.
   *
   * @param {string} edge The edge.
   * @returns {string}
   */
  #getLabelKey(edge: FreezeEdge): string {
    return isColumnEdge(edge) ? C.FREEZE_BAR_COLUMNS : C.FREEZE_BAR_ROWS;
  }

  /**
   * Keeps the handles of the empty edges on the header corners as the page scrolls. A bar inside an overlay needs
   * nothing: the overlay keeps it on the freeze line.
   */
  #onScroll = () => {
    const empty = EDGES.filter(edge => this.#bars[edge]?.classList.contains('ht-freeze-bar--empty'));

    if (empty.length === 0 || !this.hot.view?._wt) {
      return;
    }

    // The handles sit in the root element. When the root clips both axes the grid scrolls inside it, the handles do
    // not move, and `afterRender` has just placed them. Otherwise the page or an ancestor scrolls, and the header
    // corner they belong to moves with it.
    if (!this.#getClipRange('x') && !this.#getClipRange('y')) {
      return;
    }

    const frame = this.#measureFrame();

    // in window scroll mode the header corner is pinned to the viewport while the root element scrolls away
    empty.forEach(edge => this.#positionEmptyHandle(this.#bars[edge]!, edge, true, frame));
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
    // hold it, so the handle of an empty edge sits in the root element, on a header corner.
    const host = available ? this.#getHost(edge, count) : null;
    let bar = this.#bars[edge];

    if (!host) {
      bar?.remove();
      delete this.#bars[edge];
      this.#syncSegments(edge, false);

      return;
    }

    if (!bar) {
      bar = this.#createBar(edge);
      this.#bars[edge] = bar;
    }

    if (bar.parentNode !== host) {
      // moving a node blurs it, so a bar that holds the focus gets it back
      const hadFocus = getDeepActiveElement(this.hot.rootDocument) === bar;

      host.appendChild(bar);

      if (hadFocus) {
        bar.focus();
      }
    }

    const empty = count === 0;

    const frame = this.#frame ?? this.#measureFrame();

    bar.classList.toggle('ht-freeze-bar--empty', empty);
    this.#positionEmptyHandle(bar, edge, empty, frame);
    this.#syncSegments(edge, !empty);

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
   * Adds the pieces of a bar that lie in the corner overlays, or removes them. A freeze line crosses the overlays of
   * the other frozen rows and columns, and the bar is as long as the viewport, like the one in Google Sheets.
   *
   * @param {string} edge The edge.
   * @param {boolean} show `true` to have the pieces, `false` to remove them.
   */
  #syncSegments(edge: FreezeEdge, show: boolean) {
    const overlays = this.hot.view?._wt?.wtOverlays as unknown as Record<string, OverlayLike | undefined> | undefined;
    // keyed by the overlay, so a corner overlay that has no clone does not shift the pieces of the others
    const pieces = this.#segments[edge] ?? new Map<string, HTMLElement>();

    this.#segments[edge] = pieces;

    if (!show || !overlays) {
      pieces.forEach(piece => piece.remove());
      pieces.clear();

      return;
    }

    CORNER_OVERLAYS[edge].forEach((name) => {
      const root = overlays[name]?.clone?.wtTable?.holder?.parentNode;
      let segment = pieces.get(name);

      if (!root) {
        segment?.remove();
        pieces.delete(name);

        return;
      }

      if (!segment) {
        segment = this.hot.rootDocument.createElement('div');
        segment.className = `ht-freeze-bar ht-freeze-bar--${edge} ht-freeze-bar--segment`;
        segment.addEventListener('pointerdown', event => this.#onPointerDown(edge, event));
        pieces.set(name, segment);
      }

      if (segment.parentNode !== root) {
        root.appendChild(segment);
      }
    });
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
    const { rootRect, content } = frame;
    const columns = isColumnEdge(edge);
    const styles: Record<string, string> = {};

    // A bar is as long as the rendered table, not as the container: a grid whose content is narrower or shorter
    // than its container would otherwise show a bar that reaches past the last column or row. The overlay that holds
    // a bar is as large as the container, so it only needs a limit when the table is smaller.
    if (columns && content.bottom - content.top < rootRect.height) {
      styles.height = `${content.bottom - content.top}px`;
    } else if (!columns && content.right - content.left < rootRect.width) {
      styles.width = `${content.right - content.left}px`;
    }

    bar.classList.remove('ht-freeze-bar--wide');

    if (empty) {
      this.#placeEmptyHandle(bar, edge, frame, styles);
    }

    this.#applyStyles(bar, styles);
  }

  /**
   * Computes where the handle of an empty edge sits in the root element. The start and top handles take the whole
   * width or height of the grid to be grabbed on, like in Google Sheets, but draw only a short piece on the header
   * corner (the corner stays in view while the grid scrolls). The end and bottom handles have no such edge to start
   * from, so they are the short piece. A grid without headers gets a piece of a fixed length.
   *
   * @param {HTMLElement} bar The handle.
   * @param {string} edge The edge.
   * @param {object} frame The measurements of the render.
   * @param {object} styles The styles to apply, filled in here.
   */
  #placeEmptyHandle(bar: HTMLElement, edge: FreezeEdge, frame: Frame, styles: Record<string, string>) {
    const view = this.hot.view;
    const rtl = this.hot.isRtl();
    const { rootRect, rendered } = frame;
    const columns = isColumnEdge(edge);
    const rowHeaderWidth = Math.max(view.getRowHeaderWidth(), MIN_HANDLE_LENGTH);
    const columnHeaderHeight = Math.max(view.getColumnHeaderHeight(), MIN_HANDLE_LENGTH);
    const wide = edge === 'start' || edge === 'top';
    const fromLeft = rendered.left - rootRect.left;
    const fromRight = rootRect.right - rendered.right;
    const fromTop = rendered.top - rootRect.top;
    const fromBottom = rootRect.bottom - rendered.bottom;
    // The column and row resizers sit on the last column and row of the headers. A handle on the end or bottom edge
    // would lie on top of them and take the grab, so it keeps its distance from the edge when they are there.
    const clearance = (columns ? this.hot.getPlugin('manualColumnResize') : this.hot.getPlugin('manualRowResize'))
      ?.enabled ? RESIZER_CLEARANCE : 0;

    bar.classList.toggle('ht-freeze-bar--wide', wide);
    styles['--ht-freeze-bar-corner'] = `${columns ? columnHeaderHeight : rowHeaderWidth}px`;
    styles.left = 'auto';
    styles.right = 'auto';
    styles.top = 'auto';
    styles.bottom = 'auto';

    if (columns) {
      styles.top = `${fromTop}px`;
      styles.height = `${wide ? rendered.bottom - rendered.top : columnHeaderHeight}px`;
    } else {
      styles.width = `${wide ? rendered.right - rendered.left : rowHeaderWidth}px`;
    }

    if (edge === 'start') {
      // on the line between the row headers and the first column, inside the corner like in Google Sheets;
      // `max()` keeps the handle inside the root element when there are no row headers
      styles[rtl ? 'right' : 'left'] =
        `max(0px, calc(${(rtl ? fromRight : fromLeft) + view.getRowHeaderWidth()}px - var(--ht-sizing-size-1)))`;
    } else if (edge === 'end') {
      // inside the end edge of the rendered area, not past it
      styles.left = rtl ?
        `${fromLeft + clearance}px` :
        `calc(${rendered.right - rootRect.left - clearance}px - var(--ht-sizing-size-1))`;
    } else if (edge === 'top') {
      // on the line between the column headers and the first row, inside the corner
      styles.top = `max(0px, calc(${fromTop + view.getColumnHeaderHeight()}px - var(--ht-sizing-size-1)))`;
      styles[rtl ? 'right' : 'left'] = `${rtl ? fromRight : fromLeft}px`;
    } else {
      // on the bottom edge of the rendered area, over the row headers
      styles.bottom = `${fromBottom + clearance}px`;
      styles[rtl ? 'right' : 'left'] = `${rtl ? fromRight : fromLeft}px`;
    }
  }

  /**
   * Writes the styles of a bar, only the ones whose value changed since the last write. The placement runs on every
   * render, and a scroll renders on every frame.
   *
   * @param {HTMLElement} bar The bar.
   * @param {object} styles The styles it should have. A style that is missing is cleared.
   */
  #applyStyles(bar: HTMLElement, styles: Record<string, string>) {
    const applied = this.#appliedStyles.get(bar) ?? {};

    Object.keys({ ...applied, ...styles }).forEach((name) => {
      const next = styles[name] ?? '';

      if ((applied[name] ?? '') !== next) {
        bar.style.setProperty(name.startsWith('--') ? name : name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`), next);
      }
    });
    this.#appliedStyles.set(bar, styles);
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
        A11Y_LABEL(this.hot.getTranslatedPhrase(this.#getLabelKey(edge))),
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

    const doc = this.hot.rootDocument;
    const columns = isColumnEdge(edge);
    const { pointerId, clientX: startX, clientY: startY } = event;
    // what the drag works from, measured when the pointer first moves (see `begin`)
    let session: {
      scale: number,
      rootRect: DOMRect,
      visibleRect: Rect,
      maxCount: number,
      trackSizes: number[],
      headerSize: number,
      fromLeft: boolean,
    } | null = null;

    this.#drag = { edge, count: this.getFreezeCount(edge) };
    this.#setActive(edge, true);

    const bar = this.#bars[edge];

    if (bar) {
      this.#updateValueMax(bar, edge);
    }

    try {
      // keeps the touch and pen stream on the bar when the finger leaves it; it throws for a pointer that is not
      // active, such as the synthetic one of a test tool, and the drag then goes on without it
      (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(pointerId);
    } catch {
      // no capture, the document listeners below still receive the pointer
    }

    // The rows or columns that get frozen are the first (or last) ones, so they must be in view for the guide to
    // show what the drag will freeze. The grid scrolls to that edge when the pointer starts to move, not when it
    // is pressed: a click that only focuses the bar, or a drag cancelled at once, leaves the grid where it was.
    const begin = () => {
      this.#scrollToEdge(edge);

      const rootRect = this.hot.rootElement.getBoundingClientRect();
      // A count above what fits keeps its room, so a wobble of the pointer cannot lower a count the user did not touch.
      const maxCount = Math.max(this.#getMaxCount(edge), this.getFreezeCount(edge));

      session = {
        scale: getElementScaleFactor(this.hot.rootElement, columns ? 'horizontal' : 'vertical'),
        rootRect,
        visibleRect: this.#measureFrame(rootRect).rendered,
        maxCount,
        trackSizes: this.#getTrackSizes(edge, { maxTracks: maxCount }),
        // the pointer distance is measured from the edge of the data area, past the headers
        headerSize: this.#getBandOrigin(edge),
        fromLeft: columns && growsFromStart(edge) !== this.hot.isRtl(),
      };
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      if (!session) {
        if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < DRAG_THRESHOLD) {
          return;
        }

        begin();
      }

      const { scale, rootRect, visibleRect, maxCount, trackSizes, headerSize, fromLeft } = session!;
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
      this.#setActive(edge, false);
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
    const content = this.#getContentRect(rootRect);
    const rtl = this.hot.isRtl();
    const scrollbarX = this.#getScrollbarSize(true);
    const scrollbarY = this.#getScrollbarSize(false);
    // An axis the root element does not clip is scrolled by the page or by an ancestor, and the overlays stick to
    // that scroller, so the part of the root in view is cut down to it.
    const clipX = this.#getClipRange('x');
    const clipY = this.#getClipRange('y');
    const viewport: Rect = {
      left: (clipX ? Math.max(rootRect.left, clipX[0]) : rootRect.left) + (rtl ? scrollbarX : 0),
      right: (clipX ? Math.min(rootRect.right, clipX[1]) : rootRect.right) - (rtl ? 0 : scrollbarX),
      top: clipY ? Math.max(rootRect.top, clipY[0]) : rootRect.top,
      bottom: (clipY ? Math.min(rootRect.bottom, clipY[1]) : rootRect.bottom) - scrollbarY,
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
   * Gets the band of the page, in client coordinates, that the scroller of an axis shows. It is `null` when the root
   * element clips that axis itself, because the grid then scrolls inside it and nothing outside matters.
   *
   * @param {string} axis `x` or `y`.
   * @returns {number[]|null}
   */
  #getClipRange(axis: 'x' | 'y'): [number, number] | null {
    const { rootElement, rootWindow } = this.hot;
    const overflow = rootWindow.getComputedStyle(rootElement)[axis === 'x' ? 'overflowX' : 'overflowY'];

    if (overflow !== 'visible') {
      return null;
    }

    const container = getTrimmingContainer(rootElement, axis);

    if (container === rootWindow) {
      const viewportElement = rootWindow.document.documentElement;

      return axis === 'x' ? [0, viewportElement.clientWidth] : [0, viewportElement.clientHeight];
    }

    const rect = (container as HTMLElement).getBoundingClientRect();
    const element = container as HTMLElement;

    return axis === 'x' ?
      [rect.left + element.clientLeft, rect.left + element.clientLeft + element.clientWidth] :
      [rect.top + element.clientTop, rect.top + element.clientTop + element.clientHeight];
  }

  /**
   * Listens to the scroll of the ancestors that scroll the grid, because a scrolling `div` around a grid of an
   * automatic height does not run the grid's own scroll hooks. A scrolling page is covered by those hooks.
   */
  #syncScrollAncestors() {
    const { rootElement, rootWindow } = this.hot;
    const found = new Set<HTMLElement>();

    (['x', 'y'] as const).forEach((axis) => {
      const container = this.#getClipRange(axis) ? getTrimmingContainer(rootElement, axis) : null;

      if (container && container !== rootWindow) {
        found.add(container as HTMLElement);
      }
    });

    this.#scrollAncestors.forEach((element) => {
      if (!found.has(element)) {
        element.removeEventListener('scroll', this.#onScroll);
        this.#scrollAncestors.delete(element);
      }
    });
    found.forEach((element) => {
      if (!this.#scrollAncestors.has(element)) {
        element.addEventListener('scroll', this.#onScroll, { passive: true });
        this.#scrollAncestors.add(element);
      }
    });
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
   * Marks the bar of an edge as held, which draws it in the accent color, or clears the mark.
   *
   * @param {string} edge The edge.
   * @param {boolean} active `true` while the bar is held.
   */
  #setActive(edge: FreezeEdge, active: boolean) {
    [this.#bars[edge], ...(this.#segments[edge]?.values() ?? [])].forEach((piece) => {
      piece?.classList.toggle('ht-freeze-bar--active', active);
    });
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
    // The grid keeps listening while a bar has the focus, so a key the bar does not use must not reach it: Delete
    // would clear the selected cell, and Enter or a letter would open its editor. Tab keeps its default, which
    // moves the focus on. Undo and redo are the one exception: they change the frozen counts back, and a bar that
    // holds the focus must not take them away.
    const key = event.key.toLowerCase();
    const isHistoryChord = (event.ctrlKey || event.metaKey) && !event.altKey && (key === 'z' || key === 'y');

    if (isHistoryChord) {
      return;
    }

    event.stopPropagation();

    if (event.key === 'F6') {
      event.preventDefault();
      this.#focusBar(event.shiftKey ? -1 : 1);

      return;
    }

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
      // as many as fit, but never fewer than there are
      target = Math.max(current, this.#getMaxCount(edge));
    }

    if (target === null) {
      return;
    }

    event.preventDefault();

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
    const total = isColumnEdge(edge) ? this.hot.countCols() : this.hot.countRows();
    const step = Math.sign(target - current);

    // no change was asked for, so nothing is moved or cut down
    if (step === 0) {
      return current;
    }

    // A step up stops at the last track and never lowers the count, even when the count is above the number of
    // tracks (the data is still loading). A step down is one step from where the count is.
    let next = step > 0 ? Math.min(target, total) : target;

    // a count that ends on a hidden track freezes nothing more than the count before it
    while (next > 0 && next <= total && this.#getEdgeTrackSize(edge, next - 1) === 0) {
      next += step;
    }

    return step > 0 ? Math.max(current, Math.min(next, total)) : Math.max(0, next);
  }

  /**
   * Registers the shortcut that moves the focus to the first bar. While the grid listens, Tab moves the cell
   * selection, so without it the bars could not be reached with the keyboard. F6 is the usual key for moving
   * between the panes of a page.
   */
  #registerShortcuts() {
    const context = this.hot.getShortcutManager().getContext('grid');

    // F6 only claims the key when there is a bar to focus, so it stays the browser's key otherwise
    const options = {
      runOnlyIf: () => this.enabled && this.#getFocusableBars().length > 0,
      group: SHORTCUTS_GROUP,
    };

    context?.addShortcut({ keys: [['F6']], callback: () => this.#focusBar(1), ...options });
    context?.addShortcut({ keys: [['Shift', 'F6']], callback: () => this.#focusBar(-1), ...options });
  }

  /**
   * Gets the bars the keyboard can reach: the ones that are in the document and shown.
   *
   * @returns {HTMLElement[]}
   */
  #getFocusableBars(): HTMLElement[] {
    return EDGES.map(edge => this.#bars[edge])
      .filter((bar): bar is HTMLElement => !!bar?.isConnected && !bar.hidden);
  }

  /**
   * Moves the focus to the next or the previous bar, or to the first or the last one when no bar has it.
   *
   * @param {number} direction `1` for the next bar, `-1` for the previous one.
   * @returns {boolean} `true` when a bar got the focus.
   */
  #focusBar(direction: 1 | -1): boolean {
    const bars = this.#getFocusableBars();

    if (bars.length === 0) {
      return false;
    }

    const current = bars.indexOf(getDeepActiveElement(this.hot.rootDocument) as HTMLElement);
    const fallback = direction === 1 ? 0 : bars.length - 1;
    const next = current === -1 ? fallback : (current + direction + bars.length) % bars.length;

    bars[next].focus();

    return true;
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
    Object.values(this.#segments).forEach(pieces => pieces?.forEach(piece => piece.remove()));
    this.#scrollAncestors.forEach(element => element.removeEventListener('scroll', this.#onScroll));
    this.#scrollAncestors.clear();
    this.#bars = {};
    this.#segments = {};
  }
}
