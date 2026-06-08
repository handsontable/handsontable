---
type: how-to
id: n5t2hq7r
title: Custom ID, class, and style
metaTitle: Custom ID, class, and style - Javascript Data Grid | Handsontable
description: Pass a custom ID, class, and style to the HotTable component, to further customize your Vue 3 data grid.
permalink: /vue-custom-id-class-style
canonicalUrl: /vue-custom-id-class-style
vue:
  metaTitle: Custom ID, class, and style - Vue Data Grid | Handsontable
searchCategory: Guides
onlyFor: vue
category: Getting started
---

Pass `id`, `className`, and `style` props to the HotTable component to control its HTML attributes and appearance.

[[toc]]

## Overview

Custom `id`, `class`, `style`, and other attributes can be passed into the `hot-table` wrapper element.
Each of them will be applied to the root Handsontable element, allowing further customization of the table.

[Find out which Vue 3 versions are supported](@/guides/getting-started/installation/installation.md#supported-versions-of-vue)

## Example

::: example #example1 :vue3

@[code](@/content/guides/getting-started/vue3-custom-id-class-style/vue/example1.vue)

:::

## Result

The rendered `HotTable` element has the custom `id`, `class`, and `style` attributes applied directly to its root DOM element, making it straightforward to target with CSS or JavaScript selectors.
