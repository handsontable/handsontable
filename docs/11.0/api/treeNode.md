---
title: TreeNode
metaTitle: TreeNode - API Reference - Handsontable Documentation
permalink: /11.0/api/tree-node
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/tree.js#L137

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


