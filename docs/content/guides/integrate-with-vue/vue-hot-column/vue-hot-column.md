---
id: 5scw3fdd
title: Using the `HotColumn` component in Vue 2
metaTitle: HotColumn component - Vue 2 Data Grid | Handsontable
description: Configure the Vue 2 data grid's columns, using the props of the "HotColumn" component. Define a custom cell editor or a custom cell renderer.
permalink: /vue-hot-column
canonicalUrl: /vue-hot-column
react:
  id: 0lip32oe
  metaTitle: HotColumn component - Vue 2 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 2
---

# Using the `HotColumn` component in Vue 2

Configure the Vue 2 data grid's columns, using the props of the `HotColumn` component. Define a custom cell editor or a custom cell renderer.

[[toc]]

## Declare column settings

To declare column-specific settings, pass the settings as `hot-column` properties, either separately or wrapped as a `settings` property, exactly as you would for `hot-table`.

::: example #example1 :vue --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/example1.html)
@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/example1.js)

:::

## Array of objects

To work with an array of objects for the `hot-column` component, you need to provide precise information about the data structure for the columns. To do this, refer to the data for a column in properties as `data`.

::: example #example2 :vue --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/example2.html)
@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/example2.js)

:::

## Declare a custom renderer as a component

The wrapper allows creating custom renderers using Vue 2 components. The data you would normally get as arguments of the rendering function will be injected into the rendering component's `$data` object.

To mark a component as a Handsontable renderer, simply add a `hot-renderer` attribute to it.

::: tip

Handsontable's [`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) options require calculating the widths/heights of some of the cells before rendering them into the table. For this reason, it's not currently possible to use them alongside component-based renderers, as they're created after the table's initialization.

Be sure to turn those options off in your Handsontable config, as keeping them enabled may cause unexpected results. Please note that [`autoColumnSize`](@/api/options.md#autocolumnsize) is enabled by default.

:::

::: example #custom-renderer-example :vue --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/custom-renderer-example.html)
@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/custom-renderer-example.js)

:::

For the cell renderers to be independent, renderer components are created for each displayed cell - all of them being clones of the "original" renderer component. For performance reasons, these are cached using the LRU algorithm, which stores a certain amount of entries and overwrites the least recently used ones with fresh ones.

By default, the number of entries available for the cache is set to `3000`, which means 3000 cells can be rendered simultaneously while being read from the cache. However, for larger tables, some of the cells may not be able to be cached, and therefore, their corresponding component would be recreated each time a cell is rendered - this is not great for performance.

To prevent this problem, it is possible to pass the `wrapperRendererCacheSize` option to the `HotTable` component and set it to a number of entries available in the renderer cache.

## Declare a custom editor as a component

You can also utilize the Vue 2 components to create custom editors. To do so, you'll need to create a component compatible with Handsontable's editor class structure. The easiest way to do so is to extend `BaseEditorComponent` - a base editor component exported from `@handsontable/vue`.

This will give you a solid base to build on. Note that the editor component needs to tick all of the boxes that a regular editor does, such as defining the [`getValue`](@/api/baseEditor.md#getvalue), [`setValue`](@/api/baseEditor.md#setvalue), [`open`](@/api/baseEditor.md#open), [`close`](@/api/baseEditor.md#close), and [`focus`](@/api/baseEditor.md#focus) methods. These are abstract in the `BaseEditor`. For more info, check the documentation on [creating custom editors from scratch](@/guides/cell-functions/cell-editor/cell-editor.md#how-to-create-a-custom-editor).

::: example #custom-editor-example :vue --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/custom-editor-example.html)
@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/custom-editor-example.js)

:::

## Use the renderer/editor components with `v-model`

You can also use Vue 2's `v-model` with the renderer and editor components.

In the example below, we're utilizing an input with `v-model` assigned and reading the bound property from the renderer component to highlight the rows entered into the input.

List of row indexes (starting from 0):

::: example #v-model-example :vue --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/v-model-example.html)
@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/v-model-example.js)

:::

## A more advanced example

In this example, several capabilities of the wrapper are combined:

1. Create a custom editor component with an external dependency that will act as both renderer and editor
2. Declare settings for several columns using Vue 2's `v-for`
3. Create a component where the state will be bound by the data retrieved from the first component

::: example #advanced-editor-example :vue-advanced --html 1 --css 2 --js 3

@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/advanced-editor-example.html)
@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/advanced-editor-example.css)
@[code](@/content/guides/integrate-with-vue/vue-hot-column/vue/advanced-editor-example.js)

:::

### 1. Editor component with an external dependency, which will act as both renderer and editor

To use an external editor component with Handsontable, you'll need to create an additional "bridge" component to connect your dependencies and Handsontable's API. This example uses an external color-picker component, [vue-color](https://github.com/xiaokaike/vue-color).

The editor implementation is pretty straightforward: you need to import your dependency, place it in your editor template and attach its events to your editor logic, and you're done!

In our case, we're also adding an "Apply" button, which triggers the Handsontable base editor's `finishEditing` method, so all the heavy lifting regarding passing the new value to the dataset is done for us.

Finally, modify the component template to be used as a renderer _and_ editor. We'll utilize the `isEditor` and `isRenderer` properties, injected into the component instances created by the wrapper. The template will be divided into a render and editor part using Vue's `v-if`.

This component contains some Vuex state logic. Ignore it for now. We'll cover this in the third step.

### 2. Use `v-for` for column declaration

`v-for` is used to declare the second and third columns in a loop. You can bind the loop to your data and retrieve the settings from there.

```html
<hot-table :settings="hotSettings">
  <hot-column :width="120">
    <stars-rating hot-renderer></stars-rating>
  </hot-column>
  <hot-column v-for="n in 2" :width="120" v-bind:key="'col' + n">
    <color-picker hot-editor hot-renderer></color-picker>
  </hot-column>
</hot-table>
```

### 3. Bind the state between components.

As you can see in our first editor/renderer component, we're already committing all of the changes into the applications `$store`. This way, we can easily bind the state of our new component (based on a star-rating component dependency) to the data in the second and third columns.
