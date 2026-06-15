import { arrayEach } from '../../../../helpers/array';
import { collapseNode } from './collapse';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseExposedColumnIndexes,
} from './utils/tree';
import type TreeNode from '../../../../utils/dataStructures/tree';
import type { HeaderNodeData } from '../headersTree';

/**
 * Expanding a node is a process where the processing node is expanded to
 * its original colspan width.
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties.
 */
export function expandNode(
  nodeToProcess: TreeNode<HeaderNodeData>
): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (!nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess);

  if (isNodeReflected) {
    return expandNode(nodeChilds[0]);
  }

  nodeData.isCollapsed = false;

  // Restore exactly the children that this node's collapse hid - they are the ones carrying a
  // cloned tree. Mirrors the "first visible child" selection done in collapseNode, so children
  // hidden by an external source (or by their own collapse) are left untouched.
  const childsToRestore = nodeChilds.filter(({ data }) => data.clonedTree);
  const affectedColumns = new Set();
  let colspanCompensation = 0;

  if (childsToRestore.length > 0) {
    arrayEach(childsToRestore, (treeNode) => {
      // Restore original state of the collapsed headers. `replaceTreeWith` swaps in a fresh
      // `data` object, so read the restored colspan from `treeNode.data` *after* the replace -
      // the pre-replace reference still points at the (possibly hidden, colspan 0) old data.
      // `childsToRestore` is filtered to nodes that carry a cloned tree, so it is never null here.
      const clonedTree = treeNode.data.clonedTree!;

      treeNode.replaceTreeWith(clonedTree);

      const leafData = treeNode.data;

      leafData.clonedTree = null;

      // Calculate by how many colspan it needs to increase the headings.
      colspanCompensation += leafData.colspan;

      // Release exactly the columns this child exposes, mirroring the claim in collapseNode. The
      // restored subtree carries its inner `isCollapsed` flags, so columns owned by a nested
      // collapse are left hidden while the ones this collapse owned (visible or externally hidden)
      // are handed back.
      traverseExposedColumnIndexes(treeNode, (gridColumnIndex: number) => {
        affectedColumns.add(gridColumnIndex);
      });
    });

  } else if (nodeChilds.length === 0) {
    const {
      colspan,
      origColspan,
      columnIndex,
    } = nodeData;

    // In a case when the node doesn't have any children restore the colspan width.
    colspanCompensation = origColspan - colspan;

    // Add column to "affected" started from 1.
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
      data.isCollapsed = getFirstChildProperty(node, 'isCollapsed') as boolean;
    }
  });

  return {
    rollbackModification: () => collapseNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
