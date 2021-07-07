---
title: Redux example
metaTitle: Redux example - Guide - Handsontable Documentation
permalink: /next/react-redux-example
canonicalUrl: /react-redux-example
---

# Redux example

## Overview

The following example implements the `@handsontable/react` component with a `readOnly` toggle switch and the Redux state manager.

## Example

::: example #example1 :react-redux
```jsx
import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

const App = () => {
  const hotSettings = useSelector(state => state);
  const dispatch = useDispatch();
  const hotTableComponent = useRef(null);

  const hotData = hotSettings.data;
  const isHotData = Array.isArray(hotData);

  const onBeforeHotChange = changes => {
    dispatch({
      type: 'updateData',
      dataChanges: changes
    });

    return false;
  }

  const toggleReadOnly = event => {
    dispatch({
      type: 'updateReadOnly',
      readOnly: event.target.checked
    });
  }

  return (
    <div className="redux-example-container">
      <div id="example-container">

        <div id="example-preview">
          <div id="toggle-boxes">
            <br/>
            <input onClick={toggleReadOnly} id="readOnlyCheck" type="checkbox"/>
            <label htmlFor="readOnlyCheck">
              Toggle <code>readOnly</code> for the entire table
            </label>
          </div>
          <br/>

          <HotTable
            ref={hotTableComponent}
            beforeChange={onBeforeHotChange}
            settings={hotSettings}
          />
        </div>

        <div id="redux-preview" className="table-container">
          <h3>Redux store dump</h3>

          {isHotData && (
            <div>
              <strong>data:</strong>
              <table style={{ border: '1px solid #d6d6d6' }}>
                <tbody>
                  {hotData.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, i) => <td key={i}>{cell}</td>)}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <table>
            <tbody>
              {Object.entries(hotSettings).map(([name, value]) => name !== 'data' && (
                <tr key={`${name}${value}`}>
                  <td><strong>{name}:</strong></td>
                  <td>{value.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

const initialReduxStoreState = {
  data: Handsontable.helper.createSpreadsheetData(5, 3),
  colHeaders: true,
  rowHeaders: true,
  readOnly: false,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
};

const updatesReducer = (state = initialReduxStoreState, action) => {
  switch (action.type) {
    case 'updateData':
      const newData = [...state.data];

      action.dataChanges.forEach(([row, column, oldValue, newValue]) => {
        newData[row][column] = newValue;
      })

      return {
        ...state,
        data: newData
      }

    case 'updateReadOnly':
      return {
        ...state,
        readOnly: action.readOnly
      };

    default:
      return state;
  }
};

const reduxStore = createStore(updatesReducer);

ReactDOM.render(
  <Provider store={reduxStore}>
    <App/>
  </Provider>,
  document.getElementById('example1')
);
```
:::
