---
id: u00oul7m
title: Cell editor
metaTitle: Cell editor - JavaScript Data Grid | Handsontable
description: Create a custom cell editor function, to have full control over how editing works in the cells of your data grid.
permalink: /cell-editor
canonicalUrl: /cell-editor
react:
  id: 6i8ttta0
  metaTitle: Cell editor - React Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

# Cell editor

Create a custom cell editor function, to have full control over how editing works in the cells of your data grid.

[[toc]]

## Overview

Handsontable separates the process of displaying the cell value from the process of changing the value. Renderers are responsible for presenting the data and Editors for altering it. As a renderer has only one simple task: _get actual value of the cell and return its representation as a HTML code_ they can be a single function. Editors, however, need to handle user input (that is, mouse and keyboard events), validate data and behave according to validation results, so putting all those functionalities into a single function wouldn't be a good idea. That's why Handsontable editors are represented by editor classes.

This tutorial will give you a comprehensive understanding of how the whole process of cell editing works, how Handsontable Core manages editors, how editor life cycle looks like and finally - how to create your own editors.


::: only-for react

## Component-based editors

You can use React components to create custom editors. To do so, you'll need to create a functional component using the `useHotEditor` hook.

In the simplest case:
```js
import { useHotEditor } from "@handsontable/react-wrapper";

const EditorComponent = () => {
  const { value, setValue, finishEditing } = useHotEditor({
    onOpen: () => {
      // Open logic
    },
    onClose: () => {
      // Close logic
    },
  });

  // Component logic here

  // Any elements that should be rendered within the editor
  return (
    <div>
      <button onClick={finishEditing}>Apply</button>
    </div>
  );
};

// ...

<HotTable
  editor={ EditorComponent }
/>
```

It's also worth noting that by default, the editors in Handsontable will close after clicking on them if the `outsideClickDeselects` option is enabled.
To prevent that, the `mousedown` event on the editor container must call `event.stopPropagation()`.

If you are using React 17 and newer, `event.stopPropagation()` should work for you as expected. See the [React 17 release notes](https://reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation) for details about event delegation.

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-editor/react/example1.jsx)
@[code](@/content/guides/cell-functions/cell-editor/react/example1.tsx)

:::

## Class-based editors

You can also declare a custom editor for the `HotTable` component by declaring it as a class and passing it to the Handsontable options as `hotEditor` (or simply `editor` when used in a `columns` config array).

The following example implements the `@handsontable/react-wrapper` component with a custom editor added, utilizing the `placeholder` attribute in the editor's `input` element.

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-editor/react/example2.jsx)
@[code](@/content/guides/cell-functions/cell-editor/react/example2.tsx)

:::

::: tip

All the sections below describe how to utilize the features available for the Handsontable class-based editors.
This information is applicable in React when using the non-component editor approach.

:::

::: only-for javascript

## EditorManager

:::

::: only-for react

### EditorManager

:::

[`EditorManager`](@/api/baseEditor.md) is a class responsible for handling all editors available in Handsontable. If `Handsontable` needs to interact with editors it uses [`EditorManager`](@/api/baseEditor.md) object. [`EditorManager`](@/api/baseEditor.md) object is instantiated in [`init()`](@/api/baseEditor.md#init) method which is run, after you invoke `Handsontable()` constructor for the first time. The reference for [`EditorManager`](@/api/baseEditor.md) object is kept private in Handsontable instance and you cannot access it. However, there are ways to alter the default behaviour of [`EditorManager`](@/api/baseEditor.md), more on that later.

::: only-for javascript
### EditorManager tasks

:::

::: only-for react

#### EditorManager tasks

:::

[`EditorManager`](@/api/baseEditor.md) has 4 main tasks:

- Selecting proper editor for an active cell
- Preparing editor to be displayed
- Displaying editor (based on user behavior)
- Closing editor (based on user behavior).

We will discuss each of those tasks in detail.

::: only-for javascript

#### Select proper editor for an active cell

:::

::: only-for react

##### Select proper editor for an active cell

:::

When user selects a cell [`EditorManager`](@/api/baseEditor.md) finds the editor class assigned to this cell, examining the value of the [`editor`](@/api/options.md#editor) configuration option. You can define the [`editor`](@/api/options.md#editor) configuration option globally (for all cells in table), per column (for all cells in column) or for each cell individually. For more details, see the [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md#cascading-configuration) guide.

The value of the [`editor`](@/api/options.md#editor) configuration option can be either a string representing an editor (such as 'text', 'autocomplete', 'checkbox' etc.), or an editor class. [`EditorManager`](@/api/baseEditor.md) will then get an instance of editor class and the first very important thing to remember is: **there is always one instance of certain editor class in a single table**, in other words each editor class object **is a singleton** within a single table, which means that its constructor will be invoked only once per table. If you have 3 tables on a page, each table will have its own instance of editor class. This has some important implications that you have to consider creating your own editor.

::: only-for javascript

#### Prepare editor to be displayed

:::

::: only-for react

##### Prepare editor to be displayed

:::

When [`EditorManager`](@/api/baseEditor.md) obtain editor class instance (editor object) it invokes its [`prepare()`](@/api/baseEditor.md#prepare) method. The [`prepare()`](@/api/baseEditor.md#prepare) method sets editor objects properties related to the selected cell, but does not display the editor. [`prepare()`](@/api/baseEditor.md#prepare) is called each time user selects a cell. In some cases it can be invoked multiple times for the same cell, without changing the selection.

::: only-for javascript

#### Display editor

:::

::: only-for react

##### Display editor
:::

When editor is prepared the [`EditorManager`](@/api/baseEditor.md) waits for user event that triggers cell edition. Those events are:

- Pressing <kbd>**Enter**</kbd>
- Pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>
- double clicking cell
- Pressing <kbd>**F2**</kbd>

If any of those events is triggered, [`EditorManager`](@/api/baseEditor.md) calls editor's [`beginEditing()`](@/api/baseEditor.md#beginediting) method, which should display the editor.

::: only-for javascript

#### Close editor

:::

::: only-for react

##### Close editor
:::

When editor is opened the [`EditorManager`](@/api/baseEditor.md) waits for user event that should end cell edition. Those events are:

- Clicking on another cell (saves changes)
- Pressing <kbd>**Enter**</kbd> (saves changes and moves selection one cell down)
- Pressing <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> (saves changes and moves selection one cell up)
- Pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd> or <kbd>**Alt**</kbd>/<kbd>**Option**</kbd>+<kbd>**Enter**</kbd> (adds a new line inside the cell)
- Pressing <kbd>**Escape**</kbd> (aborts changes)
- Pressing <kbd>**Tab**</kbd> (saves changes and moves one cell to the right or to the left, depending on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md#elements-affected-by-layout-direction))
- Pressing <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> (saves changes and moves one cell to the left or to the right, depending on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md#elements-affected-by-layout-direction))
- Pressing <kbd>**Page Up**</kbd>, <kbd>**Page Down**</kbd> (saves changes and moves one screen up/down)

If any of those events is triggered, [`EditorManager`](@/api/baseEditor.md) calls editor's [`finishEditing()`](@/api/baseEditor.md#finishediting) method, which should try to save changes (unless ESC key has been pressed) and close the editor.

::: only-for javascript

### Overriding EditorManager default behaviour

:::

::: only-for react

#### Overriding EditorManager default behaviour
:::

You may want to change the default events that causes editor to open or close. For example, your editor might use <kbd>**Arrow Up**</kbd> and <kbd>**Arrow Down**</kbd> events to perform some actions (for example increasing or decreasing cell value) and you don't want [`EditorManager`](@/api/baseEditor.md) to close the editor when user press those keys. That's why [`EditorManager`](@/api/baseEditor.md) runs [`beforeKeyDown`](@/api/hooks.md#beforekeydown) hook before processing user events. If you register a listener for [`beforeKeyDown`](@/api/hooks.md#beforekeydown), that call `stopImmediatePropagation()` on `event` object [`EditorManager`](@/api/baseEditor.md) won perform its default action. More on overriding [`EditorManager`](@/api/baseEditor.md)'s behaviour in section "SelectEditor - creating editor from scratch".

You should now have a better understanding on how [`EditorManager`](@/api/baseEditor.md) works. Let's go a bit deeper and see what methods every editor class must implement and what those methods do.

::: only-for javascript

## [`BaseEditor`](@/api/baseEditor.md)

:::

::: only-for react

### [`BaseEditor`](@/api/baseEditor.md)
:::

`Handsontable.editors.BaseEditor` is an abstract class from which all editor classes should inherit. It implements some of the basic editor methods as well as declares some methods that should be implemented by each editor class. In this section we examine all of those methods.

::: only-for javascript

### Common methods

:::

::: only-for react

#### Common methods
:::

Common methods, are methods implemented by [`BaseEditor`](@/api/baseEditor.md) class. They contain some core logic that every editor should have. Most of the time, you shouldn't bother with those methods. However, if you are creating some more complex editors, you might want to override some of the common methods, in which case you should always invoke the original method and then perform other operations, specific to your editor.

**Example** - overriding common method

```js
// CustomEditor is a class, inheriting from BaseEditor
class CustomEditor extends BaseEditor {
  prepare(row, col, prop, td, originalValue, cellProperties) {
    // Invoke the original method...
    super.prepare(row, col, prop, td, originalValue, cellProperties);
    // ...and then do some stuff specific to your CustomEditor
    this.customEditorSpecificProperty = 'foo';
  }
}
```

There are 7 common methods. All of them are described below.

::: only-for javascript

#### prepare(row: `Number`, col: `Number`, prop: `Number|String`, td: `HTMLTableCellElement`, originalValue: `Mixed`, cellProperties: `Object`)

:::

::: only-for react

##### prepare(row: `Number`, col: `Number`, prop: `Number|String`, td: `HTMLTableCellElement`, originalValue: `Mixed`, cellProperties: `Object`)
:::

Prepares editor to be displayed for given cell. Sets most of the instance properties.

Returns: `undefined`

::: only-for javascript
#### beginEditing(newInitialValue: `Mixed`, event: `Mixed`)

:::

::: only-for react

##### beginEditing(newInitialValue: `Mixed`, event: `Mixed`)

:::

Sets editor value to `newInitialValue`. If `newInitialValue` is undefined, the editor value is set to original cell value. Calls [`open()`](@/api/baseEditor.md#open) method internally.

Returns: `undefined`

::: only-for javascript

#### finishEditing(restoreOriginalValue: 'Boolean' _\[optional\]_, ctrlDown: `Boolean` _\[optional\]_, callback: `Function`)

:::

::: only-for react

##### finishEditing(restoreOriginalValue: 'Boolean' _\[optional\]_, ctrlDown: `Boolean` _\[optional\]_, callback: `Function`)
:::

Tries to finish cell edition. Calls [`saveValue()`](@/api/baseEditor.md#savevalue) and `discardEditor()` internally. If `restoreOriginalValue` is set to `true` cell value is being set to its original value (from before the edition). `ctrlDown` value is passed to [`saveValue()`](@/api/baseEditor.md#savevalue) as the second argument.

Callback function contains a boolean parameter - if new value is valid or the [`allowInvalid`](@/api/options.md#allowinvalid) configuration option is set to `true`, otherwise the parameter is `false`.

::: only-for javascript

#### discardEditor(result: `Boolean`)

:::

::: only-for react

##### discardEditor(result: `Boolean`)
:::

Called when cell validation ends. If new value is saved successfully (`result` is set to `true` or [`allowInvalid`](@/api/options.md#allowinvalid) property is `true`) it calls [`close()`](@/api/baseEditor.md#close) method, otherwise calls [`focus()`](@/api/baseEditor.md#focus) method and keeps editor opened.

Returns: `undefined`

::: only-for javascript

#### saveValue(value: `Mixed`, ctrlDown: `Boolean`)

:::

::: only-for react

##### saveValue(value: `Mixed`, ctrlDown: `Boolean`)
:::

Tries to save `value` as new cell value. Performs validation internally. If `ctrlDown` is set to true the new value will be set to all selected cells.

Returns: `undefined`

::: only-for javascript

#### isOpened()

:::

::: only-for react

##### isOpened()
:::

Returns `true` if editor is opened or `false` if editor is closed. Editor is considered to be opened after [`open()`](@/api/baseEditor.md#open) has been called. Editor is considered closed [`close()`](@/api/baseEditor.md#close) after method has been called.

Returns: `Boolean`

::: only-for javascript

#### extend()

:::

::: only-for react

##### extend()
:::

Returns: `Function` - a class function that inherits from the current class. The `prototype` methods of the returned class can be safely overwritten, without a danger of altering the parent's `prototype`.

**Example** - inheriting from [`BaseEditor`](@/api/baseEditor.md) and overriding its method

```js
const CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

// This won't alter BaseEditor.prototype.beginEditing()
CustomEditor.prototype.beginEditing = function() {};
```

**Example** - inheriting from another editor

```js
const CustomTextEditor = Handsontable.editors.TextEditor.prototype.extend();

// CustomTextEditor uses all methods implemented by TextEditor.
// You can safely override any method without affecting original TextEditor.
```

**Note:** This is an utility method not related to the process of editing cell.

::: only-for javascript

### Editor specific methods

:::

::: only-for react

#### Editor specific methods

:::

Editor specific methods are methods not implemented in [`BaseEditor`](@/api/baseEditor.md). In order to work, every editor class has to implement those methods.

::: only-for javascript

#### init()

:::

::: only-for react

##### init()

:::

Method called when new instance of editor class is created. That happens at most once per table instance, as all used editors as **singletons** within table instance. You should use this methods to perform tasks which results can be reused during editor's lifecycle. The most common operation is creating HTML structure of editor.

Method does not need to return any value.

::: only-for javascript

#### getValue()

:::

::: only-for react

##### getValue()

:::

Method should act return the current editor value, that is value that should be saved as a new cell value.

::: only-for javascript

#### setValue(newValue: `Mixed`)

:::

::: only-for react

##### setValue(newValue: `Mixed`)

:::

Method should set editor value to `newValue`.

**Example** Let's say we are implementing a DateEditor, which helps selecting date, by displaying a calendar. [`getvalue()`](@/api/baseEditor.md#getvalue) and [`setvalue()`](@/api/baseEditor.md#setvalue) method could work like so:

```js
class CalendarEditor extends TextEditor {
  constructor(hotInstance) {
    super(hotInstance);
  }

  getValue() {
    // returns currently selected date, for example "2023/09/15"
    return calendar.getDate();
  }

  setValue(newValue) {
    // highlights given date on calendar
    calendar.highlightDate(newValue);
  }
}
```

::: only-for javascript

#### open()

:::

::: only-for react

##### open()
:::

Displays the editor. In most cases this method can be as simple as:

```js
class CustomEditor extends TextEditor {
  open() {
    this.editorDiv.style.display = '';
  }
}
```

This method does not need to return any value.

::: only-for javascript

#### close()

:::

::: only-for react

##### close()

:::

Hides the editor after cell value has been changed. In most cases this method can be as simple as:

```js
class CustomEditor extends TextEditor {
  close() {
    this.editorDiv.style.display = 'none';
  }
}
```

This method does not need to return any value.

::: only-for javascript

#### focus()

:::

::: only-for react

##### focus()

:::

Focuses the editor. This method is called when user wants to close the editor by selecting another cell and the value in editor does not validate (and [`allowInvalid`](@/api/options.md#allowinvalid) is `false`). In most cases this method can be as simple as:

```js
class CustomEditor extends TextEditor {
  focus() {
    this.editorInput.focus();
  }
}
```

This method does not need to return any value.

::: only-for javascript

### Common editor properties

:::

::: only-for react

#### Common editor properties
:::

All the undermentioned properties are available in editor instance through `this` object (e.g., `this.instance`).

  | Property       | Type                | Description                                                                                                                                                                     |
  | -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | instance       | `Handsontable.Core` | The instance of Handsontable to which this editor object belongs. Set in class constructor, immutable thorough the whole lifecycle of editor.                                   |
  | row            | `Number`            | The active cell row index. Updated on every [`prepare()`](@/api/baseEditor.md#prepare) method call.                                                                             |
  | col            | `Number`            | The active cell col index. Updated on every [`prepare()`](@/api/baseEditor.md#prepare) method call.                                                                             |
  | prop           | `String`            | The property name associated with active cell (relevant only when data source is an array of objects). Updated on every [`prepare()`](@/api/baseEditor.md#prepare) method call. |
  | TD             | `HTMLTableCellNode` | Node object of active cell. Updated on every [`prepare()`](@/api/baseEditor.md#prepare) method call.                                                                            |
  | cellProperties | `Object`            | An object representing active cell properties. Updated on every [`prepare()`](@/api/baseEditor.md#prepare) method call.                                                         |

::: only-for javascript

## How to create a custom editor?

:::

::: only-for react

### How to create a custom editor?

:::

Now you know the philosophy behind the Handsontable editors and you're ready to write your own editor. Basically, you can build a new editor from scratch, by creating a new editor class, which inherits from [`BaseEditor`](@/api/baseEditor.md), or if you just want to enhance an existing editor, you can extend its class and override only a few of its methods.

In this tutorial we will examine both approaches. We will create a completely new `SelectEditor` which uses `<select>` list to alter the value of cell. We will also create a `PasswordEditor` which works exactly like regular `TextEditor` except that it displays a password input instead of textarea.

Let's begin with `PasswordEditor` as it is a bit easier.

::: only-for javascript

### `PasswordEditor` - extending an existing editor

:::

::: only-for react

#### `PasswordEditor` - extending an existing editor
:::

`TextEditor` is the most complex editor available in Handsontable by default. It displays a `<textarea>` which automatically changes its size to accommodate its content. We would like to create a `PasswordEditor` which preserves all those capabilities but displays `<input type="password">` field instead of `<textarea>`.

As you may have guessed, we need to create a new editor class, that inherits from `TextEditor` and then override some of its methods to replace `<textarea>` with `input:password`. Luckily, textarea and password input have the same API, so all we have to do is replace the code responsible for creating HTML elements. If you take a look at `TextEditor` [`init()`](@/api/baseEditor.md#init) method, you'll notice that it calls internal `createElements()` method, which creates `<textarea>` node and append it to DOM during editor initialization - BINGO!

Here is the code

```js
import Handsontable from 'handsontable';

class PasswordEditor extends Handsontable.editors.TextEditor {
  createElements() {
    super.createElements();

    this.TEXTAREA = this.hot.rootDocument.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', true); // Makes the element recognizable by HOT as its own component's element.
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;

    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}
```

That's it! You can now use your new editor:

::: only-for javascript

```js
const container = document.querySelector('#container')
const hot = new Handsontable(container, {
  columns: [
    {
      type: 'text'
    },
    {
      editor: PasswordEditor
      // If you want to use string 'password' instead of passing
      // the actual editor class check out section "Registering editor"
    }
  ],
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[
    {
      type: 'text'
    },
    {
      editor: PasswordEditor
      // If you want to use string 'password' instead of passing
      // the actual editor class check out section "Registering editor"
    }
  ]}
/>
```

:::

Let's try something more complex: we'll build a new editor from the ground up.

::: only-for javascript

### `SelectEditor` - creating editor from scratch

:::

::: only-for react

#### `SelectEditor` - creating editor from scratch

:::

We're going to build a full featured editor, that lets user choose a cell value from predefined list of options, using standard `<select>` input. As an extra feature, we'll add an ability to change currently selected option with <kbd>**ARROW_UP**</kbd> and <kbd>**ARROW_DOWN**</kbd> keys.

Things to do:

1. Create a new class that inherits from `Handsontable.editors.BaseEditor`.
2. Add function creating `<select>` input and attaching to DOM.
3. Add function that populates `<select>` with options array passed in the cell properties.
4. Implement methods:
    - [`getvalue()`](@/api/baseEditor.md#getvalue)
    - [`setvalue()`](@/api/baseEditor.md#setvalue)
    - [`open()`](@/api/baseEditor.md#open)
    - [`close()`](@/api/baseEditor.md#close)
    - [`focus()`](@/api/baseEditor.md#focus)
5. Override the default [`EditorManager`](@/api/baseEditor.md) behaviour, so that pressing <kbd>**Arrow Up**</kbd> and <kbd>**Arrow Down**</kbd> keys won't close the editor, but instead change the currently selected value.
6. Register editor.

::: only-for javascript

#### Create new editor

:::

::: only-for react

##### Create new editor

:::

That's probably the easiest part. All we have to do is call `BaseEditor.prototype.extend()` function which will return a new function class that inherits from [`BaseEditor`](@/api/baseEditor.md).

```js
const SelectEditor = Handsontable.editors.BaseEditor.prototype.extend();
```

Task one: **DONE**

::: only-for javascript

#### Create `<select>` input and attaching it to DOM

:::

::: only-for react

##### Create `<select>` input and attaching it to DOM

:::

There are three potential places where we can put the function that will create `<select>` element and put it in the DOM:

- [`init()`](@/api/baseEditor.md#init) method
- [`prepare()`](@/api/baseEditor.md#prepare) method
- [`open()`](@/api/baseEditor.md#open) method

The key to choose the best solution is to understand when each of those methods are called.

[`init()`](@/api/baseEditor.md#init) method is called during creation of editor class object. That happens at most one per table instance, because once the object is created it is reused every time [`EditorManager`](@/api/baseEditor.md) asks for this editor class instance (see [Singleton pattern](http://en.wikipedia.org/wiki/Singleton_pattern) for details).

[`prepare()`](@/api/baseEditor.md#prepare) method is called every time the user selects a cell that has this particular editor class set as the [`editor`](@/api/options.md#editor) configuration option. So, if we set `SelectEditor` as editor for an entire column, then selecting any cell in this column will invoke [`prepare()`](@/api/baseEditor.md#prepare) method of `SelectEditor`. In other words, this method can be called hundreds of times during table life, especially when working with large data. Another important aspect of [`prepare()`](@/api/baseEditor.md#prepare) is that it should not display the editor (it's `open's` job). Displaying editor is triggered by user event such as pressing ENTER, F2 or double clicking a cell, so there is some time between calling [`prepare()`](@/api/baseEditor.md#prepare) and actually displaying the editor. Nevertheless, operations performed by [`prepare()`](@/api/baseEditor.md#prepare) should be completed as fast as possible, to provide the best user experience.

[`open()`](@/api/baseEditor.md#open) method is called when editor needs to be displayed. In most cases this method should change the CSS `display` property to `block` or perform something similar. User expects that editor will be displayed right after the event (pressing appropriate key or double clicking a cell) has been triggered, so [`open()`](@/api/baseEditor.md#open) method should work as fast as possible.

Knowing all this, the most reasonable place to put the code responsible for creating `<select>` input is somewhere in [`init()`](@/api/baseEditor.md#init) method. DOM manipulation is considered to be quite expensive (regarding the resource consumption) operation, so it's best to perform it once and reuse the produced HTML nodes throughout the life of editor.

```js
import Handsontable from 'handsontable';

class SelectEditor extends Handsontable.editors.BaseEditor {
  /**
   * Initializes editor instance, DOM Element and mount hooks.
   */
  init() {
    // Create detached node, add CSS class and make sure its not visible
    this.select = this.hot.rootDocument.createElement('SELECT');
    this.select.classList.add('htSelectEditor');
    this.select.style.display = 'none';

    // Attach node to DOM, by appending it to the container holding the table
    this.hot.rootElement.appendChild(this.select);
  }
}
```
```css
.htSelectEditor {
  /*
   * This hack enables to change <select> dimensions in WebKit browsers
   */
  -webkit-appearance: menulist-button !important;
  position: absolute;
  width: auto;
  z-index: 300;
}
```

Task two: **DONE**

::: only-for javascript

#### Populate `<select>` with options

:::

::: only-for react

##### Populate `<select>` with options

:::

In the previous step we implemented a function that creates the `<select>` input and attaches it to the DOM. You probably noticed that we haven't written any code that would create the `<option>` elements, therefore if we displayed the list, it would be empty.

We want to be able to define an option list like this:

::: only-for javascript

```js
const container = document.querySelector('#container')
const hot = new Handsontable(container, {
  columns: [
    {
      editor: SelectEditor,
      selectOptions: ['option1', 'option2', 'option3']
    }
  ]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[
    {
      editor: SelectEditor,
      selectOptions: ['option1', 'option2', 'option3']
    }
  ]}
/>
```

:::

There is no (easy) way to get to the value of [`selectOptions`](@/api/options.md#selectoptions). Even if we could get to this array we could only populate the list with options once, if we do this in the 'init' function. What if we have more than one column using `SelectEditor` and each of them has it's own option list? It's even possible that two cells in the same column can have different option lists (cascade configuration - remember?) It's clear that we have to find a better place for the code that creates items for our list.

We are left with two places [`prepare()`](@/api/baseEditor.md#prepare) and [`open()`](@/api/baseEditor.md#open). The latter one is simpler to implement, but as we previously stated, [`setvalue()`](@/api/baseEditor.md#setvalue) should work as fast as possible and creating `<option>` nodes and attaching them to DOM might be time consuming, if [`selectOptions`](@/api/options.md#selectoptions) contains long list of options. Therefore, [`prepare()`](@/api/baseEditor.md#prepare) seems to be a safer place to do this kind of work. The only thing to keep in mind is that we should always invoke [`BaseEditor`](@/api/baseEditor.md)'s original method when overriding [`prepare()`](@/api/baseEditor.md#prepare). `BaseEditor.prototype.prepare()` sets some important properties, which are used by other editor methods.

```js
// Create options in prepare() method
prepare(row, col, prop, td, originalValue, cellProperties) {
  // Remember to invoke parent's method
  super.prepare(row, col, prop, td, originalValue, cellProperties);

  const selectOptions = this.cellProperties.selectOptions;
  let options;

  if (typeof selectOptions === 'function') {
    options = this.prepareOptions(selectOptions(this.row, this.col, this.prop));
  } else {
    options = this.prepareOptions(selectOptions);
  }

  this.select.innerText = '';

  Object.keys(options).forEach((key) => {
    const optionElement = this.hot.rootDocument.createElement('OPTION');
    optionElement.value = key;
    optionElement.innerText = options[key];
    this.select.appendChild(optionElement);
  });
}
```

Where the `prepareOptions` is:

```js
prepareOptions(optionsToPrepare) {
  let preparedOptions = {};

  if (Array.isArray(optionsToPrepare)) {
    for (let i = 0, len = optionsToPrepare.length; i < len; i++) {
      preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
    }

  } else if (typeof optionsToPrepare === 'object') {
    preparedOptions = optionsToPrepare;
  }

  return preparedOptions;
}
```

Task three: **DONE**

::: only-for javascript

#### Implement editor specific methods

:::

::: only-for react

##### Implement editor specific methods

:::

Most of the work is done. Now we just need to implement all the editor specific methods. Luckily, our editor is quite simple so those methods will be only few lines of code.

```js
getValue() {
  return this.select.value;
}

setValue(value) {
  this.select.value = value;
}

open() {
  const {
    top,
    start,
    width,
    height,
  } = this.getEditedCellRect();
  const selectStyle = this.select.style;

  this._opened = true;

  selectStyle.height = `${height}px`;
  selectStyle.minWidth = `${width}px`;
  selectStyle.top = `${top}px`;
  selectStyle[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`;
  selectStyle.margin = '0px';
  selectStyle.display = '';
}

focus() {
  this.select.focus();
}

close() {
  this._opened = false;
  this.select.style.display = 'none';
}
```

The implementations of [`getvalue()`](@/api/baseEditor.md#getvalue), [`setvalue()`](@/api/baseEditor.md#setvalue) and [`close()`](@/api/baseEditor.md#close) are self-explanatory, but [`open()`](@/api/baseEditor.md#open) requires a few words of comment. First of all, the implementation assumes that code responsible for populating the list with options is placed in [`prepare()`](@/api/baseEditor.md#prepare). Secondly, before displaying the list, we sets its `height` and `min-width` so that it matches the size of corresponding cell. It's an optional step, but without it the editor will have different sizes depending on the browser. Probably a good idea would be also to limit the maximum height of `<select>`. Finally, as the `<select>` has been appended to the end of the table container, we have to change its position so that it could be displayed above the cell that is being edited. Again, this is an optional step, but it seems quite reasonable to put the editor next to the appropriate cell.

Task four: **DONE**

At this point we should have an editor that is ready to use. Put the code somewhere in your page and pass `SelectEditor` class function as value of the [`editor`](@/api/options.md#editor) configuration option.

::: only-for javascript

```js
const container = document.querySelector('#container')
const hot = new Handsontable(container, {
  columns: [
    {},
    {
      editor: SelectEditor,
      selectOptions: ['option1', 'option2', 'option3']
    }
  ]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[
    {},
    {
      editor: SelectEditor,
      selectOptions: ['option1', 'option2', 'option3']
    }
  ]}
/>
```

:::

::: only-for javascript

#### Use <kbd>**Arrow Up**</kbd> and <kbd>**Arrow Down**</kbd> to change selected value

:::

::: only-for react

##### Use <kbd>**Arrow Up**</kbd> and <kbd>**Arrow Down**</kbd> to change selected value

:::

We know that our editor works, but let's add one more tweak to it. Currently, when editor is opened and user presses <kbd>**Arrow Up**</kbd> or <kbd>**Arrow Down**</kbd> editor closes and the selection moves one cell up or down. Wouldn't it be nice, if pressing up and down arrow keys changed the currently selected value? User could navigate to the cell, hit <kbd>**Enter**</kbd>, choose the desired value and save changes by hitting <kbd>**Enter**</kbd> again. It would be possible to work with the table without even laying your hand on a mouse. Sounds pretty good, but how to override the default behavior? After all, it's the [`EditorManager`](@/api/baseEditor.md) who decides when to close the editor.

Don't worry. Although, you don't have a direct access to [`EditorManager`](@/api/baseEditor.md) instance, you can still override its behaviour. Before [`EditorManager`](@/api/baseEditor.md) starts to process keyboard events it triggers [`beforeKeyDown`](@/api/hooks.md#beforekeydown) hook. If any of the listening functions invoke `stopImmediatePropagation()` method on an `event` object [`EditorManager`](@/api/baseEditor.md) won't process this event any further. Therefore, all we have to do is register a [`beforeKeyDown`](@/api/hooks.md#beforekeydown) listener function that checks whether <kbd>**Arrow Up**</kbd> or <kbd>**Arrow Down**</kbd> has been pressed and if so, stops event propagation and changes the currently selected value in `<select>` list accordingly.

The thing that we need to keep in mind is that our listener should work only, when our editor is opened. We want to preserve the default behaviour for other editors, as well as when no editor is opened. That's why the most reasonable place to register our listener would be the [`open()`](@/api/baseEditor.md#open) method and the [`close()`](@/api/baseEditor.md#close) method should contain code that will remove our listener.

Here's how the listener function could look like:
```js
onBeforeKeyDown() {
  const previousOptionIndex = this.select.selectedIndex - 1;
  const nextOptionIndex = this.select.selectedIndex + 1;

  switch (event.keyCode) {
    case 38: // Arrow Up
      if (previousOptionIndex >= 0) {
        this.select[previousOptionIndex].selected = true;
      }

      event.stopImmediatePropagation();
      event.preventDefault();
      break;

    case 40: // Arrow Down
      if (nextOptionIndex <= this.select.length - 1){
        this.select[nextOptionIndex].selected=true;
      }

      event.stopImmediatePropagation();
      event.preventDefault();
      break;

    default:
      break;
  }
}
```
Active editor is the editor which [`prepare()`](@/api/baseEditor.md#prepare) method was called most recently. For example, if you select a cell which editor is `Handsontable.TextEditor`, then `getActiveEditor()` will return an object of this editor class. If then select a cell (presumably in another column) which editor is `Handsontable.DateEditor`, the active editor changes and now `getActiveEditor()` will return an object of `DateEditor` class.

The rest of the code should be quite clear. Now all we have to do is register our listener.

```js
open() {
  this.addHook('beforeKeyDown', () => this.onBeforeKeyDown());
}

close() {
  this.clearHooks();
}
```

Go ahead and test it!

Registering an editor
---------------------

When you create an editor, a good idea is to assign it an alias that will refer to this particular editor class. Handsontable defines 11 aliases by default:

- `autocomplete` for `Handsontable.editors.AutocompleteEditor`
- `base` for `Handsontable.editors.BaseEditor`
- `checkbox` for `Handsontable.editors.CheckboxEditor`
- `date` for `Handsontable.editors.DateEditor`
- `dropdown` for `Handsontable.editors.DropdownEditor`
- `handsontable` for `Handsontable.editors.HandsontableEditor`
- `numeric` for `Handsontable.editors.NumericEditor`
- `password` for `Handsontable.editors.PasswordEditor`
- `select` for `Handsontable.editors.SelectEditor`
- `text` for `Handsontable.editors.TextEditor`
- `time` for `Handsontable.editors.TimeEditor`

It gives users a convenient way for defining which editor should be use when changing value of certain cells. User doesn't need to know which class is responsible for displaying the editor, he does not even need to know that there is any class at all. What is more, you can change the class associated with an alias without a need to change code that defines a table.

To register your own alias use `Handsontable.editors.registerEditor()` function. It takes two arguments:

- `editorName` - a string representing an editor
- `editorClass` - a class that will be represented by `editorName`

If you'd like to register `SelectEditor` under alias `select` you have to call:

```js
Handsontable.editors.registerEditor('select', SelectEditor);
```

Choose aliases wisely. If you register your editor under name that is already registered, the target class will be overwritten:

```js
Handsontable.editors.registerEditor('text', MyNewTextEditor);
```

Now 'text' alias points to MyNewTextEditor class, not `Handsontable.editors.TextEditor`.

So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is prefixing your aliases with some custom name (for example your GitHub username) to minimize the possibility of name collisions. This is especially important if you want to publish your editor, because you never know aliases has been registered by the user who uses your editor.

```js
Handsontable.editors.registerEditor('select', SelectEditor);
```

Someone might already registered such alias.

```js
Handsontable.editors.registerEditor('my.select', SelectEditor);
```

That's better.

::: only-for javascript

## Prepare editor for publication

:::

::: only-for react

### Prepare editor for publication

:::

If you plan to publish your editor or just want to keep your code nice and clean (as we all do :) there are 3 simple steps that will help you to organize your code.

::: only-for javascript

### Enclose in IIFE

:::

::: only-for react

#### Enclose in IIFE

:::

Put your code in a module, to avoid polluting the global namespace. You can use AMD, CommonJS or any other module pattern, but the easiest way to isolate your code is to use plain immediately invoked function expression (IIFE).

```js
(Handsontable => {
  const CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

  // ...rest of the editor code

})(Handsontable);
```

Passing `Handsontable` namespace as argument is optional (as it is defined globally), but it's a good practice to use as few global objects as possible, to make modularisation and dependency management easier.

::: only-for javascript

### Add editor to dedicated namespace

:::

::: only-for react

#### Add editor to dedicated namespace

:::

Code enclosed in IIFE cannot be accessed from outside, unless it's intentionally exposed. To keep things well organized register your editor to the collection of editors using `Handsontable.editors.registerEditor` method. This way you can use your editor during table definition and other users will have an easy access to your editor, in case they would like to extend it.

```js
(Handsontable => {
  const CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

  // ...rest of the editor code

  // And at the end
  Handsontable.editors.registerEditor('custom', CustomEditor);

})(Handsontable);
```

From now on, you can use `CustomEditor` like so:

::: only-for javascript

```js
const container = document.querySelector('#container');
const hot = new Handsontable(container, {
  columns: [{
    editor: Handsontable.editors.CustomEditor
  }]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    editor: Handsontable.editors.CustomEditor
  }]}
/>
```

:::

Extending your `CustomEditor` is also easy.

```js
const AnotherEditor = Handsontable.editors.getEditor('custom').prototype.extend();
```

Keep in mind, that there are no restrictions to the name you choose, but choose wisely and do not overwrite existing editors. Try to keep the names unique.

::: only-for javascript

### Register an alias

:::

::: only-for react

#### Register an alias

:::

The final touch is to register your editor under some alias, so that users can easily refer to it without the need to now the actual class name. See Registering editor for details.

To sum up, a well prepared editor should look like this:

```js
(Handsontable => {
  const CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

  // ...rest of the editor code

  // Put editor in dedicated namespace
  Handsontable.editors.CustomEditor = CustomEditor;

  // Register alias
  Handsontable.editors.registerEditor('theBestEditor', CustomEditor);

})(Handsontable);
```

From now on, you can use `CustomEditor` like so:

::: only-for javascript

```js
const container = document.querySelector('#container')
const hot = new Handsontable(container, {
  columns: [{
    editor: 'theBestEditor'
  }]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    editor: 'theBestEditor'
  }]}
/>
```

:::

## Related keyboard shortcuts

| Windows                                                 | macOS                                                           | Action                                                            |  Excel  | Sheets  |
| ------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- | :-----: | :-----: |
| Arrow keys                                              | Arrow keys                                                      | Move the cursor through the text                                  | &check; | &check; |
| Alphanumeric keys                                       | Alphanumeric keys                                               | Enter the pressed key's value into the cell                       | &check; | &check; |
| <kbd>**Enter**</kbd>                                    | <kbd>**Enter**</kbd>                                            | Complete the cell entry and move to the cell below                | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>             | <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>                     | Complete the cell entry and move to the cell above                | &check; | &check; |
| <kbd>**Tab**</kbd>                                      | <kbd>**Tab**</kbd>                                              | Complete the cell entry and move to the next cell<sup>*</sup>     | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>               | <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>                       | Complete the cell entry and move to the previous cell<sup>*</sup> | &check; | &check; |
| <kbd>**Delete**</kbd>                                   | <kbd>**Delete**</kbd>                                           | Delete one character after the cursor<sup>*</sup>                 | &check; | &check; |
| <kbd>**Backspace**</kbd>                                | <kbd>**Backspace**</kbd>                                        | Delete one character before the cursor<sup>*</sup>                | &check; | &check; |
| <kbd>**Home**</kbd>                                     | <kbd>**Home**</kbd>                                             | Move the cursor to the beginning of the text<sup>*</sup>          | &check; | &check; |
| <kbd>**End**</kbd>                                      | <kbd>**End**</kbd>                                              | Move the cursor to the end of the text<sup>*</sup>                | &check; | &check; |
| <kbd>**Ctrl**</kbd> + Arrow keys                        | <kbd>**Cmd**</kbd> + Arrow keys                                 | Move the cursor to the beginning or to the end of the text        | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd> + Arrow keys | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd> + Arrow keys          | Extend the selection to the beginning or to the end of the text   | &check; | &check; |
| <kbd>**Page Up**</kbd>                                  | <kbd>**Page Up**</kbd>                                          | Complete the cell entry and move one screen up                    | &check; | &check; |
| <kbd>**Page Down**</kbd>                                | <kbd>**Page Down**</kbd>                                        | Complete the cell entry and move one screen down                  | &check; | &check; |
| <kbd>**Alt**</kbd>+<kbd>**Enter**</kbd>               | <kbd>**Option**</kbd>+<kbd>**Enter**</kbd>                    | Insert a line break                                               | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>              | <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd> | Insert a line break                                               | &cross; | &check; |
| <kbd>**Escape**</kbd>                                   | <kbd>**Escape**</kbd>                                           | Cancel the cell entry and exit the editing mode                   | &check; | &check; |

<sup>*</sup> This action depends on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md).

::: only-for javascript

## Related articles

### Related guides
<div class="boxes-list gray">

- [Custom editor in React](@/react/guides/cell-functions/cell-editor/cell-editor.md)
- [Custom editor in Angular](@/guides/integrate-with-angular/angular-custom-editor-example/angular-custom-editor-example.md)
- [Custom editor in Vue 2](@/guides/integrate-with-vue/vue-custom-editor-example/vue-custom-editor-example.md)
- [Custom editor in Vue 3](@/guides/integrate-with-vue3/vue3-custom-editor-example/vue3-custom-editor-example.md)

</div>

### Related API reference

:::

::: only-for react

## Related API reference

:::

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`editor`](@/api/options.md#editor)
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- Core methods:
  - [`destroyEditor()`](@/api/core.md#destroyeditor)
  - [`getActiveEditor()`](@/api/core.md#getactiveeditor)
  - [`getCellEditor()`](@/api/core.md#getcelleditor)
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`beforeBeginEditing`](@/api/hooks.md#beforebeginediting)
  - [`afterBeginEditing`](@/api/hooks.md#afterbeginediting)
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
