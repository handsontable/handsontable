---
type: how-to
title: Custom ID, class, and style
metaTitle: Custom ID, class, and style - JavaScript Data Grid | Handsontable
description: Apply a custom ID, class, and inline style to the Handsontable container, to target the grid with your own CSS or JavaScript selectors.
permalink: /custom-id-class-style
canonicalUrl: /custom-id-class-style
tags:
  - id
  - class
  - classname
  - style
react:
  metaTitle: Custom ID, class, and style - React Data Grid | Handsontable
angular:
  metaTitle: Custom ID, class, and style - Angular Data Grid | Handsontable
vue:
  metaTitle: Custom ID, class, and style - Vue Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

Apply a custom `id`, `class`, and inline `style` to the Handsontable container, to target the grid with your own CSS or JavaScript selectors.

[[toc]]

## Overview

The Handsontable container is a regular DOM element, so you can give it a custom `id`, `class`, and inline `style`. How you set these attributes depends on the framework you use, but two rules apply everywhere:

- `id` is not a configuration option. Handsontable does not read an `id` from the settings object passed to the constructor. The container's `id` comes from the DOM element itself, or from a prop or attribute that the framework wrapper forwards to the container.
- Handsontable assigns a random `id` when the container has none. If the container element has no `id`, or an `id` that starts with `ht_`, Handsontable overwrites it with a generated value in the form `ht_<random>`. To keep a custom `id`, use one that does not start with `ht_`.

::: only-for javascript

## Set the id, class, and style

In the vanilla JavaScript build, the container is the DOM element you pass to the `Handsontable` constructor. Set its `id`, `class`, and `style` on that element before or after initialization.

In the following example, the container receives a custom class and an inline border. Because the element already has the `id` `example1`, Handsontable keeps it. An element with no `id` would instead receive a generated `ht_<random>` value.

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/getting-started/custom-id-class-style/javascript/example1.js)
@[code](@/content/guides/getting-started/custom-id-class-style/javascript/example1.ts)

:::

:::

::: only-for react

## Set the id, class, and style

The `HotTable` component forwards the `id`, `className`, and `style` props to the grid's container element. If you omit `id`, the wrapper assigns a generated value such as `hot-<random>`.

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/custom-id-class-style/react/example1.jsx)
@[code](@/content/guides/getting-started/custom-id-class-style/react/example1.tsx)

:::

:::

::: only-for vue

## Set the id, class, and style

The `HotTable` component forwards the `id`, `class`, and `style` attributes to the grid's container element. If you omit `id`, the wrapper assigns a generated value such as `hot-<random>`.

::: example #example1 :vue3

@[code](@/content/guides/getting-started/custom-id-class-style/vue/example1.vue)

:::

:::

::: only-for angular

## Set the id, class, and style

The Angular wrapper renders the grid into an inner container element nested inside the `<hot-table>` host element. The `id`, `class`, and `style` you set on `<hot-table>` apply to the host element, which wraps the grid. A `class` or `style` on the host therefore still surrounds the grid visually.

The grid's own container element receives an automatically generated `ht_<random>` `id`, so the `id` you set on `<hot-table>` does not become the container's `id`. To target the grid container directly, use a descendant selector such as `hot-table#inventory-grid > div`.

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/custom-id-class-style/angular/example1.ts)
@[code](@/content/guides/getting-started/custom-id-class-style/angular/example1.html)

:::

:::

## Result

The grid container has your custom `class` and inline `style` applied, so you can target it with your own CSS or JavaScript selectors. The container's `id` is the one you set, or a generated `ht_<random>` value when none is provided.
