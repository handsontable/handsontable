import type { HotInstance } from '../../../core/types';
import { rangeEach } from '../../../helpers/number';
import { deepClone, objectEach, stripFunctionValues } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';
import type { NestedRows } from '../nestedRows';

type ReadTreeResult = number | { result: unknown; end: boolean };

export interface RowObject {
  __children?: RowObject[];
  [key: string]: unknown;
}

interface NodeInfo {
  parent: RowObject | null;
  row: number;
  level: number;
}

interface RemovedRowSnapshot {
  data: RowObject;
  index: number;
  path: number[];
  parentPath: number[] | null;
  parent: RowObject | null;
  physicalRows: number[];
  visualIndex: number | null;
}

interface IndexMapSnapshot {
  name: string;
  values: unknown[];
  orderOfIndexes?: number[];
}

interface RowIndexMapsSnapshot {
  indexesSequence: number[];
  trimmingMaps: IndexMapSnapshot[];
  hidingMaps: IndexMapSnapshot[];
  variousMaps: IndexMapSnapshot[];
}

export interface NestedRowsRemovalSnapshot {
  rows: RemovedRowSnapshot[];
  rowIndexMaps: RowIndexMapsSnapshot;
  collapsedRows: number[];
}

interface CacheStructure {
  levels: RowObject[][];
  levelCount: number;
  rows: RowObject[];
  nodeInfo: WeakMap<object, NodeInfo>;
}

/**
 * Creates a detached copy of a nested row, retaining its complete subtree.
 *
 * @param {RowObject} row The row to clone.
 * @returns {RowObject} The detached row tree.
 */
function cloneRowData(row: RowObject): RowObject {
  const clonedRow = deepClone(row);

  stripFunctionValues(clonedRow);

  return clonedRow;
}

/**
 * Class responsible for making data operations.
 *
 * @private
 */
class DataManager {
  /**
   * Main Handsontable instance reference.
   *
   * @type {object}
   */
  declare hot: HotInstance;
  /**
   * Reference to the source data object.
   *
   * @type {Handsontable.CellValue[][]|Handsontable.RowObject[]}
   */
  data: RowObject[] | null = null;
  /**
   * Reference to the NestedRows plugin.
   *
   * @type {object}
   */
  declare plugin: NestedRows;
  /**
   * Map of row object parents.
   *
   * @type {WeakMap}
   */
  parentReference = new WeakMap<RowObject, RowObject | null>();
  /**
   * Nested structure cache.
   *
   * @type {object}
   */
  cache: CacheStructure = {
    levels: [],
    levelCount: 0,
    rows: [],
    nodeInfo: new WeakMap<object, NodeInfo>()
  };

  /**
   * Initializes the data manager with references to the NestedRows plugin and the Handsontable instance.
   */
  constructor(nestedRowsPlugin: NestedRows, hotInstance: HotInstance) {
    this.hot = hotInstance;
    this.plugin = nestedRowsPlugin;
  }

  /**
   * Set the data for the manager.
   *
   * @param {Handsontable.CellValue[][]|Handsontable.RowObject[]} data Data for the manager.
   */
  setData(data: RowObject[]) {
    this.data = data;
  }

  /**
   * Get the data cached in the manager.
   *
   * @returns {Handsontable.CellValue[][]|Handsontable.RowObject[]}
   */
  getData() {
    return this.data;
  }

  /**
   * Load the "raw" source data, without NestedRows' modifications.
   *
   * @returns {Handsontable.CellValue[][]|Handsontable.RowObject[]}
   */
  getRawSourceData() {
    let rawSourceData = null;

    this.plugin.disableCoreAPIModifiers();
    rawSourceData = this.hot.getSourceData();
    this.plugin.enableCoreAPIModifiers();

    return rawSourceData;
  }

  /**
   * Update the Data Manager with new data and refresh cache.
   *
   * @param {Handsontable.CellValue[][]|Handsontable.RowObject[]} data Data for the manager.
   */
  updateWithData(data: RowObject[]) {
    this.setData(data);
    this.rewriteCache();
  }

  /**
   * Captures the top-level roots represented by a physical removal list, including each root's
   * complete nested subtree and its original parent position.
   *
   * Descendants are omitted when an ancestor is also being removed. The parent object reference
   * lets restoration find a surviving parent even when another removed top-level row shifted its
   * tree path.
   *
   * @param {number[]} physicalRows Physical rows being removed.
   * @returns {NestedRowsRemovalSnapshot} Detached nested-row removal snapshot.
   */
  captureRemovedRows(physicalRows: number[]): NestedRowsRemovalSnapshot {
    const rowsToRemove = new Set(physicalRows);
    const rows: RemovedRowSnapshot[] = [];

    physicalRows.forEach((physicalRow) => {
      const rowObject = this.getDataObject(physicalRow);

      if (!rowObject) {
        return;
      }

      const parent = this.getRowParent(rowObject);
      const parentRow = parent === null ? null : this.getRowIndex(parent);

      if (parentRow !== null && rowsToRemove.has(parentRow)) {
        return;
      }

      const path = this.getRowTreePath(physicalRow);

      if (path === null) {
        return;
      }

      const subtreePhysicalRows = [physicalRow];

      this.#collectSubtreePhysicalRows(rowObject, subtreePhysicalRows);

      rows.push({
        data: cloneRowData(rowObject),
        index: this.getRowIndexWithinParent(rowObject),
        path,
        parentPath: parentRow === null ? null : this.getRowTreePath(parentRow),
        parent,
        physicalRows: subtreePhysicalRows,
        visualIndex: this.hot.toVisualRow(physicalRow),
      });
    });

    return {
      rows,
      rowIndexMaps: this.#captureRowIndexMaps(),
      collapsedRows: this.plugin.collapsingUI?.getCollapsedParents() ?? [],
    };
  }

  /**
   * Returns every physical row represented by a nested removal snapshot.
   *
   * @param {NestedRowsRemovalSnapshot} snapshot Detached nested-row removal snapshot.
   * @returns {number[]} Physical rows in the removed subtrees.
   */
  getRemovedPhysicalRows(snapshot: NestedRowsRemovalSnapshot): number[] {
    const physicalRows = new Set<number>();

    snapshot.rows.forEach((row) => {
      row.physicalRows.forEach((physicalRow) => {
        physicalRows.add(physicalRow);
      });
    });

    return Array.from(physicalRows);
  }

  /**
   * Visual insert index for a captured nested root. `row.index` is the position inside the parent,
   * so it must not stand in for a missing visual row – a trimmed root would hand the hooks `0`
   * instead of the physical slot Formulas uses for its veto check.
   *
   * @param {RemovedRowSnapshot} row A captured nested removal root.
   * @returns {number} A visual row, or the physical row when the root was trimmed.
   */
  #visualIndexForRemovedRow(row: RemovedRowSnapshot): number {
    return row.visualIndex ?? this.hot.toVisualRow(row.physicalRows[0]) ?? row.physicalRows[0];
  }

  /**
   * Runs the create-row lifecycle hooks for a nested undo without mutating the tree.
   *
   * UndoRedo must call this before `beforeUndo`. Formulas always calls `engine.undo()` in
   * `beforeUndo`, so a veto discovered only while applying the snapshot would leave HyperFormula
   * restored and Handsontable empty.
   *
   * @param {NestedRowsRemovalSnapshot} snapshot Detached nested-row removal snapshot.
   * @returns {boolean} `true` when every restore hook allows the operation.
   */
  canRestoreRemovedRows(snapshot: NestedRowsRemovalSnapshot): boolean {
    const roots = snapshot.rows.map(row => ({
      row,
      visualIndex: this.#visualIndexForRemovedRow(row),
      subtreeLength: row.physicalRows.length,
    }));

    // Ask every root before deciding. Stopping at the first `false` would fire the insert
    // hooks for earlier roots and skip later ones, so a listener pairing before/after on the
    // first root is left holding state and a veto on the second root is never heard.
    let allowed = true;

    roots.forEach(({ visualIndex, subtreeLength }) => {
      if (this.hot.runHooks('beforeAlter', 'insert_row_above', visualIndex, subtreeLength, 'UndoRedo.undo') === false) {
        allowed = false;
      }

      if (this.hot.runHooks('beforeCreateRow', visualIndex, subtreeLength, 'UndoRedo.undo') === false) {
        allowed = false;
      }
    });

    if (!allowed) {
      return false;
    }

    roots.forEach(({ row }) => {
      this.plugin.disableCoreAPIModifiers();

      try {
        if (this.hot.runHooks('beforeDataSplice', row.physicalRows[0], 0, [row.data]) === false) {
          allowed = false;
        }
      } finally {
        this.plugin.enableCoreAPIModifiers();
      }
    });

    return allowed;
  }

  /**
   * Restores nested removal roots at their original parent positions and repairs the row index
   * mapper to the sequence that existed before the removal.
   *
   * Call {@link DataManager#canRestoreRemovedRows} first. This method applies the snapshot and
   * does not re-run the veto hooks.
   *
   * @param {NestedRowsRemovalSnapshot} snapshot Detached nested-row removal snapshot.
   * @param {number[]} rowIndexesSequence Physical row sequence from before the removal.
   * @param {boolean} [shiftSelection=true] When `false`, skip `selection.shiftRows`. Context-menu
   *   removal never shifted the highlight, so undoing that path must not push it down by the subtree.
   * @returns {boolean} `true` when the operation was restored.
   */
  restoreRemovedRows(
    snapshot: NestedRowsRemovalSnapshot,
    rowIndexesSequence: number[],
    shiftSelection = true
  ): boolean {
    if (!this.plugin.enabled || this.plugin.dataManager !== this) {
      return false;
    }

    const rowsByParent = new Map<RowObject | null, RemovedRowSnapshot[]>();

    snapshot.rows.forEach((row) => {
      const parent = row.parent !== null && this.getRowIndex(row.parent) !== null
        ? row.parent
        : this.#getRowObjectByTreePath(row.parentPath);
      const rows = rowsByParent.get(parent) ?? [];

      rows.push({ ...row, parent });
      rowsByParent.set(parent, rows);
    });

    rowsByParent.forEach((rows, parent) => {
      // The live array is already compacted. Inserting high indexes first writes past the
      // remaining siblings and lands them in the wrong order (A,B,C minus A and B becomes A,C,B).
      // Ascending original-index order pushes that compacted tail to the right as each root
      // goes back, which rebuilds the pre-removal layout.
      rows.sort((first, second) => first.index - second.index);

      rows.forEach((row) => {
        if (parent === null) {
          this.data!.splice(row.index, 0, row.data);
        } else {
          if (!Array.isArray(parent.__children)) {
            parent.__children = [];
          }

          parent.__children.splice(row.index, 0, row.data);
        }
      });
    });

    this.rewriteCache();

    const restoredPhysicalRows: number[] = [];
    const restoredRowBlocks: Array<{ physicalRow: number, amount: number, visualIndex: number | null }> = [];

    snapshot.rows.forEach((row) => {
      const physicalRow = this.getRowIndex(row.data);

      if (physicalRow === null) {
        return;
      }

      const subtreeLength = this.countChildren(row.data) + 1;

      restoredRowBlocks.push({ physicalRow, amount: subtreeLength, visualIndex: row.visualIndex });

      for (let offset = 0; offset < subtreeLength; offset++) {
        restoredPhysicalRows.push(physicalRow + offset);
      }
    });

    Array.from(new Set(restoredPhysicalRows))
      .sort((first, second) => first - second)
      .forEach((physicalRow) => {
        this.hot._getMetaManager().createRow(physicalRow, 1);
      });

    this.#restoreRowIndexMaps(snapshot.rowIndexMaps, rowIndexesSequence);

    if (this.plugin.collapsingUI) {
      this.plugin.collapsingUI.collapsedRows = snapshot.collapsedRows.slice();
    }

    restoredRowBlocks.forEach(({ physicalRow, amount, visualIndex }) => {
      this.hot.runHooks(
        'afterCreateRow',
        visualIndex ?? this.hot.toVisualRow(physicalRow) ?? physicalRow,
        amount,
        'UndoRedo.undo'
      );
    });

    if (shiftSelection) {
      restoredRowBlocks.forEach(({ physicalRow, amount }) => {
        const visualRow = this.hot.toVisualRow(physicalRow);
        let visibleAmount = 0;

        for (let offset = 0; offset < amount; offset++) {
          if (this.hot.toVisualRow(physicalRow + offset) !== null) {
            visibleAmount += 1;
          }
        }

        if (visualRow !== null && visibleAmount > 0) {
          this.hot.selection.shiftRows(visualRow, visibleAmount);
        }
      });
    }

    return true;
  }

  /**
   * Captures every row index map by physical index. Row removal compacts the map arrays, so restoring
   * only the physical order leaves trimming, hiding, and plugin-owned values attached to the wrong
   * rows.
   *
   * @returns {RowIndexMapsSnapshot} Row index-map values from before the removal.
   */
  #captureRowIndexMaps(): RowIndexMapsSnapshot {
    const rowIndexMapper = this.hot.rowIndexMapper;

    return {
      indexesSequence: rowIndexMapper.getIndexesSequence().slice(),
      trimmingMaps: this.#captureIndexMapCollection(rowIndexMapper.trimmingMapsCollection),
      hidingMaps: this.#captureIndexMapCollection(rowIndexMapper.hidingMapsCollection),
      variousMaps: this.#captureIndexMapCollection(rowIndexMapper.variousMapsCollection),
    };
  }

  /**
   * Restores every row index map after the source tree has been put back.
   *
   * @param {RowIndexMapsSnapshot} snapshot Row index-map values from before the removal.
   * @param {number[]} fallbackSequence The legacy sequence captured by the generic action.
   */
  #restoreRowIndexMaps(snapshot: RowIndexMapsSnapshot | undefined, fallbackSequence: number[]) {
    const rowIndexMapper = this.hot.rowIndexMapper;
    const indexesSequence = snapshot?.indexesSequence ?? fallbackSequence;

    rowIndexMapper.fitToLength(indexesSequence.length);
    rowIndexMapper.suspendOperations();

    try {
      rowIndexMapper.setIndexesSequence(indexesSequence);

      const restoreMaps = (
        collection: { collection: Map<string, {
          getValues: () => unknown[];
          setValues: (values: unknown[]) => void;
          indexedValues: unknown[];
          orderOfIndexes?: number[];
        }> },
        maps: IndexMapSnapshot[] = []
      ) => {
        maps.forEach(({ name, values, orderOfIndexes }) => {
          const indexMap = collection.collection.get(name);

          if (!indexMap) {
            return;
          }

          indexMap.setValues(values);

          if (orderOfIndexes !== undefined && 'orderOfIndexes' in indexMap) {
            indexMap.orderOfIndexes = orderOfIndexes.slice();
          }
        });
      };

      restoreMaps(rowIndexMapper.trimmingMapsCollection, snapshot?.trimmingMaps);
      restoreMaps(rowIndexMapper.hidingMapsCollection, snapshot?.hidingMaps);
      restoreMaps(rowIndexMapper.variousMapsCollection, snapshot?.variousMaps);
    } finally {
      rowIndexMapper.resumeOperations();
    }
  }

  /**
   * Captures map values by registration name. Linked maps expose their values in link order, so the
   * physical backing array and its order are both retained.
   *
   * @param {{collection: Map<string, object>}} collection Registered row index maps.
   * @returns {IndexMapSnapshot[]} Named map snapshots.
   */
  #captureIndexMapCollection(collection: {
    collection: Map<string, {
      getValues: () => unknown[];
      indexedValues: unknown[];
      orderOfIndexes?: number[];
    }>
  }): IndexMapSnapshot[] {
    return Array.from(collection.collection.entries()).map(([name, indexMap]) => {
      const isLinkedMap = indexMap.orderOfIndexes !== undefined;

      return {
        name,
        values: (isLinkedMap ? indexMap.indexedValues : indexMap.getValues()).slice(),
        ...(isLinkedMap ? {
          orderOfIndexes: indexMap.orderOfIndexes!.slice(),
        } : {}),
      };
    });
  }

  /**
   * Rewrite the nested structure cache.
   *
   * @private
   */
  rewriteCache() {
    this.cache = {
      levels: [],
      levelCount: 0,
      rows: [],
      nodeInfo: new WeakMap<object, NodeInfo>()
    };

    rangeEach(0, this.data!.length - 1, (i: number) => {
      this.cacheNode(this.data![i], 0, null);
    });
  }

  /**
   * Cache a data node.
   *
   * @private
   * @param {object} node Node to cache.
   * @param {number} level Level of the node.
   * @param {object} parent Parent of the node.
   */
  cacheNode(node: RowObject, level: number, parent: RowObject | null) {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (!this.cache.levels[level]) {
      this.cache.levels[level] = [];
      this.cache.levelCount += 1;
    }
    this.cache.levels[level].push(node);
    this.cache.rows.push(node);
    this.cache.nodeInfo.set(node, {
      parent,
      row: this.cache.rows.length - 1,
      level
    });

    if (this.hasChildren(node) && node.__children) {
      arrayEach(node.__children, (elem: RowObject) => {
        this.cacheNode(elem, level + 1, node);
      });
    }
  }

  /**
   * Get the date for the provided visual row number.
   *
   * @param {number} row Row index.
   * @returns {object}
   */
  getDataObject(row: number): RowObject | null | undefined {
    // Safety guard: preserve null return for callers that pass null/undefined at runtime.
    if ((row as unknown) === null || (row as unknown) === undefined) {
      return null;
    }

    return this.cache.rows[row];
  }

  /**
   * Read the row tree in search for a specific row index or row object.
   *
   * @private
   * @param {object} parent The initial parent object.
   * @param {number} readCount Number of read nodes.
   * @param {number} neededIndex The row index we search for.
   * @param {object} neededObject The row object we search for.
   * @returns {number|object}
   */
  readTreeNodes(
    parent: RowObject | null, readCount: ReadTreeResult, neededIndex: number, neededObject: Record<string, unknown>
  ): ReadTreeResult {
    let rootLevel = false;
    let readNodesCount: ReadTreeResult = readCount;

    if (typeof readNodesCount !== 'number') {
      return readNodesCount;
    }

    let parentObj: RowObject | null = parent;

    if (!parentObj) {
      parentObj = {
        __children: this.data!
      };
      rootLevel = true;
      readNodesCount -= 1;
    }

    if (neededIndex !== null && neededIndex !== undefined && readNodesCount === neededIndex) {
      return { result: parentObj, end: true };
    }

    if (neededObject !== null && neededObject !== undefined && parentObj === neededObject) {
      return { result: readNodesCount, end: true };
    }

    readNodesCount += 1;

    if (parentObj.__children) {
      arrayEach(parentObj.__children, (val: RowObject) => {

        this.parentReference.set(val, rootLevel ? null : parentObj);

        readNodesCount = this.readTreeNodes(val, readNodesCount, neededIndex, neededObject);

        if (typeof readNodesCount !== 'number') {
          return false;
        }
      });
    }

    return readNodesCount;
  }

  /**
   * Mock a parent node.
   *
   * @private
   * @returns {*}
   */
  mockParent(): RowObject {
    const fakeParent = this.mockNode();

    fakeParent.__children = this.data!;

    return fakeParent;
  }

  /**
   * Mock a data node.
   *
   * @private
   * @returns {{}}
   */
  mockNode(): RowObject {
    const fakeNode: RowObject = {};

    objectEach(this.data![0], (val: unknown, key: string) => {
      fakeNode[key] = null;
    });

    return fakeNode;
  }

  /**
   * Get the row index for the provided row object.
   *
   * Returns `null` when the object is not part of the current nested structure - for example when it
   * comes from a dataset that has since been replaced by `loadData` or `updateData`.
   *
   * @param {object} rowObj The row object.
   * @returns {number|null} Row index, or `null` when the object is unknown.
   */
  getRowIndex(rowObj: unknown): number | null {
    if (rowObj === null || rowObj === undefined || typeof rowObj !== 'object') {
      return null;
    }

    const nodeInfo = this.cache.nodeInfo.get(rowObj);

    return nodeInfo ? nodeInfo.row : null;
  }

  /**
   * Get the index of the provided row index/row object within its parent.
   *
   * @param {number|object} row Row index / row object.
   * @returns {number}
   */
  getRowIndexWithinParent(row: number | RowObject): number {
    let rowObj: RowObject | null | undefined = null;

    if (typeof row !== 'number') {
      rowObj = row;
    } else {
      rowObj = this.getDataObject(row);
    }

    const parent = this.getRowParent(row);

    if (parent === null || parent === undefined) {
      return this.data!.indexOf(rowObj as RowObject);
    }

    return parent.__children!.indexOf(rowObj as RowObject);
  }

  /**
   * Get the position of a row within the nested structure, expressed as the chain of child indexes
   * that leads from the top level down to that row.
   *
   * A physical row index shifts as soon as any other node gains or loses children. A tree path does
   * not, so it can be used to find the same node again after the data is replaced.
   *
   * Assumes each row object appears in the tree once. The path is built with `indexOf`, on object
   * identity, while `getRowIndexByTreePath()` finishes through the `cache.nodeInfo` WeakMap, which
   * keeps only a node's last occurrence - so the same object placed at two spots makes the two
   * disagree.
   *
   * @param {number} row Physical row index.
   * @returns {number[]|null} The path, or `null` when the row is not part of the current structure.
   */
  getRowTreePath(row: number): number[] | null {
    let rowObject: RowObject | null | undefined = this.getDataObject(row);

    if (!rowObject) {
      return null;
    }

    const path: number[] = [];

    while (rowObject) {
      const indexWithinParent = this.getRowIndexWithinParent(rowObject);

      if (indexWithinParent === -1) {
        return null;
      }

      path.unshift(indexWithinParent);
      rowObject = this.getRowObjectParent(rowObject);
    }

    return path;
  }

  /**
   * Find the physical row index of the node that the provided tree path points at.
   *
   * @param {number[]|null} path Chain of child indexes, as returned by
   * {@link DataManager#getRowTreePath} - which returns `null` for a row it does not know, so the
   * `null` is accepted here rather than filtered at every call site.
   * @returns {number|null} Physical row index, or `null` when the path leads outside the structure.
   */
  getRowIndexByTreePath(path: number[] | null): number | null {
    if (!Array.isArray(path) || path.length === 0) {
      return null;
    }

    let siblings: RowObject[] | null | undefined = this.data;
    let node: RowObject | null = null;

    for (let i = 0; i < path.length; i++) {
      node = siblings?.[path[i]] ?? null;

      if (node === null) {
        return null;
      }

      siblings = node.__children;
    }

    return this.getRowIndex(node);
  }

  /**
   * Returns the row object at a tree path.
   *
   * @param {number[]|null} path Chain of child indexes.
   * @returns {RowObject|null} The row object, or `null` when the path is invalid.
   */
  #getRowObjectByTreePath(path: number[] | null): RowObject | null {
    if (!Array.isArray(path) || path.length === 0) {
      return null;
    }

    let siblings: RowObject[] | null | undefined = this.data;
    let row: RowObject | null = null;

    for (let i = 0; i < path.length; i++) {
      row = siblings?.[path[i]] ?? null;

      if (row === null) {
        return null;
      }

      siblings = row.__children;
    }

    return row;
  }

  /**
   * Collects the physical rows currently known for a subtree.
   *
   * @param {RowObject} row The current subtree node.
   * @param {number[]} physicalRows Accumulator of known physical rows.
   */
  #collectSubtreePhysicalRows(row: RowObject, physicalRows: number[]): void {
    const children = row.__children;

    if (!Array.isArray(children)) {
      return;
    }

    children.forEach((child) => {
      const childPhysicalRow = this.getRowIndex(child);

      if (childPhysicalRow !== null) {
        physicalRows.push(childPhysicalRow);
      }

      this.#collectSubtreePhysicalRows(child, physicalRows);
    });
  }

  /**
   * Count all rows (including all parents and children).
   *
   * @returns {number}
   */
  countAllRows(): number {
    const rootNodeMock: RowObject = {
      __children: this.data!
    };

    return this.countChildren(rootNodeMock);
  }

  /**
   * Count children of the provided parent.
   *
   * @param {object|number} parent Parent node.
   * @returns {number} Children count.
   */
  countChildren(parent: RowObject | number): number {
    let rowCount = 0;
    const parentNode: RowObject | null | undefined = typeof parent === 'number' ? this.getDataObject(parent) : parent;

    if (!parentNode || !parentNode.__children) {
      return 0;
    }

    arrayEach(parentNode.__children, (elem: RowObject) => {
      rowCount += 1;

      if (elem.__children) {
        rowCount += this.countChildren(elem);
      }
    });

    return rowCount;
  }

  /**
   * Get the parent of the row at the provided index.
   *
   * @param {number|object} row Physical row index.
   * @returns {object}
   */
  getRowParent(row: number | RowObject): RowObject | null {
    let rowObject;

    if (typeof row !== 'number') {
      rowObject = row;
    } else {
      rowObject = this.getDataObject(row);
    }

    return this.getRowObjectParent(rowObject);
  }

  /**
   * Get the parent of the provided row object.
   *
   * @private
   * @param {object} rowObject The row object (tree node).
   * @returns {object|null}
   */
  getRowObjectParent(rowObject: unknown): RowObject | null {
    if (!rowObject || typeof rowObject !== 'object') {
      return null;
    }

    const nodeInfo = this.cache.nodeInfo.get(rowObject);

    return nodeInfo ? nodeInfo.parent : null;
  }

  /**
   * Get the nesting level for the row with the provided row index.
   *
   * @param {number} row Row index.
   * @returns {number|null} Row level or null, when row doesn't exist.
   */
  getRowLevel(row: number | RowObject): number | null {
    let rowObject: RowObject | null | undefined = null;

    if (typeof row !== 'number') {
      rowObject = row;
    } else {
      rowObject = this.getDataObject(row);
    }

    return rowObject ? this.getRowObjectLevel(rowObject) : null;
  }

  /**
   * Get the nesting level for the row with the provided row index.
   *
   * @private
   * @param {object} rowObject Row object.
   * @returns {number} Row level.
   */
  getRowObjectLevel(rowObject: unknown): number | null {
    if (rowObject === null || rowObject === undefined || typeof rowObject !== 'object') {
      return null;
    }

    const nodeInfo = this.cache.nodeInfo.get(rowObject);

    return nodeInfo ? nodeInfo.level : null;
  }

  /**
   * Check if the provided row/row element has children.
   *
   * @param {number|object} row Row number or row element.
   * @returns {boolean}
   */
  hasChildren(row: number | RowObject): boolean {
    const rowObj: RowObject | null | undefined = typeof row === 'number' ? this.getDataObject(row) : row;

    return !!(rowObj && rowObj.__children && rowObj.__children.length);
  }

  /**
   * Returns `true` if the row at the provided index has a parent.
   *
   * @param {number} index Row index.
   * @returns {boolean} `true` if the row at the provided index has a parent, `false` otherwise.
   */
  isChild(index: number): boolean {
    return this.getRowParent(index) !== null;
  }

  /**
   * Get child at a provided index from the parent element.
   *
   * @param {object} parent The parent row object.
   * @param {number} index Index of the child element to be retrieved.
   * @returns {object|null} The child element or `null` if the child doesn't exist.
   */
  getChild(parent: RowObject, index: number): RowObject | null {
    return parent.__children?.[index] || null;
  }

  /**
   * Return `true` of the row at the provided index is located at the topmost level.
   *
   * @param {number} index Row index.
   * @returns {boolean} `true` of the row at the provided index is located at the topmost level, `false` otherwise.
   */
  isRowHighestLevel(index: number): boolean {
    return !this.isChild(index);
  }

  /**
   * Return `true` if the provided row index / row object represents a parent in the nested structure.
   *
   * @param {number|object} row Row index / row object.
   * @returns {boolean} `true` if the row is a parent, `false` otherwise.
   */
  isParent(row: number | RowObject): boolean {
    const rowObj: RowObject | null | undefined = typeof row === 'number' ? this.getDataObject(row) : row;

    return !!(rowObj && (rowObj.__children && rowObj.__children.length !== 0));
  }

  /**
   * Add a child to the provided parent. It's optional to add a row object as the "element".
   *
   * @param {object} parent The parent row object.
   * @param {object} [element] The element to add as a child.
   */
  addChild(parent: RowObject, element?: RowObject) {
    let childElement = element;

    this.hot.runHooks('beforeAddChild', parent, childElement);

    let parentIndex: number | null = null;

    if (parent) {
      parentIndex = this.getRowIndex(parent);
    }

    this.hot.runHooks('beforeCreateRow', parentIndex! + this.countChildren(parent) + 1, 1);
    let functionalParent: RowObject = parent;

    if (!parent) {
      functionalParent = this.mockParent();
    }
    if (!functionalParent.__children) {
      functionalParent.__children = [];
    }

    if (!childElement) {
      childElement = this.mockNode();
    }

    functionalParent.__children.push(childElement);

    this.rewriteCache();

    const newPhysicalIndex = this.getRowIndex(childElement);
    const newRowIndex = newPhysicalIndex ?? 0;

    this.hot.rowIndexMapper.insertIndexes(newRowIndex, 1);

    this.shiftCellsMeta(newPhysicalIndex);

    this.hot.runHooks('afterCreateRow', newRowIndex, 1);
    this.hot.runHooks('afterAddChild', parent, childElement);
  }

  /**
   * Inserts one empty cell meta row, so meta stored below the new row moves down with its data.
   *
   * The methods that build a row by hand have to do this themselves - only `DataMap#createRow`
   * does it on the regular insert path, and it is never reached from here (#7727). `MetaManager`
   * takes a physical index, which is what `getRowIndex()` returns, and it does not render.
   *
   * @param {number|null} physicalRow Physical index of the new row. `null` skips the shift, so an
   * unknown row object cannot move every meta row from index 0 down.
   */
  shiftCellsMeta(physicalRow: number | null) {
    if (physicalRow === null) {
      return;
    }

    this.hot._getMetaManager().createRow(physicalRow, 1);
  }

  /**
   * Moves the cell meta of a relocated block of rows, so meta stored between the block's old and
   * new position moves with its data.
   *
   * `detachFromParent` restructures the tree by hand, so it needs both halves of the move, not just
   * the insert side `shiftCellsMeta` covers: the block is removed at its old physical index and
   * re-inserted at its new one. `MetaManager` takes physical indexes, which is what `getRowIndex()`
   * returns, and neither call renders.
   *
   * The moved block's own meta is reset rather than carried across. `LazyFactoryMap` has no move
   * primitive, and the alternative – snapshotting through `getCellMetas()` – takes visual indexes,
   * materializes meta for every column, and fires `afterSetCellMeta` per cell. Leaving the meta
   * behind is worse than resetting it: it would land on whatever row took the old index.
   *
   * @param {number|null} fromPhysicalRow Physical index the block sat at before the move.
   * @param {number|null} toPhysicalRow Physical index the block sits at after the move. A `null` on
   * either side skips the move, so an unknown row object cannot splice meta from index 0. An
   * unchanged index also skips it – nothing shifted, so resetting the block's meta would drop meta
   * that is still on the right cells.
   * @param {number} amount Number of rows in the moved block.
   */
  moveCellsMeta(fromPhysicalRow: number | null, toPhysicalRow: number | null, amount: number) {
    if (fromPhysicalRow === null || toPhysicalRow === null || fromPhysicalRow === toPhysicalRow) {
      return;
    }

    const metaManager = this.hot._getMetaManager();

    metaManager.removeRow(fromPhysicalRow, amount);
    metaManager.createRow(toPhysicalRow, amount);
  }

  /**
   * Find the physical row a new top-level row inserted at the provided top-level position lands on.
   *
   * A top-level row does not sit in the grid at the position it holds in the top-level array: every
   * preceding parent's subtree sits between the two. The two agree only while no preceding top-level
   * row has children, which is why a top-level position cannot be handed to anything that counts in
   * grid rows (#7727, DEV-2625).
   *
   * @private
   * @param {number} topLevelIndex Position within the top-level array.
   * @returns {number} Physical row index the new row takes.
   */
  getTopLevelInsertionRow(topLevelIndex: number): number {
    const displacedRow = this.data![topLevelIndex];

    // Past the last top-level row there is nothing to displace, so the new row goes to the end.
    if (displacedRow === null || displacedRow === undefined) {
      return this.countAllRows();
    }

    return this.getRowIndex(displacedRow) ?? 0;
  }

  /**
   * Add a child node to the provided parent at a specified index.
   *
   * A row with no parent is a top-level row, and that branch builds the insert by hand rather than
   * through `hot.alter()`, which cannot serve both halves of it. `hot.alter()` also used to fire
   * `beforeAlter` and `beforeDataSplice` here; neither does any more. The plugin's `AGENTS.md`
   * holds why, and what is still wrong next door.
   *
   * @param {object} parent Parent node.
   * @param {number} index Index to insert the child element at.
   * @param {object} [element] Element (node) to insert.
   */
  addChildAtIndex(parent: RowObject | null, index: number, element: RowObject | null) {
    let childElement = element;
    let flattenedIndex: number;

    if (!childElement) {
      childElement = this.mockNode();
    }

    this.hot.runHooks('beforeAddChild', parent, childElement, index);

    if (parent) {
      const parentIndex = this.getRowIndex(parent) ?? 0;
      const finalChildIndex = parentIndex + index + 1;

      this.hot.runHooks('beforeCreateRow', finalChildIndex, 1);

      parent.__children!.splice(index, 0, childElement);

      this.rewriteCache();

      this.plugin.disableCoreAPIModifiers();

      this.hot.setSourceDataAtCell(
        parentIndex,
        '__children',
        parent.__children,
        'NestedRows.addChildAtIndex'
      );

      this.hot.rowIndexMapper.insertIndexes(finalChildIndex, 1);

      this.plugin.enableCoreAPIModifiers();

      // Read the real index instead of reusing `finalChildIndex`: that one assumes every preceding
      // sibling is a leaf, so a sibling with descendants would splice the meta above the new row.
      this.shiftCellsMeta(this.getRowIndex(childElement));

      this.hot.runHooks('afterCreateRow', finalChildIndex, 1);

      flattenedIndex = finalChildIndex;

    } else {
      // `Array#splice` reads a negative index from the end, while everything below reports an
      // append, so a caller that lost track of its row - `getRowIndexWithinParent()` answers -1 for
      // a row object the cache does not know - would otherwise put the data, the meta and the index
      // maps in three different places. Normalize once, here, and use it for both halves.
      const topLevelIndex = Math.max(index, 0);
      const finalRowIndex = this.getTopLevelInsertionRow(topLevelIndex);
      // Read before the splice, so both still mean the row the new one displaces. The index maps
      // count in visual indexes; the cell meta counts in physical ones. Appending is its own case:
      // no physical row holds `finalRowIndex` yet, so it has no visual index to read, and the new
      // row goes one past the last *visible* row rather than past the physical count. A displaced
      // row that is itself trimmed cannot be addressed at all - see the plugin's `AGENTS.md`.
      const visualRowIndex = topLevelIndex >= this.data!.length
        ? this.hot.countRows()
        : (this.hot.rowIndexMapper.getVisualFromPhysicalIndex(finalRowIndex) ?? finalRowIndex);

      // A `false` here cancels the insert, and it has to keep doing so: `Formulas` answers `false`
      // whenever HyperFormula cannot extend the sheet, and its own `afterCreateRow` listener would
      // then call `engine.addRows()` on the state HyperFormula just refused. `afterAddChild` still
      // has to fire - `beforeAddChild` opened the collapsed-rows stash, and only that hook closes
      // it again, so returning without it leaves the grid expanded for the rest of its life.
      if (this.hot.runHooks('beforeCreateRow', visualRowIndex, 1, 'NestedRows.addChildAtIndex') === false) {
        this.hot.runHooks('afterAddChild', parent, null, index);

        return;
      }

      // `this.data` is the source array itself, so this splice already is the source data change -
      // no `setSourceDataAtCell()` needed, unlike the branch above, which writes a `__children` key.
      this.data!.splice(topLevelIndex, 0, childElement);

      this.rewriteCache();

      this.hot.rowIndexMapper.insertIndexes(visualRowIndex, 1);

      this.shiftCellsMeta(this.getRowIndex(childElement));

      this.hot.runHooks('afterCreateRow', visualRowIndex, 1, 'NestedRows.addChildAtIndex');

      // Kept from `hot.alter()`, now with the right index: a selection at or below the new row still
      // addresses the same rows.
      this.hot.selection.shiftRows(visualRowIndex, 1);

      flattenedIndex = finalRowIndex;
    }

    // Workaround for refreshing cache losing the reference to the mocked row.
    childElement = this.getDataObject(flattenedIndex) ?? null;

    this.hot.runHooks('afterAddChild', parent, childElement, index);
  }

  /**
   * Add a sibling element at the specified index.
   *
   * @param {number} index New element sibling's index.
   * @param {('above'|'below')} where Direction in which the sibling is to be created.
   */
  addSibling(index: number, where = 'below') {
    const translatedIndex = this.translateTrimmedRow(index);
    const parent = this.getRowParent(translatedIndex);
    const indexWithinParent = this.getRowIndexWithinParent(translatedIndex);

    switch (where) {
      case 'below':
        this.addChildAtIndex(parent, indexWithinParent + 1, null);
        break;
      case 'above':
        this.addChildAtIndex(parent, indexWithinParent, null);
        break;
      default:
        break;
    }
  }

  /**
   * Detach the provided element from its parent and add it right after it.
   *
   * @param {object|Array} elements Row object or an array of selected coordinates.
   * @param {boolean} [forceRender=true] If true (default), it triggers render after finished.
   */
  detachFromParent(elements: RowObject | number[], forceRender = true) {
    let element: RowObject | null = null;
    const rowObjects: (RowObject | null | undefined)[] = [];

    if (Array.isArray(elements)) {
      rangeEach(elements[0], elements[2], (i: number) => {
        const translatedIndex = this.translateTrimmedRow(i);

        rowObjects.push(this.getDataObject(translatedIndex));
      });

      rangeEach(0, rowObjects.length - 2, (i: number) => {
        const rowObj = rowObjects[i];

        if (rowObj !== null && rowObj !== undefined) {
          this.detachFromParent(rowObj, false);
        }
      });

      element = rowObjects[rowObjects.length - 1] ?? null;
    } else {
      element = elements;
    }

    if (!element) {
      return;
    }

    // Kept separate from `childRowIndex`: that `?? 0` fallback is pre-existing and is left reporting
    // the hook arguments exactly as it did. As a meta index the `0` would splice from the top of the
    // grid, so `moveCellsMeta()` reads the raw result instead.
    const childPhysicalIndex = this.getRowIndex(element);
    const childRowIndex = childPhysicalIndex ?? 0;
    const childCount = this.countChildren(element);
    const indexWithinParent = this.getRowIndexWithinParent(element);
    const parent = this.getRowParent(element);
    const grandparent = this.getRowParent(parent!);
    const grandparentRowIndex = this.getRowIndex(grandparent) ?? 0;
    let movedElementRowIndex: number | null = null;
    // Set inside the branch that actually restructures the tree, so the cell meta move below can
    // never run on its own. Re-testing `indexWithinParent` there would be a second copy of this
    // condition, free to drift away from the one the data operation is gated on.
    let hasMovedTheRow = false;

    this.hot.runHooks('beforeDetachChild', parent, element);

    if (indexWithinParent !== null && indexWithinParent !== undefined) {
      const removedRowIndexes = Array.from(
        new Array(childRowIndex + childCount + 1).keys()
      ).splice(-1 * (childCount + 1));

      this.hot.runHooks(
        'beforeRemoveRow',
        childRowIndex,
        childCount + 1,
        removedRowIndexes,
        this.plugin.pluginName
      );

      parent!.__children!.splice(indexWithinParent, 1);

      this.rewriteCache();

      this.hot.runHooks(
        'afterRemoveRow',
        childRowIndex,
        childCount + 1,
        removedRowIndexes,
        this.plugin.pluginName
      );

      if (grandparent) {
        movedElementRowIndex = grandparentRowIndex + this.countChildren(grandparent);

        const lastGrandparentChild = this.getChild(grandparent, this.countChildren(grandparent) - 1);
        const lastGrandparentChildIndex = this.getRowIndex(lastGrandparentChild) ?? 0;

        this.hot.runHooks('beforeCreateRow', lastGrandparentChildIndex + 1, childCount + 1, this.plugin.pluginName);

        grandparent.__children!.push(element);

      } else {
        movedElementRowIndex = this.hot.countRows() + 1;
        this.hot.runHooks('beforeCreateRow', movedElementRowIndex - 2, childCount + 1, this.plugin.pluginName);

        this.data!.push(element);
      }

      hasMovedTheRow = true;
    }

    this.rewriteCache();

    if (hasMovedTheRow) {
      // Read the destination instead of reusing `movedElementRowIndex`: that one is derived
      // arithmetically from the grandparent position, and a sibling that owns descendants breaks
      // the formula.
      this.moveCellsMeta(childPhysicalIndex, this.getRowIndex(element), childCount + 1);
    }

    this.hot.runHooks('afterCreateRow', movedElementRowIndex! - 2, childCount + 1, this.plugin.pluginName);

    this.hot.runHooks('afterDetachChild', parent, element, this.getRowIndex(element));

    if (forceRender) {
      this.hot.render();
    }
  }

  /**
   * Filter the data by the `logicRows` array.
   *
   * @private
   * @param {number} index Index of the first row to remove.
   * @param {number} amount Number of elements to remove.
   * @param {Array} logicRows Array of indexes to remove.
   */
  filterData(index: number, amount: number, logicRows: number[]) {
    // TODO: why are the first 2 arguments not used?

    const elementsToRemove: RowObject[] = [];

    arrayEach(logicRows, (elem: number) => {
      const elemObj = this.getDataObject(elem);

      if (elemObj !== null && elemObj !== undefined) {
        elementsToRemove.push(elemObj);
      }
    });

    arrayEach(elementsToRemove, (elem: RowObject) => {
      const indexWithinParent = this.getRowIndexWithinParent(elem);
      const tempParent = this.getRowParent(elem);

      if (tempParent === null) {
        this.data!.splice(indexWithinParent, 1);
      } else {
        tempParent.__children!.splice(indexWithinParent, 1);
      }
    });

    this.rewriteCache();
  }

  /**
   * Used to splice the source data. Needed to properly modify the nested structure, which wouldn't work with the
   * default script.
   *
   * @private
   * @param {number} index Physical index of the element at the splice beginning.
   * @param {number} amount Number of elements to be removed.
   * @param {object[]} elements Array of row objects to add.
   */
  spliceData(index: number, amount: number, elements: RowObject[] | null) {
    const previousElement = this.getDataObject(index - 1);
    let newRowParent: RowObject | null = null;
    let indexWithinParent = index;

    if (previousElement && previousElement.__children && previousElement.__children.length === 0) {
      newRowParent = previousElement;
      indexWithinParent = 0;

    } else if (index < this.countAllRows()) {
      newRowParent = this.getRowParent(index);
      indexWithinParent = this.getRowIndexWithinParent(index);
    }

    if (newRowParent) {
      if (elements) {
        newRowParent.__children!.splice(indexWithinParent, amount, ...elements);

      } else {
        newRowParent.__children!.splice(indexWithinParent, amount);
      }

    } else if (elements) {
      this.data!.splice(indexWithinParent, amount, ...elements);

    } else {
      this.data!.splice(indexWithinParent, amount);
    }

    this.rewriteCache();
  }

  /**
   * Update the `__children` key of the upmost parent of the provided row object.
   *
   * @private
   * @param {object} rowElement Row object.
   */
  syncRowWithRawSource(rowElement: RowObject) {
    let upmostParent: RowObject = rowElement;
    let tempParent: RowObject | null = upmostParent;

    do {
      tempParent = this.getRowParent(tempParent);

      if (tempParent !== null) {
        upmostParent = tempParent;
      }

    } while (tempParent !== null);

    this.plugin.disableCoreAPIModifiers();
    this.hot.setSourceDataAtCell(
      this.getRowIndexWithinParent(upmostParent),
      '__children',
      upmostParent.__children,
      'NestedRows.syncRowWithRawSource',
    );
    this.plugin.enableCoreAPIModifiers();
  }

  /* eslint-disable jsdoc/require-param */
  /**
   * Move a single row.
   *
   * @param {number} fromIndex Index of the row to be moved.
   * @param {number} toIndex Index of the destination.
   * @param {boolean} moveToCollapsed `true` if moving a row to a collapsed parent.
   * @param {boolean} moveToLastChild `true` if moving a row to be a last child of the new parent.
   */

  /* eslint-enable jsdoc/require-param */
  /**
   *
   */
  moveRow(fromIndex: number, toIndex: number, moveToCollapsed: boolean, moveToLastChild: boolean) {
    const moveToLastRow = toIndex === this.hot.countRows();
    const fromParent = this.getRowParent(fromIndex)!;
    const indexInFromParent = this.getRowIndexWithinParent(fromIndex);
    const elemToMove = fromParent.__children!.slice(indexInFromParent, indexInFromParent + 1);
    const movingUp = fromIndex > toIndex;
    let toParent: RowObject | null | undefined = moveToLastRow
      ? this.getRowParent(toIndex - 1)
      : this.getRowParent(toIndex);

    if (toParent === null || toParent === undefined) {
      toParent = this.getRowParent(toIndex - 1);
    }

    if (toParent === null || toParent === undefined) {
      toParent = this.getDataObject(toIndex - 1);
    }

    if (!toParent) {
      toParent = this.getDataObject(toIndex);
      toParent!.__children = [];

    } else if (!toParent.__children) {
      toParent.__children = [];
    }

    const indexInTargetParent = moveToLastRow || moveToCollapsed || moveToLastChild ?
      toParent!.__children!.length : this.getRowIndexWithinParent(toIndex);
    const sameParent = fromParent === toParent;

    toParent!.__children!.splice(indexInTargetParent, 0, elemToMove[0]);
    fromParent.__children!.splice(indexInFromParent + (movingUp && sameParent ? 1 : 0), 1);

    // Sync the changes in the cached data with the actual data stored in HOT.
    this.syncRowWithRawSource(fromParent);

    if (!sameParent) {
      this.syncRowWithRawSource(toParent!);
    }
  }

  /**
   * Translate the visual row index to the physical index, taking into consideration the state of collapsed rows.
   *
   * @private
   * @param {number} row Row index.
   * @returns {number}
   */
  translateTrimmedRow(row: number): number {
    if (this.plugin.collapsingUI) {
      return this.plugin.collapsingUI.translateTrimmedRow(row);
    }

    return row;
  }

  /**
   * Translate the physical row index to the visual index, taking into consideration the state of collapsed rows.
   *
   * @private
   * @param {number} row Row index.
   * @returns {number}
   */
  untranslateTrimmedRow(row: number): number {
    if (this.plugin.collapsingUI) {
      return this.plugin.collapsingUI.untranslateTrimmedRow(row);
    }

    return row;
  }
}

export default DataManager;
