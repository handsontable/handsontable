/**
 * Depth-first pre-order strategy (https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR)).
 *
 * @type {string}
 */
export const TRAVERSAL_DF_PRE = 'DF-pre-order';
/**
 * @param {Function} callback A callback which will be called on each visited node.
 * @param {*} context A context to pass through.
 * @returns {boolean}
 */
export function depthFirstPreOrder(callback, context) {
  let continueTraverse = callback.call(context, this);

  for (let i = 0; i < this.childs.length; i++) {
    if (continueTraverse === false) {
      return false;
    }

    continueTraverse = depthFirstPreOrder.call(this.childs[i], callback, context);
  }

  return continueTraverse;
}

/**
 * Depth-first post-order strategy (https://en.wikipedia.org/wiki/Tree_traversal#Post-order_(NLR)).
 *
 * @type {string}
 */
export const TRAVERSAL_DF_POST = 'DF-post-order';
/**
 * @param {Function} callback A callback which will be called on each visited node.
 * @param {*} context A context to pass through.
 * @returns {boolean}
 */
function depthFirstPostOrder(callback, context) {
  for (let i = 0; i < this.childs.length; i++) {
    const continueTraverse = depthFirstPostOrder.call(this.childs[i], callback, context);

    if (continueTraverse === false) {
      return false;
    }
  }

  return callback.call(context, this);
}

/**
 * Breadth-first traversal strategy (https://en.wikipedia.org/wiki/Tree_traversal#Breadth-first_search_/_level_order).
 *
 * @type {string}
 */
export const TRAVERSAL_BF = 'BF';
/**
 * @param {Function} callback A callback which will be called on each visited node.
 * @param {*} context A context to pass through.
 */
function breadthFirst(callback, context) {
  const queue = [this];

  /**
   * Internal processor.
   */
  function process() {
    if (queue.length === 0) {
      return;
    }

    const node = queue.shift();

    queue.push(...node.childs);

    if (callback.call(context, node) !== false) {
      process();
    }
  }

  process();
}

/**
 * Default strategy for tree traversal.
 *
 * @type {string}
 */
const DEFAULT_TRAVERSAL_STRATEGY = TRAVERSAL_DF_PRE;
/**
 * Collection of all available tree traversal strategies.
 *
 * @type {Map<string, Function>}
 */
const TRAVERSAL_STRATEGIES = new Map([
  [TRAVERSAL_DF_PRE, depthFirstPreOrder],
  [TRAVERSAL_DF_POST, depthFirstPostOrder],
  [TRAVERSAL_BF, breadthFirst],
]);

/**
 * @class {TreeNode}
 */
export default class TreeNode {
  /**
   * A tree data.
   *
   * @type {object}
   */
  data = {};
  /**
   * A parent node.
   *
   * @type {TreeNode}
   */
  parent = null;
  /**
   * A tree leaves.
   *
   * @type {TreeNode[]}
   */
  childs = [];

  constructor(data) {
    this.data = data;
  }

  /**
   * Nodes traversing method which supports several strategies.
   *
   * @param {Function} callback The callback function which will be called for each node.
   * @param {string} [traversalStrategy=DEFAULT_TRAVERSAL_STRATEGY] Traversing strategy.
   */
  walkDown(callback, traversalStrategy = DEFAULT_TRAVERSAL_STRATEGY) {
    if (!TRAVERSAL_STRATEGIES.has(traversalStrategy)) {
      throw new Error(`Traversal strategy "${traversalStrategy}" does not exist`);
    }

    TRAVERSAL_STRATEGIES.get(traversalStrategy).call(this, callback, this);
  }

  /**
   * @param {Function} callback The callback function which will be called for each node.
   */
  walkUp(callback) {
    const context = this;
    const process = (node) => {
      const continueTraverse = callback.call(context, node);

      if (continueTraverse !== false && node.parent !== null) {
        process(node.parent);
      }
    }

    process(this);
  }
}
