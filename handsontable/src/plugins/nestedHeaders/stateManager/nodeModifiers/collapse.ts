import { arrayEach } from '../../../../helpers/array';
import { expandNode } from './expand';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';
import type TreeNode from '../../../../utils/dataStructures/tree';
import type { HeaderNodeData } from '../headersTree';

type NodeWithData = { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] };
type NodeWithChilds = { childs: { data: Record<string, unknown> }[] };

/**
 * Collapsing a node is a process where the processing node is collapsed
 * to the colspan width of the first child.
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties.
 */
export function collapseNode(
  nodeToProcess: { data: HeaderNodeData, childs: TreeNode[] }
): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess as NodeWithData);

  if (isNodeReflected) {
    return collapseNode(nodeChilds[0] as unknown as { data: HeaderNodeData, childs: TreeNode[] });
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
      const treeNode = node as TreeNode;

      traverseHiddenNodeColumnIndexes(treeNode, (gridColumnIndex: number) => {
        affectedColumns.add(gridColumnIndex);
      });

      // Clone the tree to preserve original tree state after header expanding.
      treeNode.data.clonedTree = treeNode.cloneTree();

      // Hide all leaves of the children that follow the representative (on headers context
      // hide all headers on the right).
      treeNode.walkDown(({ data }: { data: Record<string, unknown> }) => {
        data.isHidden = true;
      });
    });

    // Calculate by how many colspan it needs to reduce the headings to match them to
    // the representative (first visible) child colspan width.
    colspanCompensation = nodeData.colspan -
      ((nodeChilds[firstVisibleChildIndex].data.colspan as number | undefined) ?? 1);

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

  (nodeToProcess as unknown as TreeNode).walkUp((node: TreeNode) => {
    const data = node.data as HeaderNodeData;

    data.colspan -= colspanCompensation;

    if (data.colspan <= 1) {
      data.colspan = 1;
      data.isCollapsed = true;

    } else if (isNodeReflectsFirstChildColspan(node as NodeWithData)) {
      data.isCollapsed = getFirstChildProperty(node as NodeWithChilds, 'isCollapsed') as boolean;
    }
  });

  return {
    rollbackModification: () => expandNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
