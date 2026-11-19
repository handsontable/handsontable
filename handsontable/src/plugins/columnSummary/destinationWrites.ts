import { hasOwnProperty } from '../../helpers/object';

/**
 * A row of the data array: an array, or an object of an array of objects.
 */
export type DataRow = Record<string | number, unknown>;

/**
 * A `columns[].data` function: called with the row it reads, and with the row and a value it writes.
 */
export type DataAccessor = (row: DataRow, value?: unknown) => unknown;

/**
 * The property a cell is bound to: a key, a dot path, or a `columns[].data` function.
 */
export type CellProp = string | number | DataAccessor;

/**
 * Where the path to a cell stood before the plugin first wrote there: the first path segment that held no
 * object to walk into (the cell's own key when the whole path existed), whether that segment was an own key
 * of its parent, and the value it held.
 */
interface PriorState {
  depth: number;
  had: boolean;
  value: unknown;
}

/**
 * The state of one destination cell: what it held before the plugin's first result, the result last read
 * back from it, and whether a result was written at all (a change can be vetoed after `beforeChange`).
 */
interface DestinationRecord {
  prior: PriorState;
  written: unknown;
  applied: boolean;
}

/**
 * Tells whether a value is a row of the data array (an array, or an object of an array of objects).
 *
 * @param {*} row The value.
 * @returns {boolean}
 */
export function isDataRow(row: unknown): row is DataRow {
  return typeof row === 'object' && row !== null;
}

/**
 * Splits a cell's property into the path segments `DataMap` walks: a key the row owns wins over a dot path,
 * and a dot path is walked only with `dataDotNotation` on.
 *
 * @param {object} row The data row.
 * @param {string|number} prop The cell's property.
 * @param {boolean} dataDotNotation The `dataDotNotation` setting.
 * @returns {Array<string|number>}
 */
function toSegments(row: DataRow, prop: string | number, dataDotNotation: boolean): (string | number)[] {
  if (dataDotNotation && typeof prop === 'string' && prop.includes('.') && !hasOwnProperty(row, prop)) {
    return prop.split('.');
  }

  return [prop];
}

/**
 * Walks the path to the parent of the segment at `depth`.
 *
 * @param {object} row The data row.
 * @param {Array<string|number>} segments The path segments.
 * @param {number} depth The segment whose parent is wanted.
 * @returns {object|null} The parent, or `null` when the path no longer leads to an object.
 */
function parentAt(row: DataRow, segments: (string | number)[], depth: number): DataRow | null {
  let parent: unknown = row;

  for (let index = 0; index < depth; index += 1) {
    parent = isDataRow(parent) ? parent[segments[index]] : undefined;
  }

  return isDataRow(parent) ? parent : null;
}

/**
 * Tells whether a property can be assigned without throwing: a writable own data property, an own accessor
 * with a setter, or a missing key on an extensible object. A frozen or sealed row (`Object.freeze()`, Immer)
 * answers `false`.
 *
 * @param {object} target The object.
 * @param {string|number} key The property.
 * @returns {boolean}
 */
function canAssign(target: DataRow, key: string | number): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);

  if (!descriptor) {
    return Object.isExtensible(target);
  }

  if (descriptor.get || descriptor.set) {
    return typeof descriptor.set === 'function';
  }

  return descriptor.writable === true;
}

/**
 * Removes a key the plugin created, without throwing. The last element of an array is taken off by
 * shortening the array, so the array keeps the length it had; any other key is deleted. A key the object
 * does not let go of (a frozen or sealed object) stays.
 *
 * @param {object} target The object.
 * @param {string|number} key The property.
 */
function removeKey(target: DataRow, key: string | number): void {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);

  if (!descriptor || descriptor.configurable !== true) {
    return;
  }

  if (Array.isArray(target) && Number(key) === target.length - 1) {
    if (Object.getOwnPropertyDescriptor(target, 'length')?.writable === true) {
      target.length -= 1;
    }

    return;
  }

  delete target[key];
}

/**
 * Reads a cell straight from its data row, the way `DataMap` reads it.
 *
 * @param {object} row The data row.
 * @param {string|number|Function} prop The cell's property.
 * @param {boolean} dataDotNotation The `dataDotNotation` setting.
 * @returns {*}
 */
export function readCell(row: DataRow, prop: CellProp, dataDotNotation: boolean): unknown {
  if (typeof prop === 'function') {
    return prop(row);
  }

  const segments = toSegments(row, prop, dataDotNotation);
  const parent = parentAt(row, segments, segments.length - 1);

  return parent ? parent[segments[segments.length - 1]] : undefined;
}

/**
 * Captures where the path to a cell stands before the first write: the first segment that holds no object
 * to walk into. `DataMap` replaces that segment with a new object when it writes a dot path, so it is what
 * a restore has to put back.
 *
 * @param {object} row The data row.
 * @param {Array<string|number>} segments The path segments.
 * @returns {object}
 */
function capturePriorState(row: DataRow, segments: (string | number)[]): PriorState {
  let parent = row;

  for (let depth = 0; depth < segments.length; depth += 1) {
    const key = segments[depth];
    const value = parent[key];

    if (depth === segments.length - 1 || !isDataRow(value)) {
      return { depth, had: hasOwnProperty(parent, key), value };
    }

    parent = value;
  }

  return { depth: 0, had: false, value: undefined };
}

/**
 * The summary results ColumnSummary wrote into the data array, per row object and cell property, with what
 * each destination cell held before the first one. The data array is the host's, so the array the grid
 * replaces gets those values back (`restore()`), and a copy of it can be put in the same state
 * (`restoreInCopy()`).
 */
export class DestinationWrites {
  /**
   * The records, keyed by the source row object and the cell's property.
   *
   * @type {Map<object, Map<string|number|Function, object>>}
   */
  #rows = new Map<DataRow, Map<CellProp, DestinationRecord>>();

  /**
   * Records what a destination cell holds right before the plugin writes into it, unless it was recorded
   * before: the first state is the one a restore puts back.
   *
   * @param {object} row The data row.
   * @param {string|number|Function} prop The cell's property.
   * @param {boolean} dataDotNotation The `dataDotNotation` setting.
   */
  recordBefore(row: DataRow, prop: CellProp, dataDotNotation: boolean): void {
    let cells = this.#rows.get(row);

    if (!cells) {
      cells = new Map();
      this.#rows.set(row, cells);
    }

    if (cells.has(prop)) {
      return;
    }

    const prior = typeof prop === 'function'
      ? { depth: 0, had: true, value: prop(row) }
      : capturePriorState(row, toSegments(row, prop, dataDotNotation));

    cells.set(prop, { prior, written: undefined, applied: false });
  }

  /**
   * Records the value a destination cell holds after the plugin wrote into it, read back from the cell, so
   * two results written into one cell in one batch leave the one that landed.
   *
   * @param {object} row The data row.
   * @param {string|number|Function} prop The cell's property.
   * @param {boolean} dataDotNotation The `dataDotNotation` setting.
   */
  recordAfter(row: DataRow, prop: CellProp, dataDotNotation: boolean): void {
    const record = this.#rows.get(row)?.get(prop);

    if (record) {
      record.written = readCell(row, prop, dataDotNotation);
      record.applied = true;
    }
  }

  /**
   * Puts the recorded values back into the rows of `data` and forgets every record. A cell that no longer
   * holds the result the plugin wrote last (the user or the host replaced it), a row no longer in `data`,
   * and a cell that cannot be written without throwing (a frozen row) are left as they are.
   *
   * @param {Array} data The data array the grid is about to replace.
   * @param {boolean} dataDotNotation The `dataDotNotation` setting.
   */
  restore(data: unknown[], dataDotNotation: boolean): void {
    const rows = this.#rows;

    this.#rows = new Map();

    if (rows.size === 0) {
      return;
    }

    const present = new Set(data);

    rows.forEach((cells, row) => {
      if (present.has(row)) {
        cells.forEach((record, prop) => restoreCell(row, prop, record, dataDotNotation));
      }
    });
  }

  /**
   * Puts the recorded values into a copy of `source`, row for row, and keeps the records: `source` is
   * still the data the grid shows.
   *
   * @param {Array} source The data array the records describe.
   * @param {Array} copy A copy of it, with the same row order.
   * @param {boolean} dataDotNotation The `dataDotNotation` setting.
   */
  restoreInCopy(source: unknown[], copy: unknown[], dataDotNotation: boolean): void {
    if (this.#rows.size === 0) {
      return;
    }

    const indexes = new Map<unknown, number>();

    source.forEach((row, index) => indexes.set(row, index));

    this.#rows.forEach((cells, row) => {
      const index = indexes.get(row);
      const copiedRow = index === undefined ? undefined : copy[index];

      if (isDataRow(copiedRow)) {
        cells.forEach((record, prop) => restoreCell(copiedRow, prop, record, dataDotNotation));
      }
    });
  }

  /**
   * Forgets every record.
   */
  clear(): void {
    this.#rows = new Map();
  }
}

/**
 * Puts one recorded value back, when the cell still holds the result the plugin wrote last and can be
 * written without throwing. A key the write created is removed again rather than set to `undefined`, so the
 * row keeps its shape.
 *
 * @param {object} row The data row.
 * @param {string|number|Function} prop The cell's property.
 * @param {object} record The record.
 * @param {boolean} dataDotNotation The `dataDotNotation` setting.
 */
function restoreCell(row: DataRow, prop: CellProp, record: DestinationRecord, dataDotNotation: boolean): void {
  if (!record.applied || !Object.is(readCell(row, prop, dataDotNotation), record.written)) {
    return;
  }

  const { prior } = record;

  if (typeof prop === 'function') {
    if (!Object.isFrozen(row)) {
      prop(row, prior.value);
    }

    return;
  }

  const segments = toSegments(row, prop, dataDotNotation);
  const parent = parentAt(row, segments, prior.depth);
  const key = segments[prior.depth];

  if (!parent) {
    return;
  }

  if (!prior.had) {
    removeKey(parent, key);

  } else if (canAssign(parent, key)) {
    parent[key] = prior.value;
  }
}
