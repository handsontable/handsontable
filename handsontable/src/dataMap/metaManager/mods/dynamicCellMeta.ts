import type { default as MetaManagerInstance } from '..';
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
type MetaManagerWithHot = MetaManagerInstance & {
  hot: {
    colToProp: (column: number) => string | number;
    runHooks: (...args: unknown[]) => unknown;
    [key: string]: unknown;
  };
  addLocalHook: (hookName: string, callback: (...args: unknown[]) => void) => void;
  updateCellMeta: (...args: unknown[]) => void;
  [key: string]: unknown;
};

export class DynamicCellMetaMod {
  /**
   * @type {MetaManager}
   */
  declare metaManager: MetaManagerWithHot;
  /**
   * @type {Map}
   */
  metaSyncMemo = new Map();

  constructor(metaManager: MetaManagerWithHot) {
    this.metaManager = metaManager;

    metaManager.addLocalHook('afterGetCellMeta', (...args: unknown[]) => {
      this.extendCellMeta(args[0] as Record<string, unknown>);
    });

    Hooks.getSingleton().add('beforeRender', (forceFullRender: unknown) => {
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
   */
  extendCellMeta(cellMeta: Record<string, unknown>) {
    const physicalRow = cellMeta.row as number;
    const physicalColumn = cellMeta.col as number;

    if (this.metaSyncMemo.get(physicalRow)?.has(physicalColumn)) {
      return;
    }

    const visualRow = cellMeta.visualRow as number;
    const visualCol = cellMeta.visualCol as number;
    const hot = this.metaManager.hot;
    const prop = hot.colToProp(visualCol);

    cellMeta.prop = prop;

    hot.runHooks('beforeGetCellMeta', visualRow, visualCol, cellMeta);

    // extend a `type` value, added or changed in the `beforeGetCellMeta` hook
    const cellType = hasOwnProperty(cellMeta, 'type') ? cellMeta.type : null;
    let cellSettings = isFunction(cellMeta.cells)
      ? cellMeta.cells(physicalRow, physicalColumn, prop) as Record<string, unknown> | null
      : null;

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
