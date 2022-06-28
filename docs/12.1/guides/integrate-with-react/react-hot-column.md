---
title: 'Using the `HotColumn` component in React'
metaTitle: 'Using the HotColumn component in React - Guide - Handsontable Documentation'
permalink: /12.1/react-hot-column
canonicalUrl: /react-hot-column
---

# Using the `HotColumn` component in React

[[toc]]

## Overview

You can configure the column-related settings using the `HotColumn` component's attributes. You can also create custom renderers and editors using React components.

## Declaring column settings

To declare column-specific settings, pass the settings as `HotColumn` properties, either separately or wrapped as a `settings` property, exactly as you would with `HotTable`.

::: example #example1 :react --tab preview
```jsx
import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

const hotData = Handsontable.helper.createSpreadsheetData(10, 5);
const secondColumnSettings = {
  title: "Second column header",
  readOnly: true
};

const App = () => {
  return (
    <HotTable data={hotData} licenseKey="non-commercial-and-evaluation">
      <HotColumn title="First column header" />
      <HotColumn settings={secondColumnSettings} />
    </HotTable>
  );
};

ReactDOM.render(<App />, document.getElementById('example1'));
```
:::

## Declaring a custom renderer as a component

The wrapper allows creating custom renderers using React components.
Although it's possible to use class-based react components for this purpose, **we strongly suggest** using functional components, as using the `state` of a class-based component would re-initialize on every Handsontable render.

To mark a component as a Handsontable renderer, simply add a `hot-renderer` attribute to it.

::: tip
Handsontable's `autoRowSize` and `autoColumnSize` options require calculating the widths/heights of some of the cells before rendering them into the table. For this reason, it's not currently possible to use them alongside component-based renderers, as they're created after the table's initialization.

Be sure to turn those options off in your Handsontable config, as keeping them enabled may cause unexpected results. Please note that `autoColumnSize` is enabled by default.
:::

::: example #example2 :react --tab preview
```jsx
import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

// your renderer component
const RendererComponent = (props) => {
  // the available renderer-related props are:
  // - `row` (row index)
  // - `col` (column index)
  // - `prop` (column property name)
  // - `TD` (the HTML cell element)
  // - `cellProperties` (the `cellProperties` object for the edited cell)
  return (
    <React.Fragment>
      <i style={{ color: "#a9a9a9" }}>
        Row: {props.row}, column: {props.col},
      </i>{" "}
      value: {props.value}
    </React.Fragment>
  );
}

const hotData = Handsontable.helper.createSpreadsheetData(10, 5);

const App = () => {
  return (
    <div>
    <HotTable data={hotData} licenseKey="non-commercial-and-evaluation">
      <HotColumn width={250}>
        {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
        <RendererComponent hot-renderer />
      </HotColumn>
    </HotTable>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('example2'));
```
:::
 
## Object data source

When you use object data binding for `HotColumn`, you need to provide precise information about the data structure for columns. To do so, refer to the data for a column in properties as `data`, for example, `<HotColumn data="id" />`:

::: example #example3 :react --tab preview
```jsx
import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

// a renderer component
const ScoreRenderer = (props) => {
  const { value } = props;
  const color = value > 60 ? "#2ECC40" : "#FF4136";
  return (
    <React.Fragment>
      <span style={{ color }}>{value}</span>
    </React.Fragment>
  );
};

// a renderer component
const PromotionRenderer = (props) => {
  const { value } = props;
  if (value) {
    return (
      <React.Fragment>
        <span>&#10004;</span>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <span>&#10007;</span>
    </React.Fragment>
  );
};

const hotSettings = {
  // you can set `data` to an array of objects
  data: [
    {
      id: 1,
      name: "Alex",
      score: 10,
      isPromoted: false
    },
    {
      id: 2,
      name: "Adam",
      score: 55,
      isPromoted: false
    },
    {
      id: 3,
      name: "Kate",
      score: 61,
      isPromoted: true
    },
    {
      id: 4,
      name: "Max",
      score: 98,
      isPromoted: true
    },
    {
      id: 5,
      name: "Lucy",
      score: 59,
      isPromoted: false
    }
  ],
  licenseKey: "non-commercial-and-evaluation",
  autoRowSize: false,
  autoColumnSize: false
};

const App = () => {
  return (
    <HotTable settings={hotSettings}>
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

ReactDOM.render(<App />, document.getElementById('example3'));
```
:::

## Declaring a custom editor as a component

You can also utilize the React components to create custom editors. To do so, you'll need to create a component compatible with Handsontable's editor class structure. The easiest way to do so is to extend `BaseEditorComponent` - a base editor component exported from `@handsontable/react`.

This will give you a solid base to build on. Note that the editor component needs to tick all of the boxes that a regular editor does, such as defining the `getValue`, `setValue`, `open`, `close`, and `focus` methods, which are abstract in the `BaseEditor`. For more info, check the documentation on [creating custom editors from scratch](@/guides/cell-functions/cell-editor.md#selecteditor-creating-editor-from-scratch).

It's also worth noting that editors in Handsontable will close after clicking on them if the `outsideClickDeselects` option is enabled - *default setting*.

To prevent that, the `mousedown` event on the editor container must call `event.stopPropagation()`. 

If you are using React 17 and newer, `event.stopPropagation()` should work for you as expected. See the [React 17 release notes](https://reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation) for details about event delegation.

Note that in case of React 16 and older, it wouldn't work out of the box because of the way how React used to handle events. [This article by Eric Clemmons](https://medium.com/@ericclemmons/react-event-preventdefault-78c28c950e46) sums it up pretty well and presents a solution ([react-native-listener](https://www.npmjs.com/package/react-native-listener)).

::: example #example4 :react --tab preview
```jsx
import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { HotTable, HotColumn, BaseEditorComponent } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

// an editor component
class EditorComponent extends BaseEditorComponent {
  constructor(props) {
    super(props);

    this.mainElementRef = React.createRef();
    this.containerStyle = {
      display: "none",
      position: "absolute",
      left: 0,
      top: 0,
      background: "#fff",
      border: "1px solid #000",
      padding: "15px",
      zIndex: 999
    };
    this.state = {
      value: ""
    };
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
    this.mainElementRef.current.style.display = "block";
  }

  close() {
    this.mainElementRef.current.style.display = "none";
  }

  prepare(row, col, prop, td, originalValue, cellProperties) {
    // We'll need to call the `prepare` method from
    // the `BaseEditorComponent` class, as it provides
    // the component with the information needed to use the editor
    // (hotInstance, row, col, prop, TD, originalValue, cellProperties)
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    // As the `prepare` method is triggered after selecting
    // any cell, we're updating the styles for the editor element,
    // so it shows up in the correct position.
    this.mainElementRef.current.style.left = tdPosition.left + window.pageXOffset + "px";
    this.mainElementRef.current.style.top = tdPosition.top + window.pageYOffset + "px";
  }

  setLowerCase() {
    this.setState(
      (state, props) => {
        return { value: this.state.value.toString().toLowerCase() };
      },
      () => {
        this.finishEditing();
      }
    );
  }

  setUpperCase() {
    this.setState(
      (state, props) => {
        return { value: this.state.value.toString().toUpperCase() };
      },
      () => {
        this.finishEditing();
      }
    );
  }

  stopMousedownPropagation(e) {
    e.stopPropagation();
  }

  render() {
    return (
        <div
          style={this.containerStyle}
          ref={this.mainElementRef}
          onMouseDown={this.stopMousedownPropagation}
          id="editorElement"
        >
          <button onClick={this.setLowerCase.bind(this)}>
            {this.state.value.toLowerCase()}
          </button>
          <button onClick={this.setUpperCase.bind(this)}>
            {this.state.value.toUpperCase()}
          </button>
        </div>
    );
  }
}

const hotSettings = {
  data: [
    ["Obrien Fischer"],
    ["Alexandria Gordon"],
    ["John Stafford"],
    ["Regina Waters"],
    ["Kay Bentley"],
    ["Emerson Drake"],
    ["Dean Stapleton"]
  ],
  rowHeaders: true,
  licenseKey: "non-commercial-and-evaluation"
};

const App = () => {
  return (
    <HotTable settings={hotSettings}>
      <HotColumn width={250}>
        {/* add the `hot-editor` attribute to mark the component as a Handsontable editor */}
        <EditorComponent hot-editor />
      </HotColumn>
    </HotTable>
  );
};

ReactDOM.render(<App />, document.getElementById('example4'));
```
:::

## Using the renderer/editor components within React's Context

In this example, React's Context is used to pass the information available in the main app component to the renderer. In this case, we're using just the renderer, but the same principle works with editors just as well.

::: example #example5 :react --css 1 --js 2 --tab preview
```css
.handsontable td.dark {
  background: #000;
  color: #fff;
}
```
```jsx
import React, { useState, useContext } from "react";
import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

// a component
const HighlightContext = React.createContext();

// a renderer component
function CustomRenderer(props) {
  const darkMode = useContext(HighlightContext);

  if (darkMode) {
    props.TD.className = "dark";
  } else {
    props.TD.className = "";
  }

  return <div>{props.value}</div>;
}

const hotSettings = {
  data: Handsontable.helper.createSpreadsheetData(10, 1),
  rowHeaders: true,
  licenseKey: "non-commercial-and-evaluation"
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = (event) => {
    setDarkMode(event.target.checked);
  };

  return (
    <HighlightContext.Provider value={darkMode}>
      <h3>
        <input id="dark-mode" type="checkbox" onClick={toggleDarkMode} />{" "}
        <label htmlFor="dark-mode">Dark mode</label>
      </h3>
      <HotTable settings={hotSettings}>
        <HotColumn>
          {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
          <CustomRenderer hot-renderer />
        </HotColumn>
      </HotTable>
    </HighlightContext.Provider>
  );
};

ReactDOM.render(<App />, document.getElementById('example5'));
```
:::

## An advanced example

In this example, the custom editor component is created with an external dependency. This acts as both renderer and editor. The renderer uses information from that component in the first column to change the way it behaves. Information is passed using Redux and `react-redux`'s `connect` method.

::: example #example6 :react-advanced --tab preview
```jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { HexColorPicker } from "react-colorful";
import StarRatingComponent from "react-star-rating-component";
import { Provider, connect } from "react-redux";
import { createStore, combineReducers } from "redux";
import { HotTable, HotColumn, BaseEditorComponent } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

// a component
class UnconnectedColorPicker extends BaseEditorComponent {
  constructor(props) {
    super(props);

    this.editorRef = React.createRef();

    this.editorContainerStyle = {
      display: "none",
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 999,
      background: "#fff",
      padding: "15px",
      border: "1px solid #cecece"
    };

    this.state = {
      renderResult: null,
      value: ""
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
    this.editorRef.current.style.display = "block";
  }

  close() {
    this.editorRef.current.style.display = "none";

    this.setState({
      pickedColor: null
    });
  }

  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    this.editorRef.current.style.left = tdPosition.left + window.pageXOffset + "px";
    this.editorRef.current.style.top = tdPosition.top + window.pageYOffset + "px";
  }

  onPickedColor(color) {
    this.setValue(color);
  }

  applyColor() {
    const dispatch = this.props.dispatch;

    if (this.col === 1) {
      dispatch({
        type: "updateActiveStarColor",
        row: this.row,
        hexColor: this.getValue()
      });
    } else if (this.col === 2) {
      dispatch({
        type: "updateInactiveStarColor",
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
              style={{ width: "100%", height: "33px", marginTop: "10px" }}
              onClick={this.applyColor.bind(this)}
            >
              Apply
            </button>
        </div>
      );
    } else if (this.props.isRenderer) {
      const colorboxStyle = {
        background: this.props.value,
        width: "21px",
        height: "21px",
        float: "left",
        marginRight: "5px"
      };

      renderResult = (
        <React.Fragment>
          <div style={colorboxStyle} />
          <div>{this.props.value}</div>
        </React.Fragment>
      );
    }

    return <React.Fragment>{renderResult}</React.Fragment>;
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
    case "initRatingColors": {
      const { hotData } = action;

      const activeColors = hotData.map((data) => data[1]);
      const inactiveColors = hotData.map((data) => data[2]);

      return {
        ...state,
        activeColors,
        inactiveColors
      };
    }

    case "updateActiveStarColor": {
      const rowIndex = action.row;
      const newColor = action.hexColor;

      const activeColorArray = [...state.activeColors];

      activeColorArray[rowIndex] = newColor;

      return {
        ...state,
        activeColors: activeColorArray
      };
    }

    case "updateInactiveStarColor": {
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

const hotSettings = {
  data: [
    [1, "#ff6900", "#fcb900"],
    [2, "#fcb900", "#7bdcb5"],
    [3, "#7bdcb5", "#8ed1fc"],
    [4, "#00d084", "#0693e3"],
    [5, "#eb144c", "#abb8c3"]
  ],
  rowHeaders: true,
  rowHeights: 30,
  colHeaders: ["Rating", "Active star color", "Inactive star color"],
  licenseKey: "non-commercial-and-evaluation"
};

const App = () => {
  useEffect(() => {
    reduxStore.dispatch({
      type: "initRatingColors",
      hotData: hotSettings.data
    });
  }, []);

  return (
    <Provider store={reduxStore}>
      <HotTable settings={hotSettings}>
        <HotColumn width={100} type={"numeric"}>
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

ReactDOM.render(<App />, document.getElementById('example6'));
```
:::