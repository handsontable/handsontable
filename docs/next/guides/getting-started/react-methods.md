---
title: Instance methods
metaTitle: Instance methods - Guide - Handsontable Documentation
permalink: /next/methods
canonicalUrl: /methods
tags:
  - referring
  - referencing
  - ref
  - instance
  - methods
---

# Instance methods

You can programmatically change the internal state of Handsontable beyond what's possibile with props. To do that, you will need to call API methods of the relevant Handsontable instance associated with your instance of the `<HotTable />` component.

The following example implements the `<HotTable />` component showing how to reference the Handsontable instance from the wrapper component. 

::: example #example1 :react
```jsx
import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const hotSettings = {
  data: createSpreadsheetData(4, 4),
  colHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
};

const App = () => {
  const hotTableComponent = useRef(null);

  const swapHotData = () => {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    hotTableComponent.current.hotInstance.loadData([['new', 'data']]);
  };

  return (
    <>
      <HotTable ref={hotTableComponent} settings={hotSettings}/>
      <div className="controls">
        <button onClick={swapHotData}>Load new data!</button>
      </div>
    </>
  );
}

ReactDOM.render(<App/>, document.getElementById('example1'));
```
:::
:::
