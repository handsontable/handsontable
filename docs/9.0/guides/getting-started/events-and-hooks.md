---
title: Events and hooks
metaTitle: Events and hooks - Guide - Handsontable Documentation
permalink: /9.0/events-and-hooks
canonicalUrl: /events-and-hooks
tags:
- callback
- hook
- event
- middleware
- modify
- after
- before
- events
- hooks
---

# Events and hooks

[[toc]]

## Overview
Callbacks are used to react before or after actions occur. We refer to them as hooks. Hooks share some characteristics with events and middleware, combining them both in a unique structure.

## Events

If you only react to emitted hooks and forget about all their other features, you can treat hooks as pure events. You would want to limit your scope to `after` prefixed hooks, so they are emitted after something has happened and the results of the actions are already committed.

```js
hot.addHook('afterCreateRow', (row, amount) => {
  console.log(`${amount} row(s) were created, starting at index ${row}`);
})
```

## Middleware

Middleware is a concept known in the JavaScript world from Node.js frameworks such as Express or Koa. Middleware is a callback that can pipe to a process and allow the developer to modify it. We're no longer just reacting to an emitted event, but we can influence what's happening inside the component and modify the process.

```js
hot.addHook('modifyColWidth', (width, column) => {
  if (column > 10) {
    return 150;
  }
})
```

Note that the first argument is the current width that we're going to modify. Later arguments are immutable, and additional information can be used to decide whether the data should be modified.

## Hooks

We refer to all callbacks as "hooks" because although they share some characteristics with events and middleware, they combine them both in a unique structure. You may already be familiar with the concept as we're not the only ones that use the hooks convention.

Almost all `before` prefixed hooks allow the developer to return `false` and, therefore, block the execution of an action. It may be used for validation, rejecting operation by the outside service, or blocking our native algorithm and replace it with a custom implementation.

A great example for this is our integration with HyperFormula engine where creating a new row is only possible if the engine itself will allow it:

```js
hot.addHook('beforeCreateRow', (row, amount) => {
  if (!hyperFormula.isItPossibleToAddRows(0, [row, amount])) {
    return false;
  }
})
```

The first argument may be modified and passed on through the hooks that are next in the queue. This characteristic is shared between `before` and `after` hooks but is more common with the former. Before something happens, we can run the data through a pipeline of hooks that may modify or reject the operation. This provides many possibilities to extend the default Handsontable functionality and customize it for your application.

## All available hooks example

Note that some callbacks are checked on this page by default.

::: example #example1 --css 1 --html 2 --js 3
```css
#example1_events {
  height: 166px;
  padding: 5px;
  margin: 10px 0;
  overflow-y: scroll;
  font-size: 11px;
  border: 1px solid #CCC;
  box-sizing: border-box;
}
#example1 {
  margin-top: 0;
}
#hooksList {
  padding: 0;
}

#hooksList li {
  list-style: none;
  width: 33%;
  display: inline-block;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
```
```html
<div id="example1" class="hot"></div>
<div id="example1_events"></div>

<strong> Choose events to be logged:</strong>

<ul id="hooksList">
  <li><label><input type="checkbox" id="check_select_all">Select all</label></li>
</ul>
```
```js
const config = {
  data: [
    ['', 'Tesla', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'],
    ['2017', 0, 2941, 4303, 354, 5814],
    ['2018', 3, 2905, 2867, 412, 5284],
    ['2019', 4, 2517, 4822, 552, 6127],
    ['2020', 2, 2422, 5399, 776, 4151]
  ],
  minRows: 5,
  minCols: 6,
  height: 'auto',
  stretchH: 'all',
  minSpareRows: 1,
  autoWrapRow: true,
  colHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
};

const example1Events = document.getElementById("example1_events");
const hooksList = document.getElementById('hooksList');
const hooks = Handsontable.hooks.getRegistered();

hooks.forEach(function(hook) {
  let checked = '';

  if (hook === 'afterChange' || hook === 'afterSelection' || hook === 'afterCreateRow' || hook === 'afterRemoveRow' || hook === 'afterCreateCol' || hook === 'afterRemoveCol') {
    checked = 'checked';
  }

  hooksList.innerHTML += '<li><label><input type="checkbox" ' + checked + ' id="check_' + hook + '"> ' + hook + '</label></li>';
  config[hook] = function() {
    log_events(hook, arguments);
  }
});

const start = (new Date()).getTime();
let i = 0;
let timer;

function log_events(event, data) {
  if (document.getElementById('check_' + event).checked) {
    const now = (new Date()).getTime();
    const diff = now - start;
    let str;

    const vals = [ i, '@' + numbro(diff / 1000).format('0.000'), '[' + event + ']'];

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
      console.log(i, '@' + numbro(diff / 1000).format('0.000'), '[' + event + ']', data);
    }

    const div = document.createElement('div');
    const text = document.createTextNode(vals.join(' '));
    div.appendChild(text);
    example1Events.appendChild(div);
    clearTimeout(timer);
    timer = setTimeout(function() {
      example1Events.scrollTop = example1Events.scrollHeight;
    }, 10);

    i++;
  }
}

const example1 = document.getElementById('example1');
const hot = new Handsontable(example1, config);

document.querySelector('#check_select_all').addEventListener('click', function () {
  const state = this.checked;
  const inputs = document.querySelectorAll('#hooksList input[type=checkbox]');
  Array.prototype.forEach.call(inputs, function (input) {
    input.checked = state;
  });
});

document.querySelector('#hooksList input[type=checkbox]').addEventListener('click', function () {
  if (!this.checked) {
    document.getElementById('check_select_all').checked = false;
  }
});
```
:::

## Definition for `source` argument

It's worth mentioning that some hooks are triggered from the Handsontable core and some from the plugins. In some situations, it is helpful to know what triggered the callback. Did Handsontable trigger it, or was it triggered by external code or a user action? That's why in crucial hooks, Handsontable delivers `source` as an argument informing you who triggered the action and providing detailed information about the source. Using the information retrieved in the `source`, you can create additional conditions.

`source` argument is optional. It takes the following values:

| Value | Description  |
|--|--|
| `auto` | Action triggered by Handsontable, and the reason for it is related directly to the settings applied to Handsontable. For example, `afterCreateRow` will be fired with this when `minSpareRows` will be greater than 0. |
| `edit` | Action triggered by Handsontable after the data has been changed, e.g., after an edit or using `setData*` methods.|
| `loadData` | Action triggered by Handsontable after the `loadData` or `updateSettings({data: myData})` with the `data` property method has been called.|
| `populateFromArray` | Action triggered by Handsontable after requesting for populating data.|
| `spliceCol` |Action triggered by Handsontable after the column data splicing has been done.|
| `spliceRow` | Action triggered by Handsontable after the row data splicing has been done.|
| `timeValidate` | Action triggered by Handsontable after the time validator has been called, e.g., after an edit.|
| `dateValidate` | Action triggered by Handsontable after the date validator has been called, e.g., after an edit.|
| `validateCells` | Action triggered by Handsontable after the validation process has been triggered.|
| `Autofill.fill` | Action triggered by the AutoFill plugin.|
| `ContextMenu.clearColumns` | Action triggered by the ContextMenu plugin after the "Clear column" has been clicked.|
| `ContextMenu.columnLeft` | Action triggered by the ContextMenu plugin after the "Insert column on the left" has been clicked.|
| `ContextMenu.columnRight` | Action triggered by the ContextMenu plugin after the "Insert column on the right" has been clicked.|
| `ContextMenu.removeColumn` | Action triggered by the ContextMenu plugin after the "Remove column" has been clicked.|
| `ContextMenu.removeRow` | Action triggered by the ContextMenu plugin after the "Remove Row" has been clicked.|
| `ContextMenu.rowAbove` | Action triggered by the ContextMenu plugin after the "Insert row above" has been clicked.|
| `ContextMenu.rowBelow` | Action triggered by the ContextMenu plugin after the "Insert row below" has been clicked.|
| `CopyPaste.paste` | Action triggered by the CopyPaste plugin after the value has been pasted.|
| `ObserveChanges.change` | Action triggered by the ObserveChanges plugin after the changes have been detected.|
| `UndoRedo.redo` | Action triggered by the UndoRedo plugin after the change has been redone.|
| `UndoRedo.undo` | Action triggered by the UndoRedo plugin after the change has been undone.|
| `ColumnSummary.set` | Action triggered by the ColumnSummary plugin after the calculation has been done.|
| `ColumnSummary.reset` | Action triggered by the ColumnSummary plugin after the calculation has been reset.|

List of callbacks that operate on the `source` parameter:

* [afterChange](@/api/pluginHooks.md#afterchange)
* [afterCreateCol](@/api/pluginHooks.md#aftercreatecol)
* [afterCreateRow](@/api/pluginHooks.md#aftercreaterow)
* [afterLoadData](@/api/pluginHooks.md#afterloaddata)
* [afterSetDataAtCell](@/api/pluginHooks.md#aftersetdataatcell)
* [afterSetDataAtRowProp](@/api/pluginHooks.md#aftersetdataatrowprop)
* [afterSetSourceDataAtCell](@/api/pluginHooks.md#aftersetsourcedataatcell)
* [afterRemoveCol](@/api/pluginHooks.md#afterremovecol)
* [afterRemoveRow](@/api/pluginHooks.md#aftermoverow)
* [afterValidate](@/api/pluginHooks.md#aftervalidate)
* [beforeChange](@/api/pluginHooks.md#beforechange)
* [beforeChangeRender](@/api/pluginHooks.md#beforechangerender)
* [beforeCreateCol](@/api/pluginHooks.md#beforecreatecol)
* [beforeCreateRow](@/api/pluginHooks.md#beforecreaterow)
* [beforeLoadData](@/api/pluginHooks.md#beforeloaddata)
* [beforeRemoveCol](@/api/pluginHooks.md#beforeremovecol)
* [beforeRemoveRow](@/api/pluginHooks.md#beforeremoverow)
* [beforeValidate](@/api/pluginHooks.md#beforevalidate)

## The `beforeKeyDown` callback

The following demo uses `beforeKeyDown` callback to modify some key bindings:

* Pressing <kbd>DELETE</kbd> or <kbd>BACKSPACE</kbd> on a cell deletes the cell and shifts all cells beneath it in the column up resulting in the cursor, which doesn't move, having the value previously beneath it, now in the current cell.
* Pressing <kbd>ENTER</kbd> in a cell where the value remains unchanged pushes all the cells in the column beneath and including the current cell down one row. This results in a blank cell under the cursor which hasn't moved.

::: example #example2
```js
let lastChange = null;
const container = document.getElementById('example2')

const hot = new Handsontable(container, {
  data: [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray']
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  minSpareRows: 1,
  beforeChange(changes, source) {
    lastChange = changes;
  },
  licenseKey: 'non-commercial-and-evaluation'
});

hot.updateSettings({
  beforeKeyDown(e) {
    const selection = hot.getSelected()[0];
    console.log(selection)
    // BACKSPACE or DELETE
    if (e.keyCode === 8 || e.keyCode === 46) {
      e.stopImmediatePropagation();
      // remove data at cell, shift up
      hot.spliceCol(selection[1], selection[0], 1);
      e.preventDefault();
    }
    // ENTER
    else if (e.keyCode === 13) {
      // if last change affected a single cell and did not change it's values
      if (lastChange && lastChange.length === 1 && lastChange[0][2] == lastChange[0][3]) {
        e.stopImmediatePropagation();
        hot.spliceCol(selection[1], selection[0], 0, '');
        // add new cell
        hot.selectCell(selection[0], selection[1]);
        // select new cell
      }
    }

    lastChange = null;
  }
});
```
:::
