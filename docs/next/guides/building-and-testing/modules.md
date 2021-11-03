---
title: Modules
metaTitle: Modules - Guide - Handsontable Documentation
permalink: /next/modules
canonicalUrl: /modules
tags:
  - tree shaking
---

# Modules

To reduce the size of your app, you can use Handsontable by importing individual [modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

[[toc]]

## About modules

The full bundle of Handsontable consists of multiple built-in modules such as plugins, renderers, editors, validators, and cell-types. It also includes the whole rendering functionality and advanced data management. This is a compact tool with plenty of options available.

When you become familiar with Handsontable functionalities you may find out that some parts of it are essential in your application and some of them stay idle most of the time.

Thanks to [modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) the package could be split into smaller pieces and you can **import** them as you need. Essentialy it was divided into two: the base and the optional part. The base of Handsontable holds mandatory parts packed inside `handsontable/base`, and it includes vital parts for the component to run. The rest is customizable based on what you want to import. A mindful use of the modules brings a lot of optimization to the application, yet, it only needs several lines of code.

The graph presents a comparison of size in KB for a full bundle, basic optimization and with optimized locales. The sample code is avaiable just below - it shows sample countries and cities and although it looks small it will generate over 345 KB (Gzipped). [Webpack 5](https://webpack.js.org/) with a default configuration for production builds was used to prepare this example.

![bundle_size_comparison](/docs/next/img/bundle_size_comparison.png)

You can compare the following examples to see the difference in the size of the final build. Note: this is an example in a nutshell, just to present a comparison, the next section shows how to do it step by step. First, take a look at the settings, it is the same object in both cases:

```js
const settings = {
  colHeaders: true,
  filters: true,
  data: [
    {
      city: 'Fontainebleau',
      country: 'France',
    },
    {
      city: 'Milton',
      country: 'United Kingdom',
    },
    {
      city: 'Giedlarowa',
      country: 'Poland',
    },
    {
      city: 'Forssa',
      country: 'Finland',
    },
    {
      city: 'Halle',
      country: 'Germany',
    }
  ],
  dropdownMenu: true,
  columns: [
    { data: 'city' },
    {
      data: 'country',
      type: 'dropdown',
      source: ['Finland', 'France', 'Germany', 'Poland', 'United Kingdom'],
    },
  ]
}
```

As you can see, very few plugins are used here: filtering and the dropdown. You can import a full bundle that contains all parts of Handsontable, including a variety of plugins:

```js
// import a full bundle, all functionalities included
import Handsontable from 'handsontable';

const container = document.createElement('div');
document.body.appendChild(container);

const hot = new Handsontable(container, settings);
```

However, this will load all plugins, also those that remain unused in the example. Thanks to using **modules** you can achieve the exactly same result but it will generate less KB. These steps decreased the final bundle to 200 KB (Gzipped):

```js
// import the base only
import Handsontable from 'handsontable/base';
// choose cell types you want to use and import them
import { registerCellType, DropdownCellType } from 'handsontable/cellTypes';
// choose plugins you want to use and import them
import {
  registerPlugin,
  AutoColumnSize,
  CopyPaste,
  Filters,
} from 'handsontable/plugins';

// register imported cell types and plugins
registerCellType(DropdownCellType);
registerPlugin(AutoColumnSize);
registerPlugin(CopyPaste);
registerPlugin(Filters);

// the rest of code remain exactly same as in the previous example!
const container = document.createElement('div');
document.body.appendChild(container);

const hot = new Handsontable(container, settings);
```

You can go even further and optimize [moment.js locales](#optimizing-momentjs-locales) by excluding unnecessary localizations and decrease the final bundle of the example to 150 KB (Gzipped). Eventually, over 56% of the final bundle size was saved!

### How to use modules

The very first step towards using the modules is learning which independent parts you can import and which of them are mandatory. First, you need to import the **base** which contains the core elements of the component. Without them, Handsontable cannot be built at all:

```js
// this part is crucial to be imported
import Handsontable from 'handsontable/base';

// import the css file - this is not modularized;
import 'handsontable/dist/handsontable.full.css';
```

If you had already an import of Handsontable just remove this line:

```js
// you no longer need this import
import Handsontable from 'handsontable';
```

The Handsontable **base** part includes:
- moment.js
- dompurify
- core-js
- core functionalities
- "text" cell type

Having this set up you can acknowledge which elements you can import as needed.

Elements to be imported manually on demand:
- plugins
- editors
- renderers
- validators
- cell types
- locales

The use cases may wary greatly, this guide will go through the categories and present one example for each.

### Tree shaking

Tree shaking, also called dead code elimination, allows for the removal of unused code in the bundle during the build process.

The terms came in 2012, and currently, you can use them in most of the available and popular bundlers such as **webpack**, **rollup**, **parceljs** (with an additional flag), and **browserify**.

If you want to learn more about this topic, don't hesitate to look at the official documentation of [Webpack](https://webpack.js.org/guides/tree-shaking/), [Rollup](https://rollupjs.org/guide/en/#tree-shaking), and [Parcel](https://parceljs.org/cli.html#enable-experimental-scope-hoisting/tree-shaking-support).

**Important note**: this guide was prepared based on the newest version of Webpack. For the Webpack 3 and older, Parcel, and few other bundlers, those load CommonJS modules, tree shaking might not work as presented above. For the modules to be imported correctly you need to split them and import them one by one from their respective files, just like this:

```js
// import the registering method directly from the file
import { registerPlugin } from 'handsontable/plugins/registry';

// import the plugins you need
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
```

The list below presents all registering methods and their files of origin alongside all parts of the component to be imported.
::: details See the full list
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
import { HeaderTooltips } from 'handsontable/plugins/headerTooltips';
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
import { ObserveChanges } from 'handsontable/plugins/observeChanges';
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

### Modules cheatsheet

Here is a full list of all Handsontable parts imported and registered. This example builds Handsontable out of all fragments. You can copy and paste the ones you need.

::: details Modules cheatsheet
```js
// import the `base` module
import Handsontable from 'handsontable/base';

// import editors
import {
  registerEditor,
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
} from 'handsontable/editors';

// import renderers
import {
  registerRenderer,
  baseRenderer,
  autocompleteRenderer,
  checkboxRenderer,
  htmlRenderer,
  numericRenderer,
  passwordRenderer,
  textRenderer,
} from 'handsontable/renderers';

// import validators
import {
  registerValidator,
  autocompleteValidator,
  dateValidator,
  numericValidator,
  timeValidator,
} from 'handsontable/validators';

// import cell types
import {
  registerCellType,
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
  TimeCellType,
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
  HeaderTooltips,
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
  ObserveChanges,
  PersistentState,
  Search,
  TouchScroll,
  TrimRows,
  UndoRedo,
  registerPlugin,
} from 'handsontable/plugins';

// import translations
import {
  registerLanguageDictionary,
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
registerPlugin(HeaderTooltips);
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
registerPlugin(ObserveChanges);
registerPlugin(PersistentState);
registerPlugin(Search);
registerPlugin(TouchScroll);
registerPlugin(TrimRows);
registerPlugin(UndoRedo);
// or, register all plugins at once
registerAllPlugins();

// or, register all Handsontable modules at once
registerAllModules();

// create a Handsontable instance
new Handsontable(container, {});
```
:::

## Importing editors

To use a specific editor you need to import it alongside the registering method. For instance, let's try adding the password editor.

Start with importing the base, `PasswordEditor` and the `registerEditor` method.

```js
// remember to have the base imported
import Handsontable from 'handsontable/base';
// import the method for registering an editor
// import the PasswordEditor
import { registerEditor, PasswordEditor } from 'handsontable/editors';
```

Afterwards you need to use the `registerEditor` method to register `PasswordEditor`:

```js
// register the editor before using it
registerEditor(PasswordEditor);
```

Now, you can use `PasswordEditor`, the full example looks like this:

```js
import Handsontable from 'handsontable/base';
import { registerEditor, PasswordEditor } from 'handsontable/editors';

registerEditor(PasswordEditor);

// use the editor as needed
new Handsontable(container, {
  columns: [
    {
      editor: 'password',
    },
  ]
  // rest of the settings
});
```

And that is all! You can use the password editor!

#### Importing all editors at once

You can quickly import and register all editors at once:

```js
// import the `registerAllEditors()` function
import { registerAllEditors } from 'handsontable/registry';

// register all editors
registerAllEditors();
```

## Importing renderers

To use a specific renderer you need to import it alongside the registering method. For instance, let's try adding the autocomplete renderer.

Start with importing the base, `autocompleteRenderer` and the `registerRenderer` method.

```js
// remember to have the base imported
import Handsontable from 'handsontable/base';
// import the method for registering a renderer
// import the autocompleteRenderer
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';
```

Afterwards you need to use the `registerRenderer` method to register `autocompleteRenderer`:

```js
// register the renderer before using it
registerRenderer(autocompleteRenderer);
```

Now, you can use `autocompleteRenderer`, the full example looks like this:

```js
import Handsontable from 'handsontable/base';
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';

registerRenderer(autocompleteRenderer);

// use the renderer as you need
new Handsontable(container, {
  columns: [
    {
      renderer: 'autocomplete',
    },
  ],
// rest of the settings
});
```

And that is all! You can use the autocomplete renderer!

#### Importing all renderers at once

You can quickly import and register all renderers at once:

```js
// import the `registerAllRenderers()` function
import { registerAllRenderers } from 'handsontable/registry';

// register all renderers
registerAllRenderers();

## Importing validators

To use a specific validator you need to import it alongside the registering method. For instance, let's try adding the numeric validator.

Start with importing the base, `numericValidator` and the `registerValidator` method.

```js
// remember to have the base imported
import Handsontable from 'handsontable/base';

// import the method for registering a validator
// import the numericValidator
import { registerValidator, numericValidator } from 'handsontable/validators';
```

Afterwards you need to use the `registerValidator` method to register `numericValidator`:

```js
// register the validator before using it
registerValidator(numericValidator);
```

Now, you can use `numericValidator`, the full example looks like this:

```js
import Handsontable from 'handsontable/base';
import { registerValidator, numericValidator } from 'handsontable/validators';

registerValidator(numericValidator);

// use the numeric validator where you need
new Handsontable(container, {
  columns: [
    {
      validator: 'numeric',
    },
  ]
// rest of the settings
});
```

And that is all! You can use the numeric validator!

#### Importing all validators at once

You can quickly import and register all validators at once:

```js
// import the `registerAllValidators()` function
import { registerAllValidators } from 'handsontable/registry';

// register all validators
registerAllValidators();

## Importing cell types

To use a specific cell type you need to import it alongside the registering method. Let's try adding the checkbox cell type.

Start with importing the base, `CheckboxCellType` and the `registerCellType` method.

```js
// remember to have the base imported
import Handsontable from 'handsontable/base';
// import the method for registering a cell type
// import the CheckboxCellType
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
```

Afterwards you need to use the `registerCellType` method to register `CheckboxCellType`:

```js
// register the cell type before using it
registerCellType(CheckboxCellType);
```

Now, you can use `CheckboxCellType`, the full example looks like this:

```js
import Handsontable from 'handsontable/base';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';

registerCellType(CheckboxCellType);

// use the checkbox cell type where you need
new Handsontable(container, {
  columns: [
    {
      type: 'checkbox',
    },
  ]
// rest of the settings
});
```

And that is all! You can use the checkbox cell type!

#### Importing all cell types at once

You can quickly import and register all cell types at once:

```js
// import all cell types
import {
  registerCellType,
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
  TimeCellType,
} from 'handsontable/cellTypes';

// import the `registerAllCellTypes()` function
import { registerAllCellTypes } from 'handsontable/registry';

// register all cell types
registerAllCellTypes();
```

## Importing plugins

To use a specific plugin you need to import it alongside the registering method. For instance, let's try adding the context menu.

Start with importing the base, `ContextMenu` and the `registerPlugin` method.

```js
// remember to have the base imported
import Handsontable from 'handsontable/base';
// import the method for registering a plugin
// import the ContextMenu plugin
import { registerPlugin, ContextMenu } from 'handsontable/plugins';
```

Afterwards you need to use the `registerPlugin` method to register the `ContextMenu` plugin:

```js
// register the plugin before using it
registerPlugin(ContextMenu);
```

Now, you can use the `ContextMenu` plugin, the full example looks like this:

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, AutoColumnSize, ContextMenu } from 'handsontable/plugins';

registerPlugin(AutoColumnSize);
registerPlugin(ContextMenu);

// switch the context menu on
new Handsontable(container, {
  contextMenu: true,
  // rest of the settings
});
```

And that is all! You can use the `ContextMenu` plugin.

#### Importing all plugins at once

You can quickly import and register all plugins at once:

```js
// import all plugins
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
  HeaderTooltips,
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
  ObserveChanges,
  PersistentState,
  Search,
  TouchScroll,
  TrimRows,
  UndoRedo,
  registerPlugin,
} from 'handsontable/plugins';

// import the `registerAllPlugins()` function
import { registerAllPlugins } from 'handsontable/registry';

// register all plugins
registerAllPlugins();
```

## Importing locales

Importing locales works slightly different than in case of other elements. Let's try adding the `pl-PL` locale.

Start with importing the base and the language code:

```js
// remember to have the base imported
import Handsontable from 'handsontable/base';

// import the language code and interface to register language
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';
```

Afterwards you need to register it:

```js
registerLanguageDictionary(plPL.languageCode, plPL);

// or if the language dictionary object contains the "languageCode" property,
// the registration can be simplified to something like this
registerLanguageDictionary(plPL);
```

Now, you can use newly registered locale. The full example looks like this:

```js
import Handsontable from 'handsontable/base';
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';

registerLanguageDictionary(plPL);

// use the locales
new Handsontable(container, {
  language: 'pl-PL',
// rest of the settings
});
```

And that is all! You can use the PL-pl locale!

### Optimizing moment.js locales

If you want to decrease the bundle size even more you can also focus on optimizing moment.js locales. There are different methods of doing so but this guide focuses on using the webpack's [IgnorePlugin](https://webpack.js.org/plugins/ignore-plugin/). For another option, you can check [this tutorial](https://github.com/jmblog/how-to-optimize-momentjs-with-webpack) directly.

Moment.js can be heavyweight because when you type `var moment = require('moment')` in the code you get all locales as default. To be more selective with your choice you can first, use the `IgnorePlugin` that removes all locales:

```js
const webpack = require('webpack');
module.exports = {
  //...
  plugins: [
    // Ignore all locale files of moment.js
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
};
```

And then explicitly load selected locales:

```js
import moment from 'moment';
import 'moment/locale/ja';
import Handsontable from 'handsontable/base';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';

moment.locale('ja');
registerCellType(DateCellType);

new Handsontable(container, {
  type: 'date',
});
```

## Using modules with wrappers

You can use modules with Handsontable's [React](@/guides/integrate-with-react/react-installation.md), [Angular](@/guides/integrate-with-angular/angular-installation.md), and [Vue 2](@/guides/integrate-with-vue/vue-installation.md) wrappers.

### Using modules with React

To use modules with Handsontable's [React](@/guides/integrate-with-react/react-installation.md) wrapper, follow the steps below:

#### Step 1: Import the `Base` module
In the entry point file of your application, import Handsontable's `Base` module:
  ```js
  // your `index.js` file
  import React from 'react';
  import ReactDOM from 'react-dom';
  import './index.css';
  import App from './App';

  // import Handsontable's `Base` module
  import Handsontable from 'handsontable/base';
  ```

#### Step 2: Import modules and their registering functions
Import the required modules (for the list of Handsontable modules, see the [modules cheatsheet](#modules-cheatsheet)).<br>
For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import React from 'react';
  import ReactDOM from 'react-dom';
  import './index.css';
  import App from './App';

  import Handsontable from 'handsontable/base';

  // import the `NumericCellType` module and the `registerCellType()` function
  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  // import the `UndoRedo` module and the `registerPlugin()` function
  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';
  ```

#### Step 3: Register the modules
Register the required modules (for the full list of Handsontable's registering functions, see the [modules cheatsheet](#modules-cheatsheet)):
  ```jsx
  import React from 'react';
  import ReactDOM from 'react-dom';
  import './index.css';
  import App from './App';

  import Handsontable from 'handsontable/base';

  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';

  // register the `NumericCellType` module
  registerCellType(NumericCellType);

  // register the `UndoRedo` module
  registerPlugin(UndoRedo);

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
  ```

### Using modules with Angular

To use modules with Handsontable's [Angular](@/guides/integrate-with-angular/angular-installation.md) wrapper, follow the steps below:

#### Step 1: Import the `Base` module
In the entry point file of your application, import Handsontable's `Base` module:
  ```js
  import { BrowserModule } from '@angular/platform-browser';
  import { NgModule } from '@angular/core';
  import { AppComponent } from './app.component';
  import { HotTableModule } from '@handsontable/angular';

  // import Handsontable's `Base` module
  import Handsontable from 'handsontable/base';
  ```

#### Step 2: Import modules and their registering functions
Import the required modules (for the list of Handsontable modules, see the [modules cheatsheet](#modules-cheatsheet)).<br>
For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import { BrowserModule } from '@angular/platform-browser';
  import { NgModule } from '@angular/core';
  import { AppComponent } from './app.component';
  import { HotTableModule } from '@handsontable/angular';

  import Handsontable from 'handsontable/base';

  // import the `NumericCellType` module and the `registerCellType()` function
  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  // import the `UndoRedo` module and the `registerPlugin()` function
  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';
  ```

#### Step 3: Register the modules
Register the required modules (for the full list of Handsontable's registering functions, see the [modules cheatsheet](#modules-cheatsheet)):
  ```jsx
  import { BrowserModule } from '@angular/platform-browser';
  import { NgModule } from '@angular/core';
  import { AppComponent } from './app.component';
  import { HotTableModule } from '@handsontable/angular';

  import Handsontable from 'handsontable/base';

  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';

  // register the `NumericCellType` module
  registerCellType(NumericCellType);

  // register the `UndoRedo` module
  registerPlugin(UndoRedo);

  @NgModule({
    declarations: [
      AppComponent
    ],
    imports: [
      BrowserModule,
      HotTableModule
    ],
    providers: [],
    bootstrap: [AppComponent]
  })
  export class AppModule { }
  ```

### Using modules with Vue 2

To use modules with Handsontable's [Vue 2](@/guides/integrate-with-vue/vue-installation.md) wrapper, follow the steps below:

#### Step 1: Import the `Base` module
In the entry point file of your application, import Handsontable's `Base` module:
  ```js
  // your `main.js` file
  import Vue from 'vue';
  import App from './App.vue';

  // import Handsontable's `Base` module
  import Handsontable from 'handsontable/base';
  ```

#### Step 2: Import modules and their registering functions
Import the required modules (for the list of Handsontable modules, see the [modules cheatsheet](#modules-cheatsheet)).<br>
For example, to use the [`numeric`](@/guides/cell-types/numeric-cell-type.md) cell type and the [`UndoRedo`](@/api/undoRedo.md) plugin:
  ```js
  import Vue from 'vue';
  import App from './App.vue';

  import Handsontable from 'handsontable/base';

  // import the `NumericCellType` module and the `registerCellType()` function
  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  // import the `UndoRedo` module and the `registerPlugin()` function
  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';
  ```

#### Step 3: Register the modules
Register the required modules (for the full list of Handsontable's registering functions, see the [modules cheatsheet](#modules-cheatsheet)):
  ```js
  import Vue from 'vue';
  import App from './App.vue';

  import Handsontable from 'handsontable/base';

  import {
    registerCellType,
    NumericCellType,
  } from 'handsontable/cellTypes';

  import {
    registerPlugin,
    UndoRedo,
  } from 'handsontable/plugins';

  // register the `NumericCellType` module
  registerCellType(NumericCellType);

  // register the `UndoRedo` module
  registerPlugin(UndoRedo);
  
  Vue.config.productionTip = false;

  new Vue({
    render: h => h(App),
  }).$mount('#app');
  ```