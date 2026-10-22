import { isObject } from '../../helpers/object';

/**
 * The settings of a sheet that decide where its cells sit in a formula engine's sheet.
 */
export interface SheetLayoutSettings {
  columns?: unknown;
  maxCols?: unknown;
  dataSchema?: unknown;
  nestedRows?: unknown;
}

/**
 * The key of a cell inside its row: an index for an array row, a property path for an object row
 * (`'address.city'`).
 */
export type CellKey = number | string;

/**
 * Where a sheet's cells sit in the engine's sheet. `rows`: engine column `j` is index `j` of an array row.
 * `keys`: engine column `j` reads `keys[j]` (`undefined` is a slot no data binds). A function reads its
 * cell through the accessor and is never written.
 */
export type EngineColumnLayout = { kind: 'rows' } | { kind: 'keys', keys: Array<CellKey | Function | undefined> };

/**
 * A row of a sheet's data, with the indexes that lead to it from the data array through `__children`.
 */
export interface SheetRow {
  row: unknown;
  path: number[];
}

/**
 * One formula cell of a sheet's data that gets new text.
 */
export interface FormulaTextChange {
  path: number[];
  key: CellKey;
  text: string;
}

/**
 * Lists a sheet's rows in the order the grid holds them: the data array's rows, and with `nested` each
 * row's `__children` right after it, the way NestedRows lays out the tree.
 *
 * @param {Array} data The sheet's data.
 * @param {boolean} nested Whether the sheet is a NestedRows tree.
 * @returns {object[]}
 */
export function listSheetRows(data: unknown[], nested: boolean): SheetRow[] {
  const rows: SheetRow[] = [];
  const visit = (container: unknown[], parentPath: number[]) => {
    container.forEach((row, index) => {
      const path = parentPath.concat(index);

      rows.push({ row, path });

      const children = nested && isObject(row) ? (row as { __children?: unknown }).__children : undefined;

      if (Array.isArray(children)) {
        visit(children, path);
      }
    });
  };

  visit(data, []);

  return rows;
}

/**
 * Lists the property paths of the plain-value leaves of an object, the way the grid lays out an object
 * row when no `columns` is set: one column per leaf, nested plain objects walked as `a.b`, and arrays,
 * functions, other objects and `__children` left out.
 *
 * @param {object} schema The first row.
 * @param {string} [parent] The path of the object.
 * @returns {string[]}
 */
function listLeafPaths(schema: Record<string, unknown>, parent = ''): string[] {
  let paths: string[] = [];

  Object.keys(schema).forEach((key) => {
    const value = schema[key];

    if (key === '__children' || typeof value === 'function' || Array.isArray(value)) {
      return;
    }

    if (isObject(value) && Object.getPrototypeOf(value) === Object.prototype) {
      paths = paths.concat(listLeafPaths(value as Record<string, unknown>, `${parent}${key}.`));
    } else if (typeof value !== 'object' || value === null) {
      paths.push(`${parent}${key}`);
    }
  });

  return paths;
}

/**
 * Tells where a sheet's cells sit in its engine sheet, the way the Formulas plugin feeds the sheet when it
 * is shown: array rows as they are, unless `columns` or `maxCols` leaves data columns out, when only the
 * columns that are shown are fed, in their order; object rows one column per `columns[].data` path, or per
 * leaf of the first row without `columns`. `null` when the settings leave it to code the bar cannot run
 * ahead of time: a `columns` function or a `dataSchema`.
 *
 * @param {Array} data The sheet's data.
 * @param {object} settings The settings the sheet is shown with.
 * @returns {object|null}
 */
export function getEngineColumnLayout(data: unknown[], settings: SheetLayoutSettings): EngineColumnLayout | null {
  const { columns, maxCols, dataSchema } = settings;

  if (typeof columns === 'function' || (dataSchema !== undefined && dataSchema !== null)) {
    return null;
  }

  const firstRow = data[0];
  const cap = typeof maxCols === 'number' ? maxCols : Infinity;

  if (firstRow === undefined || Array.isArray(firstRow)) {
    const width = Array.isArray(firstRow) ? firstRow.length : 0;
    const declared = Array.isArray(columns) ? Math.min(cap, columns.length) : Math.min(cap, width);

    if (declared >= width) {
      return { kind: 'rows' };
    }

    const keys: number[] = [];

    for (let column = 0; column < declared; column++) {
      const entry: unknown = Array.isArray(columns) ? (columns as unknown[])[column] : undefined;
      const key = isObject(entry) && (entry as { data?: unknown }).data !== undefined
        ? (entry as { data?: unknown }).data
        : column;

      if (typeof key === 'number') {
        keys.push(key);
      }
    }

    return { kind: 'keys', keys };
  }

  if (!isObject(firstRow)) {
    return null;
  }

  if (Array.isArray(columns)) {
    return {
      kind: 'keys',
      keys: columns.slice(0, cap).map((entry, column) => {
        const key = isObject(entry) ? (entry as { data?: unknown }).data : undefined;

        if (typeof key === 'string' || typeof key === 'number' || typeof key === 'function') {
          return key;
        }

        return key === undefined ? column : undefined;
      }),
    };
  }

  return { kind: 'keys', keys: listLeafPaths(firstRow as Record<string, unknown>).slice(0, cap) };
}

/**
 * Reads the value at `key` of a row, the way the grid reads a column's property: an own property named
 * exactly the key first, then the dotted path.
 *
 * @param {*} row The row.
 * @param {*} key The key, or an accessor function.
 * @returns {*}
 */
export function readCell(row: unknown, key: CellKey | Function | undefined): unknown {
  if (key === undefined || typeof row !== 'object' || row === null) {
    return undefined;
  }

  if (typeof key === 'function') {
    return key(row);
  }

  const record = row as Record<string | number, unknown>;

  if (typeof key === 'number' || Object.prototype.hasOwnProperty.call(record, key) || !key.includes('.')) {
    return record[key];
  }

  return key.split('.').reduce<unknown>(
    (value, part) => (isObject(value) ? (value as Record<string, unknown>)[part] : undefined), record,
  );
}

/**
 * Lists the keys of a row's engine cells under a layout, in engine column order. An array row under a
 * projecting layout leaves out the columns it is too short for, as the Formulas plugin's feed does.
 *
 * @param {*} row The row.
 * @param {object} layout The sheet's layout.
 * @returns {Array}
 */
export function getEngineCellKeys(row: unknown, layout: EngineColumnLayout): Array<CellKey | Function | undefined> {
  if (layout.kind === 'rows') {
    return Array.isArray(row) ? row.map((_, index) => index) : [];
  }

  if (Array.isArray(row)) {
    return layout.keys.filter(key => typeof key === 'number' && key < row.length);
  }

  return layout.keys;
}

/**
 * Returns a sheet's data as the rows of cells a formula engine takes, laid out the way the Formulas
 * plugin feeds the sheet when it is shown (`getEngineColumnLayout()`), so a reference into a sheet that
 * was never shown reads the same cell as one into a sheet that was. A cell that holds an object or a
 * function gets `null`, as the engine accepts only plain values. HyperFormula refuses anything but an
 * array of arrays, so passing object rows threw at construction and from `addSheet()`.
 *
 * @param {Array} data The sheet's data.
 * @param {object} settings The settings the sheet is shown with.
 * @returns {Array[]}
 */
export function toEngineContent(data: unknown[], settings: SheetLayoutSettings): unknown[] {
  const layout = getEngineColumnLayout(data, settings);
  const rows = listSheetRows(data, !!settings.nestedRows);

  if (layout?.kind === 'rows' && rows.length === data.length) {
    return data;
  }

  return rows.map(({ row }): unknown[] => {
    if (layout === null) {
      return Array.isArray(row) ? row as unknown[] : [];
    }

    return getEngineCellKeys(row, layout).map((key) => {
      const value = readCell(row, key);

      return value === undefined || isObject(value) || typeof value === 'function' ? null : value;
    });
  });
}

/**
 * Collects the formula cells of a sheet's data whose text a rewrite changes: every string that starts
 * with `=`, in array rows and in object rows at any depth, `__children` rows included. Nothing is written,
 * so a caller can apply every change at once, and only after it knows all of them.
 *
 * @param {Array} data The sheet's data.
 * @param {Function} rewrite Maps a formula's text to its new text, or to the same string.
 * @returns {object[]}
 */
export function collectFormulaTextChanges(data: unknown[], rewrite: (formula: string) => string): FormulaTextChange[] {
  const changes: FormulaTextChange[] = [];
  const scan = (value: unknown, path: number[], key: string | null) => {
    if (typeof value === 'string') {
      if (key !== null && value.startsWith('=')) {
        const text = rewrite(value);

        if (text !== value) {
          changes.push({ path, key, text });
        }
      }

      return;
    }

    if (!isObject(value) || Object.getPrototypeOf(value) !== Object.prototype) {
      return;
    }

    Object.keys(value as object).forEach((childKey) => {
      if (childKey !== '__children') {
        scan((value as Record<string, unknown>)[childKey], path, key === null ? childKey : `${key}.${childKey}`);
      }
    });
  };

  listSheetRows(data, true).forEach(({ row, path }) => {
    if (Array.isArray(row)) {
      row.forEach((cell, index) => {
        if (typeof cell === 'string' && cell.startsWith('=')) {
          const text = rewrite(cell);

          if (text !== cell) {
            changes.push({ path, key: index, text });
          }
        }
      });
    } else {
      scan(row, path, null);
    }
  });

  return changes;
}

/**
 * Returns `target` with `value` at the dotted `parts`, writing in place where an object is not frozen and
 * into a copy where it is.
 *
 * @param {object} target The object or array.
 * @param {Array} parts The path.
 * @param {*} value The value.
 * @returns {object}
 */
function withValueAt(target: Record<string | number, unknown>, parts: CellKey[], value: unknown) {
  const [part, ...rest] = parts;
  const next = rest.length === 0 ? value : withValueAt(target[part] as Record<string, unknown>, rest, value);

  if (rest.length > 0 && next === target[part]) {
    return target;
  }

  const result = Object.isFrozen(target)
    ? (Array.isArray(target) ? target.slice() : { ...target }) as Record<string | number, unknown>
    : target;

  result[part] = next;

  return result;
}

/**
 * Splits a cell key into the steps that lead to its value: an own property named exactly the key is one
 * step, as the grid reads it.
 *
 * @param {*} row The row.
 * @param {*} key The cell key.
 * @returns {Array}
 */
function toKeyParts(row: unknown, key: CellKey): CellKey[] {
  if (typeof key === 'number' || Object.prototype.hasOwnProperty.call(row, key) || !key.includes('.')) {
    return [key];
  }

  return key.split('.');
}

/**
 * Tells whether writing a change in place would throw: its row, or an object on the way to its value, is
 * frozen.
 *
 * @param {Array} data The sheet's data.
 * @param {object} change The change.
 * @returns {boolean}
 */
export function isChangeTargetFrozen(data: unknown[], change: FormulaTextChange): boolean {
  let row: unknown = data;

  change.path.forEach((index, depth) => {
    row = depth > 0 ? (row as Record<string, unknown[]>).__children[index] : (row as unknown[])[index];
  });

  const parts = toKeyParts(row, change.key);
  let target: unknown = row;

  return parts.some((part, depth) => {
    const frozen = Object.isFrozen(target);

    if (depth < parts.length - 1) {
      target = (target as Record<string | number, unknown>)[part];
    }

    return frozen;
  });
}

/**
 * Writes formula text changes into a sheet's data. A row, an object inside it, a `__children` array, or the
 * data array the host froze (an Immer store, `Object.freeze`) is replaced by a copy on the way, so no write
 * throws halfway through. Returns the array that holds the changes: the same one, or a copy.
 *
 * @param {Array} data The sheet's data.
 * @param {object[]} changes The changes.
 * @returns {Array}
 */
export function writeFormulaTextChanges(data: unknown[], changes: FormulaTextChange[]): unknown[] {
  return changes.reduce<unknown[]>((current, { path, key, text }) => {
    const parts: CellKey[] = [];
    let row: unknown = current;

    path.forEach((index, depth) => {
      if (depth > 0) {
        parts.push('__children');
        row = (row as Record<string, unknown>).__children;
      }

      parts.push(index);
      row = (row as unknown[])[index];
    });

    return withValueAt(
      current as unknown as Record<number, unknown>, parts.concat(toKeyParts(row, key)), text,
    ) as unknown as unknown[];
  }, data);
}
