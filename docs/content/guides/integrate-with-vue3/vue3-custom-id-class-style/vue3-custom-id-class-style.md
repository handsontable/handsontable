---
type: how-to
id: 2kg0f1og
title: Custom ID, Class and other attributes in Vue 3
metaTitle: Custom ID, class, and style - Vue 3 Data Grid | Handsontable
description: Pass a custom ID, class, and style to the "HotTable" component, to further customize your Vue 3 data grid.
permalink: /vue3-custom-id-class-style
canonicalUrl: /vue3-custom-id-class-style
react:
  id: jeuzzosp
  metaTitle: Custom ID, class, and style - Vue 3 Data Grid | Handsontable
angular:
  id: 9zzwqp3r
  metaTitle: Custom ID, class, and style - Vue 3 Data Grid | Handsontable
vue:
  id: g8a1yt31
searchCategory: Guides
category: Integrate with Vue 3
---
Pass `id`, `className`, and `style` props to the HotTable component to control its HTML attributes and appearance.

[[toc]]

## Overview

Custom `id`, `class`, `style`, and other attributes can be passed into the `hot-table` wrapper element.
Each of them will be applied to the root Handsontable element, allowing further customization of the table.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

## Example

::: example #example1 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-custom-id-class-style/vue/example1.html)
@[code](@/content/guides/integrate-with-vue3/vue3-custom-id-class-style/vue/example1.js)

:::

## Result

The rendered `HotTable` element has the custom `id`, `class`, and `style` attributes applied directly to its root DOM element, making it straightforward to target with CSS or JavaScript selectors.
