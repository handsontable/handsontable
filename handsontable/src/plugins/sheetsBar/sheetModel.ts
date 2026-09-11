import { deepClone, isPlainObject } from '../../helpers/object';

/**
 * A single sheet held by the SheetsBar plugin.
 */
export interface Sheet {
  id: number;
  name: string;
  data: unknown[][];
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
 * The shared grapheme segmenter, built on first use. The constructor is one of the pricier
 * `Intl` ones, the instance keeps no state between calls, and name clamping runs on every
 * rename-input keystroke and once per candidate in the unique-name loop.
 */
let segmenter: Intl.Segmenter | null = null;

/**
 * Splits a string into the characters a reader sees — grapheme clusters, so a flag or a
 * family emoji or a letter with a combining mark is one character, not two or seven.
 *
 * @param {string} text The text to split.
 * @returns {string[]} The characters.
 */
function toCharacters(text: string): string[] {
  segmenter ??= new Intl.Segmenter();

  return Array.from(segmenter.segment(text), segment => segment.segment);
}

/**
 * Cuts a name to the length limit without trimming it, for a value still being typed.
 *
 * @param {string} name The name as typed.
 * @param {number} [limit] The longest the result may be.
 * @returns {string} The name, no longer than the limit.
 */
export function truncateSheetName(name: string, limit: number = MAX_SHEET_NAME_LENGTH): string {
  const characters = toCharacters(name);

  return characters.length <= limit ? name : characters.slice(0, limit).join('');
}

/**
 * Trims a name and cuts it to the length limit.
 *
 * @param {string} name The requested name.
 * @param {number} [limit] The longest the result may be.
 * @returns {string} The name as it may be stored.
 */
export function clampSheetName(name: string, limit: number = MAX_SHEET_NAME_LENGTH): string {
  return truncateSheetName(name.trim(), limit).trim();
}

/**
 * Compares two names the way a reader does: the same letters spell the same name whether a
 * composed or a decomposed form arrived.
 *
 * @param {string} a One name.
 * @param {string} b The other.
 * @returns {boolean} `true` when the two read the same.
 */
function isSameName(a: string, b: string): boolean {
  return a.normalize('NFC') === b.normalize('NFC');
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
   * Monotonic id counter.
   */
  #nextId = 1;
  /**
   * Supplies the word a generated `{word}{n}` name starts from, in the grid's language.
   */
  readonly #defaultName: () => string;

  /**
   * Creates an empty model.
   *
   * @param {Function} [defaultName] Supplies the word generated sheet names start from.
   */
  constructor(defaultName: () => string = () => 'Sheet') {
    this.#defaultName = defaultName;
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
   * Resolves a sheet id from an id or a unique name. Returns `null` when not found.
   */
  resolveId(idOrName: number | string): number | null {
    if (typeof idOrName === 'number') {
      return this.#sheets.has(idOrName) ? idOrName : null;
    }

    for (const sheet of this.#sheets.values()) {
      if (isSameName(sheet.name, idOrName)) {
        return sheet.id;
      }
    }

    return null;
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
    data: unknown[][] = createEmptySheetData(),
    settings?: Record<string, unknown>,
  ): Sheet {
    const id = this.#nextId;

    this.#nextId += 1;

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

    if (!sheet || trimmed === '' || (this.resolveId(trimmed) !== null && this.resolveId(trimmed) !== id)) {
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
   * Moves a sheet to the given tab index. Returns `false` for unknown ids or
   * out-of-range indexes.
   */
  moveSheet(id: number, index: number): boolean {
    const from = this.#order.indexOf(id);

    if (from === -1 || index < 0 || index >= this.#order.length) {
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

    // The `formulas` setting stays out of the deep clone: it can carry a live engine instance,
    // which the clone would walk without end and whose copy would be a broken object anyway.
    // The copy shares the original's `formulas` values through a shallow copy instead.
    const { formulas, ...cloneable } = source.settings ?? {};
    let settings = source.settings ? deepClone(cloneable) as Record<string, unknown> : undefined;

    if (settings && formulas !== undefined) {
      settings = { ...settings, formulas: isPlainObject(formulas) ? { ...formulas } : formulas };
    }

    const duplicate = this.addSheet(
      this.#uniqueName(`${source.name} (2)`),
      deepClone(source.data) as unknown[][],
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
   * Builds a public descriptor for a sheet.
   */
  #toDescriptor(sheet: Sheet): SheetDescriptor {
    return { id: sheet.id, name: sheet.name, isActive: sheet.id === this.#activeSheetId };
  }

  /**
   * Returns the requested name when free, otherwise the next free variant:
   * defaults count up as `Sheet{n}`, explicit collisions count up as `name (n)`.
   */
  #uniqueName(requested: string | null): string {
    const trimmed = requested === null ? null : clampSheetName(requested);
    // A blank or whitespace-only request has no visible label, so it takes the default
    // numbering instead — the same blank that `renameSheet` rejects must not be creatable
    // through `addSheet`.
    const clamped = trimmed === '' ? null : trimmed;

    if (clamped !== null && this.resolveId(clamped) === null) {
      return clamped;
    }

    const isDefault = clamped === null;
    const base = isDefault ? this.#defaultName() : clamped.replace(/ \(\d+\)$/, '');
    let counter = isDefault ? this.#nextId - 1 : 2;
    let candidate = this.#numberedName(base, counter, isDefault);

    while (this.resolveId(candidate) !== null) {
      counter += 1;
      candidate = this.#numberedName(base, counter, isDefault);
    }

    return candidate;
  }

  /**
   * Builds a numbered variant of a name that still fits the length limit — the counter is what
   * makes the name unique, so the base gives way to it rather than the other way round.
   *
   * @param {string} base The name being varied.
   * @param {number} counter The variant number.
   * @param {boolean} isDefault Whether this is a generated `Sheet{n}` name rather than a
   *   collision with a requested one.
   * @returns {string} The numbered name.
   */
  #numberedName(base: string, counter: number, isDefault: boolean): string {
    const suffix = isDefault ? `${counter}` : ` (${counter})`;

    return `${clampSheetName(base, MAX_SHEET_NAME_LENGTH - suffix.length)}${suffix}`;
  }
}
