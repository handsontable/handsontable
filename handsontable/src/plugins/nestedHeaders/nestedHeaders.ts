import {
  addClass,
  removeClass,
} from '../../helpers/dom/element';
import { isNumeric, clamp } from '../../helpers/number';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isLeftClick, isRightClick, isTouchEvent } from '../../helpers/dom/event';
import { warn } from '../../helpers/console';
import {
  ACTIVE_HEADER_TYPE,
  HEADER_TYPE,
} from '../../selection';
import { BasePlugin } from '../base';
import StateManager from './stateManager';
import { createColumnVisibilityAdapter } from './stateManager/columnVisibility';
import type { HeaderNodeData } from './stateManager/headersTree';
import type { HeaderVisibility } from './stateManager/utils';
import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import GhostTable from './utils/ghostTable';
import { resolveRowspanNavigationContextRow } from './utils/navigation';

/**
 * A single configured nested header. Declares the header label and how it spans and behaves.
 */
export interface NestedHeaderSettings {
  /**
   * The header label.
   */
  label?: string;
  /**
   * The number of columns the header spans.
   */
  colspan?: number;
  /**
   * The number of header rows the header spans.
   */
  rowspan?: number;
  /**
   * CSS class name(s) added to the header element.
   */
  headerClassName?: string;
  /**
   * For a header inside a collapsible group, sets in which collapse state it (and its columns) stays
   * visible: `'collapsed'` (only while collapsed), `'expanded'` (only while expanded), or `'always'`
   * (both states). When omitted, the header defaults to `'expanded'` - hidden when the group collapses.
   * See the `CollapsibleColumns` plugin.
   */
  visibleWhen?: HeaderVisibility;
  [key: string]: unknown;
}

/**
 * A single cell in the `nestedHeaders` configuration: a plain label or a configured header object.
 */
export type NestedHeader = string | number | NestedHeaderSettings;

export const PLUGIN_KEY = 'nestedHeaders';
export const PLUGIN_PRIORITY = 280;

/**
 * @plugin NestedHeaders
 * @class NestedHeaders
 *
 * @description
 * The plugin allows to create a nested header structure, using the HTML's colspan and rowspan attributes.
 *
 * To make any header wider (covering multiple table columns), it's corresponding configuration array element should be
 * provided as an object with `label` and `colspan` properties. The `label` property defines the header's label,
 * while the `colspan` property defines a number of columns that the header should cover.
 *
 * To make any header taller (covering multiple header rows), provide a `rowspan` property that defines the number
 * of header rows that the header should span. Cells covered by a rowspan can use an empty string `''` in the
 * corresponding positions in the lower header rows, but those placeholders are optional.
 *
 * You can also set custom class names to any of the headers by providing the `headerClassName` property.
 *
 * __Note__ that the plugin supports a *nested* structure, which means, any header cannot be wider than it's "parent". In
 * other words, headers cannot overlap each other.
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   nestedHeaders: [
 *     ['A', {label: 'B', colspan: 8, headerClassName: 'htRight'}, 'C'],
 *     ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
 *     ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
 *     ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 *  ],
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   nestedHeaders={[
 *     ['A', {label: 'B', colspan: 8, headerClassName: 'htRight'}, 'C'],
 *     ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
 *     ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
 *     ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 *  ]}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: getData(),
 *   nestedHeaders: [
 *     ["A", { label: "B", colspan: 8, headerClassName: "htRight" }, "C"],
 *     ["D", { label: "E", colspan: 4 }, { label: "F", colspan: 4 }, "G"],
 *     [
 *       "H",
 *       { label: "I", colspan: 2 },
 *       { label: "J", colspan: 2 },
 *       { label: "K", colspan: 2 },
 *       { label: "L", colspan: 2 },
 *       "M",
 *     ],
 *     ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W"],
 *   ],
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings"></hot-table>
 * ```
 * :::
 */
export class NestedHeaders extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Manages the state tree of nested header spans and their visibility.
   */
  #stateManager = new StateManager();
  /**
   * Handler bound to columnIndexMapper's cacheUpdated local hook. Keeps header colspan state
   * in sync with the current hiding map whenever visibility or column order changes.
   */
  #onColumnIndexMapperCacheUpdated = ({ hiddenIndexesChanged }: { hiddenIndexesChanged: boolean }) => {
    if (!this.enabled) {
      return;
    }

    // syncVisibility must run on every cache update (including a pure column move) so the tree's
    // colspan / isHidden stay aligned with the current visual<->physical mapping (DEV-1717).
    this.#stateManager.syncVisibility(createColumnVisibilityAdapter(this.hot));

    // Rebuilding the ghost table to re-measure widths is expensive (it builds and measures a
    // detached DOM table). Only column visibility changes can alter the measured widths, so skip
    // the rebuild on pure sequence changes (e.g. manualColumnMove) - the widths map is keyed by
    // physical column and a move does not change them.
    if (hiddenIndexesChanged) {
      this.ghostTable.buildWidthsMap();
    }
  };
  /**
   * Stores the initial focus coordinates before a column header click initiates a range selection.
   */
  #focusInitialCoords: { row: number, col: number, clone: () => CellCoords } | null = null;
  /**
   * Indicates whether a column selection drag triggered by a nested header click is currently in progress.
   */
  #isColumnsSelectionInProgress = false;
  /**
   * Holds the columns to be selected when the pointer moves over a nested header during a drag. The selection
   * is applied in the `afterOnCellMouseOver` hook so that it stays gated by `stopImmediatePropagation` called
   * in a `beforeOnCellMouseOver` listener - mirroring how the mouse-down path applies its selection in
   * `afterOnCellMouseDown`. Reset on every `beforeOnCellMouseOver` to avoid applying a stale range.
   */
  #columnsToSelectOnMouseOver: [number, number, number] | null = null;
  /**
   * Keeps the last highlight position made by column selection. The coords are necessary to scroll
   * the viewport to the correct position when the nested header is clicked when the `navigableHeaders`
   * option is disabled.
   */
  #recentlyHighlightCoords: { row: number | null, col: number | null } | null = null;
  /**
   * Stores the header row level used as context for horizontal navigation when entering
   * and leaving rowspanned headers.
   */
  #rowspanHeaderNavigationContextRow: number | null = null;
  /**
   * Stores the expected next highlight coordinates after keyboard navigation. If the next
   * keyboard move starts from different coordinates, the horizontal navigation context
   * is considered stale and should be reset.
   */
  #expectedNextKeyboardHighlightCoords: { row: number; col: number } | null = null;
  /**
   * Determines if the widths map should be updated.
   */
  #updateWidthsMap = false;
  /**
   * Custom helper for getting widths of the nested headers.
   */
  // @TODO This should be changed after refactor handsontable/utils/ghostTable.
  ghostTable = new GhostTable({
    hot: this.hot,
    headersStateManager: this.#stateManager,
  });
  /**
   * The flag which determines that the nested header settings contains overlapping headers
   * configuration.
   */
  detectedOverlappedHeaders = false;
  /**
   * Determines if the current nested headers state contains headers with `rowspan`.
   */
  #hasRowspanHeaders = false;

  /**
   * Returns whether the plugin is enabled based on the presence of the `nestedHeaders` settings key.
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin by registering all required hooks and initializing the header state.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const { nestedHeaders } = this.hot.getSettings();

    if (!Array.isArray(nestedHeaders) || !Array.isArray(nestedHeaders[0])) {
      warn(toSingleLine`Your Nested Headers plugin configuration is invalid. The settings has to be\x20
                        passed as an array of arrays e.q. [['A1', { label: 'A2', colspan: 2 }]]`);
    }

    this.addHook('init', this.#onInit);
    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);
    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    this.addHook('afterOnCellMouseDown', this.#onAfterOnCellMouseDown);
    this.addHook('beforeOnCellMouseOver', this.#onBeforeOnCellMouseOver);
    this.addHook('afterOnCellMouseOver', this.#onAfterOnCellMouseOver);
    this.addHook('beforeOnCellMouseUp', this.#onBeforeOnCellMouseUp);
    this.addHook('beforeSelectionHighlightSet', this.#onBeforeSelectionHighlightSet);
    this.addHook('modifyTransformStart', this.#onModifyTransformStart);
    this.addHook('afterSelection', this.#updateFocusHighlightPosition);
    this.addHook('afterSelectionFocusSet', this.#updateFocusHighlightPosition);
    this.addHook('beforeViewportScrollHorizontally', this.#onBeforeViewportScrollHorizontally);
    this.addHook('afterGetColumnHeaderRenderers', this.#onAfterGetColumnHeaderRenderers);
    this.addHook('modifyColWidth', this.#onModifyColWidth);
    this.addHook('modifyColumnHeaderHeight', this.#onModifyColumnHeaderHeight);
    this.addHook('modifyColumnHeaderValue', this.#onModifyColumnHeaderValue);
    this.addHook('beforeHighlightingColumnHeader', this.#onBeforeHighlightingColumnHeader);
    this.addHook('beforeCopy', this.#onBeforeCopy);
    this.addHook('beforeSelectColumns', this.#onBeforeSelectColumns);
    this.addHook('beforeViewRender', this.#onBeforeViewRender);
    this.addHook('afterViewportColumnCalculatorOverride', this.#onAfterViewportColumnCalculatorOverride);
    this.addHook('modifyFocusedElement', this.#onModifyFocusedElement);
    // Sync the header tree's hidden state from the hiding map *before* the focus highlight is
    // repositioned, so #updateFocusHighlightPosition reads up-to-date colspan / isHidden values.
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#onColumnIndexMapperCacheUpdated);
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);

    super.enablePlugin();
    this.updatePlugin();
  }

  /**
   * Updates the plugin state when Handsontable settings change, rebuilding the header tree and refreshing column widths.
   */
  updatePlugin() {
    if (!this.hot.view) {
      return;
    }

    const { nestedHeaders } = this.hot.getSettings();

    this.#rowspanHeaderNavigationContextRow = null;
    this.#expectedNextKeyboardHighlightCoords = null;
    this.#stateManager.setColumnsLimit(this.hot.countCols());

    if (Array.isArray(nestedHeaders)) {
      this.detectedOverlappedHeaders = this.#stateManager.setState(nestedHeaders);
    }

    this.#hasRowspanHeaders = this.#stateManager
      .mapNodes(({ origRowspan }: { origRowspan: number }) => (origRowspan > 1 ? true : undefined))
      .length > 0;

    if (this.#hasRowspanHeaders) {
      addClass(this.hot.rootElement, 'htHasRowspanHeaders');
    } else {
      removeClass(this.hot.rootElement, 'htHasRowspanHeaders');
    }

    if (this.detectedOverlappedHeaders) {
      warn(toSingleLine`Your Nested Headers plugin setup contains overlapping headers. This kind of configuration\x20
                        is currently not supported.`);
    }

    if (this.enabled) {
      // Derive tree colspan / isHidden state from the current hiding map. This covers columns
      // that were already hidden before the plugin initialised (e.g. HiddenColumns configured
      // together with nestedHeaders). Future changes are handled by #onColumnIndexMapperCacheUpdated.
      this.#stateManager.syncVisibility(createColumnVisibilityAdapter(this.hot));
    }

    this.#updateWidthsMap = true;

    super.updatePlugin();
  }

  /**
   * Disables the plugin by removing all registered hooks, clearing header state, and resetting visual indicators.
   */
  disablePlugin() {
    this.hot.rowIndexMapper
      .removeLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);
    this.hot.columnIndexMapper
      .removeLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);
    this.hot.columnIndexMapper
      .removeLocalHook('cacheUpdated', this.#onColumnIndexMapperCacheUpdated);

    this.clearColspans();
    this.#stateManager.clear();
    this.#rowspanHeaderNavigationContextRow = null;
    this.#expectedNextKeyboardHighlightCoords = null;
    removeClass(this.hot.rootElement, 'htHasRowspanHeaders');
    this.ghostTable.clear();

    super.disablePlugin();
  }

  /**
   * Returns the internal state manager that tracks the nested header spans and their layout configuration.
   */
  getStateManager() {
    return this.#stateManager;
  }

  /**
   * Returns the number of nested header rows currently configured in the plugin.
   */
  getLayersCount() {
    return this.#stateManager.getLayersCount();
  }

  /**
   * Returns the header settings node for the specified header level and column index.
   */
  getHeaderSettings(headerLevel: number, columnIndex: number) {
    return this.#stateManager.getHeaderSettings(headerLevel, columnIndex);
  }

  /**
   * Removes all colspan and rowspan attributes from the rendered header cells in all overlays.
   */
  clearColspans() {
    if (!this.hot.view) {
      return;
    }

    const { _wt: wt } = this.hot.view;
    const headerLevels = (wt.getSetting('columnHeaders') as unknown[]).length;
    const mainHeaders = wt.wtTable.THEAD;
    const topHeaders = wt.wtOverlays.topOverlay.clone?.wtTable.THEAD;
    const topLeftCornerHeaders = wt.wtOverlays.topInlineStartCornerOverlay?.clone?.wtTable.THEAD ?? null;

    if (!mainHeaders || !topHeaders) {
      return;
    }

    for (let i = 0; i < headerLevels; i++) {
      const masterLevel = mainHeaders.childNodes[i];

      if (!masterLevel) {
        break;
      }

      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      for (let j = 0, masterNodes = masterLevel.childNodes.length; j < masterNodes; j++) {
        const masterChild = masterLevel.childNodes[j] as HTMLElement;

        masterChild.removeAttribute('colspan');
        masterChild.removeAttribute('rowspan');
        masterChild.style.display = '';
        removeClass(masterChild, 'hiddenHeader');

        if (topLevel && topLevel.childNodes[j]) {
          const topChild = topLevel.childNodes[j] as HTMLElement;

          topChild.removeAttribute('colspan');
          topChild.removeAttribute('rowspan');
          topChild.style.display = '';
          removeClass(topChild, 'hiddenHeader');
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          const cornerChild = topLeftCornerLevel.childNodes[j] as HTMLElement;

          cornerChild.removeAttribute('colspan');
          cornerChild.removeAttribute('rowspan');
          cornerChild.style.display = '';
          removeClass(cornerChild, 'hiddenHeader');
        }
      }
    }
  }

  /**
   * Creates and returns a header renderer function for the specified header layer level.
   */
  headerRendererFactory(headerLevel: number) {
    const fixedColumnsStart = this.hot.view._wt.getSetting('fixedColumnsStart') as number;

    return (renderedColumnIndex: number, TH: HTMLTableCellElement) => {
      const { columnIndexMapper } = this.hot;

      let visualColumnIndex = columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

      if (visualColumnIndex === null) {
        visualColumnIndex = renderedColumnIndex;
      }

      TH.removeAttribute('colspan');
      TH.removeAttribute('rowspan');
      TH.style.display = '';
      removeClass(TH, 'hiddenHeader');
      removeClass(TH, 'hiddenHeaderText');
      removeClass(TH, 'htRowspanHeader');
      removeClass(TH, 'htRowspanBottomLevel');

      const rendererHeaderSettings: Partial<HeaderNodeData> =
        this.#stateManager.getHeaderSettings(headerLevel, visualColumnIndex) ?? {};
      const {
        colspan,
        rowspan,
        isHidden,
        isPlaceholder,
        isRowspanPlaceholder,
        headerClassNames,
      } = rendererHeaderSettings;

      if (isRowspanPlaceholder) {
        addClass(TH, 'hiddenHeader');
        TH.style.display = 'none';

      } else if (isPlaceholder || isHidden) {
        addClass(TH, 'hiddenHeader');

      } else {
        this.#applyColspan(TH, colspan, visualColumnIndex, renderedColumnIndex, fixedColumnsStart);
        this.#applyRowspan(TH, rowspan, headerLevel);
      }

      this.hot.view.appendColHeader(
        visualColumnIndex,
        TH,
        (colIndex: number, level: number) => this.getColumnHeaderValue(colIndex, level),
        headerLevel,
      );

      // The hidden-column indicator added by HiddenColumns must appear only on the header closest
      // to the cells (the one whose bottom edge reaches the last header row). Upper-level headers -
      // group parents, or single-column headers stacked above - would point at an internal or
      // duplicated boundary, so strip the indicator from every header that does not touch the cells.
      const reachesCells = headerLevel + (rowspan ?? 1) === this.getLayersCount();

      if (!reachesCells) {
        removeClass(TH, ['beforeHiddenColumn', 'afterHiddenColumn']);
      }

      if (!isPlaceholder && !isHidden && !isRowspanPlaceholder) {
        const innerHeaderDiv = TH.querySelector('div.relative') as HTMLElement;

        if (innerHeaderDiv && headerClassNames && headerClassNames.length > 0) {
          removeClass(innerHeaderDiv,
            (this.hot.getColumnMeta(visualColumnIndex).headerClassName as string | string[] | undefined) ?? []);
          addClass(innerHeaderDiv, headerClassNames);
        }
      }
    };
  }

  /**
   * Applies colspan attribute and related CSS classes to a header cell.
   */
  #applyColspan(
    TH: HTMLTableCellElement,
    colspan: number | undefined,
    visualColumnIndex: number,
    renderedColumnIndex: number,
    fixedColumnsStart: number,
  ) {
    if (colspan === undefined || colspan <= 1) {
      return;
    }

    const { wtOverlays } = this.hot.view._wt;
    const isTopInlineStartOverlay = wtOverlays.topInlineStartCornerOverlay?.clone?.wtTable.THEAD?.contains(TH);
    const isInlineStartOverlay = wtOverlays.inlineStartOverlay?.clone?.wtTable.THEAD?.contains(TH);
    const isTopOverlay = wtOverlays.topOverlay?.clone?.wtTable.THEAD?.contains(TH);

    if (isTopOverlay && visualColumnIndex < fixedColumnsStart) {
      addClass(TH, 'hiddenHeaderText');
    }

    const correctedColspan = isTopInlineStartOverlay || isInlineStartOverlay ?
      Math.min(colspan, fixedColumnsStart - renderedColumnIndex) : colspan;

    if (correctedColspan > 1) {
      TH.setAttribute('colspan', String(correctedColspan));
    }
  }

  /**
   * Applies rowspan attribute and related CSS classes to a header cell.
   */
  #applyRowspan(TH: HTMLTableCellElement, rowspan: number | undefined, headerLevel: number) {
    if (rowspan === undefined || rowspan <= 1) {
      return;
    }

    const isBottomMostRowspanHeader = headerLevel + rowspan === this.getLayersCount();

    addClass(TH, 'htRowspanHeader');

    if (isBottomMostRowspanHeader) {
      addClass(TH, 'htRowspanBottomLevel');
    }

    TH.setAttribute('rowspan', String(rowspan));
  }

  /**
   * Returns the display value for a nested header cell at the given visual column index and header level.
   */
  getColumnHeaderValue(visualColumnIndex: number, headerLevel: number) {
    const {
      isHidden,
      isPlaceholder,
      isRowspanPlaceholder,
    }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(headerLevel, visualColumnIndex) ?? {};

    if (isPlaceholder || isHidden || isRowspanPlaceholder) {
      return '';
    }

    return this.hot.getColHeader(visualColumnIndex, headerLevel);
  }

  /**
   * Updates the focus highlight position in the selection model to reflect the current nested header layout.
   */
  readonly #updateFocusHighlightPosition = () => {
    const selection = this.hot?.getSelectedRangeActive();

    if (!selection) {
      return;
    }

    const { highlight } = selection;
    const isNestedHeadersRange = highlight.row !== null && highlight.col !== null &&
      highlight.isHeader() && highlight.col >= 0;

    if (isNestedHeadersRange && highlight.row !== null && highlight.col !== null) {
      const {
        isRowspanPlaceholder,
      }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(highlight.row, highlight.col) ?? {};
      const normalizedHighlightRow = isRowspanPlaceholder ?
        this.#findRenderableHeaderRow(highlight.row, highlight.col) :
        highlight.row;
      const columnIndex = this.#stateManager.findLeftMostColumnIndex(normalizedHighlightRow, highlight.col);
      const focusHighlight = this.hot.selection.highlight.getFocus();
      const focusVisualCellRange = focusHighlight.visualCellRange;

      if (focusVisualCellRange === null) {
        return;
      }

      // Correct the highlight/focus selection to highlight the correct TH element
      focusVisualCellRange.highlight.row = normalizedHighlightRow;
      focusVisualCellRange.highlight.col = columnIndex;
      focusVisualCellRange.from.row = normalizedHighlightRow;
      focusVisualCellRange.from.col = columnIndex;
      focusVisualCellRange.to.row = normalizedHighlightRow;
      focusVisualCellRange.to.col = columnIndex;
      focusHighlight.commit();
    }
  };

  /**
   * Finds the first visible header row for the passed coordinates. If the passed coordinates point
   * to a rowspan placeholder, the method traverses up through header levels to find the header cell
   * that visually represents that placeholder.
   *
   * @param {number} headerRow A negative row index that points to a column header level.
   * @param {number} visualColumnIndex A visual column index.
   * @returns {number}
   */
  #findRenderableHeaderRow(headerRow: number, visualColumnIndex: number) {
    const highestHeaderRow = -this.getLayersCount();

    for (let row = headerRow; row >= highestHeaderRow; row--) {
      const {
        isRowspanPlaceholder,
      }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(row, visualColumnIndex) ?? {};

      if (!isRowspanPlaceholder) {
        return row;
      }
    }

    return headerRow;
  }

  /**
   * Returns the rowspan of the root header node for the passed coordinates.
   *
   * @param {number} headerRow A negative row index that points to a column header level.
   * @param {number} visualColumnIndex A visual column index.
   * @returns {number}
   */
  #getRootHeaderRowspan(headerRow: number, visualColumnIndex: number) {
    const rootColumnIndex = this.#stateManager.findLeftMostColumnIndex(headerRow, visualColumnIndex);
    const {
      rowspan = 1,
    }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(headerRow, rootColumnIndex) ?? {};

    return rowspan;
  }

  /**
   * Checks whether the passed header coordinates point to a visible and navigable header cell.
   *
   * @param {number} headerRow A negative row index that points to a column header level.
   * @param {number} visualColumnIndex A visual column index.
   * @returns {boolean}
   */
  #isNavigableHeaderCell(headerRow: number, visualColumnIndex: number) {
    const headerSettings = this.#stateManager.getHeaderSettings(headerRow, visualColumnIndex);

    if (!headerSettings) {
      return false;
    }

    const {
      isPlaceholder,
      isRowspanPlaceholder,
      isHidden,
    } = headerSettings;

    if (isRowspanPlaceholder) {
      return headerRow < -1;
    }

    return !isPlaceholder && !isRowspanPlaceholder && !isHidden;
  }

  /**
   * Finds the nearest visual column index in the given direction that can be navigated to
   * in the provided header row.
   *
   * @param {number} headerRow A negative row index that points to a column header level.
   * @param {number} visualColumnIndex A visual column index to start searching from.
   * @param {number} direction A direction of the search (`-1` for left, `1` for right).
   * @returns {number|null}
   */
  #findNearestNavigableHeaderColumn(headerRow: number, visualColumnIndex: number, direction: number) {
    if (![-1, 1].includes(direction)) {
      return null;
    }

    for (
      let column = visualColumnIndex;
      column >= 0 && column < this.hot.countCols();
      column += direction
    ) {
      if (this.#isNavigableHeaderCell(headerRow, column)) {
        return column;
      }
    }

    return null;
  }

  /**
   * Allows to control to which column index the viewport will be scrolled. To ensure that the viewport
   * is scrolled to the correct column for the nested header the most left and the most right visual column
   * indexes are used.
   *
   * @param {number} visualColumn A visual column index to which the viewport will be scrolled.
   * @param {{ value: 'auto' | 'start' | 'end' }} snapping If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns {number}
   */
  #onBeforeViewportScrollHorizontally = (visualColumn: number, snapping: { value: string }) => {
    const selection = this.hot.getSelectedRangeActive();

    if (!selection) {
      return visualColumn;
    }

    const { highlight } = selection;
    const { navigableHeaders } = this.hot.getSettings();
    const isSelectedByColumnHeader = this.hot.selection.isSelectedByColumnHeader();
    const highlightRow = navigableHeaders ? highlight.row : this.#recentlyHighlightCoords?.row;
    const highlightColumn = isSelectedByColumnHeader ? visualColumn : highlight.col;
    const isNestedHeadersRange = highlightRow !== null && highlightRow !== undefined &&
      highlightColumn !== null && highlightColumn !== undefined &&
      highlightRow < 0 && highlightColumn >= 0;

    this.#recentlyHighlightCoords = null;

    if (!isNestedHeadersRange || highlightRow === null || highlightRow === undefined ||
        highlightColumn === null || highlightColumn === undefined) {
      return visualColumn;
    }

    const firstVisibleColumn = this.hot.getFirstFullyVisibleColumn();
    const lastVisibleColumn = this.hot.getLastFullyVisibleColumn();
    const viewportWidth = lastVisibleColumn - firstVisibleColumn + 1;
    const mostLeftColumnIndex = this.#stateManager.findLeftMostColumnIndex(highlightRow, highlightColumn);
    const mostRightColumnIndex = this.#stateManager.findRightMostColumnIndex(highlightRow, highlightColumn);
    const headerWidth = mostRightColumnIndex - mostLeftColumnIndex + 1;

    if (mostLeftColumnIndex < firstVisibleColumn && mostRightColumnIndex > lastVisibleColumn) {
      return mostLeftColumnIndex;
    }

    if (isSelectedByColumnHeader) {
      let scrollColumnIndex = null;

      if (mostLeftColumnIndex >= firstVisibleColumn && mostRightColumnIndex > lastVisibleColumn) {
        if (headerWidth > viewportWidth) {
          snapping.value = 'start';
          scrollColumnIndex = mostLeftColumnIndex;
        } else {
          snapping.value = 'end';
          scrollColumnIndex = mostRightColumnIndex;
        }

      } else if (mostLeftColumnIndex < firstVisibleColumn && mostRightColumnIndex <= lastVisibleColumn) {
        if (headerWidth > viewportWidth) {
          snapping.value = 'end';
          scrollColumnIndex = mostRightColumnIndex;
        } else {
          snapping.value = 'start';
          scrollColumnIndex = mostLeftColumnIndex;
        }
      }

      return scrollColumnIndex;
    }

    return mostLeftColumnIndex <= firstVisibleColumn ? mostLeftColumnIndex : mostRightColumnIndex;
  };

  /**
   * Adjusts the column highlight start index and width to align with the nested header spanning configuration.
   */
  #onBeforeHighlightingColumnHeader = (
    visualColumn: number, headerLevel: number,
    highlightMeta: { columnCursor: number, selectionType: string, selectionWidth: number }
  ) => {
    const headerNodeData = this.#stateManager.getHeaderTreeNodeData(headerLevel, visualColumn);

    if (!headerNodeData) {
      return visualColumn;
    }

    const {
      columnCursor,
      selectionType,
      selectionWidth,
    } = highlightMeta;
    const {
      isRoot,
      colspan = 1,
    }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(headerLevel, visualColumn) ?? {};

    if (selectionType === HEADER_TYPE) {
      if (!isRoot) {
        return headerNodeData.columnIndex as number;
      }

    } else if (selectionType === ACTIVE_HEADER_TYPE) {
      if (colspan > selectionWidth - columnCursor || !isRoot) {
        return null;
      }
    }

    return visualColumn;
  };

  /**
   * Enriches copied data with nested column header labels when column headers are included in the copy range.
   */
  #onBeforeCopy = (
    data: unknown[][],
    copyableRanges: { startRow: number, startCol: number, endRow: number, endCol: number }[],
    { columnHeadersCount }: { columnHeadersCount: number }
  ) => {
    if (columnHeadersCount === 0) {
      return;
    }

    for (let rangeIndex = 0; rangeIndex < copyableRanges.length; rangeIndex++) {
      const { startRow, startCol, endRow, endCol } = copyableRanges[rangeIndex];
      const rowsCount = endRow - startRow + 1;
      const columnsCount = startCol - endCol + 1;

      if (startRow >= 0 || columnsCount === 1) {
        break;
      }

      for (let column = startCol; column <= endCol; column++) {
        for (let row = startRow; row <= endRow; row++) {
          const zeroBasedColumnHeaderLevel = rowsCount + row;
          const zeroBasedColumnIndex = column - startCol;

          if (zeroBasedColumnIndex === 0) {
            continue; // eslint-disable-line no-continue
          }

          const isRoot = this.#stateManager.getHeaderTreeNodeData(row, column)?.isRoot;

          if (isRoot === false) {
            data[zeroBasedColumnHeaderLevel][zeroBasedColumnIndex] = '';
          }
        }
      }
    }
  };

  /**
   * Allows blocking the column selection that is controlled by the core Selection module.
   *
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {CellCoords} TD The table cell or header element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  #onBeforeOnCellMouseDown = (
    event: MouseEvent, coords: { row: number, col: number }, TD: HTMLTableCellElement,
    controller: { column: boolean }
  ) => {
    this.#rowspanHeaderNavigationContextRow = null;
    this.#expectedNextKeyboardHighlightCoords = null;

    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (headerNodeData) {
      controller.column = true;
    }
  };

  /**
   * Initiates a column selection when a nested header cell is clicked, selecting all columns covered by the header span.
   */
  #onAfterOnCellMouseDown = (event: MouseEvent, coords: CellCoords) => {
    if (coords.row === null || coords.col === null) {
      return;
    }

    const narrowedCoords = { row: coords.row, col: coords.col };
    const headerNodeData = this._getHeaderTreeNodeDataByCoords(narrowedCoords);

    if (!headerNodeData) {
      return;
    }

    this.#focusInitialCoords = { row: coords.row, col: coords.col, clone: () => coords.clone() };
    this.#isColumnsSelectionInProgress = true;

    const { selection } = this.hot;
    const currentSelection = selection.isSelected() ? selection.getSelectedRange().current() : null;
    let columnsToSelect: [number, number, number] | null = null;
    const {
      columnIndex,
      origColspan,
    } = headerNodeData;

    const allowRightClickSelection = !selection.inInSelection(coords as unknown as CellCoords);

    if (event.shiftKey && currentSelection) {
      if ((coords.col ?? 0) < (currentSelection.from.col ?? 0)) {
        columnsToSelect = [currentSelection.getTopEndCorner().col ?? 0, columnIndex, coords.row ?? 0];

      } else if ((coords.col ?? 0) > (currentSelection.from.col ?? 0)) {
        columnsToSelect = [
          currentSelection.getTopStartCorner().col ?? 0, columnIndex + origColspan - 1, coords.row ?? 0
        ];

      } else {
        columnsToSelect = [columnIndex, columnIndex + origColspan - 1, coords.row ?? 0];
      }

    } else if (isLeftClick(event) || (isRightClick(event) && allowRightClickSelection) || isTouchEvent(event)) {
      columnsToSelect = [columnIndex, columnIndex + origColspan - 1, coords.row];
    }

    if (columnsToSelect !== null) {
      selection.selectColumns(...columnsToSelect);
    }
  };

  /**
   * Computes the column selection range when the pointer moves over a nested header cell during a drag
   * selection and stores it for the `afterOnCellMouseOver` hook to apply. Blocks the core's default
   * selection handling through the `controller` so the range is driven solely by this plugin. The actual
   * selection is deferred to `afterOnCellMouseOver` so it stays cancellable through `stopImmediatePropagation`.
   */
  #onBeforeOnCellMouseOver = (
    event: MouseEvent, coords: { row: number, col: number }, TD: HTMLElement,
    controller: { column: boolean, cell: boolean }
  ) => {
    this.#columnsToSelectOnMouseOver = null;

    if (!this.hot.view.isMouseDown() || controller.column) {
      return;
    }

    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (!headerNodeData) {
      return;
    }

    const {
      columnIndex,
      origColspan,
    } = headerNodeData;

    const selectedRange = this.hot.getSelectedRangeActive();

    if (!selectedRange) {
      return;
    }

    const topStartCoords = selectedRange.getTopStartCorner();
    const bottomEndCoords = selectedRange.getBottomEndCorner();
    const { from } = selectedRange;

    controller.column = true;
    controller.cell = true;

    const headerLevel = clamp(coords.row ?? 0, -Infinity, -1);
    let columnsToSelect: [number, number, number];

    if ((coords.col ?? 0) < (from.col ?? 0)) {
      columnsToSelect = [bottomEndCoords.col ?? 0, columnIndex, headerLevel];

    } else if ((coords.col ?? 0) > (from.col ?? 0)) {
      columnsToSelect = [topStartCoords.col ?? 0, columnIndex + origColspan - 1, headerLevel];

    } else {
      columnsToSelect = [columnIndex, columnIndex + origColspan - 1, headerLevel];
    }

    this.#columnsToSelectOnMouseOver = columnsToSelect;
  };

  /**
   * Applies the column selection computed in `beforeOnCellMouseOver`. Running in the `afterOnCellMouseOver`
   * hook keeps the selection cancellable - the core skips this hook when `stopImmediatePropagation` is called
   * in a `beforeOnCellMouseOver` listener, so a drag over nested headers can be blocked the same way it is for
   * regular column headers.
   */
  #onAfterOnCellMouseOver = () => {
    if (this.#columnsToSelectOnMouseOver === null) {
      return;
    }

    const columnsToSelect = this.#columnsToSelectOnMouseOver;

    this.#columnsToSelectOnMouseOver = null;
    this.hot.selection.selectColumns(...columnsToSelect);
  };

  /**
   * Clears the in-progress column selection flag when the pointer button is released.
   */
  #onBeforeOnCellMouseUp = () => {
    this.#isColumnsSelectionInProgress = false;
  };

  /**
   * Adjusts the selection highlight position when navigable headers are enabled and a multi-column header is selected.
   */
  #onBeforeSelectionHighlightSet = () => {
    const { navigableHeaders } = this.hot.getSettings();

    if (!this.hot.view.isMouseDown() || !this.#isColumnsSelectionInProgress || !navigableHeaders) {
      return;
    }

    const selectedRange = this.hot.getSelectedRangeLast();

    if (!selectedRange) {
      return;
    }

    const columnStart = selectedRange.getTopStartCorner().col;
    const columnEnd = selectedRange.getBottomEndCorner().col;
    const headerNodeData = this.#stateManager.getHeaderTreeNodeData(
      this.#focusInitialCoords!.row, this.#focusInitialCoords!.col
    );

    if (!headerNodeData) {
      return;
    }

    const { columnIndex, origColspan } = headerNodeData;

    selectedRange.setHighlight(this.#focusInitialCoords as unknown as CellCoords);

    if (columnStart !== null && columnEnd !== null && (
      origColspan > selectedRange.getWidth() ||
        columnIndex < columnStart ||
        columnIndex + origColspan - 1 > columnEnd)) {

      const headerLevel = this.#stateManager
        .findTopMostEntireHeaderLevel(
          clamp(columnStart, columnIndex, columnIndex + origColspan - 1),
          clamp(columnEnd, columnIndex, columnIndex + origColspan - 1),
        );

      selectedRange.highlight.row = headerLevel;
      selectedRange.highlight.col = selectedRange.from.col;
    }
  };

  /**
   * Corrects the keyboard navigation delta when traversing across rowspanned nested header cells.
   */
  #onModifyTransformStart = (delta: { row: number, col: number }) => {
    const activeRange = this.hot.getSelectedRangeActive();

    if (!activeRange) {
      return;
    }

    const { highlight } = activeRange;
    const {
      row: expectedRow,
      col: expectedColumn,
    } = this.#expectedNextKeyboardHighlightCoords ?? {};

    if (Number.isInteger(expectedRow) && Number.isInteger(expectedColumn)) {
      if (highlight.row !== expectedRow || highlight.col !== expectedColumn) {
        this.#rowspanHeaderNavigationContextRow = null;
      }
    }

    const highlightRow = highlight.row ?? 0;
    const highlightCol = highlight.col ?? 0;
    const initialDeltaRow = delta.row;
    const initialDeltaColumn = delta.col;
    let targetColumn = highlightCol + delta.col;
    let targetRow = highlightRow + delta.row;

    if (delta.row !== 0 && targetColumn >= 0) {
      const rowDirection = Math.sign(delta.row);
      const lowestHeaderRow = -1;
      const highestHeaderRow = -this.getLayersCount();
      let adjustedNextRow = targetRow;

      while (adjustedNextRow <= lowestHeaderRow && adjustedNextRow >= highestHeaderRow) {
        const {
          isRowspanPlaceholder,
        }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(adjustedNextRow, targetColumn) ?? {};

        if (!isRowspanPlaceholder) {
          break;
        }

        adjustedNextRow += rowDirection;
      }

      delta.row = adjustedNextRow - highlightRow;
      targetRow = adjustedNextRow;
    }

    if (initialDeltaRow === 0 && initialDeltaColumn !== 0 && highlightRow < 0) {
      if (this.#rowspanHeaderNavigationContextRow !== null) {
        const contextTargetColumn = this.#findNearestNavigableHeaderColumn(
          this.#rowspanHeaderNavigationContextRow,
          targetColumn,
          Math.sign(initialDeltaColumn),
        );

        if (contextTargetColumn !== null) {
          targetColumn = contextTargetColumn;
          targetRow = this.#rowspanHeaderNavigationContextRow;
        }
      }

      if (targetColumn < 0 && initialDeltaColumn < 0 && this.#rowspanHeaderNavigationContextRow !== null) {
        targetRow = this.#rowspanHeaderNavigationContextRow;
      }

      const currentHeaderStartColumn = this.#stateManager.findLeftMostColumnIndex(highlightRow, highlightCol);
      const currentHeaderEndColumn = this.#stateManager.findRightMostColumnIndex(highlightRow, highlightCol);
      const {
        isRowspanPlaceholder: isTargetRowspanPlaceholder,
      }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(targetRow, targetColumn) ?? {};
      const isTargetInsideCurrentHeader = targetRow === highlightRow &&
        targetColumn >= currentHeaderStartColumn &&
        targetColumn <= currentHeaderEndColumn;
      const shouldKeepLogicalRowForRowspan = targetRow === highlightRow &&
        isTargetRowspanPlaceholder &&
        initialDeltaColumn > 0 &&
        highlightRow < -1;

      if (!isTargetInsideCurrentHeader && !shouldKeepLogicalRowForRowspan) {
        targetRow = this.#findRenderableHeaderRow(targetRow, targetColumn);
      }
      delta.row = targetRow - highlightRow;

      const targetHeaderRowspan = this.#getRootHeaderRowspan(targetRow, targetColumn);

      if (targetHeaderRowspan > 1 && !Number.isInteger(this.#rowspanHeaderNavigationContextRow)) {
        this.#rowspanHeaderNavigationContextRow = resolveRowspanNavigationContextRow(
          highlightRow,
          targetColumn,
          -this.getLayersCount(),
          (headerRow: number, visualColumn: number) => {
            const settings = this.#stateManager.getHeaderSettings(headerRow, visualColumn);

            return settings ? { ...settings, isRowspanPlaceholder: settings.isRowspanPlaceholder ?? false } : null;
          },
        );
      }

    }

    const nextCoords = this.hot._createCellCoords(targetRow, targetColumn);
    const isNestedHeadersRange = nextCoords.isHeader() && (nextCoords.col ?? -1) >= 0;

    if (!isNestedHeadersRange || initialDeltaRow !== 0) {
      this.#rowspanHeaderNavigationContextRow = null;
    }

    if (isNestedHeadersRange && highlight.row !== null && highlight.col !== null &&
        nextCoords.row !== null && nextCoords.col !== null) {
      const {
        isRowspanPlaceholder: isCurrentHeaderRowspanPlaceholderForBounds,
      }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(highlight.row, highlight.col) ?? {};
      const {
        isRowspanPlaceholder: isNextHeaderRowspanPlaceholderForBounds,
      }: Partial<HeaderNodeData> = this.#stateManager.getHeaderSettings(nextCoords.row, nextCoords.col) ?? {};
      let visualColumnIndexStart = this.#stateManager.findLeftMostColumnIndex(nextCoords.row, nextCoords.col);
      let visualColumnIndexEnd = this.#stateManager.findRightMostColumnIndex(nextCoords.row, nextCoords.col);

      if (isNextHeaderRowspanPlaceholderForBounds) {
        const renderableNextHeaderRow = this.#findRenderableHeaderRow(nextCoords.row, nextCoords.col);

        visualColumnIndexStart = this.#stateManager.findLeftMostColumnIndex(renderableNextHeaderRow, nextCoords.col);
        visualColumnIndexEnd = this.#stateManager.findRightMostColumnIndex(renderableNextHeaderRow, nextCoords.col);
      }

      if (isCurrentHeaderRowspanPlaceholderForBounds) {
        const renderableCurrentHeaderRow = this.#findRenderableHeaderRow(highlight.row, highlight.col);

        visualColumnIndexStart =
          this.#stateManager.findLeftMostColumnIndex(renderableCurrentHeaderRow, highlight.col);
        visualColumnIndexEnd =
          this.#stateManager.findRightMostColumnIndex(renderableCurrentHeaderRow, highlight.col);

        if (initialDeltaColumn < 0) {
          visualColumnIndexStart = Math.max(visualColumnIndexStart, Math.min(highlight.col, nextCoords.col));
        } else if (initialDeltaColumn > 0) {
          visualColumnIndexEnd = Math.min(visualColumnIndexEnd, Math.max(highlight.col, nextCoords.col));
        }
      }

      if (delta.col < 0) {
        const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
          visualColumnIndexStart - 1 : visualColumnIndexEnd;
        const notHiddenColumnIndex = this.hot.columnIndexMapper.getNearestNotHiddenIndex(nextColumn, -1);

        if (notHiddenColumnIndex === null) {
          // There are no visible columns anymore, so move the selection out of the table edge. This will
          // be processed by the selection Transformer class as a move selection to the previous row (if autoWrapRow is enabled).
          delta.col = -this.hot.view.countRenderableColumnsInRange(0, highlight.col);
        } else {
          delta.col = -Math.max(
            this.hot.view.countRenderableColumnsInRange(notHiddenColumnIndex, highlight.col) - 1,
            1,
          );
        }

      } else if (delta.col > 0) {
        const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
          visualColumnIndexEnd + 1 : visualColumnIndexStart;
        const notHiddenColumnIndex = this.hot.columnIndexMapper.getNearestNotHiddenIndex(nextColumn, 1);

        if (notHiddenColumnIndex === null) {
          // There are no visible columns anymore, so move the selection out of the table edge. This will
          // be processed by the selection Transformer class as a move selection to the next row (if autoWrapRow is enabled).
          delta.col = this.hot.view.countRenderableColumnsInRange(highlight.col, this.hot.countCols());

          if (isCurrentHeaderRowspanPlaceholderForBounds) {
            delta.col += 1;

            if (highlight.row < -1) {
              delta.row = 1;
              delta.col = -(highlight.col + 1);
            }
          }
        } else {
          delta.col = Math.max(
            this.hot.view.countRenderableColumnsInRange(highlight.col, notHiddenColumnIndex) - 1,
            1,
          );
        }
      }
    }

    this.#expectedNextKeyboardHighlightCoords = {
      row: highlightRow + delta.row,
      col: highlightCol + delta.col,
    };
  };

  /**
   * Expands the column selection range to fully include the header spans at the start and end columns.
   */
  #onBeforeSelectColumns = (
    from: { row: number, col: number }, to: { row: number, col: number }, highlight: { clone: () => CellCoords }
  ) => {
    const headerLevel = from.row;
    const startNodeData = this._getHeaderTreeNodeDataByCoords({
      row: headerLevel,
      col: from.col,
    });
    const endNodeData = this._getHeaderTreeNodeDataByCoords({
      row: headerLevel,
      col: to.col,
    });

    this.#recentlyHighlightCoords = highlight.clone();

    if (to.col < from.col) {
      if (startNodeData) {
        from.col = startNodeData.columnIndex + startNodeData.origColspan - 1;
      }

      if (endNodeData) {
        to.col = endNodeData.columnIndex;
      }

    } else if (to.col >= from.col) {
      if (startNodeData) {
        from.col = startNodeData.columnIndex;
      }

      if (endNodeData) {
        to.col = endNodeData.columnIndex + endNodeData.origColspan - 1;
      }
    }
  };

  /**
   * Replaces the default column header renderer array with layer-specific renderers generated by this plugin.
   */
  #onAfterGetColumnHeaderRenderers = (renderersArray: unknown[]) => {
    if (this.#stateManager.getLayersCount() > 0) {
      renderersArray.length = 0;

      for (let headerLayer = 0; headerLayer < this.#stateManager.getLayersCount(); headerLayer++) {
        renderersArray.push(this.headerRendererFactory(headerLayer));
      }
    }
  };

  /**
   * Extends the viewport start column to include any header spans that begin outside the calculated viewport boundary.
   */
  #onAfterViewportColumnCalculatorOverride = (calc: { startColumn: number }) => {
    const headerLayersCount = this.#stateManager.getLayersCount();
    let newStartColumn = calc.startColumn;
    let nonRenderable = !!headerLayersCount;

    for (let headerLayer = 0; headerLayer < headerLayersCount; headerLayer++) {
      const startColumn = this.#stateManager.findLeftMostColumnIndex(headerLayer, calc.startColumn);
      const renderedStartColumn = this.hot.columnIndexMapper.getRenderableFromVisualIndex(startColumn);

      if (startColumn >= 0) {
        nonRenderable = false;
      }

      if (isNumeric(renderedStartColumn) && renderedStartColumn !== null && renderedStartColumn < calc.startColumn) {
        newStartColumn = renderedStartColumn;
        break;
      }
    }

    calc.startColumn =
      nonRenderable ?
        (this.#stateManager.getHeaderTreeNodeData(0, newStartColumn)?.columnIndex ?? newStartColumn) :
        newStartColumn;
  };

  /**
   * `modifyColWidth` hook callback - returns width from cache, when is greater than incoming from hook.
   *
   * When `autoColumnSize` is explicitly disabled, the user opts out of auto-sizing
   * columns based on content; the plugin respects user-provided widths and does
   * not override them with the ghost-table-measured header label width.
   */
  #onModifyColWidth = (width: number, column: number) => {
    if (this.hot.getSettings().autoColumnSize === false) {
      return width;
    }

    const cachedWidth = this.ghostTable.getWidth(column) ?? 0;

    return width > cachedWidth ? width : cachedWidth;
  };

  /**
   * Equalizes all nested column header layers' heights when rowspans are used.
   */
  #onModifyColumnHeaderHeight = (): number[] | undefined => {
    if (!this.#hasRowspanHeaders) {
      return;
    }

    const computedStyle = this.hot.rootWindow.getComputedStyle(this.hot.rootElement);
    const cellVerticalPadding = Number.parseFloat(computedStyle.getPropertyValue('--ht-cell-vertical-padding'));
    const lineHeight = Number.parseFloat(computedStyle.getPropertyValue('--ht-line-height'));
    const baseHeaderHeight = Math.round((cellVerticalPadding * 2) + lineHeight + 1);

    if (!Number.isFinite(baseHeaderHeight)) {
      return;
    }

    return (new Array(this.getLayersCount()) as number[]).fill(baseHeaderHeight);
  };

  /**
   * Listens the `modifyColumnHeaderValue` hook that overwrites the column headers values based on
   * the internal state and settings of the plugin.
   *
   * @param value The column header value.
   * @param visualColumnIndex The visual column index.
   * @param headerLevel The index of header level. The header level accepts positive (0 to N)
   *                    and negative (-1 to -N) values. For positive values, 0 points to the
   *                    top most header, and for negative direction, -1 points to the most bottom
   *                    header (the header closest to the cells).
   */
  #onModifyColumnHeaderValue = (value: string, visualColumnIndex: number, headerLevel: number): string => {
    const {
      label,
    } = this.#stateManager.getHeaderTreeNodeData(headerLevel, visualColumnIndex) ?? { label: '' };

    return label;
  };

  /**
   * Returns the leftmost DOM cell element within the nested header span at the given row and column when in a header row.
   */
  #onModifyFocusedElement = (row: number, column: number) => {
    if (row < 0) {
      return this.hot.getCell(row, this.#stateManager.findLeftMostColumnIndex(row, column), true) ?? undefined;
    }
  };

  /**
   * Updates the plugin state after HoT initialization.
   */
  // @TODO: Workaround for broken plugin initialization abstraction.
  #onInit = () => {
    this.updatePlugin();
  };

  /**
   * Re-initializes the plugin state after new data is loaded, unless this is the initial data load.
   */
  #onAfterLoadData = (sourceData: unknown[], initialLoad: boolean) => {
    if (!initialLoad) {
      this.updatePlugin();
    }
  };

  /**
   * Extends the nested headers structure when columns are inserted into the dataset, keeping the
   * header tree aligned with the grid body. Headers spanning the insertion point are widened; a
   * column inserted at a header boundary becomes a standalone header.
   *
   * @param {number} visualColumnIndex A visual column index at which the columns were inserted.
   * @param {number} amount The number of inserted columns.
   */
  #onAfterCreateCol = (visualColumnIndex: number, amount: number) => {
    this.#stateManager.insertColumns(visualColumnIndex, amount);
    this.#updateWidthsMap = true;
  };

  /**
   * Shrinks the nested headers structure when columns are removed from the dataset, keeping the
   * header tree aligned with the grid body. Headers overlapping the removed range are shortened,
   * re-anchored, or dropped when they lose all of their columns.
   *
   * @param {number} visualColumnIndex A visual column index from which the columns were removed.
   * @param {number} amount The number of removed columns.
   */
  #onAfterRemoveCol = (visualColumnIndex: number, amount: number) => {
    this.#stateManager.removeColumns(visualColumnIndex, amount);
    this.#updateWidthsMap = true;
  };

  /**
   * Builds the widths map before the view is rendered.
   */
  #onBeforeViewRender = () => {
    if (this.#updateWidthsMap) {
      this.ghostTable
        .setLayersCount(this.getLayersCount())
        .buildWidthsMap();
      this.#updateWidthsMap = false;
    }
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#stateManager.clear();
    removeClass(this.hot.rootElement, 'htHasRowspanHeaders');

    super.destroy();
  }

  /**
   * Returns the header tree node data for the given coordinates, or undefined if the coordinates do not point to a header cell.
   */
  _getHeaderTreeNodeDataByCoords(coords: { row: number, col: number }): HeaderNodeData | null | undefined {
    if (coords.row >= 0 || coords.col < 0) {
      return;
    }

    return this.#stateManager.getHeaderTreeNodeData(coords.row, coords.col);
  }
}
