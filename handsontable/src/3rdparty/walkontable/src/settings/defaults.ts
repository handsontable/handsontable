import { fastInnerText } from '../../../../helpers/dom/element';
import type { SettingsPort } from '../ports';

/**
 * @todo Describe options.
 * @typedef SettingsPure
 *
 * @property {Option} facade @todo desc.
 * @property {Option} ariaTags Option `ariaTags`.
 * @property {Option} cellRenderer Option `cellRenderer`.
 * @property {Option} columnHeaders Option `columnHeaders`.
 * @property {Option} columnWidth Option `columnWidth`.
 * @property {Option} currentRowClassName Option `currentRowClassName`.
 * @property {Option} data Option `data`.
 * @property {Option} defaultColumnWidth Option `defaultColumnWidth`.
 * @property {Option} externalRowCalculator Option `externalRowCalculator`.
 * @property {Option} singlePassLayout Option `singlePassLayout`.
 * @property {Option} fixedColumnsStart Option `fixedColumnsStart`.
 * @property {Option} fixedRowsBottom Option `fixedRowsBottom`.
 * @property {Option} fixedRowsTop Option `fixedRowsTop`.
 * @property {Option} groups Option `groups`.
 * @property {Option} hideBorderOnMouseDownOver Option `hideBorderOnMouseDownOver`.
 * @property {Option} isRtl Option `isRtl`.
 * @property {Option} isDataViewInstance Option `isDataViewInstance`.
 * @property {Option} minSpareRows Option `minSpareRows`.
 * @property {Option} onBeforeHighlightingColumnHeader Option `onBeforeHighlightingColumnHeader`.
 * @property {Option} onBeforeHighlightingRowHeader Option `onBeforeHighlightingRowHeader`.
 * @property {Option} onBeforeRemoveCellClassNames Option `onBeforeRemoveCellClassNames`.
 * @property {Option} preventOverflow Option `preventOverflow`.
 * @property {Option} preventWheel Option `preventWheel`.
 * @property {Option} renderAllColumns Option `renderAllColumns`.
 * @property {Option} renderAllRows Option `renderAllRows`.
 * @property {Option} rowHeaders Option `rowHeaders`.
 * @property {Option} rowHeightOption `rowHeight`.
 * @property {Option} rowHeightByOverlayName Option `rowHeightByOverlayName`.
 * @property {Option} shouldRenderBottomOverlay Option `shouldRenderBottomOverlay`.
 * @property {Option} shouldRenderInlineStartOverlay Option `shouldRenderInlineStartOverlay`.
 * @property {Option} shouldRenderTopOverlay Option `shouldRenderTopOverlay`.
 * @property {Option} table Option `table`.
 * @property {Option} totalColumns Option `totalColumns`.
 * @property {Option} totalRows Option `totalRows`.
 * @property {?Option} beforeDraw Option `beforeDraw`.
 * @property {?Option} columnHeaderHeight Option `columnHeaderHeight`.
 * @property {?Option} currentColumnClassName Option `currentColumnClassName`.
 * @property {?Option} headerClassName Option `headerClassName`.
 * @property {?Option} onAfterDrawSelection Option `onAfterDrawSelection`.
 * @property {?Option} onAfterMomentumScroll Option `onAfterMomentumScroll`.
 * @property {?Option} onBeforeDrawBorders Option `onBeforeDrawBorders`.
 * @property {?Option} onBeforeTouchScroll Option `onBeforeTouchScroll`.
 * @property {?Option} onCellContextMenu Option `onCellContextMenu`.
 * @property {?Option} onCellCornerDblClick Option `onCellCornerDblClick`.
 * @property {?Option} onCellCornerMouseDown Option `onCellCornerMouseDown`.
 * @property {?Option} onSelectionHandleMouseDown Option `onSelectionHandleMouseDown`.
 * @property {?Option} onSelectionEdgeMouseDown Option `onSelectionEdgeMouseDown`.
 * @property {?Option} onCellDblClick Option `onCellDblClick`.
 * @property {?Option} onCellMouseDown Option `onCellMouseDown`.
 * @property {?Option} onCellMouseOut Option `onCellMouseOut`.
 * @property {?Option} onCellMouseOver Option `onCellMouseOver`.
 * @property {?Option} onCellMouseOverOutside Option `onCellMouseOverOutside`.
 * @property {?Option} onCellMouseUp Option `onCellMouseUp`.
 * @property {?Option} onDraw Option `onDraw`.
 * @property {?Option} onModifyGetCellCoords Option `onModifyGetCellCoords`.
 * @property {?Option} onModifyGetCoordsElement Option `onModifyGetCoordsElement`.
 * @property {?Option} onModifyGetCoords Option `onModifyGetCoords`.
 * @property {?Option} onModifyRowHeaderWidth Option `onModifyRowHeaderWidth`.
 * @property {?Option} onBeforeViewportScrollHorizontally Option `onBeforeViewportScrollHorizontally`.
 * @property {?Option} onBeforeViewportScrollVertically Option `onBeforeViewportScrollVertically`.
 * @property {?Option} onScrollHorizontally Option `onScrollHorizontally`.
 * @property {?Option} onScrollVertically Option `onScrollVertically`.
 * @property {?Option} onWindowResize Option `onWindowResize`.
 * @property {?Option} rowHeaderWidth Option `rowHeaderWidth`.
 * @property {?Option} selections Option `selections`.
 * @property {?Option} viewportColumnCalculatorOverride Option `viewportColumnCalculatorOverride`.
 * @property {?Option} viewportRowCalculatorOverride Option `viewportRowCalculatorOverride`.
 * @property {?Option} viewportColumnRenderingThreshold Option `viewportColumnRenderingThreshold`.
 * @property {?Option} viewportRowRenderingThreshold Option `viewportRowRenderingThreshold`.
 * @property {?Option} viewportColumnRenderingOffsetIsAuto Option `viewportColumnRenderingOffsetIsAuto`.
 * @property {?Option} viewportRowRenderingOffsetIsAuto Option `viewportRowRenderingOffsetIsAuto`.
 * @property {?Option} stylesHandler Option `stylesHandler`.
 */

/**
 * @template TValue.
 * @typedef { TValue | Array.<TValue> | (function(...*): TValue) } Option
 */

/**
 * Generate the default settings for a Walkontable instance.
 * Void 0 means it is required, null means it can be empty.
 *
 * The `settings` argument is the owning `Settings` instance; the default options defined as functions
 * (the overlay-render predicates and the cell renderer) read other settings back through it, so they
 * stay bound to the same instance exactly as when they lived on the class.
 *
 * @param {SettingsPort} settings The Settings instance the function-valued defaults read through.
 * @returns {SettingsPure}
 */
export function getDefaults(settings: SettingsPort): Record<string, unknown> {
  return {
    facade: undefined,
    table: undefined,

    // Determines whether the Walkontable instance is used as dataset viewer. When its instance is used as
    // a context menu, autocomplete list, etc, the returned value is `false`.
    isDataViewInstance: true,
    // presentation mode
    externalRowCalculator: false,
    // Escape hatch for the single-pass (predicted) layout. When `false`, the viewport's
    // scrollbar/size queries measure the rendered DOM (the legacy, multi-pass path) instead of
    // reading the predicted layout snapshot. Plugins whose rendering is incompatible with a
    // predicted single pass (e.g. `mergeCells`, whose virtualized merged-cell height depends on the
    // viewport it is trying to compute) opt out through this flag, wired in `TableView`.
    singlePassLayout: true,
    currentRowClassName: null,
    currentColumnClassName: null,
    preventOverflow() {
      return false;
    },
    preventWheel: false,

    // data source
    data: undefined,
    // Number of renderable columns for the left overlay.
    fixedColumnsStart: 0,
    // Number of renderable rows for the top overlay.
    fixedRowsTop: 0,
    // Number of renderable rows for the bottom overlay.
    fixedRowsBottom: 0,
    // Enable the inline start overlay when conditions are met (left for LTR and right for RTL document mode).
    shouldRenderInlineStartOverlay: () => {
      return settings.getSetting('fixedColumnsStart') > 0 || settings.getSetting('rowHeaders').length > 0;
    },
    // Enable the top overlay when conditions are met.
    shouldRenderTopOverlay: () => {
      return settings.getSetting('fixedRowsTop') > 0 || settings.getSetting('columnHeaders').length > 0;
    },
    // Enable the bottom overlay when conditions are met.
    shouldRenderBottomOverlay: () => {
      return settings.getSetting('fixedRowsBottom') > 0;
    },
    minSpareRows: 0,

    // this must be array of functions: [function (row, TH) {}]
    rowHeaders(): unknown {
      return [];
    },

    // this must be array of functions: [function (column, TH) {}]
    columnHeaders(): unknown {
      return [];
    },
    totalRows: undefined,
    totalColumns: undefined,
    cellRenderer: (row: number, column: number, TD: HTMLTableCellElement) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cellData = settings.getSetting('data', row, column);

      fastInnerText(TD, cellData === undefined || cellData === null ? '' : cellData);
    },

    // columnWidth: 50,
    columnWidth() {
      // return undefined means use default size for the rendered cell content
    },
    rowHeight() {
      // return undefined means use default size for the rendered cell content
    },
    rowHeightByOverlayName() {
      // return undefined means use default size for the rendered cell content
    },
    rowHeightsUniform() {
      // return true only when every row is guaranteed the default height (enables the
      // PositionCache arithmetic fast path). Conservative default: false.
      return false;
    },
    columnWidthsUniform() {
      // return true only when every column is guaranteed the default width.
      return false;
    },
    defaultColumnWidth: 50,
    selections: null,
    hideBorderOnMouseDownOver: false,
    viewportRowCalculatorOverride: null,
    viewportColumnCalculatorOverride: null,
    viewportRowRenderingThreshold: null,
    viewportColumnRenderingThreshold: null,
    // Whether the corresponding `viewport*RenderingOffset` grid option is in its 'auto' (dynamic
    // overscan) mode. An explicit numeric offset is an exact user choice — the directional
    // scroll-overscan then stays off (see `viewport/calculatorFactory.ts`). Engine-level default is
    // `true`: a raw Walkontable consumer with no offset override gets the overscan.
    viewportRowRenderingOffsetIsAuto: true,
    viewportColumnRenderingOffsetIsAuto: true,

    // callbacks
    onCellMouseDown: null,
    onCellContextMenu: null,
    onCellMouseOver: null,
    onCellMouseOverOutside: null,
    onCellMouseOut: null,
    onCellMouseUp: null,

    // onCellMouseOut: null,
    onCellDblClick: null,
    onCellCornerMouseDown: null,
    onCellCornerDblClick: null,
    onSelectionHandleMouseDown: null,
    onSelectionEdgeMouseDown: null,
    beforeDraw: null,
    onDraw: null,
    onBeforeRemoveCellClassNames: null,
    onAfterDrawSelection: null,
    onBeforeDrawBorders: null,
    // viewport scroll hooks
    onBeforeViewportScrollHorizontally: (column: number) => column,
    onBeforeViewportScrollVertically: (row: number) => row,
    // native scroll hooks
    onScrollHorizontally: null,
    onScrollVertically: null,
    //
    onBeforeTouchScroll: null,
    onAfterMomentumScroll: null,
    onModifyRowHeaderWidth: null,
    onModifyGetCellCoords: null,
    onModifyGetCoordsElement: null,
    onModifyGetCoords: null,
    onBeforeHighlightingRowHeader: (sourceRow: number) => sourceRow,
    onBeforeHighlightingColumnHeader: (sourceCol: number) => sourceCol,

    onWindowResize: null,
    onContainerElementResize: null,

    renderAllColumns: false,
    renderAllRows: false,
    groups: false,
    rowHeaderWidth: null,
    columnHeaderHeight: null,
    headerClassName: null,
    rtlMode: false,
    ariaTags: true,
    stylesHandler: null,
  };
}
