import type { default as MetaManager } from '.';
import type { CellProperties } from '../../settings';
import { hasOwnProperty } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import { getCellType, hasCellType } from '../../cellTypes/registry';
import { applyTransientCellSettings } from './utils';

/**
 * How many own enumerable keys a new cell meta object has once a read stamped it and called the `cells`
 * function: `visualRow`, `visualCol`, `row`, `col` (`MetaManager#stampCellMeta()`) and `prop`
 * (`MetaManager#callCellsFunction()`). A cell meta object starts with none of its own.
 */
const STAMPED_CELL_META_KEYS = 5;

/**
 * Tells whether a data read calls the `cells` function a meta object resolves: only when the
 * `applyCellsToDataReads` option is on for it. Without the option a read applies a `valueGetter` from
 * stored meta and the column layer only, as it has since 18.1.0.
 *
 * @param {object} meta A column or cell meta object.
 * @returns {boolean}
 */
export function readsThroughCellsFunction(meta: { cells?: unknown; applyCellsToDataReads?: unknown }): boolean {
  return meta.applyCellsToDataReads === true && isFunction(meta.cells);
}

/**
 * Tells whether a value is an object whose own keys can be read.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isKeyedObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Tells whether cell settings, as the `cells` function returns them or writes them to `this`, can give
 * the cell a `valueGetter`: an own `valueGetter` key, or an own `type` key that names a cell type
 * shipping a `valueGetter`. A `type` object, or a name no cell type is registered under, counts as
 * able to, so the full extension resolves it (and reports an unknown name) as it always did.
 *
 * @param {*} settings The settings to check.
 * @returns {boolean}
 */
function canCellSettingsGetValues(settings: unknown): boolean {
  if (!isKeyedObject(settings)) {
    return false;
  }

  if (hasOwnProperty(settings, 'valueGetter')) {
    return true;
  }

  if (!hasOwnProperty(settings, 'type')) {
    return false;
  }

  const { type } = settings;

  return typeof type !== 'string' || !hasCellType(type) || isFunction(getCellType(type).valueGetter);
}

/**
 * Resolves the `valueGetter` meta of the cells of one column whose `cells` function a data read calls
 * (`applyCellsToDataReads`). One reader serves one read of one column: `DataMap` builds one per column
 * a read resolves, and the Filters column read builds one per column it scans, so both apply the
 * `valueGetter` the same way and their values match.
 *
 * `cells()` runs once per cell, with no meta hook, so a data read never fires `beforeGetCellMeta` or
 * `afterGetCellMeta`, and never writes to stored meta. Its `this` is an object that inherits the cell's
 * stored meta, or the column meta for a cell without one; whatever the call writes lands on that object.
 * The object of a cell without stored meta is reused for the next cell of the read while no
 * `valueGetter` was handed it and the call wrote nothing to it, so no cell sees what the function wrote
 * for another. One object per column instead of one per cell is most of what such a read costs: each
 * column has its own meta constructor, so a new object per cell makes every property access polymorphic.
 *
 * The returned settings are applied the way the transient extension applies them when they can change
 * the value: when they carry a `valueGetter` or a `type` that ships one, or when the cell already has a
 * `valueGetter`, which can read any key `cells()` sets per row (a dropdown's reads `sourceLabel`). A
 * `valueGetter` that only a meta hook adds is seen on stored meta the render extended, as in a column
 * without `cells()`.
 *
 * The caller decides whether the `cells` function applies to a cell (`readsThroughCellsFunction()`, and
 * `MetaManager#isExtendingCellMeta()`, which must be `false`) before it asks the reader.
 */
export class CellsFunctionReader {
  /**
   * The meta manager of the grid.
   */
  #metaManager: MetaManager;
  /**
   * The physical index of the column.
   */
  #physicalColumn: number;
  /**
   * The index the reader stamps as the cell's `visualCol`.
   */
  #stampedVisualColumn: number;
  /**
   * The column property the `cells` function receives, resolved the way the dynamic extension resolves
   * it (`colToPropOrIndex()`).
   */
  #prop: unknown;
  /**
   * Whether the column meta resolves a function `valueGetter`, or `null` until a cell without stored
   * meta needs the answer. A read of a stored cell takes it from the stored meta and never asks.
   */
  #hasColumnValueGetter: boolean | null;
  /**
   * The object the reader hands the `cells` function as `this` for a cell without stored meta, kept
   * while the function wrote nothing to it, or `undefined`.
   */
  #scratchMeta: CellProperties | undefined;

  /**
   * @param {MetaManager} metaManager The meta manager of the grid.
   * @param {object} column The column to read.
   * @param {number} column.physicalColumn The physical index of the column.
   * @param {number} column.stampedVisualColumn The index stamped as each cell's `visualCol`.
   * @param {number|string|Function|null} column.prop The column property the `cells` function receives.
   * @param {boolean|null} column.hasColumnValueGetter Whether the column meta resolves a function
   *   `valueGetter`, or `null` to let the reader probe the column meta when a cell without stored meta
   *   needs it.
   */
  constructor(metaManager: MetaManager, { physicalColumn, stampedVisualColumn, prop, hasColumnValueGetter }: {
    physicalColumn: number;
    stampedVisualColumn: number;
    prop: unknown;
    hasColumnValueGetter: boolean | null;
  }) {
    this.#metaManager = metaManager;
    this.#physicalColumn = physicalColumn;
    this.#stampedVisualColumn = stampedVisualColumn;
    this.#prop = prop;
    this.#hasColumnValueGetter = hasColumnValueGetter;
  }

  /**
   * Calls the `cells` function for one cell of the column and returns the meta object its value reads
   * through, or `undefined` when no `valueGetter` applies to the cell. A returned object belongs to that
   * cell alone.
   *
   * @param {object|undefined} storedMeta The cell's stored meta, or `undefined`.
   * @param {number} physicalRow The physical row index.
   * @param {number} stampedVisualRow The index stamped as the cell's `visualRow`.
   * @returns {object|undefined}
   */
  read(
    storedMeta: CellProperties | undefined, physicalRow: number, stampedVisualRow: number
  ): CellProperties | undefined {
    const metaManager = this.#metaManager;
    const isStored = storedMeta !== undefined;
    const cellMeta: CellProperties = metaManager.stampCellMeta(
      isStored
        ? Object.create(storedMeta)
        : this.#scratchMeta ?? metaManager.createTransientColumnMeta(this.#physicalColumn),
      physicalRow, this.#physicalColumn, { visualRow: stampedVisualRow, visualColumn: this.#stampedVisualColumn }
    );
    const cellSettings = metaManager.callCellsFunction(cellMeta, this.#prop);
    const hasValueGetter = isStored ? isFunction(storedMeta.valueGetter) : this.#resolveColumnValueGetter();

    if (isKeyedObject(cellSettings) && (hasValueGetter || canCellSettingsGetValues(cellSettings))) {
      applyTransientCellSettings(cellMeta, cellSettings);
    }

    const resolvedMeta = isFunction(cellMeta.valueGetter) ? cellMeta : undefined;

    if (!isStored) {
      this.#scratchMeta = resolvedMeta === undefined && Object.keys(cellMeta).length === STAMPED_CELL_META_KEYS
        ? cellMeta
        : undefined;
    }

    return resolvedMeta;
  }

  /**
   * Answers whether the column meta resolves a function `valueGetter`, probing it on the first call.
   *
   * @returns {boolean}
   */
  #resolveColumnValueGetter(): boolean {
    if (this.#hasColumnValueGetter === null) {
      this.#hasColumnValueGetter = isFunction(this.#metaManager.getColumnMeta(this.#physicalColumn).valueGetter);
    }

    return this.#hasColumnValueGetter;
  }
}
