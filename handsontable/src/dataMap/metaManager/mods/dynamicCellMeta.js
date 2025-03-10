import { Hooks } from '../../../core/hooks';
import { hasOwnProperty } from '../../../helpers/object';
import { isFunction } from '../../../helpers/function';

/**
 * @class DynamicCellMetaMod
 *
 * The `DynamicCellMetaMod` modifier allows for extending cell meta objects
 * (returned by `getCellMeta()` from `MetaManager`)
 * by user-specific properties.
 *
 * The user-specific properties can be added and changed dynamically,
 * either by Handsontable's hooks (`beforeGetCellMeta` and`afterGetCellMeta`),
 * or by Handsontable's `cells` option.
 *
 * The `getCellMeta()` method is used widely throughout the source code.
 * To boost the method's execution time,
 * the logic is triggered only once per one Handsontable slow render cycle.
 */
export class DynamicCellMetaMod {
  /**
   * @type {MetaManager}
   */
  metaManager;
  /**
   * @type {Map}
   */
  metaSyncMemo = new Map();

  constructor(metaManager) {
    this.metaManager = metaManager;

    metaManager.addLocalHook('afterGetCellMeta', (...args) => this.extendCellMeta(...args));

    Hooks.getSingleton().add('beforeRender', (forceFullRender) => {
      if (forceFullRender) {
        this.metaSyncMemo.clear();
      }
    }, this.metaManager.hot);
  }

  /**
   * Extends the cell meta object by user-specific properties.
   *
   * The cell meta object can be extended dynamically,
   * either by Handsontable's hooks (`beforeGetCellMeta` and`afterGetCellMeta`),
   * or by Handsontable's `cells` option.
   *
   * To boost performance, the extending process is triggered only once per one slow Handsontable render cycle.
   *
   * @param {object} cellMeta The cell meta object.
   * @param {object} options Execution options for the `extendCellMeta` method.
   * @param {boolean} [options.executeCellsFunction] If `false`, disables the execution of the `cells` function. Default: `true`.
   */
  extendCellMeta(cellMeta, options = { executeCellsFunction: true }) {
    const {
      row: physicalRow,
      col: physicalColumn,
    } = cellMeta;

    if (this.metaSyncMemo.get(physicalRow)?.has(physicalColumn)) {
      return;
    }

    const {
      visualRow,
      visualCol,
    } = cellMeta;
    const hot = this.metaManager.hot;
    const prop = hot.colToProp(visualCol);

    cellMeta.prop = prop;

    hot.runHooks('beforeGetCellMeta', visualRow, visualCol, cellMeta);

    let additionalCellMeta = null;

    if (options.executeCellsFunction && isFunction(cellMeta.cells)) {
      additionalCellMeta = cellMeta.cells(physicalRow, physicalColumn, prop) ?? null;
    }

    // extend a `type` value, added or changed in the `beforeGetCellMeta` hook
    if (hasOwnProperty(cellMeta, 'type')) {
      additionalCellMeta = additionalCellMeta ?? {};
      additionalCellMeta.type = additionalCellMeta.type ?? cellMeta.type;
    }

    if (additionalCellMeta) {
      this.metaManager.updateCellMeta(physicalRow, physicalColumn, additionalCellMeta);
    }

    hot.runHooks('afterGetCellMeta', visualRow, visualCol, cellMeta);

    if (!this.metaSyncMemo.has(physicalRow)) {
      this.metaSyncMemo.set(physicalRow, new Set());
    }

    this.metaSyncMemo.get(physicalRow).add(physicalColumn);
  }
}
