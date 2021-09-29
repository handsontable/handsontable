---
title: Highlight
metaTitle: Highlight - API Reference - Handsontable Documentation
permalink: /10.0/api/highlight
canonicalUrl: /api/highlight
hotPlugin: false
editLink: false
---

# Highlight

[[toc]]

## Description

Highlight class responsible for managing Walkontable Selection classes.

With Highlight object you can manipulate four different highlight types:
 - `cell` can be added only to a single cell at a time and it defines currently selected cell;
 - `fill` can occur only once and its highlight defines selection of autofill functionality (managed by the plugin with the same name);
 - `areas` can be added to multiple cells at a time. This type highlights selected cell or multiple cells.
   The multiple cells have to be defined as an uninterrupted order (regular shape). Otherwise, the new layer of
   that type should be created to manage not-consecutive selection;
 - `header` can occur multiple times. This type is designed to highlight only headers. Like `area` type it
   can appear with multiple highlights (accessed under different level layers).


## Members

### activeHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L81

:::

_highlight.activeHeaders : Map&lt;number, [Selection](@/api/selection.md)&gt;_

Collection of the `active-header` highlights. That objects describes attributes for the selection of
the multiple selected rows and columns in the table header. The table headers which have selected all items in
a row will be marked as `active-header`.



### areas
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L66

:::

_highlight.areas : Map&lt;number, [Selection](@/api/selection.md)&gt;_

Collection of the `area` highlights. That objects describes attributes for the borders and selection of
the multiple selected cells. It can occur multiple times on the table.



### cell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L52

:::

_highlight.cell : [Selection](@/api/selection.md)_

`cell` highlight object which describes attributes for the currently selected cell.
It can only occur only once on the table.



### customSelections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L87

:::

_highlight.customSelections : Array&lt;[Selection](@/api/selection.md)&gt;_

Collection of the `custom-selection`, holder for example borders added through CustomBorders plugin.



### fill
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L59

:::

_highlight.fill : [Selection](@/api/selection.md)_

`fill` highlight object which describes attributes for the borders for autofill functionality.
It can only occur only once on the table.



### headers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L73

:::

_highlight.headers : Map&lt;number, [Selection](@/api/selection.md)&gt;_

Collection of the `header` highlights. That objects describes attributes for the selection of
the multiple selected rows and columns in the table header. It can occur multiple times on the table.



### layerLevel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L45

:::

_highlight.layerLevel : number_

The property which describes which layer level of the visual selection will be modified.
This option is valid only for `area` and `header` highlight types which occurs multiple times on
the table (as a non-consecutive selection).

An order of the layers is the same as the order of added new non-consecutive selections.

**Default**: <code>0</code>  


### options
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L34

:::

_highlight.options : object_

Options consumed by Highlight class and Walkontable Selection classes.


## Methods

### addCustomSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L248

:::

_highlight.addCustomSelection(selectionInstance)_

Add selection to the custom selection instance. The new selection are added to the end of the selection collection.


| Param | Type | Description |
| --- | --- | --- |
| selectionInstance | `object` | The selection instance. |



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L255

:::

_highlight.clear()_

Perform cleaning visual highlights for the whole table.



### createOrGetActiveHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L210

:::

_highlight.createOrGetActiveHeader() ⇒ [Selection](@/api/selection.md)_

Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
of the multiple selected active header cells.



### createOrGetArea
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L150

:::

_highlight.createOrGetArea() ⇒ [Selection](@/api/selection.md)_

Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
of the multiple selected cells.



### createOrGetHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L180

:::

_highlight.createOrGetHeader() ⇒ [Selection](@/api/selection.md)_

Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
of the multiple selected header cells.



### getActiveHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L230

:::

_highlight.getActiveHeaders() ⇒ Array&lt;[Selection](@/api/selection.md)&gt;_

Get all Walkontable Selection instances which describes the state of the visual highlight of the active headers.



### getAreas
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L170

:::

_highlight.getAreas() ⇒ Array&lt;[Selection](@/api/selection.md)&gt;_

Get all Walkontable Selection instances which describes the state of the visual highlight of the cells.



### getCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L131

:::

_highlight.getCell() ⇒ [Selection](@/api/selection.md)_

Get Walkontable Selection instance created for controlling highlight of the currently selected/edited cell.



### getCustomSelections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L239

:::

_highlight.getCustomSelections() ⇒ [Selection](@/api/selection.md)_

Get Walkontable Selection instance created for controlling highlight of the custom selection functionality.



### getFill
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L140

:::

_highlight.getFill() ⇒ [Selection](@/api/selection.md)_

Get Walkontable Selection instance created for controlling highlight of the autofill functionality.



### getHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L200

:::

_highlight.getHeaders() ⇒ Array&lt;[Selection](@/api/selection.md)&gt;_

Get all Walkontable Selection instances which describes the state of the visual highlight of the headers.



### isEnabledFor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L97

:::

_highlight.isEnabledFor(highlightType, coords) ⇒ boolean_

Check if highlight cell rendering is disabled for specified highlight type.


| Param | Type | Description |
| --- | --- | --- |
| highlightType | `string` | Highlight type. Possible values are: `cell`, `area`, `fill` or `header`. |
| coords | `CellCoords` | The CellCoords instance with defined visual coordinates. |



### useLayerLevel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/highlight.js#L120

:::

_highlight.useLayerLevel([level]) ⇒ [Highlight](@/api/highlight.md)_

Set a new layer level to make access to the desire `area` and `header` highlights.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [level] | `number` | <code>0</code> | `optional` Layer level to use. |


