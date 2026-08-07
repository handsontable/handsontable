---
type: how-to
title: Formula builder
metaTitle: Formula builder - JavaScript Data Grid | Handsontable
description: Edit formulas with a formula bar, colored cell references, autocomplete, and reference picking, on top of the formula calculation engine.
permalink: /formula-builder
canonicalUrl: /formula-builder
tags:
  - formulas
  - formula bar
  - formula editor
  - reference picking
  - autocomplete
  - function help
  - point mode
  - spreadsheet
  - excel
react:
  metaTitle: Formula builder - React Data Grid | Handsontable
angular:
  metaTitle: Formula builder - Angular Data Grid | Handsontable
vue:
  metaTitle: Formula builder - Vue Data Grid | Handsontable
searchCategory: Guides
category: Formulas
menuTag: new
---

The `FormulaBuilder` plugin adds a spreadsheet-grade formula editing experience on top of the [`Formulas`](@/guides/formulas/formula-calculation/formula-calculation.md) plugin: a formula bar, an inline editor with colored references, reference picking by mouse or keyboard, autocomplete, function help, and formula error indicators.

[[toc]]

## Prerequisites

The plugin builds on the formula calculation engine and an external UI module:

- The [`Formulas`](@/guides/formulas/formula-calculation/formula-calculation.md) plugin enabled with a configured HyperFormula engine.
- The `@hfe/core` module, passed to the plugin through the [`builder`](@/api/formulaBuilder.md) setting. Handsontable never imports the module itself, so your bundle carries it only when you use the plugin.
- Formula editing is opt-in per cell: set `editor: 'formula'` on the cells, columns, or grid that should use the formula editor. The plugin registers this editor alias when it is enabled.

## Enable the formula builder

Import the `@hfe/core` module namespace, and pass it in the `formulaBuilder` configuration option next to an enabled `formulas` configuration:

::: only-for javascript

```javascript
import Handsontable from 'handsontable/base';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

const hot = new Handsontable(container, {
  editor: 'formula',
  formulas: {
    engine: HyperFormula,
  },
  formulaBuilder: {
    builder: formulaBuilder,
    showFormulaBar: true,
  },
});
```

:::

::: only-for react

```jsx
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

<HotTable
  columns={[{ editor: 'formula' }]}
  formulas={{ engine: HyperFormula }}
  formulaBuilder={{ builder: formulaBuilder, showFormulaBar: true }}
/>
```

The React wrapper reserves the top-level `editor` prop for React component editors, so map the `formula` editor alias through `columns` (or per-cell settings) instead.

:::

::: only-for angular

```typescript
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

gridSettings: GridSettings = {
  editor: 'formula',
  formulas: { engine: HyperFormula },
  formulaBuilder: { builder: formulaBuilder, showFormulaBar: true },
};
```

:::

::: only-for vue

```typescript
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

const hotSettings: GridSettings = {
  editor: 'formula',
  formulas: { engine: HyperFormula },
  formulaBuilder: { builder: formulaBuilder, showFormulaBar: true },
};
```

:::

The grid below has the formula bar enabled and every column mapped to the formula editor. Click a cell in the **Total** or **Share** column to see its formula in the bar, or double-click it to edit the formula in place with colored references:

::: only-for javascript

::: example #example1 --js 1 --ts 2
@[code](@/content/guides/formulas/formula-builder/javascript/example1.js)
@[code](@/content/guides/formulas/formula-builder/javascript/example1.ts)
:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2
@[code](@/content/guides/formulas/formula-builder/react/example1.jsx)
@[code](@/content/guides/formulas/formula-builder/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2
@[code](@/content/guides/formulas/formula-builder/angular/example1.ts)
@[code](@/content/guides/formulas/formula-builder/angular/example1.html)
:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/formulas/formula-builder/vue/example1.vue)

:::

:::

While the plugin is enabled, it hosts its reference highlights in the grid root element and forces `position: relative` and `overflow: hidden` inline styles on it. Both styles are restored on disable. Give the grid container an explicit height.

## Formula bar

Set `showFormulaBar: true` to render an Excel-style formula bar above the grid. The bar consists of:

- An **address box** that shows the active cell address. Type an address such as `B3`, or a range such as `B2:D4`, and press <kbd>**Enter**</kbd> to jump to it.
- A **formula area** that shows the source text of the active cell. Click it to edit the cell from the bar. Press <kbd>**F6**</kbd> during a bar edit to move the shared editor between the bar and the cell.

The bar renders in the grid's top layout slot, so it takes part in the [layout](@/api/options.md#layout) ordering with other top-slot UI.

## Reference picking

While the caret sits at a position where a reference is valid - after `=`, an operator, an argument separator, or an opening parenthesis - the grid switches to reference picking:

- **Click a cell** to insert its reference.
- **Drag across cells** to insert a range reference, with a live preview highlight.
- **Click or drag row or column headers** to insert whole-row or whole-column references, such as `B:D` or `3:5`. Header picking suppresses column sorting and menu actions for that click.
- Hold <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> to append another reference instead of replacing the pending one.

Every inserted reference gets a color, and the referenced ranges highlight in the grid with matching colors while you edit.

## Keyboard point mode

You can pick references without the mouse. When a reference is valid at the caret, the arrow keys walk a reference cursor around the grid:

| Shortcut | Action |
|---|---|
| <kbd>**Arrow keys**</kbd> | Move the reference cursor one cell. |
| <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**Arrow keys**</kbd> | Jump the reference cursor to the edge of the data block. |
| <kbd>**Shift**</kbd> + <kbd>**Arrow keys**</kbd> | Extend the reference into a range. |
| <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Arrow keys**</kbd> | Extend the reference to the edge of the data block. |
| <kbd>**F6**</kbd> / <kbd>**Shift**</kbd> + <kbd>**F6**</kbd> | Move focus between the editor and an open popup, or between the bar and the inline editor. |
| <kbd>**Escape**</kbd> | Close the open popup, or cancel the edit. |
| <kbd>**Enter**</kbd> / <kbd>**Tab**</kbd> | Commit the edit and move the selection down or right. <kbd>**Shift**</kbd> reverses the direction. |

## Autocomplete and popups

Typing a function name after `=` opens an autocomplete popup with matching functions and named expressions. Typing an opening parenthesis opens a function help popup with the function's signature and parameter descriptions.

Configure the popups with the `popups` setting. The top-level `showClose` is the shared default, and each popup can override it:

```javascript
formulaBuilder: {
  builder: formulaBuilder,
  showFormulaBar: true,
  popups: {
    showClose: true,
    suggestions: {
      showKeyboardHelp: false,
      showNamedExpressions: false,
    },
  },
},
```

The example below hides the keyboard hints and named expressions in the autocomplete popup, and adds close buttons to all popups. Type `=SU` in any cell to see the result:

::: only-for javascript

::: example #example2 --js 1 --ts 2
@[code](@/content/guides/formulas/formula-builder/javascript/example2.js)
@[code](@/content/guides/formulas/formula-builder/javascript/example2.ts)
:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2
@[code](@/content/guides/formulas/formula-builder/react/example2.jsx)
@[code](@/content/guides/formulas/formula-builder/react/example2.tsx)
:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2
@[code](@/content/guides/formulas/formula-builder/angular/example2.ts)
@[code](@/content/guides/formulas/formula-builder/angular/example2.html)
:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/formulas/formula-builder/vue/example2.vue)

:::

:::

You can also dock the autocomplete or function help popup into your own container instead of the floating overlay, with the plugin's [`attachSuggestionsHost()`](@/api/formulaBuilder.md) and [`attachFnHelpHost()`](@/api/formulaBuilder.md) methods.

## Error indicators and read-only cells

Cells whose formula evaluates to an error - such as `#DIV/0!` or `#REF!` - get an error indicator, and selecting or hovering the cell shows a popup with the error message.

Read-only cells stay protected: the formula bar and the inline editor refuse to start an edit on a cell with [`readOnly: true`](@/api/options.md#readonly).

In the example below, the **Change** column is read-only, and the `SKU-3310` row divides by a zero stock value. Select the resulting `#DIV/0!` cell to see the error popup:

::: only-for javascript

::: example #example3 --js 1 --ts 2
@[code](@/content/guides/formulas/formula-builder/javascript/example3.js)
@[code](@/content/guides/formulas/formula-builder/javascript/example3.ts)
:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2
@[code](@/content/guides/formulas/formula-builder/react/example3.jsx)
@[code](@/content/guides/formulas/formula-builder/react/example3.tsx)
:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2
@[code](@/content/guides/formulas/formula-builder/angular/example3.ts)
@[code](@/content/guides/formulas/formula-builder/angular/example3.html)
:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/formulas/formula-builder/vue/example3.vue)

:::

:::

## RTL support

Set the plugin's `direction` option to `'rtl'` to lay out the editor, the formula bar, and the popups right-to-left. See [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md) for grid-wide layout direction.

## Known limitations

- The plugin requires the `Formulas` plugin with a HyperFormula engine. It does not work with other formula engines.
- The plugin operates on the sheet bound to the grid instance. Cross-sheet formula editing works, but reference picking targets the current grid only.
- The `@hfe/core` module ships separately from Handsontable, and you inject it through the `builder` setting.

## Result

You now have a grid with a formula bar, inline formula editing with colored references, mouse and keyboard reference picking, autocomplete, function help, and formula error indicators.

## Related

**Related guides**

<div class="boxes-list gray-bg">

- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)

</div>

**Related API reference**

<div class="boxes-list">

- [FormulaBuilder](@/api/formulaBuilder.md)
- [Formulas](@/api/formulas.md)
- [formulas option](@/api/options.md#formulas)

</div>

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
