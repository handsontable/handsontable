---
id: neoo8dhv
title: Cell functions
metaTitle: Cell functions - JavaScript Data Grid | Handsontable
description: Render, edit, and validate the contents of your cells, using Handsontable's cell functions. Quickly set up your cells, using cell types.
permalink: /cell-function
canonicalUrl: /cell-function
react:
  id: i2sqtwh6
  metaTitle: Cell functions - React Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

# Cell functions

Render, edit, and validate the contents of your cells, using Handsontable's cell functions. Quickly set up your cells, using cell types.

[[toc]]

## Overview

With every cell in the Handsontable there are 3 associated functions:

- [Renderer](#renderer)
- [Editor](#editor)
- [Validator](#validator)

Each of those functions are responsible for a different cell behavior. You can define them separately or use a [cell type](#cell-type) to define all three at once.

## Renderer

Handsontable does not display the values stored in the data source directly. Instead, every time a value from data source needs to be displayed in a table cell, it is passed to the cell `renderer` function, together with the table cell object of type `HTMLTableCellElement` (DOM node), along with other useful information.

`Renderer` is expected to format the passed value and place it as a content of the cell object. `Renderer` can also alter the cell class list, i.e. it can add a `htInvalid` class to let the user know, that the displayed value is invalid.

## Editor

Cell editors are the most complex cell functions. We have prepared a separate page [custom cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) explaining how cell edit works and how to write your own cell editor.

## Validator

Cell validator can be either a function or a regular expression. A cell is considered valid, when the validator function calls a `callback` (passed as one of the `validator` arguments) with `true` or the validation regex [`test()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test) method returns `true`. Because the validity of a value is determined only by the argument that is passed to `callback`, `validator` function can be synchronous or asynchronous.

Contrary to `renderer` and `editor` functions, the `validator` function doesn't have to be defined for each cell. If the `validator` function is not defined, then a cell value is always valid.

## Cell type

Manually defining those functions for cells or columns would be tedious, so to simplify the configuration, Handsontable introduced [cell types](@/guides/cell-types/cell-type/cell-type.md).

## Cell functions getters

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

If, for some reason, you need to get the `renderer`, `editor` or `validator` function of a specific cell,
you can use the standard [`getCellMeta()`](@/api/core.md#getcellmeta) method to get all properties of a cell,
and then refer to the cell functions like this:

```js
// get cell properties for cell [0, 0]
const cellProperties = hot.getCellMeta(0, 0);

cellProperties.renderer; // get cell renderer
cellProperties.editor; // get cell editor
cellProperties.validator; // get cell validator
cellProperties.type; // get cell type
```

You can also get specific cell functions by using the following getters:

- [`getCellRenderer(row, col)`](@/api/core.md#getcellrenderer)
- [`getCellEditor(row, col)`](@/api/core.md#getcelleditor)
- [`getCellValidator(row, col)`](@/api/core.md#getcellvalidator)

If a cell's functions are defined through a [cell type](#cell-type), the getters will return
the `renderer`, `editor` or `validator` functions defined for that cell type. For example:

::: only-for javascript

```js
import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#container');
const hot = new Handsontable(container, {
  columns: [{
    // set a cell type for the entire grid
    type: 'numeric'
  }]
});

// get cell properties for cell [0, 0]
const cellProperties = hot.getCellMeta(0, 0);

cellProperties.renderer; // numericRenderer
cellProperties.editor; // NumericEditor
cellProperties.validator; // numericValidator
cellProperties.type; // numeric
```

:::

::: only-for react

```jsx
const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    // get cell properties for cell [0, 0]
    const cellProperties = hot.getCellMeta(0, 0);

    cellProperties.renderer; // "numeric"
    cellProperties.editor; // "numeric"
    cellProperties.validator; // "numeric"
    cellProperties.type; // "numeric"
  });

  return (
    <HotTable
      ref={hotRef}
      // set a cell type for the entire grid
      type="numeric"
    />
  );
};
```

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)
- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

### Related API reference

- Configuration options:
  - [`editor`](@/api/options.md#editor)
  - [`renderer`](@/api/options.md#renderer)
  - [`type`](@/api/options.md#type)
  - [`validator`](@/api/options.md#validator)
- Core methods:
  - [`destroyEditor()`](@/api/core.md#destroyeditor)
  - [`getActiveEditor()`](@/api/core.md#getactiveeditor)
  - [`getCellEditor()`](@/api/core.md#getcelleditor)
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getCellRenderer()`](@/api/core.md#getcellrenderer)
  - [`getCellValidator()`](@/api/core.md#getcellvalidator)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterBeginEditing`](@/api/hooks.md#afterbeginediting)
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`afterValidate`](@/api/hooks.md#aftervalidate)
  - [`afterRenderer`](@/api/hooks.md#afterrenderer)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeRenderer`](@/api/hooks.md#beforerenderer)
  - [`beforeValidate`](@/api/hooks.md#beforevalidate)
