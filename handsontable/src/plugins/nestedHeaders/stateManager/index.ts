import { arrayMap, arrayReduce } from '../../../helpers/array';
import SourceSettings from './sourceSettings';
import HeadersTree, { HeaderNodeData } from './headersTree';
import { triggerNodeModification } from './nodeModifiers';
import { generateMatrix } from './matrixGenerator';
import TreeNode, { TRAVERSAL_DF_PRE } from '../../../utils/dataStructures/tree';

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

    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());

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
  mergeStateWith(settings: { row: number, [key: string]: unknown }[]) {
    const transformedSettings = arrayMap(settings, ({ row, ...rest }) => {
      return {
        row: row < 0 ? this.rowCoordsToLevel(row) : row,
        ...rest,
      };
    });

    this.#sourceSettings.mergeWith(transformedSettings as { row: number; col: number; [key: string]: unknown }[]);
    this.#headersTree.buildTree();
    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
  }

  /**
   * Maps the current state with a callback.
   *
   * @param {Function} callback A function that is called for every header source settings.
   */
  mapState(callback: Function) {
    this.#sourceSettings.map(callback);
    this.#headersTree.buildTree();
    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
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
        const result = callback(node.data);

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
  triggerNodeModification(action: string, headerLevel: number, columnIndex: number) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel);
    }

    const nodeToProcess = this.#headersTree.getNode(headerLevel, columnIndex);
    let actionResult;

    if (nodeToProcess) {
      actionResult = triggerNodeModification(action, nodeToProcess, columnIndex);

      this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
    }

    return actionResult;
  }

  /**
   * Triggers an action from the NodeModifiers module starting from the lowest header.
   *
   * @param {string} action An action name to trigger.
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerColumnModification(action: string, columnIndex: number) {
    return this.triggerNodeModification(action, -1, columnIndex);
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @memberof StateManager#
   * @function rowCoordsToLevel
   *
   * Translates row coordinates into header level.
   *
   * @param {number} rowIndex A visual row index.
   * @returns {number|null} Returns unsigned number.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
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

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @memberof StateManager#
   * @function levelToRowCoords
   *
   * Translates header level into row coordinates.
   *
   * @param {number} headerLevel Header level index.
   * @returns {number} Returns negative number.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
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
      headerLevel = this.rowCoordsToLevel(headerLevel);
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
      ...node.data,
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

      // eslint-disable-next-line
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
  }
}
