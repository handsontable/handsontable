---
type: how-to
id: u00oul7m
title: Cell editor
metaTitle: Cell editor - JavaScript Data Grid | Handsontable
description: Create a custom cell editor function, to have full control over how editing works in the cells of your data grid.
permalink: /cell-editor
canonicalUrl: /cell-editor
react:
  id: 6i8ttta0
  metaTitle: Cell editor - React Data Grid | Handsontable
angular:
  id: 7qb4y4u4
  metaTitle: Cell editor - Angular Data Grid | Handsontable
vue:
  id: qwv2hoqe
  metaTitle: Cell editor - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

Create custom cell editors to fully control how values are entered in your data grid.

Each cell can have one editor — a class that manages the editor's DOM element, its value, and the lifecycle from opening to saving. Handsontable's [`EditorManager`](@/api/baseEditor.md) selects and drives the editor automatically. You create editors by extending [`BaseEditor`](@/api/baseEditor.md) or any of the [built-in editor classes](#built-in-editors).

[[toc]]

::: only-for react

## Component-based editors

Use React components as editors with the `useHotEditor` hook. The hook returns `value`, `setValue`, and `finishEditing`, plus callbacks for the editor lifecycle (`onOpen`, `onClose`, `onPrepare`, `onFocus`).

To prevent the editor from closing when clicked (due to `outsideClickDeselects`), call `event.stopPropagation()` on the `mousedown` event of the editor's root element.

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-editor/react/example1.jsx)
@[code](@/content/guides/cell-functions/cell-editor/react/example1.tsx)

:::

## Class-based editors

Declare the editor as a class that extends a built-in editor (e.g., `TextEditor`) and pass it to the `editor` option in column configuration.

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-editor/react/example2.jsx)
@[code](@/content/guides/cell-functions/cell-editor/react/example2.tsx)

:::

::: tip

The sections below describe the class-based editor API. All of it applies to React when using the class-based approach.

:::

:::

::: only-for angular

## Component-based editors

Create an Angular component that extends `HotCellEditorComponent<T>` (where `T` is `string`, `number`, or `boolean`). The only method you must implement is `onFocus()`. Use the `finishEdit` and `cancelEdit` outputs to trigger editing completion.

```ts
@Component({
  selector: 'app-custom-editor',
  imports: [FormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <input #inputElement type="text" [value]="getValue()" (keydown)="onKeyDown($event)" />
    </div>
  `,
})
export class CustomEditorComponent extends HotCellEditorComponent<string> {
  @ViewChild('inputElement') inputElement!: ElementRef;

  onFocus(): void {
    this.inputElement.nativeElement.select();
  }
}
```

Pass the component as the `editor` property in column configuration:

```ts
settings = {
  columns: [{ editor: CustomEditorComponent }],
};
```

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-editor/angular/example1.ts)
@[code](@/content/guides/cell-functions/cell-editor/angular/example1.html)

:::

## Class-based editors

Declare the editor as a class that extends a built-in editor (e.g., `TextEditor`) and pass it to the `editor` option in column configuration.

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-editor/angular/example2.ts)
@[code](@/content/guides/cell-functions/cell-editor/angular/example2.html)

:::

::: tip

The sections below describe the class-based editor API. All of it applies to Angular when using the class-based approach.

:::

:::

## How editing works

Handsontable separates rendering (displaying cell values) from editing (changing them). Renderers are stateless functions; editors are stateful classes that own a DOM element and manage the full editing flow.

### EditorManager lifecycle

`EditorManager` orchestrates all editors. For each cell interaction it runs four steps in order:

| Step | When it runs | What it does |
| --- | --- | --- |
| **Select editor** | Cell is selected | Looks up the editor class from the `editor` config option |
| **Prepare** | Cell is selected | Calls `prepare()` to configure the editor for the selected cell |
| **Open** | User triggers editing | Fires `beforeBeginEditing` (return `false` to cancel), then calls `beginEditing()` → `open()` |
| **Close** | User confirms or cancels | Calls `finishEditing()` → `close()` or `focus()` |

**Editing opens on:** <kbd>**Enter**</kbd>, <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>, <kbd>**F2**</kbd>, double-click.

**Preventing the editor from opening:** Use the [`beforeBeginEditing`](@/api/hooks.md#beforebeginediting) hook to conditionally cancel editor opening. Return `false` from the hook callback to prevent the editor from opening. Returning `undefined` (or any non-boolean value) applies the default behavior, which disallows opening for non-contiguous selections (Ctrl/Cmd+click) and multi-cell selections (Shift+click). Returning `true` removes those restrictions.

**Editing closes on:**

| Key / action | Result |
| --- | --- |
| Click another cell | Saves changes |
| <kbd>**Enter**</kbd> / <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | Saves and moves selection down / up |
| <kbd>**Tab**</kbd> / <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> | Saves and moves selection right / left |
| <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Enter**</kbd> or <kbd>**Alt**</kbd>/<kbd>⌥</kbd>+<kbd>**Enter**</kbd> | Inserts a line break |
| <kbd>**Page Up**</kbd> / <kbd>**Page Down**</kbd> | Saves and scrolls one screen |
| <kbd>**Escape**</kbd> | Cancels without saving |

::: tip

**IME support:** For Chinese, Japanese, or Korean input, enable [`imeFastEdit`](@/api/options.md#imefastedit) to let users start typing immediately without pressing <kbd>Enter</kbd> or <kbd>F2</kbd>. See the [IME support](@/guides/internationalization/ime-support/ime-support.md) guide.

:::

**Overriding keyboard behavior:** Register a [`beforeKeyDown`](@/api/hooks.md#beforekeydown) hook listener and call `Handsontable.dom.stopImmediatePropagation(event)` to prevent `EditorManager` from processing a specific key. The native `event.stopImmediatePropagation()` does not stop Handsontable's internal key pipeline - you must use the `Handsontable.dom` helper (or import `stopImmediatePropagation` from `handsontable/helpers/dom/event`). Register the listener in `open()` and remove it in `close()` so it only intercepts events while your editor is active.

**Editor singleton:** Each editor class has exactly one instance per table. The constructor and `init()` run once per table; `prepare()` runs every time you select a cell that uses that editor.

## BaseEditor API

All custom editors extend `Handsontable.editors.BaseEditor`. In an ESM project, import it from `handsontable/editors/baseEditor`. In a script-tag (UMD) project, access it as `Handsontable.editors.BaseEditor`.

### Common methods

These methods are already implemented in `BaseEditor`. Override them only when necessary — always call `super.method()` first when you do.

| Method | Description |
| --- | --- |
| `prepare()` | Configures the editor for the selected cell. Sets `this.row`, `this.col`, `this.prop`, `this.TD`, and `this.cellProperties`. Parameters: `(row, col, prop, td, originalValue, cellProperties)`. |
| `beginEditing()` | Sets the initial editor value and calls `open()`. Uses the original cell value when `newInitialValue` is `undefined`. Parameters: `(newInitialValue, event)`. |
| `finishEditing()` | Validates and saves the value, or restores the original when `restoreOriginalValue` is `true`. When `ctrlDown` is `true`, applies the value to all selected cells. Calls `close()` on success or `focus()` when validation fails. Parameters: `(restoreOriginalValue?, ctrlDown?, callback?)`. |
| `discardEditor()` | Called after validation. If valid, calls `close()`; if invalid, calls `focus()` to keep the editor open. Parameter: `(result)`. |
| `saveValue()` | Validates and saves `value`. Applies to all selected cells when `ctrlDown` is `true`. Parameters: `(value, ctrlDown)`. |
| `isOpened()` | Returns `true` if the editor is currently open. |
| `extend()` | Returns a new subclass of the current editor. Overriding methods on the returned class does not affect the original. Useful for ES5 environments; in ES6+ prefer `class MyEditor extends BaseEditor {}`. |

### Abstract methods

You must implement all of these in your custom editor class.

| Method | Description |
| --- | --- |
| `init()` | Called once when the editor object is created. Build the editor's DOM here. |
| `getValue()` | Returns the current editor value to be saved as the new cell value. |
| `setValue()` | Updates the editor to display the new value. Parameter: `(newValue)`. |
| `open()` | Shows the editor. |
| `close()` | Hides the editor after editing ends. |
| `focus()` | Focuses the editor input. Called when validation fails and the editor must stay open. |

### Editor instance properties

Available as `this.property` inside any editor method.

| Property | Type | Description |
| --- | --- | --- |
| `hot` | `Handsontable.Core` | The Handsontable instance this editor belongs to. Set once in the constructor; never changes. |
| `row` | `number` | Visual row index of the active cell. Updated by `prepare()`. |
| `col` | `number` | Visual column index of the active cell. Updated by `prepare()`. |
| `prop` | `string` | Data property name for the active cell (for object data sources). Updated by `prepare()`. |
| `TD` | `HTMLTableCellElement` | DOM node of the active cell. Updated by `prepare()`. |
| `cellProperties` | `object` | Configuration of the active cell. Updated by `prepare()`. Includes all standard cell options and any custom properties (e.g., `selectOptions`). |

## Built-in editors

| Alias | Editor class |
| --- | --- |
| `autocomplete` | `Handsontable.editors.AutocompleteEditor` |
| `checkbox` | `Handsontable.editors.CheckboxEditor` |
| `date` | `Handsontable.editors.DateEditor` |
| `dropdown` | `Handsontable.editors.DropdownEditor` |
| `handsontable` | `Handsontable.editors.HandsontableEditor` |
| `numeric` | `Handsontable.editors.NumericEditor` |
| `password` | `Handsontable.editors.PasswordEditor` |
| `select` | `Handsontable.editors.SelectEditor` |
| `text` | `Handsontable.editors.TextEditor` |
| `time` | `Handsontable.editors.TimeEditor` |

## Creating a custom editor

Two approaches are available:

- **Extend an existing editor** when you want most of its behavior and only need to change a few details (e.g., swap the input element type).
- **Extend `BaseEditor` directly** when you need an entirely different UI (e.g., a dropdown list, a date picker, a color picker).

### Extending an existing editor

Override only the methods you need. The `PasswordEditor` below extends `TextEditor` and replaces the `<textarea>` with `<input type="password">`. Since both elements share the same DOM API, only `createElements()` needs to change.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-editor/javascript/example1.js)
@[code](@/content/guides/cell-functions/cell-editor/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-editor/react/example2.jsx)
@[code](@/content/guides/cell-functions/cell-editor/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-editor/angular/example2.ts)
@[code](@/content/guides/cell-functions/cell-editor/angular/example2.html)

:::

:::

### Building an editor from scratch

Extend `BaseEditor` directly for full control. The `SelectEditor` below renders a `<select>` dropdown. It also overrides keyboard behavior so <kbd>**Arrow Up**</kbd> / <kbd>**Arrow Down**</kbd> cycle through options rather than closing the editor.

Key implementation decisions:
- **`init()`** - DOM is created here (runs once), not in `prepare()` or `open()`.
- **`data-hot-input="true"`** - Required on the editor element. Without it, Handsontable treats clicks on the editor as clicks outside it and closes the editor immediately.
- **`prepare()`** - Options are populated here so each cell can have its own list via `selectOptions`.
- **`open()` / `close()`** - The `beforeKeyDown` hook is registered when opening and cleared when closing, scoping key interception to this editor only.

::: only-for javascript

::: example #example2 --js 1 --ts 2 --css 3

@[code](@/content/guides/cell-functions/cell-editor/javascript/example2.js)
@[code](@/content/guides/cell-functions/cell-editor/javascript/example2.ts)
@[code](@/content/guides/cell-functions/cell-editor/javascript/example2.css)

:::

:::

::: only-for react

To use a class-based editor from scratch in React, pass the editor class as the `editor` prop in a column configuration object. See the [class-based editors](#class-based-editors) section for an example.

:::

::: only-for angular

To use a class-based editor from scratch in Angular, pass the editor class as the `editor` property in a column configuration object. See the [class-based editors](#class-based-editors) section for an example.

:::

## Registering an editor

Register your editor under a string alias so it can be referenced by name in configuration instead of passing the class directly:

```js
Handsontable.editors.registerEditor('myEditor', MyEditor);
```

After registration, use the alias in column configuration:

::: only-for javascript

```js
new Handsontable(container, {
  columns: [
    { editor: 'myEditor' },
  ],
});
```

:::

::: only-for react

```jsx
<HotTable columns={[{ editor: 'myEditor' }]} />
```

::: tip

Registering an editor with `registerEditor` and referencing it by a string alias works for class-based editors only. Component-based editors (those using `useHotEditor`) cannot be registered this way, because they depend on React's rendering lifecycle to function.

For component-based editors, pass the component directly to the `editor` prop of `HotTable` or `HotColumn` — no registration step is needed.

:::

To reuse the same editor component across multiple columns, import and pass it wherever it is needed:

```jsx
import { MySelectEditor } from './MySelectEditor';

<HotTable>
  <HotColumn editor={MySelectEditor} />
  <HotColumn editor={MySelectEditor} />
</HotTable>
```

:::

::: only-for angular

```ts
settings = { columns: [{ editor: 'myEditor' }] };
```

```html
<hot-table [settings]="settings" />
```

:::

Handsontable defines these aliases by default: `autocomplete`, `base`, `checkbox`, `date`, `dropdown`, `handsontable`, `numeric`, `password`, `select`, `text`, `time`.

Choose a unique alias (e.g., `'myorg.select'`) to avoid overwriting built-in editors. Registering under an existing alias silently overwrites the previous mapping.

## Publishing a custom editor

If you intend to distribute your editor as a library, two extra steps make it easy for others to discover and extend it.

**Step 1: Register the alias** (covered above) so users can reference the editor by name:

```js
Handsontable.editors.registerEditor('myorg.select', MySelectEditor);
```

**Step 2: Expose the class on `Handsontable.editors`** so users can retrieve and extend it without importing from your source module:

```js
Handsontable.editors.MySelectEditor = MySelectEditor;
```

To extend a published editor, retrieve it with `getEditor()`:

```js
const MySelectEditor = Handsontable.editors.getEditor('myorg.select');

class ExtendedSelectEditor extends MySelectEditor {
  // override methods as needed
}
```

::: tip

`getEditor('alias')` returns the class itself, not an instance. It is the recommended way to retrieve a class by alias because it works regardless of whether the class is accessible in the current module scope.

:::

## Related keyboard shortcuts

| Windows | macOS | Action | Excel | Sheets |
| --- | --- | --- | :---: | :---: |
| Arrow keys | Arrow keys | Move the cursor through the text | &check; | &check; |
| Alphanumeric keys | Alphanumeric keys | Enter the pressed key's value into the cell | &check; | &check; |
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Complete the cell entry and move to the cell below | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | <kbd>⇧</kbd>+<kbd>**Enter**</kbd> | Complete the cell entry and move to the cell above | &check; | &check; |
| <kbd>**Tab**</kbd> | <kbd>**Tab**</kbd> | Complete the cell entry and move to the next cell<sup>\*</sup> | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> | <kbd>⇧</kbd>+<kbd>**Tab**</kbd> | Complete the cell entry and move to the previous cell<sup>\*</sup> | &check; | &check; |
| <kbd>**Delete**</kbd> | <kbd>**Delete**</kbd> | Delete one character after the cursor<sup>\*</sup> | &check; | &check; |
| <kbd>**Backspace**</kbd> | <kbd>**Backspace**</kbd> | Delete one character before the cursor<sup>\*</sup> | &check; | &check; |
| <kbd>**Home**</kbd> | <kbd>**Home**</kbd> | Move the cursor to the beginning of the text<sup>\*</sup> | &check; | &check; |
| <kbd>**End**</kbd> | <kbd>**End**</kbd> | Move the cursor to the end of the text<sup>\*</sup> | &check; | &check; |
| <kbd>**Ctrl**</kbd> + Arrow keys | <kbd>⌘</kbd> + Arrow keys | Move the cursor to the beginning or to the end of the text | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd> + Arrow keys | <kbd>⌘</kbd>+<kbd>⇧</kbd> + Arrow keys | Extend the selection to the beginning or to the end of the text | &check; | &check; |
| <kbd>**Page Up**</kbd> | <kbd>**Page Up**</kbd> | Complete the cell entry and move one screen up | &check; | &check; |
| <kbd>**Page Down**</kbd> | <kbd>**Page Down**</kbd> | Complete the cell entry and move one screen down | &check; | &check; |
| <kbd>**Alt**</kbd>+<kbd>**Enter**</kbd> | <kbd>⌥</kbd>+<kbd>**Enter**</kbd> | Insert a line break | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd> | <kbd>⌃</kbd>/<kbd>⌘</kbd>+<kbd>**Enter**</kbd> | Insert a line break | &cross; | &check; |
| <kbd>**Escape**</kbd> | <kbd>**Escape**</kbd> | Cancel the cell entry and exit the editing mode | &check; | &check; |

<sup>\*</sup> This action depends on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md).

::: only-for javascript

## Related articles

**Related guides**

<div class="boxes-list">

- [Custom editor in React](@/react/guides/cell-functions/cell-editor/cell-editor.md)
- [Custom editor in Angular](@/angular/guides/cell-functions/cell-editor/cell-editor.md)
- [Custom editor in Vue 3](@/guides/integrate-with-vue3/vue3-custom-editor-example/vue3-custom-editor-example.md)

</div>

:::

::: only-for react

## Related API reference

:::

::: only-for angular

## Related API reference

:::

**APIs**

<div class="boxes-list">

- [BasePlugin](@/api/basePlugin.md)

</div>

**Configuration options**

<div class="boxes-list">

- [editor](@/api/options.md#editor)
- [enterBeginsEditing](@/api/options.md#enterbeginsediting)
- [imeFastEdit](@/api/options.md#imefastedit)

</div>

**Core methods**

<div class="boxes-list">

- [destroyEditor()](@/api/core.md#destroyeditor)
- [getActiveEditor()](@/api/core.md#getactiveeditor)
- [getCellEditor()](@/api/core.md#getcelleditor)
- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [beforeBeginEditing](@/api/hooks.md#beforebeginediting)
- [afterBeginEditing](@/api/hooks.md#afterbeginediting)
- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)

</div>

## Result

You now have a custom cell editor that controls how values are entered in your data grid. You can extend a built-in editor for small changes, or build from `BaseEditor` for a completely custom editing experience.
