---
title: Column filter
metaTitle: Column filter - Guide - Handsontable Documentation
permalink: /next/column-filter
canonicalUrl: /column-filter
tags:
  - filtering data
---

# Column filter

[[toc]]

## Overview
The **Filters plugin** allows filtering the data in the table's columns using a range of pre-defined conditions.

## Basic configuration

To enable the plugin, set the `filters` property to `true` and enable the filters dependency, which is the [dropdownMenu](@/guides/columns/column-menu.md) plugin.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
    ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
    ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
    ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
    ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]
  ],
  columns: [
    { type: 'text' },
    { type: 'text' },
    { type: 'text' },
    { type: 'text' },
    { type: 'date', dateFormat: 'M/D/YYYY' },
    { type: 'numeric' }
  ],
  colHeaders: true,
  rowHeaders: true,
  dropdownMenu: true,
  filters: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Custom filter menu

To display filters while hiding the other elements in the dropdown menu, pass the elements to be displayed as an array into the configuration.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
    ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
    ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
    ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
    ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]
  ],
  columns: [
    { type: 'text' },
    { type: 'text' },
    { type: 'text' },
    { type: 'text' },
    { type: 'date', dateFormat: 'M/D/YYYY' },
    { type: 'numeric' }
  ],
  colHeaders: true,
  rowHeaders: true,
  filters: true,
  dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Custom implementations

The examples below show how to adjust the Filter plugin to your needs. They include customizing the UI components, changing the default behavior, and using filters outside the table.

### Filter as you type

In this example, a basic `input` element has been placed inside a column’s header (A, B, C…). It is placed right below the column's label and is separated with a horizontal line for better visibility. The data is being filtered as you type - with a 100 ms delay. The filter element has been excluded from the selection event, so the column doesn’t get selected when clicked on.

Please note that this demo uses a Handsontable API to a great extent.

::: example #example3
```js
// Event for `keydown` event. Add condition after delay of 200 ms which is counted from the time of last pressed key.
const debounceFn = Handsontable.helper.debounce((colIndex, event) => {
  const filtersPlugin = hot.getPlugin('filters');

  filtersPlugin.removeConditions(colIndex);
  filtersPlugin.addCondition(colIndex, 'contains', [event.target.value]);
  filtersPlugin.filter();
}, 100);

const addEventListeners = (input, colIndex) => {
  input.addEventListener('keydown', event => {
    debounceFn(colIndex, event);
  });
};

// Build elements which will be displayed in header.
const getInitializedElements = colIndex => {
  const div = document.createElement('div');
  const input = document.createElement('input');

  div.className = 'filterHeader';

  addEventListeners(input, colIndex);

  div.appendChild(input);

  return div;
};

// Add elements to header on `afterGetColHeader` hook.
const addInput = (col, TH) => {
  // Hooks can return a value other than number (for example `columnSorting` plugin uses this).
  if (typeof col !== 'number') {
    return col;
  }

  if (col >= 0 && TH.childElementCount < 2) {
    TH.appendChild(getInitializedElements(col));
  }
};

const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
    ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
    ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
    ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
    ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  className: 'as-you-type-demo',
  filters: true,
  colWidths: 100,
  afterGetColHeader: addInput,
  beforeOnCellMouseDown(event, coords) {
    // Deselect the column after clicking on input.
    if (coords.row === -1 && event.target.nodeName === 'INPUT') {
      event.stopImmediatePropagation();
      this.deselectCell();
    }
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Filter from the outside the table

The external Filter component is controlling the main table by passing values for particular columns. Only a fraction of the code is related to Handsontable API, for example, `addConditionsByValue`, `filter`, and `removeConditions`.

::: tip
Note that selecting a column in the Filter component resets the state of the table. This implementation can filter only one column at a time.
:::

::: example #example4 --html 1 --js 2
```html
<div id="example4" class="hot"></div>
<div id="externalFilter">
  <div class="columnChoose">
    <label>Choose Column: </label>
    <select></select>
  </div>

  <div id="filterSelect">
    <div class="controllers">
      <div>
        <input type='checkbox' id='filtersSelectAll' checked="checked" />
        <label for='filtersSelectAll'>(Select all)</label>
      </div>
    </div>
    <div class="items"></div>
  </div>

  <div class="buttons controls">
    <button class="apply">Apply filter</button>
    <button class="clear">Clear filter</button>
  </div>
</div>
```
```js
const arrayEach = Handsontable.helper.arrayEach;
const curry = Handsontable.helper.curry;

class DOMHelper {
  constructor(state, actions) {
    this.state = state;
    this.addConditionsByValue = actions.addConditionsByValue;
    this.filter = actions.filter;
    this.removeConditions = actions.removeConditions;

    this.externalFilterUI = document.querySelector('#externalFilter');
    this.selectAllUI = document.querySelector('#filtersSelectAll');
    this.itemsContainerUI = this.externalFilterUI.querySelector('.items');
    this.chooseColumnUI = this.externalFilterUI.querySelector('.columnChoose > select');
    this.applyFilterUI = this.externalFilterUI.querySelector('.buttons > .apply');
    this.clearFilterUI = this.externalFilterUI.querySelector('.buttons > .clear');
    this.inputs = [];

    this.fillSelectByColHeaders();
    this.fillValueBoxByData();
    this.initListeners();

    this.externalFilterUI.style.display = 'block';
  }

  initListeners() {
    this.chooseColumnUI.addEventListener('change', event => this.onSelectChanged(event));
    this.applyFilterUI.addEventListener('click', () => this.onApplyFilterClicked());
    this.clearFilterUI.addEventListener('click', () => this.onClearFilterClicked());
    this.selectAllUI.addEventListener('click', () => this.onSelectAllClicked());
  }

  fillSelectByColHeaders() {
    const colHeaders = this.state.getHeaders();

    arrayEach(colHeaders, (colHeader, columnIndex) => {
      const option = document.createElement('option');

      option.text = colHeader;

      if (columnIndex === this.state.getSelectedColumn()) {
        option.selected = true;
      }

      this.chooseColumnUI.add(option);
    });
  }

  fillValueBoxByData() {
    arrayEach(this.state.getData(), (cellData, rowIndex) => {
      const item = document.createElement('div');

      item.className = 'item';

      const input = document.createElement('input');
      const id = 'cellData' + '(' + this.state.getSelectedColumn()+ ',' + rowIndex + ')';

      input.id = id;
      input.type = 'checkbox';
      input.name = 'cellData';
      input.value = cellData;
      input.checked = true;

      input.addEventListener('change', event => this.onInputChange(event));

      const label = document.createElement('label');

      label.htmlFor = id;
      label.innerText = cellData;

      item.appendChild(input);
      item.appendChild(label);
      this.inputs.push(input);
      this.itemsContainerUI.appendChild(item);
    });
  }

  setSelectAllUIChecked(checked) {
    if (this.selectAllUI.checked !== checked) {
      this.selectAllUI.checked = checked;
    }
  }

  clearElementChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  onSelectChanged(event) {
    this.removeConditions(this.state.getSelectedColumn());
    this.filter();
    this.state.setSelectedColumn(event.target.selectedIndex);

    this.setSelectAllUIChecked(true);
    this.clearElementChildren(this.itemsContainerUI);
    this.fillValueBoxByData();
  }

  onInputChange(event) {
    if (event.target.checked === false) {
      this.state.addValuesToFilter(event.target.value);
      this.setSelectAllUIChecked(false);

    } else {
      this.state.removeValuesForFilter(event.target.value);

      if (this.state.allValuesChecked()) {
        this.setSelectAllUIChecked(true);
      }
    }
  }

  onApplyFilterClicked() {
    this.removeConditions(this.state.getSelectedColumn());
    this.addConditionsByValue(this.state.getValuesToFilter(), this.state.getSelectedColumn());
    this.filter();
  }

  onClearFilterClicked() {
    this.removeConditions(this.state.getSelectedColumn());
    this.state.removeValuesForFilter();
    this.filter();

    this.clearElementChildren(this.itemsContainerUI);
    this.fillValueBoxByData();
    this.setSelectAllUIChecked(true);
  }

  onSelectAllClicked() {
    if (this.state.allValuesChecked()) {
      this.state.addValuesToFilter();

      arrayEach(this.inputs, function (inputDomElement) {
        inputDomElement.checked = false;
      });

    } else {
      this.state.removeValuesForFilter();

      arrayEach(this.inputs, function (inputDomElement) {
        inputDomElement.checked = true;
      });
    }
  }
}

class State {
  constructor(data, headers, selectedColumn = 0) {
    this.selectedColumn = selectedColumn;
    this.data = data;
    this.headers = headers;

    this.initStateForColumn();
  }

  initStateForColumn() {
    this.dataAtCol = this.getUniqueDataAtCol(this.selectedColumn);
    this.checkedValues = this.dataAtCol.length;
    this.maxCheckedValues = this.dataAtCol.length;
    this.valuesToFilter = [];
  }

  getHeaders() {
    return this.headers;
  }

  getData() {
    return this.dataAtCol;
  }

  getUniqueDataAtCol(column) {
    const dataAtCol = this.getSourceDataAtCol(column);

    return dataAtCol.filter((value, index, self) => self.indexOf(value) === index);
  }

  getSourceDataAtCol(column) {
    return this.data.map(dataAtRow => dataAtRow[column].toString());
  }

  setSelectedColumn(column) {
    this.selectedColumn = column;
    this.initStateForColumn();
  }

  getSelectedColumn() {
    return this.selectedColumn;
  }

  getValuesToFilter() {
    return this.valuesToFilter;
  }

  addValuesToFilter(value) {
    if (value) {
      this.valuesToFilter.push(value);
      this.checkedValues -= 1;

    } else {
      this.valuesToFilter = Array.from(this.dataAtCol);
      this.checkedValues = 0;
    }
  }

  removeValuesForFilter(value) {
    if (value) {
      const indexOfRemovedElement = this.valuesToFilter.indexOf(value);

      if (indexOfRemovedElement !== -1) {
        this.valuesToFilter.splice(indexOfRemovedElement, 1);
        this.checkedValues += 1;
      }

    } else {
      this.valuesToFilter.length = 0;
      this.checkedValues = this.maxCheckedValues;
    }
  }

  allValuesChecked() {
    return this.checkedValues === this.maxCheckedValues;
  }
}

class Controller {
  constructor(hotInstance, options = {}) {
    const {addConditionsByValue, filter, removeConditions} = options;

    this.hot = hotInstance;
    this.state = new State(hotInstance.getSourceData(), hotInstance.getColHeader(), options.selectedColumn);
    new DOMHelper(this.state, {addConditionsByValue, filter, removeConditions});
  }
}

const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: [
    ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
    ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
    ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
    ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
    ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  filters: true,
  colWidths: 100,
  editor: false,
  fillHandle: false,
  licenseKey: 'non-commercial-and-evaluation',
  afterInit() {
    const filtersPlugin = this.getPlugin('filters');

    new Controller(this, {
      selectedColumn: 0,
      addConditionsByValue: curry((values, column) => {
        arrayEach(values, value => filtersPlugin.addCondition(column, 'not_contains', [value]));
      }),
      filter: () => filtersPlugin.filter(),
      removeConditions: column => filtersPlugin.removeConditions(column)
    });
  }
});
```
:::
