---
title: Saving data
metaTitle: Saving data - Guide - Handsontable Documentation
permalink: /saving-data
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

::: only-for javascript
Use the [`afterChange`](@/api/hooks.md#afterchange) callback to track changes made in the data grid. In the example below, Ajax is used to handle the data. Note that this is just a mockup, and nothing is actually saved. You need to implement the server-side part by yourself.
:::

::: only-for react
Use the [`afterChange`](@/api/hooks.md#afterchange) prop to track changes made in the data grid. In the example below, Ajax is used to handle the data. Note that this is just a mockup, and nothing is actually saved. You need to implement the server-side part by yourself.
:::

::: only-for javascript
::: example #example1 --html 1 --js 2
```html
<div id="example1"></div>

<div class="controls">
  <button id="load" class="button button--primary button--blue">Load data</button>&nbsp;
  <button id="save" class="button button--primary button--blue">Save data</button>
  <label>
    <input type="checkbox" name="autosave" id="autosave"/>
    Autosave
  </label>
</div>

<output class="console" id="output">Click "Load" to load data from server</output>

```
```js
const container = document.querySelector('#example1');
const exampleConsole = document.querySelector('#output');
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

    ajax('/docs/{{$page.currentVersion}}/scripts/json/save.json', 'GET', JSON.stringify({ data: change }), data => {
      exampleConsole.innerText = 'Autosaved (' + change.length + ' ' + 'cell' + (change.length > 1 ? 's' : '') + ')';
      autosaveNotification = setTimeout(() => {
        exampleConsole.innerText ='Changes will be autosaved';
      }, 1000);
    });
  }
});

load.addEventListener('click', () => {
  ajax('/docs/{{$page.currentVersion}}/scripts/json/load.json', 'GET', '', res => {
    const data = JSON.parse(res.response);

    hot.loadData(data.data);
    // or, use `updateData()` to replace `data` without resetting states

    exampleConsole.innerText = 'Data loaded';
  });
});
save.addEventListener('click', () => {
  // save all cell's data
  ajax('/docs/{{$page.currentVersion}}/scripts/json/save.json', 'GET', JSON.stringify({ data: hot.getData() }), res => {
    const response = JSON.parse(res.response);

    if (response.result === 'ok') {
      exampleConsole.innerText = 'Data saved';
    } else {
      exampleConsole.innerText = 'Save error';
    }
  });
});

autosave.addEventListener('click', () => {
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
:::

::: only-for react
::: example #example1 :react
```jsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const App = () => {
  const hotRef = React.createRef();
  const [output, setOutput] = useState('');

  let autosaveNotification;
  let loadClickCallback;
  let saveClickCallback;
  const autosaveClickCallback = () => {
    if (autosave.checked) {
      setOutput('Changes will be autosaved');
    } else {
      setOutput('Changes will not be autosaved');
    }
  };

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

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    loadClickCallback = () => {
      ajax('/docs/{{$page.currentVersion}}/scripts/json/load.json', 'GET', '', res => {
        const data = JSON.parse(res.response);

        hot.loadData(data.data);
        // or, use `updateData()` to replace `data` without resetting states

        setOutput('Data loaded');
      });
    };
    saveClickCallback = () => {
      // save all cell's data
      ajax('/docs/{{$page.currentVersion}}/scripts/json/save.json', 'GET', JSON.stringify({ data: hot.getData() }), res => {
        const response = JSON.parse(res.response);

        if (response.result === 'ok') {
          setOutput('Data saved');
        } else {
          setOutput('Save error');
        }
      });
    };
  });

  return (
    <>
      <HotTable
        ref={hotRef}
        startRows={8}
        startCols={6}
        rowHeaders={true}
        colHeaders={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        afterChange={function(change, source) {
          if (source === 'loadData') {
            return; //don't save this change
          }

          if (!autosave.checked) {
            return;
          }

          ajax('/docs/{{$page.currentVersion}}/scripts/json/save.json', 'GET', JSON.stringify({ data: change }),
            data => {
              setOutput('Autosaved (' + change.length + ' ' + 'cell' + (change.length > 1 ? 's' : '') + ')');
            });
        }}
      />
  
      <div className="controls">
        <button id="load" className="button button--primary button--blue" onClick={(...args) => loadClickCallback(...args)}>Load data</button>&nbsp;
        <button id="save" className="button button--primary button--blue" onClick={(...args) => saveClickCallback(...args)}>Save data</button>
        <label>
          <input type="checkbox" name="autosave" id="autosave" onClick={(...args) => autosaveClickCallback(...args)}/>
          Autosave
        </label>
      </div>

      <output className="console" id="output">{output}</output>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('example1'));
```
:::
:::

## Saving data locally

You can save any type of data in local storage to preserve the table state after page reloads. The [`persistentState`](@/api/options.md#persistentstate) option must be set to `true` to enable the data storage mechanism. You can set it either during the Handsontable initialization or using the [`updateSettings()`](@/api/core.md#updatesettings) method.

When the [`persistentState`](@/api/options.md#persistentstate) option is enabled, the [`PersistentState`](@/api/persistentState.md) plugin exposes hooks listed below:

* [`persistentStateSave`](@/api/hooks.md#persistentstatesave)
* [`persistentStateLoad`](@/api/hooks.md#persistentstateload)
* [`persistentStateReset`](@/api/hooks.md#persistentstatereset)

## [`PersistentState`](@/api/persistentState.md) vs `localStorage`

The main benefit of using the [`PersistentState`](@/api/persistentState.md) plugin hooks rather than the regular `localStorage` API is that it ensures separation of data stored by multiple Handsontable instances. For example, if you have two or more instances of Handsontable on one page, data saved by one instance will be inaccessible to the second instance. Those two instances can store data under the same key, and no data would be overwritten.

For the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.

## Related API reference

- Configuration options:
  - [`persistentState`](@/api/options.md#persistentstate)
- Core methods:
  - [`updateSettings()`](@/api/core.md#updatesettings)
- Hooks:
  - [`afterCellMetaReset`](@/api/hooks.md#aftercellmetareset)
  - [`afterChange`](@/api/hooks.md#afterchange)
  - [`persistentStateLoad`](@/api/hooks.md#persistentstateload)
  - [`persistentStateReset`](@/api/hooks.md#persistentstatereset)
  - [`persistentStateSave`](@/api/hooks.md#persistentstatesave)
- Plugins:
  - [`PersistentState`](@/api/persistentState.md)
