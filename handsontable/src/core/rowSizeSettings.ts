import type { HotInstance } from './types';
import { PhysicalIndexToValueMap } from '../translations/maps/physicalIndexToValueMap';

/**
 * The options whose array form is followed by an origin map.
 */
export const ROW_SIZE_OPTIONS = ['rowHeights', 'minRowHeights'] as const;

export type RowSizeOption = typeof ROW_SIZE_OPTIONS[number];

/**
 * Builds the name an origin map is registered under in the row index mapper.
 *
 * @param {string} option The option the map follows.
 * @returns {string}
 */
function toMapName(option: RowSizeOption): string {
  return `${option}.declaredIndex`;
}

/**
 * Returns the entry index after the highest one in use, which the next row appended after the last one takes,
 * so a row added at the end gets the next height listed, and an entry is never handed out twice.
 *
 * @param {Array} values The entry index of each physical row (`null` for a row with none).
 * @returns {number}
 */
function nextUnusedEntry(values: unknown[]): number {
  let next = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (typeof value === 'number' && value >= next) {
      next = value + 1;
    }
  }

  return next;
}

/**
 * Keeps the `rowHeights` and `minRowHeights` arrays on the rows they were declared for.
 *
 * Each array is read through a physical row index map (one per option, registered only while the option is an
 * array). The map holds, for every physical row, the index of the array entry the row was declared at, or `null`
 * for a row created after the declaration. The index mapper keeps the map aligned when rows are inserted or
 * removed (through `alter()`, a data load, or the NestedRows plugin's own inserts), and UndoRedo puts it back
 * with the other index maps, so a height stays with its row.
 *
 * The arrays themselves are never changed: `getSettings()` keeps returning the value the user passed, so
 * `updateSettings()` re-declares it and the framework wrappers, which compare their props with that value, see
 * no difference after a row change. An entry the user changes in place still applies to the row it belongs to.
 */
export class RowSizeSettings {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * The registered origin maps, by option.
   */
  #maps = new Map<RowSizeOption, PhysicalIndexToValueMap>();
  /**
   * The array each origin map was filled for, by option. A new array resets the map, the same one keeps it.
   */
  #declared = new Map<RowSizeOption, unknown[]>();
  /**
   * The physical index the row index mapper inserted its last block at, until `alignInsertedRows()` reads it.
   */
  #lastInsertedAt: number | null = null;
  /**
   * For an insert in progress at the end of the rows, the first entry index each map hands out, by option;
   * `null` for an insert anywhere else.
   */
  #appendFrom: Map<RowSizeOption, number> | null = null;
  /**
   * The data array the grid works on, as the last data load passed it.
   */
  #data: unknown = null;
  /**
   * The origins each data array had when the grid loaded another one, by option, with the array they were
   * declared for. The sheets bar reloads a sheet's own data array when the sheet is shown again, so its heights
   * come back on the rows they were on.
   */
  #kept = new WeakMap<object, Map<RowSizeOption, { declared: unknown[]; values: unknown[] }>>();

  /**
   * Follows the settings, which decide whether a map is needed, and the index mapper's inserts.
   *
   * @param {HotInstance} hot The Handsontable instance.
   */
  constructor(hot: HotInstance) {
    this.#hot = hot;

    // Runs before the maps insert their slots, so their length is still the one before the insert.
    hot.rowIndexMapper.addLocalHook('indexesInserted', (insertedIndexes: number[]) => {
      this.#lastInsertedAt = insertedIndexes.length > 0 ? insertedIndexes[0]! : null;
      this.#appendFrom = null;

      if (this.#lastInsertedAt !== null) {
        this.#appendFrom = new Map();
        this.#maps.forEach((map, option) => {
          // Only a block appended after the last row takes the next entries.
          if (this.#lastInsertedAt! >= map.getLength()) {
            this.#appendFrom!.set(option, nextUnusedEntry(map.getValues()));
          }
        });
      }
    });

    // Registered before the first data load and after every settings update, never lazily on a lookup: UndoRedo
    // drops its history when the set of index map names changes, and a settings update is where a user expects
    // that, the way enabling a plugin does it.
    hot.addHook('beforeInit', this.#onSettingsChange);
    hot.addHook('afterUpdateSettings', this.#onSettingsChange);
    hot.addHook('beforeLoadData', this.#keepAll);
    hot.addHook('beforeUpdateData', this.#keepAll);
    hot.addHook('afterLoadData', this.#onDataLoaded);
    hot.addHook('afterUpdateData', this.#onDataLoaded);
  }

  /**
   * Returns the index of the array entry a physical row was declared at.
   *
   * @param {string} option The option to read.
   * @param {number} physicalRow The physical row index.
   * @returns {number|null} The entry index, or `null` when the row has no entry (created after the declaration).
   * Without an origin map (the option is not an array) the physical index is returned unchanged.
   */
  getDeclaredIndex(option: RowSizeOption, physicalRow: number): number | null {
    const map = this.#maps.get(option);

    if (map === undefined) {
      return physicalRow;
    }

    const declaredIndex = map.getValueAtIndex(physicalRow);

    return typeof declaredIndex === 'number' ? declaredIndex : null;
  }

  /**
   * Moves the slots of the rows `alter()` just created to the physical index the rows really took. A row
   * inserted below another is spliced into the data one index further than the index mapper inserts it,
   * so without this the row above would lose its height to the new row (the index mapper's maps share
   * that defect, the ManualRowResize heights among them).
   *
   * @param {number} physicalRow The physical index of the first created row.
   * @param {number} amount The number of created rows.
   */
  alignInsertedRows(physicalRow: number, amount: number): void {
    const insertedAt = this.#lastInsertedAt;

    this.#lastInsertedAt = null;

    if (insertedAt === null || insertedAt === physicalRow || amount <= 0) {
      return;
    }

    this.#maps.forEach((map) => {
      const values = map.getValues();
      const rest = values.slice(0, insertedAt).concat(values.slice(insertedAt + amount));
      let block = values.slice(insertedAt, insertedAt + amount);

      // A row inserted below the last one is an append too, so it takes the next entries.
      if (physicalRow + amount >= values.length) {
        const from = nextUnusedEntry(rest);

        block = block.map((_, ordinal) => from + ordinal);
      }

      // `concat`, not a spread: an insert can create many rows at once.
      map.setValues(rest.slice(0, physicalRow).concat(block, rest.slice(physicalRow)));
    });
  }

  /**
   * Returns a copy of every origin map's values, for a caller that moves rows by rewriting the data rather than
   * through the index mapper (the NestedRows plugin), or `null` when no map is registered.
   *
   * @returns {Map<string, Array>|null}
   */
  readOrigins(): Map<RowSizeOption, unknown[]> | null {
    if (this.#maps.size === 0) {
      return null;
    }

    const origins = new Map<RowSizeOption, unknown[]>();

    this.#maps.forEach((map, option) => origins.set(option, map.getValues().slice()));

    return origins;
  }

  /**
   * Writes origin values back, as `readOrigins()` returned them after the caller rearranged them.
   *
   * @param {Map<string, Array>} origins The values, by option.
   */
  writeOrigins(origins: Map<RowSizeOption, unknown[]>): void {
    origins.forEach((values, option) => {
      this.#maps.get(option)?.setValues(values);
    });
  }

  /**
   * Registers, resets, or unregisters each origin map so it follows the current value of its option.
   */
  #onSettingsChange = (): void => {
    const settings = this.#hot.getSettings() as Record<string, unknown>;

    ROW_SIZE_OPTIONS.forEach((option) => {
      const value = settings[option];

      if (Array.isArray(value)) {
        this.#follow(option, value);
        this.#restore(option);
      } else {
        this.#unfollow(option);
      }
    });
  };

  /**
   * Keeps the origins of the data array the grid is about to leave. A load declares every row at its own
   * index again.
   */
  #keepAll = (): void => {
    this.#maps.forEach((_, option) => this.#keep(option));
  };

  /**
   * Keeps the origins of one option for the current data array.
   *
   * @param {string} option The option.
   */
  #keep(option: RowSizeOption): void {
    const map = this.#maps.get(option);
    const declared = this.#declared.get(option);
    const data = this.#data;

    if (map === undefined || declared === undefined || typeof data !== 'object' || data === null) {
      return;
    }

    let kept = this.#kept.get(data);

    if (kept === undefined) {
      kept = new Map();
      this.#kept.set(data, kept);
    }

    kept.set(option, { declared, values: map.getValues().slice() });
  }

  /**
   * Follows the data array a load passed, and puts back the origins it had when it was last shown.
   *
   * @param {Array} data The loaded data.
   */
  #onDataLoaded = (data: unknown): void => {
    this.#data = data;
    this.#maps.forEach((_, option) => this.#restore(option));
  };

  /**
   * Puts back the origins of one option kept for the current data array, when they were kept for the array the
   * option holds now and the data still has as many rows.
   *
   * @param {string} option The option.
   */
  #restore(option: RowSizeOption): void {
    const map = this.#maps.get(option);
    const data = this.#data;
    const kept = typeof data === 'object' && data !== null ? this.#kept.get(data)?.get(option) : undefined;

    if (map === undefined || kept === undefined || kept.declared !== this.#declared.get(option)) {
      return;
    }

    if (kept.values.length === map.getLength()) {
      map.setValues(kept.values);
    }
  }

  /**
   * Starts following an array, or resets the origin map when a new array replaced the previous one.
   *
   * @param {string} option The option.
   * @param {Array} value The array.
   */
  #follow(option: RowSizeOption, value: unknown[]): void {
    const map = this.#maps.get(option);

    if (map === undefined) {
      // A load declares every row at its own index (called with the index alone); an inserted row takes the next
      // unused entry when it is appended after the last row (called with the ordinal too), and none otherwise.
      const created = new PhysicalIndexToValueMap((index: number, ordinal?: number) => {
        if (ordinal === undefined) {
          return index;
        }

        const from = this.#appendFrom?.get(option);

        return from === undefined ? null : from + ordinal;
      });

      this.#maps.set(option, created);
      this.#declared.set(option, value);
      this.#hot.rowIndexMapper.registerMap(toMapName(option), created);

      return;
    }

    if (this.#declared.get(option) !== value) {
      this.#declared.set(option, value);
      this.#resetOrigins(map);
    }
  }

  /**
   * Stops following an option that is no longer an array.
   *
   * @param {string} option The option.
   */
  #unfollow(option: RowSizeOption): void {
    if (!this.#maps.has(option)) {
      return;
    }

    this.#keep(option);
    this.#hot.rowIndexMapper.unregisterMap(toMapName(option));
    this.#maps.delete(option);
    this.#declared.delete(option);
  }

  /**
   * Declares every row at its own physical index, as a load does.
   *
   * @param {PhysicalIndexToValueMap} map The origin map.
   */
  #resetOrigins(map: PhysicalIndexToValueMap): void {
    const length = map.getLength();
    const values = new Array<number>(length);

    for (let index = 0; index < length; index += 1) {
      values[index] = index;
    }

    map.setValues(values);
  }
}
