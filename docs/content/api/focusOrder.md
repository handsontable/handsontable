---
title: FocusOrder
metaTitle: FocusOrder API reference – JavaScript Data Grid | Handsontable
permalink: /api/focus-order
canonicalUrl: /api/focus-order
searchCategory: API Reference
hotPlugin: false
editLink: false
id: t5p2k8vh
react:
  id: f7q3j1wi
angular:
  id: b6n4x9yj
---

[[toc]]

## Description

Initializes the focus order manager with the merged cell getter and row and column index mappers used to navigate focus through merged regions.


## Methods

### buildFocusOrder

::: ask-about-api buildFocusOrder|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L176

:::

_focusOrder.buildFocusOrder(selectedRanges)_

Rebuilds the focus order list based on the provided selection.


| Param | Type | Description |
| --- | --- | --- |
| selectedRanges | `Array<CellRange>` | The selected ranges to build the focus order for. |



### getCurrentHorizontalNode

::: ask-about-api getCurrentHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L128

:::

_focusOrder.getCurrentHorizontalNode() ⇒ NodeStructure_

Gets the currently selected node data from the horizontal focus order list.



### getCurrentVerticalNode

::: ask-about-api getCurrentVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L100

:::

_focusOrder.getCurrentVerticalNode() ⇒ NodeStructure_

Gets the currently selected node data from the vertical focus order list.



### getFirstHorizontalNode

::: ask-about-api getFirstHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L135

:::

_focusOrder.getFirstHorizontalNode() ⇒ NodeStructure_

Gets the first node data from the horizontal focus order list.



### getFirstVerticalNode

::: ask-about-api getFirstVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L107

:::

_focusOrder.getFirstVerticalNode() ⇒ NodeStructure_

Gets the first node data from the vertical focus order list.



### getNextHorizontalNode

::: ask-about-api getNextHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L142

:::

_focusOrder.getNextHorizontalNode() ⇒ FocusNodeData_

Gets the next selected node data from the horizontal focus order list.



### getNextVerticalNode

::: ask-about-api getNextVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L114

:::

_focusOrder.getNextVerticalNode() ⇒ FocusNodeData_

Gets the next selected node data from the vertical focus order list.



### getPrevHorizontalNode

::: ask-about-api getPrevHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L149

:::

_focusOrder.getPrevHorizontalNode() ⇒ FocusNodeData_

Gets the previous selected node data from the horizontal focus order list.



### getPrevVerticalNode

::: ask-about-api getPrevVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L121

:::

_focusOrder.getPrevVerticalNode() ⇒ FocusNodeData_

Gets the previous selected node data from the vertical focus order list.



### setActiveNode

::: ask-about-api setActiveNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L257

:::

_focusOrder.setActiveNode(row, column, selectionLayerIndex) ⇒ [FocusOrder](@/api/focusOrder.md)_

Sets the active node based on the provided row and column.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| column | `number` | The visual column index. |
| selectionLayerIndex | `number` | The index of the selection layer to which the focus should be marked as active. |



### setNextNodeAsActive

::: ask-about-api setNextNodeAsActive|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L164

:::

_focusOrder.setNextNodeAsActive()_

Sets the previous node from the horizontal focus order list as active.



### setPrevNodeAsActive

::: ask-about-api setPrevNodeAsActive|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L154

:::

_focusOrder.setPrevNodeAsActive()_

Sets the previous node from the vertical focus order list as active.


