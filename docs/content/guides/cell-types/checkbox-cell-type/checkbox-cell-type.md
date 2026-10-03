---
type: how-to
title: Checkbox cell type
metaTitle: Checkbox cell type - JavaScript Data Grid | Handsontable
description: Create interactive elements that can be checked or unchecked, by using the checkbox cell type.
permalink: /checkbox-cell-type
canonicalUrl: /checkbox-cell-type
react:
  metaTitle: Checkbox cell type - React Data Grid | Handsontable
angular:
  metaTitle: Checkbox cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Checkbox cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
menuTag: updated
---
Create interactive elements that can be checked or unchecked, by using the checkbox cell type.

The checkbox cell type renders a boolean value as a clickable checkbox. Use it for yes/no, active/inactive, or any true/false data.

[[toc]]

## Overview

Data in these cells will be rendered as a checkbox and you can easily change it by checking/unchecking the checkbox.

To check the box, use the mouse or press <kbd>**Space**</kbd> or <kbd>**Enter**</kbd>.

To uncheck the box, use the mouse or press <kbd>**Space**</kbd>, <kbd>**Enter**</kbd>, <kbd>**Delete**</kbd> or <kbd>**Backspace**</kbd>.

You can change the state of multiple cells at once by selecting the cells you want to change and pressing <kbd>**Space**</kbd>.

To let users select whole rows with checkboxes and a "select all" checkbox, without storing the checked state in your data, use [row selection](@/guides/rows/row-selection/row-selection.md) instead.

## Checkbox true/false values

This is the default usage scenario where column data has a `true` or `false` value, and we only want to display checkboxes.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/checkbox-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-types/checkbox-cell-type/vue/example1.vue)

:::

:::

## Checkbox template

If you want to use values other than `true` and `false`, you have to provide this information using [`checkedTemplate`](@/api/options.md#checkedtemplate) and [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate). Handsontable will then update your data using the appropriate template.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example2.js)
@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/react/example2.jsx)
@[code](@/content/guides/cell-types/checkbox-cell-type/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example2.ts)
@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-types/checkbox-cell-type/vue/example2.vue)

:::

:::

## Cells with no value

When a checkbox cell's value is empty (`null`, `undefined`, or an empty string) and matches neither [`checkedTemplate`](@/api/options.md#checkedtemplate) nor [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate), Handsontable renders an unchecked checkbox and adds a `noValue` CSS class to it.

By default, the `noValue` class reduces the checkbox's opacity, so cells with no value look faded and stay visually distinct from cells set to the unchecked value.

To change how these cells look, target the `noValue` class in your CSS:

```css
.handsontable .htCheckboxRendererInput.noValue {
  opacity: 1;
}
```

## Checkbox labels

To add a label to the checkbox, use the [`label`](@/api/options.md#label) option. You can declare where the label will be injected with this option - either before or after the checkbox element. You can also declare from which data source the label text will be updated.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example3.js)
@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/react/example3.jsx)
@[code](@/content/guides/cell-types/checkbox-cell-type/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example3.ts)
@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/cell-types/checkbox-cell-type/vue/example3.vue)

:::

:::

### Label value as a function

The `value` property of the `label` option can also be a function. The function receives four arguments: `row`, `column`, `prop`, and `value`, where `value` is the current cell value. This lets you generate label text dynamically based on the cell's state.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example4.js)
@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/react/example4.jsx)
@[code](@/content/guides/cell-types/checkbox-cell-type/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example4.ts)
@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/cell-types/checkbox-cell-type/vue/example4.vue)

:::

:::

## Check all in the column header

To add a "check all" checkbox to the header of a checkbox column, set the [`headerCheckbox`](@/api/options.md#headercheckbox) option on that column.

- A click on the header checkbox checks every cell in the column. When every cell is already checked, it unchecks them.
- When only some cells are checked, the header checkbox shows a mixed state, and a click checks all of them.
- Read-only cells are skipped and aren't counted.
- The change is one step for [undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md).
- With the [`navigableHeaders`](@/api/options.md#navigableheaders) option, focus the header and press <kbd>**Space**</kbd>.

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example5.js)
@[code](@/content/guides/cell-types/checkbox-cell-type/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/checkbox-cell-type/react/example5.jsx)
@[code](@/content/guides/cell-types/checkbox-cell-type/react/example5.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example5.ts)
@[code](@/content/guides/cell-types/checkbox-cell-type/angular/example5.html)

:::

:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/cell-types/checkbox-cell-type/vue/example5.vue)

:::

:::

By default, the header checkbox writes to the rows that pass the [filters](@/guides/columns/column-filter/column-filter.md), on every page. To change that, pass a `scope`:

```js
columns: [
  {
    data: 'done',
    type: 'checkbox',
    // 'filtered' (default), 'all' (also rows the filters hide), or 'currentPage'
    headerCheckbox: { scope: 'currentPage' },
  },
],
```

To let users select rows rather than edit a value, see [Row selection](@/guides/rows/row-selection/row-selection.md).

## Extend the checkbox with a custom renderer

To add your own content to a checkbox cell, write a custom [renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) that chains the built-in checkbox renderer and then adds nodes to the cell.

Add those nodes with DOM methods such as `appendChild` or `insertAdjacentText`, on the element returned by `Handsontable.dom.getCellContentRoot(td)`. Do not use `td.innerHTML += ...`. Assigning to `innerHTML` re-serializes and re-parses the whole cell on every draw, which rebuilds the cell's content wrapper and drops any state that lives only as a DOM property rather than a reflected HTML attribute, as well as any listener attached directly to a node. Your markup string is also parsed as raw HTML, without the sanitization Handsontable applies to the content it renders itself.

The snippet below uses the global `Handsontable` object. In a framework wrapper, import `Handsontable` and use `Handsontable.renderers`/`Handsontable.dom` the same way.

```javascript
const baseCheckboxRenderer = Handsontable.renderers.getRenderer('checkbox');

function checkboxWithNoteRenderer(instance, td, row, col, prop, value, cellProperties) {
  // Render the checkbox first.
  baseCheckboxRenderer.call(this, instance, td, row, col, prop, value, cellProperties);

  // Then add your own content next to it.
  const contentRoot = Handsontable.dom.getCellContentRoot(td);

  contentRoot.appendChild(instance.rootDocument.createTextNode(' (in stock)'));
}
```

Register the renderer, or pass it as the column's [`renderer`](@/api/options.md#renderer) option, alongside `type: 'checkbox'`.

## Result

After configuring the checkbox cell type, cells display an interactive checkbox. Clicking the checkbox or pressing <kbd>**Space**</kbd> or <kbd>**Enter**</kbd> toggles its state. The underlying data source stores the boolean value (or your custom `checkedTemplate`/`uncheckedTemplate` values).

## Related keyboard shortcuts

| Windows                  | macOS                    | Action                        |  Excel  | Sheets  |
| ------------------------ | ------------------------ | ----------------------------- | :-----: | :-----: |
| <kbd>**Space**</kbd>     | <kbd>**Space**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Enter**</kbd>     | <kbd>**Enter**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Delete**</kbd>    | <kbd>**Delete**</kbd>    | Uncheck the checkbox          | &cross; | &check; |
| <kbd>**Backspace**</kbd> | <kbd>**Backspace**</kbd> | Uncheck the checkbox          | &cross; | &check; |

For the full list of default keyboard shortcuts, see [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#checkbox-editor-keyboard-shortcuts).

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Row selection](@/guides/rows/row-selection/row-selection.md)

</div>

**Configuration options**

<div class="boxes-list">

- [checkedTemplate](@/api/options.md#checkedtemplate)
- [headerCheckbox](@/api/options.md#headercheckbox)
- [label](@/api/options.md#label)
- [type](@/api/options.md#type)
- [uncheckedTemplate](@/api/options.md#uncheckedtemplate)

</div>

**Core methods**

<div class="boxes-list">

- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getDataType()](@/api/core.md#getdatatype)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeSetCellMeta](@/api/hooks.md#beforesetcellmeta)

</div>

**Plugins**

<div class="boxes-list">

- [CheckboxHeader](@/api/checkboxHeader.md)

</div>
