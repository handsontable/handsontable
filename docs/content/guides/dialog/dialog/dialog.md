---
id: 1xi1xek4
title: Dialog
metaTitle: Dialog - JavaScript Data Grid | Handsontable
description: Display modal dialogs, alerts, loading indicators, and notifications to enhance user interaction and provide feedback in your data grid application.
permalink: /dialog
canonicalUrl: /dialog
tags:
  - dialog
  - modal
  - popup
  - alert
  - confirm
  - prompt
react:
  id: 55z3zjaz
  metaTitle: Dialog - React Data Grid | Handsontable
angular:
  id: vq1llzfz
  metaTitle: Dialog - Angular Data Grid | Handsontable
searchCategory: Guides
category: Dialog
---

# Dialog

Display modal dialogs, alerts, loading indicators, and notifications to enhance user interaction and provide feedback in your data grid application.

[[toc]]

## Overview

The Dialog plugin provides a modal dialog system for Handsontable that allows you to display custom content in modal dialogs that overlay the table. This is useful for showing notifications, error messages, loading indicators, or any other interactive content that requires user attention.

The dialog system is designed to be flexible and customizable, supporting various content types including plain text, HTML, and DOM elements. It also provides options for styling, animations, and user interaction controls.

## Basic configuration

To enable the Dialog plugin, set the [`dialog`](@/api/options.md#dialog) option to `true` or provide a configuration object.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/javascript/example1.js)
@[code](@/content/guides/dialog/dialog/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example1.jsx)
@[code](@/content/guides/dialog/dialog/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example1.ts)
@[code](@/content/guides/dialog/dialog/angular/example1.html)

:::

:::

## Content types

The dialog supports multiple content types including plain text, HTML strings, and DOM elements.

### Plain text content

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/javascript/example2.js)
@[code](@/content/guides/dialog/dialog/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example2.jsx)
@[code](@/content/guides/dialog/dialog/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example2.ts)
@[code](@/content/guides/dialog/dialog/angular/example2.html)

:::

### HTML content

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/javascript/example3.js)
@[code](@/content/guides/dialog/dialog/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example3.jsx)
@[code](@/content/guides/dialog/dialog/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example3.ts)
@[code](@/content/guides/dialog/dialog/angular/example3.html)

:::

:::

## Template types

As the `content` option allows you to use plain text, HTML strings, and DOM elements, the `template` option allows you to use predefined dialog templates instead of custom content which can be useful for displaying alerts, confirmations, and other common ready-to-use dialogs.

The plugin offers two new methods to display predefined dialog templates: [`showAlert`](@/api/dialog.md#showalert) and [`showConfirm`](@/api/dialog.md#showconfirm). For users looking for more customizability, the [`show`](@/api/dialog.md#show) method allows using templates with other options that the dialog offers, such as background variants, content background, and more.

::: only-for javascript
::: example #example4 --html 1 --js 2 --ts 3

@[code](@/content/guides/dialog/dialog/javascript/example4.html)
@[code](@/content/guides/dialog/dialog/javascript/example4.js)
@[code](@/content/guides/dialog/dialog/javascript/example4.ts)

:::
:::

::: only-for react
::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example4.jsx)
@[code](@/content/guides/dialog/dialog/react/example4.tsx)

:::
:::

::: only-for angular
::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example4.ts)
@[code](@/content/guides/dialog/dialog/angular/example4.html)

:::
:::

## Background variants

The dialog supports two background variants: `solid` and `semi-transparent`.

::: only-for javascript

::: example #example5 --html 1 --js 2 --ts 3

@[code](@/content/guides/dialog/dialog/javascript/example5.html)
@[code](@/content/guides/dialog/dialog/javascript/example5.js)
@[code](@/content/guides/dialog/dialog/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example5.jsx)
@[code](@/content/guides/dialog/dialog/react/example5.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example5.ts)
@[code](@/content/guides/dialog/dialog/angular/example5.html)

:::

:::

## Content background

The dialog content can have a background color using the `contentBackground` option.

::: only-for javascript

::: example #example6 --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/javascript/example6.js)
@[code](@/content/guides/dialog/dialog/javascript/example6.ts)

:::

:::

::: only-for react

::: example #example6 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example6.jsx)
@[code](@/content/guides/dialog/dialog/react/example6.tsx)

:::

:::

::: only-for angular

::: example #example6 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example6.ts)
@[code](@/content/guides/dialog/dialog/angular/example6.html)

:::

:::


## Dialog accessibility

The dialog plugin provides accessibility features through ARIA attributes. You can configure the dialog's accessibility properties using the `a11y` option, which includes:

- `role` - Sets the ARIA role (defaults to "dialog")
- `ariaLabel` - Sets the dialog's accessible name (defaults to "Dialog"). This is used when there is no visible dialog title that can be referenced by `ariaLabelledby`. If both `ariaLabel` and `ariaLabelledby` are provided, `ariaLabelledby` takes precedence
- `ariaLabelledby` - References an element that labels the dialog
- `ariaDescribedby` - References an element that describes the dialog

::: only-for javascript

::: example #example7 --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/javascript/example7.js)
@[code](@/content/guides/dialog/dialog/javascript/example7.ts)

:::

:::

::: only-for react

::: example #example7 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example7.jsx)
@[code](@/content/guides/dialog/dialog/react/example7.tsx)

:::

:::

::: only-for angular

::: example #example7 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example7.ts)
@[code](@/content/guides/dialog/dialog/angular/example7.html)

:::

:::

## Programmatic control

You can control the dialog programmatically using the plugin's methods.

### Show and hide dialog

::: only-for javascript

::: example #example8 --html 1 --js 2 --ts 3

@[code](@/content/guides/dialog/dialog/javascript/example8.html)
@[code](@/content/guides/dialog/dialog/javascript/example8.js)
@[code](@/content/guides/dialog/dialog/javascript/example8.ts)

:::

:::

::: only-for react

::: example #example8 :react --js 1 --ts 2

@[code](@/content/guides/dialog/dialog/react/example8.jsx)
@[code](@/content/guides/dialog/dialog/react/example8.tsx)

:::

:::

::: only-for angular

::: example #example8 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/dialog/angular/example8.ts)
@[code](@/content/guides/dialog/dialog/angular/example8.html)

:::

:::

## Related API reference

- [Options: `dialog`](@/api/options.md#dialog)
- [Plugins: `Dialog`](@/api/dialog.md)
