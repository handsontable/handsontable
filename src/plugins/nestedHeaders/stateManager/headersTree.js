import { arrayEach } from '../../../helpers/array';
import TreeNode from '../../../utils/dataStructures/tree';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @class HeadersTree
 *
 * The header tree class keeps nested header settings in the tree
 * structure for easier node manipulation (e.q collapse or expand column).
 * That trees represent the current state of the nested headers. From the
 * trees, the matrix is generated for nested header renderers.
 *
 * The second role of the module is validation. While building the tree,
 * there is check whether the configuration contains overlapping
 * headers. If true, then the exception is thrown.
 *
 * The tree is static; it means that its column indexing never changes
 * even when a collapsing header is performed. The structure is based
 * on visual column indexes.
 *
 * For example, for that header configuration:
 *   +----+----+----+----+----+
 *   │ A1                │ A2 │
 *   +----+----+----+----+----+
 *   │ B1           │ B2 │ B3 │
 *   +----+----+----+----+----+
 *   │ C1      │ C2 │ C3 │ C4 │
 *   +----+----+----+----+----+
 *
 * The tree structures look like:
 *                (0)                      (4)           // a visual column index
 *                 │                        │
 *        .------(A1)------.              (A2)--.
 *   .--(B1)--.           (B2)--.              (B3)--.
 *  (C1)     (C2)              (C3)                 (C4)
 *
 * @plugin NestedHeaders
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export default class HeadersTree {
  /**
   * The collection of nested headers settings structured into trees. The root trees are stored
   * under the visual column index.
   *
   * @private
   * @type {Map<number, TreeNode>}
   */
  #rootNodes = new Map();
  /**
   * A map that translates the visual column indexes that intersect the range
   * defined by the header colspan width to the root index.
   *
   * @private
   * @type {Map<number, number>}
   */
  #rootsIndex = new Map();
  /**
   * The instance of the SourceSettings class.
   *
   * @private
   * @type {SourceSettings}
   */
  #sourceSettings = null;

  constructor(sourceSettings) {
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
  getRootByColumn(columnIndex) {
    let node;

    if (this.#rootsIndex.has(columnIndex)) {
      node = this.#rootNodes.get(this.#rootsIndex.get(columnIndex));
    }

    return node;
  }

  /**
   * Gets a tree node by its position in the grid settings.
   *
   * @param {number} headerLevel Header level index (there is support only for positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {TreeNode|undefined}
   */
  getNode(headerLevel, columnIndex) {
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
    rootNode.walkDown((node) => {
      const { data: { origColspan, headerLevel: nodeHeaderLevel } } = node;

      if (headerLevel === nodeHeaderLevel) {
        if (normColumnIndex >= columnCursor && normColumnIndex <= columnCursor + origColspan - 1) {
          treeNode = node;

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
   * Builds trees based on SourceSettings class. Calling a method causes clearing the tree state built
   * from the previous call.
   */
  buildTree() {
    this.clear();

    const columnsCount = this.#sourceSettings.getColumnsCount();
    let columnIndex = 0;

    while (columnIndex < columnsCount) {
      const columnSettings = this.#sourceSettings.getHeaderSettings(0, columnIndex);
      const rootNode = new TreeNode();

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
  buildLeaves(parentNode, columnIndex, headerLevel, extractionLength = 1) {
    const columnsSettings = this.#sourceSettings.getHeadersSettings(headerLevel, columnIndex, extractionLength);

    headerLevel += 1;

    arrayEach(columnsSettings, (columnSettings) => {
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

      if (headerLevel < this.#sourceSettings.getLayersCount()) {
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
