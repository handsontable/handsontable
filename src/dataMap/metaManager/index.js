import GlobalMeta from './metaLayers/globalMeta';
import TableMeta from './metaLayers/tableMeta';
import ColumnMeta from './metaLayers/columnMeta';
import CellMeta from './metaLayers/cellMeta';

/* eslint-disable import/prefer-default-export */
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

  getCellMeta(physicalRow, physicalColumn) {
    return this.cellMeta.getMeta(physicalRow, physicalColumn);
  }

  setCellMeta(physicalRow, physicalColumn, key, value) {
    return this.cellMeta.setMeta(physicalRow, physicalColumn, key, value);
  }

  updateCellMeta(physicalRow, physicalColumn, settings) {
    this.cellMeta.updateMeta(physicalRow, physicalColumn, settings);
  }

  removeCellMeta(physicalRow, physicalColumn) {
    this.cellMeta.removeMeta(physicalRow, physicalColumn);
  }

  getCellMetas() {
    return this.cellMeta.getMetas();
  }

  getCellMetasAtRow(physicalRow) {
    return this.cellMeta.getMetasAtRow(physicalRow);
  }

  createRow(physicalRow) {
    this.cellMeta.createRow(physicalRow);
  }

  removeRow(physicalRow) {
    this.cellMeta.removeRow(physicalRow);
  }

  createColumn(physicalColumn) {
    this.cellMeta.createColumn(physicalColumn);
  }

  removeColumn(physicalColumn) {
    this.cellMeta.removeColumn(physicalColumn);
  }

  clearCache() {
    this.cellMeta.clearCache();
    this.columnMeta.clearCache();
  }
}
