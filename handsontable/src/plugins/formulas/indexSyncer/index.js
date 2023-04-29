import AxisSyncer from './axisSyncer';

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
  #rowIndexSyncer;
  /**
   * Indexes synchronizer for the axis of the columns.
   *
   * @private
   * @type {AxisSyncer}
   */
  #columnIndexSyncer;
  /**
   * Method which will postpone execution of some action (needed when synchronization endpoint isn't setup yet).
   *
   * @private
   * @type {Function}
   */
  #postponeAction;
  /**
   * Flag informing whether undo is already performed (we don't perform synchronization in such case).
   *
   * @private
   * @type {boolean}
   */
  #isPerformingUndo = false;
  /**
   * Flag informing whether redo is already performed (we don't perform synchronization in such case).
   *
   * @private
   * @type {boolean}
   */
  #isPerformingRedo = false;
  /**
   * The HF's engine instance which will be synced.
   *
   * @private
   * @type {HyperFormula|null}
   */
  #engine = null;
  /**
   * HyperFormula's sheet name.
   *
   * @private
   * @type {string|null}
   */
  #sheetId = null;

  constructor(rowIndexMapper, columnIndexMapper, postponeAction) {
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
  getForAxis(indexType) {
    if (indexType === 'row') {
      return this.#rowIndexSyncer;
    }

    return this.#columnIndexSyncer;
  }

  /**
   * Sets flag informing whether an undo action is already performed (we don't execute synchronization in such case).
   *
   * @param {boolean} flagValue Boolean value for the flag.
   */
  setPerformUndo(flagValue) {
    this.#isPerformingUndo = flagValue;
  }

  /**
   * Sets flag informing whether a redo action is already performed (we don't execute synchronization in such case).
   *
   * @param {boolean} flagValue Boolean value for the flag.
   */
  setPerformRedo(flagValue) {
    this.#isPerformingRedo = flagValue;
  }

  /**
   * Gets information whether redo or undo action is already performed (we don't execute synchronization in such case).
   *
   * @private
   * @returns {boolean}
   */
  isPerformingUndoRedo() {
    return this.#isPerformingUndo || this.#isPerformingRedo;
  }

  /**
   * Gets HyperFormula's sheet id.
   *
   * @returns {string|null}
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
  setupSyncEndpoint(engine, sheetId) {
    this.#engine = engine;
    this.#sheetId = sheetId;

    this.#rowIndexSyncer.init();
    this.#columnIndexSyncer.init();
  }
}

export default IndexSyncer;
