import AxisSyncer from './axisSyncer';
import type { IndexMapper } from '../../../translations';
import type { HyperFormulaEngine } from '../engine/types';

/**
 * Plugin-owned engine writes in progress. `valuesUpdated` reaches every grid on the engine,
 * and HyperFormula emits it before the mutating call returns (including `batch()`). The listener
 * paints only while this is zero, so a write that already renders does not paint again.
 */
let pluginEngineWriteDepth = 0;

/**
 * Runs an engine mutation the Formulas plugin owns.
 *
 * The counter has to wrap the call that resumes evaluation. A `setCellContents` nested inside
 * `batch()` returns while evaluation is still suspended, and the emit happens later, still inside
 * `batch()`, before `batch()` itself returns.
 *
 * @param {Function} fn The mutation.
 * @returns {*} What `fn` returns.
 */
export function withPluginEngineWrite<T>(fn: () => T): T {
  pluginEngineWriteDepth += 1;

  try {
    return fn();
  } finally {
    pluginEngineWriteDepth -= 1;
  }
}

/**
 * @returns {boolean} `true` while {@link withPluginEngineWrite} is on the stack.
 */
export function isPluginEngineWrite(): boolean {
  return pluginEngineWriteDepth > 0;
}

/**
 * Routes engine calls through {@link withPluginEngineWrite}.
 *
 * `axisSyncer.ts` writes the engine (`batch`, `setRowOrder`, `setColumnOrder`) and is not edited
 * from this change. The object the user holds stays the raw engine, so a write made on it still
 * paints.
 *
 * @param {HyperFormula} engine The raw engine.
 * @returns {HyperFormula} An engine whose method calls count as plugin writes.
 */
function engineForPluginWrites(engine: HyperFormulaEngine): HyperFormulaEngine {
  return new Proxy(engine, {
    get(target, property) {
      if (typeof property === 'symbol' || property === 'then') {
        return Reflect.get(target, property, target) as unknown;
      }

      const value = Reflect.get(target, property, target) as unknown;

      if (typeof value !== 'function') {
        return value;
      }

      return (...args: unknown[]) => withPluginEngineWrite(
        () => Reflect.apply(value, target, args) as unknown
      );
    },
  }) as HyperFormulaEngine;
}

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
    this.#engine = engine === null ? null : engineForPluginWrites(engine);
    this.#sheetId = sheetId;

    this.#rowIndexSyncer.init();
    this.#columnIndexSyncer.init();
  }
}

export default IndexSyncer;
