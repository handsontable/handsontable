---
title: Demo
metaTitle: Demo - Guide - Handsontable Documentation
permalink: /next/demo
canonicalUrl: /demo
tags:
  - demo
---

# Demo

Before you dive deep into Handsontable, check out our demo app.

The demo lets you see the code behind features such as:

- [Context menu](@/guides/accessories-and-menus/context-menu.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type.md)
- [Column groups &#8594;](@/guides/columns/column-groups.md)
- [Column menu &#8594;](@/guides/columns/column-menu.md)
- [Column filter &#8594;](@/guides/columns/column-filter.md)- 
- [Column hiding &#8594;](@/guides/columns/column-hiding.md)
- [Row sorting &#8594;](@/guides/rows/row-sorting.md)
- And way more than that!

## JavaScript


<code-group>
  <code-block title="JavaScript">
  ::: example #example1 --js 1 --css 2
  ```js
  const SELECTED_CLASS = "selected";
  const DEFAULT_ALIGNMENT_CLASS = "htLeft";
  const ODD_ROW_CLASS = "odd";

  // a helper function for the progress bar renderer function
  const addClassWhenNeeded = (td, cellProperties) => {
    const className = cellProperties.className;

    if (className !== void 0) {
      Handsontable.dom.addClass(td, className);
    }
  };

  // the progress bar renderer function
  function progressBarRenderer(
    instance,
    td,
    row,
    column,
    prop,
    value,
    cellProperties
  ) {
    const div = document.createElement("div");

    div.style.width = `${value * 10}px`;

    addClassWhenNeeded(td, cellProperties);
    Handsontable.dom.addClass(div, "progressBar");
    Handsontable.dom.empty(td);

    td.appendChild(div);
  }

  // the stars renderer function
  function starRenderer(
    instance,
    td,
    row,
    column,
    prop,
    value,
    cellProperties
  ) {
    Handsontable.renderers.TextRenderer.apply(this, [
      instance,
      td,
      row,
      column,
      prop,
      "★".repeat(value),
      cellProperties
    ]);
  }

  // the hooks' callbacks
  const headerAlignments = new Map([
    ["9", "htCenter"],
    ["10", "htRight"],
    ["12", "htCenter"]
  ]);

  function addClassesToRows(TD, row, column, prop, value, cellProperties) {
    // add classes to `TR`, while rendering a first visible `TD` element
    if (column !== 0) {
      return;
    }

    const parentElement = TD.parentElement;

    if (parentElement === null) {
      return;
    }

    // add class to selected rows
    if (cellProperties.instance.getDataAtRowProp(row, "0")) {
      Handsontable.dom.addClass(parentElement, SELECTED_CLASS);
    } else {
      Handsontable.dom.removeClass(parentElement, SELECTED_CLASS);
    }

    // add class to odd TRs
    if (row % 2 === 0) {
      Handsontable.dom.addClass(parentElement, ODD_ROW_CLASS);
    } else {
      Handsontable.dom.removeClass(parentElement, ODD_ROW_CLASS);
    }
  }

  function drawCheckboxInRowHeaders(row, TH) {
    const input = document.createElement("input");

    input.type = "checkbox";

    if (row >= 0 && this.getDataAtRowProp(row, "0")) {
      input.checked = true;
    }

    Handsontable.dom.empty(TH);

    TH.appendChild(input);
  }

  function alignHeaders(column, TH) {
    if (column < 0) {
      return;
    }

    if (TH.firstChild) {
      if (headerAlignments.has(column.toString())) {
        Handsontable.dom.removeClass(TH.firstChild, DEFAULT_ALIGNMENT_CLASS);
        Handsontable.dom.addClass(TH.firstChild, headerAlignments.get(column.toString()));
      } else {
        Handsontable.dom.addClass(TH.firstChild, DEFAULT_ALIGNMENT_CLASS);
      }
    }
  }

  function changeCheckboxCell(event, coords) {
    const target = event.target;

    if (coords.col === -1 && target && target.nodeName === "INPUT") {
      event.preventDefault(); // render a checked/unchecked checkbox on its own

      this.setDataAtRowProp(coords.row, "0", !target.checked);
    }
  }

  const example = document.getElementById("example1");

  // the grid's data
  //ajax('/docs/next/scripts/json/demo-data.json', 'GET', '', res => {
  ajax('https://handsontable.com/docs/9.0/scripts/json/load.json', 'GET', '', res => {
    const data = JSON.parse(res.response);

    init(data);
  });

  function init(data) {
    new Handsontable(example, {
        data,
        height: 450,
        colWidths: [140, 126, 192, 100, 100, 90, 90, 110, 97],
        colHeaders: [
          "Company name",
          "Country",
          "Name",
          "Sell date",
          "Order ID",
          "In stock",
          "Qty",
          "Progress",
          "Rating"
        ],
        columns: [
          { data: 1, type: "text" },
          { data: 2, type: "text" },
          { data: 3, type: "text" },
          {
            data: 4,
            type: "date",
            allowInvalid: false
          },
          { data: 5, type: "text" },
          {
            data: 6,
            type: "checkbox",
            className: "htCenter"
          },
          {
            data: 7,
            type: "numeric"
          },
          {
            data: 8,
            renderer: progressBarRenderer,
            readOnly: true,
            className: "htMiddle"
          },
          {
            data: 9,
            renderer: starRenderer,
            readOnly: true,
            className: "star htCenter"
          }
        ],
        dropdownMenu: true,
        hiddenColumns: {
          indicators: true
        },
        contextMenu: true,
        multiColumnSorting: true,
        filters: true,
        rowHeaders: true,
        manualRowMove: true,
        afterGetColHeader: alignHeaders,
        afterOnCellMouseDown: changeCheckboxCell,
        beforeRenderer: addClassesToRows,
        licenseKey: "non-commercial-and-evaluation"
      });
  }

  function ajax(url, method, params, callback) {
    let obj;

    try {
      obj = new XMLHttpRequest();
    } catch (e) {
      try {
        obj = new ActiveXObject('Msxml2.XMLHTTP');
      } catch (e) {
        try {
          obj = new ActiveXObject('Microsoft.XMLHTTP');
        } catch (e) {
          alert('Your browser does not support Ajax.');
          return false;
        }
      }
    }
    obj.onreadystatechange = () => {
      if (obj.readyState == 4) {
        callback(obj);
      }
    };
    obj.open(method, url, true);
    obj.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    obj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    obj.send(params);

    return obj;
  }
  ```
  ```css
  /*
    A stylesheet customizing app (custom renderers)
  */

  table.htCore td.star {
    color: #fcb515;
  }

  table.htCore tr.odd td {
    background: #fafbff;
  }

  table.htCore td .progressBar {
    background: #37bc6c;
    height: 10px;
  }

  table.htCore tr.selected td {
    background: #edf3fd;
  }

  /*
    A stylesheet customizing Handsontable style
  */

  .collapsibleIndicator {
    text-align: center;
  }

  .handsontable .htRight .changeType {
    margin: 3px 1px 0 13px;
  }
  .handsontable .green {
    background: #37bc6c;
    font-weight: bold;
  }

  .handsontable .orange {
    background: #fcb515;
    font-weight: bold;
  }

  .btn {
    padding: 20px;
    font: 1.4em sans-serif;
  }
  [data-color="green"] {
    background: #37bc6c;
  }
  [data-color="orange"] {
    background: #fcb515;
  }
  ```
  :::
  </code-block>
  <code-block title="TypeScript">

  ::: example #example2 :angular --js 1 --css 2
  ```js
  const SELECTED_CLASS = "selected";
  const DEFAULT_ALIGNMENT_CLASS = "htLeft";
  const ODD_ROW_CLASS = "odd";

type AddClassWhenNeeded = (
  td: HTMLTableCellElement,
  cellProperties: Handsontable.CellProperties
) => void;

const addClassWhenNeeded: AddClassWhenNeeded = (td, cellProperties) => {
  const className = cellProperties.className;

  if (className !== void 0) {
    Handsontable.dom.addClass(td, className);
  }
};

const progressBarRenderer: Handsontable.renderers.Base = (
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
  const div = document.createElement("div");

  //div.style.width = `${value * 10}px`; //fails on JSFiddle
  div.style.width = value * 10 + "px";

  addClassWhenNeeded(td, cellProperties);
  Handsontable.dom.addClass(div, "progressBar");
  Handsontable.dom.empty(td);

  td.appendChild(div);
};

const starsRenderer: Handsontable.renderers.Base = (
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
  Handsontable.renderers.TextRenderer.apply(this, [
    instance,
    td,
    row,
    column,
    prop,
    "★".repeat(value),
    cellProperties
  ]);
};

  // the hooks' callbacks
const headerAlignments = new Map([
  ["9", "htCenter"],
  ["10", "htRight"],
  ["12", "htCenter"]
]);

type AddClassesToRows = (
  TD: HTMLTableCellElement,
  row: number,
  column: number,
  prop: number | string,
  value: any,
  cellProperties: Handsontable.CellProperties
) => void;

const addClassesToRows: AddClassesToRows = (
  TD,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
  // Adding classes to `TR` just while rendering first visible `TD` element
  if (column !== 0) {
    return;
  }

  const parentElement = TD.parentElement;

  if (parentElement === null) {
    return;
  }

  // Add class to selected rows
  if (cellProperties.instance.getDataAtRowProp(row, "0")) {
    Handsontable.dom.addClass(parentElement, SELECTED_CLASS);
  } else {
    Handsontable.dom.removeClass(parentElement, SELECTED_CLASS);
  }

  // Add class to odd TRs
  if (row % 2 === 0) {
    Handsontable.dom.addClass(parentElement, ODD_ROW_CLASS);
  } else {
    Handsontable.dom.removeClass(parentElement, ODD_ROW_CLASS);
  }
};

type DrawCheckboxInRowHeaders = (
  //this: Handsontable, //fails on JSFiddle, requires TS2.0
  row: number,
  TH: HTMLTableCellElement
) => void;

const drawCheckboxInRowHeaders: DrawCheckboxInRowHeaders = function drawCheckboxInRowHeaders(
  row,
  TH
) {
  const input = document.createElement("input");

  input.type = "checkbox";

  if (row >= 0 && this.getDataAtRowProp(row, "0")) {
    input.checked = true;
  }

  Handsontable.dom.empty(TH);

  TH.appendChild(input);
};

type AlignHeaders = (
  row: number,
  TH: HTMLTableCellElement
) => void;

const alignHeaders: AlignHeaders = (column, TH) => {
  if (column < 0) {
    return;
  }

  if (TH.firstChild) {
    if (headerAlignments.has(column.toString())) {
      Handsontable.dom.removeClass(
        TH.firstChild as HTMLElement,
        DEFAULT_ALIGNMENT_CLASS
      );
      Handsontable.dom.addClass(
        TH.firstChild as HTMLElement,
        // @ts-ignore Above if checks whether there is an element in the Map.
        headerAlignments.get(column.toString())
      );
    } else {
      Handsontable.dom.addClass(
        TH.firstChild as HTMLElement,
        DEFAULT_ALIGNMENT_CLASS
      );
    }
  }
};

type ChangeCheckboxCell = (
  //this: Handsontable, //fails on JSFiddle, requires TS2.0
  event: MouseEvent,
  coords: { row: number; col: number }
) => void;

const changeCheckboxCell: ChangeCheckboxCell = function changeCheckboxCell(
  event,
  coords
) {
  const target = event.target as HTMLInputElement;

  if (coords.col === -1 && event.target && target.nodeName === "INPUT") {
    event.preventDefault(); // Handsontable will render checked/unchecked checkbox by it own.

    this.setDataAtRowProp(coords.row, "0", !target.checked);
  }
};

  const example = document.getElementById("example2");

  // the grid's data
  //ajax('/docs/next/scripts/json/demo-data.json', 'GET', '', res => {
  ajax('https://handsontable.com/docs/9.0/scripts/json/load.json', 'GET', '', res => {
    const data = JSON.parse(res.response);

    init(data);
  });

  function init(data) {
    new Handsontable(example, {
        data,
  height: 450,
  colWidths: [140, 126, 192, 100, 100, 90, 90, 110, 97],
  colHeaders: [
    "Company names",
    "Country",
    "Name",
    "Sell date",
    "Order ID",
    "In stock",
    "Qty",
    "Progress",
    "Rating"
  ],
  columns: [
    { data: 1, type: "text" },
    { data: 2, type: "text" },
    { data: 3, type: "text" },
    {
      data: 4,
      type: "date",
      allowInvalid: false
    },
    { data: 5, type: "text" },
    {
      data: 6,
      type: "checkbox",
      className: "htCenter"
    },
    {
      data: 7,
      type: "numeric"
    },
    {
      data: 8,
      renderer: progressBarRenderer,
      readOnly: true,
      className: "htMiddle"
    },
    {
      data: 9,
      renderer: starsRenderer,
      readOnly: true,
      className: "star htCenter"
    }
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true
  },
  contextMenu: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  afterGetColHeader: alignHeaders,
  afterGetRowHeader: drawCheckboxInRowHeaders,
  afterOnCellMouseDown: changeCheckboxCell,
  beforeRenderer: addClassesToRows,
  licenseKey: "non-commercial-and-evaluation"
      });
  }

  function ajax(url, method, params, callback) {
    let obj;

    try {
      obj = new XMLHttpRequest();
    } catch (e) {
      try {
        obj = new ActiveXObject('Msxml2.XMLHTTP');
      } catch (e) {
        try {
          obj = new ActiveXObject('Microsoft.XMLHTTP');
        } catch (e) {
          alert('Your browser does not support Ajax.');
          return false;
        }
      }
    }
    obj.onreadystatechange = () => {
      if (obj.readyState == 4) {
        callback(obj);
      }
    };
    obj.open(method, url, true);
    obj.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    obj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    obj.send(params);

    return obj;
  }
  ```
  ```css
  /*
    A stylesheet customizing app (custom renderers)
  */

  table.htCore td.star {
    color: #fcb515;
  }

  table.htCore tr.odd td {
    background: #fafbff;
  }

  table.htCore td .progressBar {
    background: #37bc6c;
    height: 10px;
  }

  table.htCore tr.selected td {
    background: #edf3fd;
  }

  /*
    A stylesheet customizing Handsontable style
  */

  .collapsibleIndicator {
    text-align: center;
  }

  .handsontable .htRight .changeType {
    margin: 3px 1px 0 13px;
  }
  .handsontable .green {
    background: #37bc6c;
    font-weight: bold;
  }

  .handsontable .orange {
    background: #fcb515;
    font-weight: bold;
  }

  .btn {
    padding: 20px;
    font: 1.4em sans-serif;
  }
  [data-color="green"] {
    background: #37bc6c;
  }
  [data-color="orange"] {
    background: #fcb515;
  }
  ```
  :::


  </code-block>
  <code-block title="React">

  ::: example #example3 :react --html 1 --js 2
  ```html
  <!-- a root div in which the component is being rendered -->
  <div id="example3"></div>
  ```

  ```jsx
  import ReactDOM from 'react-dom';
  import { HotTable } from '@handsontable/react';
  import { registerAllModules } from 'handsontable/registry';
  import { createSpreadsheetData } from './helpers';

  // register Handsontable's modules
  registerAllModules();

  const hotData = createSpreadsheetData(6, 10);

  const App = () => {
    return (
      <div>
        <HotTable
          data={hotData}
          colHeaders={true}
          rowHeaders={true}
          height='auto'
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    )
  }

  ReactDOM.render(<App />, document.getElementById('example3'));
  ```
  :::

  </code-block>
  <code-block title="Angular">

  ::: example :angular --html 1 --js 2
  ```html
  <app-root></app-root>
  ```

  ```js
  // app.component.ts
  import { Component } from '@angular/core';

  @Component({
    selector: 'app-root',
    template: `
    <div>
      <hot-table
        [data]="dataset"
        [colHeaders]="true"
        [rowHeaders]="true"
        height="auto"
        licenseKey="non-commercial-and-evaluation">
          <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
          <hot-column data="name" title="Full name"></hot-column>
          <hot-column data="address" title="Street name"></hot-column>
      </hot-table>
    </div>
    `,
  })
  class AppComponent {
    dataset: any[] = [
      {id: 1, name: 'Ted Right', address: 'Wall Street'},
      {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
      {id: 3, name: 'Joan Well', address: 'Broadway'},
      {id: 4, name: 'Gail Polite', address: 'Bourbon Street'},
      {id: 5, name: 'Michael Fair', address: 'Lombard Street'},
      {id: 6, name: 'Mia Fair', address: 'Rodeo Drive'},
      {id: 7, name: 'Cora Fair', address: 'Sunset Boulevard'},
      {id: 8, name: 'Jack Right', address: 'Michigan Avenue'},
    ];
  }

  // app.module.ts
  import { NgModule } from '@angular/core';
  import { BrowserModule } from '@angular/platform-browser';
  import { HotTableModule } from '@handsontable/angular';
  import { registerAllModules } from 'handsontable/registry';

  // register Handsontable's modules
  registerAllModules();

  @NgModule({
    imports:      [ BrowserModule, HotTableModule ],
    declarations: [ AppComponent ],
    bootstrap:    [ AppComponent ]
  })
  class AppModule { }

  // bootstrap
  import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

  platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
  ```
  :::


  </code-block>
  <code-block title="Vue 2">

  ::: example :angular --html 1 --js 2
  ```html
  <app-root></app-root>
  ```

  ```js
  // app.component.ts
  import { Component } from '@angular/core';

  @Component({
    selector: 'app-root',
    template: `
    <div>
      <hot-table
        [data]="dataset"
        [colHeaders]="true"
        [rowHeaders]="true"
        height="auto"
        licenseKey="non-commercial-and-evaluation">
          <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
          <hot-column data="name" title="Full name"></hot-column>
          <hot-column data="address" title="Street name"></hot-column>
      </hot-table>
    </div>
    `,
  })
  class AppComponent {
    dataset: any[] = [
      {id: 1, name: 'Ted Right', address: 'Wall Street'},
      {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
      {id: 3, name: 'Joan Well', address: 'Broadway'},
      {id: 4, name: 'Gail Polite', address: 'Bourbon Street'},
      {id: 5, name: 'Michael Fair', address: 'Lombard Street'},
      {id: 6, name: 'Mia Fair', address: 'Rodeo Drive'},
      {id: 7, name: 'Cora Fair', address: 'Sunset Boulevard'},
      {id: 8, name: 'Jack Right', address: 'Michigan Avenue'},
    ];
  }

  // app.module.ts
  import { NgModule } from '@angular/core';
  import { BrowserModule } from '@angular/platform-browser';
  import { HotTableModule } from '@handsontable/angular';
  import { registerAllModules } from 'handsontable/registry';

  // register Handsontable's modules
  registerAllModules();

  @NgModule({
    imports:      [ BrowserModule, HotTableModule ],
    declarations: [ AppComponent ],
    bootstrap:    [ AppComponent ]
  })
  class AppModule { }

  // bootstrap
  import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

  platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
  ```
  :::


  </code-block>
</code-group>

## React


## Angular

## Vue

## CodeSandbox
