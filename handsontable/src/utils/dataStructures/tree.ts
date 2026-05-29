import { throwWithCause } from '../../helpers/errors';

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
export function depthFirstPreOrder(this: TreeNode, callback: Function, context: unknown): unknown {
  let continueTraverse: unknown = callback.call(context, this);

  for (let i = 0; i < this.childs.length; i++) {
    if (continueTraverse === false) {
      return false;
    }

    continueTraverse = depthFirstPreOrder.call(this.childs[i] as TreeNode, callback, context);
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
function depthFirstPostOrder(this: TreeNode, callback: Function, context: unknown): unknown {
  for (let i = 0; i < this.childs.length; i++) {
    const continueTraverse = depthFirstPostOrder.call(this.childs[i] as TreeNode, callback, context);

    if (continueTraverse === false) {
      return false;
    }
  }

  return callback.call(context, this) as unknown;
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
function breadthFirst(this: TreeNode, callback: Function, context: unknown) {
  const queue: TreeNode[] = [this];

  /**
   * Internal processor.
   */
  function process() {
    if (queue.length === 0) {
      return;
    }

    const node = queue.shift()!;

    queue.push(...(node.childs as TreeNode[]));

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
const DEFAULT_TRAVERSAL_STRATEGY = TRAVERSAL_BF;
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
 *
 */
export default class TreeNode {
  /**
   * A tree data.
   *
   * @type {object}
   */
  data: Record<string, unknown> = {};
  /**
   * A parent node.
   *
   * @type {TreeNode}
   */
  parent: TreeNode | null = null;
  /**
   * A tree leaves.
   *
   * @type {TreeNode[]}
   */
  childs: TreeNode[] = [];

  constructor(data: Record<string, unknown>) {
    this.data = data;
  }

  /**
   * Adds a node to tree leaves. Added node is linked with the parent node through "parent" property.
   *
   * @param {TreeNode} node A TreeNode to add.
   */
  addChild(node: TreeNode) {
    node.parent = this;
    this.childs.push(node);
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @memberof TreeNode#
   * @function cloneTree
   *
   * Clones a tree structure deeply.
   *
   * For example, for giving a tree structure:
   *      .--(B1)--.
   *   .-(C1)   .-(C2)-.----.
   *  (D1)     (D2)   (D3) (D4)
   *
   * Cloning a tree starting from C2 node creates a mirrored tree structure.
   *     .-(C2')-.-----.
   *    (D2')   (D3') (D4')
   *
   * The cloned tree can be safely modified without affecting the original structure.
   * After modification, the clone can be merged with a tree using the "replaceTreeWith" method.
   *
   * @param {TreeNode} [nodeTree=this] A TreeNode to clone.
   * @returns {TreeNode}
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  cloneTree(nodeTree: TreeNode = this) {
    const clonedNode = new TreeNode({
      ...nodeTree.data,
    });

    for (let i = 0; i < nodeTree.childs.length; i++) {
      clonedNode.addChild(this.cloneTree(nodeTree.childs[i]));
    }

    return clonedNode;
  }

  /**
   * Replaces the current node with a passed tree structure.
   *
   * @param {TreeNode} nodeTree A TreeNode to replace with.
   */
  replaceTreeWith(nodeTree: TreeNode) {
    this.data = { ...nodeTree.data };
    this.childs = [];

    for (let i = 0; i < nodeTree.childs.length; i++) {
      this.addChild(nodeTree.childs[i]);
    }
  }

  /**
   * Traverses the tree structure through node childs. The walk down traversing supports
   * a three different strategies.
   *  - Depth-first pre-order strategy (https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR));
   *  - Depth-first post-order strategy (https://en.wikipedia.org/wiki/Tree_traversal#Post-order_(NLR));
   *  - Breadth-first traversal strategy (https://en.wikipedia.org/wiki/Tree_traversal#Breadth-first_search_/_level_order).
   *
   * @param {Function} callback The callback function which will be called for each node.
   * @param {string} [traversalStrategy=DEFAULT_TRAVERSAL_STRATEGY] Traversing strategy.
   */
  walkDown(callback: Function, traversalStrategy = DEFAULT_TRAVERSAL_STRATEGY) {
    if (!TRAVERSAL_STRATEGIES.has(traversalStrategy)) {
      throwWithCause(`Traversal strategy "${traversalStrategy}" does not exist`);
    }

    TRAVERSAL_STRATEGIES.get(traversalStrategy)!.call(this, callback, this);
  }

  /**
   * Traverses the tree structure through node parents.
   *
   * @param {Function} callback The callback function which will be called for each node.
   */
  walkUp(callback: (this: TreeNode, node: TreeNode) => boolean | void) {
    const context = this;
    const process = (node: TreeNode) => {
      const continueTraverse = callback.call(context, node) as boolean | void;

      if (continueTraverse !== false && node.parent !== null) {
        process(node.parent);
      }
    };

    process(this);
  }
}
