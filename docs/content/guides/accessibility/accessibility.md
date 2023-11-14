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

Most global standards and regulations are created in accordance with WCAG (Web Content Accessibility Guidelines). Handsontable meets requirements outlined in the [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) guidelines, which makes it compatible with most local standards such as:

- **United States:**
  - [Section 508 of the US Rehabilitation Act](https://www.section508.gov/)
  - [Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/)

- **Europe / European Union:**
  - [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
  - [Web Accessibility Directive (WAD)](https://eur-lex.europa.eu/legal-content/EN/LSU/?uri=CELEX:32016L2102)

- **Canada:**
  - [Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601)

## Keyboard navigation
Handsontable does not require a mouse to navigate across the grid's elements. This is an important feature for certain users with temporary or permanent motor impairments, for whom following the tiny mouse cursor is difficult. Interestingly, some "power" users also find it easier to use the keyboard instead of the mouse.

Our experience with hundreds of implementations of Handsontable has highlighted some typical patterns. It turns out that usually Handsontable is used as either a **spreadsheet application** or a **data grid component**. While the difference may seem subtle at first, it significantly impacts user expectations regarding navigation.

In a typical spreadsheet application (think of Microsoft Excel or Google Sheets), you cannot move the focus onto headers. This makes it difficult to sort or filter data without knowing complex [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md). Additionally, opening a column menu is not trivial. Handsontable offers flexibility in this regard, allowing users to switch between data grid and spreadsheet "modes". To do that switch, you can use a combination of two options: [`navigableHeaders`](@/api/options.md#navigableheaders) to enable or disable moving focus onto headers, and [`tabMoves`](@/api/options.md#tabmoves) to decide if the <kbd>Tab</kbd> key can be used to navigate across cells and headers.

The following table provides more details about these two scenarios:
 
|                           | Data grid mode                                                                                                                                                                                                                                                                         | Spreadsheet mode (default)                                                                                                                                                         |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Configuration options     | `navigableHeaders: true` <br>  `tabMoves: false`                                                                                                                                                                                                                                       | `navigableHeaders: false` <br> `tabMoves: true`                                                                                                                                    |
| Primary navigation method | <kbd>Arrow keys</kbd>                                                                                                                                                                                                                                                                  | <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd>                                                                                                                                 |
| Description               | The <kbd>Arrow keys</kbd> are primarily used to navigate across the grid. Use simple shortcut keys such as <kbd>Enter</kbd> or <kbd>Space</kbd> to open menus or interact with headers, cells, or cell editors. <br><br>You cannot use <kbd>Tab</kbd> key to navigate across the grid. | The <kbd>Tab</kbd> key is primarily used to navigate across the grid.<br>This behavior is similar to Excel or Google Sheets. <br><br>To open menus use more complex shortcut keys. |
| Focus order               | One <kbd>Tab</kbd> stop - the grid is included in the tab sequence within the page only once.                                                                                                                                                                                          | Multiple <kbd>Tab</kbd> stops - all the grid tabbable elements, such as cells or headers, are included in the page <kbd>Tab</kbd> sequence.                                        |
| Navigable headers         | Yes                                                                                                                                                                                                                                                                                    | No                                                                                                                                                                                 |                                                                                              |

## Shortcut keys

Handsontable provides a wide range of [shortcut keys](@/guides/navigation/keyboard-shortcuts.md), but some of them seem to be more important for users not using a mouse for navigation. Specifically, actions triggered while navigating across headers involve simple combinations of keyboard keys, making them intuitive and useful. For more complex scenarios, you can also [customize the shortcuts keys](@/guides/navigation/custom-shortcuts.md) through the API.

| Windows                                                                                   | macOS                                                                                    | Action              | Focused element   |
|-------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|---------------------|-------------------|
| <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>I</kbd>                                          | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>I</kbd>                                      | Open a column menu  | Any cell     |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                                                        | <kbd>Cmd</kbd> + <kbd>Enter</kbd>                                                        | Open a column menu  | Column header     |
| <kbd>Shift</kbd> + <kbd>Enter</kbd>                                                       | <kbd>Shift</kbd> + <kbd>Enter</kbd>                                                      | Sort data           | Column header     |
| <kbd>Alt</kbd> + <kbd>A</kbd>                                                             | <kbd>Option</kbd> + <kbd>A</kbd>                                                         | Clear filters       | Any cell     |
| <kbd>Ctrl</kbd> + <kbd>Space</kbd>                                                        | <kbd>Cmd</kbd> + <kbd>Space</kbd>                                                        | Select a column     | Any cell |
| <kbd>Shift</kbd> + <kbd>Space</kbd>                                                       | <kbd>Shift</kbd> + <kbd>Space</kbd>                                                      | Select a row        | Any cell    |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br> <kbd>Shift</kbd> + <kbd>F10</kbd> | <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br> <kbd>Shift</kbd> + <kbd>F10</kbd> | Open a context menu | Any cell     |

## Support for screen readers

Although semantic HTML doesn't need any additional attributes to be properly interpreted by assistive technologies, some of Handsontable's complex features are not fully covered by the HTML specification. That's why Handsontable provides support for screen readers with ARIA attributes (Accessible Rich Internet Applications) applied to its HTML markup.

Each new version is thoroughly tested for accessibility with the following screen readers:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)

## A demo of accessible data grid

Check out the interactive demo below to see how different Handsontable settings impact its accessibility level and affect the user experience.


## High-contrast theme

The recommended [minimum contrast ratio](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum) for text against images or backgrounds is 4.5:1. To achieve this level of contrast with Handsontable's default theme, customize it to meet your end-users' needs by applying the following actions:

- Override the grid's CSS with your own styles.
- Use third-party software, such as the [High Contrast](https://chrome.google.com/webstore/detail/high-contrast/djcfdncoelnlbldjfhinnjlhdjlikmph) extension for Chrome, supported by Google.

## Requirements for the developers

When you customize Handsontable, it's you who is responsible for ensuring the accessibility of your solution. Especially when you create [custom cell type](@/guides/cell-types/cell-type.md) or [custom plugin](@/guides/tools-and-building/custom-plugins.md), remember about making them accessible to everyone.

Our recommendations for custom development:

- Test your code against WCAG 2.1 requirements frequently.
- Use proper color contrast, font size, and semantic HTML.
- If needed, implement additional WAI-ARIA attributes.
- Avoid flashing or blinking content.
- Test your customizations with real users who have different types of disabilities. If you don’t have access to real users, try [Funkify](https://www.funkify.org/), a disability simulator, which can help you step into disabled users' shoes.

::: tip

The quality of custom modifications in Handsontable may impact your application's accessibility level. For this reason, make sure to actively check how these changes influence the overall accessibility of your application, using tools like [Lighthouse](https://developers.google.com/web/tools/lighthouse).

:::

## Ensuring Accessibility standards

We make sure our data grid remains accessible by taking the following steps:

- We check Handsontable's accessibility score with a range of accessibility testing tools.
- We use automated visual regression testing.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated unit and end-to-end tests.

## Known limitations

- Some screen readers may incorrectly read the number of rows and columns when frozen rows and columns are enabled.
- Dynamic ARIA attributes are sometimes omitted by screen readers.

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks.md) related to accessibility, see the following API reference pages:

- [`autoWrapCol`](@/api/options.md#autowrapcol)
- [`autoWrapRow`](@/api/options.md#autowraprow)
- [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
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
