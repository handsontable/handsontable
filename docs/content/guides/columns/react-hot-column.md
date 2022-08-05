---
title: 'HotColumn component'
metaTitle: 'HotColumn component - Guide - Handsontable Documentation'
permalink: /hot-column
canonicalUrl: /hot-column
---

# `HotColumn` component

[[toc]]

## Overview

You can configure the column-related settings using the `HotColumn` component's attributes. You can also create custom renderers and editors using React components.

## Declaring column settings

To declare column-specific settings, pass the settings as `HotColumn` properties, either separately or wrapped as a `settings` property, exactly as you would with `HotTable`.

::: example #example1 :react --tab preview
```jsx
import ReactDOM from 'react-dom';
import Handsontable from 'handsontable';
import { HotTable, HotColumn } from '@handsontable/react';
import 'handsontable/dist/handsontable.min.css';

const hotData = Handsontable.helper.createSpreadsheetData(10, 5);
const secondColumnSettings = {
  title: 'Second column header',
  readOnly: true
};

const ExampleComponent = () => {
  return (
    <HotTable data={hotData} licenseKey="non-commercial-and-evaluation">
      <HotColumn title="First column header" />
      <HotColumn settings={secondColumnSettings} />
    </HotTable>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
 
## Object data source

When you use object data binding for `<HotColumn/>`, you need to provide precise information about the data structure for columns. To do so, refer to your object-based data property in `HotColumn`'s `data` prop, for example, `<HotColumn data='id' />`:

::: example #example3 :react --tab preview
```jsx
import ReactDOM from 'react-dom';
import Handsontable from 'handsontable';
import { HotTable, HotColumn } from '@handsontable/react';
import 'handsontable/dist/handsontable.min.css';

// a renderer component
const ScoreRenderer = (props) => {
  const { value } = props;
  const color = value > 60 ? '#2ECC40' : '#FF4136';
  return (
    <>
      <span style={{ color }}>{value}</span>
    </>
  );
};

// a renderer component
const PromotionRenderer = (props) => {
  const { value } = props;
  if (value) {
    return (
      <>
        <span>&#10004;</span>
      </>
    );
  }
  return (
    <>
      <span>&#10007;</span>
    </>
  );
};

// you can set `data` to an array of objects
const data = [
    {
      id: 1,
      name: 'Alex',
      score: 10,
      isPromoted: false
    },
    {
      id: 2,
      name: 'Adam',
      score: 55,
      isPromoted: false
    },
    {
      id: 3,
      name: 'Kate',
      score: 61,
      isPromoted: true
    },
    {
      id: 4,
      name: 'Max',
      score: 98,
      isPromoted: true
    },
    {
      id: 5,
      name: 'Lucy',
      score: 59,
      isPromoted: false
    }
  ];

const ExampleComponent = () => {
  return (
    <HotTable 
        data={data}
        licenseKey="non-commercial-and-evaluation"
        autoRowSize={false}
        autoColumnSize={false}
    >
      {/* use the `data` prop to reference the column data */}
      <HotColumn data="id" />
      <HotColumn data="name" />
      <HotColumn data="score">
        {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
        <ScoreRenderer hot-renderer />
      </HotColumn>
      <HotColumn data="isPromoted">
        {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
        <PromotionRenderer hot-renderer />
      </HotColumn>
    </HotTable>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
```
:::

## An advanced example

In this example, the custom editor component is created with an external dependency. This acts as both renderer and editor. The renderer uses information from that component in the first column to change the way it behaves. Information is passed using Redux and `react-redux`'s `connect` method.

::: example #example6 :react-advanced --tab preview
```jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import StarRatingComponent from 'react-star-rating-component';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { HotTable, HotColumn, BaseEditorComponent } from '@handsontable/react';
import 'handsontable/dist/handsontable.min.css';

// a component
class UnconnectedColorPicker extends BaseEditorComponent {
  constructor(props) {
    super(props);

    this.editorRef = React.createRef();

    this.editorContainerStyle = {
      display: 'none',
      position: 'absolute',
      left: 0,
      top: 0,
      zIndex: 999,
      background: '#fff',
      padding: '15px',
      border: '1px solid #cecece'
    };

    this.state = {
      renderResult: null,
      value: ''
    };
  }

  stopMousedownPropagation(e) {
    e.stopPropagation();
  }

  setValue(value, callback) {
    this.setState((state, props) => {
      return { value: value };
    }, callback);
  }

  getValue() {
    return this.state.value;
  }

  open() {
    this.editorRef.current.style.display = 'block';
  }

  close() {
    this.editorRef.current.style.display = 'none';

    this.setState({
      pickedColor: null
    });
  }

  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    this.editorRef.current.style.left = tdPosition.left + window.pageXOffset + 'px';
    this.editorRef.current.style.top = tdPosition.top + window.pageYOffset + 'px';
  }

  onPickedColor(color) {
    this.setValue(color);
  }

  applyColor() {
    const dispatch = this.props.dispatch;

    if (this.col === 1) {
      dispatch({
        type: 'updateActiveStarColor',
        row: this.row,
        hexColor: this.getValue()
      });
    } else if (this.col === 2) {
      dispatch({
        type: 'updateInactiveStarColor',
        row: this.row,
        hexColor: this.getValue()
      });
    }
    this.finishEditing();
  }

  render() {
    let renderResult = null;

    if (this.props.isEditor) {
      renderResult = (
        <div style={this.editorContainerStyle} ref={this.editorRef} onMouseDown={this.stopMousedownPropagation}>
            <HexColorPicker
              color={this.state.pickedColor || this.state.value}
              onChange={this.onPickedColor.bind(this)}
            />
            <button
              style={{ width: '100%', height: '33px', marginTop: '10px' }}
              onClick={this.applyColor.bind(this)}
            >
              Apply
            </button>
        </div>
      );
    } else if (this.props.isRenderer) {
      const colorboxStyle = {
        background: this.props.value,
        width: '21px',
        height: '21px',
        float: 'left',
        marginRight: '5px'
      };

      renderResult = (
        <>
          <div style={colorboxStyle} />
          <div>{this.props.value}</div>
        </>
      );
    }

    return <>{renderResult}</>;
  }
}

const ColorPicker = connect(function(state) {
  return {
    activeColors: state.appReducer.activeColors,
    inactiveColors: state.appReducer.inactiveColors
  };
})(UnconnectedColorPicker);

// a component
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

// a component
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

const ExampleComponent = () => {
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
        licenseKey="non-commercial-and-evaluation"
      >
        <HotColumn width={100} type={'numeric'}>
          {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
          <StarRatingRenderer hot-renderer />
        </HotColumn>
        <HotColumn width={150}>
          {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
          {/* add the `hot-editor` attribute to mark the component as a Handsontable editor */}
          <ColorPicker hot-renderer hot-editor />
        </HotColumn>
        <HotColumn width={150}>
          {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
          {/* add the `hot-editor` attribute to mark the component as a Handsontable editor */}
          <ColorPicker hot-renderer hot-editor />
        </HotColumn>
      </HotTable>
    </Provider>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example6'));
```
:::
