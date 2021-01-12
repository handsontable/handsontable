---
id: tutorial-using-callbacks
title: Using callbacks
sidebar_label: Using callbacks
slug: /tutorial-using-callbacks
---

*   [Callbacks](#page-callbacks)
*   [Definition for `source` argument](#page-source-definition)
*   [`beforeKeyDown` use case](#page-beforeKeyDown)

### Callbacks

This page shows usage of some callbacks available in Handsontable. If you require a new callback to be added, please [open an issue](https://github.com/handsontable/handsontable/issues/new). Note that some callbacks are checked on this page by default.

Clear log

**Choose events to be logged:**

*   **select all**

Log to console

var data = \[ \['', 'Tesla', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'\], \['2017', 0, 2941, 4303, 354, 5814\], \['2018', 3, 2905, 2867, 412, 5284\], \['2019', 4, 2517, 4822, 552, 6127\], \['2020', 2, 2422, 5399, 776, 4151\] \], example1 = document.getElementById('example1'), config, $hooksList, hooks, hot; config = { data: data, minRows: 5, minCols: 6, minSpareRows: 1, autoWrapRow: true, colHeaders: true, contextMenu: true }; $hooksList = $('#hooksList'); hooks = Handsontable.hooks.getRegistered(); hooks.forEach(function(hook) { var checked = ''; if (hook === 'afterChange' || hook === 'afterSelection' || hook === 'afterCreateRow' || hook === 'afterRemoveRow' || hook === 'afterCreateCol' || hook === 'afterRemoveCol') { checked = 'checked'; } $hooksList.append('<li><label><input type="checkbox" ' + checked + ' id="check\_' + hook + '"> ' + hook + '</label></li>'); config\[hook\] = function() { log\_events(hook, arguments); } }); var start = (new Date()).getTime(); var i = 0; var timer; var example1\_events = document.getElementById("example1\_events"); function log\_events(event, data) { if (document.getElementById('check\_' + event).checked) { var now = (new Date()).getTime(), diff = now - start, vals, str, div, text; vals = \[ i, "@" + numbro(diff / 1000).format('0.000'), "\[" + event + "\]" \]; for (var d = 0; d < data.length; d++) { try { str = JSON.stringify(data\[d\]); } catch (e) { str = data\[d\].toString(); // JSON.stringify breaks on circular reference to a HTML node } if (str === void 0) { continue; } if (str.length > 20) { str = Object.prototype.toString.call(data\[d\]); } if (d < data.length - 1) { str += ','; } vals.push(str); } if (window.console) { console.log(i, "@" + numbro(diff / 1000).format('0.000'), "\[" + event + "\]", data); } div = document.createElement("DIV"); text = document.createTextNode(vals.join(" ")); div.appendChild(text); example1\_events.appendChild(div); clearTimeout(timer); timer = setTimeout(function() { example1\_events.scrollTop = example1\_events.scrollHeight; }, 10); i++; } } example1 = document.getElementById('example1'); hot = new Handsontable(example1,config); $('#check\_select\_all').click(function () { var state = this.checked; $('#hooksList input\[type=checkbox\]').each(function () { this.checked = state; }); }); $('#hooksList input\[type=checkbox\]').click(function () { if (!this.checked) { document.getElementById('check\_select\_all').checked = false; } });

### Definition for `source` argument

It's worth to mention that some of the hooks are triggered from the inside of the Handsontable (Core) and some from the plugins. In some situations it is helpful to know what triggered the callback (if it was done by Handsontable itself, triggered from external code or a user action). That's why in crucial hooks Handsontable delivers `source` as an argument which informs you about who've triggered the action. Thanks to `source` you can create additional conditions based on that information.

`source` argument is optional. It takes following values:

*   `auto` - Action triggered by Handsontable and reason for it is releated directly with settings aplied to Handsontable. For instance `afterCreateRow` will be fired with this when `minSpareRows` will be greater then 0;
*   `edit` - Action triggered by Handsontable after the data has been changed (for example after an edit or using `setData*` methods);
*   `loadData` - Action triggered by Handsontable after the `loadData` or `updateSettings({data: myData})`(with `data` property) method has been called;
*   `populateFromArray` - Action triggered by Handsontable after requesting for populating data;
*   `spliceCol` - Action triggered by Handsontable after the column data splicing has been done;
*   `spliceRow` - Action triggered by Handsontable after the row data splicing has been done;
*   `timeValidate` - Action triggered by Handsontable after the time validator has been called (for example after an edit);
*   `dateValidate` - Action triggered by Handsontable after the date validator has been called (for example after an edit);
*   `validateCells` - Action triggered by Handsontable after the validation process has been triggered;
*   `Autofill.fill` - Action triggered by the AutoFill plugin;
*   `ContextMenu.clearColumns` - Action triggered by the ContextMenu plugin after the "Clear column" has been clicked;
*   `ContextMenu.columnLeft` - Action triggered by the ContextMenu plugin after the "Insert column on the left" has been clicked;
*   `ContextMenu.columnRight` - Action triggered by the ContextMenu plugin after the "Insert column on the right" has been clicked;
*   `ContextMenu.removeColumn` - Action triggered by the ContextMenu plugin after the "Remove column" has been clicked;
*   `ContextMenu.removeRow` - Action triggered by the ContextMenu plugin after the "Remove Row" has been clicked;
*   `ContextMenu.rowAbove` - Action triggered by the ContextMenu plugin after the "Insert row above" has been clicked;
*   `ContextMenu.rowBelow` - Action triggered by the ContextMenu plugin after the "Insert row below" has been clicked;
*   `CopyPaste.paste` - Action triggered by the CopyPaste plugin after the value has been pasted;
*   `ObserveChanges.change` - Action triggered by the ObserveChanges plugin after the changes has been detected;
*   `UndoRedo.redo` - Action triggered by the UndoRedo plugin after the change has been redone;
*   `UndoRedo.undo` - Action triggered by the UndoRedo plugin after the change has been undone;
*   `ColumnSummary.set` - Action triggered by the ColumnSummary plugin after the calculation has been done;
*   `ColumnSummary.reset` - Action triggered by the ColumnSummary plugin after the calculation has been reset.

List of callback that operates on `source` parameter:

*   [afterChange](https://handsontable.com/docs/8.2.0/Hooks.html#event:afterChange)
*   [afterCreateCol](https://handsontable.com/docs/8.2.0/Hooks.html#event:afterCreateCol)
*   [afterCreateRow](https://handsontable.com/docs/8.2.0/Hooks.html#event:afterCreateRow)
*   [afterSetDataAtCell](https://handsontable.com/docs/8.2.0/Hooks.html#event:afterSetDataAtCell)
*   [afterSetDataAtRowProp](https://handsontable.com/docs/8.2.0/Hooks.html#event:afterSetDataAtRowProp)
*   [afterValidate](https://handsontable.com/docs/8.2.0/Hooks.html#event:afterValidate)
*   [beforeChange](https://handsontable.com/docs/8.2.0/Hooks.html#event:beforeChange)
*   [beforeChangeRender](https://handsontable.com/docs/8.2.0/Hooks.html#event:beforeChangeRender)
*   [beforeCreateCol](https://handsontable.com/docs/8.2.0/Hooks.html#event:beforeCreateCol)
*   [beforeCreateRow](https://handsontable.com/docs/8.2.0/Hooks.html#event:beforeCreateRow)
*   [beforeValidate](https://handsontable.com/docs/8.2.0/Hooks.html#event:beforeValidate)

### `beforeKeyDown` use case

The following demo uses `beforeKeyDown` callback to modify some key bindings:

*   Pressing DELETE or BACKSPACE on a cell deletes the cell and shifts all cells beneath it in the column up resulting in the cursor (which doesn't move) having the value previously beneath it, now in the current cell.
*   Pressing ENTER in a cell (not changing the value) results in pushing all the cells in the column beneath this cell down one row (including current cell) resulting in a blank cell under the cursor (which hasn't moved).

Log to console

var data = \[ \['Tesla', 2017, 'black', 'black'\], \['Nissan', 2018, 'blue', 'blue'\], \['Chrysler', 2019, 'yellow', 'black'\], \['Volvo', 2020, 'yellow', 'gray'\] \], container = document.getElementById("example2"), lastChange = null, hot; hot = new Handsontable(container, { data: data, colHeaders: true, rowHeaders: true, minSpareRows: 1, beforeChange: function (changes, source) { lastChange = changes; } }); hot.updateSettings({ beforeKeyDown: function (e) { var selection = hot.getSelected(); // BACKSPACE or DELETE if (e.keyCode === 8 || e.keyCode === 46) { e.stopImmediatePropagation(); // remove data at cell, shift up hot.spliceCol(selection\[1\], selection\[0\], 1); e.preventDefault(); } // ENTER else if (e.keyCode === 13) { // if last change affected a single cell and did not change it's values if (lastChange && lastChange.length === 1 && lastChange\[0\]\[2\] == lastChange\[0\]\[3\]) { e.stopImmediatePropagation(); hot.spliceCol(selection\[1\], selection\[0\], 0, ''); // add new cell hot.selectCell(selection\[0\], selection\[1\]); // select new cell } } lastChange = null; } } );
