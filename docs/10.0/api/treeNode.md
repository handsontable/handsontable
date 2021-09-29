---
title: TreeNode
metaTitle: TreeNode - API Reference - Handsontable Documentation
permalink: /10.0/api/tree-node
canonicalUrl: /api/tree-node
hotPlugin: false
editLink: false
---

# TreeNode

[[toc]]
## Methods

### cloneTree

Clones a tree structure deeply.

For example, for giving a tree structure:
     .--(B1)--.
  .-(C1)   .-(C2)-.----.
 (D1)     (D2)   (D3) (D4)

Cloning a tree starting from C2 node creates a mirrored tree structure.
    .-(C2)-.-----.
   (D2)   (D3) (D4)

The cloned tree can be safely modified without affecting the original structure.
After modification, the clone can be merged with a tree using the replaceTreeWith method.
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/tree.js#L137

:::

_TreeNode#cloneTree_

Clones a tree structure deeply.

For example, for giving a tree structure:
     .--(B1)--.
  .-(C1)   .-(C2)-.----.
 (D1)     (D2)   (D3) (D4)

Cloning a tree starting from C2 node creates a mirrored tree structure.
    .-(C2)-.-----.
   (D2)   (D3) (D4)

The cloned tree can be safely modified without affecting the original structure.
After modification, the clone can be merged with a tree using the replaceTreeWith method.([nodeTree]) ⇒ TreeNode


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [nodeTree] | `TreeNode` | <code>this</code> | `optional` A TreeNode to clone. |


