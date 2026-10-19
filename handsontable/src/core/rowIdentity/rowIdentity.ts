import { warnOnce } from '../../helpers/console';
import { getRowIdFromRowData } from '../../utils/rowId';
import type { RowIdKey } from '../../utils/rowId';
import type { HotInstance } from '../types';
import { PhysicalIndexToValueMap } from '../../translations/maps/physicalIndexToValueMap';

/**
 * The value of the `rowId` option: a row key, `true` for generated ids, or `false`/`undefined` for no row ids.
 */
export type RowIdSetting = RowIdKey | boolean | undefined | null;

/**
 * The name of the row index map that holds the generated ids.
 */
export const GENERATED_ROW_IDS_MAP_NAME = 'rowId';

/**
 * The hooks after which the data may hold other row ids, so the lookup cache must be rebuilt.
 */
const DATA_HOOKS = [
  'afterChange',
  'afterSetSourceDataAtCell',
  'afterCreateRow',
  'afterRemoveRow',
  'afterLoadData',
  'afterUpdateData',
] as const;

/**
 * Tells whether a value is a row key: a property path or a function.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isRowIdKey(value: unknown): value is RowIdKey {
  return typeof value === 'string' || typeof value === 'function';
}

/**
 * The generated ids by physical row. `updateSettings()` re-initializes every row index map when `columns`
 * change (and the framework wrappers re-send `columns` on every render), while the rows stay the same records,
 * so a re-initialization keeps the ids, unless it comes from a data replacement or changes the row count.
 */
class GeneratedRowIdsMap extends PhysicalIndexToValueMap {
  /**
   * Tells whether the next re-initialization belongs to a data replacement.
   */
  #isReplacingData: () => boolean;

  /**
   * Creates the map with the function that generates an id per new row.
   */
  constructor(generateId: () => number, isReplacingData: () => boolean) {
    super(generateId);
    this.#isReplacingData = isReplacingData;
  }

  /**
   * Initializes the map, keeping the ids when only the index maps start over.
   *
   * @param {number} length The number of rows.
   * @returns {GeneratedRowIdsMap}
   */
  init(length: number) {
    if (length > 0 && length === this.getLength() && !this.#isReplacingData()) {
      this.runLocalHooks('init');

      return this;
    }

    return super.init(length);
  }
}

/**
 * Gives every row an id that stays with the record across sorting, filtering, moving, trimming, inserting,
 * removing, and undo/redo, and finds a row by its id.
 *
 * The id comes from the row data through a row key (the `rowId` option, or `dataProvider.rowId`, which wins), or
 * from a counter (`rowId: true`). Generated ids live in a row index map, so the index mapper keeps them with
 * their physical rows on inserts and removals, and UndoRedo's index map snapshot puts them back. The map is
 * registered only while `rowId: true` is set: registered for every grid, it would cost every grid a
 * full-length map and every structural undo step a copy of it.
 */
export class RowIdentity {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;

  /**
   * Reads a source row by its physical index, the row object itself rather than a copy.
   */
  #readSourceRow: (physicalRow: number) => unknown;

  /**
   * The generated ids by physical row, registered only while `rowId: true` is set.
   */
  #generatedIds: PhysicalIndexToValueMap | null = null;

  /**
   * The next generated id. Ids are never reused, so an id that undo brings back cannot collide.
   */
  #nextGeneratedId = 1;

  /**
   * Physical rows by id, built on the first lookup after a change. `null` means it must be rebuilt.
   */
  #physicalRowsById: Map<unknown, number> | null = null;

  /**
   * Whether `loadData()` is replacing the data, so the generated ids start over.
   */
  #isReplacingData = false;

  /**
   * Whether the data hooks that drop the lookup cache are registered (only while a row key is used).
   */
  #listensToData = false;

  /**
   * Follows the settings, which decide how rows get their ids.
   */
  constructor(hot: HotInstance, readSourceRow: (physicalRow: number) => unknown) {
    this.#hot = hot;
    this.#readSourceRow = readSourceRow;

    hot.addHook('beforeInit', this.#onSettingsChange);
    hot.addHook('afterUpdateSettings', this.#onSettingsChange);
    hot.addHook('beforeLoadData', this.#onBeforeLoadData);
    hot.addHook('afterLoadData', this.#onAfterLoadData);
  }

  /**
   * Returns the id of a physical row.
   *
   * @param {number} physicalRow The physical row index.
   * @returns {*} The id, or `null` when the row has none.
   */
  getRowIdAtPhysicalRow(physicalRow: number): unknown {
    if (!Number.isInteger(physicalRow) || physicalRow < 0) {
      return null;
    }

    if (this.#generatedIds) {
      return this.#generatedIds.getValueAtIndex(physicalRow) ?? null;
    }

    const key = this.#readKey();

    if (!isRowIdKey(key) || physicalRow >= this.#hot.rowIndexMapper.getNumberOfIndexes()) {
      return null;
    }

    return this.#readKeyedId(physicalRow, key);
  }

  /**
   * Returns the physical row that holds an id.
   *
   * @param {*} id The row id.
   * @returns {number|null} The physical row index, or `null` when no row holds the id.
   */
  getPhysicalRowById(id: unknown): number | null {
    if (id === null || id === undefined) {
      return null;
    }

    const cached = this.#physicalRowsById?.get(id);

    if (cached !== undefined && this.getRowIdAtPhysicalRow(cached) === id) {
      return cached;
    }

    // A clean cache without the id answers at once, so asking for a removed row repeatedly stays cheap.
    if (cached === undefined && this.#physicalRowsById !== null) {
      return null;
    }

    this.#physicalRowsById = this.#buildIndex();

    return this.#physicalRowsById.get(id) ?? null;
  }

  /**
   * Reads the row key that applies: `dataProvider.rowId` when it is set, the `rowId` option otherwise.
   *
   * @returns {string|Function|boolean|undefined|null}
   */
  #readKey(): RowIdSetting {
    const settings = this.#hot.getSettings();
    const dataProviderKey = settings.dataProvider?.rowId;

    if (isRowIdKey(dataProviderKey)) {
      const ownKey = settings.rowId;

      if (ownKey !== undefined && ownKey !== null && ownKey !== false && ownKey !== dataProviderKey) {
        warnOnce(this, 'rowId.dataProvider', 'The `rowId` option is ignored, because `dataProvider.rowId` ' +
          'is set. Handsontable reads row ids with `dataProvider.rowId`.');
      }

      return dataProviderKey;
    }

    return settings.rowId;
  }

  /**
   * Reads the id of a physical row with a row key.
   *
   * @param {number} physicalRow The physical row index.
   * @param {string|Function} key The row key.
   * @returns {*} The id, or `null` when the row has none.
   */
  #readKeyedId(physicalRow: number, key: RowIdKey): unknown {
    return getRowIdFromRowData(this.#readSourceRow(physicalRow), key) ?? null;
  }

  /**
   * Returns a function that reads the id of a physical row, with the settings read once, or `null` when no row
   * ids are configured.
   *
   * @returns {Function|null}
   */
  #createIdReader(): ((physicalRow: number) => unknown) | null {
    const generatedIds = this.#generatedIds;

    if (generatedIds) {
      return physicalRow => generatedIds.getValueAtIndex(physicalRow) ?? null;
    }

    const key = this.#readKey();

    return isRowIdKey(key) ? physicalRow => this.#readKeyedId(physicalRow, key) : null;
  }

  /**
   * Builds the physical rows by id, the first row winning when two rows share an id.
   *
   * @returns {Map}
   */
  #buildIndex(): Map<unknown, number> {
    const index = new Map<unknown, number>();
    const rowsCount = this.#hot.rowIndexMapper.getNumberOfIndexes();
    const readId = this.#createIdReader();

    if (!readId) {
      return index;
    }

    for (let physicalRow = 0; physicalRow < rowsCount; physicalRow += 1) {
      const id = readId(physicalRow);

      if (id !== null && !index.has(id)) {
        index.set(id, physicalRow);
      }
    }

    return index;
  }

  /**
   * Registers the generated ids map when `rowId: true` turns on, and unregisters it when it turns off. It runs
   * before the first data load and after every settings update, never lazily on a lookup: UndoRedo drops its
   * whole history when the set of index map names changes, so a lookup would drop it at a moment the user cannot
   * foresee, while a settings update that turns the option on drops it the way enabling a plugin does.
   */
  #onSettingsChange = (): void => {
    const key = this.#readKey();
    const generates = key === true;
    const rowIndexMapper = this.#hot.rowIndexMapper;

    this.#toggleDataHooks(isRowIdKey(key));

    if (generates && !this.#generatedIds) {
      this.#generatedIds = rowIndexMapper.registerMap(
        GENERATED_ROW_IDS_MAP_NAME,
        new GeneratedRowIdsMap(this.#generateId, () => this.#isReplacingData),
      );
      this.#generatedIds.addLocalHook('change', this.#invalidate);

    } else if (!generates && this.#generatedIds) {
      rowIndexMapper.unregisterMap(GENERATED_ROW_IDS_MAP_NAME);
      this.#generatedIds = null;
    }

    this.#invalidate();
  };

  /**
   * Registers or removes the hooks that drop the lookup cache when the data may hold other ids. Only a row key
   * needs them: generated ids change only through their map, which reports its own changes. They are not
   * registered without a row key, because `setSourceDataAtCell()` skips building its hook payload while
   * nothing listens to `afterSetSourceDataAtCell`.
   *
   * @param {boolean} listen Whether the hooks are needed.
   */
  #toggleDataHooks(listen: boolean): void {
    if (listen === this.#listensToData) {
      return;
    }

    DATA_HOOKS.forEach((hookName) => {
      if (listen) {
        // Ahead of the other listeners of the instance, so one of them that looks up an id it just wrote finds it.
        this.#hot.addHook(hookName, this.#invalidate, Number.MIN_SAFE_INTEGER);
      } else {
        this.#hot.removeHook(hookName, this.#invalidate);
      }
    });
    this.#listensToData = listen;
  }

  /**
   * Returns a new generated id.
   *
   * @returns {number}
   */
  #generateId = (): number => {
    const id = this.#nextGeneratedId;

    this.#nextGeneratedId += 1;

    return id;
  };

  /**
   * Marks the start of a data replacement, after which the generated ids start over.
   */
  #onBeforeLoadData = (): void => {
    this.#isReplacingData = true;
    // `loadData()` runs synchronously, so a load that throws before `afterLoadData` cannot leave the flag on for
    // a later settings update.
    this.#hot._registerMicrotask(this.#onAfterLoadData);
  };

  /**
   * Marks the end of a data replacement.
   */
  #onAfterLoadData = (): void => {
    this.#isReplacingData = false;
  };

  /**
   * Drops the lookup cache, so the next lookup rebuilds it.
   */
  #invalidate = (): void => {
    this.#physicalRowsById = null;
  };
}
