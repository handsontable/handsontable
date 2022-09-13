---
title: Saving data
metaTitle: Saving data - JavaScript Data Grid | Handsontable
description: Save data after each change to the data set, using Handsontable's API hooks. Preserve the table state by saving data to local storage.
permalink: /saving-data
canonicalUrl: /saving-data
tags:
  - load and save
  - server
  - ajax
react:
  metaTitle: Saving data - React Data Grid | Handsontable
---

# Saving data

[[toc]]

## Overview
Persistent state storage is particularly useful when running multiple instances of Handsontable on one page as it allows data separation per each instance.

## Saving changes using a callback

To track changes made in your data grid, use Handsontable's [`afterChange`](@/api/hooks.md#afterchange) hook.

The example below handles data by using `fetch`. Note that this is just a mockup, and nothing is actually saved. You need to implement the server-side part by yourself.

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

    fetch('{{$basePath}}/scripts/json/save.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: change })
    })
      .then(response => {
        exampleConsole.innerText = `Autosaved (${change.length} cell${change.length > 1 ? 's' : ''})`;
        console.log('The POST request is only used here for the demo purposes');
      });
  }
});

load.addEventListener('click', () => {
  fetch('{{$basePath}}/scripts/json/load.json')
    .then(response => {
      response.json().then(data => {
        hot.loadData(data.data);
        // or, use `updateData()` to replace `data` without resetting states
        exampleConsole.innerText = 'Data loaded';
      });
    });
});
save.addEventListener('click', () => {
  // save all cell's data
  fetch('{{$basePath}}/scripts/json/save.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: hot.getData() })
  })
    .then(response => {
      exampleConsole.innerText = 'Data saved';
      console.log('The POST request is only used here for the demo purposes');
    });
});

autosave.addEventListener('click', () => {
  if (autosave.checked) {
    exampleConsole.innerText = 'Changes will be autosaved';
  } else {
    exampleConsole.innerText ='Changes will not be autosaved';
  }
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import { useEffect, useState, useRef } from "react";
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import "handsontable/dist/handsontable.full.css";

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef();
  const [output, setOutput] = useState('Click "Load" to load data from server');

  let loadClickCallback;
  let saveClickCallback;
  
  const autosave = {checked: false};
  const autosaveClickCallback = (event) => {
    autosave.checked = event.target.checked;
    if (autosave.checked) {
      setOutput("Changes will be autosaved");
    } else {
      setOutput("Changes will not be autosaved");
    }
  };

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    loadClickCallback = () => {
      fetch('{{$basePath}}/scripts/json/load.json')
        .then(response => {
          response.json().then(data => {
            hot.loadData(data.data);
            // or, use `updateData()` to replace `data` without resetting states
            setOutput('Data loaded');
          });
        });
    };
    saveClickCallback = () => {
      // save all cell's data
      fetch('{{$basePath}}/scripts/json/save.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: hot.getData() })
      })
        .then(response => {
          setOutput('Data saved');
          console.log('The POST request is only used here for the demo purposes');
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

          fetch('{{$basePath}}/scripts/json/save.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: change })
          })
            .then(response => {
              setOutput(`Autosaved (${change.length} cell${change.length > 1 ? 's' : ''})`);
              console.log('The POST request is only used here for the demo purposes');
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

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
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
