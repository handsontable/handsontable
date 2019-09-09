import { arrayFlatten } from '../../../helpers/array';

export default class CellMeta {
  constructor(columnMeta) {
    this.metas = [];
    this.columnMeta = columnMeta;
  }

  createRow(physicalRow, amount) {
    this.metas.splice(physicalRow, 0, ...new Array(amount));
  }

  createColumn(physicalColumn, amount) {
    for (let row = 0, len = this.metas.length; row < len; row++) {
      const rowMeta = this.metas[row];

      if (rowMeta) {
        rowMeta.splice(physicalColumn, 0, ...new Array(amount));
      }
    }
  }

  removeRow(physicalRow, amount) {
    this.metas.splice(physicalRow, amount);
  }

  removeColumn(physicalColumn, amount) {
    for (let row = 0, len = this.metas.length; row < len; row++) {
      const rowMeta = this.metas[row];

      if (rowMeta) {
        rowMeta.splice(physicalColumn, amount);
      }
    }
  }

  clearCache() {
    this.metas = [];
  }

  // splice(physicalRow, deleteAmount, items) {
  //   return this.metas.splice(physicalRow, deleteAmount, ...items);
  // }

  getMeta(physicalRow, physicalColumn, key) {
    if (!this.metas[physicalRow]) {
      this.metas[physicalRow] = [];
    }

    let cellMeta = this.metas[physicalRow][physicalColumn];

    if (!cellMeta) {
      const ColumnMeta = this.columnMeta.getMeta(physicalColumn);

      cellMeta = new ColumnMeta();
      this.metas[physicalRow][physicalColumn] = cellMeta;
    }

    if (key === void 0) {
      return cellMeta;
    }

    return cellMeta[key];
  }

  setMeta(physicalRow, physicalColumn, key, value) {
    if (!this.metas[physicalRow]) {
      this.metas[physicalRow] = [];
    }

    let cellMeta = this.metas[physicalRow][physicalColumn];

    if (!cellMeta) {
      const ColumnMeta = this.columnMeta.getMeta(physicalColumn);

      cellMeta = new ColumnMeta();
      this.metas[physicalRow][physicalColumn] = cellMeta;
    }

    cellMeta[key] = value;
  }

  removeMeta(physicalRow, physicalColumn, key) {
    delete this.metas[physicalRow][physicalColumn][key];
  }

  getMetas() {
    return arrayFlatten(this.metas);
  }

  getMetasAtRow(physicalRow) {
    return this.metas[physicalRow];
  }
}
