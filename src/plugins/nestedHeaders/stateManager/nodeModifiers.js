import { arrayEach } from '../../../helpers/array';

/**
 * The NodeModifiers module is responsible for the modification of a tree
 * structure in a way to achieve new column headers state.
 *
 * @class NodeModifiers
 * @plugin NestedHeaders
 */
export default class NodeModifiers {
  static AVAILABLE_ACTIONS = ['collapse', 'expand'];

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @memberof NodeModifiers#
   * @function collapseNode
   * Collapsing a node is a process where the processing node is collapsed
   * to the colspan width of the first child. All node children, except the
   * first one, are hidden. To prevent losing a current state of node children
   * on the right, all nodes are cloned (and restored while expanding), and
   * only then original nodes are modified (hidden in this case).
   *
   * @param {TreeNode} nodeToProcess A tree node to process.
   * @returns {object} result Returns an object with properties:
   *                          - rollbackModification: The function that
   *                          rollbacks the tree to the previous state.
   *                          - affectedColumns: The list of the visual column
   *                          indexes which are affected. That list is passed
   *                          to the hiddens column logic.
   *                          - colspanCompensation: The number of colspan by
   *                          which the processed node colspan was reduced.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  collapseNode(nodeToProcess) {
    const { data: nodeData, childs: nodeChilds } = nodeToProcess;

    if (nodeData.isCollapsed === true || nodeData.isHidden === true || nodeData.origColspan <= 1) {
      return {
        rollbackModification: () => {},
        affectedColumns: [],
        colspanCompensation: 0,
      };
    }

    const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess);

    if (isNodeReflected) {
      return this.collapseNode(nodeChilds[0]);
    }

    nodeData.isCollapsed = true;

    const allLeavesExceptMostLeft = nodeChilds.slice(1);
    const affectedColumns = new Set();

    if (allLeavesExceptMostLeft.length > 0) {
      arrayEach(allLeavesExceptMostLeft, (node) => {
        traverseHiddenNodeColumnIndexes(node, (nodeColumnIndex) => {
          affectedColumns.add(nodeColumnIndex);
        });

        // Clone the tree to preserve original tree state after header expanding.
        node.data.clonedTree = node.cloneTree();

        // Hide all leaves except the first leaf on the left (on headers context hide all
        // headers on the right).
        node.walkDown(({ data }) => {
          data.isHidden = true;
        });
      });

    } else {
      // Add column to "affected" started from 1. The header without children can not be
      // collapsed so the first have to be visible (untouched).
      for (let i = 1; i < nodeData.origColspan; i++) {
        affectedColumns.add(nodeData.columnIndex + i);
      }
    }

    // Calculate by how many colspan it needs to reduce the headings to match them to
    // the first child colspan width.
    const colspanCompensation = nodeData.colspan - (getFirstChildProperty(nodeToProcess, 'colspan') ?? 1);

    nodeToProcess.walkUp((node) => {
      const { data } = node;

      data.colspan -= colspanCompensation;

      if (data.colspan <= 1) {
        data.colspan = 1;
        data.isCollapsed = true;

      } else if (isNodeReflectsFirstChildColspan(node)) {
        data.isCollapsed = getFirstChildProperty(node, 'isCollapsed');
      }
    });

    return {
      rollbackModification: () => this.expandNode(nodeToProcess),
      affectedColumns: Array.from(affectedColumns),
      colspanCompensation,
    };
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @memberof NodeModifiers#
   * @function expandNode
   * Expanding a node is a process where the processing node is expanded to
   * its original colspan width. To restore an original state of all node
   * children on the right, the modified nodes are replaced with the cloned
   * nodes (they were cloned while collapsing).
   *
   * @param {TreeNode} nodeToProcess A tree node to process.
   * @returns {object} result Returns an object with properties:
   *                          - rollbackModification: The function that
   *                          rollbacks the tree to the previous state.
   *                          - affectedColumns: The list of the visual column
   *                          indexes which are affected. That list is passed
   *                          to the hiddens column logic.
   *                          - colspanCompensation: The number of colspan by
   *                          which the processed node colspan was increased.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  expandNode(nodeToProcess) {
    const { data: nodeData, childs: nodeChilds } = nodeToProcess;

    if (nodeData.isCollapsed === false || nodeData.isHidden === true || nodeData.origColspan <= 1) {
      return {
        rollbackModification: () => {},
        affectedColumns: [],
        colspanCompensation: 0,
      };
    }

    const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess);

    if (isNodeReflected) {
      return this.expandNode(nodeChilds[0]);
    }

    nodeData.isCollapsed = false;

    const allLeavesExceptMostLeft = nodeChilds.slice(1);
    const affectedColumns = new Set();
    let colspanCompensation = 0;

    if (allLeavesExceptMostLeft.length > 0) {
      arrayEach(allLeavesExceptMostLeft, (node) => {
        // Restore original state of the collapsed headers.
        node.replaceTreeWith(node.data.clonedTree);
        node.data.clonedTree = null;

        const leafData = node.data;

        // Calculate by how many colspan it needs to increase the headings to match them to
        // the colspan width of all its children.
        colspanCompensation += leafData.colspan;

        traverseHiddenNodeColumnIndexes(node, (nodeColumnIndex) => {
          affectedColumns.add(nodeColumnIndex);
        });
      });

    } else {
      const { colspan, origColspan, columnIndex } = nodeData;

      // In a case when the node doesn't have any children restore the colspan width to
      // its original state.
      colspanCompensation = origColspan - colspan;

      // Add column to "affected" started from 1. The header without children can not be
      // collapsed so the first column is already visible and we shouldn't touch it.
      for (let i = 1; i < origColspan; i++) {
        affectedColumns.add(columnIndex + i);
      }
    }

    nodeToProcess.walkUp((node) => {
      const { data } = node;

      data.colspan += colspanCompensation;

      if (data.colspan >= data.origColspan) {
        data.colspan = data.origColspan;
        data.isCollapsed = false;

      } else if (isNodeReflectsFirstChildColspan(node)) {
        data.isCollapsed = getFirstChildProperty(node, 'isCollapsed');
      }
    });

    return {
      rollbackModification: () => this.collapseNode(nodeToProcess),
      affectedColumns: Array.from(affectedColumns),
      colspanCompensation,
    };
  }

  /**
   * An entry point for triggering a node modifiers. If the triggered action
   * does not exist the exception is thrown.
   *
   * @param {string} actionName An action name to trigger.
   * @param {TreeNode} nodeToProcess A tree node to process.
   * @returns {object}
   */
  triggerAction(actionName, nodeToProcess) {
    if (!NodeModifiers.AVAILABLE_ACTIONS.includes(actionName)) {
      throw new Error(`The node modifier action ("${actionName}") does not exist.`);
    }

    return this[`${actionName}Node`](nodeToProcess);
  }
}

/**
 * Traverses the tree nodes and calls a callback when no hidden node is found. The callback
 * is called with visual column index then.
 *
 * @param {TreeNode} node A tree node to traverse.
 * @param {Function} callback The callback function which will be called for each node.
 */
function traverseHiddenNodeColumnIndexes(node, callback) {
  node.walkDown(({ data, childs }) => {
    if (!data.isHidden) {
      callback(data.columnIndex);

      if (childs.length === 0) {
        for (let i = 1; i < data.colspan; i++) {
          callback(data.columnIndex + i);
        }
      }
    }
  });
}

/**
 * A tree helper for retrieving a data from the first child.
 *
 * @param {TreeNode} node A tree node to check.
 * @param {string} propertyName A name of the property whose value you want to get.
 * @returns {*}
 */
function getFirstChildProperty({ childs }, propertyName) {
  if (childs.length === 0) {
    return;
  }

  return childs[0].data[propertyName];
}

/**
 * A tree helper which checks if passed node has the same original colspan as its
 * first child. In that case the node is treated as "mirrored" or "reflected" every
 * action performed on one of that nodes should be reflected to other "mirrored" node.
 *
 * In that case nodes A1 and A2 are "refelcted"
 *   +----+----+----+----+
 *   | A1      | B1      |
 *   +----+----+----+----+
 *   | A2      | B2 | B3 |
 *   +----+----+----+----+.
 *
 * @param {TreeNode} node A tree node to check.
 * @returns {boolean}
 */
function isNodeReflectsFirstChildColspan(node) {
  return getFirstChildProperty(node, 'origColspan') === node.data.origColspan;
}
