---
title: Using the HotColumn component
metaTitle: Using the HotColumn component - Guide - Handsontable Documentation
permalink: /next/react-hot-column
canonicalUrl: /react-hot-column
---

# Using the HotColumn component

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
      id: 5,
      name: "Max",
      score: 98,
      isPromoted: true
    },
    {
      id: 6,
      name: "Lucy",
      score: 59,
      isPromoted: false
    },
    {
      id: 7,
      name: "Max",
      score: 70,
      isPromoted: true
    },
    {
      id: 8,
      name: "Lucas",
      score: 3,
      isPromoted: false
    },
    {
      id: 9,
      name: "Mary",
      score: 99,
      isPromoted: true
    },
    {
      id: 10,
      name: "Andy",
      score: 13,
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

To prevent that, the `mousedown` event on the editor container must call `event.stopPropagation()`. In React's case, however, it doesn't work out of the box because of the way React handles events. [This article by Eric Clemmons](https://medium.com/@ericclemmons/react-event-preventdefault-78c28c950e46) sums it up pretty well. 

The example below uses the [react-native-listener](https://www.npmjs.com/package/react-native-listener) library to utilize the native `mousedown` event.

<iframe src="https://codesandbox.io/embed/declaring-a-custom-editor-as-a-component-qhbnv?fontsize=14&theme=dark" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;"
  title="Declaring a custom editor as a component" 
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## Using the renderer/editor components with React's Context

In this example, React's Context is used to pass the information available in the main app component to the renderer. In this case, we're using just the renderer, but the same principle works with editors just as well.

<iframe src="https://codesandbox.io/embed/using-the-renderer-component-with-reacts-context-forked-27pl0?fontsize=14&theme=dark" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;"
  title="Using the renderer component with React&#039;s Context" 
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## An advanced example

In this example, the custom editor component is created with an external dependency. This acts as both renderer and editor. The renderer uses information from that component in the first column to change the way it behaves. Information is passed using Redux and `react-redux`'s `connect` method.

<iframe src="https://codesandbox.io/embed/advanced-handsontablereact-implementation-using-hotcolumn-forked-jgrk2?fontsize=14&theme=dark" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;"
  title="Advanced @handsontable/react implementation using HotColumn" 
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
