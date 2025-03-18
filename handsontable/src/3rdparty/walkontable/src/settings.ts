import { fastInnerText } from '../../../helpers/dom/element';
import { objectEach } from '../../../helpers/object';

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
 * @property {?Option} onCellDblClick Option `onCellDblClick`.
 * @property {?Option} onCellMouseDown Option `onCellMouseDown`.
 * @property {?Option} onCellMouseOut Option `onCellMouseOut`.
 * @property {?Option} onCellMouseOver Option `onCellMouseOver`.
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
 */

/**
 * @template TValue.
 * @typedef { TValue | Array.<TValue> | (function(...*): TValue) } Option
 */

/**
 * @class Settings
 */
export default class Settings {

  /**
   * Reference to settings.
   *
   * @protected
   * @type {SettingsPure}
   */
  settings = {};

  /**
   * The defaults values of settings.
   * Void 0 means it is required, null means it can be empty.
   *
   * @public
   * @type {Readonly<SettingsPure>}
   */
  defaults = Object.freeze(this.getDefaults());

  /**
   * @param {SettingsPure} settings The user defined settings.
   */
  constructor(settings) {
    objectEach(this.defaults, (value, key) => {
      if (settings[key] !== undefined) {
        this.settings[key] = settings[key];

      } else if (value === undefined) {
        throw new Error(`A required setting "${key}" was not provided`);

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
   * @returns {SettingsPure}
   */
  getDefaults() {
    return {
      facade: undefined,
      table: undefined,

      // Determines whether the Walkontable instance is used as dataset viewer. When its instance is used as
      // a context menu, autocomplete list, etc, the returned value is `false`.
      isDataViewInstance: true,
      // presentation mode
      externalRowCalculator: false,
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
      rowHeaders() {
        return [];
      },

      // this must be array of functions: [function (column, TH) {}]
      columnHeaders() {
        return [];
      },
      totalRows: undefined,
      totalColumns: undefined,
      cellRenderer: (row, column, TD) => {
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
      selections: null,
      hideBorderOnMouseDownOver: false,
      viewportRowCalculatorOverride: null,
      viewportColumnCalculatorOverride: null,
      viewportRowRenderingThreshold: null,
      viewportColumnRenderingThreshold: null,

      // callbacks
      onCellMouseDown: null,
      onCellContextMenu: null,
      onCellMouseOver: null,
      onCellMouseOut: null,
      onCellMouseUp: null,

      // onCellMouseOut: null,
      onCellDblClick: null,
      onCellCornerMouseDown: null,
      onCellCornerDblClick: null,
      beforeDraw: null,
      onDraw: null,
      onBeforeRemoveCellClassNames: null,
      onAfterDrawSelection: null,
      onBeforeDrawBorders: null,
      // viewport scroll hooks
      onBeforeViewportScrollHorizontally: column => column,
      onBeforeViewportScrollVertically: row => row,
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
      onBeforeHighlightingRowHeader: sourceRow => sourceRow,
      onBeforeHighlightingColumnHeader: sourceCol => sourceCol,

      onWindowResize: null,
      onContainerElementResize: null,

      renderAllColumns: false,
      renderAllRows: false,
      groups: false,
      rowHeaderWidth: null,
      columnHeaderHeight: null,
      headerClassName: null,
      rtlMode: false,
      ariaTags: true
    };
  }

  /**
   * Update settings.
   *
   * @param {object|string} settings The singular settings to update or if passed as object to merge with.
   * @param {*} value The value to set if the first argument is passed as string.
   * @returns {Settings}
   */
  update(settings, value) {
    if (value === undefined) { // settings is object
      objectEach(settings, (settingValue, key) => {
        this.settings[key] = settingValue;
      });
    } else { // if value is defined then settings is the key
      this.settings[settings] = value;
    }

    return this;
  }

  /**
   * Get setting by name.
   *
   * @param {$Keys<SettingsPure>} key The settings key to retrieve.
   * @param {*} [param1] Additional parameter passed to the options defined as function.
   * @param {*} [param2] Additional parameter passed to the options defined as function.
   * @param {*} [param3] Additional parameter passed to the options defined as function.
   * @param {*} [param4] Additional parameter passed to the options defined as function.
   * @returns {*}
   */
  getSetting(key, param1, param2, param3, param4) {
    if (typeof this.settings[key] === 'function') {
      return this.settings[key](param1, param2, param3, param4);

    } else if (param1 !== undefined && Array.isArray(this.settings[key])) {
      return this.settings[key][param1];

    }

    return this.settings[key];
  }

  /**
   * Get a setting value without any evaluation.
   *
   * @param {string} key The settings key to retrieve.
   * @returns {*}
   */
  getSettingPure(key) {
    return this.settings[key];
  }

  /**
   * Checks if setting exists.
   *
   * @param {boolean} key The settings key to check.
   * @returns {boolean}
   */
  has(key) {
    return !!this.settings[key];
  }
}
