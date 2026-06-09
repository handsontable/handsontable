---
type: how-to
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
vue:
  id: odrgfc3c
  metaTitle: Loading - Vue Data Grid | Handsontable
searchCategory: Guides
category: Dialog
---
Display loading indicators and progress feedback in your data grid application using the Loading plugin.

[[toc]]

## Overview

The Loading plugin provides a loading overlay for Handsontable using the [Dialog](@/api/dialog.md) plugin. It displays a loading indicator with a customizable title, icon, and description. This is useful for showing progress feedback during data operations, API calls, or any other time-consuming tasks.

With simplicity and effectiveness in mind, the loading plugin was designed to provide a consistent user experience with customizable appearance and behavior. It requires the [Dialog](@/api/dialog.md) plugin to be enabled to function properly.

## Basic configuration

To enable the Loading plugin, set the [`loading`](@/api/options.md#loading) option to `true` or provide a configuration object.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code collapse={7-28,35-84}](@/content/guides/dialog/loading/javascript/example1.js)
@[code collapse={7-28,36-85}](@/content/guides/dialog/loading/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code collapse={8-29,60-90}](@/content/guides/dialog/loading/react/example1.jsx)
@[code collapse={8-29,60-88}](@/content/guides/dialog/loading/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code collapse={20-41,44-94}](@/content/guides/dialog/loading/angular/example1.ts)
@[code](@/content/guides/dialog/loading/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code collapse={11-32,54-56}](@/content/guides/dialog/loading/vue/example1.vue)

:::

:::

## Custom configuration

The loading dialog supports customization of the icon, title, and description.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code collapse={7-28,35-84}](@/content/guides/dialog/loading/javascript/example2.js)
@[code collapse={7-28,36-85}](@/content/guides/dialog/loading/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code collapse={8-29,64-94}](@/content/guides/dialog/loading/react/example2.jsx)
@[code collapse={8-29,64-92}](@/content/guides/dialog/loading/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code collapse={20-41,44-94}](@/content/guides/dialog/loading/angular/example2.ts)
@[code](@/content/guides/dialog/loading/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code collapse={11-32,54-56}](@/content/guides/dialog/loading/vue/example2.vue)

:::

:::

## Real-world usage

Here are some common scenarios where the loading dialog is useful:

::: only-for javascript

::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/dialog/loading/javascript/example3.html)
@[code collapse={12-61,84-95}](@/content/guides/dialog/loading/javascript/example3.js)
@[code collapse={13-62,86-97}](@/content/guides/dialog/loading/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code collapse={26-56,84-95}](@/content/guides/dialog/loading/react/example3.jsx)
@[code collapse={26-54,85-96}](@/content/guides/dialog/loading/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code collapse={32-81,118-129}](@/content/guides/dialog/loading/angular/example3.ts)
@[code](@/content/guides/dialog/loading/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code collapse={51-62,86-88}](@/content/guides/dialog/loading/vue/example3.vue)

:::

:::

## Loading with Pagination plugin

The example below demonstrates how to use the Loading plugin with pagination in external container:

::: only-for javascript

::: example #example4 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/dialog/loading/javascript/example4.html)
@[code](@/content/guides/dialog/loading/javascript/example4.css)
@[code collapse={13-62,96-125}](@/content/guides/dialog/loading/javascript/example4.js)
@[code collapse={14-63,98-127}](@/content/guides/dialog/loading/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2 --css 3

@[code collapse={26-56,108-137}](@/content/guides/dialog/loading/react/example4.jsx)
@[code collapse={26-54,108-137}](@/content/guides/dialog/loading/react/example4.tsx)
@[code](@/content/guides/dialog/loading/react/example4.css)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code collapse={55-104,162-191}](@/content/guides/dialog/loading/angular/example4.ts)
@[code](@/content/guides/dialog/loading/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3 --css 1

@[code](@/content/guides/dialog/loading/vue/example4.css)
@[code collapse={78-107,122-124}](@/content/guides/dialog/loading/vue/example4.vue)

:::

:::

## Localize loading

Translate default loading dialog labels using the global translations mechanism. The loading dialog introduces the following keys to the language dictionary that you can use to translate the loading UI:

- `LOADING_TITLE = 'Loading...'`

To learn more about the translation mechanism, see the [Languages guide](@/guides/internationalization/language/language.md).

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 16.2.0: Simplified theming and advanced user notifications](https://handsontable.com/blog/handsontable-16.2.0-simplified-theming-and-advanced-user-notifications)
- [Handsontable 16.1: Row Pagination, Loading Plugin, and Long-Term Support Policy](https://handsontable.com/blog/handsontable-16.1-row-pagination-loading-plugin-and-long-term-support-policy)

</div>

## Related API reference

<div class="boxes-list">

- [Options: `loading`](@/api/options.md#loading)
- [Options: `dialog`](@/api/options.md#dialog)
- [Plugins: `Loading`](@/api/loading.md)
- [Plugins: `Dialog`](@/api/dialog.md)

</div>
