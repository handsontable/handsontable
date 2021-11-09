---
title: Anonymous-BaseRenderer
metaTitle: Anonymous-BaseRenderer - API Reference - Handsontable Documentation
permalink: /11.0/api/anonymous-base-renderer
canonicalUrl: /api/anonymous-base-renderer
hotPlugin: false
editLink: false
---

# Anonymous-BaseRenderer

[[toc]]
## Members

### nodesPool
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L10409

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[BaseRenderer](@/api/baseRenderer.md).nodesPool : [NodesPool](@/api/nodesPool.md) | null_

Factory for newly created DOM elements.

NodePool should be used for each renderer. For the first stage of the refactoring
process, only some of the renderers are implemented a new approach.



### nodeType
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L10416

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[BaseRenderer](@/api/baseRenderer.md).nodeType : string_

Node type which the renderer will manage while building the table (eg. 'TD', 'TR', 'TH').



### renderedNodes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L10437

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[BaseRenderer](@/api/baseRenderer.md).renderedNodes : number_

Counter of nodes already added.



### rootNode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L10423

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[BaseRenderer](@/api/baseRenderer.md).rootNode : HTMLElement_

The root node to which newly created elements will be inserted.



### table
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L10430

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[BaseRenderer](@/api/baseRenderer.md).table : TableRenderer_

The instance of the Table class, a wrapper for all renderers and holder for properties describe table state.



