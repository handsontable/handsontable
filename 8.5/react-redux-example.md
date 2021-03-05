---
title: Redux example
permalink: /8.5/react-redux-example
canonicalUrl: /react-redux-example
---

# {{ $frontmatter.title }}

An implementation of the `@handsontable/react` component with a `readOnly` toggle switch and the Redux state manager implemented.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import {createStore, combineReducers} from 'redux';
import {HotTable} from '@handsontable/react';
import Handsontable from 'handsontable';

const initialReduxStoreState = {
  data: Handsontable.helper.createSpreadsheetData(5, 3),
  colHeaders: true,
  rowHeaders: true,
  readOnly: false
};

// Action reducers for callbacks triggered by Handsontable
const updates = (state = initialReduxStoreState, action) => {
  switch (action.type) {
    case 'updateData':
      const newData = state.data.slice(0);

      for (let [row, column, oldValue, newValue] of action.dataChanges) {
        newData[row][column] = newValue;
      }

      return Object.assign({}, state, {
        data: newData
      });
    case 'updateReadOnly':
      return Object.assign({}, state, {
        readOnly: action.readOnly
      });
    default:
      return state;
  }
};
const actionReducers = combineReducers({updates});
const reduxStore = createStore(actionReducers);

class MyComponent extends React.Component {
  constructor(props) {
    super(props);

    this.toggleReadOnly = this.toggleReadOnly.bind(this);
    this.hotTableComponent = React.createRef();

    reduxStore.subscribe(this.updateReduxPreview);
    reduxStore.subscribe(render);
  }

  get reduxHotSettings() {
    return reduxStore.getState().updates;
  }

  componentDidMount() {
    this.updateReduxPreview();
  }

  onBeforeHotChange(changes, source) {
    reduxStore.dispatch({
      type: 'updateData',
      dataChanges: changes
    });

    return false;
  }

  toggleReadOnly(event) {
    reduxStore.dispatch({
      type: 'updateReadOnly',
      readOnly: event.target.checked
    });
  }

  updateReduxPreview() {
    // This method serves only as a renderer for the Redux's state dump.
    const previewTable = document.querySelector('#redux-preview table');
    const currentState = reduxStore.getState().updates;
    let newInnerHtml = '<tbody>';

    for (const [key, value] of Object.entries(currentState)) {
      newInnerHtml += `<tr><td>`;

      if (key === 'data' && Array.isArray(value)) {
        newInnerHtml += `<strong>data:</strong> <br><table style="border: 1px solid #d6d6d6;"><tbody>`;

        for (let row of value) {
          newInnerHtml += `<tr>`;

          for (let cell of row) {
            newInnerHtml += `<td>${cell}</td>`;
          }

          newInnerHtml += `</tr>`;
        }
        newInnerHtml += `</tbody></table>`;

      } else {
        newInnerHtml += `<strong>${key}:</strong> ${value}`;
      }
      newInnerHtml += `</td></tr>`;
    }
    newInnerHtml += `</tbody>`;

    previewTable.innerHTML = newInnerHtml;
  }

  render() {
    return (
      <div className="redux-example-container">
        <div id="example-container">
          <div id="example-preview" className="hot">
            <div id="toggle-boxes">
              <br/>
              <input onClick={this.toggleReadOnly} id="readOnlyCheck" type="checkbox"/><label
              htmlFor="readOnlyCheck"> Toggle <code>readOnly</code> for the entire table</label>
            </div>
            <br/>
            <HotTable ref={this.hotTableComponent} beforeChange={this.onBeforeHotChange} settings={this.reduxHotSettings}/>
          </div>
          <div id="redux-preview" className="table-container">
            <h4>Redux store dump:</h4>
            <table>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

const render = () => {
  ReactDOM.render(<MyComponent/>, document.getElementById('example1'));
};
render();
```
