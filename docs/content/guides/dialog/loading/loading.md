---
id: 2yi2yfl5
title: Loading
metaTitle: Loading - JavaScript Data Grid | Handsontable
description: Display loading indicators and progress feedback in your data grid application using the Loading plugin.
permalink: /loading
canonicalUrl: /loading
tags:
  - loading
  - dialog
  - modal
  - progress
  - spinner
  - indicator
react:
  id: 66z4zjaz
  metaTitle: Loading - React Data Grid | Handsontable
angular:
  id: wq2llzfz
  metaTitle: Loading - Angular Data Grid | Handsontable
searchCategory: Guides
category: Dialog
---

# Loading

Display loading indicators and progress feedback in your data grid application using the Loading plugin.

[[toc]]

## Overview

The Loading plugin provides a loading overlay for Handsontable using the [Dialog](@/api/dialog.md) plugin. It displays a loading indicator with a customizable title, icon, and description. This is useful for showing progress feedback during data operations, API calls, or any other time-consuming tasks.

With simplicity and effectiveness in mind, the loading plugin was designed to provide a consistent user experience with customizable appearance and behavior. It requires the [Dialog](@/api/dialog.md) plugin to be enabled to function properly.

## Basic configuration

To enable the Loading plugin, set the [`loading`](@/api/options.md#loading) option to `true` or provide a configuration object.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/dialog/loading/javascript/example1.js)
@[code](@/content/guides/dialog/loading/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/dialog/loading/react/example1.jsx)
@[code](@/content/guides/dialog/loading/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/loading/angular/example1.ts)
@[code](@/content/guides/dialog/loading/angular/example1.html)

:::

:::

## Custom configuration

The loading dialog supports customization of the icon, title, and description.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/dialog/loading/javascript/example2.js)
@[code](@/content/guides/dialog/loading/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/dialog/loading/react/example2.jsx)
@[code](@/content/guides/dialog/loading/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/loading/angular/example2.ts)
@[code](@/content/guides/dialog/loading/angular/example2.html)

:::

:::

## Real-world usage

Here are some common scenarios where the loading dialog is useful:

::: only-for javascript

::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/dialog/loading/javascript/example3.html)
@[code](@/content/guides/dialog/loading/javascript/example3.js)
@[code](@/content/guides/dialog/loading/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/dialog/loading/react/example3.jsx)
@[code](@/content/guides/dialog/loading/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/loading/angular/example3.ts)
@[code](@/content/guides/dialog/loading/angular/example3.html)

:::

:::

## Loading with Pagination plugin

The example below demonstrates how to use the Loading plugin with pagination in external container:

::: only-for javascript

::: example #example4 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/dialog/loading/javascript/example4.html)
@[code](@/content/guides/dialog/loading/javascript/example4.css)
@[code](@/content/guides/dialog/loading/javascript/example4.js)
@[code](@/content/guides/dialog/loading/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2 --css 3

@[code](@/content/guides/dialog/loading/react/example4.jsx)
@[code](@/content/guides/dialog/loading/react/example4.tsx)
@[code](@/content/guides/dialog/loading/react/example4.css)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/dialog/loading/angular/example4.ts)
@[code](@/content/guides/dialog/loading/angular/example4.html)

:::

:::

## Localize loading

Translate default loading dialog labels using the global translations mechanism. The loading dialog introduces the following keys to the language dictionary that you can use to translate the loading UI:

- `LOADING_TITLE = 'Loading...'`

To learn more about the translation mechanism, see the [Languages guide](@/guides/internationalization/language/language.md).

## Related API reference

- [Options: `loading`](@/api/options.md#loading)
- [Options: `dialog`](@/api/options.md#dialog)
- [Plugins: `Loading`](@/api/loading.md)
- [Plugins: `Dialog`](@/api/dialog.md)
