import GlobalMeta from './metaLayers/globalMeta';
import TableMeta from './metaLayers/tableMeta';
import ColumnMeta from './metaLayers/columnMeta';
import CellMeta from './metaLayers/cellMeta';

/* eslint-disable import/prefer-default-export */
/**
 * The diagram of the meta layers:
 * +-------------+
 * | GlobalMeta  |
 * | (prototype) |
 * +-------------+\
 *       |         \
 *       |          \
 *      \|/         _\|
 * +-------------+    +-------------+
 * | TableMeta   |    | ColumnMeta  |
 * | (instance)  |    | (prototype) |
 * +-------------+    +-------------+
 *                         |
 *                         |
 *                        \|/
 *                    +-------------+
 *                    |  CellMeta   |
 *                    | (instance)  |
 *                    +-------------+
 *
 * @type {MetaManager}
 */
export class MetaManager {
  constructor(customSettings) {
    this.globalMeta = new GlobalMeta();
    this.globalMeta.updateMeta(customSettings);

    this.tableMeta = new TableMeta(this.globalMeta);
    this.columnMeta = new ColumnMeta(this.globalMeta);
    this.cellMeta = new CellMeta(this.columnMeta);
  }

  getGlobalMeta() {
    return this.globalMeta.getMeta();
  }

  updateGlobalMeta(settings) {
    this.globalMeta.updateMeta(settings);
  }

  getTableMeta() {
    return this.tableMeta.getMeta();
  }

  updateTableMeta(settings) {
    this.tableMeta.updateMeta(settings);
  }

  getColumnMeta(physicalColumn) {
    return this.columnMeta.getMeta(physicalColumn);
  }

  updateColumnMeta(physicalColumn, settings) {
    this.columnMeta.updateMeta(physicalColumn, settings);
  }

  getCellMeta(physicalRow, physicalColumn, key) {
    return this.cellMeta.getMeta(physicalRow, physicalColumn, key);
  }

  setCellMeta(physicalRow, physicalColumn, key, value) {
    return this.cellMeta.setMeta(physicalRow, physicalColumn, key, value);
  }

  updateCellMeta(physicalRow, physicalColumn, settings) {
    this.cellMeta.updateMeta(physicalRow, physicalColumn, settings);
  }

  removeCellMeta(physicalRow, physicalColumn, key) {
    this.cellMeta.removeMeta(physicalRow, physicalColumn, key);
  }

  getCellsMeta() {
    return this.cellMeta.getMetas();
  }

  getCellsMetaAtRow(physicalRow) {
    return this.cellMeta.getMetasAtRow(physicalRow);
  }

  createRow(physicalRow, amount) {
    this.cellMeta.createRow(physicalRow, amount);
  }

  removeRow(physicalRow, amount) {
    this.cellMeta.removeRow(physicalRow, amount);
  }

  createColumn(physicalColumn, amount) {
    this.cellMeta.createColumn(physicalColumn, amount);
    this.columnMeta.createColumn(physicalColumn, amount);
  }

  removeColumn(physicalColumn, amount) {
    this.cellMeta.removeColumn(physicalColumn, amount);
    this.columnMeta.removeColumn(physicalColumn, amount);
  }

  clearCellsCache() {
    this.cellMeta.clearCache();
  }

  clearCache() {
    this.cellMeta.clearCache();
    this.columnMeta.clearCache();
    this.tableMeta.clearCache();
  }
}
