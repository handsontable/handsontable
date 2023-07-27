---
id: o4qhm1bg
title: Accessibility
metaTitle: Accessibility - JavaScript Data Grid | Handsontable
description: Learn about Handsontable's accessibility features.
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

Learn about Handsontable's accessibility features.

[[toc]]

## Overview

We believe in a web that's available to everyone. That's why we designed our data grid to be used by people with disabilities, including those who use assistive
technologies like screen readers or keyboard navigation.

Ensuring a high level of accessibility by default, Handsontable's built-in features include:

- Intuitive [keyboard navigation](@/guides/navigation/keyboard-navigation.md) that lets you access any feature without using a mouse,
- Transparent HTML structure following best accessibility practices,
- [WAI-ARIA](#wai-aria-roles) roles and attributes that complement HTML where needed,
- Support for the most popular [screen readers](#supported-screen-readers),
- Compliance with the most important accessibility [standards and regulations](#accessibility-compliance),
- A set of configurable [accessibility options](#accessibility-configuration).

That said, there's no universal accessibility standard for spreadsheets, and such standards for data grids are incomplete. Also, the number of Handsontable's
use case scenarios is huge and each implementation is different. That's why we don't make any assumptions about how you'll use Handsontable. Instead, we give
you a set of [options](#accessibility-configuration) that you can configure to better match your users' accessibility needs.

### Accessibility demo

::: only-for javascript

::: example #exampleA11y --html 1 --js 2

```html
<input type="checkbox" id="enable_tab_navigation">Enable the Tab key navigation</input>
<input type="checkbox" id="enable_ime_fast_edit">Enable navigation in headers</input>
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
const checkboxEnableHeadersNavigation = document.querySelector('#enable_ime_fast_edit');
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

- We cover the most common use cases with automated unit and end-to-end tests.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated visual regression testing.
- We check Handsontable's accessibility score with a range of the most popular accessibility testing tools, such as Lighthouse, Axe-core, or Accessibility
  Insights for Web.

### Keyboard navigation

Out of the box, you can easily use all of Handsontable's features with just your keyboard. You can also configure specific aspects of keyboard navigation, and
add custom shortcuts. Learn more in the following sections:

- [Keyboard navigation](@/guides/navigation/keyboard-navigation.md)
- [Configure keyboard navigation options](@/guides/navigation/keyboard-navigation.md#configure-keyboard-navigation-options)
- [Default keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md)
- [Custom shortcuts](@/guides/navigation/custom-shortcuts.md)

### Supported screen readers

To meet the needs of visually impaired users, Handsontable supports two of the world's most popular screen readers:

- **JAWS** (Job Access With Speech)
- **NVDA** (NonVisual Desktop Access)

### Accessibility and customization

Being a JavaScript component, Handsontable is infinitely customizable. You can completely change the look and feel of the grid, add
[custom cell types](@/guides/cell-types/cell-type.md), or create your own plugins, features, and integrations. However, when you customize Handsontable, it's
you who's responsible for ensuring the accessibility of your solution.

Whatever your customization, we always recommend that you:

- Follow [best web accessibility practices](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/CSS_and_JavaScript),
- Use proper color contrast, font size, and semantic HTML tags,
- Implement additional WAI-ARIA attributes if needed,
- Avoid flashing or blinking content,
- Test your customizations with real users who have different types of disabilities.

The accessibility level of any component in your application may be decreased by a low accessibility level of its parent elements. For this reason, make sure to
always check the accessibility of the entire page, using tools such as [Lighthouse](https://github.com/GoogleChrome/lighthouse).

## Accessibility configuration

You can easily configure Handsontable's accessibility features to better match your users' needs. For example, you can change Handsontable's
[keyboard navigation](#configure-keyboard-navigation) behavior, disable [virtual rendering](#configure-virtualization), configure
[IME fast-editing](#configure-fast-editing-with-imes), and [style your grid](#create-a-high-contrast-theme) for the required color contrast, font size or other
accessibility requirements.

On top of that, you can always [customize Handsontable](#accessibility-and-customization) to meet the specific accessibility needs of your user base.

### Set the grid's height explicitly

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

### Configure keyboard navigation

You can easily configure various aspects of Handsontable's keyboard navigation. For details, see the following sections:

- [Navigate Handsontable like a spreadsheet or like a data grid](@/guides/navigation/keyboard-navigation.md#navigation-modes),
- [Enable navigation in headers](@/guides/navigation/keyboard-navigation.md#enable-navigation-in-headers),
- [Change the Tab key behavior](@/guides/navigation/keyboard-navigation.md#change-the-tab-key-behavior),
- [Change the Enter key behavior](@/guides/navigation/keyboard-navigation.md#change-the-enter-key-behavior),
- [Enable jumping over the edges of the grid](@/guides/navigation/keyboard-navigation.md#enable-jumping-over-the-edges),
- [Add custom shortcuts](@/guides/navigation/custom-shortcuts.md).

### Configure virtualization

By default, Handsontable renders only those parts of the grid that are currently visible. This feature, called
[row virtualization](@/guides/rows/row-virtualization.md) and [column virtualization](@/guides/columns/column-virtualization.md), is great for
[performance](@/guides/optimization/performance.md#define-the-number-of-pre-rendered-rows-and-columns), but may have a negative impact on accessibility.

For example, if only the visible rows are rendered, screen readers may announce the wrong total number of rows in the grid. To avoid this, you can configure
Handsontable to render all rows at once, regardless of their number, however, remember that this may have a negative impact on performance, especially with very
large data sets.

To always render all rows, set the [`renderAllRows`](@/api/options.md#renderallrows) option to `true`:

::: only-for javascript

```js
const configurationOptions = {
  // disable row virtualization
  renderAllRows: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // disable row virtualization
  renderAllRows={true}
/>
```

:::

To always render all columns, set the [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) option to `0`:

::: only-for javascript

```js
const configurationOptions = {
  // disable column virtualization
  viewportColumnRenderingOffset: 0,
};
```

:::

::: only-for react

```jsx
<HotTable
  // disable column virtualization
  viewportColumnRenderingOffset={0}
/>
```

:::

For more details, see the [Row virtualization](@/guides/rows/row-virtualization.md) and [Column virtualization](@/guides/columns/column-virtualization.md)
guides.

### Configure fast editing with IMEs

To start editing a focused cell, you can simply start typing – we call this feature "fast editing". However, when you're using an
[Input Method Editor](@/guides/internationalization/ime-support.md) (IME), fast editing is disabled: you need to press <kbd>**Enter**</kbd> or <kbd>**F2**</kbd>
first. This configuration ensures better accessibility by default, as screen readers may have problems reading the contents of the edited cell when you're using
an IME.

To enable fast editing with IMEs, set the [`imeFastEdit`](@/api/options.md#imefastedit) option to `true`. However, remember that this may have a negative impact
on accessibility.

To see the difference in the following demo, make sure that your keyboard is set to a language that uses an IME (e.g. Japanese), and try editing a cell:

::: only-for javascript

::: example #exampleImeFastEdit --html 1 --js 2

```html
<input type="checkbox" id="enable_ime_fast_edit">Enable fast editing with IMEs</input>
<br />
<br />
<div id="exampleImeFastEdit"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleImeFastEdit');
const checkboxEnableHeadersNavigation = document.querySelector('#enable_ime_fast_edit');
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

::: example #exampleImeFastEdit :react

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
ReactDOM.render(<App />, document.getElementById('exampleImeFastEdit'));
/* end:skip-in-preview */
```

:::

:::

### Create a high-contrast theme

At the moment, Handsontable doesn't feature a high-contrast theme out of the box. However, you can easily create your own theme by overriding
[Handsontable's default CSS](https://github.com/handsontable/handsontable/blob/master/handsontable/dist/handsontable.css).

To ensure sufficient color contrast, we recommend using Chrome DevTools and dedicated accessibility tools such as
[Colorblindly](https://chrome.google.com/webstore/detail/colorblindly/floniaahmccleoclneebhhmnjgdfijgg) or
[Kontrast](https://chrome.google.com/webstore/detail/kontrast-wcag-contrast-ch/haphaaenepedkjngghandlmhfillnhjk).

## WAI-ARIA roles

[WAI-ARIA](https://www.w3.org/TR/wai-aria-roles-1.1/) (Web Accessibility Initiative - Accessible Rich Internet Applications) is a W3C specification that defines
additional HTML attributes, helping make web applications more compatible with assistive technologies such as screen readers.

Sticking to the [First Rule of ARIA Use](https://www.w3.org/TR/using-aria/#rule1), Handsontable uses WAI-ARIA attributes only when necessary. Handsontable is
based on the HTML `<table>` element, so assistive technologies already interpret most of its structure properly.

The following sections list all [WAI-ARIA roles](https://www.w3.org/TR/wai-aria-1.1/#usage_intro) used on the different levels of Handsontable's structure: the
page, the main component (the grid), and subcomponents (such as the [column menu](@/guides/columns/column-menu.md) or the
[date picker](@/guides/cell-types/date-cell-type.md)).

### Page-level ARIA role

why - VoiceOver + nested rows setting if passed as a function

`role="treegrid"`

For example:

```html
<div id="hot" dir="ltr" role="treegrid"></div>
```

### Component-level ARIA roles

| Elements                                                                | WAI-ARIA role         |
| ----------------------------------------------------------------------- | --------------------- |
| All `handsontable`, `wtHolder`, `wtSpreader`, `wtHider`, `table.htCore` | `role="presentation"` |
| All `.htCore tr`                                                        | `role="row"`          |
| All `.htCore td`                                                        | `role="gridcell"`     |
| All `.htCore th` in `.ht_master`                                        | `role="columngroup"`  |
| All `.htCore tbody` and `thead`                                         | `role="rowgroup"`     |

### Subcomponent ARIA roles

- Context menu
- Column menu and filters
- Built-in cell types:
  - Text
  - Numeric
  - Date
  - Time
  - Checkbox
  - Select
  - Dropdown
  - Autocomplete
  - Password
- Custom cell types
  - A developer creating custom cell types is responsible for the accessibility, mainly using native (generic and proper) HTML elements to render the contents;
    testing it and enriching with WAI-ARIA attributes whenever required.
- Search field
  - https://handsontable.com/docs/react-data-grid/searching-values/
- Dynamic ARIA tags
  - ARIA are dynamic in some cases: e.g. sorting data, read-only cells, loading data (busy-state), etc.

## Known limitations

As of July 2023, Handsontable's accessibility features come with the following limitations:

- We're still working on a built-in high-contrast theme. For now, you can create your own theme by
  [overriding Handsontable's CSS](@/guides/accessibility/accessibility.md#create-a-high-contrast-theme).
- We don't test Handsontable against all available screen readers, such as VoiceOver (macOS) or TalkBack (Android). We focus on the most popular ones: JAWS and
  NVDA.
- NVDA and VoiceOver don't support [IME fast editing](@/guides/accessibility/accessibility.md#configure-fast-editing-with-imes).
- VoiceOver may announce the wrong number of rows and columns in the grid.

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks.md)
related to accessibility, see the following API reference pages:

- [`autoWrapCol`](@/api/options.md#autowrapcol)
- [`autoWrapRow`](@/api/options.md#autowraprow)
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
- [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
- [`navigableHeaders`](@/api/options.md#navigableheaders)
- [`renderAllRows`](@/api/options.md#renderallrows)
- [`tabMoves`](@/api/options.md#tabmoves)
- [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
- [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/labels/Accessibility) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
