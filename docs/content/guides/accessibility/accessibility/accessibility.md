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
react:
  id: x82phf34
  metaTitle: Accessibility - React Data Grid | Handsontable
searchCategory: Guides
category: Accessibility
---

# Accessibility

Handsontable is designed to be accessible, aligning with global standards. We prioritize inclusivity, ensuring web applications are usable by people with disabilities. 

[[toc]]

## Overview

Accessibility features of Handsontable include:

- Keyboard navigation that lets you use the grid without a mouse.
- Support for the most popular screen readers.
- Flexible API to configure keyboard shortcuts and navigation methods.

## Conformance with standards

Most global standards and regulations are created in accordance with WCAG (Web Content Accessibility Guidelines).
Handsontable meets requirements outlined in the [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) guidelines,
which makes it compatible with most local standards, such as:

### Region

#### USA
- [Section 508 of the US Rehabilitation Act](https://www.section508.gov/)
- [Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/) 

#### Europe
- [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
- [Web Accessibility Directive (WAD)](https://eur-lex.europa.eu/legal-content/EN/LSU/?uri=CELEX:32016L2102)

#### Canada
- [Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601) 

## Keyboard navigation

Handsontable doesn't require a mouse to navigate across the grid's elements. This is an important feature for those users with temporary or permanent motor impairments for whom following the mouse cursor is difficult. Keyboard navigation is also a great way to improve productivity, which is why many users choose the keyboard over the mouse regardless of their accessibility needs.

Our experience with hundreds of implementations shows that Handsontable tends to be used either as a **spreadsheet application** or a **data grid component**. While at first the difference seems subtle, it significantly impacts user expectations regarding navigation.

In a typical spreadsheet application (think of Microsoft Excel or Google Sheets), you can't move the focus onto headers. This makes it difficult to sort or filter data without knowing complex [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md). Additionally, opening a [column menu](@/guides/columns/column-menu/column-menu.md) is not trivial.
Handsontable offers flexibility in this regard, allowing users to switch between data grid and spreadsheet "modes". To do that switch, you can use a combination of two options: [`navigableHeaders`](@/api/options.md#navigableheaders) to enable or disable moving focus onto headers, and [`tabNavigation`](@/api/options.md#tabnavigation) to decide if the <kbd>**Tab**</kbd> key can be used to navigate across cells and headers.

The following table provides more details about these two scenarios:
 
| Aspect                    | Data grid mode                                                                                                                                                                                                                                          | Spreadsheet mode (default)                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration             | [`navigableHeaders: true`](@/api/options.md#navigableheaders) <br>  [`tabNavigation: false`](@/api/options.md#tabnavigation)                                                                                                                            | [`navigableHeaders: false`](@/api/options.md#navigableheaders) <br> [`tabNavigation: true`](@/api/options.md#tabnavigation)                                                                             |
| Primary navigation method | Arrow keys                                                                                                                                                                                                                                              | <kbd>**Tab**</kbd> / <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>                                                                                                                                            |
| Navigable headers         | Yes                                                                                                                                                                                                                                                     | No                                                                                                                                                                                                      |
| Navigation                | Use the arrow keys navigate across the grid. Use simple shortcuts such as <kbd>**Enter**</kbd> or <kbd>**Space**</kbd> to open menus or interact with headers, cells, or cell editors. <br><br>You can't use the <kbd>**Tab**</kbd> key for navigation. | Use <kbd>**Tab**</kbd> / <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> to navigate across the grid.<br>This behavior is similar to Excel or Google Sheets. <br><br>To open menus, use more complex shortcuts. |
| Focus behavior            | One tab stop. The grid is included in the page tab sequence only once.                                                                                                                                                                                  | Multiple tab stops. All tabbable elements of the grid, such as cells, are included in the page tab sequence.                                                                                            |

## Navigation shortcuts

Handsontable provides a wide range of [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md), but some of them are particularly important for users who navigate the grid with the keyboard only. For example, actions triggered while navigating across headers involve simple key combinations, making them intuitive and useful. For more complex scenarios, you can [customize the shortcuts keys](@/guides/navigation/custom-shortcuts/custom-shortcuts.md) through the API.

| Windows                                                                                                 | macOS                                                                                                  | Action              | Focused element |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- | --------------- |
| <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd>                                                | <kbd>**Shift**</kbd>+<kbd>**Option**</kbd>+<kbd>**↓**</kbd>                                            | Open a column menu  | Any cell        |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                                                                | <kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>                                                                | Open a column menu  | Column header   |
| <kbd>**Enter**</kbd>                                                                                    | <kbd>**Enter**</kbd>                                                                                   | Sort data           | Column header   |
| <kbd>**Alt**</kbd>+<kbd>**A**</kbd>                                                                     | <kbd>**Option**</kbd>+<kbd>**A**</kbd>                                                                 | Clear filters       | Any cell        |
| <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>                                                                | <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>*                                                              | Select a column     | Any cell        |
| <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                                                               | <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                                                              | Select a row        | Any cell        |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> <br> <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> <br> <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | Open a context menu | Any cell        |

*To use this shortcut, disable the default macOS behavior for the <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd> key combination, under **System Settings** > **Keyboard** > **Keyboard Shortcuts** > **Input Sources**.

## Support for screen readers

Although semantic HTML doesn't need any additional attributes to be properly interpreted by assistive technologies, some of Handsontable's complex features are not fully covered by the HTML specification. That's why Handsontable provides support for screen readers with ARIA attributes (Accessible Rich Internet Applications) applied to its HTML markup.

Each new version of Handsontable is thoroughly tested for accessibility with the following screen readers:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)

## Accessible data grid demo

Check out the interactive demo below to see how various Handsontable settings impact its accessibility level and affect the user experience.

::: only-for javascript angular vue

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/accessibility/accessibility/javascript/example1.html)
@[code](@/content/guides/accessibility/accessibility/javascript/example1.css)
@[code](@/content/guides/accessibility/accessibility/javascript/example1.js)
@[code](@/content/guides/accessibility/accessibility/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example2 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/accessibility/accessibility/react/example2.css)
@[code](@/content/guides/accessibility/accessibility/react/example2.jsx)
@[code](@/content/guides/accessibility/accessibility/react/example2.tsx)

:::

:::

## Disabling DOM virtualization for improved accessibility

By default, Handsontable uses DOM virtualization to display only the [rows](@/guides/rows/row-virtualization/row-virtualization.md)
and [columns](@/guides/columns/column-virtualization/column-virtualization.md) that are currently visible on the screen,
plus a few extra cells outside the visible area to ensure a seamless scrolling experience.

However, assistive technologies rely on the elements within the DOM appearing in the correct order.
Otherwise, they require the use of [additional ARIA attributes](https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties),
such as `row-colindex` or `aria-rowindex`, to understand the grid's structure and accurately announce (read) it to the user.

We already use ARIA attributes to describe data sorting, hidden columns or rows, and merged cells.
Unfortunately, our tests have discovered scenarios where screen readers either announce incorrect indices or omit the ARIA attributes altogether.
To address this issue, we recommend disabling DOM virtualization, which entails loading all grid elements into the browser.
This action creates a complete [Accessibility tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree) that can be easily parsed
and interpreted by assistive technology.

::: only-for javascript

```js
const hot = new Handsontable(container, {
  // disable column virtualization
  renderAllColumns: true,
  // disable row virtualization
  renderAllRows: true,
});
```

:::

::: only-for react

```js
<HotTable
  // disable column virtualization
  renderAllColumns={true}
  // disable row virtualization
  renderAllRows={true}
/>
```

:::

## High-contrast theme

The recommended [minimum contrast ratio](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum) for text against images or backgrounds is 4.5:1. To achieve this level of contrast with Handsontable's default theme, you can:

- Override the grid's CSS with your own styles.
- Use third-party software, such as the [High Contrast](https://chrome.google.com/webstore/detail/high-contrast/djcfdncoelnlbldjfhinnjlhdjlikmph) extension for Chrome, supported by Google.

## Requirements for developers

When you customize Handsontable, it's you who's responsible for ensuring the accessibility of your solution. Especially when you create a [custom cell type](@/guides/cell-types/cell-type/cell-type.md) or a [custom plugin](@/guides/tools-and-building/custom-plugins/custom-plugins.md), remember to make them accessible to everyone.

Our recommendations for custom development:

- Test your code against WCAG 2.1 requirements frequently.
- Use proper color contrast, font size, and semantic HTML.
- If needed, implement additional WAI-ARIA attributes.
- Avoid flashing or blinking content.
- Test your customizations with real users who have different types of disabilities. If you don’t have access to real users, try [Funkify](https://www.funkify.org/), a disability simulator, which can help you look at your application from the perspective of users with different disabilities.

::: tip

The quality of custom Handsontable modifications can impact your application's accessibility level. Make sure to actively check how your changes influence the overall accessibility of your application, using tools like [Lighthouse](https://developers.google.com/web/tools/lighthouse).

:::

## Maintaining accessibility

We make sure our data grid remains accessible by taking the following measures:

- We check Handsontable's accessibility score with a range of accessibility testing tools.
- We use automated visual regression testing.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated unit and end-to-end tests.

## Known limitations

- When [frozen rows](@/guides/rows/row-freezing/row-freezing.md), [frozen columns](@/guides/columns/column-freezing/column-freezing.md), or both, are enabled, some screen readers may incorrectly read the total number of rows and columns.
- When you select a cell that's part of a frozen row, frozen column, or both, NVDA and JAWS might incorrectly announce that cell's column header name.
- Dynamic ARIA attributes are sometimes omitted by screen readers.
- The `aria-rowcount` attribute is intentionally set to `-1`, as most screen readers either ignore or misinterpret it. This configuration ensures accuracy with screen readers such as VoiceOver. We plan to revise this approach once screen readers consistently handle the `aria-rowcount` attribute correctly.

## API reference

For the list of [options](@/guides/getting-started/configuration-options/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) related to accessibility, see the following API reference pages:

- [`autoWrapCol`](@/api/options.md#autowrapcol)
- [`autoWrapRow`](@/api/options.md#autowraprow)
- [`tabNavigation`](@/api/options.md#tabnavigation)
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
- [`navigableHeaders`](@/api/options.md#navigableheaders)
- [`renderAllColumns`](@/api/options.md#renderallcolumns)
- [`renderAllRows`](@/api/options.md#renderallrows)
- [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
- [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)

## Troubleshooting

Try the following links if you didn't find what you need:

- [View related topics](https://github.com/handsontable/handsontable/labels/Accessibility) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
