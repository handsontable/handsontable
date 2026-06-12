import { arrayMap, arrayReduce } from '../../../helpers/array';
import SourceSettings from './sourceSettings';
import HeadersTree from './headersTree';
import { triggerNodeModification } from './nodeModifiers';
import { generateMatrix } from './matrixGenerator';
import { syncVisibilityOnTree } from './syncVisibility';
import { TRAVERSAL_DF_PRE } from '../../../utils/dataStructures/tree';

/**
 * The state manager is a source of truth for nested headers configuration.
 * The state generation process is divided into three stages.
 *
 *   +---------------------+  1. User-defined configuration normalization;
 *   │                     │  The source settings class normalizes and shares API for
 *   │   SourceSettings    │  raw settings passed by the developer. It is only consumed by
 *   │                     │  the header tree module.
 *   +---------------------+
 *             │
 *            \│/
 *   +---------------------+  2. Building a tree structure for validation and easier node manipulation;
 *   │                     │  The header tree generates a tree based on source settings for future
 *   │     HeadersTree     │  node manipulation (such as collapsible columns feature). While generating a tree
 *   │                     │  the source settings is checked to see if the configuration has overlapping headers.
 *   +---------------------+  If `true` the colspan matrix generation is skipped, overlapped headers are not supported.
 *             │
 *            \│/
 *   +---------------------+  3. Matrix generation;
 *   │                     │  Based on built trees the matrix generation is performed. That part of code
 *   │  matrix generation  │  generates an array structure similar to normalized data from the SourceSettings
 *   │                     │  but with the difference that this structure contains column settings which changed
 *   +---------------------+  during runtime (after the tree manipulation) e.q after collapse or expand column.
 *                            That settings describes how the TH element should be modified (colspan attribute,
 *                            CSS classes, etc) for a specific column and layer level.
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
  #sourceSettings = new SourceSettings();
  /**
   * The instance of the headers tree. The tree is generated after setting new configuration data.
   *
   * @private
   * @type {HeadersTree}
   */
  #headersTree = new HeadersTree(this.#sourceSettings);
  /**
   * Cached matrix which is generated from the tree structure.
   *
   * @private
   * @type {Array[]}
   */
  #stateMatrix = [[]];
  /**
   * The last column-visibility adapter passed to syncVisibility(). Stored so that
   * mapState()/mergeStateWith() can re-apply it after rebuilding the tree.
   *
   * @private
   * @type {import('./columnVisibility').ColumnVisibility|null}
   */
  #lastColumnVisibility = null;

  /**
   * Sets a new state for the nested headers plugin based on settings passed
   * directly to the plugin.
   *
   * @param {Array[]} nestedHeadersSettings The user-defined settings.
   * @returns {boolean} Returns `true` if the settings are processed correctly, `false` otherwise.
   */
  setState(nestedHeadersSettings) {
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
   * Sets columns limit to the state will be trimmed. All headers (colspans) which
   * overlap the column limit will be reduced to keep the structure solid.
   *
   * @param {number} columnsCount The number of columns to limit to.
   */
  setColumnsLimit(columnsCount) {
    this.#sourceSettings.setColumnsLimit(columnsCount);
  }

  /**
   * Merges settings with current plugin state.
   *
   * By default only foreign keys are merged with source state and passed to the tree. But only
   * known keys are exported to matrix.
   *
   * @param {object[]} settings An array of objects to merge with the current source settings.
   *                            It is a requirement that every object has `row` and `col` properties
   *                            which points to the specific header settings object.
   */
  mergeStateWith(settings) {
    const transformedSettings = arrayMap(settings, ({ row, ...rest }) => {
      return {
        row: row < 0 ? this.rowCoordsToLevel(row) : row,
        ...rest,
      };
    });

    const savedIsCollapsed = this.#snapshotIsCollapsed();

    this.#sourceSettings.mergeWith(transformedSettings);
    this.#headersTree.buildTree();
    this.#applySyncVisibility(savedIsCollapsed);
  }

  /**
   * Maps the current state with a callback. For each header settings the callback function
   * is called. If the function returns value that value is merged with the state.
   *
   * By default only foreign keys are merged with source state and passed to the tree. But only
   * known keys are exported to matrix.
   *
   * @param {Function} callback A function that is called for every header source settings.
   *                            Each time the callback is called, the returned value extends
   *                            header settings.
   */
  mapState(callback) {
    const savedIsCollapsed = this.#snapshotIsCollapsed();

    this.#sourceSettings.map(callback);
    this.#headersTree.buildTree();
    this.#applySyncVisibility(savedIsCollapsed);
  }

  /**
   * Maps the current tree nodes with a callback. For each node the callback function
   * is called. If the function returns value that value is added to returned array.
   *
   * @param {Function} callback A function that is called for every tree node.
   *                            Each time the callback is called, the returned value is
   *                            added to returned array.
   * @returns {Array}
   */
  mapNodes(callback) {
    return arrayReduce(this.#headersTree.getRoots(), (acc, rootNode) => {
      rootNode.walkDown((node) => {
        const result = callback(node.data);

        if (result !== undefined) {
          acc.push(result);
        }
      });

      return acc;
    }, []);
  }

  /**
   * Triggers an action (e.g. "collapse") from the NodeModifiers module. The module
   * modifies a tree structure in such a way as to obtain the correct structure consistent with the
   * called action.
   *
   * @param {string} action An action name to trigger.
   * @param {number} headerLevel Header level index (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerNodeModification(action, headerLevel, columnIndex) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel);
    }

    const nodeToProcess = this.#headersTree.getNode(headerLevel, columnIndex);
    let actionResult;

    if (nodeToProcess) {
      actionResult = triggerNodeModification(action, nodeToProcess, columnIndex);

      // TODO (perf-tip): Trigger matrix generation once after multiple node modifications.
      this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
    }

    return actionResult;
  }

  /**
   * Triggers an action (e.g. "hide-column") from the NodeModifiers module. The action is
   * triggered starting from the lowest header. The module modifies a tree structure in
   * such a way as to obtain the correct structure consistent with the called action.
   *
   * @param {string} action An action name to trigger.
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerColumnModification(action, columnIndex) {
    return this.triggerNodeModification(action, -1, columnIndex);
  }

  /**
   * Derives tree-node visibility state (colspan, crossHiddenColumns, isHidden) from an external
   * ColumnVisibility port, then regenerates the state matrix. Call this whenever the hiding map
   * changes (HiddenColumns, CollapsibleColumns) or after column sequence changes.
   *
   * @param {import('./columnVisibility').ColumnVisibility} columnVisibility The visibility port.
   */
  syncVisibility(columnVisibility) {
    this.#lastColumnVisibility = columnVisibility;
    syncVisibilityOnTree(this.#headersTree.getRoots(), columnVisibility);
    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
  }

  /**
   * Saves the current isCollapsed state of every tree node, keyed by columnIndex.
   * Used by mapState()/mergeStateWith() to survive the tree rebuild that resets it.
   *
   * @private
   * @returns {Set<number>} Set of column indexes whose node had isCollapsed=true.
   */
  #snapshotIsCollapsed() {
    const collapsed = new Set();

    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown(({ data }) => {
        if (data.isCollapsed) {
          collapsed.add(data.columnIndex);
        }
      });
    });

    return collapsed;
  }

  /**
   * Re-applies the last column visibility adapter after a tree rebuild, so that mapState() and
   * mergeStateWith() calls from CollapsibleColumns do not discard visibility state set earlier.
   * Also restores isCollapsed flags that the tree rebuild resets to false.
   *
   * @private
   * @param {Set<number>} [savedIsCollapsed] Column indexes whose isCollapsed was true before rebuild.
   */
  #applySyncVisibility(savedIsCollapsed) {
    if (this.#lastColumnVisibility) {
      syncVisibilityOnTree(this.#headersTree.getRoots(), this.#lastColumnVisibility);
    }

    if (savedIsCollapsed && savedIsCollapsed.size > 0) {
      this.#headersTree.getRoots().forEach((rootNode) => {
        rootNode.walkDown(({ data }) => {
          if (savedIsCollapsed.has(data.columnIndex)) {
            data.isCollapsed = true;
          }
        });
      });
    }

    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @memberof StateManager#
   * @function rowCoordsToLevel
   *
   * Translates row coordinates into header level. The row coordinates counts from -1 to -N
   * and describes headers counting from most closest to most distant from the table.
   * The header levels are counted from 0 to N where 0 describes most distant header
   * from the table.
   *
   *  Row coords             Header level
   *           +--------------+
   *       -3  │ A1 │ A1      │  0
   *           +--------------+
   *       -2  │ B1 │ B2 │ B3 │  1
   *           +--------------+
   *       -1  │ C1 │ C2 │ C3 │  2
   *           +==============+
   *           │    │    │    │
   *           +--------------+
   *           │    │    │    │
   *
   * @param {number} rowIndex A visual row index.
   * @returns {number|null} Returns unsigned number.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  rowCoordsToLevel(rowIndex) {
    if (rowIndex >= 0) {
      return null;
    }

    const headerLevel = rowIndex + Math.max(this.getLayersCount(), 1);

    if (headerLevel < 0) {
      return null;
    }

    return headerLevel;
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @memberof StateManager#
   * @function levelToRowCoords
   *
   * Translates header level into row coordinates. The row coordinates counts from -1 to -N
   * and describes headers counting from most closest to most distant from the table.
   * The header levels are counted from 0 to N where 0 describes most distant header
   * from the table.
   *
   *  Header level            Row coords
   *           +--------------+
   *        0  │ A1 │ A1      │  -3
   *           +--------------+
   *        1  │ B1 │ B2 │ B3 │  -2
   *           +--------------+
   *        2  │ C1 │ C2 │ C3 │  -1
   *           +==============+
   *           │    │    │    │
   *           +--------------+
   *           │    │    │    │
   *
   * @param {number} headerLevel Header level index.
   * @returns {number} Returns negative number.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  levelToRowCoords(headerLevel) {
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
   * Gets column header settings for a specified column and header index. The returned object contains
   * all information necessary for header renderers. It contains header label, colspan length, or hidden
   * flag.
   *
   * @param {number} headerLevel Header level (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderSettings(headerLevel, columnIndex) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel);
    }

    if (headerLevel === null || headerLevel >= this.getLayersCount()) {
      return null;
    }

    return this.#stateMatrix[headerLevel]?.[columnIndex] ?? null;
  }

  /**
   * Gets tree data that is connected to the column header. The returned object contains all information
   * necessary for modifying tree structure (column collapsing, hiding, etc.). It contains a header
   * label, colspan length, or visual column index that indicates which column index the node is rendered from.
   *
   * @param {number} headerLevel Header level (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderTreeNodeData(headerLevel, columnIndex) {
    const node = this.getHeaderTreeNode(headerLevel, columnIndex);

    if (!node) {
      return null;
    }

    return {
      ...node.data,
    };
  }

  /**
   * Gets tree node that is connected to the column header.
   *
   * @param {number} headerLevel Header level (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {TreeNode|null}
   */
  getHeaderTreeNode(headerLevel, columnIndex) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel);
    }

    if (headerLevel === null || headerLevel >= this.getLayersCount()) {
      return null;
    }

    const node = this.#headersTree.getNode(headerLevel, columnIndex);

    if (!node) {
      return null;
    }

    return node;
  }

  /**
   * Finds the most top header level of the column header that is rendered entirely within
   * the passed visual columns range. If multiple columns headers are found within the range the
   * most top header level value will be returned.
   *
   * @param {number} columnIndexFrom A visual column index.
   * @param {number} [columnIndexTo] A visual column index.
   * @returns {number} Returns a header level in format -1 to -N.
   */
  findTopMostEntireHeaderLevel(columnIndexFrom, columnIndexTo = columnIndexFrom) {
    const columnsWidth = (columnIndexTo - columnIndexFrom) + 1;
    let atLeastOneRootFound = false;
    let headerLevel = null;

    for (let columnIndex = columnIndexFrom; columnIndex <= columnIndexTo; columnIndex++) {
      const rootNode = this.#headersTree.getRootByColumn(columnIndex);

      if (!rootNode) {
        break;
      }

      atLeastOneRootFound = true;

      // eslint-disable-next-line
      rootNode.walkDown((node) => {
        const {
          columnIndex: nodeColumnIndex,
          headerLevel: nodeHeaderLevel,
          origColspan,
          isHidden,
        } = node.data;

        if (isHidden) {
          return;
        }

        // if the header fits entirely within the columns range get and save the node header level
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
   * The method is helpful in cases where the column index targets in-between currently
   * collapsed column. In that case, the method returns the left-most column index
   * where the nested header begins.
   *
   * @param {number} headerLevel Header level (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {number}
   */
  findLeftMostColumnIndex(headerLevel, columnIndex) {
    const {
      isRoot
    } = this.getHeaderSettings(headerLevel, columnIndex) ?? { isRoot: true };

    if (isRoot) {
      return columnIndex;
    }

    let stepBackColumn = columnIndex - 1;

    while (stepBackColumn >= 0) {
      const {
        isRoot: isRootNode
      } = this.getHeaderSettings(headerLevel, stepBackColumn) ?? { isRoot: true };

      if (isRootNode) {
        break;
      }

      stepBackColumn -= 1;
    }

    return stepBackColumn;
  }

  /**
   * The method is helpful in cases where the column index targets in-between currently
   * collapsed column. In that case, the method returns the right-most column index
   * where the nested header ends.
   *
   * @param {number} headerLevel Header level (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {number}
   */
  findRightMostColumnIndex(headerLevel, columnIndex) {
    const {
      isRoot,
      origColspan,
    } = this.getHeaderSettings(headerLevel, columnIndex) ?? { isRoot: true, origColspan: 1 };

    if (isRoot) {
      return columnIndex + origColspan - 1;
    }

    let stepForthColumn = columnIndex + 1;

    while (stepForthColumn < this.getColumnsCount()) {
      const {
        isRoot: isRootNode,
      } = this.getHeaderSettings(headerLevel, stepForthColumn) ?? { isRoot: true };

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
