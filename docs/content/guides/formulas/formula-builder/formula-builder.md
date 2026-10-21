---
type: how-to
title: Formula builder
metaTitle: Formula builder | Handsontable DataGrid for JavaScript
description: Edit formulas in Handsontable DataGrid with a formula bar, colored cell references, autocomplete, and reference picking, on top of the formula calculation engine.
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
  metaTitle: Formula builder | Handsontable DataGrid for React
angular:
  metaTitle: Formula builder | Handsontable DataGrid for Angular
vue:
  metaTitle: Formula builder | Handsontable DataGrid for Vue
searchCategory: Guides
category: Formulas
menuTag: new
addedIn: "19.0.0"
---

The `FormulaBuilder` plugin adds spreadsheet-style formula editing to Handsontable DataGrid. It works on top of the [`Formulas`](@/guides/formulas/formula-calculation/formula-calculation.md) plugin and adds a formula bar, an inline editor with colored references, reference picking by mouse or keyboard, autocomplete, function help, and formula error indicators.

[[toc]]

## Prerequisites

The plugin builds on the formula calculation engine and an external UI module:

- The [`Formulas`](@/guides/formulas/formula-calculation/formula-calculation.md) plugin enabled with a configured HyperFormula engine.
- The [`hyperformula-ui`](https://www.npmjs.com/package/hyperformula-ui) package, passed to the plugin through the `builder` setting. Handsontable never imports the package itself, so your bundle carries it only when you use the plugin.
- Formula editing is opt-in per cell: set `editor: 'formula'` on the cells, columns, or grid that should use the formula editor. The plugin registers this editor alias when it is enabled.

## Enable the formula builder

Install the `hyperformula-ui` package next to `hyperformula`:

```bash
npm install hyperformula hyperformula-ui
```

Import the `hyperformula-ui` module namespace, and pass it in the `formulaBuilder` configuration option next to an enabled `formulas` configuration. You can give the namespace any name:

::: only-for javascript

```javascript
import Handsontable from 'handsontable/base';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from 'hyperformula-ui';

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
import * as formulaBuilder from 'hyperformula-ui';

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
import * as formulaBuilder from 'hyperformula-ui';

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
import * as formulaBuilder from 'hyperformula-ui';

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

Reference highlights render through the grid's own selection system. They follow frozen panes, scrolling, and hidden or reordered rows and columns. The plugin does not change the grid root element's inline styles.

## Configuration options

The `formulaBuilder` configuration option takes an object with these keys:

| Key | Type | Default | Description |
|---|---|---|---|
| `builder` | Module namespace | - | Required. The `hyperformula-ui` module namespace, for example `import * as FormulaBuilderModule from 'hyperformula-ui'`. |
| `showFormulaBar` | `boolean` | `false` | Renders the [formula bar](#formula-bar) above the grid. |
| `popups` | `object` | - | Options for the autocomplete, function help, and error popups. See [Autocomplete and popups](#autocomplete-and-popups). |
| `direction` | `'ltr'` \| `'rtl'` | The grid's layout direction | Layout direction of the editor and the formula bar, and the side the popups align to. See [RTL support](#rtl-support). |

The plugin stays disabled and logs a warning to the console in two cases:

- The `builder` key is missing, or the module it holds lacks a member the plugin needs. The warning names the missing members, which usually means an incompatible `hyperformula-ui` version.
- The `Formulas` plugin is disabled, or it has no configured engine.

A `showFormulaBar` value that is not a boolean, or a `direction` other than `'ltr'` or `'rtl'`, logs a warning too. The plugin then enables without the formula bar, or with the grid's layout direction.

Cells that use `editor: 'formula'` stay editable while the plugin is disabled: they open a plain text editor instead of the formula editor.

When you call [`updateSettings()`](@/api/core.md#updatesettings) with `formulaBuilder` values that match the current ones, the plugin keeps its state, including an open edit. This is what happens when React or Angular passes a new `formulaBuilder` object with the same values on each render.

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
| <kbd>**Shift**</kbd> + <kbd>**Arrow keys**</kbd> | Extend the reference into a range. |
| <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**Arrow keys**</kbd> | Jump the reference cursor to the edge of the data block. |
| <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Arrow keys**</kbd> | Extend the reference to the edge of the data block. |
| <kbd>**F2**</kbd> | Switch point mode on or off, so the arrow keys move the reference cursor or the text caret. |
| <kbd>**F4**</kbd> | Cycle the reference at the caret between relative and absolute forms, such as `A1`, `$A$1`, `A$1`, and `$A1`. |

For the full list of keys that the formula editor handles, see [Keyboard shortcuts](#keyboard-shortcuts).

## Autocomplete and popups

Typing a function name after `=` opens an autocomplete popup with matching functions and named expressions. Typing an opening parenthesis opens a function help popup with the function's signature and parameter descriptions.

Configure the popups with the `popups` setting. The plugin forwards the object to the formula editor unchanged:

| Key | Type | Default | Description |
|---|---|---|---|
| `showClose` | `boolean` | `false` | Shows a close button in every popup. Each popup can override it. |
| `suggestions.showKeyboardHelp` | `boolean` | `true` | Shows the keyboard hints footer in the autocomplete popup. |
| `suggestions.showNamedExpressions` | `boolean` | `true` | Includes named expressions in the autocomplete list. |
| `suggestions.showClose` | `boolean` | `false` | Shows a close button in the autocomplete popup. |
| `suggestions.container` | `HTMLElement` \| `string` | - | Docks the autocomplete popup into this element (or CSS selector) instead of the floating overlay. |
| `fnHelp.showClose` | `boolean` | `false` | Shows a close button in the function help popup. |
| `fnHelp.container` | `HTMLElement` \| `string` | - | Docks the function help popup into this element (or CSS selector) instead of the floating overlay. |
| `error.showClose` | `boolean` | `false` | Shows a close button in the formula error popup. |

For example:

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

The formula editor, the formula bar, and the popups follow the grid's [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) by default. In a right-to-left grid, the editor and the formula bar lay out right-to-left, and the popups open aligned to the editor's right edge. The text inside the popups keeps the left-to-right direction.

To set the direction of the formula builder alone, use the `direction` option. It takes `'ltr'` or `'rtl'`:

```javascript
formulaBuilder: {
  builder: formulaBuilder,
  direction: 'rtl',
},
```

## Keyboard shortcuts

The formula editor handles these keys while you edit a cell, either in place or in the formula bar:

| Windows | macOS | Action |
|---|---|---|
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Commit the edit and move the selection down. With the autocomplete popup open, insert the highlighted suggestion. |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | <kbd>⇧</kbd>+<kbd>**Enter**</kbd> | Commit the edit and move the selection up. |
| <kbd>**Tab**</kbd> | <kbd>**Tab**</kbd> | Commit the edit and move the selection right. With the autocomplete popup open, insert the highlighted suggestion. |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> | <kbd>⇧</kbd>+<kbd>**Tab**</kbd> | Commit the edit and move the selection left. |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd> | <kbd>⌘</kbd>+<kbd>**Enter**</kbd> | Insert a line break in the formula. |
| <kbd>**Escape**</kbd> | <kbd>**Escape**</kbd> | Close the open popup. With no popup open, leave point mode, or cancel the edit. |
| <kbd>**↑**</kbd> / <kbd>**↓**</kbd> | <kbd>**↑**</kbd> / <kbd>**↓**</kbd> | With the autocomplete popup open, move through the suggestions. |
| <kbd>**F2**</kbd> or <kbd>**Ctrl**</kbd>+<kbd>**E**</kbd> | <kbd>**F2**</kbd> or <kbd>⌘</kbd>+<kbd>**E**</kbd> | Switch point mode on or off. |
| <kbd>**F4**</kbd> | <kbd>**F4**</kbd> | Cycle the reference at the caret between relative and absolute forms. |
| <kbd>**F6**</kbd> / <kbd>**Shift**</kbd>+<kbd>**F6**</kbd> | <kbd>**F6**</kbd> / <kbd>⇧</kbd>+<kbd>**F6**</kbd> | With the function help popup open, move the focus into it. Otherwise, with the formula bar enabled, move the editor between the formula bar and the cell. |

The arrow-key shortcuts of [keyboard point mode](#keyboard-point-mode) work in a formula wherever a reference is valid at the caret. The same keys are listed in the [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#formula-builder-keyboard-shortcuts) reference.

## Known limitations

- The plugin requires the `Formulas` plugin with a HyperFormula engine. It does not work with other formula engines.
- The plugin operates on the sheet bound to the grid instance. Cross-sheet formula editing works, but reference picking targets the current grid only.
- The `hyperformula-ui` package ships separately from Handsontable. You install it yourself, and you pass it to the plugin through the `builder` setting.
- The accessible names of the formula bar and the editor, and the screen reader announcements, are in English. The `hyperformula-ui` package has no option to translate them yet.
- The popups and their screen reader announcements render at the end of the document body, outside the grid's root element.

## Result

You now have a grid with a formula bar, inline formula editing with colored references, mouse and keyboard reference picking, autocomplete, function help, and formula error indicators.

## Related

**Related guides**

<div class="boxes-list gray-bg">

- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [Keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md)

</div>

**Related API reference**

<div class="boxes-list">

- [FormulaBuilder](@/api/formulaBuilder.md)
- [Formulas](@/api/formulas.md)
- [formulas option](@/api/options.md#formulas)
- [formulaBuilder option](@/api/options.md#formulabuilder)

</div>

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
