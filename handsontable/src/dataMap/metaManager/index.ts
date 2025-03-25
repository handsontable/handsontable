import GlobalMeta from './metaLayers/globalMeta';
import TableMeta from './metaLayers/tableMeta';
import ColumnMeta from './metaLayers/columnMeta';
import CellMeta from './metaLayers/cellMeta';
import { MetaManager as MetaManagerInterface, MetaObject, CellMetaOptions, Handsontable } from '../types';
import LocalHooksMixin from './../../mixins/localHooks';

/**
 * With the Meta Manager class, it can be possible to manage with meta objects for different layers in
 * one place. All coordinates used to fetch, updating, removing, or creating rows or columns have to
 * be passed as physical values.
 *
 * The diagram of the meta layers:
 * +-------------+.
 * │ GlobalMeta  │
 * │ (prototype) │
 * +-------------+\
 *       │         \
 *       │          \
 *      \│/         _\|
 * +-------------+    +-------------+.
 * │ TableMeta   │    │ ColumnMeta  │
 * │ (instance)  │    │ (prototype) │
 * +-------------+    +-------------+.
 *                         │
 *                         │
 *                        \│/
 *                    +-------------+.
 *                    │  CellMeta   │
 *                    │ (instance)  │
 *                    +-------------+.
 *
 * A more detailed description of the specific layers can be found in the "metaLayers/" modules description.
 */
export default class MetaManager extends LocalHooksMixin(Object) implements MetaManagerInterface {
  /**
   * @type {Handsontable}
   */
  hot: Handsontable;
  /**
   * @type {GlobalMeta}
   */
  globalMeta: GlobalMeta;
  /**
   * @type {TableMeta}
   */
  tableMeta: TableMeta;
  /**
   * @type {ColumnMeta}
   */
  columnMeta: ColumnMeta;
  /**
   * @type {CellMeta}
   */
  cellMeta: CellMeta;

  constructor(hot: Handsontable, customSettings: MetaObject = {}, metaMods: any[] = []) {
    super();

    /**
     * @type {Handsontable}
     */
    this.hot = hot;
    /**
     * @type {GlobalMeta}
     */
    this.globalMeta = new GlobalMeta(hot);
    /**
     * @type {TableMeta}
     */
    this.tableMeta = new TableMeta(this.globalMeta);
    /**
     * @type {ColumnMeta}
     */
    this.columnMeta = new ColumnMeta(this.globalMeta);
    /**
     * @type {CellMeta}
     */
    this.cellMeta = new CellMeta(this.columnMeta);

    metaMods.forEach(ModifierClass => new ModifierClass(this));

    this.globalMeta.updateMeta(customSettings);
  }

  /**
   * Gets the global meta object that is a root of all default settings, which are recognizable by Handsontable.
   * Other layers inherites all properties from this. Adding, removing, or changing property in that
   * object has a direct reflection to all layers.
   *
   * @returns {object}
   */
  getGlobalMeta(): MetaObject {
    return this.globalMeta.getMeta();
  }

  /**
   * Updates global settings object by merging settings with the current state.
   *
   * @param {object} settings An object to merge with.
   */
  updateGlobalMeta(settings: MetaObject): void {
    this.globalMeta.updateMeta(settings);
  }

  /**
   * Gets settings object that was passed in the Handsontable constructor. That layer contains all
   * default settings inherited from the GlobalMeta layer merged with settings passed by the developer.
   * Adding, removing, or changing property in that object has no direct reflection on any other layers.
   *
   * @returns {TableMeta}
   */
  getTableMeta(): MetaObject {
    return this.tableMeta.getMeta();
  }

  /**
   * Updates table settings object by merging settings with the current state.
   *
   * @param {object} settings An object to merge with.
   */
  updateTableMeta(settings: MetaObject): void {
    this.tableMeta.updateMeta(settings);
  }

  /**
   * Gets settings object for the specific column. That layer contains all default settings
   * inherited from the GlobalMeta layer. Adding, removing, or changing property in that
   * object has a direct reflection only for the specified column.
   *
   * @param {number} physicalColumn The physical column index.
   * @returns {object}
   */
  getColumnMeta(physicalColumn: number): MetaObject {
    return this.columnMeta.getMeta(physicalColumn);
  }

  /**
   * Updates column settings object by merging settings with the current state.
   *
   * @param {number} physicalColumn The physical column index which points what column meta object is updated.
   * @param {object} settings An object to merge with.
   */
  updateColumnMeta(physicalColumn: number, settings: MetaObject): void {
    this.columnMeta.updateMeta(physicalColumn, settings);
  }

  /**
   * Gets settings object for the specific cell. That layer contains all default settings
   * inherited from the ColumnMeta layer. Adding, removing, or changing property in that
   * object has a direct reflection only for the specified cell.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {object} options Additional options that can be used to customize meta options.
   * @param {boolean} [options.visibleRowsOnly=false] If `true`, will only check visible rows.
   * @param {boolean} [options.skipRowHooks=false] If `true`, the row hooks will not be triggered.
   * @param {number} [options.visualRow] The visual row index.
   * @param {number} [options.visualColumn] The visual column index.
   * @param {boolean} [options.skipMetaExtension=false] If `true`, omits the `afterGetCellMeta` hook.
   * @returns {object}
   */
  getCellMeta(physicalRow: number, physicalColumn: number, options: CellMetaOptions = {}): MetaObject {
    const cellMeta = this.cellMeta.getMeta(physicalRow, physicalColumn, undefined);

    cellMeta.visualRow = options.visualRow;
    cellMeta.visualCol = options.visualColumn;
    cellMeta.row = physicalRow;
    cellMeta.col = physicalColumn;

    if (!options.skipMetaExtension) {
      this.runLocalHooks('afterGetCellMeta', cellMeta);
    }

    return cellMeta;
  }

  /**
   * Gets one meta property for the specified cell meta object.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} key The property name to query.
   * @returns {object}
   */
  getCellMetaKeyValue(physicalRow: number, physicalColumn: number, key: string): any {
    if (typeof key !== 'string') {
      throw new Error('The passed cell meta object key is not a string');
    }

    return this.cellMeta.getMeta(physicalRow, physicalColumn, key);
  }

  /**
   * Sets one meta property for the specified cell meta object.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} key The property name to set.
   * @param {*} value Value to save.
   */
  setCellMeta(physicalRow: number, physicalColumn: number, key: string, value: any): void {
    this.cellMeta.setMeta(physicalRow, physicalColumn, key, value);
  }

  /**
   * Updates cell settings object by merging settings with the current state.
   *
   * @param {number} physicalRow The physical row index which points what cell meta object is updated.
   * @param {number} physicalColumn The physical column index which points what cell meta object is updated.
   * @param {object} settings An object to merge with.
   */
  updateCellMeta(physicalRow: number, physicalColumn: number, settings: MetaObject): void {
    this.cellMeta.updateMeta(physicalRow, physicalColumn, settings);
  }

  /**
   * Removes one property defined by the key for the cell meta object.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} key The property name to remove.
   */
  removeCellMeta(physicalRow: number, physicalColumn: number, key: string): void {
    this.cellMeta.removeMeta(physicalRow, physicalColumn, key);
  }

  /**
   * Returns all cell meta objects that were created during the Handsontable initialization phase.
   *
   * @returns {Array}
   */
  getCellsMeta(): MetaObject[] {
    return this.cellMeta.getMetas() as unknown as MetaObject[];
  }

  /**
   * Returns all cell meta objects that were created during the Handsontable initialization phase for
   * the specified row index.
   *
   * @param {number} physicalRow The physical row index.
   * @returns {Array}
   */
  getCellsMetaAtRow(physicalRow: number): MetaObject[] {
    return this.cellMeta.getMetasAtRow(physicalRow) as MetaObject[];
  }

  /**
   * Creates one or more rows at specific position.
   *
   * @param {number|null} physicalRow The physical row index which points from what position the row is created.
   *                                  If it's `null` the rows will be created at the end of the meta collections.
   * @param {number} [amount=1] An amount of rows to create.
   */
  createRow(physicalRow: number | null, amount: number = 1): void {
    this.cellMeta.createRow(physicalRow, amount);
  }

  /**
   * Removes one or more rows from the meta collections.
   *
   * @param {number} physicalRow The physical row index which points from what position the row is removed.
   * @param {number} [amount=1] An amount of rows to remove.
   */
  removeRow(physicalRow: number, amount: number = 1): void {
    this.cellMeta.removeRow(physicalRow, amount);
  }

  /**
   * Creates one or more columns at specific position.
   *
   * @param {number|null} physicalColumn The physical column index which points from what position the column is created.
   *                                     If it's `null` the columns will be created at the end of the meta collections.
   * @param {number} [amount=1] An amount of columns to create.
   */
  createColumn(physicalColumn: number | null, amount: number = 1): void {
    this.columnMeta.createColumn(physicalColumn, amount);
    this.cellMeta.createColumn(physicalColumn, amount);
  }

  /**
   * Removes one or more columns from the meta collections.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is removed.
   * @param {number} [amount=1] An amount of columns to remove.
   */
  removeColumn(physicalColumn: number, amount: number = 1): void {
    this.columnMeta.removeColumn(physicalColumn, amount);
    this.cellMeta.removeColumn(physicalColumn, amount);
  }

  /**
   * Clear all cell meta objects from all layers. It sets the meta back to the initial state.
   */
  clearCellsCache(): void {
    this.cellMeta.clearCache();
  }

  /**
   * Clear all meta objects from all layers. It sets the meta back to the initial state.
   */
  clearCache(): void {
    this.columnMeta.clearCache();
    this.cellMeta.clearCache();
  }
}
