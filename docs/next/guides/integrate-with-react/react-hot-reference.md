---
title: Referencing the Handsontable instance
metaTitle: Referencing the Handsontable instance - Guide - Handsontable Documentation
permalink: /next/react-hot-reference
canonicalUrl: /react-hot-reference
---

# Referencing the Handsontable instance

An implementation of the `@handsontable/react` explaining how to reference the Handsontable instance from the wrapper component.

::: example #example1 :react
```jsx
import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

const hotSettings = {
  data: Handsontable.helper.createSpreadsheetData(4, 4),
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
};

const App = () => {
  const hotTableComponent = useRef(null);

  const swapHotData = () => {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    hotTableComponent.current.hotInstance.loadData([['new', 'data']]);
  };

  return (
    <div className="controls">
      <HotTable ref={hotTableComponent} settings={hotSettings}/>
      <br/>
      <button onClick={swapHotData}>Load new data!</button>
    </div>
  );
}

ReactDOM.render(<App/>, document.getElementById('example1'));
```
:::
