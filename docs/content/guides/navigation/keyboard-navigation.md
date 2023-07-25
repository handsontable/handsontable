---
id: 6qwoo503
title: Keyboard navigation
metaTitle: Keyboard navigation - JavaScript Data Grid | Handsontable
description: Navigate the grid using just your keyboard. Configure navigation options to meet the accessibility needs of your users.
permalink: /keyboard-navigation
canonicalUrl: /keyboard-navigation
tags:
  - accessibility
  - certification
  - section 508
  - WCAG
  - ADA
  - a11y
  - aria
  - jaws
  - nvda
  - voiceover
react:
  id: 3m72vkzl
  metaTitle: Keyboard navigation - React Data Grid | Handsontable
searchCategory: Guides
---

# Keyboard navigation

Navigate the grid using just your keyboard. Configure navigation options to meet the accessibility needs of your users.

[[toc]]

## Overview

You can easily access all of Handsontable's features without using a mouse, which is particularly important for people with
[accessibility](@/guides/accessibility/accessibility.md) needs. Keyboard navigation works out of the box and follows international standards. Navigating the
grid takes a few simple keystrokes: you can try it out in the [demo](#default-keyboard-navigation) below.

You can easily switch between navigating Handsontable [like a spreadsheet or like a data grid](#navigation-modes). You can also fine-tune the grid's behavior by
configuring individual [navigation options](#configure-keyboard-navigation-options).

To use your keyboard for more advanced actions, see the list of [all built-in shortcuts](@/guides/navigation/keyboard-shortcuts.md#default-keyboard-shortcuts),
or add [shortcuts of your own](@/guides/navigation/custom-shortcuts.md).

## Default keyboard navigation

By default, you can navigate Handsontable in the following way:

- Use the arrow keys to move one cell up, down, left, or right.
- Press <kbd>**Tab**</kbd> to move to the next cell, and <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> to move to the previous cell.
- Press <kbd>**Enter**</kbd> to start editing the active cell.
- For more advanced actions, see the list of [all built-in shortcuts](@/guides/navigation/keyboard-shortcuts.md#default-keyboard-shortcuts).

Try out the default keyboard navigation in the following demo.

::: only-for javascript

::: example #exampleKeyboardNavigation --html 1 --js 2

```html
<div id="exampleKeyboardNavigation"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleKeyboardNavigation');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  disableTabNavigation: false,
  navigableHeaders: true,
  height: 168,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleKeyboardNavigation :react

```jsx
// to import sorting as an individual module, see the 'Import the sorting module' section of this page
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: true,
        },
      ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      disableTabNavigation="false"
      navigableHeaders="true"
      height={168}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleKeyboardNavigation'));
/* end:skip-in-preview */
```

:::

:::

## Navigation modes

You can tweak Handsontable's [navigation options](#configure-keyboard-navigation-options) any way you want, but in most cases, you'll want to use one of the two
configurations: the spreadsheet mode (default) or the data grid mode.

To navigate Handsontable like a spreadsheet, use the default configuration:

::: only-for javascript

```js
const configurationOptions = {
  // disable navigation in headers (default setting)
  navigableHeaders: false,

  // on pressing Tab, move focus to the next column (default setting)
  disableTabNavigation: false,
  tabMoves: { row: 0, col: 1 },

  // on pressing Enter, begin editing (default setting)
  enterBeginsEditing: true,
  // on pressing Enter again, move focus 1 row down (default setting)
  enterMoves: { col: 0, row: 1 },
};
```

:::

::: only-for react

```jsx
<HotTable
  // disable navigation in headers (default setting)
  navigableHeaders={false}
  // on pressing Tab, move focus to the next column (default setting)
  disableTabNavigation={false}
  tabMoves={{ row: 0, col: 1 }}
  // on pressing Enter, begin editing (default setting)
  enterBeginsEditing={true}
  // on pressing Enter again, move focus 1 row down (default setting)
  enterMoves={{ col: 0, row: 1 }}
/>
```

:::

To navigate Handsontable like a data grid, use the following configuration:

::: only-for javascript

```js
const configurationOptions = {
  // enable navigation in headers
  navigableHeaders: true,

  // on pressing Tab, don't do anything
  disableTabNavigation: true,

  // on pressing Enter, move focus 1 row down
  enterBeginsEditing: false,
  enterMoves: { col: 0, row: 1 }, // default setting
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable navigation in headers
  navigableHeaders={true}
  // on pressing Tab, don't do anything
  disableTabNavigation={true}
  // on pressing Enter, move focus 1 row down
  enterBeginsEditing={false}
  enterMoves={{ col: 0, row: 1 }} // default setting
/>
```

:::

See the difference in the following demo:

::: example #exampleNavigationModes --html 1 --js 2

```html
<div>
  <input type="radio" id="spreadsheetMode" checked />
  <label for="spreadsheetMode">Spreadsheet mode</label>
</div>
<div>
  <input type="radio" id="dataGridMode" />
  <label for="dataGridMode">Data grid mode</label>
</div>
<br />
<br />
<input type="text" id="navigable_test_input_1" placeholder="Navigable test input" />
<br />
<br />
<div id="exampleNavigationModes"></div>
<input type="text" id="navigable_test_input_2" placeholder="Navigable test input" />
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleNavigationModes');
const checkboxEnableTabNavigation = document.querySelector('#enable_tab_navigation');
const checkboxEnableHeadersNavigation = document.querySelector('#enable_headers_navigation');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  disableTabNavigation: true,
  navigableHeaders: false,
  rowHeaders: true,
  height: 168,
  licenseKey: 'non-commercial-and-evaluation',
});

checkboxEnableTabNavigation.addEventListener('change', () => {
  if (this.checked) {
    handsontableInstance.updateSettings({
      disableTabNavigation: false,
    });
  } else {
    handsontableInstance.updateSettings({
      disableTabNavigation: true,
    });
  }
});

checkboxEnableHeadersNavigation.addEventListener('change', () => {
  if (this.checked) {
    handsontableInstance.updateSettings({
      navigableHeaders: true,
    });
  } else {
    handsontableInstance.updateSettings({
      navigableHeaders: false,
    });
  }
});
```

:::

::: only-for react

::: example #exampleNavigationModes :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const enableTabNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      disableTabNavigation: false,
    });
  };

  const enableHeadersNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      navigableHeaders: true,
    });
  };

  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: true,
        },
      ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      disableTabNavigation="true"
      navigableHeaders="false"
      height={168}
      rowHeaders={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleNavigationModes'));
/* end:skip-in-preview */
```

:::

:::

## Configure keyboard navigation options

You can easily configure various aspects of Handsontable's keyboard navigation. For example, you can enable
[navigation in headers](#enable-navigation-in-headers), change the behavior of the [<kbd>**Tab**</kbd>](#change-the-tab-key-behavior) and
[<kbd>**Enter**</kbd>](#change-the-enter-key-behavior) keys, or enable [jumping over the edges](#enable-jumping-over-the-edges) of the grid.

If you need further customization, you can also [add custom shortcuts](@/guides/navigation/custom-shortcuts.md).

### Enable navigation in headers

By default, you can't navigate [column headers](@/guides/columns/column-header.md) or [row headers](@/guides/rows/row-header.md). To enable this feature, set
[`navigableHeaders`](@/api/options.md#navigableheaders) to `true`.

You can try navigating the headers in the following demo.

::: only-for javascript

::: example #exampleEnableHeadersNavigation --html 1 --js 2

```html
<input type="checkbox" id="enable_headers_navigation" checked>Enable navigation in headers</input>
<br />
<br />
<div id="exampleEnableHeadersNavigation"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleEnableHeadersNavigation');
const checkboxEnableHeadersNavigation = document.querySelector('#enable_headers_navigation');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 168,
  rowHeaders: true,
  navigableHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});

checkboxEnableHeadersNavigation.addEventListener('change', () => {
  if (this.checked) {
    handsontableInstance.updateSettings({
      navigableHeaders: true,
    });
  } else {
    handsontableInstance.updateSettings({
      navigableHeaders: false,
    });
  }
});
```

:::

:::

::: only-for react

::: example #exampleEnableHeadersNavigation :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const enableTabNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      disableTabNavigation: false,
    });
  };

  const disableTabNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      disableTabNavigation: true,
    });
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '13:23 AM',
            inStock: true,
          },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
          },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US',
            },
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        height={168}
        rowHeaders={true}
        navigableHeaders={true}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={enableTabNavigation}>Enable the Tab key navigation</button>
        <br />
        <br />
        <button onClick={disableTabNavigation}>Disable tab key navigation</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleEnableHeadersNavigation'));
/* end:skip-in-preview */
```

:::

:::

### Change the Tab key behavior

By default, you can use <kbd>**Tab**</kbd> and <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> to navigate between cells. To turn off this behavior, set
[`disableTabNavigation`](@/api/options.md#disabletabnavigation) to `true`.

In the following demo, check or uncheck the box, select a cell, and press <kbd>**Tab**</kbd>.

::: only-for javascript

::: example #exampleEnableTabNavigation --html 1 --js 2

```html
<input type="checkbox" id="enable_tab_navigation" checked>Enable the Tab key navigation</input>
<br />
<br />
<div id="exampleEnableTabNavigation"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleEnableTabNavigation');
const checkboxEnableTabNavigation = document.querySelector('#enable_tab_navigation');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 168,
  disableTabNavigation: true,
  licenseKey: 'non-commercial-and-evaluation',
});

checkboxEnableTabNavigation.addEventListener('change', () => {
  if (this.checked) {
    handsontableInstance.updateSettings({
      disableTabNavigation: false,
    });
  } else {
    handsontableInstance.updateSettings({
      disableTabNavigation: true,
    });
  }
});
```

:::

:::

::: only-for react

::: example #exampleEnableTabNavigation :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const enableTabNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      disableTabNavigation: false,
    });
  };

  const disableTabNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      disableTabNavigation: true,
    });
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '13:23 AM',
            inStock: true,
          },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
          },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US',
            },
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        height={168}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={enableTabNavigation}>Enable the Tab key navigation</button>
        <br />
        <br />
        <button onClick={disableTabNavigation}>Disable tab key navigation</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleEnableTabNavigation'));
/* end:skip-in-preview */
```

:::

:::

By default, <kbd>**Tab**</kbd> moves focus to the next cell in the same row. You can change this behavior by setting the [`tabMoves`](@/api/options.md#tabmoves)
option to an object with `row` and `col` properties. For example, to move focus to the next cell in the same column:

::: only-for javascript

```js
const configurationOptions = {
  disableTabNavigation: false, // default setting
  // on pressing Tab, move focus to the next row
  tabMoves: { row: 1, col: 0 },
};
```

:::

::: only-for react

```jsx
<HotTable
  disableTabNavigation={false} // default setting
  // on pressing Tab, move focus to the next row
  tabMoves={{ row: 1, col: 0 }}
/>
```

:::

### Change the Enter key behavior

By default, pressing <kbd>**Enter**</kbd> starts editing the focused cell. To turn off this behavior, set
[`enterBeginsEditing`](@/api/options.md#enterbeginsediting) to `false`.

In the following demo, check or uncheck the box, select a cell, and press <kbd>**Enter**</kbd>.

::: only-for javascript

::: example #exampleChangeEnterBehavior --html 1 --js 2

```html
<input type="checkbox" id="enable_tab_navigation" checked>Enable editing on pressing Enter</input>
<br />
<br />
<div id="exampleChangeEnterBehavior"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleChangeEnterBehavior');
const checkboxEnableTabNavigation = document.querySelector('#enable_tab_navigation');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 168,
  disableTabNavigation: true,
  licenseKey: 'non-commercial-and-evaluation',
});

checkboxEnableTabNavigation.addEventListener('change', () => {
  if (this.checked) {
    handsontableInstance.updateSettings({
      disableTabNavigation: false,
    });
  } else {
    handsontableInstance.updateSettings({
      disableTabNavigation: true,
    });
  }
});
```

:::

:::

::: only-for react

::: example #exampleChangeEnterBehavior :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const enableTabNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      disableTabNavigation: false,
    });
  };

  const disableTabNavigation = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      disableTabNavigation: true,
    });
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '13:23 AM',
            inStock: true,
          },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
          },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US',
            },
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        height={168}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={enableTabNavigation}>Enable editing when pressing Enter</button>
        <br />
        <br />
        <button onClick={disableTabNavigation}>Disable editing when pressing Enter</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleChangeEnterBehavior'));
/* end:skip-in-preview */
```

:::

:::

By default, when exiting the cell editor, <kbd>**Enter**</kbd> moves focus to the next cell in the same row. You can change this behavior by setting
[`enterMoves`](@/api/options.md#entermoves) to an object with `row` and `col` properties. For example:

::: only-for javascript

```js
const configurationOptions = {
  // don't move focus when pressing Enter
  enterMoves: { col: 0, row: 0 },
};
```

:::

::: only-for react

```jsx
<HotTable
  // on pressing Enter, move selection 1 column right and 1 row down
  // on pressing Shift+Enter, move selection 1 column left and 1 row up
  enterMoves={{ col: 1, row: 1 }},
/>
```

:::

### Enable jumping over the edges

By default, when you navigate with the keyboard, you can't cross the edges of the grid. To enable jumping over the edges to the next or previous column/row, set
[`autoWrapCol`](@/api/options.md#autowrapcol) (or [`autoWrapRow`](@/api/options.md#autowraprow), respectively) to `true`.

::: only-for javascript

::: example #exampleAutoWrapCol --html 1 --js 2

```html
<input type="checkbox" id="enable_autowrapcol">Enable jumping over the top and bottom edges</input>
<br />
<input type="checkbox" id="enable_autowraprow">Enable jumping over the left and right edges</input>
<br />
<br />
<div id="exampleAutoWrapCol"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleAutoWrapCol');
const checkboxEnableAutoWrapCol = document.querySelector('#enable_autowrapcol');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 168,
  navigableHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});

checkboxEnableAutoWrapCol.addEventListener('change', () => {
  if (this.checked) {
    handsontableInstance.updateSettings({
      autoWrapCol: true,
    });
  } else {
    handsontableInstance.updateSettings({
      autoWrapCol: false,
    });
  }
});
```

:::

:::

::: only-for react

::: example #exampleAutoWrapCol :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const enableAutoWrapCol = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      autoWrapCol: true,
    });
  };

  const disableAutoWrapCol = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    handsontableInstance.updateSettings({
      autoWrapCol: false,
    });
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '13:23 AM',
            inStock: true,
          },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
          },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US',
            },
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        height={168}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={enableAutoWrapCol}>Enable the Tab key navigation</button>
        <br />
        <br />
        <button onClick={disableAutoWrapCol}>Disable tab key navigation</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleAutoWrapCol'));
/* end:skip-in-preview */
```

:::

:::

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks.md)
related to keyboard navigation, see the following API reference pages:

- [`autoWrapCol`](@/api/options.md#autowrapcol)
- [`autoWrapRow`](@/api/options.md#autowraprow)
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
- [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
- [`navigableHeaders`](@/api/options.md#navigableheaders)
- [`tabMoves`](@/api/options.md#tabmoves)

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/issues) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
