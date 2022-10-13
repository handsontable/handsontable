---
title: Instance methods
metaTitle: Instance methods - JavaScript Data Grid | Handsontable
description: Reference a Handsontable instance from within a React component, to programmatically perform actions such as selecting cells.
permalink: /instance-methods
canonicalUrl: /instance-methods
tags:
  - referring
  - referencing
  - ref
  - instance
  - methods
react:
  metaTitle: Instance methods - React Data Grid | Handsontable
searchCategory: Guides
---

# Instance methods

Reference a Handsontable instance from within a React component, to programmatically perform actions such as selecting cells.

[[toc]]

## Use Handsontable's API

You can programmatically change the internal state of Handsontable beyond what's possible with props. To do that, you will need to call API methods of the relevant Handsontable instance associated with your instance of the `HotTable` component.

The following example implements the `HotTable` component showing how to reference the Handsontable instance from the wrapper component.

::: example #example1 :react
```jsx
import Handsontable from 'handsontable';
import { useRef } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotTableComponent = useRef(null);

  const selectCell = () => {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    hotTableComponent.current.hotInstance.selectCell(1, 1);
  };

  return (
    <>
      <HotTable
        ref={hotTableComponent}
        data={Handsontable.helper.createSpreadsheetData(4, 4)}
        colHeaders={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={selectCell}>Select cell B2</button>
      </div>
    </>
  );
}

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
