---
id: 6qwoo503
title: Keyboard navigation
metaTitle: Keyboard navigation - JavaScript Data Grid | Handsontable
description: Navigate the grid with the keyboard alone. Use the navigation options to meet the accessibility needs of your users.
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

Navigate the grid with the keyboard alone, and change the navigation options to meet your users' accessibility needs.

[[toc]]

## Overview

You can easily access all of Handsontable's features without using a mouse. This is especially useful for people with disabilities who rely on keyboard
navigation.

Keyboard navigation works out of the box and follows international standards. Navigating the grid takes a few simple keystrokes: you can try it out in the
[demo](#default-keyboard-navigation) below. You can also fine-tune its behavior by using the navigation [options](#configure-keyboard-navigation-options).

For more advanced actions, see the [list of all built-in shortcuts](@/guides/accessories-and-menus/keyboard-shortcuts.md#default-keyboard-shortcuts), or add
shortcuts of [your own](@/guides/accessories-and-menus/keyboard-shortcuts.md#custom-keyboard-shortcuts).

## Default keyboard navigation

By default, you can navigate Handsontable in the following way:

- Use the arrow keys to move one cell up, down, left, or right.
- Press <kbd>**Tab**</kbd> to move one cell to the right, and <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> to move one cell to the left.
- Press <kbd>**Enter**</kbd> to start editing the active cell.
- For more advanced actions, see the [list of all built-in shortcuts](@/guides/accessories-and-menus/keyboard-shortcuts.md#default-keyboard-shortcuts).

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

## Configure keyboard navigation options

A single demo with all navigation options:

[To do: change buttons into switch buttons]

- `disableTabNavigation`
- `navigableHeaders`
- `tabMoves`
- `enterMoves`
- `enterBeginsEditing`

::: only-for javascript

::: example #exampleNavigationOptions --html 1 --js 2

```html
<div id="exampleNavigationOptions"></div>

<div class="controls">
  <button id="enable_tab_navigation" class="button">Enable tab navigation</button>
  <button id="disable_tab_navigation" class="button">Disable tab navigation</button>
  <br />
  <br />
  <button id="enable_enter_navigation" class="button">Enable enter navigation</button>
  <button id="disable_enter_navigation" class="button">Disable enter navigation</button>
  <br />
  <br />
  <button id="enable_headers_navigation" class="button">Enable navigation in headers</button>
  <button id="disable_headers_navigation" class="button">Disable navigation in headers</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleNavigationOptions');
const buttonEnableTabNavigation = document.querySelector('#enable_tab_navigation');
const buttonDisableTabNavigation = document.querySelector('#disable_tab_navigation');
const buttonEnableEnterNavigation = document.querySelector('#enable_enter_navigation');
const buttonDisableEnterNavigation = document.querySelector('#disable_enter_navigation');
const buttonEnableHeadersNavigation = document.querySelector('#enable_headers_navigation');
const buttonDisableHeadersNavigation = document.querySelector('#disable_headers_navigation');
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

buttonEnableTabNavigation.addEventListener('click', () => {
  handsontableInstance.updateSettings({
    disableTabNavigation: false,
  });
});

buttonDisableTabNavigation.addEventListener('click', () => {
  handsontableInstance.updateSettings({
    disableTabNavigation: true,
  });
});

buttonEnableEnterNavigation.addEventListener('click', () => {
  handsontableInstance.updateSettings({
    enterBeginsEditing: false,
  });
});

buttonDisableEnterNavigation.addEventListener('click', () => {
  handsontableInstance.updateSettings({
    enterBeginsEditing: true,
  });
});

buttonEnableHeadersNavigation.addEventListener('click', () => {
  handsontableInstance.updateSettings({
    navigableHeaders: true,
  });
});

buttonDisableHeadersNavigation.addEventListener('click', () => {
  handsontableInstance.updateSettings({
    navigableHeaders: false,
  });
});
```

:::

:::

::: only-for react

::: example #exampleNavigationOptions :react

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
        <button onClick={enableTabNavigation}>Enable tab navigation</button>
        <br />
        <br />
        <button onClick={disableTabNavigation}>Disable tab navigation</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleNavigationOptions'));
/* end:skip-in-preview */
```

:::

:::

## Related API reference

Configuration options:

- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
- [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
- [`navigableHeaders`](@/api/options.md#navigableheaders)
- [`tabMoves`](@/api/options.md#tabmoves)
