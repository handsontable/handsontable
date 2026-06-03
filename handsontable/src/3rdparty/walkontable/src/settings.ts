import from '../../../helpers/dom/element';
import from '../../../helpers/object';
import from '../../../helpers/errors';
import type from './types';

/**
 * @todo Describe options.
 * @typedef SettingsPure
 *
 * @property facade @todo desc.
 * @property ariaTags Option `ariaTags`.
 * @property cellRenderer Option `cellRenderer`.
 * @property columnHeaders Option `columnHeaders`.
 * @property columnWidth Option `columnWidth`.
 * @property currentRowClassName Option `currentRowClassName`.
 * @property data Option `data`.
 * @property defaultColumnWidth Option `defaultColumnWidth`.
 * @property externalRowCalculator Option `externalRowCalculator`.
 * @property fixedColumnsStart Option `fixedColumnsStart`.
 * @property fixedRowsBottom Option `fixedRowsBottom`.
 * @property fixedRowsTop Option `fixedRowsTop`.
 * @property groups Option `groups`.
 * @property hideBorderOnMouseDownOver Option `hideBorderOnMouseDownOver`.
 * @property isRtl Option `isRtl`.
 * @property isDataViewInstance Option `isDataViewInstance`.
 * @property minSpareRows Option `minSpareRows`.
 * @property onBeforeHighlightingColumnHeader Option `onBeforeHighlightingColumnHeader`.
 * @property onBeforeHighlightingRowHeader Option `onBeforeHighlightingRowHeader`.
 * @property onBeforeRemoveCellClassNames Option `onBeforeRemoveCellClassNames`.
 * @property preventOverflow Option `preventOverflow`.
 * @property preventWheel Option `preventWheel`.
 * @property renderAllColumns Option `renderAllColumns`.
 * @property renderAllRows Option `renderAllRows`.
 * @property rowHeaders Option `rowHeaders`.
 * @property rowHeightOption `rowHeight`.
 * @property rowHeightByOverlayName Option `rowHeightByOverlayName`.
 * @property shouldRenderBottomOverlay Option `shouldRenderBottomOverlay`.
 * @property shouldRenderInlineStartOverlay Option `shouldRenderInlineStartOverlay`.
 * @property shouldRenderTopOverlay Option `shouldRenderTopOverlay`.
 * @property table Option `table`.
 * @property totalColumns Option `totalColumns`.
 * @property totalRows Option `totalRows`.
 * @property beforeDraw Option `beforeDraw`.
 * @property columnHeaderHeight Option `columnHeaderHeight`.
 * @property currentColumnClassName Option `currentColumnClassName`.
 * @property headerClassName Option `headerClassName`.
 * @property onAfterDrawSelection Option `onAfterDrawSelection`.
 * @property onAfterMomentumScroll Option `onAfterMomentumScroll`.
 * @property onBeforeDrawBorders Option `onBeforeDrawBorders`.
 * @property onBeforeTouchScroll Option `onBeforeTouchScroll`.
 * @property onCellContextMenu Option `onCellContextMenu`.
 * @property onCellCornerDblClick Option `onCellCornerDblClick`.
 * @property onCellCornerMouseDown Option `onCellCornerMouseDown`.
 * @property onCellDblClick Option `onCellDblClick`.
 * @property onCellMouseDown Option `onCellMouseDown`.
 * @property onCellMouseOut Option `onCellMouseOut`.
 * @property onCellMouseOver Option `onCellMouseOver`.
 * @property onCellMouseOverOutside Option `onCellMouseOverOutside`.
 * @property onCellMouseUp Option `onCellMouseUp`.
 * @property onDraw Option `onDraw`.
 * @property onModifyGetCellCoords Option `onModifyGetCellCoords`.
 * @property onModifyGetCoordsElement Option `onModifyGetCoordsElement`.
 * @property onModifyGetCoords Option `onModifyGetCoords`.
 * @property onModifyRowHeaderWidth Option `onModifyRowHeaderWidth`.
 * @property onBeforeViewportScrollHorizontally Option `onBeforeViewportScrollHorizontally`.
 * @property onBeforeViewportScrollVertically Option `onBeforeViewportScrollVertically`.
 * @property onScrollHorizontally Option `onScrollHorizontally`.
 * @property onScrollVertically Option `onScrollVertically`.
 * @property onWindowResize Option `onWindowResize`.
 * @property rowHeaderWidth Option `rowHeaderWidth`.
 * @property selections Option `selections`.
 * @property viewportColumnCalculatorOverride Option `viewportColumnCalculatorOverride`.
 * @property viewportRowCalculatorOverride Option `viewportRowCalculatorOverride`.
 * @property viewportColumnRenderingThreshold Option `viewportColumnRenderingThreshold`.
 * @property viewportRowRenderingThreshold Option `viewportRowRenderingThreshold`.
 * @property stylesHandler Option `stylesHandler`.
 */

/**
 * @template TValue.
 * @typedef Option
 */

/**
 * @class Settings
 */
export default class Settings {

  /**
   * Reference to settings.
   *
   * @protected
   */
  settings: Record<string, unknown> = {};

  /**
   * The defaults values of settings.
   * Void 0 means it is required, null means it can be empty.
   *
   * @public
   */
  defaults: Record<string, unknown> = Object.freeze(this.getDefaults());

  /**
   * @param settings The user defined settings.
   */
  constructor(settings: Record<string, unknown>) {
    objectEach(this.defaults, (value: unknown, key: string) => {
      if (settings[key] !== undefined) {
        this.settings[key] = settings[key];

      } else if (value === undefined) {
        throwWithCause(`A required setting "${key}" was not provided`);

      } else {
        this.settings[key] = value;
      }
    });
  }

  /**
   * Generate defaults for a settings.
   * Void 0 means it is required, null means it can be empty.
   *
   * @private
   * @returns 
   */
  getDefaults() {
    return {
      facade: undefined as unknown,
      table: undefined as unknown,

      // Determines whether the Walkontable instance is used as dataset viewer. When its instance is used as
      // a context menu, autocomplete list, etc, the returned value is `false`.
      isDataViewInstance: true,
      // presentation mode
      externalRowCalculator: false,
      currentRowClassName: null as unknown,
      currentColumnClassName: null as unknown,
      preventOverflow() {
        return false;
      },
      preventWheel: false,

      // data source
      data: undefined as unknown,
      // Number of renderable columns for the left overlay.
      fixedColumnsStart: 0,
      // Number of renderable rows for the top overlay.
      fixedRowsTop: 0,
      // Number of renderable rows for the bottom overlay.
      fixedRowsBottom: 0,
      // Enable the inline start overlay when conditions are met (left for LTR and right for RTL document mode).
      shouldRenderInlineStartOverlay: () => {
        return this.getSetting('fixedColumnsStart') > 0 || this.getSetting('rowHeaders').length > 0;
      },
      // Enable the top overlay when conditions are met.
      shouldRenderTopOverlay: () => {
        return this.getSetting('fixedRowsTop') > 0 || this.getSetting('columnHeaders').length > 0;
      },
      // Enable the bottom overlay when conditions are met.
      shouldRenderBottomOverlay: () => {
        return this.getSetting('fixedRowsBottom') > 0;
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
      totalRows: undefined as unknown,
      totalColumns: undefined as unknown,
      cellRenderer: (row: number, column: number, TD: HTMLTableCellElement) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const cellData = this.getSetting('data', row, column);

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
      defaultColumnWidth: 50,
      selections: null as unknown,
      hideBorderOnMouseDownOver: false,
      viewportRowCalculatorOverride: null as unknown,
      viewportColumnCalculatorOverride: null as unknown,
      viewportRowRenderingThreshold: null as unknown,
      viewportColumnRenderingThreshold: null as unknown,

      // callbacks
      onCellMouseDown: null as unknown,
      onCellContextMenu: null as unknown,
      onCellMouseOver: null as unknown,
      onCellMouseOverOutside: null as unknown,
      onCellMouseOut: null as unknown,
      onCellMouseUp: null as unknown,

      // onCellMouseOut: null,
      onCellDblClick: null as unknown,
      onCellCornerMouseDown: null as unknown,
      onCellCornerDblClick: null as unknown,
      beforeDraw: null as unknown,
      onDraw: null as unknown,
      onBeforeRemoveCellClassNames: null as unknown,
      onAfterDrawSelection: null as unknown,
      onBeforeDrawBorders: null as unknown,
      // viewport scroll hooks
      onBeforeViewportScrollHorizontally: (column: number) => column,
      onBeforeViewportScrollVertically: (row: number) => row,
      // native scroll hooks
      onScrollHorizontally: null as unknown,
      onScrollVertically: null as unknown,
      //
      onBeforeTouchScroll: null as unknown,
      onAfterMomentumScroll: null as unknown,
      onModifyRowHeaderWidth: null as unknown,
      onModifyGetCellCoords: null as unknown,
      onModifyGetCoordsElement: null as unknown,
      onModifyGetCoords: null as unknown,
      onBeforeHighlightingRowHeader: (sourceRow: number) => sourceRow,
      onBeforeHighlightingColumnHeader: (sourceCol: number) => sourceCol,

      onWindowResize: null as unknown,
      onContainerElementResize: null as unknown,

      renderAllColumns: false,
      renderAllRows: false,
      groups: false,
      rowHeaderWidth: null as unknown,
      columnHeaderHeight: null as unknown,
      headerClassName: null as unknown,
      rtlMode: false,
      ariaTags: true,
      stylesHandler: null as unknown,
    };
  }

  /**
   * Update settings.
   *
   * @param settings The singular settings to update or if passed as object to merge with.
   * @param value The value to set if the first argument is passed as string.
   * @returns 
   */
  update(settings: string | Record<string, unknown>, value?: unknown) {
    if (value === undefined) { // settings is object
      objectEach(settings as Record<string, unknown>, (settingValue: unknown, key: string) => {
        this.settings[key] = settingValue;
      });
    } else { // if value is defined then settings is the key
      this.settings[settings as string] = value;
    }

    return this;
  }

  /**
   * Get setting by name.
   *
   * @param key The settings key to retrieve.
   * @param [param1] Additional parameter passed to the options defined as function.
   * @param [param2] Additional parameter passed to the options defined as function.
   * @param [param3] Additional parameter passed to the options defined as function.
   * @param [param4] Additional parameter passed to the options defined as function.
   * @returns 
   */
  getSetting(key: 'stylesHandler'): StylesHandler;
  /**
   * Returns the `preventOverflow` setting value.
   */
  getSetting(key: 'preventOverflow'): 'horizontal' | 'vertical' | false;
  /**
   * Returns the `rtlMode` setting value.
   */
  getSetting(key: 'rtlMode'): boolean;
  /**
   * Returns the `isDataViewInstance` setting value.
   */
  getSetting(key: 'isDataViewInstance'): boolean;
  /**
   * Returns the `fixedColumnsStart` setting value.
   */
  getSetting(key: 'fixedColumnsStart'): number;
  /**
   * Returns the `fixedRowsTop` setting value.
   */
  getSetting(key: 'fixedRowsTop'): number;
  /**
   * Returns the `fixedRowsBottom` setting value.
   */
  getSetting(key: 'fixedRowsBottom'): number;
  /**
   * Returns the `totalRows` setting value.
   */
  getSetting(key: 'totalRows'): number | undefined;
  /**
   * Returns the `totalColumns` setting value.
   */
  getSetting(key: 'totalColumns'): number | undefined;
  /**
   * Returns the `rowHeaderWidth` setting value.
   */
  getSetting(key: 'rowHeaderWidth'): number | undefined;
  /**
   * Returns the `defaultColumnWidth` setting value.
   */
  getSetting(key: 'defaultColumnWidth'): number | undefined;
  /**
   * Returns the `viewportRowRenderingThreshold` setting value.
   */
  getSetting(key: 'viewportRowRenderingThreshold'): number | 'auto';
  /**
   * Returns the `viewportColumnRenderingThreshold` setting value.
   */
  getSetting(key: 'viewportColumnRenderingThreshold'): number | 'auto';
  /**
   * Generic overload that retrieves any setting value by key with optional parameters.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSetting<T = any>(key: string, param1?: any, param2?: unknown, param3?: unknown, param4?: unknown): T;
  /**
   * Implementation that evaluates function-type settings and supports array-indexed access.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSetting(key: string, param1?: any, param2?: unknown, param3?: unknown, param4?: unknown): unknown {
    if (typeof this.settings[key] === 'function') {
      return (this.settings[key] as (...args: unknown[]) => unknown)(param1, param2, param3, param4);

    } else if (param1 !== undefined && Array.isArray(this.settings[key])) {
      return (this.settings[key] as unknown[])[param1 as number];

    }

    return this.settings[key] as unknown;
  }

  /**
   * Get a setting value without any evaluation.
   *
   * @param key The settings key to retrieve.
   * @returns 
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSettingPure<T = any>(key: string): T;
  /**
   * Returns the raw setting value for the given key, without evaluating function-type settings.
   */
  getSettingPure(key: string) {
    return this.settings[key];
  }

  /**
   * Checks if setting exists.
   *
   * @param key The settings key to check.
   * @returns 
   */
  has(key: string) {
    return !!this.settings[key];
  }
}
