import { arrayEach } from '../../../helpers/array';

/**
 * The NodeModifiers module is responsible for the modification of a tree
 * structure in a way to achieve new column headers state.
 *
 * @type {NodeModifiers}
 */
export default class NodeModifiers {
  static AVAILABLE_ACTIONS = ['collapse', 'expand'];

  /**
   * Collapsing a node is a process where the processing node is collapsed
   * to the colspan width of the first child. All node children, except the
   * first one, are hidden. To prevent losing a current state of node children
   * on the right, all nodes are cloned (and restored while expanding), and
   * only then original nodes are modified (hidden in this case).
   *
   * @param {TreeNode} nodeToProcess A tree node to process.
   * @returns {object} result The action result.
   * @returns {Function} result.rollbackModification The function that rollbacks the tree to the
   *                                                 previous state.
   * @returns {number[]} result.affectedColumns The list of the visual column indexes which are affected.
   *                                            That list is passed to the hiddens column logic.
   * @returns {number} result.colspanCompensation The number of colspan by which the processed node
   *                                              colspan was reduced.
   */
  collapseNode(nodeToProcess) {
    const { data: nodeData, childs: nodeChilds } = nodeToProcess;

    if (nodeData.isCollapsed === true || nodeData.hidden === true || nodeData.origColspan <= 1) {
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

    arrayEach(allLeavesExceptMostLeft, (node) => {
      // Clone the tree to preserve original tree state after header expanding.
      node.data.clonedTree = node.cloneTree();

      // Hide all leaves except the first leaf on the left (on headers context hide all
      // headers on the right).
      node.walkDown(({ data }) => {
        data.hidden = true;
      });
    });

    const { colspan, origColspan, columnIndex } = nodeData;

    // Calculate by how many colspan it needs to reduce the headings to match them to
    // the first child colspan width.
    const colspanCompensation = colspan - (getFirstChildProperty(nodeToProcess, 'colspan') ?? 1);

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

    const affectedColumns = new Set();
    const lastColumnIndex = columnIndex + origColspan - 1;
    const affectedColumnsLength = origColspan - nodeData.colspan;

    for (let i = 0; i < affectedColumnsLength; i++) {
      affectedColumns.add(lastColumnIndex - i);
    }

    return {
      rollbackModification: () => this.expandNode(nodeToProcess),
      affectedColumns: Array.from(affectedColumns),
      colspanCompensation,
    };
  }

  /**
   * Expanding a node is a process where the processing node is expanded to
   * its original colspan width. To restore an original state of all node
   * children on the right, the modified nodes are replaced with the cloned
   * nodes (they were cloned while collapsing).
   *
   * @param {TreeNode} nodeToProcess A tree node to process.
   * @returns {object} result The action result.
   * @returns {Function} result.rollbackModification The function that rollbacks the tree to the
   *                                                 previous state.
   * @returns {number[]} result.affectedColumns The list of the visual column indexes which are affected.
   *                                            That list is passed to the hidden columns logic.
   * @returns {number} result.colspanCompensation The number of colspan by which the processed node
   *                                              colspan was increased.
   */
  expandNode(nodeToProcess) {
    const { data: nodeData, childs: nodeChilds } = nodeToProcess;

    if (nodeData.isCollapsed === false || nodeData.hidden === true || nodeData.origColspan <= 1) {
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

    const { colspan, origColspan, columnIndex } = nodeData;
    const allLeavesExceptMostLeft = nodeChilds.slice(1);
    const affectedColumns = new Set();
    let colspanCompensation = 0;

    arrayEach(allLeavesExceptMostLeft, (node) => {
      // Restore original state of the collapsed headers.
      node.replaceTreeWith(node.data.clonedTree);
      node.data.clonedTree = null;

      const leafData = node.data;

      // Calculate by how many colspan it needs to increase the headings to match them to
      // the colspan width of all its children.
      colspanCompensation += leafData.colspan;

      for (let i = 0; i < leafData.colspan; i++) {
        affectedColumns.add(leafData.columnIndex + i);
      }
    });

    // Or if the compensation is equal to 0 (in a case when the node doesn't have any children)
    // restore the colspan width to its original state.
    if (colspanCompensation === 0) {
      colspanCompensation = origColspan - colspan;

      for (let i = 0; i < origColspan; i++) {
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
   * do not exists the exception is thrown.
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
 * first child. In that case the node is treated as "mirrored" or "reflected"
 * every action performed on one of that nodes should be reflected to other "mirrored"
 * node.
 *
 * In that case nodes A1 and A2 are "refelcted"
 *   +----+----+----+----+
 *   | A1      | B1      |
 *   +----+----+----+----+
 *   | A2      | B2 | B3 |
 *   +----+----+----+----+
 *
 * @param {TreeNode} node A tree node to check.
 * @returns {boolean}
 */
function isNodeReflectsFirstChildColspan(node) {
  return getFirstChildProperty(node, 'origColspan') === node.data.origColspan;
}
