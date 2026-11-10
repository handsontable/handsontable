import type { HotInstance } from './types';
import { PhysicalIndexToValueMap } from '../translations/maps/physicalIndexToValueMap';

/**
 * The options whose array form is followed by an origin map.
 */
export const ROW_SIZE_OPTIONS = ['rowHeights', 'minRowHeights'] as const;

export type RowSizeOption = typeof ROW_SIZE_OPTIONS[number];

/**
 * The origins an option had for one data array, by the array of the option they were declared for.
 */
type KeptOrigins = Map<RowSizeOption, Map<unknown[], unknown[]>>;

/**
 * Stops an observer of an origin map.
 */
type DisposeObserver = () => void;

/**
 * Returns the entry index after the highest one in use, which the next row appended after the last one takes,
 * so a row added at the end gets the next height listed. No row still in use shares its entry, but the entry of a
 * removed last row is handed out again, as in 18.1.
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
 * Tells whether a row the index mapper just inserted comes after every other row on screen. The mapper puts the
 * new indexes into its sequence before the maps take their slots, so the sequence already shows where the row
 * sits. A row appended at the physical end after the rows were moved can sit between others on screen.
 *
 * @param {number[]} sequence The index mapper's sequence of physical indexes, in screen order.
 * @param {number} physicalRow The physical index of the first inserted row.
 * @returns {boolean}
 */
function endsScreenOrder(sequence: number[], physicalRow: number): boolean {
  const position = sequence.indexOf(physicalRow);

  for (let index = position + 1; index < sequence.length; index += 1) {
    // Only the other inserted rows, which take the indexes after the first one, may follow it.
    if (sequence[index]! < physicalRow) {
      return false;
    }
  }

  return true;
}

/**
 * Keeps the `rowHeights` and `minRowHeights` arrays on the rows they were declared for.
 *
 * Each array is read through a physical row index map (one per option, registered only while the option is an
 * array). The map holds, for every physical row, the index of the array entry the row was declared at, or `null`
 * for a row inserted between others after the declaration. The index mapper keeps the map aligned when rows are
 * inserted or removed, and UndoRedo puts it back with the other index maps, so a height stays with its row.
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
   * The name each origin map is registered under, by option. A new array registers a new map under a new name,
   * so UndoRedo, which compares the names, drops the steps recorded with the origins of the previous array.
   */
  #names = new Map<RowSizeOption, string>();
  /**
   * The number of origin maps registered so far, which makes each name unique.
   */
  #registrations = 0;
  /**
   * The disposers of the observers that drop the row height cache when an origin map changes, by option.
   */
  #disposeObservers = new Map<RowSizeOption, DisposeObserver>();
  /**
   * The array each origin map was filled for, by option. A new array replaces the map, the same one keeps it.
   */
  #declared = new Map<RowSizeOption, unknown[]>();
  /**
   * The physical index at which the maps took the slots of the index mapper's last insert, until
   * `alignInsertedRows()` reads it.
   */
  #lastSlot: number | null = null;
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
   * The origins each data array had when the grid loaded another one, by option and by the array they were
   * declared for. A `loadData()` declares every row at its own index again, and the sheets bar loads a sheet's own
   * data array each time the sheet is shown, so its heights come back on the rows they were on.
   */
  #kept = new WeakMap<object, KeptOrigins>();
  /**
   * The origins of an array replaced while the data shown now stays, by option, kept here until the next data
   * load: a sheet switch applies the arriving sheet's settings before it loads its data, so they belong to the
   * departing sheet. A later replacement overwrites them, so an app that builds a new array on each render keeps
   * one copy, not one per array.
   */
  #departing = new Map<RowSizeOption, { declared: unknown[], values: unknown[] }>();
  /**
   * `true` between the start and the end of a data load, whose row changes come from the new data.
   */
  #loading = false;

  /**
   * Follows the settings, which decide whether a map is needed, and the index mapper's inserts.
   *
   * @param {HotInstance} hot The Handsontable instance.
   */
  constructor(hot: HotInstance) {
    this.#hot = hot;

    // Runs before the maps insert their slots, so their length is still the one before the insert.
    hot.rowIndexMapper.addLocalHook('indexesInserted', this.#onIndexesInserted);
    hot.rowIndexMapper.addLocalHook('indexesRemoved', this.#onRowsChanged);

    // Registered before the first data load and after every settings update, never lazily on a lookup: UndoRedo
    // drops its history when the set of index map names changes, and a settings update is where a user expects
    // that, the way enabling a plugin does it.
    hot.addHook('beforeInit', this.#onSettingsChange);
    hot.addHook('afterUpdateSettings', this.#onSettingsChange);
    hot.addHook('beforeLoadData', this.#onBeforeDataLoad);
    hot.addHook('beforeUpdateData', this.#onBeforeDataLoad);
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
   * Moves the slots of the row a hand-built insert just created (the NestedRows plugin) to the physical index the
   * row really took. Such an insert hands the index mapper a position, not always the row's physical index (a
   * position inside the parent, or one past the last row for a child added to the last parent), so the maps take
   * the slots elsewhere. A row that ends the rows takes the next entries, any other row none.
   *
   * @param {number} physicalRow The physical index of the first created row.
   * @param {number} amount The number of created rows.
   */
  alignInsertedRows(physicalRow: number, amount: number): void {
    const slot = this.#lastSlot;

    this.#lastSlot = null;

    if (slot === null || slot === physicalRow || amount <= 0) {
      return;
    }

    this.#maps.forEach((map) => {
      const values = map.getValues();
      const from = Math.min(slot, values.length - amount);
      const rest = values.slice(0, from).concat(values.slice(from + amount));
      const endsRows = physicalRow + amount >= values.length;
      const next = endsRows ? nextUnusedEntry(rest) : 0;
      const block = new Array<number | null>(amount);

      for (let ordinal = 0; ordinal < amount; ordinal += 1) {
        block[ordinal] = endsRows ? next + ordinal : null;
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
   * Records where the maps take the slots of an insert, and which entries a block appended after the last row
   * takes.
   *
   * @param {number[]} insertedIndexes The inserted physical indexes.
   * @param {string} [mode] `end` when the maps take the slots one index after `insertedIndexes`.
   */
  #onIndexesInserted = (insertedIndexes: number[], mode?: 'start' | 'end'): void => {
    this.#onRowsChanged();
    this.#lastSlot = null;
    this.#appendFrom = null;

    // Without a map nothing reads the slot, and the screen order check walks every row.
    if (insertedIndexes.length === 0 || this.#maps.size === 0) {
      return;
    }

    const length = this.#hot.rowIndexMapper.getNumberOfIndexes() - insertedIndexes.length;
    // An `'end'` insert takes its slots one index after `insertedIndexes`; past the last row, that is the end.
    const slot = Math.min(insertedIndexes[0]! + (mode === 'end' ? 1 : 0), length);
    // Only a block appended after the last row on screen takes the next entries.
    const appends = slot >= length && endsScreenOrder(this.#hot.rowIndexMapper.getIndexesSequence(), slot);

    this.#lastSlot = slot;
    this.#appendFrom = new Map();
    this.#maps.forEach((map, option) => {
      if (appends) {
        this.#appendFrom!.set(option, nextUnusedEntry(map.getValues()));
      }
    });
  };

  /**
   * Drops the origins kept for the data shown now when its rows change outside a data load: they describe the
   * rows as they were.
   */
  #onRowsChanged = (): void => {
    if (!this.#loading && typeof this.#data === 'object' && this.#data !== null) {
      this.#kept.delete(this.#data);
      this.#departing.clear();
    }
  };

  /**
   * Keeps the origins of the data array the grid is about to leave.
   */
  #onBeforeDataLoad = (): void => {
    this.#loading = true;
    this.#departing.forEach(({ declared, values }, option) => this.#keep(option, declared, values));
    this.#departing.clear();
    this.#keepAll();
  };

  /**
   * Registers, replaces, or unregisters each origin map so it follows the current value of its option.
   */
  #onSettingsChange = (): void => {
    const settings = this.#hot.getSettings() as Record<string, unknown>;

    ROW_SIZE_OPTIONS.forEach((option) => {
      const value = settings[option];

      if (Array.isArray(value)) {
        this.#follow(option, value);
      } else {
        this.#unfollow(option);
      }
    });
  };

  /**
   * Keeps the origins of every option for the data array shown now.
   */
  #keepAll(): void {
    this.#maps.forEach((map, option) => {
      const declared = this.#declared.get(option);

      if (declared !== undefined) {
        this.#keep(option, declared, map.getValues().slice());
      }
    });
  }

  /**
   * Follows the data array a load passed, and puts back the origins it had for the arrays the options hold now,
   * once: everything kept for that data is dropped then, since its rows now live in the maps.
   *
   * @param {Array} data The loaded data.
   */
  #onDataLoaded = (data: unknown): void => {
    this.#loading = false;
    this.#data = data;
    this.#maps.forEach((_, option) => this.#restore(option));

    if (typeof data === 'object' && data !== null) {
      this.#kept.delete(data);
    }
  };

  /**
   * Keeps the origins of one option for the current data array, under the array of the option they were declared
   * for, so origins kept for another array never replace them.
   *
   * @param {string} option The option.
   * @param {Array} declared The array of the option the origins were declared for.
   * @param {Array} values The origins.
   */
  #keep(option: RowSizeOption, declared: unknown[], values: unknown[]): void {
    const data = this.#data;

    if (typeof data !== 'object' || data === null) {
      return;
    }

    let kept = this.#kept.get(data);

    if (kept === undefined) {
      kept = new Map();
      this.#kept.set(data, kept);
    }

    let byDeclared = kept.get(option);

    if (byDeclared === undefined) {
      byDeclared = new Map();
      kept.set(option, byDeclared);
    }

    byDeclared.set(declared, values);
  }

  /**
   * Puts back the origins of one option kept for the current data array and the array the option holds now, when
   * the data still has as many rows.
   *
   * @param {string} option The option.
   */
  #restore(option: RowSizeOption): void {
    const map = this.#maps.get(option);
    const declared = this.#declared.get(option);
    const data = this.#data;
    const byDeclared = typeof data === 'object' && data !== null ? this.#kept.get(data)?.get(option) : undefined;

    if (map === undefined || declared === undefined || byDeclared === undefined) {
      return;
    }

    const values = byDeclared.get(declared);

    if (values !== undefined && values.length === map.getLength()) {
      map.setValues(values);
    }
  }

  /**
   * Starts following an array, or replaces the origin map when a new array replaced the previous one.
   *
   * @param {string} option The option.
   * @param {Array} value The array.
   */
  #follow(option: RowSizeOption, value: unknown[]): void {
    const declared = this.#declared.get(option);

    if (declared === value) {
      return;
    }

    if (declared !== undefined) {
      // The origins of the previous array wait in `#departing` for the next data load (a sheet switch applies the
      // arriving sheet's settings before it loads its data), and a new map declares every row at its own index for the new
      // array, under a new name.
      this.#unfollow(option);
    }

    // A load declares every row at its own index (called with the index alone); an inserted row takes the next
    // unused entry when it is appended after the last row (called with the ordinal too), and none otherwise.
    const map = new PhysicalIndexToValueMap((index: number, ordinal?: number) => {
      if (ordinal === undefined) {
        return index;
      }

      const from = this.#appendFrom?.get(option);

      return from === undefined ? null : from + ordinal;
    });
    const name = `${option}.declaredIndex.${this.#registrations}`;

    this.#registrations += 1;
    this.#maps.set(option, map);
    this.#names.set(option, name);
    this.#declared.set(option, value);
    this.#hot.rowIndexMapper.registerMap(name, map);
    // A NestedRows drag or detach moves an entry to another row while the row count and the index order stay
    // the same, which the row height cache does not notice on its own.
    this.#disposeObservers.set(option, this.#hot.rowIndexMapper.observeMapChange(map, () => {
      this.#hot.view?.invalidateRowHeightCache();
    }));
  }

  /**
   * Stops following an option that is no longer an array, or whose array was replaced.
   *
   * @param {string} option The option.
   */
  #unfollow(option: RowSizeOption): void {
    const name = this.#names.get(option);

    if (name === undefined) {
      return;
    }

    const map = this.#maps.get(option);
    const declared = this.#declared.get(option);

    if (map !== undefined && declared !== undefined) {
      this.#departing.set(option, { declared, values: map.getValues().slice() });
    }

    this.#disposeObservers.get(option)?.();
    this.#hot.rowIndexMapper.unregisterMap(name);
    this.#maps.delete(option);
    this.#names.delete(option);
    this.#disposeObservers.delete(option);
    this.#declared.delete(option);
  }
}
