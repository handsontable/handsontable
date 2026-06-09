import type TreeNode from '../../../../../utils/dataStructures/tree';

/**
 * Traverses the tree nodes and calls a callback when no hidden node is found. The callback
 * is called with visual column index then.
 *
 * @param {TreeNode} node A tree node to traverse.
 * @param {Function} callback The callback function which will be called for each node.
 */
export function traverseHiddenNodeColumnIndexes(node: TreeNode, callback: Function) {
  node.walkDown(({ data, childs }: { data: Record<string, unknown>, childs: TreeNode[] }) => {
    if (!data.isHidden) {
      callback(data.columnIndex);

      if (childs.length === 0) {
        for (let i = 1; i < (data.colspan as number); i++) {
          callback((data.columnIndex as number) + i);
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
