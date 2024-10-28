/**
 * Traverses the tree nodes and calls a callback when no hidden node is found. The callback
 * is called with visual column index then.
 *
 * @param {TreeNode} node A tree node to traverse.
 * @param {Function} callback The callback function which will be called for each node.
 */
export function traverseHiddenNodeColumnIndexes(node, callback) {
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
export function getFirstChildProperty({ childs }, propertyName) {
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
 * In that case nodes A1 and A2 are "reflected"
 *   +----+----+----+----+
 *   | A1      | B1      |
 *   +----+----+----+----+
 *   | A2      | B2 | B3 |
 *   +----+----+----+----+.
 *
 * @param {TreeNode} node A tree node to check.
 * @returns {boolean}
 */
export function isNodeReflectsFirstChildColspan(node) {
  return getFirstChildProperty(node, 'origColspan') === node.data.origColspan;
}
