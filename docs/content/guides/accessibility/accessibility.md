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

Handsontable has complete accessibility support, incorporating built-in keyboard navigation that aligns with international standards.

[[toc]]

## Overview

We advocate for a universally accessible web. With this vision, we've designed Handsontable to be fully accessible to individuals with disabilities, emphasizing our commitment to inclusive design and ensuring that web applications cater to all users. 

## Conformance with Standards
Standard regulations laid out by different jurisdictions such as European Union or the US, are inline with WCAG. WCAG is a guidelines set maintained by World Wide Web Consortium (W3C). By meeting the requirements of [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) at level AA, Handsontable provides conformance with W3C standards. A list of policies related to web accessibility under different jurisdictions is available [here](https://www.w3.org/WAI/policies/).

- **Europe / EU:**
  - [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
  - [Web Accessibility Directive (WAD)](https://eur-lex.europa.eu/legal-content/EN/LSU/?uri=CELEX:32016L2102)

- **United States:**
  - [Section 508 of the US Rehabilitation Act](https://www.section508.gov/)
  - [Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/)

- **Canada:**
  - [Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601)

## Accessibility Statement and VPAT
When developers work on making websites easy for everyone to use, they often see two important terms: "Accessibility Statement" and "VPAT." The Accessibility Statement is like a promise from a company, saying how well their product works for people with disabilities. VPAT, on the other hand, is a form that gives more details about how a product meets certain rules for being user-friendly, like the Web Content Accessibility Guidelines (WCAG).

So, why do companies care about these documents? Let's take Handsontable as an example. When other companies use Handsontable in their apps, they want to make sure it's easy for everyone to use. If those apps already follow certain rules (like WCAG 2.1 AA), they don't want Handsontable to make things worse. By sharing an Accessibility Statement and VPAT, Handsontable shows companies that it's serious about making sure everyone can use their product easily.

## Keyboard Navigation
The principle of accessible web components is that users who cannot use a mouse can still navigate the product with a keyboard or other assistive technology.

Handsontable provides intuitive navigation that allows access to all focusable elements in a predictable way. It also identifies elements currently holding focus across cells, headers, and subcomponents such as menus, fly-out editors, and more.

## Navigation Models
Handsontable is mainly used either as a spreadsheet-like application or as a data grid. At first glance, the differences may not be significant, but this entirely changes the user experience by altering the keyboard navigation within the grid. See the table below for a better context.
| Feature/Setting                   | Data grid mode                                                                 | Spreadsheet mode (default)                                                                                           |
|----------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Configuration options            | Enables navigation across headers, false by default <br>`navigableHeaders: true`<br><br> Disables navigation with the Tab key, true by default.<br>`tabMoves: false`                                  | <br>Enables navigation across headers, false by default<br>`navigableHeaders: false`<br><br>Disables navigation with the Tab key, true by default.<br>`tabMoves: true`                                                                        |
| Brief description                | A user cannot use Tab key to navigate across the grid.<br>User uses Arrow Keys to navigate across the grid. It uses simple shortcut keys such as Enter or Space, to open menus or interact with headers, cells, or editors. | The Tab key is primarily used to navigate across the grid.<br>This scenario provides an experience familiar to users of Excel or Google Sheets. To open menus users needs to learn and use more complex shortcut keys. |
| Primary navigation method        | Arrow keys                                                                     | Tab / Shift + Tab                                                                                                    |
| Tab sequence within the page     | One Tab stop - the grid is included in the page sequence only once.            | Multiple Tab stops - all the grid tabbable elements are included in the page Tab sequence.                            |
| Navigable headers                | Yes                                                                            | No                                                                                                                   |
| Complex shortcut keys            | No                                                                             | Yes                                                                                                                  |
## Shortcut Keys Configuration
Handsontable provides an extensive amount of [built-in shortcut keys](https://handsontable.com/docs/javascript-data-grid/keyboard-shortcuts/), and allow to customize them, but some of them stand out. For example, by opening menus the user gets access to a variety of actions. The real difference is navigable headers - one enabled, it gets much easier for the disabled users to navigate across the grid with simple shortcut keys.
| Action/Setting                   | Data grid mode (Navigable headers)                  | Spreadsheet mode (Non-navigable headers)                     |
|----------------------------------|-----------------------------------------------------|--------------------------------------------------------------|
| Open column menu                 | macOS: Cmd + Enter<br>Windows: Ctrl + Enter         | macOS: Shift + Option + i<br>Windows: Shift + Alt + i        |
| Sort data                        | Shift + Enter                                       | Use of a custom context menu item is required                |
| Clear filters                    | macOS: Alt + A<br>Windows: Option + A               | macOS: Alt + A<br>Windows: Option + A                        |
| Select the entire column         | Ctrl + space                                        | Ctrl + space                                                 |
| Select the entire row            | Shift + space                                       | Shift + space                                                |
| Invoke context menu              | macOS: Cmd + Shift + \ <br> macOS: Shift + F10 <br> <br> Windows: Ctrl + Shift + \ <br> Windows: Shift + F10 | macOS: Cmd + Shift + \ <br> macOS: Shift + F10 <br> <br> Windows: Ctrl + Shift + \ <br> Windows: Shift + F10|

## Screen Readers
Handsontable is a leading grid-based application designed with accessibility in mind. Recognized as a composite widget, it adopts the ARIA role of treegrid, ensuring that it adheres to established standards. To enhance the experience for visually impaired users, Handsontable employs ARIA attributes, which provide screen readers with a clearer understanding of the data's structure and content.

Like many grid applications, we understand that there are a variety of screen readers available to users. Some of the most popular ones include JAWS (Windows), VoiceOver for macOS, NVDA for Windows, and ChromeVox (Chrome Screen Reader). At Handsontable, we prioritize these screen readers in our testing to ensure optimal compatibility.


## Customizable Demo
**Handsontable demo optimized for Accessibility** can look differently depending on the application you build. In this demo below you enable or disable multiple options that change the level of support for disabled users.

- **navigableHeaders:** (describe briefly)
- **tabMoves:** (describe briefly)
- **enterMoves:** [click](https://handsontable.com/docs/javascript-data-grid/api/options/#entermoves)
- **enterBeginsEditing:** (describe briefly)
- **autoWrapCol:** (describe briefly)
- **autoWrapRow:** (describe briefly)
- **renderAllRows + viewportColumnRenderingOffset:** (describe briefly)

## High-contrast Theme
The minimum recommended contrast between images and text, or a background and text,  is [4.5:1.](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum) To meet this requirement we recommend either:

- Overriding the default Handsontable theme with custom CSS values
- Use the special software, like High Contrast plugin maintaned by Google for the Chrome users

## Requirements for the Developers

When you customize Handsontable, it's you who is responsible for ensuring the accessibility of your solution. Especially when it comes to creating custom cell type or custom plugin, it’s important to remember about making them accessible to everyone, best if they meet **WCAG 2.1 AA guidelines** at minimum.

Recommendations for Customizations:

- Test your code against [WCAG 2.1 requirements](https://www.w3.org/WAI/WCAG21/quickref/).
- Use proper color contrast, font size, and semantic HTML.
- If needed, implement additional **WAI-ARIA** attributes.
- Avoid flashing or blinking content.
- Test your customizations with real users who have different types of disabilities. If you don’t have access to real users, try [Funkify](https://www.funkify.org/), a disability simulator, which can help you step into disabled users' shoes.

> **Note:** The accessibility level of any component in your application may be decreased by a low accessibility level of its parent elements. For this reason, make sure to always check the accessibility of the entire page, using tools such as [Lighthouse](https://developers.google.com/web/tools/lighthouse).

## Known Limitations

1. **ARIA Labels:** ARIA labels are currently unavailable due to the lack of translations. This is something we will address in the future.
2. **Screen Readers with Frozen Rows/Columns:** Some screen readers may incorrectly read the number of rows and columns or their indices when frozen rows and columns are enabled.
3. **Dynamic ARIA Attributes:** Dynamic ARIA attributes, such as sorting order or filters set, are often not announced at all, depending on the screen reader used.
4. **Access to Actions:** Access to certain actions may require custom menu items, e.g., sorting data (in spreadsheet mode where headers are non-navigable), moving a column/row, resizing a column/row, and renaming a header name.
5. **Testing Limitations:** We test our data grid with only some of screen readers on the market - the most popular ones. It’s because there are no ways to automate those tests; they all are conducted manually.


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

On top of that, you can always [customize Handsontable](#accessibility-and-customization) to meet more specific accessibility needs of your user base.

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

By default, Handsontable renders only those rows and columns that are currently in the viewport. This feature, called
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

At the moment, we're still working on an out-of-the-box high-contrast theme. However, you can easily create your own theme by overriding
[Handsontable's default CSS](https://github.com/handsontable/handsontable/blob/master/handsontable/dist/handsontable.css).

To ensure sufficient color contrast, we recommend using Chrome DevTools and dedicated accessibility tools such as
[Colorblindly](https://chrome.google.com/webstore/detail/colorblindly/floniaahmccleoclneebhhmnjgdfijgg) or
[Kontrast](https://chrome.google.com/webstore/detail/kontrast-wcag-contrast-ch/haphaaenepedkjngghandlmhfillnhjk).

## WAI-ARIA

Sticking to the [First Rule of ARIA Use](https://www.w3.org/TR/using-aria/#rule1), we implement WAI-ARIA attributes only when necessary. Handsontable is based
on the HTML `<table>` element, so assistive technologies already interpret most of its structure properly.

On the page level, Handsontable's main component has the [`treegrid`](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) role:

```html
<div id="handsontable" role="treegrid"></div>
```

Within Handsontable's main component, you'll find subcomponents such as the [context menu](@/guides/accessories-and-menus/context-menu.md), the
[date picker](@/guides/cell-types/date-cell-type.md) and others. Such subcomponents have can have other WAI-ARIA roles. For example, the
[column menu](@/guides/columns/column-menu.md) has the [`menu`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role) role:

```html
<div id="handsontable" role="treegrid">
  <div id="handsontableColumnMenu" role="menu"></div>
</div>
```

If you're creating a custom subcomponent, always make sure to assign a proper WAI-ARIA role to it. Otherwise, it can lower the overall accessibility of your
application.

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
