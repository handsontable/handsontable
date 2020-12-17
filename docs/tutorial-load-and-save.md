---
id: tutorial-load-and-save
title: Load and save
sidebar_label: Load and save
slug: /tutorial-load-and-save
---

*   [Saving data using afterChange callback](#page-afterchange)
*   [Saving data locally using persistentState](#page-saving)
*   [Why should I use persistentState rather than regular LocalStorage API?](#page-using)

### Saving data using afterChange callback

Use the **afterChange** callback to track changes made in the table. In the example below, `AJAX` is used to load and save grid data. Note that this is just a mockup. Nothing is actually saved. You have to implement the server-side part by yourself.

Load Save Autosave

Click "Load" to load data from server

Log to console

var $$ = function(id) { return document.getElementById(id); }, container = $$('example1'), exampleConsole = $$('example1console'), autosave = $$('autosave'), load = $$('load'), save = $$('save'), autosaveNotification, hot; hot = new Handsontable(container, { startRows: 8, startCols: 6, rowHeaders: true, colHeaders: true, afterChange: function (change, source) { if (source === 'loadData') { return; //don't save this change } if (!autosave.checked) { return; } clearTimeout(autosaveNotification); ajax('scripts/json/save.json', 'GET', JSON.stringify({data: change}), function (data) { exampleConsole.innerText = 'Autosaved (' + change.length + ' ' + 'cell' + (change.length > 1 ? 's' : '') + ')'; autosaveNotification = setTimeout(function() { exampleConsole.innerText ='Changes will be autosaved'; }, 1000); }); } }); Handsontable.dom.addEvent(load, 'click', function() { ajax('scripts/json/load.json', 'GET', '', function(res) { var data = JSON.parse(res.response); hot.loadData(data.data); exampleConsole.innerText = 'Data loaded'; }); }); Handsontable.dom.addEvent(save, 'click', function() { // save all cell's data ajax('scripts/json/save.json', 'GET', JSON.stringify({data: hot.getData()}), function (res) { var response = JSON.parse(res.response); if (response.result === 'ok') { exampleConsole.innerText = 'Data saved'; } else { exampleConsole.innerText = 'Save error'; } }); }); Handsontable.dom.addEvent(autosave, 'click', function() { if (autosave.checked) { exampleConsole.innerText = 'Changes will be autosaved'; } else { exampleConsole.innerText ='Changes will not be autosaved'; } });

### Saving data locally

You can save any sort of data in local storage to preserve the table state after page reloads. In order to enable the data storage mechanism, the `persistentState` option must be set to `true` (you can set it either during the Handsontable initialization or using the updateSettings method).

When `persistentState` is enabled it exposes 3 hooks listed below:

*   [persistentStateSave](./Hooks.html#event:persistentStateSave)
*   [persistentStateLoad](./Hooks.html#event:persistentStateLoad)
*   [persistentStateReset](./Hooks.html#event:persistentStateReset)

### Why should I use persistentState rather than regular LocalStorage API?

The main reason behind using `persistentState` hooks rather than a regular LocalStorage API is that it ensures separation of data stored by multiple Handsontable instances. In other words, if you have two (or more) instances of Handsontable on one page, data saved by one instance will be inaccessible to the second instance. Those two instances can store data under the same key and no data would be overwritten.

**In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.**

