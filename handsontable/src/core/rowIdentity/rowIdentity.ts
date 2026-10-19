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
 * The ids a removal is about to remove, with the physical rows they were read from.
 */
interface PendingRemoval {
  physicalRows: number[];
  ids: unknown[];
}

/**
 * Tells whether a row ids setting gives the rows ids.
 *
 * @param {*} key The row key or mode.
 * @returns {boolean}
 */
function isActiveKey(key: RowIdSetting): boolean {
  return key === true || isRowIdKey(key);
}

/**
 * Reads the ids of physical rows, leaving out the rows without one.
 *
 * @param {number[]} physicalRows The physical row indexes.
 * @param {Function} readId Reads the id of a physical row.
 * @returns {Array}
 */
function readIds(physicalRows: number[], readId: (physicalRow: number) => unknown): unknown[] {
  const ids: unknown[] = [];

  physicalRows.forEach((physicalRow) => {
    const id = readId(physicalRow);

    if (id !== null) {
      ids.push(id);
    }
  });

  return ids;
}

/**
 * Tells whether two lists hold the same physical rows in the same order.
 *
 * @param {number[]} left The first list.
 * @param {number[]} right The second list.
 * @returns {boolean}
 */
function isSameRowList(left: number[], right: number[]): boolean {
  return Array.isArray(right) && left.length === right.length && left.every((row, at) => row === right[at]);
}

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
 * The generated ids by physical row. `updateSettings()` re-initializes every row index map on a `columns` payload
 * without `data` (which the Vue wrapper sends whenever the columns change), while the rows stay the same records,
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
   * Physical rows by id, built on the first lookup. It stays after a change, because every hit is verified
   * against the row before it is returned, so a lookup between two writes does not read every row again.
   */
  #physicalRowsById: Map<unknown, number> | null = null;

  /**
   * Whether the data may have changed since the lookup cache was built, so a miss must rebuild it.
   */
  #isStale = true;

  /**
   * Whether `loadData()` is replacing the data, so the generated ids start over.
   */
  #isReplacingData = false;

  /**
   * Whether the data hooks that drop the lookup cache are registered (only while a row key is used).
   */
  #listensToData = false;

  /**
   * The row key or mode the ids were last read with, to tell when a settings update changes what an id means.
   */
  #appliedKey: RowIdSetting = undefined;

  /**
   * The ids of the rows a removal is about to remove, read in `beforeRemoveRow` (while the rows still exist) and
   * reported in `afterRemoveRow`. A stack, because a hook of one removal can start another.
   */
  #pendingRemovals: PendingRemoval[] = [];

  /**
   * The ids of every row before a data replacement, read only while something listens to `afterRowIdsRemoved`.
   */
  #idsBeforeDataReplacement: unknown[] | null = null;

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
    hot.addHook('beforeUpdateData', this.#onBeforeDataReplacement);
    hot.addHook('afterUpdateData', this.#onAfterDataReplacement);
    // Last, so it reads the final list of rows (NestedRows adds a parent's descendants to it) and sees a veto as
    // the `false` the earlier listeners hand on.
    hot.addHook('beforeRemoveRow', this.#onBeforeRemoveRow, Number.MAX_SAFE_INTEGER);
    hot.addHook('afterRemoveRow', this.#onAfterRemoveRow);
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
    if (cached === undefined && !this.#isStale) {
      return null;
    }

    this.#physicalRowsById = this.#buildIndex();
    this.#isStale = false;

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

      if (id === null) {
        continue;
      }

      if (index.has(id)) {
        warnOnce(this, 'rowId.duplicate', `Two rows have the same id (${String(id)}). Row ids must be unique: ` +
          'the lookups return the row with the lower physical index.');
      } else {
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
    const previousKey = this.#appliedKey;

    this.#appliedKey = key;

    this.#toggleDataHooks(isRowIdKey(key));

    // NestedRows moves and detaches rows by rewriting the source tree, not by moving indexes, so an id kept in
    // a row index map stays at the position while the record moves away.
    if (generates && this.#hot.getSettings().nestedRows) {
      warnOnce(this, 'rowId.nestedRows', 'Generated row ids (`rowId: true`) do not follow the rows that the ' +
        '`nestedRows` plugin moves or detaches. Store the ids in the data and set `rowId` to their property.');
    }

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

    if (key !== previousKey && isActiveKey(previousKey)) {
      this.#hot.runHooks('afterRowIdsReset');
    }
  };

  /**
   * Reads the ids of the rows a removal is about to remove.
   *
   * @param {number|boolean} index The visual index of the first removed row, or `false` when an earlier listener
   * canceled the removal.
   * @param {number} amount The number of removed rows.
   * @param {number[]} physicalRows The physical indexes of the removed rows.
   */
  #onBeforeRemoveRow = (index: number | boolean, amount: number, physicalRows: number[]): void => {
    if (index === false || !Array.isArray(physicalRows) || !this.#hot.hasHook('afterRowIdsRemoved')) {
      return;
    }

    const readId = this.#createIdReader();

    if (readId) {
      this.#pendingRemovals.push({ physicalRows: physicalRows.slice(), ids: readIds(physicalRows, readId) });
    }
  };

  /**
   * Reports the ids of the rows a removal removed.
   *
   * @param {number} index The visual index of the first removed row.
   * @param {number} amount The number of removed rows.
   * @param {number[]} physicalRows The physical indexes of the removed rows.
   * @param {string} [source] The source of the removal.
   */
  #onAfterRemoveRow = (index: number, amount: number, physicalRows: number[], source?: string): void => {
    let at = this.#pendingRemovals.length - 1;

    while (at >= 0 && !isSameRowList(this.#pendingRemovals[at].physicalRows, physicalRows)) {
      at -= 1;
    }

    if (at < 0) {
      return;
    }

    // The entries above it belong to removals a later listener canceled.
    const [{ ids }] = this.#pendingRemovals.splice(at);

    if (ids.length > 0) {
      this.#hot.runHooks('afterRowIdsRemoved', ids, source);
    }
  };

  /**
   * Reads the ids of every row before `updateData()` (or `loadData()`) replaces the data.
   *
   * @param {Array} data The new data.
   * @param {boolean} firstRun Whether it is the first data load of the grid.
   */
  #onBeforeDataReplacement = (data: unknown, firstRun: boolean): void => {
    this.#idsBeforeDataReplacement = null;

    if (firstRun || !this.#hot.hasHook('afterRowIdsRemoved')) {
      return;
    }

    const readId = this.#createIdReader();

    if (readId) {
      this.#idsBeforeDataReplacement = readIds(this.#allPhysicalRows(), readId);
    }
  };

  /**
   * Reports the ids that no row holds after a data replacement.
   *
   * @param {Array} data The new data.
   * @param {boolean} firstRun Whether it is the first data load of the grid.
   * @param {string} [source] The source of the replacement.
   */
  #onAfterDataReplacement = (data: unknown, firstRun: boolean, source?: string): void => {
    const previousIds = this.#idsBeforeDataReplacement;

    this.#idsBeforeDataReplacement = null;

    if (!previousIds) {
      return;
    }

    const readId = this.#createIdReader();
    const currentIds = new Set(readId ? readIds(this.#allPhysicalRows(), readId) : []);
    const removedIds = previousIds.filter(id => !currentIds.has(id));

    if (removedIds.length > 0) {
      this.#hot.runHooks('afterRowIdsRemoved', removedIds, source);
    }
  };

  /**
   * Returns every physical row index.
   *
   * @returns {number[]}
   */
  #allPhysicalRows(): number[] {
    return Array.from({ length: this.#hot.rowIndexMapper.getNumberOfIndexes() }, (_, physicalRow) => physicalRow);
  }

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
  #onBeforeLoadData = (data: unknown, firstRun: boolean): void => {
    this.#onBeforeDataReplacement(data, firstRun);
    this.#isReplacingData = true;
    // `loadData()` runs synchronously, so a load that throws before `afterLoadData` cannot leave the flag on for
    // a later settings update.
    this.#hot._registerMicrotask(this.#endDataReplacement);
  };

  /**
   * Ends a data replacement, and reports the ids it removed.
   *
   * @param {Array} data The new data.
   * @param {boolean} firstRun Whether it is the first data load of the grid.
   * @param {string} [source] The source of the replacement.
   */
  #onAfterLoadData = (data: unknown, firstRun: boolean, source?: string): void => {
    this.#endDataReplacement();
    this.#onAfterDataReplacement(data, firstRun, source);
  };

  /**
   * Marks the end of a data replacement, so the next re-initialization of the index maps keeps the ids.
   */
  #endDataReplacement = (): void => {
    this.#isReplacingData = false;
  };

  /**
   * Marks the lookup cache stale, so the next lookup that misses or finds another id rebuilds it.
   */
  #invalidate = (): void => {
    this.#isStale = true;
  };
}
