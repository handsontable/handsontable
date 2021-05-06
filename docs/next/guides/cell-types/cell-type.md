---
title: Cell type
permalink: /next/cell-type
canonicalUrl: /cell-type
---

# Cell type

[[toc]]

## Purpose

As we mentioned before, there are 3 functions associated with every table cell: `renderer`, `editor` and (optionally) `validator`. Most of the time, those functions are strongly connected to each other. For example if you want to store a date in a cell, you will most likely use a renderer which will display the date using appropriate formatting (`dd/mm/yyy`, `yyy-mm-dd` etc.). You will also use an editor, which will display a calendar instead of the default text input, so user could easily pick the right date. Finally, you might want to check if the value entered by a user is valid.

Cell type is represented by a string i.e. `"text"`, `"numeric"`, `"date"`. Each string is internally mapped to functions associated with this type. For example `"numeric"` type is associated with functions:

* `Handsontable.renderers.NumericRenderer`
* `Handsontable.editors.TextEditor`
* `Handsontable.validators.NumericValidator`

For example, writing:

```js
columns: [{
  type: 'password'
}]
```

Equals:

```js
columns: [{
  editor: Handsontable.editors.PasswordEditor
  renderer: Handsontable.renderers.PasswordRenderer,
  copyable: false,
}]
```

When Handsontable encounters a cell with `type` option defined, it checks to which cell functions this type refers and use them.

## Available cell types

Handsontable comes with 9 types:

* ["autocomplete"](autocomplete-cell-type.md) or `Handsontable.cellTypes.autocomplete`
* ["checkbox"](checkbox-cell-type.md) or `Handsontable.cellTypes.checkbox`
* ["date"](date-cell-type.md) or `Handsontable.cellTypes.date`
* ["dropdown"](dropdown-cell-type.md) or `Handsontable.cellTypes.dropdown`
* ["handsontable"](handsontable-cell-type.md) or `Handsontable.cellTypes.handsontable`
* ["numeric"](numeric-cell-type.md) or `Handsontable.cellTypes.numeric`
* ["password"](password-cell-type.md) or `Handsontable.cellTypes.password`
* ["select"](select-cell-type.md) or `Handsontable.cellTypes.select`
* ["time"](time-cell-type.md) or `Handsontable.cellTypes.time`
* "text" or `Handsontable.cellTypes.text`

the `text` cell type is the default type.

## Anatomy of a cell type

A cell type is a predefined set of cell properties. Cell type defines what `renderer`, `editor` or `validator` should be used for a cell. They can also define any different cell property that will be assumed for each matching cell:

```js
Handsontable.cellTypes.registerCellType('custom', {
  renderer: Handsontable.renderers.TextRenderer,
  className: 'my-cell',
  readOnly: true,
  myCustomProperty: 'foo'
})
```

When used in Handsontable settings:

```js
columns: [{
  type: 'custom'
}]
```

Is an equivalent to defining them all:

```js
columns: [{
  editor: false,
  renderer: Handsontable.renderers.TextRenderer,
  className: 'my-cell',
  readOnly: true,
  myCustomProperty: 'foo'
}]
```

## Registering custom cell type

When you create a custom cell type, a good idea is to assign it as an alias that will refer to this particular type definition.

It gives users a convenient way for defining which cell type should be used for describing cell properties. User doesn't need to know which part of code is responsible for rendering, validating or editing the cell value, he does not even need to know that there is any functions at all. What is more, you can change the cell behaviour associated with an alias without a need to change the code that defines a cell properties.

To register your own alias use `Handsontable.cellTypes.registerCellType()` function. It takes two arguments:

* `cellTypeName` - a string representing of the cell type object
* `type` - an object with keys `editor`, `renderer` and `validator` that will be represented by `cellTypeName`

If you'd like to register `copyablePasswordType` under alias `copyable-password` you have to call:

```js
Handsontable.cellTypes.registerCellType('copyable-password', {
  editor: copyablePasswordEditor,
  renderer: copyablePasswordRenderer,
});
```

Choose aliases wisely. If you register your cell type under name that is already registered, the target function will be overwritten:

```js
Handsontable.cellTypes.registerCellType('password', {
  editor: copyablePasswordEditor,
  renderer: copyablePasswordRenderer,
});

// Now 'password' alias points to the newly created 
// object, not Handsontable.cellTypes.password
```

So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is prefixing your aliases with some custom name to minimize the possibility of name collisions. This is especially important if you want to publish your cell type, because you never know aliases has been registered by the user who uses your cell type.

```js
Handsontable.cellTypes.registerCellType('copyable-password', {
  editor: copyablePasswordEditor,
  renderer: copyablePasswordRenderer,
});
```
Someone might already registered such alias. It would be better use an unique prefix:

```js
Handsontable.cellTypes.registerCellType('my.copyable-password', {
  editor: copyablePasswordEditor,
  renderer: copyablePasswordRenderer,
});
```

To sum up, a well-prepared cell type object should look like this:

```js
var MyEditor = Handsontable.editors.TextEditor.prototype.extend();

function customRenderer(instance, td, row, column, prop, value, cellProperties) {
  // ...renderer logic
}

function customValidator(query, callback) {
  // ...validator logic
  callback(/* Pass `true` or `false` */);
}

// Register an alias
Handsontable.cellTypes.registerCellType('my.custom', {
  editor: MyEditor,
  renderer: customRenderer,
  validator: customValidator,
  // You can add additional options to the cell type 
  // based on Handsontable settings
  className: 'my-cell',
  allowInvalid: true,
  // Or you can add custom properties which 
  // will be accessible in `cellProperties`
  myCustomCellState: 'complete',
});
```

## Using an alias

The next step is to use the registered aliases, so that users can easily refer to it without the need to now the actual cell type object is.  You can use your cell definition like so:

```js
const hot = new Handsontable(container, {
  columns: [{ 
    type: 'my.custom' 
  }]
});
```

## Precedence

It is possible to define the `type` option together with options such as `renderer`, `editor` or `validator`. Lets look at this example:

```js
const hot = new Handsontable(container, {
  columns: [{
    type: 'numeric',
    // validator function defined elsewhere
    validator: customValidator
  }]
});
```

We defined the `type` for all cells in a column to be `numeric`. Besides that, we also defined a validator function directly. In Handsontable, cell functions defined directly always take precedence over functions associated with cell type, so the above configuration is equivalent to:

```js
const hot = new Handsontable(container, {
  columns: [{
    renderer: Handsontable.renderers.NumericRenderer,
    editor: Handsontable.editors.TextEditor,
    validator: customValidator
  }]
});
```

There is one more way you can define the configuration using types:

```js
const hot = new Handsontable(container, {
  // validator function defined elsewhere
  validator: customValidator,
  columns: [
    { type: 'password' },
    { }
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
const hot = new Handsontable(container, {
  columns: [{
    renderer: Handsontable.renderers.PasswordRenderer,
    editor: Handsontable.editors.PasswordEditor,
    validator: undefined
  }, {
    renderer: Handsontable.renderers.TextRenderer,
    editor: Handsontable.editors.TextEditor,
    validator: customValidator
  }]
});
```

## Example

The below example shows some of the built-in cell types (in other words, combinations of cell renderers and editors) available in Handsontable. The same example also shows the declaration of custom cell renderers, namely `yellowRenderer` and `greenRenderer`.

::: example #example1
```js
const container = document.getElementById('example1');
const colors = ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"];

const yellowRenderer = function(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  td.style.backgroundColor = 'yellow';
};

const greenRenderer = function(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);

  td.style.backgroundColor = 'green';
};

const hot1 = new Handsontable(container, {
  data: [
    { id: 1, name: 'Ted', isActive: true, color: 'orange', date: '2015-01-01' },
    { id: 2, name: 'John', isActive: false, color: 'black', date: null },
    { id: 3, name: 'Al', isActive: true, color: 'red', date: null },
    { id: 4, name: 'Ben', isActive: false, color: 'blue', date: null },
  ],
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: "id", type: 'text' },
    // 'text' is default, you don't actually need to declare it
    { data: "name", renderer: yellowRenderer },
    // use default 'text' cell type but overwrite its renderer with yellowRenderer
    { data: "isActive", type: 'checkbox' },
    { data: "date", type: 'date', dateFormat: 'YYYY-MM-DD' },
    { data: "color", type: 'autocomplete', source: colors }
  ],
  cell: [
    { row: 1, col: 0, renderer: greenRenderer }
  ],
  cells: function (row, col, prop) {
    if (row === 0 && col === 0) {
      this.renderer = greenRenderer;
    }
  }
});
```
:::
