import Hooks from '../../../pluginHooks';
import { hasOwnProperty } from '../../../helpers/object';
import { isFunction } from '../../../helpers/function';

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
