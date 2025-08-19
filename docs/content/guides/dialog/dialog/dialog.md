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

To enable the Dialog plugin, set the [`dialog`](@/api/options.md#dialog) option to `true` or provide a [`configuration object`](@/guides/dialog/dialog/dialog.md#configuration-options).

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

## Background variants

The dialog supports two background variants: `solid` and `semi-transparent`.

### Solid background

::: only-for javascript

::: example #example4 --js 1 --ts 2

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

### Semi-transparent background

::: only-for javascript

::: example #example5 --js 1 --ts 2

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


## Content layout directions

The dialog content can be arranged in different directions using the `contentDirections` option.

::: only-for javascript

::: example #example7 --html 1 --js 2 --ts 3

@[code](@/content/guides/dialog/dialog/javascript/example7.html)
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

## API reference

### Plugin methods

| Method           | Description                                    |
|------------------|------------------------------------------------|
| `show(options?)` | Shows the dialog with optional configuration   |
| `hide()`         | Hides the currently open dialog                |
| `isVisible()`    | Returns whether the dialog is currently visible|
| `update(options)`| Updates the dialog configuration               |

### Configuration options

| Option             | Type                                                                            | Default  | Description                                                 |
|--------------------|---------------------------------------------------------------------------------|----------|-------------------------------------------------------------|
| `content`          | <code>string &#124; HTMLElement &#124; DocumentFragment</code>                  | `''`     | The content to display in the dialog                        |
| `customClassName`  | `string`                                                                        | `''`     | Custom CSS class name to apply to the dialog container      |
| `background`       | <code>'solid' &#124; 'semi-transparent'</code>                                  | `'solid'`| Dialog background variant                                   |
| `contentBackground`| `boolean`                                                                       | `false`  | Whether to show content background                          |
| `contentDirections`| <code>'row' &#124; 'row-reverse' &#124; 'column' &#124; 'column-reverse'</code> | `'row'`  | Content layout direction                                    |
| `animation`        | `boolean`                                                                       | `true`   | Whether to enable animations when showing/hiding the dialog |
| `closable`         | `boolean`                                                                       | `false`  | Whether the dialog can be closed by user interaction        |

### Hooks

The Dialog plugin provides several hooks:

| Hook               | Description                           |
|--------------------|---------------------------------------|
| `beforeDialogShow` | Fired before the dialog is shown      |
| `afterDialogShow`  | Fired after the dialog is shown       |
| `beforeDialogHide` | Fired before the dialog is hidden     |
| `afterDialogHide`  | Fired after the dialog is hidden      |
| `afterDialogFocus` | Fired after the dialog receives focus |

## Related API reference

- [Options: `dialog`](@/api/options.md#dialog)
- [Plugins: `Dialog`](@/api/dialog.md)
