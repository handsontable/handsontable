import { arrayEach } from '../../../../helpers/array';
import { expandNode } from './expand';
import {
  getFirstChildProperty,
  isDeclarativeGroup,
  isNodeReflectsFirstChildColspan,
  traverseExposedColumnIndexes,
} from './utils/tree';
import type TreeNode from '../../../../utils/dataStructures/tree';
import type { HeaderNodeData } from '../headersTree';

/**
 * Collapsing a node is a process where the processing node is collapsed
 * to the colspan width of the first child.
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties.
 */
export function collapseNode(
  nodeToProcess: TreeNode<HeaderNodeData>
): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  // Declarative groups (issue #10243) only flip `isCollapsed` here. Which columns hide is derived
  // from the children's `visibleWhen` markers + this flag by StateManager#getVisibleWhenHiddenColumns
  // and applied through the CollapsibleColumns hiding map, so no first-child claiming or colspan
  // compensation is done. Keeping `isCollapsed` as the only persisted state lets the collapse survive
  // tree rebuilds via the snapshot/reapply path.
  if (isDeclarativeGroup(nodeToProcess)) {
    nodeData.isCollapsed = true;

    return {
      rollbackModification: () => expandNode(nodeToProcess),
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
    // Keep the first *visible* child as the representative and collapse every child that follows
    // it. Using the first visible child (instead of always the structurally-first child) means a
    // group whose leading children are already hidden (by collapse or by HiddenColumns) never
    // collapses into nothing - its last visible column and collapsible indicator survive.
    const firstVisibleChildIndex = nodeChilds.findIndex(({ data }) => !data.isHidden);
    const childsToHide = nodeChilds.filter((_, index) => index > firstVisibleChildIndex);

    // Nothing to collapse - there is no visible representative, or it is already the last child.
    if (firstVisibleChildIndex === -1 || childsToHide.length === 0) {
      return {
        rollbackModification: () => {},
        affectedColumns: [],
        colspanCompensation: 0,
      };
    }

    arrayEach(childsToHide, (treeNode) => {
      // Claim the columns this child exposes - everything it shows plus any columns hidden only by
      // an external source (e.g. HiddenColumns), but NOT columns owned by an inner collapse. This
      // lets the collapse own an already-externally-hidden column (so the group stays collapsed if
      // that hide is later removed) while leaving nested collapses untouched.
      traverseExposedColumnIndexes(treeNode, (gridColumnIndex: number) => {
        affectedColumns.add(gridColumnIndex);
      });

      // Clone the tree to preserve original tree state after header expanding.
      treeNode.data.clonedTree = treeNode.cloneTree();

      // Hide all leaves of the children that follow the representative (on headers context
      // hide all headers on the right).
      treeNode.walkDown(({ data }) => {
        data.isHidden = true;
      });
    });

    // Calculate by how many colspan it needs to reduce the headings to match them to
    // the representative (first visible) child colspan width.
    colspanCompensation = nodeData.colspan - nodeChilds[firstVisibleChildIndex].data.colspan;

  } else {
    // Node without children (a header wider than one column). Keep the first *visible* column
    // and mark the remaining visible columns of its span as affected.
    const { origColspan, columnIndex } = nodeData;
    const hiddenColumns = new Set(nodeData.crossHiddenColumns);
    const visibleColumns: number[] = [];

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
      data.isCollapsed = getFirstChildProperty(node, 'isCollapsed') as boolean;
    }
  });

  return {
    rollbackModification: () => expandNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
