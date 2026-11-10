import type { HotInstance } from './types';
import { PhysicalIndexToValueMap } from '../translations/maps/physicalIndexToValueMap';

/**
 * The prefix of the name the origin map is registered under in the column index mapper.
 */
const MAP_NAME = 'colWidths.declaredIndex';

/**
 * Stops an observer of the origin map.
 */
type DisposeObserver = () => void;

/**
 * Returns the entry index after the highest one in use, which the next column appended after the last one takes,
 * so a column added at the end gets the next width listed after the columns that have one.
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
 * Tells whether a column the index mapper just inserted comes after every other column on screen. The mapper puts
 * the new indexes into its sequence before the maps take their slots, so the sequence already shows where the
 * column sits. A column appended at the physical end after the columns were moved can sit between others on screen.
 *
 * @param {number[]} sequence The index mapper's sequence of physical indexes, in screen order.
 * @param {number} physicalColumn The physical index of the first inserted column.
 * @returns {boolean}
 */
function endsScreenOrder(sequence: number[], physicalColumn: number): boolean {
  const position = sequence.indexOf(physicalColumn);

  for (let index = position + 1; index < sequence.length; index += 1) {
    // Only the other inserted columns, which take the indexes after the first one, may follow it.
    if (sequence[index]! < physicalColumn) {
      return false;
    }
  }

  return true;
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
   * The name the origin map is registered under. A new array registers a new map under a new name, so UndoRedo,
   * which compares the names, drops the steps recorded with the origins of the previous array.
   */
  #name: string | null = null;
  /**
   * The number of origin maps registered so far, which makes each name unique.
   */
  #registrations = 0;
  /**
   * The disposer of the observer that drops the column width cache when the origin map changes.
   */
  #disposeObserver: DisposeObserver | null = null;
  /**
   * The array the origin map was filled for. A new array replaces the map, the same one keeps it.
   */
  #declared: unknown[] | null = null;
  /**
   * The first entry index the columns of the insert in progress take, when the insert appends after the last
   * column; `null` otherwise. Read by the map's init function, which the index mapper calls once per column.
   */
  #appendFrom: number | null = null;
  /**
   * The data array the grid works on, as the last data load passed it.
   */
  #data: unknown = null;
  /**
   * The origins each data array had when the grid loaded another one, by the array of `colWidths` they were
   * declared for. A `loadData()` declares every column at its own index again, and the sheets bar loads a
   * sheet's own data array each time the sheet is shown, so its widths come back on the columns they were on.
   */
  #kept = new WeakMap<object, Map<unknown[], unknown[]>>();
  /**
   * `true` between the start and the end of a data load, whose column changes come from the new data.
   */
  #loading = false;

  /**
   * Follows the settings, which decide whether the map is needed, and the data loads.
   *
   * @param {HotInstance} hot The Handsontable instance.
   */
  constructor(hot: HotInstance) {
    this.#hot = hot;

    // Registered before the first data load and after every settings update, never lazily on a lookup: UndoRedo
    // drops its history when the set of index map names changes, and a settings update is where a user expects
    // that, the way enabling a plugin does it.
    hot.addHook('beforeInit', this.#onSettingsChange);
    hot.addHook('afterUpdateSettings', this.#onSettingsChange);
    hot.addHook('beforeLoadData', this.#onBeforeDataLoad);
    hot.addHook('beforeUpdateData', this.#onBeforeDataLoad);
    hot.addHook('afterLoadData', this.#onDataLoaded);
    hot.addHook('afterUpdateData', this.#onDataLoaded);
    // Origins kept for the data shown now describe its columns as they were: a column inserted or removed since
    // then, while `colWidths` was not followed, makes them stale.
    hot.columnIndexMapper.addLocalHook('indexesInserted', this.#onColumnsChanged);
    hot.columnIndexMapper.addLocalHook('indexesRemoved', this.#onColumnsChanged);
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
   * Registers, replaces, or unregisters the origin map so it follows the current value of `colWidths`.
   */
  #onSettingsChange = (): void => {
    const value = (this.#hot.getSettings() as Record<string, unknown>).colWidths;

    if (Array.isArray(value)) {
      this.#follow(value);
    } else {
      this.#unfollow();
    }
  };

  /**
   * Keeps the origins of the data array the grid is about to leave.
   */
  #onBeforeDataLoad = (): void => {
    this.#loading = true;
    this.#keep();
  };

  /**
   * Drops the origins kept for the data shown now when its columns change outside a data load.
   */
  #onColumnsChanged = (): void => {
    if (!this.#loading && typeof this.#data === 'object' && this.#data !== null) {
      this.#kept.delete(this.#data);
    }
  };

  /**
   * Keeps the origins of the data array shown now, under the array of `colWidths` they were declared for, so
   * origins kept for another array never replace them.
   */
  #keep(): void {
    const map = this.#map;
    const declared = this.#declared;
    const data = this.#data;

    if (map === null || declared === null || typeof data !== 'object' || data === null) {
      return;
    }

    let byDeclared = this.#kept.get(data);

    if (byDeclared === undefined) {
      byDeclared = new Map();
      this.#kept.set(data, byDeclared);
    }

    byDeclared.set(declared, map.getValues().slice());
  }

  /**
   * Follows the data array a load passed, and puts back, once, the origins it had for the array `colWidths` holds
   * now. A settings update never puts them back: the columns may have changed since they were kept.
   *
   * @param {Array} data The loaded data.
   */
  #onDataLoaded = (data: unknown): void => {
    this.#loading = false;
    this.#data = data;

    const map = this.#map;
    const declared = this.#declared;
    const byDeclared = typeof data === 'object' && data !== null ? this.#kept.get(data) : undefined;

    if (map === null || declared === null || byDeclared === undefined) {
      return;
    }

    const values = byDeclared.get(declared);

    byDeclared.delete(declared);

    if (values !== undefined && values.length === map.getLength()) {
      map.setValues(values);
    }
  };

  /**
   * Starts following an array, or replaces the origin map when a new array replaced the previous one.
   *
   * @param {Array} value The array.
   */
  #follow(value: unknown[]): void {
    if (this.#declared === value) {
      return;
    }

    if (this.#declared !== null) {
      // The origins of the previous array stay kept for the data shown now (a sheet switch applies the arriving
      // sheet's settings before it loads its data), and a new map declares every column at its own index for the
      // new array, under a new name.
      this.#unfollow();
    }

    // A load declares every column at its own index (called with the index alone). An inserted column is called
    // with the index it takes, and its ordinal in the insert: while the map still has its length from before the
    // insert, an index past it that also ends the screen order is an append (`insert_col_end` on the last column
    // included), which takes the next unused entries, and any other insert takes none.
    const map = new PhysicalIndexToValueMap((index: number, ordinal?: number) => {
      if (ordinal === undefined) {
        return index;
      }

      if (ordinal === 0) {
        // An `'end'` insert past the last column is called with one index more than the slot it takes.
        const slot = Math.min(index, map.getLength());
        const appends = index >= map.getLength() &&
          endsScreenOrder(this.#hot.columnIndexMapper.getIndexesSequence(), slot);

        this.#appendFrom = appends ? nextUnusedEntry(map.getValues()) : null;
      }

      return this.#appendFrom === null ? null : this.#appendFrom + ordinal;
    });
    const name = `${MAP_NAME}.${this.#registrations}`;

    this.#registrations += 1;
    this.#map = map;
    this.#name = name;
    this.#declared = value;
    this.#hot.columnIndexMapper.registerMap(name, map);
    // A restore after a data load that keeps the column count changes the widths without changing the count, which
    // the column width cache does not notice on its own.
    this.#disposeObserver = this.#hot.columnIndexMapper.observeMapChange(map, () => {
      this.#hot.view?.invalidateColumnWidthCache();
    });
  }

  /**
   * Stops following `colWidths` once it is no longer an array, or its array was replaced.
   */
  #unfollow(): void {
    if (this.#name === null) {
      return;
    }

    this.#keep();
    this.#disposeObserver?.();
    this.#hot.columnIndexMapper.unregisterMap(this.#name);
    this.#map = null;
    this.#name = null;
    this.#disposeObserver = null;
    this.#declared = null;
  }
}
