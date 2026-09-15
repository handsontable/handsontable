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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L262

:::

_focusOrder.buildFocusOrder(selectedRanges)_

Rebuilds the focus order based on the provided selection. Only the layers' geometry is
captured — the focus stops themselves are computed lazily during navigation.


| Param | Type | Description |
| --- | --- | --- |
| selectedRanges | `Array<CellRange>` | The selected ranges to build the focus order for. |



### getCurrentHorizontalNode

::: ask-about-api getCurrentHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L211

:::

_focusOrder.getCurrentHorizontalNode() ⇒ FocusNodeData | undefined_

Gets the currently selected node data from the horizontal focus order.



### getCurrentVerticalNode

::: ask-about-api getCurrentVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L180

:::

_focusOrder.getCurrentVerticalNode() ⇒ FocusNodeData | undefined_

Gets the currently selected node data from the vertical focus order.



### getFirstHorizontalNode

::: ask-about-api getFirstHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L218

:::

_focusOrder.getFirstHorizontalNode() ⇒ FocusNodeData | undefined_

Gets the first node data from the horizontal focus order.



### getFirstVerticalNode

::: ask-about-api getFirstVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L187

:::

_focusOrder.getFirstVerticalNode() ⇒ FocusNodeData | undefined_

Gets the first node data from the vertical focus order.



### getNextHorizontalNode

::: ask-about-api getNextHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L225

:::

_focusOrder.getNextHorizontalNode() ⇒ FocusNodeData_

Gets the next selected node data from the horizontal focus order.



### getNextVerticalNode

::: ask-about-api getNextVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L194

:::

_focusOrder.getNextVerticalNode() ⇒ FocusNodeData_

Gets the next selected node data from the vertical focus order.



### getPrevHorizontalNode

::: ask-about-api getPrevHorizontalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L233

:::

_focusOrder.getPrevHorizontalNode() ⇒ FocusNodeData_

Gets the previous selected node data from the horizontal focus order.



### getPrevVerticalNode

::: ask-about-api getPrevVerticalNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L203

:::

_focusOrder.getPrevVerticalNode() ⇒ FocusNodeData_

Gets the previous selected node data from the vertical focus order.



### setActiveNode

::: ask-about-api setActiveNode|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L294

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L249

:::

_focusOrder.setNextNodeAsActive()_

Sets the next node in both focus orders as active.



### setPrevNodeAsActive

::: ask-about-api setPrevNodeAsActive|FocusOrder

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/focusOrder.ts#L239

:::

_focusOrder.setPrevNodeAsActive()_

Sets the previous node in both focus orders as active.


