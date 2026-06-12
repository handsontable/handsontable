import { arrayEach } from '../../../../helpers/array';
import { expandNode } from './expand';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';

/**
 * Collapsing a node is a process where the processing node is collapsed
 * to the colspan width of the first child. All node children, except the
 * first one, are hidden. To prevent losing a current state of node children
 * on the right, all nodes are cloned (and restored while expanding), and
 * only then original nodes are modified (hidden in this case).
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties:
 *                    - rollbackModification: The function that rollbacks
 *                      the tree to the previous state.
 *                    - affectedColumns: The list of the visual column
 *                      indexes which are affected. That list is passed
 *                      to the hiddens column logic.
 *                    - colspanCompensation: The number of colspan by
 *                      which the processed node colspan was reduced.
 */
export function collapseNode(nodeToProcess) {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess);

  if (isNodeReflected) {
    return collapseNode(nodeChilds[0]);
  }

  const affectedColumns = new Set();
  let colspanCompensation = 0;

  if (nodeChilds.length > 0) {
    // Keep the first *visible* child as the representative and hide the visible children that
    // follow it. Using the first visible child (instead of always the structurally-first child)
    // means a group whose leading children are already hidden (by collapse or by HiddenColumns)
    // never collapses into nothing - its last visible column and collapsible indicator survive.
    const firstVisibleChildIndex = nodeChilds.findIndex(({ data }) => !data.isHidden);
    const childsToHide = nodeChilds.filter(
      ({ data }, index) => index > firstVisibleChildIndex && data.isHidden === false
    );

    // Nothing left to collapse - the group is already reduced to its first visible child.
    if (firstVisibleChildIndex === -1 || childsToHide.length === 0) {
      return {
        rollbackModification: () => {},
        affectedColumns: [],
        colspanCompensation: 0,
      };
    }

    arrayEach(childsToHide, (node) => {
      traverseHiddenNodeColumnIndexes(node, (gridColumnIndex) => {
        affectedColumns.add(gridColumnIndex);
      });

      // Clone the tree to preserve original tree state after header expanding.
      node.data.clonedTree = node.cloneTree();

      // Hide all leaves of the children that follow the representative (on headers context
      // hide all headers on the right).
      node.walkDown(({ data }) => {
        data.isHidden = true;
      });
    });

    // Calculate by how many colspan it needs to reduce the headings to match them to
    // the representative (first visible) child colspan width.
    colspanCompensation = nodeData.colspan - (nodeChilds[firstVisibleChildIndex].data.colspan ?? 1);

  } else {
    // Node without children (a header wider than one column). Keep the first *visible* column
    // and mark the remaining visible columns of its span as affected.
    const { origColspan, columnIndex } = nodeData;
    const hiddenColumns = new Set(nodeData.crossHiddenColumns);
    const visibleColumns = [];

    for (let i = columnIndex; i < columnIndex + origColspan; i++) {
      if (!hiddenColumns.has(i)) {
        visibleColumns.push(i);
      }
    }

    // Nothing left to collapse - only the first visible column (or none) remains.
    if (visibleColumns.length <= 1) {
      return {
        rollbackModification: () => {},
        affectedColumns: [],
        colspanCompensation: 0,
      };
    }

    arrayEach(visibleColumns.slice(1), (gridColumnIndex) => {
      affectedColumns.add(gridColumnIndex);
    });

    colspanCompensation = visibleColumns.length - 1;
  }

  nodeData.isCollapsed = true;

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
    rollbackModification: () => expandNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
