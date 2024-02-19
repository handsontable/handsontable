---
id: kbk0pm8t
title: Integration with Redux
metaTitle: Integration with Redux - JavaScript Data Grid | Handsontable
description: Maintain the data and configuration options of your grid by using the Redux state container.
permalink: /redux
canonicalUrl: /redux
react:
  metaTitle: Integration with Redux - React Data Grid | Handsontable
  tags:
    - state manager
    - react redux
    - connect component
    - immutable data
    - redux
    - state management
searchCategory: Guides
---

# Integration with Redux

Maintain the data and configuration options of your grid by using the Redux state container.

[[toc]]

## Integrate with Redux

::: tip

Before using any state management library, make sure you know how Handsontable handles data: see the [Binding to data](@/guides/getting-started/binding-to-data.md#understand-binding-as-a-reference) page.

:::

The following example implements the `@handsontable/react` component with a [`readOnly`](@/api/options.md#readonly) toggle switch and the Redux state manager.

## Simple example

::: example #example1 :react-redux

```jsx
import { useRef } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotSettings = useSelector(state => state);
  const dispatch = useDispatch();
  const hotTableComponentRef = useRef(null);

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
    <div className="dump-example-container">
      <div id="example-container">

        <div id="example-preview">
          <div className="controls">
            <label>
              <input onClick={toggleReadOnly} type="checkbox"/>
              Toggle <code>readOnly</code> for the entire table
            </label>
          </div>

          <HotTable
            ref={hotTableComponentRef}
            beforeChange={onBeforeHotChange}
            autoWrapRow={true}
            autoWrapCol={true}
            {...hotSettings}
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
  data: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
    ['A4', 'B4', 'C4'],
    ['A5', 'B5', 'C5'],
  ],
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
    <ExampleComponent />
  </Provider>,
  document.getElementById('example1')
);
```

:::

## Advanced example

This example shows:
- A [custom editor](@/guides/cell-functions/cell-editor.md#component-based-editors) component (built with an external dependency, `HexColorPicker`). This component acts both as an editor and as a renderer.
- A [custom renderer](@/guides/cell-functions/cell-renderer.md#declare-a-custom-renderer-as-a-component) component, built with an external dependency (`StarRatingComponent`).

The editor component changes the behavior of the renderer component, by passing information through Redux (and the `connect()` method of `react-redux`).

::: example #example6 :react-advanced --tab preview

```jsx
import React, { useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import StarRatingComponent from 'react-star-rating-component';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { HotTable, HotColumn, useHotEditor } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// a custom editor component
const UnconnectedColorPicker = (props) => {
  const editorRef = React.useRef(null);

  const editorContainerStyle = {
    display: 'none',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 999,
    background: '#fff',
    padding: '15px',
    border: '1px solid #cecece'
  };

  const valueRef = React.useRef('');

  const stopMousedownPropagation = React.useCallback((e) => {
    e.stopPropagation();
  }, []);

  const hotCustomEditorInstanceRef = useHotEditor((runSuper) => {
    setValue(value) {
      valueRef.current = value;
    },

    getValue() {
      return valueRef.current;
    },

    open() {
      editorRef.current.style.display = 'block';
    },

    close() {
      editorRef.current.style.display = 'none';
    },

    prepare(row, col, prop, td, originalValue, cellProperties) {
      runSuper().prepare(row, col, prop, td, originalValue, cellProperties);

      const tdPosition = td.getBoundingClientRect();

      editorRef.current.style.left = tdPosition.left + window.pageXOffset + 'px';
      editorRef.current.style.top = tdPosition.top + window.pageYOffset + 'px';
    }
  }, [valueRef]);

  const onPickedColor = React.useCallback((color) => {
    valueRef.current = color;
  }, [valueRef]);

  const applyColor = React.useCallback(() => {
    const dispatch = props.dispatch;

    if (hotCustomEditorInstanceRef.current.col === 1) {
      dispatch({
        type: 'updateActiveStarColor',
        row: hotCustomEditorInstanceRef.current.row,
        hexColor: hotCustomEditorInstanceRef.current.getValue()
      });
    } else if (hotCustomEditorInstanceRef.current.col === 2) {
      dispatch({
        type: 'updateInactiveStarColor',
        row: hotCustomEditorInstanceRef.current.row,
        hexColor: hotCustomEditorInstanceRef.current.getValue()
      });
    }
    hotCustomEditorInstanceRef.current.finishEditing();
  }, [props.dispatch, hotCustomEditorInstanceRef]);

  let renderResult = null;

  if (props.isEditor) {
    renderResult = (
      <div style={editorContainerStyle} ref={editorRef} onMouseDown={stopMousedownPropagation}>
          <HexColorPicker
            color={valueRef.current}
            onChange={onPickedColor}
          />
          <button
            style={{ width: '100%', height: '33px', marginTop: '10px' }}
            onClick={applyColor}
          >
            Apply
          </button>
      </div>
    );
  } else if (props.isRenderer) {
    const colorboxStyle = {
      background: props.value,
      width: '21px',
      height: '21px',
      float: 'left',
      marginRight: '5px'
    };

    renderResult = (
      <>
        <div style={colorboxStyle} />
        <div>{valueRef.current}</div>
      </>
    );
  }

  return <>{renderResult}</>;
};

const ColorPicker = connect(function(state) {
  return {
    activeColors: state.appReducer.activeColors,
    inactiveColors: state.appReducer.inactiveColors
  };
})(UnconnectedColorPicker);

// a Redux component
const initialReduxStoreState = {
  activeColors: [],
  inactiveColors: []
};

const appReducer = (state = initialReduxStoreState, action) => {
  switch (action.type) {
    case 'initRatingColors': {
      const { hotData } = action;

      const activeColors = hotData.map((data) => data[1]);
      const inactiveColors = hotData.map((data) => data[2]);

      return {
        ...state,
        activeColors,
        inactiveColors
      };
    }

    case 'updateActiveStarColor': {
      const rowIndex = action.row;
      const newColor = action.hexColor;

      const activeColorArray = [...state.activeColors];

      activeColorArray[rowIndex] = newColor;

      return {
        ...state,
        activeColors: activeColorArray
      };
    }

    case 'updateInactiveStarColor': {
      const rowIndex = action.row;
      const newColor = action.hexColor;

      const inactiveColorArray = [...state.inactiveColors];

      inactiveColorArray[rowIndex] = newColor;

      return {
        ...state,
        inactiveColors: inactiveColorArray
      };
    }

    default:
      return state;
  }
};
const actionReducers = combineReducers({ appReducer });
const reduxStore = createStore(actionReducers);

// a custom renderer component
const UnconnectedStarRatingRenderer = ({
  row,
  col,
  value,
  activeColors,
  inactiveColors
}) => {
  return (
    <StarRatingComponent
      name={`${row}-${col}`}
      value={value}
      starCount={5}
      starColor={activeColors[row]}
      emptyStarColor={inactiveColors[row]}
      editing={true}
    />
  );
};

const StarRatingRenderer = connect((state) => ({
  activeColors: state.appReducer.activeColors,
  inactiveColors: state.appReducer.inactiveColors
}))(UnconnectedStarRatingRenderer);

const data = [
    [1, '#ff6900', '#fcb900'],
    [2, '#fcb900', '#7bdcb5'],
    [3, '#7bdcb5', '#8ed1fc'],
    [4, '#00d084', '#0693e3'],
    [5, '#eb144c', '#abb8c3']
];

export const ExampleComponent = () => {
  useEffect(() => {
    reduxStore.dispatch({
      type: 'initRatingColors',
      hotData: data
    });
  }, []);

  return (
    <Provider store={reduxStore}>
      <HotTable
        data={data}
        rowHeaders={true}
        rowHeights={30}
        colHeaders={['Rating', 'Active star color', 'Inactive star color']}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      >
        {/* add the `renderer` prop to set the component as a Handsontable renderer */}
        <HotColumn width={100} type={'numeric'} renderer={StarRatingRenderer} />
        {/* add the `renderer` and `editor` props to set the component as a Handsontable renderer and editor */}
        <HotColumn width={150} 
                   renderer={(props) => <ColorPicker {...props} isRenderer />} 
                   editor={(props) => <ColorPicker {...props} isEditor />} />
        <HotColumn width={150} 
                   renderer={(props) => <ColorPicker {...props} isRenderer />} 
                   editor={(props) => <ColorPicker {...props} isEditor />} />
      </HotTable>
    </Provider>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example6'));
```

:::
