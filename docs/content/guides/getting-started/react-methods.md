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

You can programmatically change the internal state of Handsontable beyond what's possible with props. To do that, call API methods of the relevant Handsontable instance associated with your instance of the `HotTable` component.

The following example implements the `HotTable` component showing how to reference the Handsontable instance from the wrapper component.

::: example #example1 :react
```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const data = [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
  ];
  const hotTableComponentRef = useRef(null);

  const selectCell = () => {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    hotTableComponentRef.current.hotInstance.selectCell(1, 1);
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={data}
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

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
