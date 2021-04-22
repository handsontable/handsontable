---
title: Cell type
permalink: /next/cell-type
canonicalUrl: /cell-type
---

# Cell type

[[toc]]

## Registering a cell-type

When you create a custom cell type, a good idea is to assign it as an alias that will refer to this particular type definition. Handsontable defines 9 aliases by default:

* `autocomplete` for `Handsontable.cellTypes.autocomplete`
* `checkbox` for `Handsontable.cellTypes.checkbox`
* `date` for `Handsontable.cellTypes.date`
* `dropdown` for `Handsontable.cellTypes.dropdown`
* `handsontable` for `Handsontable.cellTypes.handsontable`
* `numeric` for `Handsontable.cellTypes.numeric`
* `password` for `Handsontable.cellTypes.password`
* `text` for `Handsontable.cellTypes.text`
* `time` for `Handsontable.cellTypes.time`

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

// Now 'password' alias points to the newly created object, not Handsontable.cellTypes.password
```

So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is prefixing your aliases with some custom name to minimize the possibility of name collisions. This is especially important if you want to publish your cell type, because you never know aliases has been registered by the user who uses your cell type.

```js
Handsontable.cellTypes.registerCellType('copyable-password', {
  editor: copyablePasswordEditor,
  renderer: copyablePasswordRenderer,
});

// Someone might already registered such alias
```

```js
Handsontable.cellTypes.registerCellType('my.copyable-password', {
  editor: copyablePasswordEditor,
  renderer: copyablePasswordRenderer,
});

// That's better.`
```

## Using an alias

The final touch is to using the registered aliases, so that users can easily refer to it without the need to now the actual cell type object is.

To sum up, a well prepared cell type object should look like this:

```js
(function(Handsontable){
  var MyEditor = Handsontable.editors.TextEditor.prototype.extend();

  function customRenderer(hotInstance, td, row, column, prop, value, cellProperties) {
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
    // You can add additional options to the cell type based on Handsontable settings
    className: 'my-cell',
    allowInvalid: true,
    // Or you can add custom properties which will be accessible in `cellProperties`
    myCustomCellState: 'complete',
  });

})(Handsontable);
```

From now on, you can use your cell definition like so:

```js
var hot = new Handsontable(document.getElementById('container'), {
  data: someData,
  columns: [
    {
      type: 'my.custom'
    }
  ]
});
```

## Preview of built-in and custom cell types

The below example shows some of the built-in cell types (in other words, combinations of cell renderers and editors) available in Handsontable:

* Text
* [Numeric](numeric.md)
* [Checkbox](checkbox.md)
* [Date](date.md)
* [Select](select.md)
* [Dropdown](dropdown.md)
* [Autocomplete](autocomplete.md)
* [Password](password.md)
* [Handsontable in Handsontable](handsontable.md)
* [Custom](custom-renderers.md)

The same example also shows the declaration of custom cell renderers, namely `yellowRenderer` and `greenRenderer`.

::: example #example1
```js
var data = [
  { id: 1, name: 'Ted', isActive: true, color: 'orange', date: '2015-01-01' },
  { id: 2, name: 'John', isActive: false, color: 'black', date: null },
  { id: 3, name: 'Al', isActive: true, color: 'red', date: null },
  { id: 4, name: 'Ben', isActive: false, color: 'blue', date: null },
],
container = document.getElementById('example1'),
hot1,
yellowRenderer,
greenRenderer;

yellowRenderer = function(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  td.style.backgroundColor = 'yellow';
};
greenRenderer = function(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);

  td.style.backgroundColor = 'green';
};

hot1 = new Handsontable(container, {
  data: data,
  startRows: 5,
  colHeaders: true,
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: "id", type: 'text' },
    // 'text' is default, you don't actually need to declare it
    { data: "name", renderer: yellowRenderer },
    // use default 'text' cell type but overwrite its renderer with yellowRenderer
    { data: "isActive", type: 'checkbox' },
    { data: "date", type: 'date', dateFormat: 'YYYY-MM-DD' },
    { data: "color", type: 'autocomplete', source: ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"] }
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

## Anatomy of a cell type

A cell type is a predefined set of cell properties. Cell type defines what renderer, editor or validator should be used for a cell. They can also define any different cell property that will be assumed for each matching cell.

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

Or using custom cell type definition:

```js
Handsontable.cellTypes.registerCellType('custom', {
  renderer: Handsontable.renderers.TextRenderer,
  className: 'my-cell',
  readOnly: true,
  myCustomProperty: 'foo'
})
```

In Handsontable settings:

```js
columns: [{
  type: 'custom'
}]
```

Equals:

```js
columns: [{
  editor: false,
  renderer: Handsontable.renderers.TextRenderer,
  className: 'my-cell',
  readOnly: true,
  myCustomProperty: 'foo'
}]
```

This mapping is defined by files [src/cellTypes/](https://github.com/handsontable/handsontable/blob/master/src/cellTypes/index.js)
