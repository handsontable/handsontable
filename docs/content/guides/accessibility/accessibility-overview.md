---
id: o4qhm1bg
title: Accessibility overview
metaTitle: Accessibility overview - JavaScript Data Grid | Handsontable
description: Learn about our approach to accessibility, and get an overview of Handsontable's accessibility features.
permalink: /accessibility-overview
canonicalUrl: /accessibility-overview
tags:
  - accessibility
  - a11y
  - aria
  - jaws
  - nvda
  - voiceover
react:
  id: x82phf34
  metaTitle: Accessibility overview - React Data Grid | Handsontable
searchCategory: Guides
---

# Accessibility overview

Learn about our approach to accessibility, and get an overview of Handsontable's accessibility features.

[[toc]]

## Overview

We believe in a web that's available to everyone. That's why we designed our data grid to be used by people with disabilities, including those who use assistive
technologies like screen readers or keyboard navigation.

Ensuring a high level of accessibility by default, Handsontable's built-in features include:

- Intuitive [keyboard navigation](#keyboard-navigation) that lets you access any feature without using a mouse.
- Transparent HTML structure following best accessibility practices.
- ARIA attributes that complement HTML where needed.
- Support for the most popular [screen readers](#supported-screen-readers).
- Compliance with the most important [accessibility standards](#accessibility-compliance).

In the case of data grids and spreadsheet components, there's no universal accessibility standard. Depending on your use case, industry or location, your
application may need to meet different accessibility requirements. With that in mind, we prepared a set of accessibility options that you can configure to meet
the exact needs of your users. By using Handsontable's configuration options, you can easily:

- [Enable tab navigation](@/guides/accessibility/accessibility-configuration.md#enable-tab-navigation),
- [Enable navigation in headers](@/guides/accessibility/accessibility-configuration.md#enable-navigation-in-headers),
- [Configure virtual rendering options](@/guides/accessibility/accessibility-configuration.md#disable-virtual-rendering),
- [Configure IME fast-editing](@/guides/accessibility/accessibility-configuration.md#ime-fast-editing),
- [Style your grid](@/guides/accessibility/accessibility-configuration.md#styling-for-accessibility) for the required color contrast, font size, and other
  accessibility requirements.

## Accessibility demo

::: only-for javascript

::: example #exampleA11y --html 1 --js 2

```html
<input type="checkbox" id="enable_tab_navigation">Enable tab navigation</input>
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
    <>
    <input type="checkbox" id="enable_tab_navigation" onChange={enableTabNavigation}>Enable tab navigation</input>
    <input type="checkbox" id="enable_headers_navigation" onChange={enableHeadersNavigation}>Enable navigation in headers</input>
    <br />
    <br />
    <input type="text" id="navigable_test_input_1" placeholder="Navigable test input"/>
    <br />
    <br />
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
    <input type="text" id="navigable_test_input_2" placeholder="Navigable test input"/>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleA11y'));
/* end:skip-in-preview */
```

:::

:::

## Supported screen readers

To meet the needs of visually impaired users, Handsontable supports the world's most popular screen readers:

- **JAWS** (Job Access With Speech) is one of the most widely used screen readers for Windows. It provides speech and Braille output. [how compatible is HoT
  with JAWS?]
- **NVDA** (NonVisual Desktop Access) is a popular open-source screen reader for Windows. [how compatible is HoT with NVDA?]
- **VoiceOver** is the default screen reader of macOS. [how compatible is HoT with VoiceOver?]

## Keyboard navigation

You can navigate Handsontable with the keyboard alone, easily change navigation options, use more advanced shortcuts, or add shortcuts of your own. Learn more:

- [Use keyboard navigation](@/guides/accessibility/keyboard-navigation.md)
- [Configure keyboard navigation options](@/guides/accessibility/keyboard-navigation.md#configure-keyboard-navigation-options)
- [Use default keyboard shortcuts](@/guides/accessories-and-menus/keyboard-shortcuts.md#default-keyboard-shortcuts)
- [Add custom keyboard shortcuts](@/guides/accessories-and-menus/keyboard-shortcuts.md#custom-keyboard-shortcuts)

## Accessibility testing

Before releasing a new version of Handsontable, we carefully test it for accessibility, using a combination of different approaches:

- We cover the most common use cases with automated tests.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated visual regression testing.
- We check Handsontable's accessibility score with a range of the most popular accessibility testing tools, such as Lighthouse, Axe-core, or Accessibility
  Insights for Web.

Learn more at [Testing](@/guides/tools-and-building/testing.md).

## Accessibility compliance

Handsontable is compliant with the following accessibility standards:

- WCAG 2.1 (AA)
- Section 508 of the Rehabilitation Act
- The Americans with Disabilities Act (ADA)

Learn more at [Accessibility compliance](@/guides/accessibility/accessibility-compliance.md).

## Accessibility and customization

As a JavaScript component, Handsontable is highly customizable. You can completely change the look and feel of the grid, add custom cell types, or create your
own plugins, features, and integrations. However, when you customize Handsontable, it's you who's responsible for ensuring the accessibility of your solution.

Whatever your customization, we always recommend that you:

- Follow best web accessibility practices,
- Use proper color contrast, font size, and semantic HTML tags,
- Implement ARIA attributes if needed,
- Avoid flashing or blinking content,
- Test your customizations with real users who have different types of disabilities.

## Known limitations

At the moment, Handsontable's accessibility features come with the following limitations:

- There's no built-in high-contrast theme. To create it, you need to
  [override Handsontable's CSS](@/guides/accessibility/accessibility-configuration.md#styling-for-accessibility).
- We don't test Handsontable against all available screen readers. We focus on the most popular ones: JAWS, NVDA, and VoiceOver.
- NVDA and VoiceOver don't support [IME fast editing](@/guides/accessibility/accessibility-configuration.md#ime-fast-editing).
