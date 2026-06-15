import { arrayMap, arrayReduce } from '../../../helpers/array';
import SourceSettings from './sourceSettings';
import type { HeaderNodeData } from './headersTree';
import HeadersTree from './headersTree';
import { triggerNodeModification } from './nodeModifiers';
import { generateMatrix } from './matrixGenerator';
import { syncVisibilityOnTree } from './syncVisibility';
import type { ColumnVisibility } from './columnVisibility';
import type TreeNode from '../../../utils/dataStructures/tree';
import { TRAVERSAL_DF_PRE } from '../../../utils/dataStructures/tree';

/**
 * The state manager is a source of truth for nested headers configuration.
 *
 * @class StateManager
 */
export default class StateManager {
  /**
   * The instance of the source settings class.
   *
   * @private
   * @type {SourceSettings}
   */
  readonly #sourceSettings = new SourceSettings();
  /**
   * The instance of the headers tree.
   *
   * @private
   * @type {HeadersTree}
   */
  readonly #headersTree = new HeadersTree(this.#sourceSettings);
  /**
   * Cached matrix which is generated from the tree structure.
   *
   * @private
   * @type {Array[]}
   */
  #stateMatrix: unknown[][] = [[]];
  /**
   * The last column-visibility adapter passed to syncVisibility(). Stored so that
   * mapState()/mergeStateWith() can re-apply it after rebuilding the tree.
   */
  #lastColumnVisibility: ColumnVisibility | null = null;

  /**
   * Sets a new state for the nested headers plugin based on settings passed
   * directly to the plugin.
   *
   * @param {Array[]} nestedHeadersSettings The user-defined settings.
   * @returns {boolean} Returns `true` if the settings are processed correctly, `false` otherwise.
   */
  setState(nestedHeadersSettings: unknown[][]) {
    this.#sourceSettings.setData(nestedHeadersSettings);
    let hasError = false;

    try {
      this.#headersTree.buildTree();
    } catch (ex) {
      this.#headersTree.clear();
      this.#sourceSettings.clear();
      hasError = true;
    }

    this.#applySyncVisibility();

    return hasError;
  }

  /**
   * Sets columns limit to the state will be trimmed.
   *
   * @param {number} columnsCount The number of columns to limit to.
   */
  setColumnsLimit(columnsCount: number) {
    this.#sourceSettings.setColumnsLimit(columnsCount);
  }

  /**
   * Merges settings with current plugin state.
   *
   * @param {object[]} settings An array of objects to merge with the current source settings.
   */
  mergeStateWith(settings: { row: number, col: number, [key: string]: unknown }[]) {
    const transformedSettings = arrayMap(settings, ({ row, ...rest }) => {
      // Negative rows are header-coordinate; map them to a header level. An out-of-range row keeps
      // its (negative) value, which getHeaderSettings() resolves to no match - same as before.
      return {
        row: row < 0 ? (this.rowCoordsToLevel(row) ?? row) : row,
        ...rest,
      };
    });

    this.#rebuildPreservingCollapse(
      () => this.#sourceSettings.mergeWith(transformedSettings),
      columnIndex => columnIndex
    );
  }

  /**
   * Maps the current state with a callback.
   *
   * @param {Function} callback A function that is called for every header source settings.
   */
  mapState(callback: (headerSettings: Record<string, unknown>) => unknown) {
    this.#rebuildPreservingCollapse(() => this.#sourceSettings.map(callback), columnIndex => columnIndex);
  }

  /**
   * Inserts `amount` columns into the source settings at the visual `columnIndex`, then rebuilds
   * the tree and re-derives visibility. Headers spanning the insertion point are extended; columns
   * inserted at a header boundary become standalone headers.
   *
   * @param {number} columnIndex A visual column index at which the new columns are inserted.
   * @param {number} amount The number of columns to insert.
   */
  insertColumns(columnIndex: number, amount: number) {
    this.#rebuildPreservingCollapse(
      () => this.#sourceSettings.insertColumns(columnIndex, amount),
      c => (c >= columnIndex ? c + amount : c)
    );
  }

  /**
   * Removes `amount` columns from the source settings starting at the visual `columnIndex`, then
   * rebuilds the tree and re-derives visibility. Headers overlapping the removed range are shrunk,
   * re-anchored, or dropped when they lose all their columns.
   *
   * @param {number} columnIndex A visual column index from which the columns are removed.
   * @param {number} amount The number of columns to remove.
   */
  removeColumns(columnIndex: number, amount: number) {
    const endIndex = columnIndex + amount;

    this.#rebuildPreservingCollapse(
      () => this.#sourceSettings.removeColumns(columnIndex, amount),
      (c) => {
        if (c < columnIndex) {
          return c;
        }

        // The anchor column was removed but the group may survive - re-anchor to the range start.
        return c >= endIndex ? c - amount : columnIndex;
      }
    );
  }

  /**
   * Rebuilds the header tree after a structural mutation while preserving the collapsed state.
   *
   * Visibility is derived BEFORE re-collapsing, so collapseNode picks the correct first *visible*
   * representative (and clones the right children) even when columns are hidden by an external
   * source; then it is derived again to reflect the re-applied collapse. Re-running the collapse -
   * rather than only restoring the `isCollapsed` flag - rebuilds the `clonedTree` needed to expand
   * the group again.
   *
   * @param {Function} mutate Applies the structural change to the source settings.
   * @param {Function} shiftColumnIndex Maps a pre-rebuild collapsed column index to its new position.
   */
  #rebuildPreservingCollapse(mutate: () => void, shiftColumnIndex: (columnIndex: number) => number) {
    const collapsedNodes = this.#snapshotCollapsedNodes();

    mutate();
    this.#headersTree.buildTree();
    // Derive visibility before re-collapsing, but skip the matrix here - #reapplyCollapsedNodes
    // reads the tree (not the matrix) and the trailing #applySyncVisibility regenerates it once,
    // so building the matrix at this point would only be discarded work.
    this.#deriveVisibility();
    this.#reapplyCollapsedNodes(collapsedNodes, shiftColumnIndex);
    this.#applySyncVisibility();
  }

  /**
   * Captures the header level and visual column index of every currently collapsed node, so the
   * collapsed state can be re-applied after a tree rebuild (e.g. after inserting/removing columns).
   *
   * @returns {Array<{headerLevel: number, columnIndex: number}>}
   */
  #snapshotCollapsedNodes(): { headerLevel: number, columnIndex: number }[] {
    const collapsedNodes: { headerLevel: number, columnIndex: number }[] = [];

    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown((node) => {
        const data = node.data;

        if (data.isCollapsed) {
          collapsedNodes.push({ headerLevel: data.headerLevel, columnIndex: data.columnIndex });
        }
      });
    });

    return collapsedNodes;
  }

  /**
   * Re-collapses the nodes captured by #snapshotCollapsedNodes() on the freshly rebuilt tree. The
   * `shiftColumnIndex` callback maps a pre-rebuild visual column index to its post-rebuild position.
   * Re-running the collapse reconstructs both the `isCollapsed` flag (header indicator) and the
   * `clonedTree` needed to expand the group later.
   *
   * @param {Array<{headerLevel: number, columnIndex: number}>} collapsedNodes The captured nodes.
   * @param {Function} shiftColumnIndex Maps an old visual column index to the new one.
   */
  #reapplyCollapsedNodes(
    collapsedNodes: { headerLevel: number, columnIndex: number }[],
    shiftColumnIndex: (columnIndex: number) => number
  ) {
    collapsedNodes.forEach(({ headerLevel, columnIndex }) => {
      this.triggerNodeModification('collapse', headerLevel, shiftColumnIndex(columnIndex));
    });
  }

  /**
   * Maps the current tree nodes with a callback.
   *
   * @param {Function} callback A function that is called for every tree node.
   * @returns {Array}
   */
  mapNodes(callback: Function) {
    return arrayReduce(this.#headersTree.getRoots(), (acc, rootNode) => {
      (rootNode as TreeNode).walkDown((node: TreeNode) => {
        const result: unknown = callback(node.data);

        if (result !== undefined) {
          (acc as unknown[]).push(result);
        }
      });

      return acc;
    }, []);
  }

  /**
   * Triggers an action from the NodeModifiers module.
   *
   * @param {string} action An action name to trigger.
   * @param {number} headerLevel Header level index.
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerNodeModification(
    action: string, headerLevel: number, columnIndex: number
  ): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } | undefined {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel) ?? 0;
    }

    const nodeToProcess = this.#headersTree.getNode(headerLevel, columnIndex);
    let actionResult;

    if (nodeToProcess) {
      actionResult = triggerNodeModification(action, nodeToProcess, columnIndex);

      this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
    }

    return actionResult ?? undefined;
  }

  /**
   * Triggers an action from the NodeModifiers module starting from the lowest header.
   *
   * @param {string} action An action name to trigger.
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerColumnModification(
    action: string, columnIndex: number
  ): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } | undefined {
    return this.triggerNodeModification(action, -1, columnIndex);
  }

  /**
   * Derives tree-node visibility state (colspan, crossHiddenColumns, isHidden) from an external
   * ColumnVisibility port, then regenerates the state matrix. Call this whenever the hiding map
   * changes (HiddenColumns, CollapsibleColumns) or after column sequence changes.
   *
   * @param {ColumnVisibility} columnVisibility The visibility port.
   */
  syncVisibility(columnVisibility: ColumnVisibility) {
    this.#lastColumnVisibility = columnVisibility;
    syncVisibilityOnTree(this.#headersTree.getRoots(), columnVisibility);
    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
  }

  /**
   * Re-applies the last column visibility adapter after a tree rebuild, so that mapState() and
   * mergeStateWith() calls from CollapsibleColumns do not discard visibility state set earlier.
   * The collapsed state is restored separately by #rebuildPreservingCollapse re-running the collapse.
   */
  #applySyncVisibility() {
    this.#deriveVisibility();
    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
  }

  /**
   * Re-derives tree-node visibility (colspan, isHidden, crossHiddenColumns) from the last column
   * visibility adapter WITHOUT regenerating the state matrix. Used as the first pass of
   * #rebuildPreservingCollapse, where the matrix would be immediately discarded by re-collapsing.
   */
  #deriveVisibility() {
    if (this.#lastColumnVisibility) {
      syncVisibilityOnTree(this.#headersTree.getRoots(), this.#lastColumnVisibility);
    }
  }

  /**
   * @memberof StateManager#
   * @function rowCoordsToLevel
   *
   * Translates row coordinates into header level.
   *
   * @param {number} rowIndex A visual row index.
   * @returns {number|null} Returns unsigned number.
   */
  rowCoordsToLevel(rowIndex: number): number | null {
    if (rowIndex >= 0) {
      return null;
    }

    const headerLevel = rowIndex + Math.max(this.getLayersCount(), 1);

    if (headerLevel < 0) {
      return null;
    }

    return headerLevel;
  }

  /**
   * @memberof StateManager#
   * @function levelToRowCoords
   *
   * Translates header level into row coordinates.
   *
   * @param {number} headerLevel Header level index.
   * @returns {number} Returns negative number.
   */
  levelToRowCoords(headerLevel: number): number | null {
    if (headerLevel < 0) {
      return null;
    }

    const rowIndex = headerLevel - Math.max(this.getLayersCount(), 1);

    if (rowIndex >= 0) {
      return null;
    }

    return rowIndex;
  }

  /**
   * Gets column header settings for a specified column and header index.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderSettings(headerLevel: number, columnIndex: number) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel) ?? 0;
    }

    if (headerLevel === null || headerLevel >= this.getLayersCount()) {
      return null;
    }

    return ((this.#stateMatrix[headerLevel] as unknown[])?.[columnIndex] ?? null) as HeaderNodeData | null;
  }

  /**
   * Gets tree data that is connected to the column header.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderTreeNodeData(headerLevel: number, columnIndex: number) {
    const node = this.getHeaderTreeNode(headerLevel, columnIndex);

    if (!node) {
      return null;
    }

    return {
      ...(node.data as HeaderNodeData),
    };
  }

  /**
   * Gets tree node that is connected to the column header.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {TreeNode|null}
   */
  getHeaderTreeNode(headerLevel: number, columnIndex: number): TreeNode | null {
    let resolvedLevel: number | null = headerLevel;

    if (headerLevel < 0) {
      resolvedLevel = this.rowCoordsToLevel(headerLevel);
    }

    if (resolvedLevel === null || resolvedLevel >= this.getLayersCount()) {
      return null;
    }

    const node = this.#headersTree.getNode(resolvedLevel, columnIndex);

    if (!node) {
      return null;
    }

    return node;
  }

  /**
   * Finds the most top header level of the column header.
   *
   * @param {number} columnIndexFrom A visual column index.
   * @param {number} [columnIndexTo] A visual column index.
   * @returns {number} Returns a header level in format -1 to -N.
   */
  findTopMostEntireHeaderLevel(columnIndexFrom: number, columnIndexTo = columnIndexFrom) {
    const columnsWidth = (columnIndexTo - columnIndexFrom) + 1;
    let atLeastOneRootFound = false;
    let headerLevel: number | null = null;

    for (let columnIndex = columnIndexFrom; columnIndex <= columnIndexTo; columnIndex++) {
      const rootNode = this.#headersTree.getRootByColumn(columnIndex);

      if (!rootNode) {
        break;
      }

      atLeastOneRootFound = true;

      // eslint-disable-next-line no-loop-func
      rootNode.walkDown((node: TreeNode) => {
        const {
          columnIndex: nodeColumnIndex,
          headerLevel: nodeHeaderLevel,
          origColspan,
          isHidden,
        } = node.data as HeaderNodeData;

        if (isHidden) {
          return;
        }

        if (origColspan <= columnsWidth &&
            nodeColumnIndex >= columnIndexFrom &&
            nodeColumnIndex + origColspan - 1 <= columnIndexTo &&
            (headerLevel === null || nodeHeaderLevel < headerLevel)) {

          headerLevel = nodeHeaderLevel;
        }
      }, TRAVERSAL_DF_PRE);
    }

    if (atLeastOneRootFound && headerLevel === null) {
      return -1;
    }

    return this.levelToRowCoords(headerLevel ?? 0);
  }

  /**
   * Finds the left-most column index where the nested header begins.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {number}
   */
  findLeftMostColumnIndex(headerLevel: number, columnIndex: number) {
    const {
      isRoot
    } = (this.getHeaderSettings(headerLevel, columnIndex) as HeaderNodeData | null) ?? { isRoot: true };

    if (isRoot) {
      return columnIndex;
    }

    let stepBackColumn = columnIndex - 1;

    while (stepBackColumn >= 0) {
      const {
        isRoot: isRootNode
      } = (this.getHeaderSettings(headerLevel, stepBackColumn) as HeaderNodeData | null) ?? { isRoot: true };

      if (isRootNode) {
        break;
      }

      stepBackColumn -= 1;
    }

    return stepBackColumn;
  }

  /**
   * Finds the right-most column index where the nested header ends.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {number}
   */
  findRightMostColumnIndex(headerLevel: number, columnIndex: number) {
    const {
      isRoot,
      origColspan,
    } = (this.getHeaderSettings(headerLevel, columnIndex) as HeaderNodeData | null) ?? { isRoot: true, origColspan: 1 };

    if (isRoot) {
      return columnIndex + origColspan - 1;
    }

    let stepForthColumn = columnIndex + 1;

    while (stepForthColumn < this.getColumnsCount()) {
      const {
        isRoot: isRootNode,
      } = (this.getHeaderSettings(headerLevel, stepForthColumn) as HeaderNodeData | null) ?? { isRoot: true };

      if (isRootNode) {
        break;
      }

      stepForthColumn += 1;
    }

    return stepForthColumn - 1;
  }

  /**
   * Gets a total number of headers levels.
   *
   * @returns {number}
   */
  getLayersCount() {
    return this.#sourceSettings.getLayersCount();
  }

  /**
   * Gets a total number of columns count.
   *
   * @returns {number}
   */
  getColumnsCount() {
    return this.#sourceSettings.getColumnsCount();
  }

  /**
   * Clears the column state manager to the initial state.
   */
  clear() {
    this.#stateMatrix = [];
    this.#sourceSettings.clear();
    this.#headersTree.clear();
    this.#lastColumnVisibility = null;
  }
}
