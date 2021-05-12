---
title: Using callbacks
metaTitle: Using callbacks - Guide - Handsontable Documentation
permalink: /next/using-callbacks
canonicalUrl: /using-callbacks
tags:
  - events
  - hooks 
---

<style>
#hooksList {
  height: 500px;
  overflow-y: scroll;
}
#hooksList li {
  width: 50%;
  float: left;
  margin: 0;
  list-style: none;
}
#example1 {
  box-sizing: border-box;
  height: 100%;
  display: inline-block;
  width: 50%;
  margin: 0;
}
#example1-events {
  margin-bottom: 4px;
  box-sizing: border-box;
  width: 100%;
  float: right;
  height: 103px;
  padding: 0.5rem;
  overflow: auto;
  font-size: 11px;
  border: 1px solid #CCC;
}
.clear-log {
  margin-top: 0.5rem;
  text-align: right;
}
.clear-log button {
  padding: .3rem .5rem .31rem;
  color: #fff;
  font-size: 13px;
  border: none;
  background: #9e9e9e;
  cursor: pointer;
}
</style>

# Using callbacks

[[toc]]

## Callbacks

Learn how to use some of the callbacks available in Handsontable. Note that some callbacks are checked on this page by default.

::: example #example1 --html 1 --js 2 --hidden
```html
<div id="example1"></div>
<div id="example1-events"></div>
<div class="clear-log">
  <button>Clear log</button>
</div>

<h4>Choose events to be logged:</h4>

<ul id="hooksList">
  <li>
    <label>
      <input type="checkbox" id="check_select_all">
      <strong>select all</strong>
    </label>
    </li>
</ul>
```
```js
const data = [
  ['', 'Tesla', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'],
  ['2017', 0, 2941, 4303, 354, 5814],
  ['2018', 3, 2905, 2867, 412, 5284],
  ['2019', 4, 2517, 4822, 552, 6127],
  ['2020', 2, 2422, 5399, 776, 4151]
]
const example1 = document.getElementById('example1');
const hooksList = document.getElementById('hooksList');
const hooks = Handsontable.hooks.getRegistered();
const hotConfig = {
  data: data,
  width: '100%',
  minRows: 5,
  minCols: 6,
  stretchH: 'all',
  minSpareRows: 1,
  autoWrapRow: true,
  colHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
}

hooks.forEach(function(hook) {
  let checked = '';

  if (hook === 'afterChange' || hook === 'afterSelection' || hook === 'afterCreateRow' || hook === 'afterRemoveRow' || hook === 'afterCreateCol' || hook === 'afterRemoveCol') {
    checked = 'checked';
  }

  hooksList.innerHTML += '<li><label><input type="checkbox" ' + checked + ' id="check\_' + hook + '"> ' + hook + '</label></li>';
  hotConfig[hook] = function() {
    logEvents(hook, arguments);
  }
});

const start = (new Date()).getTime();
const example1Events = document.getElementById("example1-events");
let i = 0;
let timer;

function logEvents(event, data) {
  if (document.getElementById('check\_' + event).checked) {
    const now = (new Date()).getTime();
    const diff = now - start;
    let str = '';

    const vals = [ i, "@" + numbro(diff / 1000).format('0.000'), "[" + event + "]"];

    for (let d = 0; d < data.length; d++) {
      try {
        str = JSON.stringify(data[d]);
      } catch (e) {
        str = data[d].toString(); // JSON.stringify breaks on circular reference to a HTML node
      }

      if (str === void 0) {
        continue;
      }
      if (str.length > 20) {
        str = data[d].toString();
      }
      if (d < data.length - 1) {
        str += ',';
      }

      vals.push(str);
    }

    if (window.console) {
      console.log(i, "@" + numbro(diff / 1000).format('0.000'), "[" + event + "]", data);
    }

    const div = document.createElement("div");
    const text = document.createTextNode(vals.join(" "));

    div.appendChild(text);
    example1Events.appendChild(div);
    clearTimeout(timer);
    const timer = setTimeout(function() {
      example1Events.scrollTop = example1Events.scrollHeight;
    }, 10);

    i++;
  }
}

const clearLogButton = document.querySelector('.clear-log button');
clearLogButton.addEventListener('click', () => {
  example1Events.innerHTML = '';
});

const selectAll = document.querySelector('#check_select_all');
const hookCheckboxes = document.querySelectorAll('#hooksList input[type=checkbox]');

selectAll.addEventListener('click', (event) => {
  const state = event.target.checked;

  hookCheckboxes.forEach((checkbox) => {
    checkbox.checked = state;
  });
});

hooksList.addEventListener('click', event => {
  if (!event.target.checked) {
    selectAll.checked = false;
  }
});

const hot = new Handsontable(example1, hotConfig);

```
:::

## Definition for `source` argument

It's worth to mention that some of the hooks are triggered from the inside of the Handsontable (Core), and some from the plugins. In some situations it is helpful to know what triggered the callback, if it was done by Handsontable itself, triggered from external code or a user action. That's why in crucial hooks Handsontable delivers `source` as an argument which informs you about who've triggered the action. Thanks to `source` you can create additional conditions based on that information.

`source` argument is optional. It takes following values:

* `auto` - Action triggered by Handsontable and reason for it is related directly with settings applied to Handsontable. For instance `afterCreateRow` will be fired with this when `minSpareRows` will be greater then 0;
* `edit` - Action triggered by Handsontable after the data has been changed (for example after an edit or using `setData*` methods);
* `loadData` - Action triggered by Handsontable after the `loadData` or `updateSettings({data: myData})`(with `data` property) method has been called;
* `populateFromArray` - Action triggered by Handsontable after requesting for populating data;
* `spliceCol` - Action triggered by Handsontable after the column data splicing has been done;
* `spliceRow` - Action triggered by Handsontable after the row data splicing has been done;
* `timeValidate` - Action triggered by Handsontable after the time validator has been called (for example after an edit);
* `dateValidate` - Action triggered by Handsontable after the date validator has been called (for example after an edit);
* `validateCells` - Action triggered by Handsontable after the validation process has been triggered;
* `Autofill.fill` - Action triggered by the AutoFill plugin;
* `ContextMenu.clearColumns` - Action triggered by the ContextMenu plugin after the "Clear column" has been clicked;
* `ContextMenu.columnLeft` - Action triggered by the ContextMenu plugin after the "Insert column on the left" has been clicked;
* `ContextMenu.columnRight` - Action triggered by the ContextMenu plugin after the "Insert column on the right" has been clicked;
* `ContextMenu.removeColumn` - Action triggered by the ContextMenu plugin after the "Remove column" has been clicked;
* `ContextMenu.removeRow` - Action triggered by the ContextMenu plugin after the "Remove Row" has been clicked;
* `ContextMenu.rowAbove` - Action triggered by the ContextMenu plugin after the "Insert row above" has been clicked;
* `ContextMenu.rowBelow` - Action triggered by the ContextMenu plugin after the "Insert row below" has been clicked;
* `CopyPaste.paste` - Action triggered by the CopyPaste plugin after the value has been pasted;
* `ObserveChanges.change` - Action triggered by the ObserveChanges plugin after the changes has been detected;
* `UndoRedo.redo` - Action triggered by the UndoRedo plugin after the change has been redone;
* `UndoRedo.undo` - Action triggered by the UndoRedo plugin after the change has been undone;
* `ColumnSummary.set` - Action triggered by the ColumnSummary plugin after the calculation has been done;
* `ColumnSummary.reset` - Action triggered by the ColumnSummary plugin after the calculation has been reset.

List of callback that operates on `source` parameter:

* [afterChange](api/pluginHooks.md#afterchange)
* [afterCreateCol](api/pluginHooks.md#aftercreatecol)
* [afterCreateRow](api/pluginHooks.md#aftercreaterow)
* [afterSetDataAtCell](api/pluginHooks.md#aftersetdataatcell)
* [afterSetDataAtRowProp](api/pluginHooks.md#aftersetdataatrowprop)
* [afterValidate](api/pluginHooks.md#aftervalidate)
* [beforeChange](api/pluginHooks.md#beforechange)
* [beforeChangeRender](api/pluginHooks.md#beforechangerender)
* [beforeCreateCol](api/pluginHooks.md#beforecreatecol)
* [beforeCreateRow](api/pluginHooks.md#beforecreaterow)
* [beforeValidate](api/pluginHooks.md#beforevalidate)

## The `beforeKeyDown` callback

The following demo uses `beforeKeyDown` callback to modify some key bindings:

* Pressing <kbd>DELETE</kbd> or <kbd>BACKSPACE</kbd> on a cell deletes the cell and shifts all cells beneath it in the column up resulting in the cursor (which doesn't move) having the value previously beneath it, now in the current cell.
* Pressing <kbd>ENTER</kbd> in a cell (not changing the value) results in pushing all the cells in the column beneath this cell down one row (including current cell) resulting in a blank cell under the cursor (which hasn't moved).

::: example #example2
```js
var data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'yellow', 'gray']
],
container = document.getElementById("example2"),
lastChange = null,
hot2;

hot2 = new Handsontable(container, {
  data: data,
  colHeaders: true,
  rowHeaders: true,
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation',
  beforeChange: function (changes, source) {
    lastChange = changes;
  }
});

hot2.updateSettings({
  beforeKeyDown: function (e) {
    var selection = hot2.getSelected();
    // BACKSPACE or DELETE
    if (e.keyCode === 8 || e.keyCode === 46) {
      e.stopImmediatePropagation();
      // remove data at cell, shift up
      hot2.spliceCol(selection[1], selection[0], 1);
      e.preventDefault();
    }
    // ENTER
    else if (e.keyCode === 13) {
      // if last change affected a single cell and did not change it's values
      if (lastChange && lastChange.length === 1 && lastChange[0][2] == lastChange[0][3]) {
        e.stopImmediatePropagation();
        hot2.spliceCol(selection[1], selection[0], 0, '');
        // add new cell
        hot2.selectCell(selection[0], selection[1]);
        // select new cell
      }
    }

    lastChange = null;
  }
});
```
:::
