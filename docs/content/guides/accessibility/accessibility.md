---
id: o4qhm1bg
title: Handsontable - Accessibility
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
[[toc]]

## Overview

Handsontable offers comprehensive accessibility support, including built-in keyboard navigation in line with international standards. Our design ensures that individuals with disabilities can fully engage with Handsontable.

Features of Handsontable include:

- Intuitive [keyboard navigation](@/guides/navigation/keyboard-navigation.md) that lets you access any feature without using a mouse.
- Transparent HTML structure following best accessibility practices.
- [WAI-ARIA](#wai-aria) roles and attributes that complement HTML where needed.
- Support for the most popular [screen readers](#supported-screen-readers).
- Compliance with the most important accessibility [standards and regulations](#accessibility-compliance).
- A set of configurable [accessibility options](#accessibility-configuration).

## Conformance with Standards
Several regulatory standards were established by the governing bodies, for instance the European Union or the United States, which align with the Web Content Accessibility Guidelines (WCAG). They consist of a number of guidelines maintained by the World Wide Web Consortium (W3C). <br>
Handsontable delivers conformance to W3C standards by meeting the requirements of [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) at level AA.<br> 
You may find a comprehensive list of policies appertaining to web accessibility in various jurisdictions [here](https://www.w3.org/WAI/policies/).

- **Europe / EU:**
  - [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
  - [Web Accessibility Directive (WAD)](https://eur-lex.europa.eu/legal-content/EN/LSU/?uri=CELEX:32016L2102)

- **United States:**
  - [Section 508 of the US Rehabilitation Act](https://www.section508.gov/)
  - [Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/)

- **Canada:**
  - [Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601)

### Accessibility Statement and Voluntary Product Accessibility Template (VPAT)
The **Accessibility Statement** is a company's commitment, indicating how well their product caters to individuals with disabilities. **Voluntary Product Accessibility Template (VPAT)**, meanwhile, provides detailed insights into how a product aligns with user-friendly standards, such as the Web Content Accessibility Guidelines (WCAG).

Why do these documents matter? Consider Handsontable. Companies integrating Handsontable into their applications aim for optimal user accessibility. If their apps adhere to standards like WCAG 2.1 AA, they expect Handsontable not to compromise that. By offering an **Accessibility Statement** and **VPAT**, Handsontable assures its commitment to universal usability.

### Accessibility testing

Before releasing a new version of Handsontable, we carefully test it for accessibility, using a combination of different approaches:

- We cover the most common use cases with automated unit and end-to-end tests.
- We manually test all of Handsontable's features with the most popular screen readers (odniesienie do sekcji screen readers w tym artykule ).
- We use automated visual regression testing.
- We check Handsontable's accessibility score with a range of the most popular accessibility testing tools, such as Lighthouse, Axe-core, or Accessibility Insights for Web.

## Keyboard Navigation
The principle of accessible web components is that users who cannot use a mouse can still navigate the product with a keyboard or other assistive technology.

Handsontable provides intuitive navigation that allows access to all focusable elements in a predictable way. It also identifies elements currently holding focus across cells, headers, and subcomponents such as menus, fly-out editors, and more.
<br><br>Learn more in the following sections:

- [Keyboard navigation](@/guides/navigation/keyboard-navigation.md)
- [Configure keyboard navigation options](@/guides/navigation/keyboard-navigation.md#configure-keyboard-navigation-options)
- [Default keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md)
- [Custom shortcuts](@/guides/navigation/custom-shortcuts.md)

### Navigation Models
Handsontable is mainly used either as a spreadsheet-like application or as a data grid. At first glance, the differences may not be significant, but this entirely changes the user experience by altering the keyboard navigation within the grid. See the table below for a better context.
| Feature/Setting                   | Data grid mode                                                                 | Spreadsheet mode (default)                                                                                           |
|----------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Configuration options            | Enables navigation across headers, false by default <br>`navigableHeaders: true`<br><br> Disables navigation with the Tab key, true by default.<br>`tabMoves: false`                                  | <br>Enables navigation across headers, false by default<br>`navigableHeaders: false`<br><br>Disables navigation with the Tab key, true by default.<br>`tabMoves: true`                                                                        |
| Brief description                | A user cannot use Tab key to navigate across the grid.<br>User uses Arrow Keys to navigate across the grid. It uses simple shortcut keys such as Enter or Space, to open menus or interact with headers, cells, or editors. | The Tab key is primarily used to navigate across the grid.<br>This scenario provides an experience familiar to users of Excel or Google Sheets. To open menus users needs to learn and use more complex shortcut keys. |
| Primary navigation method        | Arrow keys                                                                     | Tab / Shift + Tab                                                                                                    |
| Tab sequence within the page     | One Tab stop - the grid is included in the page sequence only once.            | Multiple Tab stops - all the grid tabbable elements are included in the page Tab sequence.                            |
| Navigable headers                | Yes                                                                            | No                                                                                                                   |
| Complex shortcut keys            | No                                                                             | Yes                                                                                                                  |
### Shortcut Keys Configuration
Handsontable provides an extensive amount of [built-in shortcut keys](https://handsontable.com/docs/javascript-data-grid/keyboard-shortcuts/) and the ability to customize them, but some of them stand out. <br><br>
For instance, one great example would be opening the menus. The user gets access to variety of actions. With navigable headres enabled it gets easier for disabled users to navigate across the grid with simple shortcut keys.
| Action/Setting                   | Data grid mode (Navigable headers)                                           | Spreadsheet mode (Non-navigable headers)                                                    |
|----------------------------------|------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| Open column menu                 | macOS: <kbd>Cmd</kbd> + <kbd>Enter</kbd><br>Windows: <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                | macOS: <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>i</kbd><br>Windows: <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>i</kbd> |
| Sort data                        | <kbd>Shift</kbd> + <kbd>Enter</kbd>                                         | Use of a custom context menu item is required                                               |
| Clear filters                    | macOS: <kbd>Alt</kbd> + <kbd>A</kbd><br>Windows: <kbd>Option</kbd> + <kbd>A</kbd>                    | macOS: <kbd>Alt</kbd> + <kbd>A</kbd><br>Windows: <kbd>Option</kbd> + <kbd>A</kbd>           |
| Select the entire column         | <kbd>Ctrl</kbd> + <kbd>space</kbd>                                          | <kbd>Ctrl</kbd> + <kbd>space</kbd>                                                           |
| Select the entire row            | <kbd>Shift</kbd> + <kbd>space</kbd>                                         | <kbd>Shift</kbd> + <kbd>space</kbd>                                                          |
| Invoke context menu              | macOS: <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br> <kbd>Shift</kbd> + <kbd>F10</kbd> <br> <br> Windows: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br> <kbd>Shift</kbd> + <kbd>F10</kbd> | macOS: <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br>Windows: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br> <kbd>Shift</kbd> + <kbd>F10</kbd> |


This is the exerpt from [this]((https://handsontable.com/docs/javascript-data-grid/keyboard-shortcuts/)) page. 

## Screen Readers
Recognized as a composite widget, Handsontable adopts the ARIA role of treegrid, ensuring that it adheres to established standards. To enhance the experience for visually impaired users, Handsontable employs ARIA attributes, which provide screen readers with a clearer understanding of the data's structure and content.

There are a variety of screen readers available to users. At Handsontable, we prioritize the following screen readers in our testing to ensure optimal compatibility:
- JAWS (Windows)
- VoiceOver (macOS)
- NVDA (Windows)
- ChromeVox (Chrome Screen Reader)


## Accessibility Demo
**Handsontable demo optimized for Accessibility** can look differently depending on the application you build. In this demo below you enable or disable multiple options that change the level of support for disabled users.

| Option                                  | Default | Definition |
|:----------------------------------------|:--------|:-----------|
| [**navigableHeaders**](https://handsontable.com/docs/javascript-data-grid/api/options/#navigableHeaders) | -       | -          |
| [**tabMoves**](https://handsontable.com/docs/javascript-data-grid/api/options/#tabMoves)               | -       | -          |
| [**enterMoves**](https://handsontable.com/docs/javascript-data-grid/api/options/#entermoves)           | -       | -          |
| [**enterBeginsEditing**](https://handsontable.com/docs/javascript-data-grid/api/options/#enterbeginsediting) | -    | -          |
| [**autoWrapCol**](https://handsontable.com/docs/javascript-data-grid/api/options/#autowrapcol)         | -       | -          |
| [**autoWrapRow**](https://handsontable.com/docs/javascript-data-grid/api/options/#autowraprow)         | -       | -          |
| [**renderAllRows**](https://handsontable.com/docs/javascript-data-grid/api/options/#renderallrows)     | -       | -          |
| [**viewportColumnRenderingOffset**](https://handsontable.com/docs/javascript-data-grid/api/options/#viewportcolumnrenderingoffset) | - | -  |



## High-contrast Theme
Ensuring that content is easily readable and distinguishable is important for users, especially those with visual impairments. Proper contrast between elements not only enhances readability but also ensures that users can comfortably interact with the content for extended periods. The minimum recommended contrast between images and text, or a background and text, is [4.5:1](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum). To meet this requirement we recommend either:

- Overriding the default Handsontable theme with custom CSS values.
- Use the special software, like the [High Contrast](https://chrome.google.com/webstore/detail/high-contrast/djcfdncoelnlbldjfhinnjlhdjlikmph) plugin maintained by Google for Chrome users.


## Requirements for the Developers

When you customize Handsontable, it's you who is responsible for ensuring the accessibility of your solution. Especially when it comes to creating [custom cell type](https://handsontable.com/docs/javascript-data-grid/cell-function/) or [custom plugin](https://handsontable.com/docs/javascript-data-grid/custom-plugins/), it’s important to remember about making them accessible to everyone, best if they meet **WCAG 2.1 AA guidelines** at minimum.

Recommendations for Customizations:

- Test your code against [WCAG 2.1 requirements](https://www.w3.org/WAI/WCAG21/quickref/).
- Use proper color contrast, font size, and semantic HTML.
- If needed, implement additional **WAI-ARIA** attributes.
- Avoid flashing or blinking content.
- Test your customizations with real users who have different types of disabilities. If you don’t have access to real users, try [Funkify](https://www.funkify.org/), a disability simulator, which can help you step into disabled users' shoes.

> **Note:** The accessibility level of any component in your application may be decreased by a low accessibility level of its parent elements. For this reason, make sure to always check the accessibility of the entire page, using tools such as [Lighthouse](https://developers.google.com/web/tools/lighthouse).

## Known Limitations

   - **ARIA Labels:** We are actively working towards providing comprehensive translations. We appreciate your patience and will keep our users updated on the progress.
   - **Screen Readers with Frozen Rows/Columns:** Some screen readers may incorrectly read the number of rows and columns or their indices when frozen rows and columns are enabled.
   - **Dynamic ARIA Attributes:** Dynamic ARIA attributes, such as sorting order or filters set, are often not announced at all, depending on the screen reader used.
  - **Access to Actions:** Access to certain actions may require custom menu items, e.g., sorting data (in spreadsheet mode where headers are non-navigable), moving a column/row, resizing a column/row, and renaming a header name.
   - **Testing Limitations:** We test our data grid with only some of screen readers on the market - the most popular ones. It’s because there are no ways to automate those tests; they all are conducted manually.

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

Try the following links if you didn't find what you need:
- [View related topics](https://github.com/handsontable/handsontable/labels/Accessibility) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help