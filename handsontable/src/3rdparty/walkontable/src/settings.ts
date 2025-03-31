import { fastInnerText } from '../../../helpers/dom/element';
import { objectEach } from '../../../helpers/object';

/**
 * @template T
 * @typedef {T | Array<T> | (((...args: any[]) => T))} Option
 */
export type Option<T> = T | Array<T> | ((...args: any[]) => T) | null;

/**
 * @typedef SettingsPure
 */
export interface SettingsPure {
  facade?: any;
  ariaTags?: Option<boolean>;
  cellRenderer?: Option<(row: number, column: number, TD: HTMLElement) => void>;
  columnHeaders?: Option<Function[]>;
  columnWidth?: Option<number | ((index: number) => number) | void>;
  currentRowClassName?: Option<string>;
  data?: Option<any>;
  defaultColumnWidth?: Option<number>;
  externalRowCalculator?: Option<boolean>;
  fixedColumnsStart?: Option<number>;
  fixedRowsBottom?: Option<number>;
  fixedRowsTop?: Option<number>;
  groups?: Option<boolean>;
  hideBorderOnMouseDownOver?: Option<boolean>;
  isRtl?: Option<boolean>;
  isDataViewInstance?: Option<boolean>;
  minSpareRows?: Option<number>;
  onBeforeHighlightingColumnHeader?: Option<(col: number) => number>;
  onBeforeHighlightingRowHeader?: Option<(row: number) => number>;
  onBeforeRemoveCellClassNames?: Option<() => void>;
  preventOverflow?: Option<() => boolean>;
  preventWheel?: Option<boolean>;
  renderAllColumns?: Option<boolean>;
  renderAllRows?: Option<boolean>;
  rowHeaders?: Option<string[]>;
  rowHeight?: Option<number | ((index: number) => number) | void>;
  rowHeightByOverlayName?: Option<(name: string, index: number) => number | void>;
  shouldRenderBottomOverlay?: Option<() => boolean>;
  shouldRenderInlineStartOverlay?: Option<() => boolean>;
  shouldRenderTopOverlay?: Option<() => boolean>;
  table?: Option<HTMLTableElement>;
  totalColumns?: Option<number>;
  totalRows?: Option<number>;
  beforeDraw?: Option<() => void>;
  columnHeaderHeight?: Option<number | ((index: number) => number)>;
  currentColumnClassName?: Option<string>;
  headerClassName?: Option<string>;
  onAfterDrawSelection?: Option<Function>;
  onAfterMomentumScroll?: Option<Function>;
  onBeforeDrawBorders?: Option<Function>;
  onBeforeTouchScroll?: Option<Function>;
  onCellContextMenu?: Option<Function>;
  onCellCornerDblClick?: Option<Function>;
  onCellCornerMouseDown?: Option<Function>;
  onCellDblClick?: Option<Function>;
  onCellMouseDown?: Option<Function>;
  onCellMouseOut?: Option<Function>;
  onCellMouseOver?: Option<Function>;
  onCellMouseUp?: Option<Function>;
  onDraw?: Option<Function>;
  onModifyGetCellCoords?: Option<Function>;
  onModifyGetCoordsElement?: Option<Function>;
  onModifyGetCoords?: Option<Function>;
  onModifyRowHeaderWidth?: Option<Function>;
  onBeforeViewportScrollHorizontally?: Option<(column: number) => number>;
  onBeforeViewportScrollVertically?: Option<(row: number) => number>;
  onScrollHorizontally?: Option<Function>;
  onScrollVertically?: Option<Function>;
  onWindowResize?: Option<Function>;
  onContainerElementResize?: Option<Function>;
  rowHeaderWidth?: Option<number | ((index: number) => number)>;
  selections?: Option<any>;
  viewportColumnCalculatorOverride?: Option<any>;
  viewportRowCalculatorOverride?: Option<any>;
  viewportColumnRenderingThreshold?: Option<number>;
  viewportRowRenderingThreshold?: Option<number>;
  [key: string]: any;
}

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
  settings: SettingsPure = {};

  /**
   * The defaults values of settings.
   * Void 0 means it is required, null means it can be empty.
   *
   * @public
   * @type {Readonly<SettingsPure>}
   */
  defaults: Readonly<SettingsPure> = Object.freeze(this.getDefaults());

  /**
   * @param {SettingsPure} settings The user defined settings.
   */
  constructor(settings: SettingsPure) {
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
  getDefaults(): SettingsPure {
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
      cellRenderer: (row: number, column: number, TD: HTMLElement) => {
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
  update(settings: SettingsPure | string, value?: any): Settings {
    if (value === undefined) { // settings is object
      objectEach(settings as SettingsPure, (settingValue, key) => {
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
   * @param {keyof SettingsPure} key The settings key to retrieve.
   * @param {*} [param1] Additional parameter passed to the options defined as function.
   * @param {*} [param2] Additional parameter passed to the options defined as function.
   * @param {*} [param3] Additional parameter passed to the options defined as function.
   * @param {*} [param4] Additional parameter passed to the options defined as function.
   * @returns {*}
   */
  getSetting(key: keyof SettingsPure, param1?: any, param2?: any, param3?: any, param4?: any): any {
    if (typeof this.settings[key] === 'function') {
      return (this.settings[key] as Function)(param1, param2, param3, param4);

    } else if (param1 !== undefined && Array.isArray(this.settings[key])) {
      return (this.settings[key] as any[])[param1];
    }

    return this.settings[key];
  }

  /**
   * Get a setting value without any evaluation.
   *
   * @param {keyof SettingsPure} key The settings key to retrieve.
   * @returns {*}
   */
  getSettingPure(key: keyof SettingsPure): any {
    return this.settings[key];
  }

  /**
   * Checks if setting exists.
   *
   * @param {keyof SettingsPure} key The settings key to check.
   * @returns {boolean}
   */
  has(key: keyof SettingsPure): boolean {
    return !!this.settings[key];
  }
}
