---
id: o4qhm1bg
title: Accessibility
metaTitle: Accessibility - JavaScript Data Grid | Handsontable
description: Learn about our approach to accessibility, and get an overview of Handsontable's accessibility features.
permalink: /accessibility
canonicalUrl: /accessibility
tags:
  - accessibility
  - a11y
  - aria
  - jaws
  - nvda
  - voiceover
  - wcag
  - section 508
  - ada
  - compliance
  - vpat
  - acr
react:
  id: x82phf34
  metaTitle: Accessibility - React Data Grid | Handsontable
searchCategory: Guides
---

# Accessibility

Learn about our approach to accessibility, and get an overview of Handsontable's accessibility features.

[[toc]]

## Overview

We believe in a web that's available to everyone. That's why we designed our data grid to be used by people with disabilities, including those who use assistive
technologies like screen readers or keyboard navigation.

Ensuring a high level of accessibility by default, Handsontable's built-in features include:

- Intuitive [keyboard navigation](#keyboard-navigation) that lets you access any feature without using a mouse.
- Transparent HTML structure following best accessibility practices.
- [ARIA attributes](#aria-attributes) that complement HTML where needed.
- Support for the most popular [screen readers](#supported-screen-readers).
- Compliance with the most important [accessibility standards](#accessibility).

Navigation modes (about our general approach towards different a11y settings within Handsontable)

- Our approach - different behavior depending on the context and business case (spreadsheet vs data grid)
- Handsontable requires to be adjusted (configure or customized) for each particular use case, as we don't assume anything upfront (how he grid will be used
  etc.), and there are not standards for spreadsheets; even for complex data grid the standards are incomplete.

### Accessibility demo

::: only-for javascript

::: example #exampleA11y --html 1 --js 2

```html
<input type="checkbox" id="enable_tab_navigation">Enable the tab key navigation</input>
<input type="checkbox" id="enable_headers_navigation">Enable navigation in headers</input>
<br />
<br />
<input type="text" id=navigable_test_input_1 placeholder="Navigable test input"/>
<br />
<br />
<div id="exampleA11y"></div>
<input type="text" id=navigable_test_input_2 placeholder="Navigable test input"/>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleA11y');
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

:::

::: only-for react

::: example #exampleA11y :react

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
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleA11y'));
/* end:skip-in-preview */
```

:::

:::

### Accessibility compliance

Handsontable complies with the following accessibility standards and regulations:

| Standard or regulation                                                                                      | Details                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)                            | Level AA<br>[Handsontable's Accessibility Statement](https://handsontable.com/accessibility-statement) |
| [Section 508 of the Rehabilitation Act](https://www.section508.gov/)                                        | [Handsontable's Accessibility Conformance Report](pdf-placeholder) (ACR, also referred to as VPAT)     |
| [Americans with Disabilities Act (ADA)](https://www.ada.gov/)                                               |                                                                                                        |
| [EU Web Accessibility Directive](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016L2102) |                                                                                                        |

### Accessibility testing

Before releasing a new version of Handsontable, we carefully test it for accessibility, using a combination of different approaches:

- We cover the most common use cases with automated tests.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated visual regression testing.
- We check Handsontable's accessibility score with a range of the most popular accessibility testing tools, such as Lighthouse, Axe-core, or Accessibility
  Insights for Web.

### Keyboard navigation

You can navigate Handsontable with the keyboard alone, easily change navigation options, use more advanced shortcuts, or add shortcuts of your own. Learn more:

- [Use keyboard navigation](@/guides/navigation/keyboard-navigation.md)
- [Configure keyboard navigation options](@/guides/navigation/keyboard-navigation.md#configure-keyboard-navigation-options)
- [Use default keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md#default-keyboard-shortcuts)
- [Add custom keyboard shortcuts](@/guides/navigation/custom-shortcuts.md)

### Supported screen readers

To meet the needs of visually impaired users, Handsontable supports two of the world's most popular screen readers:

- **JAWS** (Job Access With Speech)
- **NVDA** (NonVisual Desktop Access)

### ARIA attributes

table

### Accessibility and customization

Being a JavaScript component, Handsontable is infinitely customizable. You can completely change the look and feel of the grid, add custom cell types, or create your
own plugins, features, and integrations. However, when you customize Handsontable, it's you who's responsible for ensuring the accessibility of your solution.

Whatever your customization, we always recommend that you:

- Follow best web accessibility practices,
- Use proper color contrast, font size, and semantic HTML tags,
- Implement ARIA attributes if needed,
- Avoid flashing or blinking content,
- Test your customizations with real users who have different types of disabilities.

## Accessibility configuration

Configure your grid for better compatibility with screen readers, and adjust other accessibility options.

### Enable the tab key navigation

By default, you can use <kbd>**Tab**</kbd> and <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> to navigate between cells. To turn off this behavior, set
[`disableTabNavigation`](@/api/options.md#disabletabnavigation) to `true`.

::: only-for javascript

::: example #exampleEnableTabNavigation --html 1 --js 2

```html
<input type="checkbox" id="enable_tab_navigation">Enable the tab key navigation</input>
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
        <button onClick={enableTabNavigation}>Enable the tab key navigation</button>
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

### Enable navigation in headers

By default, you can't navigate [column headers](@/guides/columns/column-header.md) or [row headers](@/guides/rows/row-header.md). To change it, set
[`navigableHeaders`](@/api/options.md#navigableheaders) to `true`.

::: only-for javascript

::: example #exampleEnableHeadersNavigation --html 1 --js 2

```html
<input type="checkbox" id="enable_headers_navigation">Enable navigation in headers</input>
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
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={enableTabNavigation}>Enable the tab key navigation</button>
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

### Disable virtual rendering

TBD

### IME fast editing

TBD

- Demo that showcases the `imeFastEdit` option (TBD) [#10342](https://github.com/handsontable/handsontable/pull/10342)
- IME fast edit works only with JAWS

### Set the grid's height explicitly

TBD

::: only-for javascript

For a better keyboard navigation experience, we recommend setting the [grid's height](@/guides/getting-started/grid-size.md) explicitly, rather than using
`height: 'auto'`.

```js
const configurationOptions = {
  // set the grid's height explicitly
  height: 168,
};
```

:::

::: only-for react

For a better keyboard navigation experience, we recommend setting the [grid's height](@/guides/getting-started/grid-size.md) explicitly, rather than using
`height="auto"`.

```jsx
<HotTable
  // set the grid's height explicitly
  height={168}
/>
```

:::

### Styling for accessibility

At the moment, Handsontable doesn't feature a high-contrast theme out of the box. However, you can easily create your own theme by overriding the default
Handsontable styles.

Whatever your styling choices are, we recommend that you:

- Follow best web accessibility practices,
- Use proper color contrast, font size, and semantic HTML tags,
- Avoid flashing or blinking content,
- Test your customizations with real users who have different types of disabilities.

## Known limitations

At the moment, Handsontable's accessibility features come with the following limitations:

- There's no built-in high-contrast theme. To create it, you need to
  [override Handsontable's CSS](@/guides/accessibility/accessibility.md#styling-for-accessibility).
- We don't test Handsontable against all available screen readers, such as VoiceOver or TalkBack. We focus on the most popular ones: JAWS and NVDA.
- NVDA and VoiceOver don't support [IME fast editing](@/guides/accessibility/accessibility.md#ime-fast-editing).
