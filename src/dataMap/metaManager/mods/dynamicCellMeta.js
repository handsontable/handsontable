import Hooks from '../../../pluginHooks';
import { hasOwnProperty } from '../../../helpers/object';
import { isFunction } from '../../../helpers/function';

/**
 * @class DynamicCellMetaMod
 *
 * The DynamicCellMeta modifier allows extending the cell meta objects returned by the
 * `getCellMeta` from the MetaManager by additional property values. Those properties
 * can be dynamically added by the Handsontable hooks (`afterGetCellMeta` and
 * `afterGetCellMeta`) or by Handsontable `cells` setting function.
 *
 * The `getCellMeta` method is used very widely within the source code. To make sure
 * that dynamically added properties do not slow down the method execution time, the
 * logic is triggered only once per table slow render cycle.
 */
export class DynamicCellMetaMod {
  constructor(metaManager) {
    /**
     * @type {MetaManager}
     */
    this.metaManager = metaManager;
    /**
     * @type {Map}
     */
    this.metaSyncMemo = new Map();

    metaManager.addLocalHook('afterGetCellMeta', cellMeta => this.extendCellMeta(cellMeta));

    Hooks.getSingleton().add('beforeRender', (forceFullRender) => {
      if (forceFullRender) {
        this.metaSyncMemo.clear();
      }
    }, this.metaManager.hot);
  }

  /**
   * Extends the cell meta object for user-specific values. The cell meta object can be
   * extended by listening to the `beforeGetCellMeta` or `afterGetCellMeta` Handsontable hooks
   * or by Handsontable `cells` setting function.
   *
   * The extending process is synchronized with the table life cycle, and it happens only
   * once per slow table render cycle.
   *
   * @param {object} cellMeta The cell meta object.
   */
  extendCellMeta(cellMeta) {
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

    // Extend a `type` value added or changed in beforeGetCellMeta hook
    const cellType = hasOwnProperty(cellMeta, 'type') ? cellMeta.type : null;
    let cellSettings = isFunction(cellMeta.cells) ? cellMeta.cells(physicalRow, physicalColumn, prop) : null;

    if (cellType) {
      if (cellSettings) {
        cellSettings.type = cellSettings.type ?? cellType;
      } else {
        cellSettings = {
          type: cellType,
        };
      }
    }

    if (cellSettings) {
      this.metaManager.updateCellMeta(physicalRow, physicalColumn, cellSettings);
    }

    hot.runHooks('afterGetCellMeta', visualRow, visualCol, cellMeta);

    if (!this.metaSyncMemo.has(physicalRow)) {
      this.metaSyncMemo.set(physicalRow, new Set());
    }

    this.metaSyncMemo.get(physicalRow).add(physicalColumn);
  }
}
