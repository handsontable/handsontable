import Hooks from '../../../pluginHooks';
import { hasOwnProperty } from '../../../helpers/object';

/**
 *
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

    // for `type` added or changed in beforeGetCellMeta
    if (hot.hasHook('beforeGetCellMeta') && hasOwnProperty(cellMeta, 'type')) {
      this.metaManager.updateCellMeta(physicalRow, physicalColumn, {
        type: cellMeta.type,
      });
    }

    if (cellMeta.cells) {
      const settings = cellMeta.cells(physicalRow, physicalColumn, prop);

      if (settings) {
        this.metaManager.updateCellMeta(physicalRow, physicalColumn, settings);
      }
    }

    hot.runHooks('afterGetCellMeta', visualRow, visualCol, cellMeta);

    if (!this.metaSyncMemo.has(physicalRow)) {
      this.metaSyncMemo.set(physicalRow, new Set());
    }

    this.metaSyncMemo.get(physicalRow).add(physicalColumn);
  }
}
