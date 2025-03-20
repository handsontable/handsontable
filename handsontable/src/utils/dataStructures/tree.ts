/**
 * Depth-first pre-order strategy (https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR)).
 *
 * @type {string}
 */
export const TRAVERSAL_DF_PRE = 'DF-pre-order';

// Forward declaration without export default
class TreeNodeBase<T = any> {
  data: T = {} as T;
  parent: TreeNodeBase<T> | null = null;
  childs: TreeNodeBase<T>[] = [];
  constructor(data: T) {
    this.data = data;
  }
  addChild(node: TreeNodeBase<T>): void {
    node.parent = this;
    this.childs.push(node);
  }
}

/**
 * @param {Function} callback A callback which will be called on each visited node.
 * @param {*} context A context to pass through.
 * @returns {boolean}
 */
export function depthFirstPreOrder<T, U>(this: TreeNodeBase<T>, callback: (node: TreeNodeBase<T>) => boolean | void, context: U): boolean | void {
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
function depthFirstPostOrder<T, U>(this: TreeNodeBase<T>, callback: (node: TreeNodeBase<T>) => boolean | void, context: U): boolean | void {
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
function breadthFirst<T, U>(this: TreeNodeBase<T>, callback: (node: TreeNodeBase<T>) => boolean | void, context: U): void {
  const queue: TreeNodeBase<T>[] = [this];

  /**
   * Internal processor.
   */
  function process(): void {
    if (queue.length === 0) {
      return;
    }

    const node = queue.shift() as TreeNodeBase<T>;

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

export type TraversalStrategy = typeof TRAVERSAL_DF_PRE | typeof TRAVERSAL_DF_POST | typeof TRAVERSAL_BF;

type TraversalFunction<T, U> = (this: TreeNodeBase<T>, callback: (node: TreeNodeBase<T>) => boolean | void, context: U) => boolean | void;

/**
 * Collection of all available tree traversal strategies.
 *
 * @type {Map<string, Function>}
 */
const TRAVERSAL_STRATEGIES = new Map<TraversalStrategy, TraversalFunction<any, any>>([
  [TRAVERSAL_DF_PRE, depthFirstPreOrder],
  [TRAVERSAL_DF_POST, depthFirstPostOrder],
  [TRAVERSAL_BF, breadthFirst],
]);

/**
 *
 */
export default class TreeNode<T = any> {
  /**
   * A tree data.
   *
   * @type {object}
   */
  data: T = {} as T;
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

  constructor(data: T) {
    this.data = data;
  }

  /**
   * Adds a node to tree leaves. Added node is linked with the parent node through "parent" property.
   *
   * @param {TreeNode} node A TreeNode to add.
   */
  addChild(node: TreeNode<T>): void {
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
  cloneTree(nodeTree: TreeNode<T> = this): TreeNode<T> {
    const clonedNode = new TreeNode<T>({
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
  replaceTreeWith(nodeTree: TreeNode<T>): void {
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
  walkDown(callback: (node: TreeNode<T>) => boolean | void, traversalStrategy: TraversalStrategy = DEFAULT_TRAVERSAL_STRATEGY): void {
    if (!TRAVERSAL_STRATEGIES.has(traversalStrategy)) {
      throw new Error(`Traversal strategy "${traversalStrategy}" does not exist`);
    }

    const strategy = TRAVERSAL_STRATEGIES.get(traversalStrategy) as TraversalFunction<T, TreeNode<T>>;
    strategy.call(this as unknown as TreeNodeBase<T>, callback as (node: TreeNodeBase<T>) => boolean | void, this);
  }

  /**
   * Traverses the tree structure through node parents.
   *
   * @param {Function} callback The callback function which will be called for each node.
   */
  walkUp(callback: (node: TreeNode<T>) => boolean | void): void {
    const context = this;
    const process = (node: TreeNode<T>): void => {
      const continueTraverse = callback.call(context, node);

      if (continueTraverse !== false && node.parent !== null) {
        process(node.parent);
      }
    };

    process(this);
  }
}
