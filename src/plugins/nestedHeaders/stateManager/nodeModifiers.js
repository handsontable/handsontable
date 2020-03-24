import { arrayEach } from '../../../helpers/array';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @type {NodeModifiers}
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export default class NodeModifiers {
  static AVAILABLE_ACTIONS = ['collapse', 'expand'];

  /**
   * @param {TreeNode} nodeToProcess A tree node to process.
   * @returns {object}
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

      // Hide all leaves except the first leaf on the left (on headers context hide all headers on the right).
      node.walkDown(({ data }) => {
        data.hidden = true;
      });
    });

    const { colspan, origColspan, columnIndex } = nodeData;

    // Calculate by how many colspan it needs to reduce the headings to match them to the
    // first child colspan width.
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
   * @param {TreeNode} nodeToProcess A tree node to process.
   * @returns {object}
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
 * @param {TreeNode} node A tree node to check.
 * @returns {boolean}
 */
function isNodeReflectsFirstChildColspan(node) {
  return getFirstChildProperty(node, 'origColspan') === node.data.origColspan;
}
