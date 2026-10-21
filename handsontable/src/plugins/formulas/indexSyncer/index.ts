import AxisSyncer from './axisSyncer';
import type { IndexMapper } from '../../../translations';
import type { HyperFormulaEngine } from '../engine/types';

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
  constructor(rowIndexMapper: IndexMapper, columnIndexMapper: IndexMapper, postponeAction: Function) {
    this.#rowIndexSyncer = new AxisSyncer('row', rowIndexMapper, this);
    this.#columnIndexSyncer = new AxisSyncer('column', columnIndexMapper, this);
    this.#postponeAction = postponeAction;
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
