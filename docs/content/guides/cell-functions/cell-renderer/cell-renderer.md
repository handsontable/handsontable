---
id: ohjf69hj
title: Cell renderer
metaTitle: Cell renderer - JavaScript Data Grid | Handsontable
description: Create a custom cell renderer function, to have full control over how a cell looks.
permalink: /cell-renderer
canonicalUrl: /cell-renderer
react:
  id: 2ej30mcg
  metaTitle: Cell renderer - React Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

# Cell renderer

Create a custom cell renderer function, to have full control over how a cell looks.

[[toc]]

::: only-for javascript

## Overview

When you create a renderer, a good idea is to assign it as an alias that will refer to this particular renderer function. Handsontable defines 10 aliases by default:

- `autocomplete` for `Handsontable.renderers.AutocompleteRenderer`
- `base` for `Handsontable.renderers.BaseRenderer`
- `checkbox` for `Handsontable.renderers.CheckboxRenderer`
- `date` for `Handsontable.renderers.DateRenderer`
- `dropdown` for `Handsontable.renderers.DropdownRenderer`
- `html` for `Handsontable.renderers.HtmlRenderer`
- `numeric` for `Handsontable.renderers.NumericRenderer`
- `password` for `Handsontable.renderers.PasswordRenderer`
- `text` for `Handsontable.renderers.TextRenderer`
- `time` for `Handsontable.renderers.TimeRenderer`

It gives users a convenient way for defining which renderer should be used when table rendering was triggered. User doesn't need to know which renderer function is responsible for displaying the cell value, he does not even need to know that there is any function at all. What is more, you can change the render function associated with an alias without a need to change code that defines a table.

:::

::: only-for react

## Overview

A renderer is a function that determines how a cell looks.

Set together, a renderer, [editor](@/guides/cell-functions/cell-editor/cell-editor.md) and [validator](@/guides/cell-functions/cell-validator/cell-validator.md) form a [cell type](@/guides/cell-types/cell-type/cell-type.md).

## Declare a custom renderer as a component

Handsontable's React wrapper lets you create custom cell renderers using React components.

To use your component as a Handsontable renderer, pass it in the `renderer` prop if either `HotTable` or `HotColumn` components, as you would with any other config option.

::: tip

Handsontable's [`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) options require calculating the widths/heights of some of the cells before rendering them into the table. For this reason, it's not currently possible to use them alongside component-based renderers, as they're created after the table's initialization.

Be sure to turn those options off in your Handsontable configuration, as keeping them enabled may cause unexpected results. Please note that [`autoColumnSize`](@/api/options.md#autocolumnsize) is enabled by default.

:::

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-renderer/react/example1.jsx)
@[code](@/content/guides/cell-functions/cell-renderer/react/example1.tsx)

:::

## Use the renderer component within React's Context

In this example, React's `Context` passes information available in the main app component to the renderer. In this case, we're using just the renderer, but the same principle works with [editors](@/guides/cell-functions/cell-editor/cell-editor.md) as well.

::: example #example2 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-functions/cell-renderer/react/example2.css)
@[code](@/content/guides/cell-functions/cell-renderer/react/example2.jsx)
@[code](@/content/guides/cell-functions/cell-renderer/react/example2.tsx)

:::

## Declare a custom renderer as a function

You can also declare a custom renderer for the `HotTable` component by declaring it as a function. In the simplest scenario, you can pass the rendering function as the `hotRenderer` prop into `HotTable` or `HotColumn`.
If you need the renderer to be a part of a `columns` config array, declare it under the `renderer` key. 

The following example implements `@handsontable/react-wrapper` with a custom renderer added to one of the columns. It takes an image URL as the input and renders the image in the edited cell.

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-renderer/react/example3.jsx)
@[code](@/content/guides/cell-functions/cell-renderer/react/example3.tsx)

:::

:::

::: only-for javascript

## Use a cell renderer

Use the renderer name of your choice when configuring the column:

:::

::: only-for react

::: tip

All the sections below describe how to utilize the features available for the Handsontable function-based renderers.

:::

### Overview

When you create a renderer, a good idea is to assign it as an alias that will refer to this particular renderer function. Handsontable defines 10 aliases by default:

- `autocomplete` for `Handsontable.renderers.AutocompleteRenderer`
- `base` for `Handsontable.renderers.BaseRenderer`
- `checkbox` for `Handsontable.renderers.CheckboxRenderer`
- `date` for `Handsontable.renderers.DateRenderer`
- `dropdown` for `Handsontable.renderers.DropdownRenderer`
- `html` for `Handsontable.renderers.HtmlRenderer`
- `numeric` for `Handsontable.renderers.NumericRenderer`
- `password` for `Handsontable.renderers.PasswordRenderer`
- `text` for `Handsontable.renderers.TextRenderer`
- `time` for `Handsontable.renderers.TimeRenderer`

It gives users a convenient way for defining which renderer should be used when table rendering was triggered. User doesn't need to know which renderer function is responsible for displaying the cell value, he does not even need to know that there is any function at all. What is more, you can change the render function associated with an alias without a need to change code that defines a table.

::: tip

You can set a cell's [`renderer`](@/api/options.md#renderer), [`editor`](@/api/options.md#editor) or [`validator`](@/api/options.md#validator) individually, but you still need to set that cell's [`type`](@/api/options.md#type). For example:

:::

```js
renderer: Handsontable.NumericRenderer,
editor: Handsontable.editors.NumericEditor,
validator: Handsontable.NumericValidator,
type: 'numeric',
```

### Use a cell renderer

It is possible to register your renderer and re-use it with the name you registered it under.

:::

::: only-for javascript

```js
const container = document.querySelector('#container');
const hot = new Handsontable(container, {
  data: someData,
  columns: [{
    renderer: 'numeric'
  }]
});
```

:::

::: only-for react

```jsx
<HotTable
  data={someData}
  columns={[{
    renderer: 'numeric'
  }]}
/>
```

:::

::: only-for javascript

## Register custom cell renderer

:::

::: only-for react

### Register custom cell renderer

:::

To register your own alias use `Handsontable.renderers.registerRenderer()` function. It takes two arguments:

- `rendererName` - a string representing a renderer function
- `renderer` - a renderer function that will be represented by `rendererName`

If you'd like to register `asterixDecoratorRenderer` under alias `asterix` you have to call:

```js
Handsontable.renderers.registerRenderer('asterix', asterixDecoratorRenderer);
```

Choose aliases wisely. If you register your renderer under name that is already registered, the target function will be overwritten:

```js
Handsontable.renderers.registerRenderer('text', asterixDecoratorRenderer);
```

Now 'text' alias points to `asterixDecoratorRenderer` function, not `Handsontable.renderers.TextRenderer`.

So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is prefixing your aliases with some custom name (for example your GitHub username) to minimize the possibility of name collisions. This is especially important if you want to publish your renderer, because you never know aliases has been registered by the user who uses your renderer.

```js
Handsontable.renderers.registerRenderer('asterix', asterixDecoratorRenderer);
```

Someone might already registered such alias

```js
Handsontable.renderers.registerRenderer('my.asterix', asterixDecoratorRenderer);
```

That's better.

::: only-for javascript

## Use an alias

:::

::: only-for react

### Use an alias

:::

The final touch is to using the registered aliases, so that users can easily refer to it without the need to now the actual renderer function is.

To sum up, a well prepared renderer function should look like this:

```js
function customRenderer(hotInstance, td, row, column, prop, value, cellProperties) {
  // Optionally include `BaseRenderer` which is responsible for
  // adding/removing CSS classes to/from the table cells.
  Handsontable.renderers.BaseRenderer.apply(this, arguments);

  // ...your custom logic of the renderer
}

// Register an alias
Handsontable.renderers.registerRenderer('my.custom', customRenderer);
```

From now on, you can use `customRenderer` like so:

::: only-for javascript

```js
const container = document.querySelector('#container');
const hot = new Handsontable(container, {
  data: someData,
  columns: [{
    renderer: 'my.custom'
  }]
});
```

:::

::: only-for react

```jsx
<HotTable
  data={someData}
  columns={[{
    renderer: 'my.custom'
  }]}
/>
```

:::

::: only-for javascript

## Render custom HTML in cells

:::

::: only-for react

### Render custom HTML in cells

:::

This example shows how to use custom cell renderers to display HTML content in a cell. This is a very powerful feature. Just remember to escape any HTML code that could be used for XSS attacks. In the below configuration:

- **Title** column uses built-in HTML renderer that allows any HTML. This is unsafe if your code comes from untrusted source. Take notice that a Handsontable user can use it to enter `<script>` or other potentially malicious tags using the cell editor!
- **Description** column also uses HTML renderer (same as above)
- **Comments** column uses a custom renderer (`safeHtmlRenderer`). This should be safe for user input, because only certain tags are allowed
- **Cover** column accepts image URL as a string and converts it to a `<img>` in the renderer

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-renderer/javascript/example4.js)
@[code](@/content/guides/cell-functions/cell-renderer/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-renderer/react/example4.jsx)
@[code](@/content/guides/cell-functions/cell-renderer/react/example4.tsx)

:::

:::

::: only-for javascript

## Render custom HTML in header

:::

::: only-for react

### Render custom HTML in header

:::

You can also put HTML into row and column headers. If you need to attach events to DOM elements like the checkbox below, just remember to identify the element by class name, not by id. This is because row and column headers are duplicated in the DOM tree and id attribute must be unique.

::: only-for javascript

::: example #example5 --js 2 --ts 3 --html 1

@[code](@/content/guides/cell-functions/cell-renderer/javascript/example5.html)
@[code](@/content/guides/cell-functions/cell-renderer/javascript/example5.js)
@[code](@/content/guides/cell-functions/cell-renderer/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-renderer/react/example5.jsx)
@[code](@/content/guides/cell-functions/cell-renderer/react/example5.tsx)

:::

:::

::: only-for javascript

## Add event listeners in cell renderer function

:::

::: only-for react

### Add event listeners in cell renderer function

:::

If you are writing an advanced cell renderer, and you want to add some custom behavior after a certain user action (i.e. after user hover a mouse pointer over a cell) you might be tempted to add an event listener directly to table cell node passed as an argument to the `renderer` function. Unfortunately, this will almost always cause you trouble and you will end up with either performance issues or having the listeners attached to the wrong cell.

This is because Handsontable:

- Calls `renderer` functions multiple times per cell - this can lead to having multiple copies of the same event listener attached to a cell
- Reuses table cell nodes during table scrolling and adding/removing new rows/columns - this can lead to having event listeners attached to the wrong cell

Before deciding to attach an event listener in cell renderer make sure, that there is no [Handsontable event](@/guides/getting-started/events-and-hooks/events-and-hooks.md) that suits your needs. Using _Handsontable events_ system is the safest way to respond to user actions.

If you did't find a suitable _Handsontable event_ put the cell content into a wrapping `<div>`, attach the event listener to the wrapper and then put it into the table cell.

## Performance considerations

Cell renderers are called separately for every displayed cell, during every table render. Table can be rendered multiple times during its lifetime (after table scroll, after table sorting, after cell edit etc.), therefore you should keep your `renderer` functions as simple and fast as possible or you might experience a performance drop, especially when dealing with large sets of data.

::: only-for javascript

## Related articles

### Related guides

<div class="boxes-list gray">

- [Custom renderer in React](@/react/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Custom renderer in Angular](@/guides/integrate-with-angular/angular-custom-renderer-example/angular-custom-renderer-example.md)
- [Custom renderer in Vue 2](@/guides/integrate-with-vue/vue-custom-renderer-example/vue-custom-renderer-example.md)
- [Custom renderer in Vue 3](@/guides/integrate-with-vue3/vue3-custom-renderer-example/vue3-custom-renderer-example.md)

</div>

### Related API reference

:::

::: only-for react

## Related API reference

:::

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`renderer`](@/api/options.md#renderer)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getCellRenderer()`](@/api/core.md#getcellrenderer)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`afterRenderer`](@/api/hooks.md#afterrenderer)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeRenderer`](@/api/hooks.md#beforerenderer)
