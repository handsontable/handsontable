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

- Intuitive [keyboard navigation](@/guides/navigation/keyboard-navigation.md) that lets you access any feature without using a mouse.
- Transparent HTML structure following best accessibility practices.
- [ARIA attributes](#aria-attributes) that complement HTML where needed.
- Support for the most popular [screen readers](#supported-screen-readers).
- Compliance with the most important accessibility [standards and regulations](#accessibility-compliance).
- A set of configurable [accessibility options](#accessibility-configuration).

That said, there's no universal accessibility standard for spreadsheets, and such standards for data grids are incomplete. Also, the number of Handsontable's
use case scenarios is huge and each implementation is different. That's why we don't make any assumptions about how you'll use Handsontable. Instead, we give
you a set of [options](#accessibility-configuration) that you can configure to better match your users' accessibility needs.

### Accessibility demo

::: only-for javascript

::: example #exampleA11y --html 1 --js 2

```html
<input type="checkbox" id="enable_tab_navigation">Enable the Tab key navigation</input>
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
- [Default keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md#default-keyboard-shortcuts)
- [Custom shortcuts](@/guides/navigation/custom-shortcuts.md)

### Supported screen readers

To meet the needs of visually impaired users, Handsontable supports two of the world's most popular screen readers:

- **JAWS** (Job Access With Speech)
- **NVDA** (NonVisual Desktop Access)

### ARIA attributes

TBD

- WAI-ARIA attributes
- Handsontable is based on the HTML table element so some of its structure is properly interpreted properly by screen readers and other assistive solutions.
  Mention that we put WAI-ARIA whenever needed.
- WAI-ARIA roles (the idea is to mention only ROLES, nothing else - this is also to show the complexity of the grid; and that the grid contains subcomponents
  (like date picker) that require their own roles)
  - Main component
    - Tree grid (and why - VoiceOver + nested rows setting if passed as a function)
  - Subcomponents
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
      - A developer creating custom cell types is responsible for the accessibility, mainly using native (generic and proper) HTML elements to render the
        contents; testing it and enriching with WAI-ARIA attributes whenever required.
    - Search field
      - https://handsontable.com/docs/react-data-grid/searching-values/
- Dynamic ARIA tags
  - ARIA are dynamic in some cases: e.g. sorting data, read-only cells, loading data (busy-state), etc.

## Accessibility configuration

You can easily configure Handsontable's accessibility features to better match your users' needs. For example, you can change Handsontable's
[keyboard navigation](#configure-the-keyboard-navigation) behavior, disable [virtual rendering](#disable-virtual-rendering), configure
[IME fast-editing](#ime-fast-editing), and [style your grid](#create-a-high-contrast-theme) for the required color contrast, font size or other accessibility
requirements.

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

### Configure the keyboard navigation

You can easily configure various aspects of Handsontable's keyboard navigation. For details, see the following sections:

- [Navigate Handsontable like a spreadsheet or like a data grid](@/guides/navigation/keyboard-navigation.md#navigation-modes),
- [Enable navigation in headers](@/guides/navigation/keyboard-navigation.md#enable-navigation-in-headers),
- [Change the Tab key behavior](@/guides/navigation/keyboard-navigation.md#change-the-tab-key-behavior),
- [Change the Enter key behavior](@/guides/navigation/keyboard-navigation.md#change-the-enter-key-behavior),
- [Enable jumping over the edges of the grid](@/guides/navigation/keyboard-navigation.md#enable-jumping-over-the-edges),
- [Add custom shortcuts](@/guides/navigation/custom-shortcuts.md).

### Disable virtual rendering

TBD

- for rows: renderAllRows: true or with https://handsontable.com/docs/react-data-grid/api/options/#viewportrowrenderingoffset
- for columns: set offset (https://handsontable.com/docs/react-data-grid/api/options/#viewportcolumnrenderingoffset)
- Ask Adrian / Jan to help you create a setting that fetches the numer of rows and columns initially loaded to the grid and renders them all.
- Warn users that this has its negative consequences (performance)
- Explain users why it's sometimes useful to do that (number of rows and cols properly announced but also working native browser search feature CTRL/CMD+F)

### IME fast editing

TBD

- Demo that showcases the `imeFastEdit` option [#10342](https://github.com/handsontable/handsontable/pull/10342)
- IME fast edit works only with JAWS

### Create a high-contrast theme

At the moment, Handsontable doesn't feature a high-contrast theme out of the box. However, you can easily create your own theme by overriding the default
Handsontable styles.

Whatever your styling choices are, we recommend that you:

- Follow best web accessibility practices,
- Use proper color contrast, font size, and semantic HTML tags,
- Avoid flashing or blinking content,
- Test your customizations with real users who have different types of disabilities.

- Color and contrast
- The default theme is required to be overrriden, e.g. to achieve high-contrast theme, or any other that is anticipated by users.
- We don't assume any particular sight disabilities, and we recommend using dedicated tools like Colorblindly.
- As a developer you can make ensure about background/foreground contrast of rendered elements e.g. with Chrome DevTools or plugins such as
  [Kontrast](https://chrome.google.com/webstore/detail/kontrast-wcag-contrast-ch/haphaaenepedkjngghandlmhfillnhjk)

### Accessibility and customization

Being a JavaScript component, Handsontable is infinitely customizable. You can completely change the look and feel of the grid, add
[custom cell types](@/guides/cell-types/cell-type.md), or create your own plugins, features, and integrations. However, when you customize Handsontable, it's
you who's responsible for ensuring the accessibility of your solution.

Whatever your customization, we always recommend that you:

- Follow [best web accessibility practices](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/CSS_and_JavaScript),
- Use proper color contrast, font size, and semantic HTML tags,
- Implement ARIA attributes if needed,
- Avoid flashing or blinking content,
- Test your customizations with real users who have different types of disabilities.

The accessibility level of any component in your application may be decreased by a low accessibility level of its parent elements. For this reason, make sure to
always check the accessibility of the entire page, using tools such as [Lighthouse](https://github.com/GoogleChrome/lighthouse).

## Known limitations

As of July 2023, Handsontable's accessibility features come with the following limitations:

- We're still working on a built-in high-contrast theme. For now, you can create your own theme by
  [overriding Handsontable's CSS](@/guides/accessibility/accessibility.md#create-a-high-contrast-theme).
- We don't test Handsontable against all available screen readers, such as VoiceOver (macOS) or TalkBack (Android). We focus on the most popular ones: JAWS and
  NVDA.
- NVDA and VoiceOver don't support [IME fast editing](@/guides/accessibility/accessibility.md#ime-fast-editing).
- VoiceOver may announce wrong numbers of rows and columns in the grid.

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks.md)
related to accessibility, see the following API reference pages:

- [`autoWrapCol`](@/api/options.md#autowrapcol)
- [`autoWrapRow`](@/api/options.md#autowraprow)
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
- [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
- [`navigableHeaders`](@/api/options.md#navigableheaders)
- [`tabMoves`](@/api/options.md#tabmoves)

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/labels/Accessibility) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
