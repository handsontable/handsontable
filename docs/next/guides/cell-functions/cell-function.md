---
title: Cell function
permalink: /next/cell-function
canonicalUrl: /cell-function
---

# Cell function

[[toc]]

With every cell in the Handsontable there are 3 associated functions:

* renderer
* editor
* validator

Each of those functions are responsible for a different cell behavior. You can define them separately or use a [cell type](#cell-type) to define all three at once. We will now discuss the purpose of the aforementioned functions in details.

Renderer
--------

Handsontable does not display the values stored in the datasource directly. Instead, every time a value from data source needs to be displayed in a table cell, it is passed to the cell `renderer` function, together with the table cell object of type `HTMLTableCellElement` (DOM node), along with other useful information.

`Renderer` is expected to format the passed value and place it as a content of the cell object. `Renderer` can also alter the cell class list, i.e. it can add a `htInvalid` class to let the user know, that the displayed value is invalid.

### Native cell renderers

Handsontable comes with 5 predefined renderers that you can extend, when writing your own renderers.

* `TextRenderer`
* `NumericRenderer`
* `AutocompleteRenderer`
* `CheckboxRenderer`
* `PasswordRenderer`

`TextRenderer` is the default renderer for all cells. If you write your own renderer, you will most likely want run this renderer at some point, as it handles things like marking cell as _read only_ or _invalid_, however calling `TextRenderer` is not obligatory.

### Adding event listeners in cell renderer function

If you are writing an advanced cell renderer and you want to add some custom behavior after a certain user action (i.e. after user hover a mouse pointer over a cell) you might be tempted to add an event listener directly to table cell node passed as an argument to the `renderer` function. Unfortunately, this will almost always cause you trouble and you will end up with either performance issues or having the listeners attached to the wrong cell.

This is because Handsontable:

* calls `renderer` functions multiple times per cell - this can lead to having multiple copies of the same event listener attached to a cell
* reuses table cell nodes during table scrolling and adding/removing new rows/columns - this can lead to having event listeners attached to the wrong cell

Before deciding to attach an event listener in cell renderer make sure, that there is no [Handsontable event](api/pluginHooks.md) that suits your needs. Using _Handsontable events_ system is the safest way to respond to user actions.

If you did't find a suitable _Handsontable event_ put the cell content into a wrapping `<div>`, attach the event listener to the wrapper and then put it into the table cell.

### Performance

Cell renderers are called separately for every displayed cell, during every table render. Table can be rendered multiple times during its lifetime (after table scroll, after table sorting, after cell edit etc.), therefore you should keep your `renderer` functions as simple and fast as possible or you might experience a performance drop, especially when dealing with large sets of data.

### Renderer templates

Editor
------

Cell editors are the most complex cell functions. We have prepared a separate page [Custom-cell-editor](cell-editor.md) explaining how cell edit works and how to write your own cell editor.

Validator
---------

Cell validator can be either a function or a regular expression. A cell is considered valid, when the validator function calls a `callback` (passed as one of the `validator` arguments) with `true` or the validation regex [test()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test) method returns `true`. Because the validity of a value is determined only by the argument that is passed to `callback`, `validator` function can be synchronous or asynchronous.

Contrary to `renderer` and `editor` functions, the `validator` function doesn't have to be defined for each cell. If the `validator` function is not defined, then a cell value is always valid.

Cell type
---------

As we mentioned before, there are 3 functions associated with every table cell: `renderer`, `editor` and (optionally) `validator`. Most of the time, those function are strongly connected to each other. For example if you want to store a date in a cell, you will most likely use a renderer which will display the date using appropriate formatting (`dd/mm/yyy`, `yyy-mm-dd` etc.). You will also use an editor, which will display a calendar instead of the default text input, so user could easily pick the right date. Finally, you might want to check if the value entered by a user is valid.

Manually defining those functions for cells or columns would be tedious, so to simplify the configuration, Handsontable introduced _cell types_.

Cell type is represented by a string i.e. `"text"`, `"numeric"`, `"date"`. Each string is internally mapped to functions associated with this type. For example `"numeric"` type is associated with functions:

* `Handsontable.renderers.NumericRenderer`
* `Handsontable.editors.TextEditor`
* `Handsontable.validators.NumericValidator`

so instead of writing

```js
var hot = new Handsontable(document.getElementById('container'), {
  columns: [
    {
      renderer: Handsontable.renderers.NumericRenderer,
      editor: Handsontable.editors.TextEditor,
      validator: Handsontable.validators.NumericValidator
    }
  ]
});
```

you can simply write

```js
var hot = new Handsontable(document.getElementById('container'), {
  columns: [
    {
      type: 'numeric'
    }
  ]
});
```

When Handsontable encounters a cell with `type` option defined, it checks to which cell functions this type refers and use them.

### Native types

Handsontable comes with 9 types:

* `text`
* `numeric`
* `date`
* `checkbox`
* `password`
* `select`
* `dropdown`
* `autocomplete`
* `handsontable`

`text` cell type is the default type.

### Precedence

It is possible to define the `type` option together with options such as `renderer`, `editor` or `validator`. Lets look at this example:

```js
var hot = new Handsontable(document.getElementById('container'), {
  columns: [
  {
    type: 'numeric',
    validator: customValidator // validator function defined elsewhere
  }
]
});
```

We defined the `type` for all cells in a column to be `numeric`. Besides that, we also defined a validator function directly. In Handsontable, cell functions defined directly always take precedence over functions associated with cell type, so the above configuration is equivalent to:

```js
var hot = new Handsontable(document.getElementById('container'), {
  columns: [
    {
      renderer: Handsontable.renderers.NumericRenderer,
      editor: Handsontable.editors.TextEditor,
      validator: customValidator
    }
  ]
});
```

There is one more way you can define the configuration using types:

```js
var hot = new Handsontable(document.getElementById('container'), {
  validator: customValidator, // validator function defined elsewhere
  columns: [
    {
      type: 'password'
    },
    {}
  ]
});
```

We take advantage of the [cascade configuration](setting-options.md#page-config) and define a table with two columns, with `validator` set to `customValidator` function. We also set `type` of the first column to `password`. `Password` cell type does not define a validator function:

```js
renderer: Handsontable.renderers.PasswordRenderer,
editor: Handsontable.editors.PasswordEditor,
validator: undefined
```

Because `type: 'password'` is a more specific configuration for the cells in the first column, than the `validator: customValidator`, cell functions associated with the `password` type takes precedence over the functions defined on the higher level of configuration. Therefore, the equivalent configuration is:

```js
var hot = new Handsontable(document.getElementById('container'), {
  columns: [
    {
      renderer: Handsontable.renderers.PasswordRenderer,
      editor: Handsontable.editors.PasswordEditor,
      validator: undefined
    }
    {
      renderer: Handsontable.renderers.TextRenderer, // text cell type is the default one
      editor: Handsontable.editors.TextEditor, // text cell type is the default one
      validator: customValidator
    }
  ]
});
```

Cell functions getters
----------------------

If, for some reason, you have to get the `renderer`, `editor` or `validator` function of specific cell you can use standard `getCellMeta(row, col)` method to get all properties of particular cell and then refer to cell functions like so:

```js
var cellProperties = $('#container').handsontable('getCellMeta', 0, 0);
// get cell properties for cell [0, 0]
cellProperties.renderer; // get cell renderer
cellProperties.editor; // get cell editor
cellProperties.validator; // get cell validator
```

However, you have to remember that `getCellMeta()` return cell properties "as they are", which means that if you use cell type to set cell functions, instead of defining functions directly those cell functions will be `undefined`:

```js
var hot = new Handsontable(document.getElementById('container'), {
  columns: [
    {
      type: 'numeric'
    }
  ]
});

var cellProperties = hot.getCellMeta(0, 0); // get cell properties for cell [0, 0]
cellProperties.renderer; // undefined
cellProperties.editor; // undefined
cellProperties.validator; // undefined
cellProperties.type; // "numeric"
```

To get the actual cell function use appropriate _cell function getter_:

* `getCellRenderer(row, col)`
* `getCellEditor(row, col)`
* `getCellValidator(row, col)`

Those functions will always return an appropriate value, regardless of whether cell functions have been defined directly or using a cell type.
