import type TreeNode from '../../../../../utils/dataStructures/tree';

/**
 * Collects the grid column indexes a node "exposes" to its parent - the columns that become newly
 * hidden when an ancestor collapses, and are handed back when it expands.
 *
 * A column owned by an inner collapse (a descendant `isCollapsed` node's collapsed-away span) is
 * skipped - it belongs to that inner collapse, so an outer collapse/expand must leave it untouched
 * (otherwise expanding the outer group would blow open every nested collapse). A column hidden only
 * by an external source (e.g. HiddenColumns) is still exposed, so a collapse can own it and the
 * group stays collapsed even if that external hide is later removed.
 *
 * @param {TreeNode} node A tree node to traverse.
 * @param {Function} callback Called with each exposed visual column index.
 */
export function traverseExposedColumnIndexes(node: TreeNode, callback: Function) {
  const { data, childs } = node as unknown as
    { data: Record<string, unknown>, childs: TreeNode[] };

  if (data.isCollapsed) {
    if (childs.length > 0) {
      // A collapsed group shows only its first visible child; the rest is owned by its own collapse.
      const representative = childs.find(
        ({ data: childData }) => !(childData as unknown as Record<string, unknown>).isHidden
      );

      if (representative) {
        traverseExposedColumnIndexes(representative, callback);
      }

    } else {
      // A collapsed wide header exposes only its current (representative) columns.
      for (let i = 0; i < (data.colspan as number); i++) {
        callback((data.columnIndex as number) + i);
      }
    }

    return;
  }

  if (childs.length === 0) {
    // A non-collapsed leaf exposes its whole span, including columns hidden by an external source.
    for (let i = 0; i < (data.origColspan as number); i++) {
      callback((data.columnIndex as number) + i);
    }

    return;
  }

  childs.forEach(child => traverseExposedColumnIndexes(child, callback));
}

/**
 * A tree helper for retrieving a data from the first child.
 *
 * @param {TreeNode} node A tree node to check.
 * @param {string} propertyName A name of the property whose value you want to get.
 * @returns {*}
 */
export function getFirstChildProperty(
  { childs }: { childs: { data: Record<string, unknown> }[] }, propertyName: string
) {
  if (childs.length === 0) {
    return;
  }

  return childs[0].data[propertyName];
}

/**
 * A tree helper which checks if passed node has the same original colspan as its
 * first child.
 *
 * @param {TreeNode} node A tree node to check.
 * @returns {boolean}
 */
export function isNodeReflectsFirstChildColspan(
  node: { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] }
) {
  return getFirstChildProperty(node, 'origColspan') === node.data.origColspan;
}
