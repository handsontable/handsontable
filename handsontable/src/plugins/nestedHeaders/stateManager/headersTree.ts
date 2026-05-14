import { arrayEach } from '../../../helpers/array';
import TreeNode from '../../../utils/dataStructures/tree';
import SourceSettings from './sourceSettings';

/**
 * Interface representing the base header settings shape.
 */
export interface HeaderSettings {
  label: string;
  colspan: number;
  origColspan: number;
  rowspan?: number;
  origRowspan?: number;
  collapsible: boolean;
  isCollapsed: boolean;
  crossHiddenColumns: number[];
  isHidden: boolean;
  isRoot: boolean;
  isPlaceholder: boolean;
  isRowspanPlaceholder?: boolean;
  headerClassNames: string[];
  [key: string]: unknown;
}

/**
 * Interface representing header node data in the tree
 * (extends base settings with tree-specific properties).
 */
export interface HeaderNodeData extends HeaderSettings {
  headerLevel: number;
  columnIndex: number;
}

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @private
 * @class HeadersTree
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export default class HeadersTree {
  /**
   * The collection of nested headers settings structured into trees.
   *
   * @private
   * @type {Map<number, TreeNode>}
   */
  readonly #rootNodes = new Map();
  /**
   * A map that translates the visual column indexes.
   *
   * @private
   * @type {Map<number, number>}
   */
  readonly #rootsIndex = new Map();
  /**
   * The instance of the SourceSettings class.
   *
   * @private
   * @type {SourceSettings}
   */
  readonly #sourceSettings: SourceSettings | null = null;

  constructor(sourceSettings: SourceSettings) {
    this.#sourceSettings = sourceSettings;
  }

  /**
   * Gets an array of the all root nodes.
   *
   * @returns {TreeNode[]}
   */
  getRoots() {
    return Array.from(this.#rootNodes.values());
  }

  /**
   * Gets a root node by specified visual column index.
   *
   * @param {number} columnIndex A visual column index.
   * @returns {TreeNode|undefined}
   */
  getRootByColumn(columnIndex: number) {
    let node;

    if (this.#rootsIndex.has(columnIndex)) {
      node = this.#rootNodes.get(this.#rootsIndex.get(columnIndex));
    }

    return node;
  }

  /**
   * Gets a tree node by its position in the grid settings.
   *
   * @param {number} headerLevel Header level index.
   * @param {number} columnIndex A visual column index.
   * @returns {TreeNode|undefined}
   */
  getNode(headerLevel: number, columnIndex: number) {
    const rootNode = this.getRootByColumn(columnIndex);

    if (!rootNode) {
      return;
    }

    // Normalize the visual column index to a 0-based system for a specific "box" defined
    // by root node colspan width.
    const normColumnIndex = columnIndex - this.#rootsIndex.get(columnIndex);
    let columnCursor = 0;
    let treeNode;

    // Collect all parent nodes that depend on the collapsed node.
    rootNode.walkDown((node: TreeNode) => {
      const { origColspan, headerLevel: nodeHeaderLevel } = node.data as HeaderNodeData;

      if (headerLevel === nodeHeaderLevel) {
        if (normColumnIndex >= columnCursor && normColumnIndex <= columnCursor + origColspan - 1) {
          treeNode = node;
          treeNode.data.isRoot = columnIndex === treeNode.data.columnIndex;

          return false; // Cancel tree traversing.
        }

        columnCursor += origColspan;
      }
    });

    return treeNode;
  }

  /**
   * Builds (or rebuilds if called again) root nodes indexes.
   */
  rebuildTreeIndex() {
    let columnIndex = 0;

    this.#rootsIndex.clear();

    arrayEach(this.#rootNodes, ([, { data: { colspan } }]) => {
      // Map tree range (colspan range/width) into visual column index of the root node.
      for (let i = columnIndex; i < columnIndex + colspan; i++) {
        this.#rootsIndex.set(i, columnIndex);
      }

      columnIndex += colspan;
    });
  }

  /**
   * Builds trees based on SourceSettings class.
   */
  buildTree() {
    this.clear();

    const columnsCount = this.#sourceSettings!.getColumnsCount();
    let columnIndex = 0;

    while (columnIndex < columnsCount) {
      const columnSettings = this.#sourceSettings!.getHeaderSettings(0, columnIndex) as HeaderSettings;
      const rootNode = new TreeNode(undefined as unknown);

      this.#rootNodes.set(columnIndex, rootNode);
      this.buildLeaves(rootNode, columnIndex, 0, columnSettings.origColspan);

      columnIndex += columnSettings.origColspan;
    }

    this.rebuildTreeIndex();
  }

  /**
   * Builds leaves for specified tree node.
   *
   * @param {TreeNode} parentNode A node to which the leaves applies.
   * @param {number} columnIndex A visual column index.
   * @param {number} headerLevel Currently processed header level.
   * @param {number} [extractionLength=1] Determines column extraction length for node children.
   */
  buildLeaves(parentNode: TreeNode, columnIndex: number, headerLevel: number, extractionLength = 1) {
    const columnsSettings = this.#sourceSettings!.getHeadersSettings(headerLevel, columnIndex, extractionLength);

    headerLevel += 1;

    arrayEach(columnsSettings, (rawColumnSettings) => {
      const columnSettings = rawColumnSettings as HeaderSettings;
      const nodeData = {
        ...columnSettings,
        /**
         * The header level (tree node depth level).
         *
         * @type {number}
         */
        headerLevel: headerLevel - 1,
        /**
         * A visual column index.
         *
         * @type {number}
         */
        columnIndex,
      };
      let node;

      if (headerLevel === 1) { // fill the root node
        parentNode.data = nodeData;
        node = parentNode;

      } else {
        node = new TreeNode(nodeData);

        parentNode.addChild(node);
      }

      if (headerLevel < this.#sourceSettings!.getLayersCount()) {
        this.buildLeaves(node, columnIndex, headerLevel, columnSettings.origColspan);
      }

      columnIndex += columnSettings.origColspan;
    });
  }

  /**
   * Clears the tree to the initial state.
   */
  clear() {
    this.#rootNodes.clear();
    this.#rootsIndex.clear();
  }
}
