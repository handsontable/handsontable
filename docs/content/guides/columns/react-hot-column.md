---
title: Column component
metaTitle: Column component - React Data Grid | Handsontable
description: Configure the React data grid's columns, using the props of the "HotColumn" component. Pass your component as a custom cell editor or a custom cell renderer.
permalink: /hot-column
canonicalUrl: /hot-column
tags:
  - hotcolumn
searchCategory: Guides
---

# Column component

[[toc]]

## Overview

You can configure the column-related settings using the `HotColumn` component's props. You can also create custom renderers and editors using React components.

## Declaring column settings

To declare column-specific settings, pass the settings as `HotColumn` props, either separately or wrapped as a `settings` prop, exactly as you would with `HotTable`.

::: example #example1 :react --tab preview
```jsx
import ReactDOM from 'react-dom';
import Handsontable from 'handsontable';
import { HotTable, HotColumn } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';

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
import 'handsontable/dist/handsontable.full.min.css';

// a renderer component
const ScoreRenderer = (props) => {
  const { value } = props;
  const color = value > 60 ? '#2ECC40' : '#FF4136';
  return (
    <span style={{ color }}>{value}</span>
  );
};

// a renderer component
const PromotionRenderer = (props) => {
  const { value } = props;
  if (value) {
    return (
      <span>&#10004;</span>
    );
  }
  return (
    <span>&#10007;</span>
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