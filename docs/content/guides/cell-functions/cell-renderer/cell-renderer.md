---
type: how-to
title: Cell renderer
metaTitle: Cell renderer - JavaScript Data Grid | Handsontable
description: Create a custom cell renderer function, to have full control over how a cell looks.
permalink: /cell-renderer
canonicalUrl: /cell-renderer
react:
  metaTitle: Cell renderer - React Data Grid | Handsontable
angular:
  metaTitle: Cell renderer - Angular Data Grid | Handsontable
vue:
  metaTitle: Cell renderer - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

A cell renderer is a function that controls how cell content is displayed in the DOM. Override a built-in renderer or write your own to customize the visual output.

[[toc]]

## Use a cell renderer

You can use any of the built-in renderers by specifying their alias name in your column configuration. The example below shows how to use the `numeric` renderer, which formats numeric values according to the cell's formatting options:

::: only-for javascript

```js
const container = document.querySelector("#container");
const hot = new Handsontable(container, {
  data: someData,
  columns: [
    {
      renderer: "numeric",
    },
  ],
});
```

:::

::: only-for react

```jsx
<HotTable
  data={someData}
  columns={[
    {
      renderer: "numeric",
    },
  ]}
/>
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      renderer: "numeric",
    },
  ]
};
```

:::

::: only-for vue

```html
<HotTable :settings="{ columns: [{ renderer: 'numeric' }] }" />
```

:::

::: only-for react

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

::: only-for angular

## Declare a custom renderer as a component

Handsontable's Angular wrapper lets you create custom cell renderers using Angular components. To do so, create a component that extends the base renderer class `HotCellRendererComponent`.

In the Angular wrapper for Handsontable, a renderer can be provided either as an Angular component or as a function. To use your component as a Handsontable renderer, pass it in the `renderer` prop to the `HotTableComponent`, as you would with any other config option.

::: tip

Handsontable's [`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) options require calculating the widths/heights of some of the cells before rendering them into the table. For this reason, it's not currently possible to use them alongside component-based renderers, as they're created after the table's initialization.

Be sure to turn those options off in your Handsontable configuration, as keeping them enabled may cause unexpected results. Please note that [`autoColumnSize`](@/api/options.md#autocolumnsize) is enabled by default.

:::

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-renderer/angular/example1.ts)
@[code](@/content/guides/cell-functions/cell-renderer/angular/example1.html)

:::

You can create and use a custom cell renderer component that utilizes the `rendererProps` property and use them inside the renderer component.

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-renderer/angular/example3.ts)
@[code](@/content/guides/cell-functions/cell-renderer/angular/example3.html)

:::

## Declare a custom renderer as an Angular Template

The Angular wrapper supports using an Angular `TemplateRef` as a renderer. This is particularly useful if you want to leverage the power of Angular templates directly, without creating a full component.

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-renderer/angular/example2.ts)
@[code](@/content/guides/cell-functions/cell-renderer/angular/example2.html)

:::

## Declare a custom renderer as a function

You can also declare a custom renderer for the `HotTable` component by declaring it as a function. In the simplest scenario, you can pass the rendering function as the `renderer` prop into `HotTableComponent`.

The following example implements `@handsontable/angular-wrapper` with a custom renderer added to one of the columns. It takes an image URL as the input and renders the image in the edited cell.

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-renderer/angular/example4.ts)
@[code](@/content/guides/cell-functions/cell-renderer/angular/example4.html)

:::

:::

::: only-for vue

## Declare a custom renderer as a component

Handsontable's Vue wrapper lets you create custom cell renderers using Vue components.

To use a Vue component as a renderer, define the component with `defineComponent`, then write a renderer function that mounts it into the cell `td` element with Vue's `render` and `h` helpers. Mounting with `render(h(Component, props), td)` reuses the same component instance across re-renders -- Vue patches the existing tree instead of remounting it. To pass static props alongside the cell data, merge them into the second argument of `h()`.

::: tip

Handsontable's [`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) options require calculating the widths/heights of some of the cells before rendering them into the table. For this reason, it's not currently possible to use them alongside component-based renderers, as they're created after the table's initialization.

Be sure to turn those options off in your Handsontable configuration, as keeping them enabled may cause unexpected results. Please note that [`autoColumnSize`](@/api/options.md#autocolumnsize) is enabled by default.

:::

::: example #example1 :vue3

@[code](@/content/guides/cell-functions/cell-renderer/vue/example1.vue)

:::

If your component needs access to a Vue application context -- for example, global components, plugins, or `provide` / `inject` -- use `createApp(Component, props).mount(td)` instead of `render()`. Store a reference to the mounted app on the `td` element and call `app.unmount()` at the start of each render call to avoid leaking app instances:

::: example #example2 :vue3

@[code](@/content/guides/cell-functions/cell-renderer/vue/example2.vue)

:::

:::

::: only-for react angular

::: tip

All the sections below describe how to utilize the features available for the Handsontable function-based renderers.

:::

:::

## Register custom cell renderer

To register your own alias use `registerRenderer()` function from the `@handsontable/renderers` package. It takes two arguments:

- `rendererName` - a string representing a renderer function
- `renderer` - a renderer function that will be represented by `rendererName`

If you'd like to register `asteriskDecoratorRenderer` under alias `asterisk` you have to call:

```js
import { registerRenderer } from "@handsontable/renderers";

registerRenderer("asterisk", asteriskDecoratorRenderer);
```

::: only-for angular

::: tip

When using `registerRenderer()`, remember to call it at startup (e.g. in `main.ts` or `AppModule`), not in the component constructor. This ensures the renderer is registered before the table is initialized.

:::

:::

Choose aliases wisely. If you register your renderer under name that is already registered, the target function will be overwritten:

```js
import { registerRenderer } from "@handsontable/renderers";

registerRenderer("text", asteriskDecoratorRenderer);
```

Now `"text"` alias points to `asteriskDecoratorRenderer` function, not the built-in `textRenderer`.

So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is prefixing your aliases with some custom name (for example your GitHub username) to minimize the possibility of name collisions. This is especially important if you want to publish your renderer, because you never know aliases has been registered by the user who uses your renderer.

```js
import { registerRenderer } from "@handsontable/renderers";

registerRenderer("asterisk", asteriskDecoratorRenderer);
```

Someone might already registered such alias

```js
import { registerRenderer } from "@handsontable/renderers";

registerRenderer("my.asterisk", asteriskDecoratorRenderer);
```

That's better.

## Use an alias

The final touch is to use registered aliases. That way users can easily refer to an alias without the need to know the name of the function.

To sum up, a well prepared renderer function should look like this:

```js
import { registerRenderer } from "@handsontable/renderers";

function customRenderer(
  hotInstance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) {
  // ...your custom logic of the renderer
}

// Register an alias
registerRenderer("my.custom", customRenderer);
```

From now on, you can use `customRenderer` like so:

::: only-for javascript

```js
const container = document.querySelector("#container");
const hot = new Handsontable(container, {
  data: someData,
  columns: [
    {
      renderer: "my.custom",
    },
  ],
});
```

:::

::: only-for react

```jsx
<HotTable
  data={someData}
  columns={[
    {
      renderer: "my.custom",
    },
  ]}
/>
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      renderer: "my.custom",
    },
  ]
};
```

:::

::: only-for vue

```html
<HotTable :settings="{ columns: [{ renderer: 'my.custom' }] }" />
```

:::

## Render custom HTML in cells

This example shows how to use custom cell renderers to display HTML content in a cell. This is a very powerful feature. Just remember to escape any HTML code that could be used for XSS attacks.

::: warning Security
Handsontable does not include a built-in HTML sanitizer. When rendering untrusted user HTML, you must supply your own sanitizer via the [`sanitizer`](@/api/options.md#sanitizer) option. Without it, rendering untrusted HTML creates XSS vulnerabilities. See [Security](@/guides/security/security/security.md) for details.
:::

In the below configuration:

- **Title** column uses built-in HTML renderer that allows any HTML. This is unsafe if your data comes from an untrusted source. A Handsontable user can enter `<script>` or other potentially malicious tags using the cell editor.
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

::: only-for angular
::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-renderer/angular/example5.ts)
@[code](@/content/guides/cell-functions/cell-renderer/angular/example5.html)

:::
:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/cell-functions/cell-renderer/vue/example4.vue)

:::

:::

## Render custom HTML in header

You can also put HTML into row and column headers. If you need to attach events to DOM elements like the checkbox below, just remember to identify the element by class name, not by id. This is because row and column headers are duplicated in the DOM tree and id attribute must be unique.

::: warning Security
Handsontable does not include a built-in HTML sanitizer. When header content comes from untrusted sources, supply a [`sanitizer`](@/api/options.md#sanitizer) function to prevent XSS.
:::

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

::: only-for angular
::: example #example6 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-renderer/angular/example6.ts)
@[code](@/content/guides/cell-functions/cell-renderer/angular/example6.html)

:::
:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/cell-functions/cell-renderer/vue/example5.vue)

:::

:::

## Add event listeners in cell renderer function

If you are writing an advanced cell renderer, and you want to add some custom behavior after a certain user action (i.e. after user hover a mouse pointer over a cell) you might be tempted to add an event listener directly to table cell node passed as an argument to the `renderer` function. Unfortunately, this will almost always cause you trouble and you will end up with either performance issues or having the listeners attached to the wrong cell.

This is because Handsontable:

- Calls `renderer` functions multiple times per cell - this can lead to having multiple copies of the same event listener attached to a cell
- Reuses table cell nodes during table scrolling and adding/removing new rows/columns - this can lead to having event listeners attached to the wrong cell

Before deciding to attach an event listener in cell renderer make sure, that there is no [Handsontable event](@/guides/getting-started/events-and-hooks/events-and-hooks.md) that suits your needs. Using _Handsontable events_ system is the safest way to respond to user actions.

If you did't find a suitable _Handsontable event_ put the cell content into a wrapping `<div>`, attach the event listener to the wrapper and then put it into the table cell.

## Performance considerations

Cell renderers are called separately for every displayed cell, during every table render. Table can be rendered multiple times during its lifetime (after table scroll, after table sorting, after cell edit etc.), therefore you should keep your `renderer` functions as simple and fast as possible or you might experience a performance drop, especially when dealing with large sets of data.

If you only need to format the displayed value (e.g., add units, format dates, or apply text transformations), consider using the [`valueFormatter`](@/api/options.md#valueformatter) option instead of a custom renderer. The `valueFormatter` is called before the renderer and focuses solely on value transformation, making it more performant for simple formatting tasks. Use a renderer when you need to modify the DOM structure, add custom HTML elements, or handle complex visual layouts.

## Result

You now have a custom cell renderer that controls how cell content appears in the DOM. You can use a built-in renderer by alias, register and reuse your own with `registerRenderer()`, or write inline renderer functions for full control over the cell's HTML structure.

## Related API

### Overview

A renderer is a function that determines how a cell looks. It's responsible for the complete cell rendering process, including DOM structure creation, content insertion, applying CSS classes, setting accessibility attributes, and managing all visual aspects of the cell.

::: tip

If you only need to format the displayed value (e.g., add units, format dates, or apply text transformations), consider using the [`valueFormatter`](@/api/options.md#valueformatter) option instead. It's more performant and simpler for value-only transformations. Use a renderer when you need to modify the DOM structure, add custom HTML elements, or handle complex visual layouts. See the [`renderer` vs `valueFormatter`](#renderer-vs-valueformatter) section for a detailed comparison.

:::

### Built-in renderers

Handsontable provides 10 built-in renderers that you can use by their alias names. Each renderer is designed for a specific use case:

| Alias | What the renderer does |
|-------|------------------------|
| `autocomplete` | Renders autocomplete cells with suggestions |
| `checkbox` | Renders checkbox cells for boolean values or values defined by [`checkedTemplate`](@/api/options.md#checkedtemplate) and [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate) options |
| `date` | Renders date values with date formatting |
| `dropdown` | Renders dropdown cells with select options |
| `html` | Renders HTML content in cells (allows raw HTML) |
| `numeric` | Renders numeric values with number formatting |
| `password` | Renders password fields (masks the displayed value) |
| `text` | Renders plain text (default renderer) |
| `time` | Renders time values with time formatting |

Using aliases provides a convenient way to specify which renderer should be used without needing to reference the full renderer function. You can change the renderer function associated with an alias without modifying the code that uses it.

### `renderer` vs `valueFormatter`

Handsontable provides two distinct options for controlling how cell values are displayed: [`valueFormatter`](@/api/options.md#valueformatter) and [`renderer`](@/api/options.md#renderer). This section provides a detailed comparison to help you choose the right tool for your use case.

#### What is `renderer`?

The `renderer` option is a function responsible for the complete cell rendering process. It handles DOM structure creation, content insertion (via `innerText` or `innerHTML`), applying CSS classes, setting accessibility attributes, and managing all visual aspects of the cell.

**Function signature:**
```js
renderer(hotInstance, td, row, col, prop, value, cellProperties)
```

**When to use `renderer`:**
- Modify DOM structure (add icons, custom HTML elements, complex layouts)
- Apply custom styling or CSS classes dynamically
- Handle accessibility attributes
- Create interactive elements within cells
- When you need full control over the cell's HTML structure

**Example:**

```js
function customRenderer(hotInstance, td, row, col, prop, value, cellProperties) {
  // Create custom DOM structure
  td.innerHTML = `
    <div class="custom-wrapper">
      <span class="icon">📊</span>
      <span class="value">${value}</span>
    </div>
  `;
}
```

#### What is `valueFormatter`?

The `valueFormatter` option (available since v17.0.0) is a function that transforms cell values before they are displayed. It focuses solely on value transformation and is called by the rendering engine right before the renderer function executes.

**Function signature:**
```js
valueFormatter(value, cellProperties) => formattedValue
```

**When to use `valueFormatter`:**
- Transform displayed values (add prefix, suffix, units)
- Format dates, numbers, or text in a custom way
- Apply simple text transformations
- When you only need to change what is displayed, not how it's rendered

**Example:**

::: only-for javascript

```js
columns: [
  {
    data: 'price',
    valueFormatter(value) {
      return value ? `$${value.toFixed(2)}` : '';
    }
  },
  {
    data: 'weight',
    valueFormatter(value) {
      return value ? `${value} kg` : '';
    }
  }
]
```

:::

::: only-for react

```jsx
columns={[{
  data: 'price',
  valueFormatter(value) {
    return value ? `$${value.toFixed(2)}` : '';
  }
}]}
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      data: 'price',
      valueFormatter(value) {
        return value ? `$${value.toFixed(2)}` : '';
      }
    }
  ]
};
```

:::

::: only-for vue

```html
<HotTable :settings="{
  columns: [{
    data: 'price',
    valueFormatter(value) {
      return value ? `$${value.toFixed(2)}` : '';
    }
  }]
}" />
```

:::

#### Key differences

| Aspect | `valueFormatter` | `renderer` |
|--------|------------------|------------|
| **Purpose** | Transform the value | Complete cell rendering |
| **Scope** | Value transformation only | DOM structure, styling, accessibility |
| **Performance** | Faster (called before renderer) | More overhead (full DOM manipulation) |
| **Use case** | Simple formatting (units, prefixes) | Complex layouts, custom HTML |
| **Returns** | Formatted value | Nothing (modifies DOM directly) |

#### Using `renderer` and `valueFormatter` together

Using both `renderer` and `valueFormatter` together is recommended when you need both value formatting and custom DOM structure. This approach separates concerns: `valueFormatter` handles value transformation, while `renderer` focuses on DOM manipulation. This separation improves maintainability and code clarity. The `valueFormatter` executes first, transforming the value, and then the `renderer` receives the formatted value:

::: only-for javascript

```js
columns: [
  {
    data: 'amount',
    // First, format the value
    valueFormatter(value) {
      return `$${value.toFixed(2)}`;
    },
    // Then, render it with custom DOM structure
    renderer(hotInstance, td, row, col, prop, value, cellProperties) {
      TD.innerHTML = `<div class="amount-cell"><span class="currency">${value}</span></div>`;
    }
  }
]
```

:::

::: only-for react

```jsx
columns={[{
  data: 'amount',
  valueFormatter(value) {
    return `$${value.toFixed(2)}`;
  },
  renderer(hotInstance, TD, row, col, prop, value, cellProperties) {
    TD.innerHTML = `<div class="amount-cell"><span class="currency">${value}</span></div>`;
  }
}]}
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      data: 'amount',
      valueFormatter(value) {
        return `$${value.toFixed(2)}`;
      },
      renderer(hotInstance, td, row, col, prop, value, cellProperties) {
        TD.innerHTML = `<div class="amount-cell"><span class="currency">${value}</span></div>`;
      }
    }
  ]
};
```

:::

::: only-for vue

```html
<HotTable :settings="{
  columns: [{
    data: 'amount',
    valueFormatter(value) {
      return `$${value.toFixed(2)}`;
    },
    renderer(hotInstance, td, row, col, prop, value, cellProperties) {
      td.innerHTML = `<div class='amount-cell'><span class='currency'>${value}</span></div>`;
    }
  }]
}" />
```

:::

In this example, `valueFormatter` adds the currency symbol and formatting, while `renderer` wraps it in a custom DOM structure with additional styling.

### Configuration options and API

::: only-for javascript

**Related guides**

<div class="boxes-list">

- [Custom renderer in React](@/react/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Custom renderer in Angular](@/angular/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Custom renderer in Vue 3](@/vue/guides/cell-functions/cell-renderer/cell-renderer.md)

</div>

:::

**APIs**

<div class="boxes-list">

- [BasePlugin](@/api/basePlugin.md)

</div>

**Configuration options**

<div class="boxes-list">

- [renderer](@/api/options.md#renderer)
- [valueFormatter](@/api/options.md#valueformatter)
- [sanitizer](@/api/options.md#sanitizer)

</div>

**Core methods**

<div class="boxes-list">

- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getCellRenderer()](@/api/core.md#getcellrenderer)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterGetColumnHeaderRenderers](@/api/hooks.md#aftergetcolumnheaderrenderers)
- [afterGetRowHeaderRenderers](@/api/hooks.md#aftergetrowheaderrenderers)
- [afterRenderer](@/api/hooks.md#afterrenderer)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeRenderer](@/api/hooks.md#beforerenderer)

</div>
