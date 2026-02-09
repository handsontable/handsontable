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
import GhostTable from './utils/ghostTable';

export const PLUGIN_KEY = 'nestedHeaders';
export const PLUGIN_PRIORITY = 280;

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin NestedHeaders
 * @class NestedHeaders
 *
 * @description
 * The plugin allows to create a nested header structure, using the HTML's colspan attribute.
 *
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
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  #stateManager = new StateManager();
  #hidingIndexMapObserver: { unsubscribe: () => void } | null = null;
  #focusInitialCoords: { row: number, col: number, clone: () => any } | null = null;
  #isColumnsSelectionInProgress = false;
  #recentlyHighlightCoords: { row: number, col: number } | null = null;
  // @TODO This should be changed after refactor handsontable/utils/ghostTable.
  ghostTable = new GhostTable(this.hot, (row: number, column: number) => this.getHeaderSettings(row, column));
  detectedOverlappedHeaders = false;

  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const { nestedHeaders } = this.hot.getSettings();

    if (!Array.isArray(nestedHeaders) || !Array.isArray(nestedHeaders[0])) {
      warn(toSingleLine`Your Nested Headers plugin configuration is invalid. The settings has to be\x20
                        passed as an array of arrays e.q. [['A1', { label: 'A2', colspan: 2 }]]`);
    }

    this.addHook('init', () => this.#onInit());
    this.addHook('afterLoadData', (...args: unknown[]) => (this.#onAfterLoadData as Function)(...args));
    this.addHook('beforeOnCellMouseDown', (...args: unknown[]) => (this.#onBeforeOnCellMouseDown as Function)(...args));
    this.addHook('afterOnCellMouseDown', (...args: unknown[]) => (this.#onAfterOnCellMouseDown as Function)(...args));
    this.addHook('beforeOnCellMouseOver', (...args: unknown[]) => (this.#onBeforeOnCellMouseOver as Function)(...args));
    this.addHook('beforeOnCellMouseUp', (...args: unknown[]) => (this.#onBeforeOnCellMouseUp as Function)(...args));
    this.addHook('beforeSelectionHighlightSet', (...args: unknown[]) => (this.#onBeforeSelectionHighlightSet as Function)(...args));
    this.addHook('modifyTransformStart', (...args: unknown[]) => (this.#onModifyTransformStart as Function)(...args));
    this.addHook('afterSelection', () => this.#updateFocusHighlightPosition());
    this.addHook('afterSelectionFocusSet', () => this.#updateFocusHighlightPosition());
    this.addHook('beforeViewportScrollHorizontally', (...args: unknown[]) => (this.#onBeforeViewportScrollHorizontally as Function)(...args));
    this.addHook('afterGetColumnHeaderRenderers', (array: unknown[]) => this.#onAfterGetColumnHeaderRenderers(array));
    this.addHook('modifyColWidth', (...args: unknown[]) => (this.#onModifyColWidth as Function)(...args));
    this.addHook('modifyColumnHeaderValue', (...args: unknown[]) => (this.#onModifyColumnHeaderValue as Function)(...args));
    this.addHook('beforeHighlightingColumnHeader', (...args: unknown[]) => (this.#onBeforeHighlightingColumnHeader as Function)(...args));
    this.addHook('beforeCopy', (...args: unknown[]) => (this.#onBeforeCopy as Function)(...args));
    this.addHook('beforeSelectColumns', (...args: unknown[]) => (this.#onBeforeSelectColumns as Function)(...args));
    this.addHook(
      'afterViewportColumnCalculatorOverride',
      (...args: unknown[]) => (this.#onAfterViewportColumnCalculatorOverride as Function)(...args)
    );
    this.addHook('modifyFocusedElement', (...args: unknown[]) => (this.#onModifyFocusedElement as Function)(...args));
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);

    super.enablePlugin();
    this.updatePlugin();
  }

  updatePlugin() {
    if (!this.hot.view) {
      return;
    }

    const { nestedHeaders } = this.hot.getSettings();

    this.#stateManager.setColumnsLimit(this.hot.countCols());

    if (Array.isArray(nestedHeaders)) {
      this.detectedOverlappedHeaders = this.#stateManager.setState(nestedHeaders);
    }

    if (this.detectedOverlappedHeaders) {
      warn(toSingleLine`Your Nested Headers plugin setup contains overlapping headers. This kind of configuration\x20
                        is currently not supported.`);
    }

    if (this.enabled) {
      this.hot.columnIndexMapper
        .hidingMapsCollection
        .getMergedValues()
        .forEach((isColumnHidden: boolean, physicalColumnIndex: number) => {
          const actionName = isColumnHidden === true ? 'hide-column' : 'show-column';

          this.#stateManager.triggerColumnModification(actionName, physicalColumnIndex);
        });
    }

    if (!this.#hidingIndexMapObserver && this.enabled) {
      this.#hidingIndexMapObserver = this.hot.columnIndexMapper
        .createChangesObserver('hiding')
        .subscribe((changes: { op: string, index: number, newValue: boolean }[]) => {
          changes.forEach(({ op, index: columnIndex, newValue }: { op: string, index: number, newValue: boolean }) => {
            if (op === 'replace') {
              const actionName = newValue === true ? 'hide-column' : 'show-column';

              this.#stateManager.triggerColumnModification(actionName, columnIndex);
            }
          });

          this.ghostTable.buildWidthsMap();
        });
    }

    this.ghostTable
      .setLayersCount(this.getLayersCount())
      .buildWidthsMap();

    super.updatePlugin();
  }

  disablePlugin() {
    (this.hot.rowIndexMapper as any)
      .removeLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);
    (this.hot.columnIndexMapper as any)
      .removeLocalHook('cacheUpdated', this.#updateFocusHighlightPosition);

    this.clearColspans();
    this.#stateManager.clear();
    this.#hidingIndexMapObserver.unsubscribe();
    this.#hidingIndexMapObserver = null;
    this.ghostTable.clear();

    super.disablePlugin();
  }

  getStateManager() {
    return this.#stateManager;
  }

  getLayersCount() {
    return this.#stateManager.getLayersCount();
  }

  getHeaderSettings(headerLevel: number, columnIndex: number) {
    return this.#stateManager.getHeaderSettings(headerLevel, columnIndex);
  }

  clearColspans() {
    if (!this.hot.view) {
      return;
    }

    const { _wt: wt } = this.hot.view;
    const headerLevels = (wt.getSetting('columnHeaders') as unknown[]).length;
    const mainHeaders = wt.wtTable.THEAD;
    const topHeaders = wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerHeaders = wt.wtOverlays.topInlineStartCornerOverlay ?
      wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.THEAD : null;

    for (let i = 0; i < headerLevels; i++) {
      const masterLevel = mainHeaders.childNodes[i];

      if (!masterLevel) {
        break;
      }

      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      for (let j = 0, masterNodes = masterLevel.childNodes.length; j < masterNodes; j++) {
        (masterLevel.childNodes[j] as HTMLElement).removeAttribute('colspan');
        removeClass(masterLevel.childNodes[j] as HTMLElement, 'hiddenHeader');

        if (topLevel && topLevel.childNodes[j]) {
          (topLevel.childNodes[j] as HTMLElement).removeAttribute('colspan');
          removeClass(topLevel.childNodes[j] as HTMLElement, 'hiddenHeader');
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          (topLeftCornerLevel.childNodes[j] as HTMLElement).removeAttribute('colspan');
          removeClass(topLeftCornerLevel.childNodes[j] as HTMLElement, 'hiddenHeader');
        }
      }
    }
  }

  headerRendererFactory(headerLevel: number) {
    const fixedColumnsStart = this.hot.view._wt.getSetting('fixedColumnsStart') as number;

    return (renderedColumnIndex: number, TH: HTMLTableCellElement) => {
      const { columnIndexMapper, view } = this.hot;

      let visualColumnIndex = columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

      if (visualColumnIndex === null) {
        visualColumnIndex = renderedColumnIndex;
      }

      TH.removeAttribute('colspan');
      removeClass(TH, 'hiddenHeader');
      removeClass(TH, 'hiddenHeaderText');

      const {
        colspan,
        isHidden,
        isPlaceholder,
        headerClassNames,
      } = (this.#stateManager.getHeaderSettings(headerLevel, visualColumnIndex) ?? { label: '' }) as any;

      if (isPlaceholder || isHidden) {
        addClass(TH, 'hiddenHeader');

      } else if ((colspan as number) > 1) {
        const { wtOverlays } = view._wt;
        const isTopInlineStartOverlay = wtOverlays.topInlineStartCornerOverlay?.clone.wtTable.THEAD.contains(TH);
        const isInlineStartOverlay = wtOverlays.inlineStartOverlay?.clone.wtTable.THEAD.contains(TH);
        const isTopOverlay = wtOverlays.topOverlay?.clone.wtTable.THEAD.contains(TH);

        if (isTopOverlay && visualColumnIndex < fixedColumnsStart) {
          addClass(TH, 'hiddenHeaderText');
        }

        const correctedColspan = isTopInlineStartOverlay || isInlineStartOverlay ?
          Math.min(colspan as number, fixedColumnsStart - renderedColumnIndex) : colspan as number;

        if (correctedColspan > 1) {
          TH.setAttribute('colspan', correctedColspan as any);
        }
      }

      (this.hot.view as any).appendColHeader(
        visualColumnIndex,
        TH,
        (...args: unknown[]) => (this.getColumnHeaderValue as Function)(...args),
        headerLevel,
      );

      if (!isPlaceholder && !isHidden) {
        const innerHeaderDiv = TH.querySelector('div.relative') as HTMLElement;

        if (innerHeaderDiv && headerClassNames && headerClassNames.length > 0) {
          removeClass(innerHeaderDiv as HTMLElement, this.hot.getColumnMeta(visualColumnIndex).headerClassName as any);
          addClass(innerHeaderDiv as HTMLElement, headerClassNames as any);
        }
      }
    };
  }

  getColumnHeaderValue(visualColumnIndex: number, headerLevel: number) {
    const {
      isHidden,
      isPlaceholder,
    } = (this.#stateManager.getHeaderSettings(headerLevel, visualColumnIndex) ?? {}) as any;

    if (isPlaceholder || isHidden) {
      return '';
    }

    return this.hot.getColHeader(visualColumnIndex, headerLevel);
  }

  #updateFocusHighlightPosition = () => {
    const selection = this.hot?.getSelectedRangeActive();

    if (!selection) {
      return;
    }

    const { highlight } = selection;
    const isNestedHeadersRange = highlight.isHeader() && highlight.col >= 0;

    if (isNestedHeadersRange) {
      const columnIndex = this.#stateManager.findLeftMostColumnIndex(highlight.row, highlight.col);
      const focusHighlight = this.hot.selection.highlight.getFocus();

      focusHighlight.visualCellRange.highlight.col = columnIndex;
      focusHighlight.visualCellRange.from.col = columnIndex;
      focusHighlight.visualCellRange.to.col = columnIndex;
      focusHighlight.commit();
    }
  }

  #onBeforeViewportScrollHorizontally(visualColumn: number, snapping: { value: string }) {
    const selection = this.hot.getSelectedRangeActive();

    if (!selection) {
      return visualColumn;
    }

    const { highlight } = selection;
    const { navigableHeaders } = this.hot.getSettings();
    const isSelectedByColumnHeader = this.hot.selection.isSelectedByColumnHeader();
    const highlightRow = navigableHeaders ? highlight.row : (this.#recentlyHighlightCoords as any)?.row;
    const highlightColumn = isSelectedByColumnHeader ? visualColumn : highlight.col;
    const isNestedHeadersRange = highlightRow < 0 && highlightColumn >= 0;

    this.#recentlyHighlightCoords = null;

    if (!isNestedHeadersRange) {
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
  }

  #onBeforeHighlightingColumnHeader(visualColumn: number, headerLevel: number, highlightMeta: { columnCursor: number, selectionType: string, selectionWidth: number }) {
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
      colspan,
    } = this.#stateManager.getHeaderSettings(headerLevel, visualColumn) as any;

    if (selectionType === HEADER_TYPE) {
      if (!isRoot) {
        return headerNodeData.columnIndex;
      }

    } else if (selectionType === ACTIVE_HEADER_TYPE) {
      if (colspan > selectionWidth - columnCursor || !isRoot) {
        return null;
      }
    }

    return visualColumn;
  }

  #onBeforeCopy(data: unknown[][], copyableRanges: { startRow: number, startCol: number, endRow: number, endCol: number }[], { columnHeadersCount }: { columnHeadersCount: number }) {
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
            (data[zeroBasedColumnHeaderLevel] as unknown[])[zeroBasedColumnIndex] = '';
          }
        }
      }
    }
  }

  #onBeforeOnCellMouseDown(event: MouseEvent, coords: { row: number, col: number }, TD: HTMLTableCellElement, controller: { column: boolean }) {
    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (headerNodeData) {
      controller.column = true;
    }
  }

  #onAfterOnCellMouseDown(event: MouseEvent, coords: { row: number, col: number, clone: () => any }) {
    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (!headerNodeData) {
      return;
    }

    this.#focusInitialCoords = coords.clone();
    this.#isColumnsSelectionInProgress = true;

    const { selection } = this.hot;
    const currentSelection = selection.isSelected() ? selection.getSelectedRange().current() : null;
    const columnsToSelect: number[] = [];
    const {
      columnIndex,
      origColspan,
    } = headerNodeData;

    const allowRightClickSelection = !selection.inInSelection(coords as any);

    if (event.shiftKey && currentSelection) {
      if (coords.col < currentSelection.from.col) {
        columnsToSelect.push(currentSelection.getTopEndCorner().col, columnIndex, coords.row);

      } else if (coords.col > currentSelection.from.col) {
        columnsToSelect.push(currentSelection.getTopStartCorner().col, columnIndex + origColspan - 1, coords.row);

      } else {
        columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, coords.row);
      }

    } else if (isLeftClick(event) || (isRightClick(event) && allowRightClickSelection) || isTouchEvent(event)) {
      columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, coords.row);
    }

    selection.selectColumns(...columnsToSelect as [number, ...number[]]);
  }

  #onBeforeOnCellMouseOver(event: MouseEvent, coords: { row: number, col: number }, TD: HTMLElement, controller: { column: boolean, cell: boolean }) {
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
    const topStartCoords = selectedRange.getTopStartCorner();
    const bottomEndCoords = selectedRange.getBottomEndCorner();
    const { from } = selectedRange;

    controller.column = true;
    controller.cell = true;

    const columnsToSelect: number[] = [];
    const headerLevel = clamp(coords.row, -Infinity, -1);

    if (coords.col < from.col) {
      columnsToSelect.push(bottomEndCoords.col, columnIndex, headerLevel);

    } else if (coords.col > from.col) {
      columnsToSelect.push(topStartCoords.col, columnIndex + origColspan - 1, headerLevel);

    } else {
      columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, headerLevel);
    }

    this.hot.selection.selectColumns(...columnsToSelect as [number, ...number[]]);
  }

  #onBeforeOnCellMouseUp() {
    this.#isColumnsSelectionInProgress = false;
  }

  #onBeforeSelectionHighlightSet() {
    const { navigableHeaders } = this.hot.getSettings();

    if (!this.hot.view.isMouseDown() || !this.#isColumnsSelectionInProgress || !navigableHeaders) {
      return;
    }

    const selectedRange = this.hot.getSelectedRangeLast();
    const columnStart = selectedRange.getTopStartCorner().col;
    const columnEnd = selectedRange.getBottomEndCorner().col;
    const {
      columnIndex,
      origColspan,
    } = this.#stateManager.getHeaderTreeNodeData(this.#focusInitialCoords!.row, this.#focusInitialCoords!.col);

    selectedRange.setHighlight(this.#focusInitialCoords as any);

    if (origColspan > selectedRange.getWidth() ||
        columnIndex < columnStart ||
        columnIndex + origColspan - 1 > columnEnd) {

      const headerLevel = this.#stateManager
        .findTopMostEntireHeaderLevel(
          clamp(columnStart, columnIndex, columnIndex + origColspan - 1),
          clamp(columnEnd, columnIndex, columnIndex + origColspan - 1),
        );

      selectedRange.highlight.row = headerLevel;
      selectedRange.highlight.col = selectedRange.from.col;
    }
  }

  #onModifyTransformStart(delta: { row: number, col: number }) {
    const { highlight } = this.hot.getSelectedRangeActive();
    const nextCoords = this.hot._createCellCoords(highlight.row + delta.row, highlight.col + delta.col);
    const isNestedHeadersRange = nextCoords.isHeader() && nextCoords.col >= 0;

    if (!isNestedHeadersRange) {
      return;
    }

    const visualColumnIndexStart = this.#stateManager.findLeftMostColumnIndex(nextCoords.row, nextCoords.col);
    const visualColumnIndexEnd = this.#stateManager.findRightMostColumnIndex(nextCoords.row, nextCoords.col);

    if (delta.col < 0) {
      const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
        visualColumnIndexStart - 1 : visualColumnIndexEnd;
      const notHiddenColumnIndex = this.hot.columnIndexMapper.getNearestNotHiddenIndex(nextColumn, -1);

      if (notHiddenColumnIndex === null) {
        delta.col = -this.hot.view.countRenderableColumnsInRange(0, highlight.col);
      } else {
        delta.col = -Math.max(this.hot.view.countRenderableColumnsInRange(notHiddenColumnIndex, highlight.col) - 1, 1);
      }

    } else if (delta.col > 0) {
      const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
        visualColumnIndexEnd + 1 : visualColumnIndexStart;
      const notHiddenColumnIndex = this.hot.columnIndexMapper.getNearestNotHiddenIndex(nextColumn, 1);

      if (notHiddenColumnIndex === null) {
        delta.col = this.hot.view.countRenderableColumnsInRange(highlight.col, this.hot.countCols());
      } else {
        delta.col = Math.max(this.hot.view.countRenderableColumnsInRange(highlight.col, notHiddenColumnIndex) - 1, 1);
      }
    }
  }

  #onBeforeSelectColumns(from: { row: number, col: number }, to: { row: number, col: number }, highlight: { clone: () => any }) {
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
  }

  #onAfterGetColumnHeaderRenderers(renderersArray: unknown[]) {
    if (this.#stateManager.getLayersCount() > 0) {
      renderersArray.length = 0;

      for (let headerLayer = 0; headerLayer < this.#stateManager.getLayersCount(); headerLayer++) {
        renderersArray.push(this.headerRendererFactory(headerLayer));
      }
    }
  }

  #onAfterViewportColumnCalculatorOverride(calc: { startColumn: number }) {
    const headerLayersCount = this.#stateManager.getLayersCount();
    let newStartColumn = calc.startColumn;
    let nonRenderable = !!headerLayersCount;

    for (let headerLayer = 0; headerLayer < headerLayersCount; headerLayer++) {
      const startColumn = this.#stateManager.findLeftMostColumnIndex(headerLayer, calc.startColumn);
      const renderedStartColumn = this.hot.columnIndexMapper.getRenderableFromVisualIndex(startColumn);

      if (startColumn >= 0) {
        nonRenderable = false;
      }

      if (isNumeric(renderedStartColumn) && renderedStartColumn < calc.startColumn) {
        newStartColumn = renderedStartColumn;
        break;
      }
    }

    calc.startColumn =
      nonRenderable ?
        this.#stateManager.getHeaderTreeNodeData(0, newStartColumn).columnIndex :
        newStartColumn;
  }

  #onModifyColWidth(width: number, column: number) {
    const cachedWidth = this.ghostTable.getWidth(column) as number;

    return width > cachedWidth ? width : cachedWidth;
  }

  #onModifyColumnHeaderValue(value: string, visualColumnIndex: number, headerLevel: number) {
    const {
      label,
    } = this.#stateManager.getHeaderTreeNodeData(headerLevel, visualColumnIndex) ?? { label: '' };

    return label;
  }

  #onModifyFocusedElement(row: number, column: number) {
    if (row < 0) {
      return this.hot.getCell(row, this.#stateManager.findLeftMostColumnIndex(row, column), true);
    }
  }

  #onInit() {
    this.updatePlugin();
  }

  #onAfterLoadData(sourceData: unknown[], initialLoad: boolean) {
    if (!initialLoad) {
      this.updatePlugin();
    }
  }

  destroy() {
    this.#stateManager = null;

    if (this.#hidingIndexMapObserver !== null) {
      this.#hidingIndexMapObserver.unsubscribe();
      this.#hidingIndexMapObserver = null;
    }

    super.destroy();
  }

  _getHeaderTreeNodeDataByCoords(coords: { row: number, col: number }) {
    if (coords.row >= 0 || coords.col < 0) {
      return;
    }

    return this.#stateManager.getHeaderTreeNodeData(coords.row, coords.col);
  }
}
