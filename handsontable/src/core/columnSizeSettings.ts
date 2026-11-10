import type { HotInstance } from './types';
import { PhysicalIndexToValueMap } from '../translations/maps/physicalIndexToValueMap';

/**
 * The name the origin map is registered under in the column index mapper.
 */
const MAP_NAME = 'colWidths.declaredIndex';

/**
 * Returns the entry index after the highest one in use, which the next column appended after the last one takes,
 * so a column added at the end gets the next width listed, and an entry is never handed out twice.
 *
 * @param {Array} values The entry index of each physical column (`null` for a column with none).
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
 * Keeps the `colWidths` array on the columns it was declared for.
 *
 * The array is read through a physical column index map, registered only while `colWidths` is an array. The map
 * holds, for every physical column, the index of the array entry the column was declared at, or `null` for a
 * column inserted between others after the declaration. The index mapper keeps the map aligned when columns are
 * inserted or removed, and UndoRedo puts it back with the other index maps, so a width stays with its column.
 *
 * The array itself is never changed: `getSettings()` keeps returning the value the user passed, so
 * `updateSettings()` re-declares it and the framework wrappers, which compare their props with that value, see
 * no difference after a column change. An entry the user changes in place still applies to its column.
 */
export class ColumnSizeSettings {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * The registered origin map, or `null` while `colWidths` is not an array.
   */
  #map: PhysicalIndexToValueMap | null = null;
  /**
   * The array the origin map was filled for. A new array resets the map, the same one keeps it.
   */
  #declared: unknown[] | null = null;
  /**
   * For an insert in progress after the last column, the first entry index the map hands out; `null` otherwise.
   */
  #appendFrom: number | null = null;
  /**
   * The data array the grid works on, as the last data load passed it.
   */
  #data: unknown = null;
  /**
   * The origins each data array had when the grid loaded another one, with the array they were declared for.
   * The sheets bar reloads a sheet's own data array when the sheet is shown again, so its widths come back on
   * the columns they were on.
   */
  #kept = new WeakMap<object, { declared: unknown[]; values: unknown[] }>();

  /**
   * Follows the settings, which decide whether the map is needed, and the index mapper's inserts.
   *
   * @param {HotInstance} hot The Handsontable instance.
   */
  constructor(hot: HotInstance) {
    this.#hot = hot;

    // Runs before the maps insert their slots, so the map's length is still the one before the insert.
    hot.columnIndexMapper.addLocalHook('indexesInserted', (insertedIndexes: number[]) => {
      const map = this.#map;

      this.#appendFrom = map !== null && insertedIndexes.length > 0 && insertedIndexes[0]! >= map.getLength() ?
        nextUnusedEntry(map.getValues()) : null;
    });

    // Registered before the first data load and after every settings update, never lazily on a lookup: UndoRedo
    // drops its history when the set of index map names changes, and a settings update is where a user expects
    // that, the way enabling a plugin does it.
    hot.addHook('beforeInit', this.#onSettingsChange);
    hot.addHook('afterUpdateSettings', this.#onSettingsChange);
    hot.addHook('beforeLoadData', this.#keep);
    hot.addHook('beforeUpdateData', this.#keep);
    hot.addHook('afterLoadData', this.#onDataLoaded);
    hot.addHook('afterUpdateData', this.#onDataLoaded);
  }

  /**
   * Returns the index of the array entry a physical column was declared at.
   *
   * @param {number} physicalColumn The physical column index.
   * @returns {number|null} The entry index, or `null` when the column has no entry. Without the origin map
   * (`colWidths` is not an array) the physical index is returned unchanged.
   */
  getDeclaredIndex(physicalColumn: number): number | null {
    if (this.#map === null) {
      return physicalColumn;
    }

    const declaredIndex = this.#map.getValueAtIndex(physicalColumn);

    return typeof declaredIndex === 'number' ? declaredIndex : null;
  }

  /**
   * Gives the columns `alter()` just created after the last one the next entries. The index mapper reports
   * `insert_col_end` on the last column at the index of that column, so the map sees an insert between
   * columns, while the created columns end the grid.
   *
   * @param {number} physicalColumn The physical index of the first created column.
   * @param {number} amount The number of created columns.
   */
  alignInsertedColumns(physicalColumn: number, amount: number): void {
    const map = this.#map;

    if (map === null || amount <= 0) {
      return;
    }

    const values = map.getValues();

    if (physicalColumn + amount < values.length) {
      return;
    }

    const block = values.slice(physicalColumn, physicalColumn + amount);

    if (block.some(value => value !== null)) {
      return;
    }

    const from = nextUnusedEntry(values.slice(0, physicalColumn));

    map.setValues(values.slice(0, physicalColumn).concat(block.map((_, ordinal) => from + ordinal)));
  }

  /**
   * Registers, resets, or unregisters the origin map so it follows the current value of `colWidths`.
   */
  #onSettingsChange = (): void => {
    const value = (this.#hot.getSettings() as Record<string, unknown>).colWidths;

    if (Array.isArray(value)) {
      // Only a map this update created or reset starts from the declared order, so only that one takes the
      // kept origins back. A map the update kept holds the current origins: the kept ones were taken when the
      // data was last left, and putting them back after a later insert and removal gave a removed column's
      // width to another column.
      if (this.#follow(value)) {
        this.#restore();
      }
    } else {
      this.#unfollow();
    }
  };

  /**
   * Keeps the origins of the data array the grid is about to leave. A load declares every column at its own
   * index again.
   */
  #keep = (): void => {
    if (this.#map !== null && this.#declared !== null && typeof this.#data === 'object' && this.#data !== null) {
      this.#kept.set(this.#data, { declared: this.#declared, values: this.#map.getValues().slice() });
    }
  };

  /**
   * Follows the data array a load passed, and puts back the origins it had when it was last shown.
   *
   * @param {Array} data The loaded data.
   */
  #onDataLoaded = (data: unknown): void => {
    this.#data = data;
    this.#restore();
  };

  /**
   * Puts back the origins kept for the current data array, when they were kept for the array `colWidths` holds
   * now and the data still has as many columns.
   */
  #restore(): void {
    const map = this.#map;
    const kept = typeof this.#data === 'object' && this.#data !== null ? this.#kept.get(this.#data) : undefined;

    if (map === null || kept === undefined || kept.declared !== this.#declared) {
      return;
    }

    if (kept.values.length === map.getLength()) {
      map.setValues(kept.values);
    }
  }

  /**
   * Starts following an array, or resets the origin map when a new array replaced the previous one.
   *
   * @param {Array} value The array.
   * @returns {boolean} `true` when the map was created or reset, `false` when it was kept as it is.
   */
  #follow(value: unknown[]): boolean {
    if (this.#map === null) {
      // A load declares every column at its own index (called with the index alone); an inserted column takes
      // the next unused entry when it is appended after the last column (called with the ordinal too), and none
      // otherwise.
      this.#map = new PhysicalIndexToValueMap((index: number, ordinal?: number) => {
        if (ordinal === undefined) {
          return index;
        }

        return this.#appendFrom === null ? null : this.#appendFrom + ordinal;
      });
      this.#declared = value;
      this.#hot.columnIndexMapper.registerMap(MAP_NAME, this.#map);

      return true;
    }

    if (this.#declared !== value) {
      this.#declared = value;
      this.#resetOrigins(this.#map);

      return true;
    }

    return false;
  }

  /**
   * Stops following `colWidths` once it is no longer an array.
   */
  #unfollow(): void {
    if (this.#map === null) {
      return;
    }

    this.#keep();
    this.#hot.columnIndexMapper.unregisterMap(MAP_NAME);
    this.#map = null;
    this.#declared = null;
  }

  /**
   * Declares every column at its own physical index, as a load does.
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
