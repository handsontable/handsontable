import { splitIntoCharacters } from '../../helpers/string';
import { isPlainObject } from '../../helpers/object';

/**
 * A single sheet held by the SheetsBar plugin.
 */
export interface Sheet {
  id: number;
  name: string;
  data: unknown[];
  settings?: Record<string, unknown>;
  viewState?: Record<string, unknown>;
}

/**
 * Columns a sheet starts with when no data is supplied — A through Z, the width a spreadsheet
 * hands you on a fresh sheet.
 *
 * @type {number}
 */
export const NEW_SHEET_COLUMN_COUNT = 26;

/**
 * Rows a sheet starts with when no data is supplied.
 *
 * @type {number}
 */
export const NEW_SHEET_ROW_COUNT = 1000;

/**
 * The longest a sheet name may be, counted in characters rather than in UTF-16 units so an
 * emoji or an accented letter costs the same as a plain one.
 *
 * @type {number}
 */
export const MAX_SHEET_NAME_LENGTH = 50;

/**
 * Cuts a name to the length limit without trimming it, for a value still being typed.
 *
 * @param {string} name The name as typed.
 * @param {number} [limit] The longest the result may be.
 * @returns {string} The name, no longer than the limit.
 */
export function truncateSheetName(name: string, limit: number = MAX_SHEET_NAME_LENGTH): string {
  const characters = splitIntoCharacters(name);

  return characters.length <= limit ? name : characters.slice(0, limit).join('');
}

/**
 * Matches a character a reader can see: anything but white space and the invisible format characters
 * (zero-width spaces and joiners, bidi marks and isolates, the word joiner).
 *
 * @type {RegExp}
 */
const VISIBLE_CHARACTER = /[^\s\p{Cf}]/u;

/**
 * Trims a name and cuts it to the length limit. A name with no visible character comes back empty, the
 * way a blank one does, so it cannot label a tab that looks blank.
 *
 * @param {string} name The requested name.
 * @param {number} [limit] The longest the result may be.
 * @returns {string} The name as it may be stored, or `''`.
 */
export function clampSheetName(name: string, limit: number = MAX_SHEET_NAME_LENGTH): string {
  const clamped = truncateSheetName(name.trim(), limit).trim();

  return VISIBLE_CHARACTER.test(clamped) ? clamped : '';
}

/**
 * Compares two names the way HyperFormula compares sheet names: without regard to case, so a tab name
 * and the formula engine agree on which names are taken. The same letters spell the same name whether a
 * composed or a decomposed form arrived. Plain `toLowerCase()`, as the engine uses: a locale-aware lower
 * case would turn `ITEMS` into `ıtems` on a Turkish host.
 *
 * @param {string} a One name.
 * @param {string} b The other.
 * @returns {boolean} `true` when the two read the same.
 */
function isSameName(a: string, b: string): boolean {
  return a.normalize('NFC').toLowerCase() === b.normalize('NFC').toLowerCase();
}

/**
 * Builds the blank grid a new sheet starts from. The cells hold `null` rather than `''`, so an
 * untouched cell reads as empty to validators and to the export plugins.
 *
 * @param {number} [rows] Row count.
 * @param {number} [columns] Column count.
 * @returns {Array[]} A fresh data array, safe for the caller to mutate.
 */
export function createEmptySheetData(
  rows: number = NEW_SHEET_ROW_COUNT,
  columns: number = NEW_SHEET_COLUMN_COUNT,
): unknown[][] {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => null));
}

/**
 * Read-only descriptor returned by the public listing API.
 */
export interface SheetDescriptor {
  id: number;
  name: string;
  isActive: boolean;
}

/**
 * Owns the sheet collection state and its mutations. Pure — no Handsontable access,
 * fully unit-testable in isolation.
 */
export class SheetModel {
  /**
   * Sheets keyed by their stable internal id.
   */
  #sheets = new Map<number, Sheet>();

  /**
   * Tab display order (sheet ids).
   */
  #order: number[] = [];

  /**
   * The active sheet id, or `null` when the model is empty.
   */
  #activeSheetId: number | null = null;

  /**
   * Hands out the id of each new sheet.
   */
  readonly #allocateId: () => number;
  /**
   * The number of sheets added to this model, which numbers the generated `{word}{n}` names.
   */
  #addedCount = 0;
  /**
   * Supplies the word a generated `{word}{n}` name starts from, in the grid's language.
   */
  readonly #defaultName: () => string;

  /**
   * Creates an empty model.
   *
   * @param {Function} [defaultName] Supplies the word generated sheet names start from.
   * @param {Function} [allocateId] Hands out the id of each new sheet. The plugin passes one that
   * outlives the model, so a rebuilt workbook never reuses an id a host may still hold. Omitted, the
   * ids count up from 1.
   */
  constructor(defaultName: () => string = () => 'Sheet', allocateId?: () => number) {
    let lastId = 0;

    this.#defaultName = defaultName;
    this.#allocateId = allocateId ?? (() => {
      lastId += 1;

      return lastId;
    });
  }

  /**
   * Returns descriptors for all sheets in tab order.
   */
  getSheets(): SheetDescriptor[] {
    return this.#order.map(id => this.#toDescriptor(this.#sheets.get(id) as Sheet));
  }

  /**
   * Returns the active sheet descriptor, or `null` when the model is empty.
   */
  getActiveSheet(): SheetDescriptor | null {
    const sheet = this.#activeSheetId === null ? null : this.#sheets.get(this.#activeSheetId);

    return sheet ? this.#toDescriptor(sheet) : null;
  }

  /**
   * Returns the full internal sheet record by id, or `null`.
   */
  getSheetById(id: number): Sheet | null {
    return this.#sheets.get(id) ?? null;
  }

  /**
   * Resolves a sheet id from an id or a unique name. Returns `null` when not found, and for a value that
   * is neither a number nor a string.
   */
  resolveId(idOrName: unknown): number | null {
    if (typeof idOrName === 'number') {
      return this.#sheets.has(idOrName) ? idOrName : null;
    }

    if (typeof idOrName !== 'string') {
      return null;
    }

    for (const sheet of this.#sheets.values()) {
      if (isSameName(sheet.name, idOrName)) {
        return sheet.id;
      }
    }

    return null;
  }

  /**
   * Tells whether a sheet other than `exceptId` already uses a name.
   *
   * @param {string} name The name, as it would be stored.
   * @param {number} exceptId The sheet the name is meant for.
   * @returns {boolean}
   */
  isNameTaken(name: string, exceptId: number): boolean {
    const id = this.resolveId(name);

    return id !== null && id !== exceptId;
  }

  /**
   * Marks a sheet as active. Returns `false` for unknown ids.
   */
  setActiveSheet(id: number): boolean {
    if (!this.#sheets.has(id)) {
      return false;
    }
    this.#activeSheetId = id;

    return true;
  }

  /**
   * Appends a sheet. A `null`/omitted, blank, or whitespace-only name gets the next unique
   * `Sheet{num}` default.
   */
  addSheet(
    name?: string | null,
    data: unknown[] = createEmptySheetData(),
    settings?: Record<string, unknown>,
  ): Sheet {
    const id = this.#allocateId();

    this.#addedCount += 1;

    const sheet: Sheet = {
      id,
      name: this.#uniqueName(name ?? null),
      data,
      settings,
    };

    this.#sheets.set(id, sheet);
    this.#order.push(id);

    if (this.#activeSheetId === null) {
      this.#activeSheetId = id;
    }

    return sheet;
  }

  /**
   * Renames a sheet. Returns `false` when the id is unknown or the name is taken.
   */
  renameSheet(id: number, name: string): boolean {
    const sheet = this.#sheets.get(id);
    const trimmed = clampSheetName(name);

    if (!sheet || trimmed === '' || this.isNameTaken(trimmed, id)) {
      return false;
    }
    sheet.name = trimmed;

    return true;
  }

  /**
   * Removes a sheet. The last remaining sheet cannot be removed. When the active
   * sheet is removed, the nearest remaining neighbor becomes active.
   */
  removeSheet(id: number): boolean {
    const index = this.#order.indexOf(id);

    if (index === -1 || this.#order.length === 1) {
      return false;
    }

    this.#order.splice(index, 1);
    this.#sheets.delete(id);

    if (this.#activeSheetId === id) {
      this.#activeSheetId = this.#order[Math.min(index, this.#order.length - 1)];
    }

    return true;
  }

  /**
   * Moves a sheet to the given tab index. Returns `false` for unknown ids, and for an index that is
   * not an integer or is out of range.
   */
  moveSheet(id: number, index: number): boolean {
    const from = this.#order.indexOf(id);

    if (from === -1 || !Number.isInteger(index) || index < 0 || index >= this.#order.length) {
      return false;
    }

    this.#order.splice(from, 1);
    this.#order.splice(index, 0, id);

    return true;
  }

  /**
   * Duplicates a sheet with a deep-copied data array and a derived unique name.
   */
  duplicateSheet(id: number): Sheet | null {
    const source = this.#sheets.get(id);

    if (!source) {
      return null;
    }

    const settings = source.settings ? copySettingsValue(source.settings) as Record<string, unknown> : undefined;

    const duplicate = this.addSheet(
      this.#freeNumberedName(source.name),
      copySheetData(source.data),
      settings,
    );

    // `addSheet` appends, which is right for a brand-new sheet but not for a copy: a duplicate
    // belongs immediately to the right of what it was copied from, so the pair stays together
    // however far down the strip the original sits.
    this.#order.splice(this.#order.indexOf(duplicate.id), 1);
    this.#order.splice(this.#order.indexOf(id) + 1, 0, duplicate.id);

    return duplicate;
  }

  /**
   * Returns the name `duplicateSheet()` would give a copy of a sheet now, or `null` for an unknown id.
   *
   * @param {number} id The sheet to copy.
   * @returns {string|null}
   */
  getDuplicateName(id: number): string | null {
    const source = this.#sheets.get(id);

    return source ? this.#freeNumberedName(source.name) : null;
  }

  /**
   * Builds a public descriptor for a sheet.
   */
  #toDescriptor(sheet: Sheet): SheetDescriptor {
    return { id: sheet.id, name: sheet.name, isActive: sheet.id === this.#activeSheetId };
  }

  /**
   * Returns the requested name when free, otherwise the next free variant: defaults count up as
   * `Sheet{n}`, explicit collisions count up as `name (n)` after the whole requested name, the way
   * the formula engine's sheet names are numbered (`freeEngineName()`). A counter the requested name
   * already ends with is kept, so "Budget (2024)" becomes "Budget (2024) (2)", not "Budget (2)".
   * A request with no visible character takes the default numbering instead: the blank that
   * `renameSheet` rejects must not be creatable through `addSheet`.
   */
  #uniqueName(requested: string | null): string {
    const trimmed = requested === null ? null : clampSheetName(requested);
    const clamped = trimmed === '' ? null : trimmed;

    if (clamped !== null && this.resolveId(clamped) === null) {
      return clamped;
    }

    if (clamped !== null) {
      return this.#freeNumberedName(clamped);
    }

    let counter = this.#addedCount;
    let candidate = this.#numberedName(this.#defaultName(), counter, true);

    while (this.resolveId(candidate) !== null) {
      counter += 1;
      candidate = this.#numberedName(this.#defaultName(), counter, true);
    }

    return candidate;
  }

  /**
   * Returns the first free `name (n)`, counting from 2.
   *
   * @param {string} base The name being numbered.
   * @returns {string}
   */
  #freeNumberedName(base: string): string {
    let counter = 2;
    let candidate = this.#numberedName(base, counter, false);

    while (this.resolveId(candidate) !== null) {
      counter += 1;
      candidate = this.#numberedName(base, counter, false);
    }

    return candidate;
  }

  /**
   * Builds a numbered variant of a name that still fits the length limit — the counter is what
   * makes the name unique, so the base gives way to it rather than the other way round. The base is
   * cut with `truncateSheetName()`, not `clampSheetName()`: a cut that leaves only invisible characters
   * must keep them, or the name `getDuplicateName()` reports would differ from the one the copy gets.
   *
   * @param {string} base The name being varied.
   * @param {number} counter The variant number.
   * @param {boolean} isDefault Whether this is a generated `Sheet{n}` name rather than a
   *   collision with a requested one.
   * @returns {string} The numbered name.
   */
  #numberedName(base: string, counter: number, isDefault: boolean): string {
    const suffix = isDefault ? `${counter}` : ` (${counter})`;
    const head = truncateSheetName(base.trim(), MAX_SHEET_NAME_LENGTH - suffix.length).trim();

    return `${head}${suffix}`;
  }
}

/**
 * Tells whether a value is an object literal: an object whose prototype is `Object.prototype` or `null`.
 * `isPlainObject` also answers `true` for a class instance such as a HyperFormula engine.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isObjectLiteral(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * The keys `copySettingsValue()` leaves out of a copy.
 */
const UNCOPIED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Copies a sheet's data for a duplicate, so the copy's rows and cells can change without changing the
 * original's. Every row gets a copy of its own: an array row and an object literal row as `copyCellData()`
 * copies them, and a row that is an instance of a class as a new object with the same prototype, so an edit
 * in the copy never reaches the original's row. A hole in the data array or in a row stays a hole, so every
 * value keeps its column.
 *
 * @param {Array} data The sheet's data.
 * @returns {Array} The copy.
 */
export function copySheetData(data: unknown[]): unknown[] {
  const copies = new WeakMap<object, unknown>();
  const copy: unknown[] = new Array(data.length);

  copies.set(data, copy);

  for (let index = 0; index < data.length; index += 1) {
    if (index in data) {
      copy[index] = copyRow(data[index], copies);
    }
  }

  return copy;
}

/**
 * Copies one row of a sheet's data (`copySheetData()`).
 *
 * @param {*} row The row.
 * @param {WeakMap} copies The copies made so far in this call.
 * @returns {*} The copy.
 */
function copyRow(row: unknown, copies: WeakMap<object, unknown>): unknown {
  if (row === null || typeof row !== 'object' || Array.isArray(row) || isObjectLiteral(row) || !isClassRow(row)) {
    return copyCellData(row, copies);
  }

  if (copies.has(row)) {
    return copies.get(row);
  }

  const copy = Object.create(Object.getPrototypeOf(row) as object) as Record<string, unknown>;

  copies.set(row, copy);
  copyOwnProperties(row as Record<string, unknown>, copy, copies);

  return copy;
}

/**
 * Tells whether a row is an instance of a class: an object that is not a `Date`, a `RegExp`, a `Map` or a
 * `Set`, which `copyCellData()` copies as values of their own kind.
 *
 * @param {object} row The row.
 * @returns {boolean}
 */
function isClassRow(row: object): boolean {
  return !(row instanceof Date || row instanceof RegExp || row instanceof Map || row instanceof Set);
}

/**
 * Copies the own enumerable properties of an object into another one, each value through
 * `copyCellData()`. The keys `__proto__`, `constructor` and `prototype` are left out.
 *
 * @param {object} source The object to copy from.
 * @param {object} target The object to copy into.
 * @param {WeakMap} copies The copies made so far in this call.
 */
function copyOwnProperties(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  copies: WeakMap<object, unknown>,
) {
  const keys = Object.keys(source);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];

    if (!UNCOPIED_KEYS.has(key)) {
      target[key] = copyCellData(source[key], copies);
    }
  }
}

/**
 * Copies a cell value for a duplicate: arrays and object literals level by level, and a `Date`, a
 * `RegExp`, a `Map` and a `Set` as a new value of the same kind, so the copy's cells can change without
 * changing the original's. A class instance in a cell is kept by reference, with its prototype, the way
 * `copySettingsValue()` keeps one. `deepClone()` walked every object as an object literal, so a `RegExp`,
 * a `Map` or a `Set` in a cell came out as `{}`, and a class instance lost its prototype. A hole in an
 * array stays a hole.
 *
 * Primitives return first and arrays are copied with an indexed loop, because a duplicate copies every
 * cell of the sheet. `copies` maps every array, object literal, `Map` and `Set` already copied to its copy,
 * so a value that refers to itself is copied with the same shape instead of recursing until the stack
 * overflows.
 *
 * @param {*} value The value to copy.
 * @param {WeakMap} [copies] The copies made so far in this call.
 * @returns {*} The copy, or `value` itself when it is kept by reference.
 */
export function copyCellData(value: unknown, copies = new WeakMap<object, unknown>()): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  if (copies.has(value)) {
    return copies.get(value);
  }

  if (Array.isArray(value)) {
    return copyArray(value, copies);
  }

  if (value instanceof Map || value instanceof Set) {
    return copyCollection(value, copies);
  }

  if (!isObjectLiteral(value)) {
    return value;
  }

  const copy: Record<string, unknown> = {};

  copies.set(value, copy);
  copyOwnProperties(value as Record<string, unknown>, copy, copies);

  return copy;
}

/**
 * Copies an array for `copyCellData()`, keeping its length and its holes.
 *
 * @param {Array} source The array.
 * @param {WeakMap} copies The copies made so far in this call.
 * @returns {Array} The copy.
 */
function copyArray(source: unknown[], copies: WeakMap<object, unknown>): unknown[] {
  const copy: unknown[] = new Array(source.length);

  copies.set(source, copy);

  for (let index = 0; index < source.length; index += 1) {
    if (index in source) {
      copy[index] = copyCellData(source[index], copies);
    }
  }

  return copy;
}

/**
 * Copies a `Map` or a `Set` for `copyCellData()`: a `Map` keeps its keys by reference and copies its values.
 *
 * @param {Map|Set} source The collection.
 * @param {WeakMap} copies The copies made so far in this call.
 * @returns {Map|Set} The copy.
 */
function copyCollection(
  source: Map<unknown, unknown> | Set<unknown>,
  copies: WeakMap<object, unknown>,
): Map<unknown, unknown> | Set<unknown> {
  if (source instanceof Map) {
    const copy = new Map<unknown, unknown>();

    copies.set(source, copy);
    source.forEach((entry: unknown, key: unknown) => {
      copy.set(key, copyCellData(entry, copies));
    });

    return copy;
  }

  const copy = new Set<unknown>();

  copies.set(source, copy);
  source.forEach((entry: unknown) => {
    copy.add(copyCellData(entry, copies));
  });

  return copy;
}

/**
 * Copies a settings value for a snapshot: arrays and object literals are copied level by level, a date is
 * copied by its time value, and everything else is kept by reference. A class instance such as a
 * HyperFormula engine is not copied: its object graph has cycles, and copying it never ended. A kept
 * reference still compares equal to itself. A date is copied because the host can edit it in place
 * (`setFullYear()`) and send it again, and a kept reference would compare the edited date with itself.
 *
 * `copies` maps every array and object literal already copied to its copy, so a value that refers to itself
 * is copied with the same shape instead of recursing until the stack overflows, and a sub-object two keys
 * share is copied once. The keys `__proto__`, `constructor` and `prototype` are left out, as `deepClone()`
 * leaves them out: an own `__proto__` key (a literal parsed from JSON) would set the copy's prototype.
 *
 * @param {*} value The value to copy.
 * @param {WeakMap} [copies] The copies made so far in this call.
 * @returns {*} The copy, or `value` itself when it is kept by reference.
 */
export function copySettingsValue(value: unknown, copies = new WeakMap<object, unknown>()): unknown {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (!Array.isArray(value) && !isObjectLiteral(value)) {
    return value;
  }

  const source = value as object;

  if (copies.has(source)) {
    return copies.get(source);
  }

  if (Array.isArray(source)) {
    const copy: unknown[] = [];

    copies.set(source, copy);
    source.forEach((entry: unknown) => {
      copy.push(copySettingsValue(entry, copies));
    });

    return copy;
  }

  const copy: Record<string, unknown> = {};

  copies.set(source, copy);
  Object.entries(source).forEach(([key, entry]) => {
    if (!UNCOPIED_KEYS.has(key)) {
      copy[key] = copySettingsValue(entry, copies);
    }
  });

  return copy;
}
