---
title: Saving data
metaTitle: Saving data - Guide - Handsontable Documentation
permalink: /next/saving-data
canonicalUrl: /saving-data
tags:
  - load and save
  - server
---

# Saving data

[[toc]]

## Overview
Persistent state storage is particularly useful when running multiple instances of Handsontable on one page as it allows data separation per each instance.

## Saving changes using a callback

Use the **afterChange** callback to track changes made in the data grid. In the example below, Ajax is used to load and save the data. Note that this is just a mockup, and nothing is actually saved. You need to implement the server-side part by yourself.


::: example #example1 --html 1 --js 2
```html
<div id="example1" class="hot"></div>

<div class="controls">
  <button id="load" class="button button--primary button--blue">Load data</button>&nbsp;
  <button id="save" class="button button--primary button--blue">Save data</button>
  <label>
    <input type="checkbox" name="autosave" id="autosave"/>
    Autosave
  </label>
</div>

<pre id="example1console" class="console">Click "Load" to load data from server</pre>

```
```js
const container = document.querySelector('#example1');
const exampleConsole = document.querySelector('#example1console');
const autosave = document.querySelector('#autosave');
const load = document.querySelector('#load');
const save = document.querySelector('#save');

let autosaveNotification;

const hot = new Handsontable(container, {
  startRows: 8,
  startCols: 6,
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  afterChange: function (change, source) {
    if (source === 'loadData') {
      return; //don't save this change
    }

    if (!autosave.checked) {
      return;
    }

    clearTimeout(autosaveNotification);

    ajax('/docs/next/scripts/json/save.json', 'GET', JSON.stringify({ data: change }), data => {
      exampleConsole.innerText = 'Autosaved (' + change.length + ' ' + 'cell' + (change.length > 1 ? 's' : '') + ')';
      autosaveNotification = setTimeout(() => {
        exampleConsole.innerText ='Changes will be autosaved';
      }, 1000);
    });
  }
});

Handsontable.dom.addEvent(load, 'click', () => {
  ajax('/docs/next/scripts/json/load.json', 'GET', '', res => {
    const data = JSON.parse(res.response);

    hot.loadData(data.data);

    exampleConsole.innerText = 'Data loaded';
  });
});
Handsontable.dom.addEvent(save, 'click', () => {
  // save all cell's data
  ajax('/docs/next/scripts/json/save.json', 'GET', JSON.stringify({ data: hot.getData() }), res => {
    const response = JSON.parse(res.response);

    if (response.result === 'ok') {
      exampleConsole.innerText = 'Data saved';
    } else {
      exampleConsole.innerText = 'Save error';
    }
  });
});

Handsontable.dom.addEvent(autosave, 'click', () => {
  if (autosave.checked) {
    exampleConsole.innerText = 'Changes will be autosaved';
  } else {
    exampleConsole.innerText ='Changes will not be autosaved';
  }
});

function ajax(url, method, params, callback) {
  let obj;

  try {
    obj = new XMLHttpRequest();
  } catch (e) {
    try {
      obj = new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
      try {
        obj = new ActiveXObject('Microsoft.XMLHTTP');
      } catch (e) {
        alert('Your browser does not support Ajax.');
        return false;
      }
    }
  }
  obj.onreadystatechange = () => {
    if (obj.readyState == 4) {
      callback(obj);
    }
  };
  obj.open(method, url, true);
  obj.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  obj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  obj.send(params);

  return obj;
}
```
:::

## Saving data locally

You can save any type of data in local storage to preserve the table state after page reloads. The `persistentState` option must be set to `true` to enable the data storage mechanism. You can set it either during the Handsontable initialization or using the `updateSettings` method.

When `persistentState` is enabled it exposes hooks listed below:

* [persistentStateSave](@/api/hooks.md#persistentstatesave)
* [persistentStateLoad](@/api/hooks.md#persistentstateload)
* [persistentStateReset](@/api/hooks.md#persistentstatereset)

## `persistentState` vs `LocalStorage API`

The main benefit of using `persistentState` hooks rather than a regular `LocalStorage API` is that it ensures separation of data stored by multiple Handsontable instances. For example, if you have two or more instances of Handsontable on one page, data saved by one instance will be inaccessible to the second instance. Those two instances can store data under the same key, and no data would be overwritten.

For the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
