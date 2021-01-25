---
id: plugin-hooks
title: Hooks
sidebar_label: Hooks
slug: /api/hooks
---
### createEmptyBucket
`hooks.createEmptyBucket() ⇒ object`

Returns a new object with empty handlers related to every registered hook name.


**Returns**: <code>object</code> - The empty bucket object.  
**Example**  
```js
Handsontable.hooks.createEmptyBucket();
// Results:
{
...
afterCreateCol: [],
afterCreateRow: [],
beforeInit: [],
...
}
```

### getBucket
`hooks.getBucket([context]) ⇒ object`

Get hook bucket based on the context of the object or if argument is `undefined`, get the global hook bucket.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [context] | <code>object</code> | <code>null</code> | `optional` A Handsontable instance. |


**Returns**: <code>object</code> - Returns a global or Handsontable instance bucket.  

### add
`hooks.add(key, callback, [context]) ⇒ Hooks`

Adds a listener (globally or locally) to a specified hook name.
If the `context` parameter is provided, the hook will be added only to the instance it references.
Otherwise, the callback will be used everytime the hook fires on any Handsontable instance.
You can provide an array of callback functions as the `callback` argument, this way they will all be fired
once the hook is triggered.

**See**: Core#addHook  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Hook name. |
| callback | <code>function</code> \| <code>Array</code> |  | Callback function or an array of functions. |
| [context] | <code>object</code> | <code>null</code> | `optional` The context for the hook callback to be added - a Handsontable instance or leave empty. |


**Returns**: [<code>Hooks</code>](#Hooks) - Instance of Hooks.  
**Example**  
```js
// single callback, added locally
Handsontable.hooks.add('beforeInit', myCallback, hotInstance);

// single callback, added globally
Handsontable.hooks.add('beforeInit', myCallback);

// multiple callbacks, added locally
Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback], hotInstance);

// multiple callbacks, added globally
Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback]);
```

### once
`hooks.once(key, callback, [context])`

Adds a listener to a specified hook. After the hook runs this listener will be automatically removed from the bucket.

**See**: Core#addHookOnce  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Hook/Event name. |
| callback | <code>function</code> \| <code>Array</code> |  | Callback function. |
| [context] | <code>object</code> | <code>null</code> | `optional` A Handsontable instance. |


**Example**  
```js
Handsontable.hooks.once('beforeInit', myCallback, hotInstance);
```

### remove
`hooks.remove(key, callback, [context]) ⇒ boolean`

Removes a listener from a hook with a given name. If the `context` argument is provided, it removes a listener from a local hook assigned to the given Handsontable instance.

**See**: Core#removeHook  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Hook/Event name. |
| callback | <code>function</code> |  | Callback function (needs the be the function that was previously added to the hook). |
| [context] | <code>object</code> | <code>null</code> | `optional` Handsontable instance. |


**Returns**: <code>boolean</code> - Returns `true` if hook was removed, `false` otherwise.  
**Example**  
```js
Handsontable.hooks.remove('beforeInit', myCallback);
```

### has
`hooks.has(key, [context]) ⇒ boolean`

Checks whether there are any registered listeners for the provided hook name.
If the `context` parameter is provided, it only checks for listeners assigned to the given Handsontable instance.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Hook name. |
| [context] | <code>object</code> | <code>null</code> | `optional` A Handsontable instance. |


**Returns**: <code>boolean</code> - `true` for success, `false` otherwise.  

### run
`hooks.run(context, key, [p1], [p2], [p3], [p4], [p5], [p6]) ⇒ \*`

Runs all local and global callbacks assigned to the hook identified by the `key` parameter.
It returns either a return value from the last called callback or the first parameter (`p1`) passed to the `run` function.

**See**: Core#runHooks  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>object</code> | Handsontable instance. |
| key | <code>string</code> | Hook/Event name. |
| [p1] | <code>\*</code> | `optional` Parameter to be passed as an argument to the callback function. |
| [p2] | <code>\*</code> | `optional` Parameter to be passed as an argument to the callback function. |
| [p3] | <code>\*</code> | `optional` Parameter to be passed as an argument to the callback function. |
| [p4] | <code>\*</code> | `optional` Parameter to be passed as an argument to the callback function. |
| [p5] | <code>\*</code> | `optional` Parameter to be passed as an argument to the callback function. |
| [p6] | <code>\*</code> | `optional` Parameter to be passed as an argument to the callback function. |


**Returns**: <code>\*</code> - Either a return value from the last called callback or `p1`.  
**Example**  
```js
Handsontable.hooks.run(hot, 'beforeInit');
```

### destroy
`hooks.destroy([context])`

Destroy all listeners connected to the context. If no context is provided, the global listeners will be destroyed.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [context] | <code>object</code> | <code>null</code> | `optional` A Handsontable instance. |


**Example**  
```js
// destroy the global listeners
Handsontable.hooks.destroy();

// destroy the local listeners
Handsontable.hooks.destroy(hotInstance);
```

### register
`hooks.register(key)`

Registers a hook name (adds it to the list of the known hook names). Used by plugins.
It is not necessary to call register, but if you use it, your plugin hook will be used returned by
the `getRegistered` method. (which itself is used in the demo https://handsontable.com/docs/tutorial-using-callbacks.html).


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The hook name. |


**Example**  
```js
Handsontable.hooks.register('myHook');
```

### deregister
`hooks.deregister(key)`

Deregisters a hook name (removes it from the list of known hook names).


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The hook name. |


**Example**  
```js
Handsontable.hooks.deregister('myHook');
```

### isDeprecated
`hooks.isDeprecated(hookName) ⇒ boolean`

Returns a boolean value depending on if a hook by such name has been removed or deprecated.


| Param | Type | Description |
| --- | --- | --- |
| hookName | <code>string</code> | The hook name to check. |


**Returns**: <code>boolean</code> - Returns `true` if the provided hook name was marked as deprecated or
removed from API, `false` otherwise.  
**Example**  
```js
Handsontable.hooks.isDeprecated('skipLengthCache');

// Results:
true
```

### isRegistered
`hooks.isRegistered(hookName) ⇒ boolean`

Returns a boolean depending on if a hook by such name has been registered.


| Param | Type | Description |
| --- | --- | --- |
| hookName | <code>string</code> | The hook name to check. |


**Returns**: <code>boolean</code> - `true` for success, `false` otherwise.  
**Example**  
```js
Handsontable.hooks.isRegistered('beforeInit');

// Results:
true
```

### getRegistered
`hooks.getRegistered() ⇒ Array`

Returns an array of registered hooks.


**Returns**: <code>Array</code> - An array of registered hooks.  
**Example**  
```js
Handsontable.hooks.getRegistered();

// Results:
[
...
  'beforeInit',
  'beforeRender',
  'beforeSetRangeEnd',
  'beforeDrawBorders',
  'beforeChange',
...
]
```

### afterCellMetaReset
`"afterCellMetaReset"`

Fired after resetting a cell's meta. This happens when the [Core#updateSettings](core#updatesettings) method is called.



### afterChange
`"afterChange"(changes, [source])`

Fired after one or more cells has been changed. The changes are triggered in any situation when the
value is entered using an editor or changed using API (e.q setDataAtCell).

__Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.


| Param | Type | Description |
| --- | --- | --- |
| changes | <code>Array</code> | 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Example**  
```js
new Handsontable(element, {
  afterChange: (changes) => {
    changes.forEach(([row, prop, oldValue, newValue]) => {
      // Some logic...
    });
  }
})
```

### afterChangesObserved
`"afterChangesObserved"`

Fired by [ObserveChanges](observe-changes) plugin after detecting changes in the data source. This hook is fired when
[Options#observeChanges](options#observechanges) option is enabled.



### afterContextMenuDefaultOptions
`"afterContextMenuDefaultOptions"(predefinedItems)`

Fired each time user opens [ContextMenu](context-menu) and after setting up the Context Menu's default options. These options are a collection
which user can select by setting an array of keys or an array of objects in [Options#contextMenu](options#contextmenu) option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | <code>Array</code> | An array of objects containing information about the pre-defined Context Menu items. |



### beforeContextMenuSetItems
`"beforeContextMenuSetItems"(menuItems)`

Fired each time user opens [ContextMenu](context-menu) plugin before setting up the Context Menu's items but after filtering these options by
user (`contextMenu` option). This hook can by helpful to determine if user use specified menu item or to set up
one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | <code>Array.&lt;object&gt;</code> | An array of objects containing information about to generated Context Menu items. |



### afterDropdownMenuDefaultOptions
`"afterDropdownMenuDefaultOptions"(predefinedItems)`

Fired by [DropdownMenu](dropdown-menu) plugin after setting up the Dropdown Menu's default options. These options are a
collection which user can select by setting an array of keys or an array of objects in [Options#dropdownMenu](options#dropdownmenu)
option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | <code>Array.&lt;object&gt;</code> | An array of objects containing information about the pre-defined Context Menu items. |



### beforeDropdownMenuSetItems
`"beforeDropdownMenuSetItems"(menuItems)`

Fired by [DropdownMenu](dropdown-menu) plugin before setting up the Dropdown Menu's items but after filtering these options
by user (`dropdownMenu` option). This hook can by helpful to determine if user use specified menu item or to set
up one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | <code>Array.&lt;object&gt;</code> | An array of objects containing information about to generated Dropdown Menu items. |



### afterContextMenuHide
`"afterContextMenuHide"(context)`

Fired by [ContextMenu](context-menu) plugin after hiding the Context Menu. This hook is fired when [Options#contextMenu](options#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | <code>object</code> | The Context Menu plugin instance. |



### beforeContextMenuShow
`"beforeContextMenuShow"(context)`

Fired by [ContextMenu](context-menu) plugin before opening the Context Menu. This hook is fired when [Options#contextMenu](options#context-menu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | <code>object</code> | The Context Menu instance. |



### afterContextMenuShow
`"afterContextMenuShow"(context)`

Fired by [ContextMenu](context-menu) plugin after opening the Context Menu. This hook is fired when [Options#contextMenu](options#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | <code>object</code> | The Context Menu plugin instance. |



### afterCopyLimit
`"afterCopyLimit"(selectedRows, selectedColumns, copyRowsLimit, copyColumnsLimit)`

Fired by [CopyPaste](copy-paste) plugin after reaching the copy limit while copying data. This hook is fired when
[Options#copyPaste](options#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| selectedRows | <code>number</code> | Count of selected copyable rows. |
| selectedColumns | <code>number</code> | Count of selected copyable columns. |
| copyRowsLimit | <code>number</code> | Current copy rows limit. |
| copyColumnsLimit | <code>number</code> | Current copy columns limit. |



### beforeCreateCol
`"beforeCreateCol"(index, amount, [source]) ⇒ \*`

Fired before created a new column.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Represents the visual index of first newly created column in the data source array. |
| amount | <code>number</code> | Number of newly created columns in the data source array. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: <code>\*</code> - If `false` then creating columns is cancelled.  
**Example**  
```js
// Return `false` to cancel column inserting.
new Handsontable(element, {
  beforeCreateCol: function(data, coords) {
    return false;
  }
});
```

### afterCreateCol
`"afterCreateCol"(index, amount, [source])`

Fired after created a new column.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Represents the visual index of first newly created column in the data source. |
| amount | <code>number</code> | Number of newly created columns in the data source. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### beforeCreateRow
`"beforeCreateRow"(index, amount, [source]) ⇒ \* | boolean`

Fired before created a new row.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Represents the visual index of first newly created row in the data source array. |
| amount | <code>number</code> | Number of newly created rows in the data source array. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### afterCreateRow
`"afterCreateRow"(index, amount, [source])`

Fired after created a new row.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Represents the visual index of first newly created row in the data source array. |
| amount | <code>number</code> | Number of newly created rows in the data source array. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterDeselect
`"afterDeselect"`

Fired after the current cell is deselected.



### afterDestroy
`"afterDestroy"`

Fired after destroying the Handsontable instance.



### afterDocumentKeyDown
`"afterDocumentKeyDown"(event)`

General hook which captures `keydown` events attached to the document body. These events are delegated to the
hooks system and consumed by Core and internal modules (e.g plugins, editors).


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | A native `keydown` event object. |



### afterDrawSelection
`"afterDrawSelection"(currentRow, currentColumn, cornersOfSelection, layerLevel) ⇒ string | undefined`

Fired inside the Walkontable's selection `draw` method. Can be used to add additional class names to cells, depending on the current selection.

**Since**: 0.38.1  

| Param | Type | Description |
| --- | --- | --- |
| currentRow | <code>number</code> | Row index of the currently processed cell. |
| currentColumn | <code>number</code> | Column index of the currently cell. |
| cornersOfSelection | <code>Array.&lt;number&gt;</code> | Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`. |
| layerLevel | <code>number</code> \| <code>undefined</code> | Number indicating which layer of selection is currently processed. |


**Returns**: <code>string</code> \| <code>undefined</code> - Can return a `String`, which will act as an additional `className` to be added to the currently processed cell.  

### beforeRemoveCellClassNames
`"beforeRemoveCellClassNames" ⇒ Array.<string> | undefined`

Fired inside the Walkontable's `refreshSelections` method. Can be used to remove additional class names from all cells in the table.

**Since**: 0.38.1  

**Returns**: <code>Array.&lt;string&gt;</code> \| <code>undefined</code> - Can return an `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.  

### afterGetCellMeta
`"afterGetCellMeta"(row, column, cellProperties)`

Fired after getting the cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| cellProperties | <code>object</code> | Object containing the cell properties. |



### afterGetColHeader
`"afterGetColHeader"(column, TH)`

Fired after retrieving information about a column header and appending it to the table header.


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index. |
| TH | <code>HTMLTableCellElement</code> | Header's TH element. |



### afterGetRowHeader
`"afterGetRowHeader"(row, TH)`

Fired after retrieving information about a row header and appending it to the table header.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| TH | <code>HTMLTableCellElement</code> | Header's TH element. |



### afterInit
`"afterInit"`

Fired after the Handsontable instance is initiated.



### afterLoadData
`"afterLoadData"(sourceData, initialLoad)`

Fired after new data is loaded (by `loadData` or `updateSettings` method) into the data source array.


| Param | Type | Description |
| --- | --- | --- |
| sourceData | <code>Array</code> | Array of arrays or array of objects containing data. |
| initialLoad | <code>boolean</code> | Flag that determines whether the data has been loaded during the initialization. |



### afterMomentumScroll
`"afterMomentumScroll"`

Fired after a scroll event, which is identified as a momentum scroll (e.g. On an iPad).



### afterOnCellCornerMouseDown
`"afterOnCellCornerMouseDown"(event)`

Fired after a `mousedown` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | `mousedown` event object. |



### afterOnCellCornerDblClick
`"afterOnCellCornerDblClick"(event)`

Fired after a `dblclick` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | `dblclick` event object. |



### afterOnCellMouseDown
`"afterOnCellMouseDown"(event, coords, TD)`

Fired after clicking on a cell or row/column header. In case the row/column header was clicked, the coordinate
indexes are negative.

For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseDown` called
with coordinates `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | `mousedown` event object. |
| coords | <code>CellCoords</code> | Coordinates object containing the visual row and visual column indexes of the clicked cell. |
| TD | <code>HTMLTableCellElement</code> | Cell's TD (or TH) element. |



### afterOnCellMouseUp
`"afterOnCellMouseUp"(event, coords, TD)`

Fired after clicking on a cell or row/column header. In case the row/column header was clicked, the coordinate
indexes are negative.

For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseUp` called
with coordinates `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | `mouseup` event object. |
| coords | <code>CellCoords</code> | Coordinates object containing the visual row and visual column indexes of the clicked cell. |
| TD | <code>HTMLTableCellElement</code> | Cell's TD (or TH) element. |



### afterOnCellContextMenu
`"afterOnCellContextMenu"(event, coords, TD)`

Fired after clicking right mouse button on a cell or row/column header.

For example clicking on the row header of cell (0, 0) results with `afterOnCellContextMenu` called
with coordinates `{row: 0, col: -1}`.

**Since**: 4.1.0  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | `contextmenu` event object. |
| coords | <code>CellCoords</code> | Coordinates object containing the visual row and visual column indexes of the clicked cell. |
| TD | <code>HTMLTableCellElement</code> | Cell's TD (or TH) element. |



### afterOnCellMouseOver
`"afterOnCellMouseOver"(event, coords, TD)`

Fired after hovering a cell or row/column header with the mouse cursor. In case the row/column header was
hovered, the index is negative.

For example, hovering over the row header of cell (0, 0) results with `afterOnCellMouseOver` called
with coords `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | `mouseover` event object. |
| coords | <code>CellCoords</code> | Hovered cell's visual coordinate object. |
| TD | <code>HTMLTableCellElement</code> | Cell's TD (or TH) element. |



### afterOnCellMouseOut
`"afterOnCellMouseOut"(event, coords, TD)`

Fired after leaving a cell or row/column header with the mouse cursor.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | `mouseout` event object. |
| coords | <code>CellCoords</code> | Leaved cell's visual coordinate object. |
| TD | <code>HTMLTableCellElement</code> | Cell's TD (or TH) element. |



### afterRemoveCol
`"afterRemoveCol"(index, amount, physicalColumns, [source])`

Fired after one or more columns are removed.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Visual index of starter column. |
| amount | <code>number</code> | An amount of removed columns. |
| physicalColumns | <code>Array.&lt;number&gt;</code> | An array of physical columns removed from the data source. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterRemoveRow
`"afterRemoveRow"(index, amount, physicalRows, [source])`

Fired after one or more rows are removed.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Visual index of starter row. |
| amount | <code>number</code> | An amount of removed rows. |
| physicalRows | <code>Array.&lt;number&gt;</code> | An array of physical rows removed from the data source. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterRender
`"afterRender"(isForced)`

Fired after the Handsontable table is rendered.


| Param | Type | Description |
| --- | --- | --- |
| isForced | <code>boolean</code> | Is `true` if rendering was triggered by a change of settings or data; or `false` if                           rendering was triggered by scrolling or moving selection. |



### beforeRenderer
`"beforeRenderer"(TD, row, column, prop, value, cellProperties)`

Fired before starting rendering the cell.


| Param | Type | Description |
| --- | --- | --- |
| TD | <code>HTMLTableCellElement</code> | Currently rendered cell's TD element. |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| prop | <code>string</code> \| <code>number</code> | Column property name or a column index, if datasource is an array of arrays. |
| value | <code>\*</code> | Value of the rendered cell. |
| cellProperties | <code>object</code> | Object containing the cell's properties. |



### afterRenderer
`"afterRenderer"(TD, row, column, prop, value, cellProperties)`

Fired after finishing rendering the cell (after the renderer finishes).


| Param | Type | Description |
| --- | --- | --- |
| TD | <code>HTMLTableCellElement</code> | Currently rendered cell's TD element. |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| prop | <code>string</code> \| <code>number</code> | Column property name or a column index, if datasource is an array of arrays. |
| value | <code>\*</code> | Value of the rendered cell. |
| cellProperties | <code>object</code> | Object containing the cell's properties. |



### afterScrollHorizontally
`"afterScrollHorizontally"`

Fired after the horizontal scroll event.



### afterScrollVertically
`"afterScrollVertically"`

Fired after the vertical scroll event.



### afterSelection
`"afterSelection"(row, column, row2, column2, preventScrolling, selectionLayerLevel)`

Fired after one or more cells are selected (e.g. During mouse move).


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Selection start visual row index. |
| column | <code>number</code> | Selection start visual column index. |
| row2 | <code>number</code> | Selection end visual row index. |
| column2 | <code>number</code> | Selection end visual column index. |
| preventScrolling | <code>object</code> | Object with `value` property where its value change will be observed. |
| selectionLayerLevel | <code>number</code> | The number which indicates what selection layer is currently modified. |


**Example**  
```js
new Handsontable(element, {
  afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // setting if prevent scrolling after selection
    preventScrolling.value = true;
  }
})
```

### afterSelectionByProp
`"afterSelectionByProp"(row, prop, row2, prop2, preventScrolling, selectionLayerLevel)`

Fired after one or more cells are selected.

The `prop` and `prop2` arguments represent the source object property name instead of the column number.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Selection start visual row index. |
| prop | <code>string</code> | Selection start data source object property name. |
| row2 | <code>number</code> | Selection end visual row index. |
| prop2 | <code>string</code> | Selection end data source object property name. |
| preventScrolling | <code>object</code> | Object with `value` property where its value change will be observed. |
| selectionLayerLevel | <code>number</code> | The number which indicates what selection layer is currently modified. |


**Example**  
```js
new Handsontable(element, {
  afterSelectionByProp: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // setting if prevent scrolling after selection
    preventScrolling.value = true;
  }
})
```

### afterSelectionEnd
`"afterSelectionEnd"(row, column, row2, column2, selectionLayerLevel)`

Fired after one or more cells are selected (e.g. On mouse up).


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Selection start visual row index. |
| column | <code>number</code> | Selection start visual column index. |
| row2 | <code>number</code> | Selection end visual row index. |
| column2 | <code>number</code> | Selection end visual column index. |
| selectionLayerLevel | <code>number</code> | The number which indicates what selection layer is currently modified. |



### afterSelectionEndByProp
`"afterSelectionEndByProp"(row, prop, row2, prop2, selectionLayerLevel)`

Fired after one or more cells are selected (e.g. On mouse up).

The `prop` and `prop2` arguments represent the source object property name instead of the column number.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Selection start visual row index. |
| prop | <code>string</code> | Selection start data source object property index. |
| row2 | <code>number</code> | Selection end visual row index. |
| prop2 | <code>string</code> | Selection end data source object property index. |
| selectionLayerLevel | <code>number</code> | The number which indicates what selection layer is currently modified. |



### afterSetCellMeta
`"afterSetCellMeta"(row, column, key, value)`

Fired after cell meta is changed.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| key | <code>string</code> | The updated meta key. |
| value | <code>\*</code> | The updated meta value. |



### afterRemoveCellMeta
`"afterRemoveCellMeta"(row, column, key, value)`

Fired after cell meta is removed.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| key | <code>string</code> | The removed meta key. |
| value | <code>\*</code> | Value which was under removed key of cell meta. |



### afterSetDataAtCell
`"afterSetDataAtCell"(changes, [source])`

Fired after cell data was changed.


| Param | Type | Description |
| --- | --- | --- |
| changes | <code>Array</code> | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterSetDataAtRowProp
`"afterSetDataAtRowProp"(changes, [source])`

Fired after cell data was changed.
Called only when `setDataAtRowProp` was executed.


| Param | Type | Description |
| --- | --- | --- |
| changes | <code>Array</code> | An array of changes in format `[[row, prop, oldValue, value], ...]`. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterSetSourceDataAtCell
`"afterSetSourceDataAtCell"(changes, [source])`

Fired after cell source data was changed.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| changes | <code>Array</code> | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call. |



### afterUpdateSettings
`"afterUpdateSettings"(newSettings)`

Fired after calling the `updateSettings` method.


| Param | Type | Description |
| --- | --- | --- |
| newSettings | <code>object</code> | New settings object. |



### afterValidate
`"afterValidate"(isValid, value, row, prop, [source]) ⇒ void | boolean`

A plugin hook executed after validator function, only if validator function is defined.
Validation result is the first parameter. This can be used to determinate if validation passed successfully or not.

__Returning false from the callback will mark the cell as invalid__.


| Param | Type | Description |
| --- | --- | --- |
| isValid | <code>boolean</code> | `true` if valid, `false` if not. |
| value | <code>\*</code> | The value in question. |
| row | <code>number</code> | Visual row index. |
| prop | <code>string</code> \| <code>number</code> | Property name / visual column index. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: <code>void</code> \| <code>boolean</code> - If `false` the cell will be marked as invalid, `true` otherwise.  

### beforeLanguageChange
`"beforeLanguageChange"(languageCode)`

Fired before successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | <code>string</code> | New language code. |



### afterLanguageChange
`"afterLanguageChange"(languageCode)`

Fired after successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | <code>string</code> | New language code. |



### beforeAutofill
`"beforeAutofill"(start, end, data) ⇒ \* | boolean`

Fired by [Autofill](autofill) plugin before populating the data in the autofill feature. This hook is fired when
[Options#fillHandle](options#fillhandle) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| start | <code>CellCoords</code> | Object containing information about first filled cell: `{row: 2, col: 0}`. |
| end | <code>CellCoords</code> | Object containing information about last filled cell: `{row: 4, col: 1}`. |
| data | <code>Array.&lt;Array&gt;</code> | 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`. |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### afterAutofill
`"afterAutofill"(start, end, data)`

Fired by [Autofill](autofill) plugin after populating the data in the autofill feature. This hook is fired when
[Options#fillHandle](options#fillhandle) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| start | <code>CellCoords</code> | Object containing information about first filled cell: `{row: 2, col: 0}`. |
| end | <code>CellCoords</code> | Object containing information about last filled cell: `{row: 4, col: 1}`. |
| data | <code>Array.&lt;Array&gt;</code> | 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`. |



### beforeCellAlignment
`"beforeCellAlignment"(stateBefore, range, type, alignmentClass)`

Fired before aligning the cell contents.


| Param | Type | Description |
| --- | --- | --- |
| stateBefore | <code>object</code> | An object with class names defining the cell alignment. |
| range | <code>Array.&lt;CellRange&gt;</code> | An array of CellRange coordinates where the alignment will be applied. |
| type | <code>string</code> | Type of the alignment - either `horizontal` or `vertical`. |
| alignmentClass | <code>string</code> | String defining the alignment class added to the cell. Possible values: * `htLeft` * `htCenter` * `htRight` * `htJustify` * `htTop` * `htMiddle` * `htBottom`. |



### beforeChange
`"beforeChange"(changes, [source]) ⇒ void | boolean`

Fired before one or more cells is changed. Its main purpose is to alter changes silently after input and before
table rendering.


| Param | Type | Description |
| --- | --- | --- |
| changes | <code>Array.&lt;Array&gt;</code> | 2D array containing information about each of the edited cells. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: <code>void</code> \| <code>boolean</code> - If `false` all changes were cancelled, `true` otherwise.  
**Example**  
```js
// To disregard a single change, set changes[i] to null or remove it from array using changes.splice(i, 1).
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0] = null;
  }
});
// To alter a single change, overwrite the desired value to changes[i][3].
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0][3] = 10;
  }
});
// To cancel all edit, return false from the callback or set array length to 0 (changes.length = 0).
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    return false;
  }
});
```

### beforeChangeRender
`"beforeChangeRender"(changes, [source])`

Fired right before rendering the changes.


| Param | Type | Description |
| --- | --- | --- |
| changes | <code>Array.&lt;Array&gt;</code> | Array in form of `[row, prop, oldValue, newValue]`. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### beforeDrawBorders
`"beforeDrawBorders"(corners, borderClassName)`

Fired before drawing the borders.


| Param | Type | Description |
| --- | --- | --- |
| corners | <code>Array</code> | Array specifying the current selection borders. |
| borderClassName | <code>string</code> | Specifies the border class name. |



### beforeGetCellMeta
`"beforeGetCellMeta"(row, column, cellProperties)`

Fired before getting cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| cellProperties | <code>object</code> | Object containing the cell's properties. |



### beforeRemoveCellMeta
`"beforeRemoveCellMeta"(row, column, key, value) ⇒ \* | boolean`

Fired before cell meta is removed.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| key | <code>string</code> | The removed meta key. |
| value | <code>\*</code> | Value which is under removed key of cell meta. |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### beforeInit
`"beforeInit"`

Fired before the Handsontable instance is initiated.



### beforeInitWalkontable
`"beforeInitWalkontable"(walkontableConfig)`

Fired before the Walkontable instance is initiated.


| Param | Type | Description |
| --- | --- | --- |
| walkontableConfig | <code>object</code> | Walkontable configuration object. |



### beforeLoadData
`"beforeLoadData"(sourceData, initialLoad)`

Fired before new data is loaded (by `loadData` or `updateSettings` method) into the data source array.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| sourceData | <code>Array</code> | Array of arrays or array of objects containing data. |
| initialLoad | <code>boolean</code> | Flag that determines whether the data has been loaded during the initialization. |



### beforeKeyDown
`"beforeKeyDown"(event)`

Fired before keydown event is handled. It can be used to overwrite default key bindings.

__Note__: To prevent default behavior you need to call `event.stopImmediatePropagation()` in your `beforeKeyDown`
handler.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | Original DOM event. |



### beforeOnCellMouseDown
`"beforeOnCellMouseDown"(event, coords, TD, controller)`

Fired after the user clicked a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | The `mousedown` event object. |
| coords | <code>CellCoords</code> | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | <code>HTMLTableCellElement</code> | TD element. |
| controller | <code>object</code> | An object with keys `row`, `column` and `cells` which contains boolean values. This                            object allows or disallows changing the selection for the particular axies. |



### beforeOnCellMouseUp
`"beforeOnCellMouseUp"(event, coords, TD)`

Fired after the user clicked a cell.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | The `mouseup` event object. |
| coords | <code>CellCoords</code> | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | <code>HTMLTableCellElement</code> | TD element. |



### beforeOnCellContextMenu
`"beforeOnCellContextMenu"(event, coords, TD)`

Fired after the user clicked a cell, but before all the calculations related with it.

**Since**: 4.1.0  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | The `contextmenu` event object. |
| coords | <code>CellCoords</code> | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | <code>HTMLTableCellElement</code> | TD element. |



### beforeOnCellMouseOver
`"beforeOnCellMouseOver"(event, coords, TD, controller)`

Fired after the user moved cursor over a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | The `mouseover` event object. |
| coords | <code>CellCoords</code> | CellCoords object containing the visual coordinates of the clicked cell. |
| TD | <code>HTMLTableCellElement</code> | TD element. |
| controller | <code>object</code> | An object with keys `row`, `column` and `cells` which contains boolean values. This                            object allows or disallows changing the selection for the particular axies. |



### beforeOnCellMouseOut
`"beforeOnCellMouseOut"(event, coords, TD)`

Fired after the user moved cursor out from a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | The `mouseout` event object. |
| coords | <code>CellCoords</code> | CellCoords object containing the visual coordinates of the leaved cell. |
| TD | <code>HTMLTableCellElement</code> | TD element. |



### beforeRemoveCol
`"beforeRemoveCol"(index, amount, physicalColumns, [source]) ⇒ \* | boolean`

Fired before one or more columns are about to be removed.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Visual index of starter column. |
| amount | <code>number</code> | Amount of columns to be removed. |
| physicalColumns | <code>Array.&lt;number&gt;</code> | An array of physical columns removed from the data source. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### beforeRemoveRow
`"beforeRemoveRow"(index, amount, physicalRows, [source]) ⇒ \* | boolean`

Fired when one or more rows are about to be removed.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Visual index of starter row. |
| amount | <code>number</code> | Amount of rows to be removed. |
| physicalRows | <code>Array.&lt;number&gt;</code> | An array of physical rows removed from the data source. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### beforeRender
`"beforeRender"(isForced, skipRender)`

Fired before the Handsontable table is rendered.


| Param | Type | Description |
| --- | --- | --- |
| isForced | <code>boolean</code> | If `true` rendering was triggered by a change of settings or data; or `false` if                           rendering was triggered by scrolling or moving selection. |
| skipRender | <code>object</code> | Object with `skipRender` property, if it is set to `true ` the next rendering cycle will be skipped. |



### beforeSetCellMeta
`"beforeSetCellMeta"(row, column, key, value) ⇒ \* | boolean`

Fired before cell meta is changed.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| key | <code>string</code> | The updated meta key. |
| value | <code>\*</code> | The updated meta value. |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### beforeSetRangeStartOnly
`"beforeSetRangeStartOnly"(coords)`

Fired before setting range is started but not finished yet.


| Param | Type | Description |
| --- | --- | --- |
| coords | <code>CellCoords</code> | CellCoords instance. |



### beforeSetRangeStart
`"beforeSetRangeStart"(coords)`

Fired before setting range is started.


| Param | Type | Description |
| --- | --- | --- |
| coords | <code>CellCoords</code> | CellCoords instance. |



### beforeSetRangeEnd
`"beforeSetRangeEnd"(coords)`

Fired before setting range is ended.


| Param | Type | Description |
| --- | --- | --- |
| coords | <code>CellCoords</code> | CellCoords instance. |



### beforeTouchScroll
`"beforeTouchScroll"`

Fired before the logic of handling a touch scroll, when user started scrolling on a touch-enabled device.



### beforeValidate
`"beforeValidate"(value, row, prop, [source])`

Fired before cell validation, only if validator function is defined. This can be used to manipulate the value
of changed cell before it is applied to the validator function.

__Note:__ this will not affect values of changes. This will change value *ONLY* for validation.


| Param | Type | Description |
| --- | --- | --- |
| value | <code>\*</code> | Value of the cell. |
| row | <code>number</code> | Visual row index. |
| prop | <code>string</code> \| <code>number</code> | Property name / column index. |
| [source] | <code>string</code> | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### beforeValueRender
`"beforeValueRender"(value, cellProperties)`

Fired before cell value is rendered into the DOM (through renderer function). This can be used to manipulate the
value which is passed to the renderer without modifying the renderer itself.


| Param | Type | Description |
| --- | --- | --- |
| value | <code>\*</code> | Cell value to render. |
| cellProperties | <code>object</code> | An object containing the cell properties. |



### construct
`"construct"`

Fired after Handsontable instance is constructed (using `new` operator).



### init
`"init"`

Fired after Handsontable instance is initiated but before table is rendered.



### modifyColHeader
`"modifyColHeader"(column)`

Fired when a column header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column header index. |



### modifyColWidth
`"modifyColWidth"(width, column)`

Fired when a column width is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| width | <code>number</code> | Current column width. |
| column | <code>number</code> | Visual column index. |



### modifyRowHeader
`"modifyRowHeader"(row)`

Fired when a row header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row header index. |



### modifyRowHeight
`"modifyRowHeight"(height, row)`

Fired when a row height is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| height | <code>number</code> | Row height. |
| row | <code>number</code> | Visual row index. |



### modifyData
`"modifyData"(row, column, valueHolder, ioMode)`

Fired when a data was retrieved or modified.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Physical row height. |
| column | <code>number</code> | Physical column index. |
| valueHolder | <code>object</code> | Object which contains original value which can be modified by overwriting `.value` property. |
| ioMode | <code>string</code> | String which indicates for what operation hook is fired (`get` or `set`). |



### modifySourceData
`"modifySourceData"(row, column, valueHolder, ioMode)`

Fired when a data was retrieved or modified from the source data set.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Physical row index. |
| column | <code>number</code> | Physical column index. |
| valueHolder | <code>object</code> | Object which contains original value which can be modified by overwriting `.value` property. |
| ioMode | <code>string</code> | String which indicates for what operation hook is fired (`get` or `set`). |



### modifyRowData
`"modifyRowData"(row)`

Fired when a data was retrieved or modified.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Physical row index. |



### modifyGetCellCoords
`"modifyGetCellCoords"(row, column, topmost)`

Used to modify the cell coordinates when using the `getCell` method, opening editor, getting value from the editor
and saving values from the closed editor.

**Since**: 0.36.0  

| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| topmost | <code>boolean</code> | If set to `true`, it returns the TD element from the topmost overlay. For example,                          if the wanted cell is in the range of fixed rows, it will return a TD element                          from the `top` overlay. |



### persistentStateLoad
`"persistentStateLoad"(key, valuePlaceholder)`

Fired by [PersistentState](persistent-state) plugin, after loading value, saved under given key, from browser local storage. This hook is fired when
[Options#persistentState](options#persistentstate) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Key. |
| valuePlaceholder | <code>object</code> | Object containing the loaded value under `valuePlaceholder.value` (if no value have been saved, `value` key will be undefined). |



### persistentStateReset
`"persistentStateReset"([key])`

Fired by [PersistentState](persistent-state) plugin after resetting data from local storage. If no key is given, all values associated with table will be cleared.
This hook is fired when [Options#persistentState](options#persistentstate) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| [key] | <code>string</code> | `optional` Key. |



### persistentStateSave
`"persistentStateSave"(key, value)`

Fired by [PersistentState](persistent-state) plugin, after saving value under given key in browser local storage. This hook is fired when
[Options#persistentState](options#persistentstate) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Key. |
| value | <code>Mixed</code> | Value to save. |



### beforeColumnSort
`"beforeColumnSort"(currentSortConfig, destinationSortConfigs) ⇒ boolean | void`

Fired by [ColumnSorting](column-sorting) and [MultiColumnSorting](multi-column-sorting) plugins before sorting the column. If you return `false` value inside callback for hook, then sorting
will be not applied by the Handsontable (useful for server-side sorting).

This hook is fired when [Options#columnSorting](options#columnsorting) or [Options#multiColumnSorting](options#multicolumnsorting) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentSortConfig | <code>Array</code> | Current sort configuration (for all sorted columns). |
| destinationSortConfigs | <code>Array</code> | Destination sort configuration (for all sorted columns). |


**Returns**: <code>boolean</code> \| <code>void</code> - If `false` the column will not be sorted, `true` otherwise.  

### afterColumnSort
`"afterColumnSort"(currentSortConfig, destinationSortConfigs)`

Fired by [ColumnSorting](column-sorting) and [MultiColumnSorting](multi-column-sorting) plugins after sorting the column. This hook is fired when [Options#columnSorting](options#columnsorting)
or [Options#multiColumnSorting](options#multicolumnsorting) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentSortConfig | <code>Array</code> | Current sort configuration (for all sorted columns). |
| destinationSortConfigs | <code>Array</code> | Destination sort configuration (for all sorted columns). |



### modifyAutofillRange
`"modifyAutofillRange"(startArea, entireArea)`

Fired by [Autofill](autofill) plugin after setting range of autofill. This hook is fired when [Options#fillHandle](options#fillhandle)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| startArea | <code>Array</code> | Array of visual coordinates of the starting point for the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |
| entireArea | <code>Array</code> | Array of visual coordinates of the entire area of the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |



### modifyCopyableRange
`"modifyCopyableRange"(copyableRanges)`

Fired to allow modifying the copyable range with a callback function.


| Param | Type | Description |
| --- | --- | --- |
| copyableRanges | <code>Array.&lt;Array&gt;</code> | Array of objects defining copyable cells. |



### beforeCut
`"beforeCut"(data, coords) ⇒ \*`

Fired by [CopyPaste](copy-paste) plugin before copying the values into clipboard and before clearing values of
the selected cells. This hook is fired when [Options#copyPaste](options#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array&gt;</code> | An array of arrays which contains data to cut. |
| coords | <code>Array.&lt;object&gt;</code> | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       which will be cut out. |


**Returns**: <code>\*</code> - If returns `false` then operation of the cutting out is canceled.  
**Example**  
```js
// To disregard a single row, remove it from the array using data.splice(i, 1).
new Handsontable(element, {
  beforeCut: function(data, coords) {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }
});
// To cancel a cutting action, just return `false`.
new Handsontable(element, {
  beforeCut: function(data, coords) {
    return false;
  }
});
```

### afterCut
`"afterCut"(data, coords)`

Fired by [CopyPaste](copy-paste) plugin after data was cut out from the table. This hook is fired when
[Options#copyPaste](options#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array&gt;</code> | An array of arrays which contains the cutted out data. |
| coords | <code>Array.&lt;object&gt;</code> | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       which was cut out. |



### beforeCopy
`"beforeCopy"(data, coords) ⇒ \*`

Fired before values are copied into clipboard.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array&gt;</code> | An array of arrays which contains data to copied. |
| coords | <code>Array.&lt;object&gt;</code> | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                         which will copied. |


**Returns**: <code>\*</code> - If returns `false` then copying is canceled.  
**Example**  
```js
// To disregard a single row, remove it from array using data.splice(i, 1).
...
new Handsontable(document.getElementById('example'), {
  beforeCopy: (data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }
});
...

// To cancel copying, return false from the callback.
...
new Handsontable(document.getElementById('example'), {
  beforeCopy: (data, coords) => {
    return false;
  }
});
...
```

### afterCopy
`"afterCopy"(data, coords)`

Fired by [CopyPaste](copy-paste) plugin after data are pasted into table. This hook is fired when [Options#copyPaste](options#copypaste)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array&gt;</code> | An array of arrays which contains the copied data. |
| coords | <code>Array.&lt;object&gt;</code> | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                         which was copied. |



### beforePaste
`"beforePaste"(data, coords) ⇒ \*`

Fired by [CopyPaste](copy-paste) plugin before values are pasted into table. This hook is fired when
[Options#copyPaste](options#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array&gt;</code> | An array of arrays which contains data to paste. |
| coords | <code>Array.&lt;object&gt;</code> | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       that correspond to the previously selected area. |


**Returns**: <code>\*</code> - If returns `false` then pasting is canceled.  
**Example**  
```js
// To disregard a single row, remove it from array using data.splice(i, 1).
new Handsontable(example, {
  beforePaste: (data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }
});
// To cancel pasting, return false from the callback.
new Handsontable(example, {
  beforePaste: (data, coords) => {
    return false;
  }
});
```

### afterPaste
`"afterPaste"(data, coords)`

Fired by [CopyPaste](copy-paste) plugin after values are pasted into table. This hook is fired when
[Options#copyPaste](options#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array&gt;</code> | An array of arrays which contains the pasted data. |
| coords | <code>Array.&lt;object&gt;</code> | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       that correspond to the previously selected area. |



### beforeColumnMove
`"beforeColumnMove"(movedColumns, finalIndex, dropIndex, movePossible) ⇒ void | boolean`

Fired by [ManualColumnMove](manual-column-move) plugin before change order of the visual indexes. This hook is fired when
[Options#manualColumnMove](options#manualcolumnmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | <code>Array</code> | Array of visual column indexes to be moved. |
| finalIndex | <code>number</code> | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | <code>number</code> \| <code>undefined</code> | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragColumns` function wasn't called. |
| movePossible | <code>boolean</code> | Indicates if it's possible to move rows to the desired position. |


**Returns**: <code>void</code> \| <code>boolean</code> - If `false` the column will not be moved, `true` otherwise.  

### afterColumnMove
`"afterColumnMove"(movedColumns, finalIndex, dropIndex, movePossible, orderChanged)`

Fired by [ManualColumnMove](manual-column-move) plugin after changing order of the visual indexes. This hook is fired when
[Options#manualColumnMove](options#manualcolumnmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | <code>Array</code> | Array of visual column indexes to be moved. |
| finalIndex | <code>number</code> | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | <code>number</code> \| <code>undefined</code> | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragColumns` function wasn't called. |
| movePossible | <code>boolean</code> | Indicates if it was possible to move columns to the desired position. |
| orderChanged | <code>boolean</code> | Indicates if order of columns was changed by move. |



### beforeRowMove
`"beforeRowMove"(movedRows, finalIndex, dropIndex, movePossible) ⇒ \* | boolean`

Fired by [ManualRowMove](manual-row-move) plugin before changing the order of the visual indexes. This hook is fired when
[Options#manualRowMove](options#manualrowmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | <code>Array</code> | Array of visual row indexes to be moved. |
| finalIndex | <code>number</code> | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | <code>number</code> \| <code>undefined</code> | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragRows` function wasn't called. |
| movePossible | <code>boolean</code> | Indicates if it's possible to move rows to the desired position. |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### afterRowMove
`"afterRowMove"(movedRows, finalIndex, dropIndex, movePossible, orderChanged)`

Fired by [ManualRowMove](manual-row-move) plugin after changing the order of the visual indexes. This hook is fired when
[Options#manualRowMove](options#manualrowmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | <code>Array</code> | Array of visual row indexes to be moved. |
| finalIndex | <code>number</code> | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | <code>number</code> \| <code>undefined</code> | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragRows` function wasn't called. |
| movePossible | <code>boolean</code> | Indicates if it was possible to move rows to the desired position. |
| orderChanged | <code>boolean</code> | Indicates if order of rows was changed by move. |



### beforeColumnResize
`"beforeColumnResize"(newSize, column, isDoubleClick) ⇒ number`

Fired by [ManualColumnResize](manual-column-resize) plugin before rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](options#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | <code>number</code> | Calculated new column width. |
| column | <code>number</code> | Visual index of the resized column. |
| isDoubleClick | <code>boolean</code> | Flag that determines whether there was a double-click. |


**Returns**: <code>number</code> - Returns a new column size or `undefined`, if column size should be calculated automatically.  

### afterColumnResize
`"afterColumnResize"(newSize, column, isDoubleClick)`

Fired by [ManualColumnResize](manual-column-resize) plugin after rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](options#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | <code>number</code> | Calculated new column width. |
| column | <code>number</code> | Visual index of the resized column. |
| isDoubleClick | <code>boolean</code> | Flag that determines whether there was a double-click. |



### beforeRowResize
`"beforeRowResize"(newSize, row, isDoubleClick) ⇒ number`

Fired by [ManualRowResize](manual-row-resize) plugin before rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](options#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | <code>number</code> | Calculated new row height. |
| row | <code>number</code> | Visual index of the resized row. |
| isDoubleClick | <code>boolean</code> | Flag that determines whether there was a double-click. |


**Returns**: <code>number</code> - Returns the new row size or `undefined` if row size should be calculated automatically.  

### afterRowResize
`"afterRowResize"(newSize, row, isDoubleClick)`

Fired by [ManualRowResize](manual-row-resize) plugin after rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](options#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | <code>number</code> | Calculated new row height. |
| row | <code>number</code> | Visual index of the resized row. |
| isDoubleClick | <code>boolean</code> | Flag that determines whether there was a double-click. |



### afterGetColumnHeaderRenderers
`"afterGetColumnHeaderRenderers"(renderers)`

Fired after getting the column header renderers.


| Param | Type | Description |
| --- | --- | --- |
| renderers | <code>Array.&lt;function()&gt;</code> | An array of the column header renderers. |



### afterGetRowHeaderRenderers
`"afterGetRowHeaderRenderers"(renderers)`

Fired after getting the row header renderers.


| Param | Type | Description |
| --- | --- | --- |
| renderers | <code>Array.&lt;function()&gt;</code> | An array of the row header renderers. |



### beforeStretchingColumnWidth
`"beforeStretchingColumnWidth"(stretchedWidth, column) ⇒ number`

Fired before applying stretched column width to column.


| Param | Type | Description |
| --- | --- | --- |
| stretchedWidth | <code>number</code> | Calculated width. |
| column | <code>number</code> | Visual column index. |


**Returns**: <code>number</code> - Returns new width which will be applied to the column element.  

### beforeFilter
`"beforeFilter"(conditionsStack) ⇒ boolean`

Fired by [Filters](filters) plugin before applying [filtering](https://handsontable.com/docs/demo-filtering.html). This hook is fired when
[Options#filters](options#filters) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| conditionsStack | <code>Array.&lt;object&gt;</code> | An array of objects with added formulas. ```js // Example format of the conditionsStack argument: [   {     column: 2,     conditions: [       {name: 'begins_with', args: [['S']]}     ],     operation: 'conjunction'   },   {     column: 4,     conditions: [       {name: 'not_empty', args: []}     ],     operation: 'conjunction'   }, ] ``` |


**Returns**: <code>boolean</code> - If hook returns `false` value then filtering won't be applied on the UI side (server-side filtering).  

### afterFilter
`"afterFilter"(conditionsStack)`

Fired by [Filters](filters) plugin after applying [filtering](https://handsontable.com/docs/demo-filtering.html). This hook is fired when
[Options#filters](options#filters) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| conditionsStack | <code>Array.&lt;object&gt;</code> | An array of objects with added conditions. ```js // Example format of the conditionsStack argument: [   {     column: 2,     conditions: [       {name: 'begins_with', args: [['S']]}     ],     operation: 'conjunction'   },   {     column: 4,     conditions: [       {name: 'not_empty', args: []}     ],     operation: 'conjunction'   }, ] ``` |



### modifyColumnHeaderHeight
`"modifyColumnHeaderHeight"`

Fired while retrieving the column header height.



### beforeUndo
`"beforeUndo"(action) ⇒ \* | boolean`

Fired by [UndoRedo](undo-redo) plugin before the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](options#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | <code>object</code> | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### afterUndo
`"afterUndo"(action)`

Fired by [UndoRedo](undo-redo) plugin after the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](options#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | <code>object</code> | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |



### beforeRedo
`"beforeRedo"(action) ⇒ \* | boolean`

Fired by [UndoRedo](undo-redo) plugin before the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](options#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | <code>object</code> | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |


**Returns**: <code>\*</code> \| <code>boolean</code> - If false is returned the action is canceled.  

### afterRedo
`"afterRedo"(action)`

Fired by [UndoRedo](undo-redo) plugin after the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](options#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | <code>object</code> | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |



### modifyRowHeaderWidth
`"modifyRowHeaderWidth"(rowHeaderWidth)`

Fired while retrieving the row header width.


| Param | Type | Description |
| --- | --- | --- |
| rowHeaderWidth | <code>number</code> | Row header width. |



### beforeAutofillInsidePopulate
`"beforeAutofillInsidePopulate"(index, direction, input, deltas)`

Fired from the `populateFromArray` method during the `autofill` process. Fired for each "autofilled" cell individually.


| Param | Type | Description |
| --- | --- | --- |
| index | <code>object</code> | Object containing `row` and `col` properties, defining the number of rows/columns from the initial cell of the autofill. |
| direction | <code>string</code> | Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`. |
| input | <code>Array.&lt;Array&gt;</code> | Contains an array of rows with data being used in the autofill. |
| deltas | <code>Array</code> | The deltas array passed to the `populateFromArray` method. |



### modifyTransformStart
`"modifyTransformStart"(delta)`

Fired when the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | <code>CellCoords</code> | Cell coords object declaring the delta of the new selection relative to the previous one. |



### modifyTransformEnd
`"modifyTransformEnd"(delta)`

Fired when the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | <code>CellCoords</code> | Cell coords object declaring the delta of the new selection relative to the previous one. |



### afterModifyTransformStart
`"afterModifyTransformStart"(coords, rowTransformDir, colTransformDir)`

Fired after the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | <code>CellCoords</code> | Coords of the freshly selected cell. |
| rowTransformDir | <code>number</code> | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | <code>number</code> | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterModifyTransformEnd
`"afterModifyTransformEnd"(coords, rowTransformDir, colTransformDir)`

Fired after the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | <code>CellCoords</code> | Visual coords of the freshly selected cell. |
| rowTransformDir | <code>number</code> | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | <code>number</code> | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterViewportRowCalculatorOverride
`"afterViewportRowCalculatorOverride"(calc)`

Fired inside the `viewportRowCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | <code>object</code> | The row calculator. |



### afterViewportColumnCalculatorOverride
`"afterViewportColumnCalculatorOverride"(calc)`

Fired inside the `viewportColumnCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | <code>object</code> | The row calculator. |



### afterPluginsInitialized
`"afterPluginsInitialized"`

Fired after initializing all the plugins.
This hook should be added before Handsontable is initialized.


**Example**  
```js
Handsontable.hooks.add('afterPluginsInitialized', myCallback);
```

### beforeHideRows
`"beforeHideRows"(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenRows](hidden-rows) plugin before marking the rows as hidden. Fired only if the [Options#hiddenRows](options#hiddenrows) option is enabled.
Returning `false` in the callback will prevent the hiding action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if provided row indexes are valid, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the hiding action will not be completed.  

### afterHideRows
`"afterHideRows"(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenRows](hidden-rows) plugin after marking the rows as hidden. Fired only if the [Options#hiddenRows](options#hiddenrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if provided row indexes are valid, `false` otherwise. |
| stateChanged | <code>boolean</code> | `true`, if the action affected any non-hidden rows, `false` otherwise. |



### beforeUnhideRows
`"beforeUnhideRows"(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenRows](hidden-rows) plugin before marking the rows as not hidden. Fired only if the [Options#hiddenRows](options#hiddenrows) option is enabled.
Returning `false` in the callback will prevent the row revealing action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if provided row indexes are valid, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the revealing action will not be completed.  

### afterUnhideRows
`"afterUnhideRows"(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenRows](hidden-rows) plugin after marking the rows as not hidden. Fired only if the [Options#hiddenRows](options#hiddenrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if provided row indexes are valid, `false` otherwise. |
| stateChanged | <code>boolean</code> | `true`, if the action affected any hidden rows, `false` otherwise. |



### beforeHideColumns
`"beforeHideColumns"(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenColumns](hidden-columns) plugin before marking the columns as hidden. Fired only if the [Options#hiddenColumns](options#hiddencolumns) option is enabled.
Returning `false` in the callback will prevent the hiding action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | <code>boolean</code> | `true`, if the provided column indexes are valid, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the hiding action will not be completed.  

### afterHideColumns
`"afterHideColumns"(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenColumns](hidden-columns) plugin after marking the columns as hidden. Fired only if the [Options#hiddenColumns](options#hiddencolumns) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | <code>boolean</code> | `true`, if the provided column indexes are valid, `false` otherwise. |
| stateChanged | <code>boolean</code> | `true`, if the action affected any non-hidden columns, `false` otherwise. |



### beforeUnhideColumns
`"beforeUnhideColumns"(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenColumns](hidden-columns) plugin before marking the columns as not hidden. Fired only if the [Options#hiddenColumns](options#hiddencolumns) option is enabled.
Returning `false` in the callback will prevent the column revealing action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | <code>boolean</code> | `true`, if the provided column indexes are valid, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the hiding action will not be completed.  

### afterUnhideColumns
`"afterUnhideColumns"(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenColumns](hidden-columns) plugin after marking the columns as not hidden. Fired only if the [Options#hiddenColumns](options#hiddencolumns) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | <code>Array</code> | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | <code>Array</code> | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | <code>boolean</code> | `true`, if the provided column indexes are valid, `false` otherwise. |
| stateChanged | <code>boolean</code> | `true`, if the action affected any hidden columns, `false` otherwise. |



### beforeTrimRow
`"beforeTrimRow"(currentTrimConfig, destinationTrimConfig, actionPossible) ⇒ undefined | boolean`

Fired by [TrimRows](trim-rows) plugin before trimming rows. This hook is fired when [Options#trimRows](options#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | <code>Array</code> | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | <code>Array</code> | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the trimming action will not be completed.  

### afterTrimRow
`"afterTrimRow"(currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged) ⇒ undefined | boolean`

Fired by [TrimRows](trim-rows) plugin after trimming rows. This hook is fired when [Options#trimRows](options#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | <code>Array</code> | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | <code>Array</code> | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |
| stateChanged | <code>boolean</code> | `true`, if the action affected any non-trimmed rows, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the trimming action will not be completed.  

### beforeUntrimRow
`"beforeUntrimRow"(currentTrimConfig, destinationTrimConfig, actionPossible) ⇒ undefined | boolean`

Fired by [TrimRows](trim-rows) plugin before untrimming rows. This hook is fired when [Options#trimRows](options#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | <code>Array</code> | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | <code>Array</code> | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the untrimming action will not be completed.  

### afterUntrimRow
`"afterUntrimRow"(currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged) ⇒ undefined | boolean`

Fired by [TrimRows](trim-rows) plugin after untrimming rows. This hook is fired when [Options#trimRows](options#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | <code>Array</code> | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | <code>Array</code> | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | <code>boolean</code> | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |
| stateChanged | <code>boolean</code> | `true`, if the action affected any trimmed rows, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the untrimming action will not be completed.  

### beforeDropdownMenuShow
`"beforeDropdownMenuShow"(dropdownMenu)`

Fired by [DropdownMenu](dropdown-menu) plugin before opening the dropdown menu. This hook is fired when [Options#dropdownMenu](options#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | <code>DropdownMenu</code> | The DropdownMenu instance. |



### afterDropdownMenuShow
`"afterDropdownMenuShow"(dropdownMenu)`

Fired by [DropdownMenu](dropdown-menu) plugin after opening the Dropdown Menu. This hook is fired when [Options#dropdownMenu](options#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | <code>DropdownMenu</code> | The DropdownMenu instance. |



### afterDropdownMenuHide
`"afterDropdownMenuHide"(instance)`

Fired by [DropdownMenu](dropdown-menu) plugin after hiding the Dropdown Menu. This hook is fired when [Options#dropdownMenu](options#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| instance | <code>DropdownMenu</code> | The DropdownMenu instance. |



### beforeAddChild
`"beforeAddChild"(parent, element, index)`

Fired by [NestedRows](nested-rows) plugin before adding a children to the NestedRows structure. This hook is fired when
[Options#nestedRows](options#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | <code>object</code> | The parent object. |
| element | <code>object</code> \| <code>undefined</code> | The element added as a child. If `undefined`, a blank child was added. |
| index | <code>number</code> \| <code>undefined</code> | The index within the parent where the new child was added. If `undefined`, the element was added as the last child. |



### afterAddChild
`"afterAddChild"(parent, element, index)`

Fired by [NestedRows](nested-rows) plugin after adding a children to the NestedRows structure. This hook is fired when
[Options#nestedRows](options#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | <code>object</code> | The parent object. |
| element | <code>object</code> \| <code>undefined</code> | The element added as a child. If `undefined`, a blank child was added. |
| index | <code>number</code> \| <code>undefined</code> | The index within the parent where the new child was added. If `undefined`, the element was added as the last child. |



### beforeDetachChild
`"beforeDetachChild"(parent, element)`

Fired by [NestedRows](nested-rows) plugin before detaching a child from its parent. This hook is fired when
[Options#nestedRows](options#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | <code>object</code> | An object representing the parent from which the element is to be detached. |
| element | <code>object</code> | The detached element. |



### afterDetachChild
`"afterDetachChild"(parent, element)`

Fired by [NestedRows](nested-rows) plugin after detaching a child from its parent. This hook is fired when
[Options#nestedRows](options#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | <code>object</code> | An object representing the parent from which the element was detached. |
| element | <code>object</code> | The detached element. |



### afterBeginEditing
`"afterBeginEditing"(row, column)`

Fired after the editor is opened and rendered.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index of the edited cell. |
| column | <code>number</code> | Visual column index of the edited cell. |



### beforeMergeCells
`"beforeMergeCells"(cellRange, [auto])`

Fired by [MergeCells](merge-cells) plugin before cell merging. This hook is fired when [Options#mergeCells](options#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | <code>CellRange</code> |  | Selection cell range. |
| [auto] | <code>boolean</code> | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterMergeCells
`"afterMergeCells"(cellRange, mergeParent, [auto])`

Fired by [MergeCells](merge-cells) plugin after cell merging. This hook is fired when [Options#mergeCells](options#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | <code>CellRange</code> |  | Selection cell range. |
| mergeParent | <code>object</code> |  | The parent collection of the provided cell range. |
| [auto] | <code>boolean</code> | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### beforeUnmergeCells
`"beforeUnmergeCells"(cellRange, [auto])`

Fired by [MergeCells](merge-cells) plugin before unmerging the cells. This hook is fired when [Options#mergeCells](options#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | <code>CellRange</code> |  | Selection cell range. |
| [auto] | <code>boolean</code> | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterUnmergeCells
`"afterUnmergeCells"(cellRange, [auto])`

Fired by [MergeCells](merge-cells) plugin after unmerging the cells. This hook is fired when [Options#mergeCells](options#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | <code>CellRange</code> |  | Selection cell range. |
| [auto] | <code>boolean</code> | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterListen
`"afterListen"`

Fired after the table was switched into listening mode. This allows Handsontable to capture keyboard events and
respond in the right way.



### afterUnlisten
`"afterUnlisten"`

Fired after the table was switched off from the listening mode. This makes the Handsontable inert for any
keyboard events.



### afterRefreshDimensions
`"afterRefreshDimensions"(previousDimensions, currentDimensions, stateChanged)`

Fired after the window was resized.


| Param | Type | Description |
| --- | --- | --- |
| previousDimensions | <code>object</code> | Previous dimensions of the container. |
| currentDimensions | <code>object</code> | Current dimensions of the container. |
| stateChanged | <code>boolean</code> | `true`, if the container was re-render, `false` otherwise. |



### beforeRefreshDimensions
`"beforeRefreshDimensions"(previousDimensions, currentDimensions, actionPossible) ⇒ undefined | boolean`

Cancellable hook, called after resizing a window, but before redrawing a table.


| Param | Type | Description |
| --- | --- | --- |
| previousDimensions | <code>object</code> | Previous dimensions of the container. |
| currentDimensions | <code>object</code> | Current dimensions of the container. |
| actionPossible | <code>boolean</code> | `true`, if current and previous dimensions are different, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the refresh action will not be completed.  

### beforeColumnCollapse
`"beforeColumnCollapse"(currentCollapsedColumns, destinationCollapsedColumns, collapsePossible) ⇒ undefined | boolean`

Fired by [CollapsibleColumns](collapsible-columns) plugin before columns collapse. This hook is fired when [Options#collapsibleColumns](options#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | <code>Array</code> | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | <code>Array</code> | Destination collapsible configuration - a list of collapsible physical column indexes. |
| collapsePossible | <code>boolean</code> | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the collapsing action will not be completed.  

### afterColumnCollapse
`"afterColumnCollapse"(currentCollapsedColumns, destinationCollapsedColumns, collapsePossible, successfullyCollapsed)`

Fired by [CollapsibleColumns](collapsible-columns) plugin before columns collapse. This hook is fired when [Options#collapsibleColumns](options#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | <code>Array</code> | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | <code>Array</code> | Destination collapsible configuration - a list of collapsible physical column indexes. |
| collapsePossible | <code>boolean</code> | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |
| successfullyCollapsed | <code>boolean</code> | `true`, if the action affected any non-collapsible column, `false` otherwise. |



### beforeColumnExpand
`"beforeColumnExpand"(currentCollapsedColumns, destinationCollapsedColumns, expandPossible) ⇒ undefined | boolean`

Fired by [CollapsibleColumns](collapsible-columns) plugin before columns expand. This hook is fired when [Options#collapsibleColumns](options#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | <code>Array</code> | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | <code>Array</code> | Destination collapsible configuration - a list of collapsible physical column indexes. |
| expandPossible | <code>boolean</code> | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |


**Returns**: <code>undefined</code> \| <code>boolean</code> - If the callback returns `false`, the expanding action will not be completed.  

### afterColumnExpand
`"afterColumnExpand"(currentCollapsedColumns, destinationCollapsedColumns, expandPossible, successfullyExpanded)`

Fired by [CollapsibleColumns](collapsible-columns) plugin before columns expand. This hook is fired when [Options#collapsibleColumns](options#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | <code>Array</code> | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | <code>Array</code> | Destination collapsible configuration - a list of collapsible physical column indexes. |
| expandPossible | <code>boolean</code> | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |
| successfullyExpanded | <code>boolean</code> | `true`, if the action affected any non-collapsible column, `false` otherwise. |



