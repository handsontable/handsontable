import type TreeNode from '../../../utils/dataStructures/tree';
import type { HeaderNodeData } from './headersTree';
import type { ColumnVisibility } from './columnVisibility';

/**
 * Derives visibility state for every node in the headers tree from a ColumnVisibility port.
 *
 * For each node the following fields are updated:
 *  - `crossHiddenColumns` - visual column indices within the node's span that are currently hidden
 *  - `colspan`            - origColspan minus the number of hidden columns in the span
 *  - `isHidden`           - true when colspan drops to zero (all columns in span are hidden)
 *
 * This replaces the old hide-column / show-column node modifiers, which could not handle
 * external hides inside collapsible groups (DEV-294).
 */
export function syncVisibilityOnTree(roots: TreeNode<HeaderNodeData>[], columnVisibility: ColumnVisibility) {
  roots.forEach((rootNode) => {
    rootNode.walkDown((node) => {
      const data = node.data;
      const { columnIndex, origColspan } = data;
      const crossHiddenColumns: number[] = [];

      for (let i = columnIndex; i < columnIndex + origColspan; i++) {
        if (!columnVisibility.isVisible(i)) {
          crossHiddenColumns.push(i);
        }
      }

      data.crossHiddenColumns = crossHiddenColumns;
      data.colspan = origColspan - crossHiddenColumns.length;
      data.isHidden = data.colspan === 0;
    });
  });
}
