import AxisSyncer from './axisSyncer';
import type { IndexMapper } from '../../../translations';
import type { HyperFormulaEngine } from '../engine/types';

type OwnEngineWrite = <T>(engine: HyperFormulaEngine, fn: () => T) => T;

/**
 * @private
 * @class IndexSyncer
 * @description
 *
 * Indexes synchronizer responsible for providing logic for syncing actions done on indexes for HOT to actions performed
 * on HF's.
 *
 */
class IndexSyncer {
  /**
   * Indexes synchronizer for the axis of the rows.
   *
   * @private
   * @type {AxisSyncer}
   */
  readonly #rowIndexSyncer: AxisSyncer;
  /**
   * Indexes synchronizer for the axis of the columns.
   *
   * @private
   * @type {AxisSyncer}
   */
  readonly #columnIndexSyncer: AxisSyncer;
  /**
   * Method which will postpone execution of some action (needed when synchronization endpoint isn't setup yet).
   *
   * @private
   * @type {Function}
   */
  readonly #postponeAction: Function;
  /**
   * Runs a write to the engine as the grid's own (see `#writeOwnSheet()` in `Formulas`).
   *
   * @private
   * @type {Function}
   */
  readonly #ownEngineWrite: OwnEngineWrite;
  /**
   * The HF's engine instance which will be synced.
   *
   * @private
   * @type {HyperFormula|null}
   */
  #engine: HyperFormulaEngine | null = null;
  /**
   * HyperFormula's sheet id.
   *
   * @private
   * @type {number|null}
   */
  #sheetId: number | null = null;

  /**
   * Initializes the index syncer by creating row and column axis syncers and storing the deferred action callback.
   */
  constructor(
    rowIndexMapper: IndexMapper,
    columnIndexMapper: IndexMapper,
    postponeAction: Function,
    ownEngineWrite: OwnEngineWrite
  ) {
    this.#rowIndexSyncer = new AxisSyncer('row', rowIndexMapper, this);
    this.#columnIndexSyncer = new AxisSyncer('column', columnIndexMapper, this);
    this.#postponeAction = postponeAction;
    this.#ownEngineWrite = ownEngineWrite;
  }

  /**
   * Gets index synchronizer for a particular axis.
   *
   * @param {'row'|'column'} indexType Type of indexes.
   * @returns {AxisSyncer}
   */
  getForAxis(indexType: string) {
    if (indexType === 'row') {
      return this.#rowIndexSyncer;
    }

    return this.#columnIndexSyncer;
  }

  /**
   * Gets HyperFormula's sheet id.
   *
   * @returns {number|null}
   */
  getSheetId() {
    return this.#sheetId;
  }

  /**
   * Gets engine instance that will be used for handled instance of Handsontable.
   *
   * @type {HyperFormula|null}
   */
  getEngine() {
    return this.#engine;
  }

  /**
   * Gets method which will postpone execution of some action (needed when synchronization endpoint isn't setup yet).
   *
   * @returns {Function}
   */
  getPostponeAction() {
    return this.#postponeAction;
  }

  /**
   * Gets the function that runs a write to the engine as the grid's own: the other grids on the engine
   * paint once when it ends, this one is left to the caller.
   *
   * @returns {Function}
   */
  getOwnEngineWrite(): OwnEngineWrite {
    return this.#ownEngineWrite;
  }

  /**
   * Holds or releases the order changes of both axes (see `AxisSyncer#setOrderHeld()`). The column axis
   * is released even when sending the row order throws: left held, no column order change would reach
   * the engine until the plugin is turned off and on again.
   *
   * @param {boolean} held Whether the order is held.
   * @param {boolean} [syncOnRelease=true] Whether ending the hold sends the grid's current order.
   */
  setOrderHeld(held: boolean, syncOnRelease: boolean = true) {
    try {
      this.#rowIndexSyncer.setOrderHeld(held, syncOnRelease);
    } finally {
      this.#columnIndexSyncer.setOrderHeld(held, syncOnRelease);
    }
  }

  /**
   * Setups a synchronization endpoint.
   *
   * @param {HyperFormula|null} engine The HF's engine instance which will be synced.
   * @param {string|null} sheetId HyperFormula's sheet name.
   */
  setupSyncEndpoint(engine: HyperFormulaEngine | null, sheetId: number | null) {
    this.#engine = engine;
    this.#sheetId = sheetId;

    this.#rowIndexSyncer.init();
    this.#columnIndexSyncer.init();
  }
}

export default IndexSyncer;
