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

The Loading plugin provides a loading overlay system for Handsontable using the [Dialog](@/api/dialog.md) plugin. It displays a loading indicator with customizable title, icon, and description. This is useful for showing progress feedback during data operations, API calls, or any other time-consuming tasks.

The loading system is designed to be simple and effective, providing a consistent user experience with customizable appearance and behavior. It requires the [Dialog](@/api/dialog.md) plugin to be enabled to function properly.

## Basic configuration

To enable the Loading plugin, set the [`loading`](@/api/options.md#loading) option to `true` or provide a configuration object. Note that the Dialog plugin must also be enabled.

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

## Localize loading

Translate default loading dialog labels using the global translations mechanism. The loading dialog introduces the following keys to the language dictionary that you can use to translate the loading UI:

- `LOADING_TITLE = 'Loading...'`

## Related API reference

- [Options: `loading`](@/api/options.md#loading)
- [Options: `dialog`](@/api/options.md#dialog)
- [Plugins: `Loading`](@/api/loading.md)
- [Plugins: `Dialog`](@/api/dialog.md)
