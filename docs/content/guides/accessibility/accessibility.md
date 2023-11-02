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

Handsontable offers accessibility support in line with international standards. Due to our belief in the principle of "design for all", web applications should be as inclusive as possible. 

[[toc]]

## Overview

Accessibility features of Handsontable include:

- [Keyboard navigation](@/guides/navigation/keyboard-navigation.md) that lets you access any feature without using a mouse.
- [WAI-ARIA](#wai-aria) roles and attributes that complement HTML where needed.
- Support for the most popular [screen readers](#supported-screen-readers).
- Compliance with the accessibility [standards and regulations](#accessibility-compliance).
- A set of configurable [accessibility options](#accessibility-configuration).

## Conformance with Standards
Several regulatory standards were established by the governing bodies, for instance the European Union or the United States, which align with the Web Content Accessibility Guidelines (WCAG). They consist of a number of guidelines maintained by the World Wide Web Consortium (W3C). <br>
Handsontable delivers conformance to W3C standards by meeting the requirements of [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) at level AA.<br> 

- **Europe / EU:**
  - [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
  - [Web Accessibility Directive (WAD)](https://eur-lex.europa.eu/legal-content/EN/LSU/?uri=CELEX:32016L2102)

- **United States:**
  - [Section 508 of the US Rehabilitation Act](https://www.section508.gov/)
  - [Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/)

- **Canada:**
  - [Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601)

### Accessibility Statement and Voluntary Product Accessibility Template (VPAT)
Companies integrating Handsontable into their applications aim for optimal user accessibility. If their apps adhere to standards like WCAG 2.1 AA, they expect Handsontable not to compromise that. By offering an **Accessibility Statement** and **VPAT**, Handsontable assures its commitment to universal usability.

Accessibility Statement and VPAT (Voluntary Product Accessibility Template) for Handsontable outline how the product meets accessibility standards. This ensures compliance with laws like the Americans with Disabilities Act (ADA) and Section 508.

A VPAT reflects a product's dedication to accessibility, which can improve an organization's image and demonstrate its values in creating software for the broadest audience, including those using assistive technologies.

### Accessibility testing

Before releasing a new version of Handsontable, we test it for accessibility, using different approaches:

- We cover the most common use cases with automated unit and end-to-end tests.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated visual regression testing.
- We check Handsontable's accessibility score with a range of the accessibility testing tools, such as Lighthouse, Axe-core, or Accessibility Insights for Web.

## Keyboard Navigation
Our goal is to provide a data grid that doesn't require a mouse to operate. This is important for people who rely on a keyboard or other assistive technologies. Importantly, depending on your needs, the navigation can be controlled or customized through the API.
<br><br>Learn more in the following sections:

- [Keyboard navigation](@/guides/navigation/keyboard-navigation.md)
- [Configure keyboard navigation options](@/guides/navigation/keyboard-navigation.md#configure-keyboard-navigation-options)
- [Default keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md)
- [Custom shortcuts](@/guides/navigation/custom-shortcuts.md)

### Navigation Models
Handsontable functions as both a spreadsheet application and a data grid. While the differences might seem minor at first, they significantly affect how users navigate using the keyboard. The following table provides more details for clearer understanding.
| Feature/Setting                   | Data grid mode                                                                 | Spreadsheet mode (default)                                                                                           |
|----------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Configuration options            | Enables navigation across headers, false by default <br>`navigableHeaders: true`<br><br> Disables navigation with the Tab key, true by default.<br>`tabMoves: false`                                  | <br>Enables navigation across headers, false by default<br>`navigableHeaders: false`<br><br>Disables navigation with the Tab key, true by default.<br>`tabMoves: true`                                                                        |
| Brief description                | A user cannot use Tab key to navigate across the grid.<br>User uses Arrow Keys to navigate across the grid. It uses simple shortcut keys such as Enter or Space, to open menus or interact with headers, cells, or editors. | The Tab key is primarily used to navigate across the grid.<br>This scenario provides an experience familiar to users of Excel or Google Sheets. To open menus users needs to learn and use more complex shortcut keys. |
| Primary navigation method        | Arrow keys                                                                     | Tab / Shift + Tab                                                                                                    |
| Tab sequence within the page     | One Tab stop - the grid is included in the page sequence only once.            | Multiple Tab stops - all the grid tabbable elements are included in the page Tab sequence.                            |
| Navigable headers                | Yes                                                                            | No                                                                                                                   |
| Complex shortcut keys            | No                                                                             | Yes                                                                                                                  |
### Shortcut Keys Configuration
Hansontable includes a wide range of [shortcut keys](https://handsontable.com/docs/javascript-data-grid/keyboard-shortcuts/) for quick navigation and offers customization options. 

Shortcuts for menu access streamline a variety of actions. When headers are set to be navigable, these shortcuts enhance accessibility, making it simpler for users with disabilities to move through the grid.
| Windows                       | macOS                         | Action                                  |
|-------------------------------|-------------------------------|-----------------------------------------|
| <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>I</kbd>       | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>I</kbd>    | Open column menu (any table cell).      |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                    | <kbd>Cmd</kbd> + <kbd>Enter</kbd>                       | Open column menu (column header).       |
| <kbd>Shift</kbd> + <kbd>Enter</kbd>                   | <kbd>Shift</kbd> + <kbd>Enter</kbd>                     | Sort data.                              |
| <kbd>Option</kbd> + <kbd>A</kbd>                      | <kbd>Alt</kbd> + <kbd>A</kbd>                           | Clear filters.                          |
| <kbd>Ctrl</kbd> + <kbd>space</kbd>                    | <kbd>Ctrl</kbd> + <kbd>space</kbd>                      | Select the entire column.               |
| <kbd>Shift</kbd> + <kbd>Space</kbd>                   | <kbd>Shift</kbd> + <kbd>space</kbd>                     | Select the entire row.                  |
| <kbd>Cmd</kbd> + <kbd>shift</kbd> + <kbd>\\</kbd>      | <kbd>Shift</kbd> + <kbd>F10</kbd>                       | Invoke context menu.                    |



This is an excerpt from [this](https://handsontable.com/docs/javascript-data-grid/keyboard-shortcuts/) page. 

## Screen Readers
Handsontable is recognized as a composite widget by WAI-ARIA and uses the ARIA role of 'treegrid' to meet established accessibility standards. It incorporates ARIA attributes to make the grid's structure and content more comprehensible to screen readers, improving the experience for users with visual impairments.

Handsontable focuses on compatibility with a range of screen readers, with particular emphasis on testing with:

* JAWS for Windows
* VoiceOver for macOS
* NVDA for Windows
* ChromeVox, the Chrome screen reader


## Accessibility Demo
**Handsontable demo optimized for Accessibility** may vary based on the application you create. In the demo provided, you can toggle various options to adjust the accessibility support for users with disabilities.

| Option                                  | Default | Definition |
|:----------------------------------------|:--------|:-----------|
| [**navigableHeaders**](https://handsontable.com/docs/javascript-data-grid/api/options.md/#navigableHeaders) |-      |  -     |
| [**tabMoves**](https://handsontable.com/docs/javascript-data-grid/api/options/#tabMoves)               |row: 0, col: 1|The `tabMoves` option sets the cell movement behavior for pressing the Tab key in a grid, allowing specification of the number of rows and columns to navigate, which can be defined using an object or a function.|
| [**enterMoves**](https://handsontable.com/docs/javascript-data-grid/api/options/#entermoves)           |col: 0, row:1|The `enterMoves` option defines the navigation behavior upon pressing the Enter key in a grid, dictating the number of columns and rows the selection moves, which can be customized with an object or function, especially in relation to the `enterBeginsEditing` setting.|
| [**enterBeginsEditing**](https://handsontable.com/docs/javascript-data-grid/api/options/#enterbeginsediting) |true  |The `enterBeginsEditing` option controls if pressing Enter key once starts editing the active cell (`true`, default) or moves to the next cell according to `enterMoves` settings (`false`).|
| [**autoWrapCol**](https://handsontable.com/docs/javascript-data-grid/api/options/#autowrapcol)         |false     |The `autoWrapCol` option toggles vertical wrapping in a grid, where pressing ↓ in the bottom-most cell moves to the top cell of the next column and pressing ↑ in the top-most cell moves to the bottom cell of the previous column, with `true` activating this behavior and `false` (default) preventing it.|
| [**autoWrapRow**](https://handsontable.com/docs/javascript-data-grid/api/options/#autowraprow)         |false      |The `autoWrapRow` option in a grid enables (`true`) or disables (`false`, default) wrapping the selection from the first cell to the last of the previous row and from the last cell to the first of the next row when navigating with arrow keys.|
| [**renderAllRows**](https://handsontable.com/docs/javascript-data-grid/api/options/#renderallrows)     |undefined     |The `renderAllRows` option in Handsontable determines if row virtualization is turned off (`true`) to render all rows simultaneously, or turned on (`false`, default) to render rows efficiently as needed.
|
| [**viewportColumnRenderingOffset**](https://handsontable.com/docs/javascript-data-grid/api/options/#viewportcolumnrenderingoffset) |auto |The `viewportColumnRenderingOffset` option sets the quantity of columns that Handsontable pre-renders outside the visible grid area, with `auto` for automatic calculation or a specific number for manual configuration.
|

DEMO PLACEHOLDER

## High-contrast Theme
It's essential to make content easy to read and distinguish, particularly for users with visual impairments. High contrast between elements improves readability and user comfort during prolonged interaction. The recommended minimum contrast ratio for text against images or backgrounds is [4.5:1](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum), as outlined by the Web Content Accessibility Guidelines (WCAG). To achieve this level of contrast, consider the following options:

* Customize the default Handsontable theme using your own CSS settings.
* Utilize tools designed for this purpose, such as the [High Contrast](https://chrome.google.com/webstore/detail/high-contrast/djcfdncoelnlbldjfhinnjlhdjlikmph) extension offered by Google for Chrome.

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

   - **ARIA Labels:** We are actively working towards providing comprehensive translations (see [here](https://handsontable.com/docs/javascript-data-grid/language/)). We appreciate your patience and will keep our users updated on the progress.
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