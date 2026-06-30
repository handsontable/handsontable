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
export function depthFirstPreOrder(this: TreeNode<object>, callback: Function, context: unknown): unknown {
  let continueTraverse: unknown = callback.call(context, this);

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
function depthFirstPostOrder(this: TreeNode<object>, callback: Function, context: unknown): unknown {
  for (let i = 0; i < this.childs.length; i++) {
    const continueTraverse = depthFirstPostOrder.call(this.childs[i], callback, context);

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
function breadthFirst(this: TreeNode<object>, callback: Function, context: unknown) {
  const queue: TreeNode<object>[] = [this];

  /**
   * Internal processor.
   */
  function process() {
    if (queue.length === 0) {
      return;
    }

    const node = queue.shift()!;

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
 * @template T
 */
export default class TreeNode<T extends object = Record<string, unknown>> {
  /**
   * A tree data.
   *
   * @type {object}
   */
  data: T;
  /**
   * A parent node.
   *
   * @type {TreeNode}
   */
  parent: TreeNode<T> | null = null;
  /**
   * A tree leaves.
   *
   * @type {TreeNode[]}
   */
  childs: TreeNode<T>[] = [];

  /**
   * Initializes the tree node with the provided data object.
   */
  constructor(data: T) {
    this.data = data;
  }

  /**
   * Adds a node to tree leaves. Added node is linked with the parent node through "parent" property.
   *
   * @param {TreeNode} node A TreeNode to add.
   */
  addChild(node: TreeNode<T>) {
    node.parent = this;
    this.childs.push(node);
  }

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
  cloneTree(nodeTree: TreeNode<T> = this): TreeNode<T> {
    // The spread of `T extends object` widens to a plain index type, so re-assert it as `T`.
    const clonedNode = new TreeNode<T>({ ...nodeTree.data } as T);

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
  replaceTreeWith(nodeTree: TreeNode<T>) {
    this.data = { ...nodeTree.data } as T;
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
  walkDown(callback: (node: TreeNode<T>) => unknown, traversalStrategy = DEFAULT_TRAVERSAL_STRATEGY) {
    if (!TRAVERSAL_STRATEGIES.has(traversalStrategy)) {
      throwWithCause(`Traversal strategy "${traversalStrategy}" does not exist`);
    }

    TRAVERSAL_STRATEGIES.get(traversalStrategy)!.call(this, callback as Function, this);
  }

  /**
   * Traverses the tree structure through node parents.
   *
   * @param {Function} callback The callback function which will be called for each node.
   */
  walkUp(callback: (this: TreeNode<T>, node: TreeNode<T>) => boolean | void) {
    const process = (node: TreeNode<T>) => {
      const continueTraverse = callback.call(this, node);

      if (continueTraverse !== false && node.parent !== null) {
        process(node.parent);
      }
    };

    process(this);
  }
}
