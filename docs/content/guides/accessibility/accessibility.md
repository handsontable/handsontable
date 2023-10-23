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

We advocate for a universally accessible web. With this vision, we have designed Handsontable to be fully accessible to individuals with disabilities, emphasizing our commitment to inclusive design and ensuring that web applications cater to all users. 

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
When developers work on making websites easy for everyone to use, they often see two important terms: *Accessibility Statement* and *VPAT*. The *Accessibility Statement* is like a promise from a company, saying how well their product works for people with disabilities. *VPAT*, on the other hand, is a form that gives more details about how a product meets certain rules for being user-friendly, like the Web Content Accessibility Guidelines (WCAG).

So, why do companies care about these documents? Let's take Handsontable as an example. When other companies use Handsontable in their apps, they want to make sure it's easy for everyone to use. If those apps already follow certain rules (like WCAG 2.1 AA), they don't want Handsontable to make things worse. By sharing an *Accessibility Statement* and *VPAT*, Handsontable shows companies that it's serious about making sure everyone can use their product easily.

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

Like many grid applications, we understand that there are a variety of screen readers available to users. Some of the most popular ones include JAWS (Windows), VoiceOver (macOS), NVDA (Windows), and ChromeVox (Chrome Screen Reader). At Handsontable, we prioritize these screen readers in our testing to ensure optimal compatibility.


## Customizable Demo
**Handsontable demo optimized for Accessibility** can look differently depending on the application you build. In this demo below you enable or disable multiple options that change the level of support for disabled users.

- **navigableHeaders:** [more info](https://handsontable.com/docs/javascript-data-grid/api/options/#navigableHeaders)
- **tabMoves:** [more info](https://handsontable.com/docs/javascript-data-grid/api/options/#tabMoves)
- **enterMoves:** [more info](https://handsontable.com/docs/javascript-data-grid/api/options/#entermoves)
- **enterBeginsEditing:** [more info](https://handsontable.com/docs/javascript-data-grid/api/options/#enterbeginsediting)
- **autoWrapCol:** [more info](https://handsontable.com/docs/javascript-data-grid/api/options/#autowrapcol)
- **autoWrapRow:** [more info](https://handsontable.com/docs/javascript-data-grid/api/options/#autowraprow)
- **renderAllRows + viewportColumnRenderingOffset:** (describe briefly)

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

1. **ARIA Labels:** We are actively working towards providing comprehensive translations. We appreciate your patience and will keep our users updated on the progress.
2. **Screen Readers with Frozen Rows/Columns:** Some screen readers may incorrectly read the number of rows and columns or their indices when frozen rows and columns are enabled.
3. **Dynamic ARIA Attributes:** Dynamic ARIA attributes, such as sorting order or filters set, are often not announced at all, depending on the screen reader used.
4. **Access to Actions:** Access to certain actions may require custom menu items, e.g., sorting data (in spreadsheet mode where headers are non-navigable), moving a column/row, resizing a column/row, and renaming a header name.
5. **Testing Limitations:** We test our data grid with only some of screen readers on the market - the most popular ones. It’s because there are no ways to automate those tests; they all are conducted manually.