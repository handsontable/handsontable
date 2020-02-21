/**
 * Depth-first pre-order
 *
 * https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR)
 *
 * @type {string}
 */
export const TRAVERSAL_DF_PRE = 'DF-pre-order';
/**
 * Depth-first post-order
 *
 * https://en.wikipedia.org/wiki/Tree_traversal#Post-order_(NLR)
 *
 * @type {string}
 */
export const TRAVERSAL_DF_POST = 'DF-post-order';
/**
 * Breadth-first traversal
 *
 * https://en.wikipedia.org/wiki/Tree_traversal#Breadth-first_search_/_level_order
 *
 * @type {string}
 */
export const TRAVERSAL_BF = 'BF';

const DEFAULT_TRAVERSAL_STRATEGY = TRAVERSAL_DF_PRE;
const TRAVERSAL_STRATEGIES = new Map([
  [TRAVERSAL_DF_PRE, depthFirstPreOrder],
  [TRAVERSAL_DF_POST, depthFirstPostOrder],
  [TRAVERSAL_BF, breadthFirst],
]);

export class TreeNode {
  data;
  childs = [];

  constructor(data) {
    this.data = data;
  }

  walk(callback, traversalStrategy = DEFAULT_TRAVERSAL_STRATEGY) {
    if (!TRAVERSAL_STRATEGIES.has(traversalStrategy)) {
      throw new Error(`Traversal strategy "${traversalStrategy}" does not exist`);
    }

    TRAVERSAL_STRATEGIES.get(traversalStrategy).call(this, callback, this);
  }
}

function depthFirstPreOrder(callback, context) {
  let continueTraverse = callback.call(context, this);

  for (let i = 0; i < this.childs.length; i++) {
    if (continueTraverse === false) {
      return false;
    }

    continueTraverse = depthFirstPreOrder.call(this.childs[i], callback, context);
  }

  return continueTraverse;
}

function depthFirstPostOrder(callback, context) {
  for (let i = 0; i < this.childs.length; i++) {
    const continueTraverse = depthFirstPostOrder.call(this.childs[i], callback, context);

    if (continueTraverse === false) {
      return false;
    }
  }

  return callback.call(context, this);
}

function breadthFirst(callback, context) {
  const queue = [this];

  (function processQueue() {
    if (queue.length === 0) {
      return;
    }

    const node = queue.shift();

    for (let i = 0; i < node.childs.length; i++) {
      queue.push(node.childs[i]);
    }

    if (callback.call(context, node) !== false) {
      processQueue();
    }
  })();
}
