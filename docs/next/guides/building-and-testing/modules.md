---
title: Modules
metaTitle: Modules - Guide - Handsontable Documentation
permalink: /next/modules
canonicalUrl: /modules
tags:
  - tree shaking
---

# Modules

To reduce Handsontable's impact on the size of your app, import just the modules that you actually use.

[[toc]]

## Overview

Handsontable is a comprehensive tool with a broad range of features. If you don't use all of them, you can pick just those parts that you need, and get rid of the rest (e.g., unnecessary translations). This approach reduces Handsontable's impact on the overall size of your app.

To make this possible, Handsontable is divided into modules.

### How to use modules

To get the most out of using Handsontable's modules:
1. Import the [core modules](#import-core-modules).
2. Use optional modules of your choice:
   - [Editor modules](#editor-modules)
   - [Renderer modules](#renderer-modules)
   - [Validator modules](#validator-modules)
   - [Cell type modules](#cell-type-modules)
   - [Plugin modules](#plugin-modules)
   - [Translation modules](#translation-modules)
3. Remove redundant code (tree shaking).

#### Use modules with frameworks

You can also use modules with Handsontable's framework wrappers:
- [Modules in React](@/guides/integrate-with-react/react-modules.md)
- [Modules in Angular](@/guides/integrate-with-angular/angular-modules.md)
- [Modules in Vue 2](@/guides/integrate-with-vue/vue-modules.md)
- [Modules in Vue 3](@/guides/integrate-with-vue3/vue3-modules.md)

### Bundler support

To use Handsontable's modules, your environment needs to support the `import` syntax.

We recommend the following bundlers:
- [webpack](https://webpack.js.org)
- [Parcel](https://parceljs.org)

If Handsontable's modules don't work with your bundler, report it as a [bug](https://github.com/handsontable/handsontable/issues/new?assignees=&labels=&template=01-handsontable.md&title=).

## Core modules

No matter which of the optional modules you use, the following modules are always required:

- Handsontable's core functionalities
- The default cell type: [`text`](@/guides/cell-types/cell-type.md#available-cell-types)
- Handsontable's CSS
- Required dependencies:
  - [moment.js](https://momentjs.com/) (you can easily [optimize](#optimize-moment-js-locales) its size)
  - [DOMpurify](https://www.npmjs.com/package/dompurify)
  - [core-js](https://www.npmjs.com/package/core-js)

#### Import core modules

To import the core modules:
1. Import Handsontable from `handsontable/base` (not from `handsontable`, which would give you the full bundle).
2. Import Handsontable's CSS file as a whole (just like when you install Handsontable).

```js
import Handsontable from 'handsontable/base';

// if you have the full bundle import, remove it
import Handsontable from 'handsontable';

// if your bundler allows it, import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

Now, you're ready to use any [optional modules](#list-of-all-modules) of your choice.

## Editor modules

Editor modules contain Handsontable's [cell editors](@/guides/cell-functions/cell-editor.md).

You can import the following editor modules:

```js
import {
  AutocompleteEditor,
  BaseEditor,
  CheckboxEditor,
  DateEditor,
  DropdownEditor,
  HandsontableEditor,
  NumericEditor,
  PasswordEditor,
  SelectEditor,
  TextEditor,
  registerEditor, // editors' registering function
} from 'handsontable/editors';
```

Each editor module contains a different type of cell editor:

::: details Editor modules
| Module               | Cell editor alias |
| -------------------- | ----------------- |
| `AutocompleteEditor` | `autocomplete`    |
| `BaseEditor`         | `base`            |
| `CheckboxEditor`     | `checkbox`        |
| `DateEditor`         | `date`            |
| `DropdownEditor`     | `dropdown`        |
| `HandsontableEditor` | `handsontable`    |
| `NumericEditor`      | `numeric`         |
| `PasswordEditor`     | `password`        |
| `SelectEditor`       | `select`          |
| `TextEditor`         | `text`            |
:::

#### Use editor modules

To start using an editor module, follow the steps below.

##### Step 1: Import the core modules

First, make sure you import the [core modules](#import-core-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

##### Step 2: Import the editors' registering function

Import the `registerEditor()` function that lets you register your chosen editor:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerEditor } from 'handsontable/editors';
```

##### Step 3: Import your editor module

Import an editor module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerEditor, PasswordEditor } from 'handsontable/editors';
```

##### Step 4: Register your editor

Register your editor, using the `registerEditor()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerEditor, PasswordEditor } from 'handsontable/editors';

// register the `password` editor
registerEditor(PasswordEditor);
```

::: tip
#### Register all editors at once

If you're importing all editor modules, register them in bulk, using the `registerAllEditors()` function:

```js
import { registerAllEditors } from 'handsontable/editors';

// register all editors
registerAllEditors();
```
:::

##### Step 5: Use your editor

Now, you can start using your editor, by setting the [`editor`](@/api/options.md#editor) configuration option:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerEditor, PasswordEditor } from 'handsontable/editors';

registerEditor(PasswordEditor);

new Handsontable(container, {
  columns: [
    { 
      // use the `password` editor
      editor: 'password',
    },
  ]
});
```

## Renderer modules

Renderer modules contain Handsontable's [cell renderers](@/guides/cell-functions/cell-renderer.md).

You can import the following editor modules:

```js
import {
  baseRenderer,
  autocompleteRenderer,
  checkboxRenderer,
  htmlRenderer,
  numericRenderer,
  passwordRenderer,
  textRenderer,
  registerRenderer, // renderers' registering function
} from 'handsontable/renderers';
```

Each renderer module contains a different type of cell renderer:

::: details Renderer modules
| Module                 | Cell renderer alias |
| ---------------------- | ------------------- |
| `autocompleteRenderer` | `autocomplete`      |
| `baseRenderer`         | `base`              |
| `checkboxRenderer`     | `checkbox`          |
| `htmlRenderer`         | `html`              |
| `numericRenderer`      | `numeric`           |
| `passwordRenderer`     | `password`          |
| `textRenderer`         | `text`              |
:::

#### Use renderer modules

To start using a renderer module, follow the steps below.

##### Step 1: Import the core modules

First, make sure you import the [core modules](#import-core-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

##### Step 2: Import the renderers' registering function

Import the `registerRenderer()` function that lets you register your chosen renderer:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerRenderer } from 'handsontable/renderers';
```

##### Step 3: Import your renderer module

Import a renderer module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `autocompleteRenderer` module
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';
```

##### Step 4: Register your renderer

Register your renderer, using the `registerRenderer()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';

// register the `autocomplete` renderer
registerRenderer(autocompleteRenderer);
```

::: tip
#### Register all renderers at once

If you're importing all renderer modules, register them in bulk, using the `registerAllRenderers()` function:

```js
import { registerAllRenderers } from 'handsontable/renderers';

// register all renderers
registerAllRenderers();
```
:::

##### Step 5: Use your renderer

Now, you can start using your renderer, by setting the [`renderer`](@/api/options.md#renderer) configuration option::

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';

registerRenderer(autocompleteRenderer);

new Handsontable(container, {
  columns: [
    { 
      // use the `autocomplete` renderer
      renderer: 'autocomplete',
    },
  ]
});
```

## Validator modules

Validator modules contain Handsontable's [cell validators](@/guides/cell-functions/cell-validator.md).

You can import the following validator modules:

```js
// import validators
import {
  autocompleteValidator,
  dateValidator,
  numericValidator,
  timeValidator,
  registerValidator, // validators' registering function
} from 'handsontable/validators';
```

Each validator module contains a different type of cell validator:

::: details Validator modules
| Module                  | Cell validator alias |
| ----------------------- | -------------------- |
| `autocompleteValidator` | `autocomplete`       |
| `dateValidator`         | `date`               |
| `numericValidator`      | `numeric`            |
| `timeValidator`         | `time`               |
:::

#### Use validator modules

To start using a validator module, follow the steps below.

##### Step 1: Import the core modules

First, make sure you import the [core modules](#import-core-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

##### Step 2: Import the validators' registering function

Import the `registerValidator()` function that lets you register your chosen validator:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerValidator } from 'handsontable/validators';
```

##### Step 3: Import your validator module

Import a validator module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `numericValidator` module
import { registerValidator, numericValidator } from 'handsontable/validators';
```

##### Step 4: Register your validator

Register your validator, using the `registerValidator()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerValidator, numericValidator } from 'handsontable/validators';

// register the `numeric` validator
registerValidator(numericValidator);
```

::: tip
#### Register all validators at once

If you're importing all validator modules, register them in bulk, using the `registerAllValidators()` function:

```js
import { registerAllValidators } from 'handsontable/validators';

// register all validators
registerAllValidators();
```
:::

##### Step 5: Use your validator

Now, you can start using your validator, by setting the [`validator`](@/api/options.md#validator) configuration option:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerValidator, numericValidator } from 'handsontable/validators';

registerValidator(numericValidator);

new Handsontable(container, {
  columns: [
    { 
      // use the `numeric` validator
      validator: 'numeric',
    },
  ]
});
```

## Cell type modules

Cell type modules contain Handsontable's [cell types](@/guides/cell-types/cell-type.md).

You can import the following cell type modules:

```js
import {
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
  TimeCellType,
  registerCellType, // cell types' registering function
} from 'handsontable/cellTypes';
```

Each cell type module contains a different cell type:

::: details Cell type modules
| Module                 | Cell type alias |
| ---------------------- | --------------- |
| `AutocompleteCellType` | `autocomplete`  |
| `CheckboxCellType`     | `checkbox`      |
| `DateCellType`         | `date`          |
| `DropdownCellType`     | `dropdown`      |
| `HandsontableCellType` | `handsontable`  |
| `NumericCellType`      | `numeric`       |
| `PasswordCellType`     | `password`      |
| `TextCellType`         | `text`          |
| `TimeCellType`         | `time`          |
:::

#### Use cell type modules

To start using a cell type module, follow the steps below.

##### Step 1: Import the core modules

First, make sure you import the [core modules](#import-core-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

##### Step 2: Import the cell types' registering function

Import the `registerCellType()` function that lets you register your cell type:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerCellType } from 'handsontable/cellTypes';
```

##### Step 3: Import your cell type module

Import a cell type module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `CheckboxCellType` module
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
```

##### Step 4: Register your cell type

Register your cell type, using the `registerCellType()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';

// register the `checkbox` cell type
registerCellType(CheckboxCellType);
```

::: tip
#### Register all cell types at once

If you're importing all cell type modules, register them in bulk, using the `registerAllCellTypes()` function:

```js
import { registerAllCellTypes } from 'handsontable/cellTypes';

// register all cell types
registerAllCellTypes();
```
:::

##### Step 5: Use your cell type

Now, you can start using your cell type, by setting the [`type`](@/api/options.md#type) configuration option:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';

registerCellType(CheckboxCellType);

new Handsontable(container, {
  columns: [
    { 
      // use the `checkbox` cell type
      type: 'checkbox',
    },
  ]
});
```

## Plugin modules

Plugin modules contain Handsontable's [plugins](@/api/plugins.md).

You can import the following plugin modules:

```js
import {
  AutoColumnSize,
  AutoRowSize,
  Autofill,
  BasePlugin,
  BindRowsWithHeaders,
  CollapsibleColumns,
  ColumnSorting,
  ColumnSummary,
  Comments,
  ContextMenu,
  CopyPaste,
  CustomBorders,
  DragToScroll,
  DropdownMenu,
  ExportFile,
  Filters,
  Formulas,
  HiddenColumns,
  HiddenRows,
  ManualColumnFreeze,
  ManualColumnMove,
  ManualColumnResize,
  ManualRowMove,
  ManualRowResize,
  MergeCells,
  MultiColumnSorting,
  MultipleSelectionHandles,
  NestedHeaders,
  NestedRows,
  PersistentState,
  Search,
  TouchScroll,
  TrimRows,
  UndoRedo,
  registerPlugin, // plugins' registering function
} from 'handsontable/plugins';
```

Each plugin module contains a different plugin:

::: details Plugin modules
| Module                     | Plugin                                                |
| -------------------------- | ----------------------------------------------------- |
| `AutoColumnSize`           | [`AutoColumnSize`](@/api/autoColumnSize.md)           |
| `Autofill`                 | [`Autofill`](@/api/autofill.md)                       |
| `AutoRowSize`              | [`AutoRowSize`](@/api/autoRowSize.md)                 |
| `BasePlugin`               | [`BasePlugin`](@/api/basePlugin.md)                   |
| `BindRowsWithHeaders`      | [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md) |
| `CollapsibleColumns`       | [`CollapsibleColumns`](@/api/collapsibleColumns.md)   |
| `ColumnSorting`            | [`ColumnSorting`](@/api/columnSorting.md)             |
| `ColumnSummary`            | [`ColumnSummary`](@/api/columnSummary.md)             |
| `Comments`                 | [`Comments`](@/api/comments.md)                       |
| `ContextMenu`              | [`ContextMenu`](@/api/contextMenu.md)                 |
| `CopyPaste`                | [`CopyPaste`](@/api/copyPaste.md)                     |
| `CustomBorders`            | [`CustomBorders`](@/api/customBorders.md)             |
| `DragToScroll`             | [`DragToScroll`](@/api/dragToScroll.md)               |
| `DropdownMenu`             | [`DropdownMenu`](@/api/dropdownMenu.md)               |
| `ExportFile`               | [`ExportFile`](@/api/exportFile.md)                   |
| `Filters`                  | [`Filters`](@/api/filters.md)                         |
| `Formulas`                 | [`Formulas`](@/api/formulas.md)                       |
| `HiddenColumns`            | [`HiddenColumns`](@/api/hiddenColumns.md)             |
| `HiddenRows`               | [`HiddenRows`](@/api/hiddenRows.md)                   |
| `ManualColumnFreeze`       | [`ManualColumnFreeze`](@/api/manualColumnFreeze.md)   |
| `ManualColumnMove`         | [`ManualColumnMove`](@/api/manualColumnMove.md)       |
| `ManualColumnResize`       | [`ManualColumnResize`](@/api/manualColumnResize.md)   |
| `ManualRowMove`            | [`ManualRowMove`](@/api/manualRowMove.md)             |
| `ManualRowResize`          | [`ManualRowResize`](@/api/manualRowResize.md)         |
| `MergeCells`               | [`MergeCells`](@/api/mergeCells.md)                   |
| `MultiColumnSorting`       | [`MultiColumnSorting`](@/api/multiColumnSorting.md)   |
| `MultipleSelectionHandles` | `MultipleSelectionHandles`                            |
| `NestedHeaders`            | [`NestedHeaders`](@/api/nestedHeaders.md)             |
| `NestedRows`               | [`NestedRows`](@/api/nestedRows.md)                   |
| `PersistentState`          | [`PersistentState`](@/api/persistentState.md)         |
| `Search`                   | [`Search`](@/api/search.md)                           |
| `TouchScroll`              | `TouchScroll`                                         |
| `TrimRows`                 | [`TrimRows`](@/api/trimRows.md)                       |
| `UndoRedo`                 | [`UndoRedo`](@/api/undoRedo.md)                       |
:::

#### Use plugin modules

To start using a plugin module, follow the steps below.

##### Step 1: Import the core modules

First, make sure you import the [core modules](#import-core-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

##### Step 2: Import the plugins' registering function

Import the `registerPlugin()` function that lets you register your plugin:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerPlugin } from 'handsontable/plugins';
```

##### Step 3: Import your plugin module

Import a plugin module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `ContextMenu` module
import { registerPlugin, ContextMenu } from 'handsontable/plugins';
```

##### Step 4: Register your plugin

Register your plugin, using the `registerPlugin()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

// register the `ContextMenu` plugin
registerPlugin(ContextMenu);
```

::: tip
#### Register all plugins at once

If you're importing all plugin modules, register them in bulk, using the `registerAllPlugins()` function:

```js
import { registerAllPlugins } from 'handsontable/plugins';

// register all plugins
registerAllPlugins();
```
:::

##### Step 5: Use your plugin

Now, you can start using your plugin:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

registerPlugin(ContextMenu);

new Handsontable(container, {
  // use the `ContextMenu` plugin
  contextMenu: true,
});
```

## Translation modules

Translation modules contain Handsontable's [translations](@/guides/internationalization/language.md).

You can import the following translation modules:

```js
import {
  deCH,
  deDE,
  enUS,
  esMX,
  frFR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  zhCN,
  zhTW,
  registerLanguageDictionary, // translations' registering function
} from 'handsontable/i18n';
```

Each translation module contains a different translation package:

::: details Translation modules
| Module | Translation                 |
| ------ | --------------------------- |
| `deCH` | German - Switzerland        |
| `deDE` | German - Germany            |
| `enUS` | English - United States     |
| `esMX` | Spanish - Mexico            |
| `frFR` | French - France             |
| `itIT` | Italian - Italy             |
| `jaJP` | Japanese - Japan            |
| `koKR` | Korean - Korea              |
| `lvLV` | Latvian - Latvia            |
| `nbNO` | Norwegian (Bokmål) - Norway |
| `nlNL` | Dutch - Netherlands         |
| `plPL` | Polish - Poland             |
| `ptBR` | Portuguese - Brazil         |
| `ruRU` | Russian - Russia            |
| `zhCN` | Chinese - China             |
| `zhTW` | Chinese - Taiwan            |
:::

#### Use translation modules

To start using a translation module, follow the steps below.

##### Step 1: Import the core modules

First, make sure you import the [core modules](#import-core-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

##### Step 2: Import the translations' registering function

Import the `registerLanguageDictionary()` function that lets you register your translation:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerLanguageDictionary } from 'handsontable/i18n';
```

##### Step 3: Import your translation module

Import a translation module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `plPL` module
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';
```

##### Step 4: Register your translation

Register your translation, using the `registerLanguageDictionary()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';

// register the `plPL` translation
registerLanguageDictionary(plPL.languageCode, plPL);
```

##### Step 5: Use your translation

Now, you can start using your translation, by setting the [`language`](@/api/options.md#language) configuration option:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';

registerLanguageDictionary(plPL.languageCode, plPL);

// set the `language` configuration option
new Handsontable(container, {
  language: 'pl-PL',
});
```

:::tip
#### Optimize Moment.js locales

By default, [Moment.js](https://momentjs.com/) (Handsontable's dependency) comes with all possible locales, which increases the bundle size.

To [optimize Moment.js locales](https://github.com/jmblog/how-to-optimize-momentjs-with-webpack), use [webpack's `IgnorePlugin`](https://webpack.js.org/plugins/ignore-plugin/):

```js
const webpack = require('webpack');
module.exports = {
  //...
  plugins: [
    // ignore all Moment.js locale files
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
};
```

And then explicitly load Moment.js, importing just those locales that you need:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';

// explicitly import Moment.js
import moment from 'moment';
// explicitly import a Moment.js locale of your choice
import 'moment/locale/ja';

// register the Moment.js locale of your choice
moment.locale('ja');
registerCellType(DateCellType);

new Handsontable(container, {
  type: 'date',
});
```
:::

## List of all modules

The table below lists all of Handsontable's modules:

| Type                                                         | Modules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Required / optional |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Core functionalities                                         | `handsontable/base`<br>`handsontable/dist/handsontable.full.css`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Required            |
| [Cell editors](@/guides/cell-functions/cell-editor.md)       | `AutocompleteEditor`<br>`BaseEditor`<br>`CheckboxEditor`<br>`DateEditor`<br>`DropdownEditor`<br>`HandsontableEditor`<br>`NumericEditor`<br>`PasswordEditor`<br>`SelectEditor`<br>`TextEditor`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Optional            |
| [Cell renderers](@/guides/cell-functions/cell-renderer.md)   | `baseRenderer`<br>`autocompleteRenderer`<br>`checkboxRenderer`<br>`htmlRenderer`<br>`numericRenderer`<br>`passwordRenderer`<br>`textRenderer`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Optional            |
| [Cell validators](@/guides/cell-functions/cell-validator.md) | `autocompleteValidator`<br>`dateValidator`<br>`numericValidator`<br>`timeValidator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Optional            |
| [Cell types](@/guides/cell-types/cell-type.md)               | `AutocompleteCellType`<br>`CheckboxCellType`<br>`DateCellType`<br>`DropdownCellType`<br>`HandsontableCellType`<br>`NumericCellType`<br>`PasswordCellType`<br>`TextCellType`<br>`TimeCellType`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Optional            |
| [Plugins](@/api/plugins.md)                                  | [`AutoColumnSize`](@/api/autoColumnSize.md)<br>[`Autofill`](@/api/autofill.md)<br>[`AutoRowSize`](@/api/autoRowSize.md)<br>[`BasePlugin`](@/api/basePlugin.md)<br>[`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md)<br>[`CollapsibleColumns`](@/api/collapsibleColumns.md)<br>[`ColumnSorting`](@/api/columnSorting.md)<br>[`ColumnSummary`](@/api/columnSummary.md)<br>[`Comments`](@/api/comments.md)<br>[`ContextMenu`](@/api/contextMenu.md)<br>[`CopyPaste`](@/api/copyPaste.md)<br>[`CustomBorders`](@/api/customBorders.md)<br>[`DragToScroll`](@/api/dragToScroll.md)<br>[`DropdownMenu`](@/api/dropdownMenu.md)<br>[`ExportFile`](@/api/exportFile.md)<br>[`Filters`](@/api/filters.md)<br>[`Formulas`](@/api/formulas.md)<br>[`HiddenColumns`](@/api/hiddenColumns.md)<br>[`HiddenRows`](@/api/hiddenRows.md)<br>[`ManualColumnFreeze`](@/api/manualColumnFreeze.md)<br>[`ManualColumnMove`](@/api/manualColumnMove.md)<br>[`ManualColumnResize`](@/api/manualColumnResize.md)<br>[`ManualRowMove`](@/api/manualRowMove.md)<br>[`ManualRowResize`](@/api/manualRowResize.md)<br>[`MergeCells`](@/api/mergeCells.md)<br>[`MultiColumnSorting`](@/api/multiColumnSorting.md)<br>`MultipleSelectionHandles`<br>[`NestedHeaders`](@/api/nestedHeaders.md)<br>[`NestedRows`](@/api/nestedRows.md)<br>[`PersistentState`](@/api/persistentState.md)<br>[`Search`](@/api/search.md)<br>`TouchScroll`<br>[`TrimRows`](@/api/trimRows.md)<br>[`UndoRedo`](@/api/undoRedo.md) | Optional            |
| [Translations](@/guides/internationalization/language.md)    | `deCH` `deDE` `enUS` `esMX`<br>`frFR` `itIT` `jaJP` `koKR`<br>`lvLV` `nbNO` `nlNL` `plPL`<br>`ptBR` `ruRU` `zhCN` `zhTW`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Optional            |

## List of all module imports

See how to import and register all of Handsontable's modules:

::: details Import and register all modules
```js
// import the core modules
import Handsontable from 'handsontable/base';

// import editors
import {
  AutocompleteEditor,
  BaseEditor,
  CheckboxEditor,
  DateEditor,
  DropdownEditor,
  HandsontableEditor,
  NumericEditor,
  PasswordEditor,
  SelectEditor,
  TextEditor,
  registerEditor, // editors' registering function
} from 'handsontable/editors';

// import renderers
import {
  baseRenderer,
  autocompleteRenderer,
  checkboxRenderer,
  htmlRenderer,
  numericRenderer,
  passwordRenderer,
  textRenderer,
  registerRenderer, // renderers' registering function
} from 'handsontable/renderers';

// import validators
import {
  autocompleteValidator,
  dateValidator,
  numericValidator,
  timeValidator,
  registerValidator, // validators' registering function
} from 'handsontable/validators';

// import cell types
import {
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
  TimeCellType,
  registerCellType, // cell types' registering function
} from 'handsontable/cellTypes';

// import plugins
import {
  AutoColumnSize,
  AutoRowSize,
  Autofill,
  BasePlugin,
  BindRowsWithHeaders,
  CollapsibleColumns,
  ColumnSorting,
  ColumnSummary,
  Comments,
  ContextMenu,
  CopyPaste,
  CustomBorders,
  DragToScroll,
  DropdownMenu,
  ExportFile,
  Filters,
  Formulas,
  HiddenColumns,
  HiddenRows,
  ManualColumnFreeze,
  ManualColumnMove,
  ManualColumnResize,
  ManualRowMove,
  ManualRowResize,
  MergeCells,
  MultiColumnSorting,
  MultipleSelectionHandles,
  NestedHeaders,
  NestedRows,
  PersistentState,
  Search,
  TouchScroll,
  TrimRows,
  UndoRedo,
  registerPlugin, // plugins' registering function
} from 'handsontable/plugins';

// import translations
import {
  deCH,
  deDE,
  enUS,
  esMX,
  frFR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  zhCN,
  zhTW,
  registerLanguageDictionary, // translations' registering function
} from 'handsontable/i18n';

// optionally, import registering functions
// that let you quickly register all modules at once
import {
  registerAllEditors,
  registerAllRenderers,
  registerAllValidators,
  registerAllCellTypes,
  registerAllPlugins,
  registerAllModules,
} from 'handsontable/registry'

// register individual translations
registerLanguageDictionary(arAR);
registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(enUS);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
registerLanguageDictionary(zhCN);
registerLanguageDictionary(zhTW);

// register individual editors
registerEditor(BaseEditor);
registerEditor(AutocompleteEditor);
registerEditor(CheckboxEditor);
registerEditor(DateEditor);
registerEditor(DropdownEditor);
registerEditor(HandsontableEditor);
registerEditor(NumericEditor);
registerEditor(PasswordEditor);
registerEditor(SelectEditor);
registerEditor(TextEditor);
// or, register all editors at once
registerAllEditors();

// register individual renderers
registerRenderer(baseRenderer);
registerRenderer(autocompleteRenderer);
registerRenderer(checkboxRenderer);
registerRenderer(htmlRenderer);
registerRenderer(numericRenderer);
registerRenderer(passwordRenderer);
registerRenderer(textRenderer);
// or, register all renderers at once
registerAllRenderers();

// register individual validators
registerValidator(autocompleteValidator);
registerValidator(dateValidator);
registerValidator(numericValidator);
registerValidator(timeValidator);
// or, register all validators at once
registerAllValidators();

// register individual cell types
registerCellType(AutocompleteCellType);
registerCellType(CheckboxCellType);
registerCellType(DateCellType);
registerCellType(DropdownCellType);
registerCellType(HandsontableCellType);
registerCellType(NumericCellType);
registerCellType(PasswordCellType);
registerCellType(TimeCellType);
registerCellType(TextCellType);
// or, register all cell types at once
registerAllCellTypes();

// register individual plugins
registerPlugin(AutoColumnSize);
registerPlugin(Autofill);
registerPlugin(AutoRowSize);
registerPlugin(BindRowsWithHeaders);
registerPlugin(CollapsibleColumns);
registerPlugin(ColumnSorting);
registerPlugin(ColumnSummary);
registerPlugin(Comments);
registerPlugin(ContextMenu);
registerPlugin(CopyPaste);
registerPlugin(CustomBorders);
registerPlugin(DragToScroll);
registerPlugin(DropdownMenu);
registerPlugin(ExportFile);
registerPlugin(Filters);
registerPlugin(Formulas);
registerPlugin(HiddenColumns);
registerPlugin(HiddenRows);
registerPlugin(ManualColumnFreeze);
registerPlugin(ManualColumnMove);
registerPlugin(ManualColumnResize);
registerPlugin(ManualRowMove);
registerPlugin(ManualRowResize);
registerPlugin(MergeCells);
registerPlugin(MultiColumnSorting);
registerPlugin(MultipleSelectionHandles);
registerPlugin(NestedHeaders);
registerPlugin(NestedRows);
registerPlugin(PersistentState);
registerPlugin(Search);
registerPlugin(TouchScroll);
registerPlugin(TrimRows);
registerPlugin(UndoRedo);
// or, register all plugins at once
registerAllPlugins();

// or, register all of Handsontable's modules at once
registerAllModules();

// create a Handsontable instance
new Handsontable(container, {});
```
:::

::: tip
Parcel, webpack 3 (and older), and a few other bundlers require you to import modules one by one, from their respective files of origin. See the full list of such imports:

::: details All imports
```js
import { registerEditor } from 'handsontable/editors/registry';
import { AutocompleteEditor } from 'handsontable/editors/autocompleteEditor';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { CheckboxEditor } from 'handsontable/editors/checkboxEditor';
import { DateEditor } from 'handsontable/editors/dateEditor';
import { DropdownEditor } from 'handsontable/editors/dropdownEditor';
import { HandsontableEditor } from 'handsontable/editors/handsontableEditor';
import { NumericEditor } from 'handsontable/editors/numericEditor';
import { PasswordEditor } from 'handsontable/editors/passwordEditor';
import { SelectEditor } from 'handsontable/editors/selectEditor';
import { TextEditor } from 'handsontable/editors/textEditor';

import { registerCellType } from 'handsontable/cellTypes/registry';
import { AutocompleteCellType } from 'handsontable/cellTypes/autocompleteType';
import { CheckboxCellType } from 'handsontable/cellTypes/checkboxType';
import { DateCellType } from 'handsontable/cellTypes/dateType';
import { DropdownCellType } from 'handsontable/cellTypes/dropdownType';
import { HandsontableCellType } from 'handsontable/cellTypes/handsontableType';
import { NumericCellType } from 'handsontable/cellTypes/numericType';
import { PasswordCellType } from 'handsontable/cellTypes/passwordType';
import { TextCellType } from 'handsontable/cellTypes/textType';
import { TimeCellType } from 'handsontable/cellTypes/timeType';

import { registerPlugin } from 'handsontable/plugins/registry';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { Autofill } from 'handsontable/plugins/autofill';
import { AutoRowSize } from 'handsontable/plugins/autoRowSize';
import { BasePlugin } from 'handsontable/plugins/base';
import { BindRowsWithHeaders } from 'handsontable/plugins/bindRowsWithHeaders';
import { CollapsibleColumns } from 'handsontable/plugins/collapsibleColumn';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { Comments } from 'handsontable/plugins/comments';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import { CopyPaste } from 'handsontable/plugins/copyPaste';
import { CustomBorders } from 'handsontable/plugins/customBorders';
import { DragToScroll } from 'handsontable/plugins/dragToScroll';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { ExportFile } from 'handsontable/plugins/exportFile';
import { Filters } from 'handsontable/plugins/filters';
import { HiddenColumns } from 'handsontable/plugins/hiddenColumns';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { ManualColumnFreeze } from 'handsontable/plugins/manualColumnFreeze';
import { ManualColumnMove } from 'handsontable/plugins/manualColumnMove';
import { ManualColumnResize } from 'handsontable/plugins/manualColumnResize';
import { ManualRowMove } from 'handsontable/plugins/manualRowMove';
import { ManualRowResize } from 'handsontable/plugins/manualRowResize';
import { MergeCells } from 'handsontable/plugins/mergeCells';
import { MultipleSelectionHandles } from 'handsontable/plugins/multipleSelectionHandles';
import { NestedHeaders } from 'handsontable/plugins/nestedHeaders';
import { NestedRows } from 'handsontable/plugins/nestedRows';
import { PersistentState } from 'handsontable/plugins/persistentState';
import { Search } from 'handsontable/plugins/search';
import { TouchScroll } from 'handsontable/plugins/touchScroll';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { UndoRedo } from 'handsontable/plugins/undoRedo';

import { registerRenderer } from 'handsontable/renderers/registry';
import { autocompleteRenderer } from 'handsontable/renderers/autocompleteRenderer';
import { baseRenderer } from 'handsontable/renderers/baseRenderer';
import { checkboxRenderer } from 'handsontable/renderers/checkboxRenderer';
import { htmlRenderer } from 'handsontable/renderers/htmlRenderer';
import { numericRenderer } from 'handsontable/renderers/numericRenderer';
import { passwordRenderer } from 'handsontable/renderers/passwordRenderer';
import { textRenderer } from 'handsontable/renderers/textRenderer';

import { registerValidator } from 'handsontable/validators/registry';
import { autocompleteValidator } from 'handsontable/validators/autocompleteValidator';
import { dateValidator } from 'handsontable/validators/dateValidator';
import { numericValidator } from 'handsontable/validators/numericValidator';
import { timeValidator } from 'handsontable/validators/timeValidator';

import { registerLanguageDictionary } from 'handsontable/i18n/registry';
```
:::

## Related articles

### Related guides

- [Performance](@/guides/advanced-topics/performance.md)
- [Modules in React](@/guides/integrate-with-react/react-modules.md)
- [Modules in Angular](@/guides/integrate-with-angular/angular-modules.md)
- [Modules in Vue 2](@/guides/integrate-with-vue/vue-modules.md)
- [Modules in Vue 3](@/guides/integrate-with-vue3/vue3-modules.md)

### Related blog articles

- [Modularizing to improve the developer experience](https://handsontable.com/blog/modularizing-to-improve-the-developer-experience)
- [Handsontable 11.0.0: modularization for React, Angular, and Vue](https://handsontable.com/blog/handsontable-11.0.0-modularization-for-react-angular-and-vue)