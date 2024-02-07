---
id: h5waqmlx
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

Configure your grid's columns, using the props of the `HotColumn` component. Pass your component as a custom cell editor or a custom cell renderer.

[[toc]]

## Declare column settings

To declare column-specific settings, pass the settings as `HotColumn` props, either separately or wrapped as a `settings` prop, exactly as you would with `HotTable`.

::: example #example1 :react --tab preview

```jsx
import { HotTable, HotColumn } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const hotData = [
  ['A1', 'B1'],
  ['A2', 'B2'],
  ['A3', 'B3'],
  ['A4', 'B4'],
  ['A5', 'B5'],
  ['A6', 'B6'],
  ['A7', 'B7'],
  ['A8', 'B8'],
  ['A9', 'B9'],
  ['A10', 'B10'],
];
const secondColumnSettings = {
  title: 'Second column header',
  readOnly: true
};

export const ExampleComponent = () => {
  return (
    <HotTable data={hotData} 
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation">
      <HotColumn title="First column header" />
      <HotColumn settings={secondColumnSettings} />
    </HotTable>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```

:::

## Object data source

When you use object data binding for `<HotColumn/>`, you need to provide precise information about the data structure for columns. To do so, refer to your object-based data property in `HotColumn`'s `data` prop, for example, `<HotColumn data='id' />`:

::: example #example3 :react --tab preview

```jsx
import { HotTable, HotColumn } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

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

export const ExampleComponent = () => {
  return (
    <HotTable
        data={data}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        autoRowSize={false}
        autoColumnSize={false}
    >
      {/* use the `data` prop to reference the column data */}
      <HotColumn data="id" />
      <HotColumn data="name" />
      {/* add the `renderer` prop to set the component as a Handsontable renderer */}
      <HotColumn data="score" renderer={ScoreRenderer} />
      {/* add the `renderer` prop to set the component as a Handsontable renderer */}
      <HotColumn data="isPromoted" renderer={PromotionRenderer} />
    </HotTable>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```

:::
