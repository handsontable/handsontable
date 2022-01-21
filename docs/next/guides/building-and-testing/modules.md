---
title: Modules
metaTitle: Modules - Guide - Handsontable Documentation
permalink: /next/modules
canonicalUrl: /modules
tags:
  - tree shaking
---

# Modules

To reduce Handsontable's impact on the size of your app, import only the modules that you actually use.

[[toc]]

## About modules

Handsontable is a comprehensive tool with a broad range of features. If you don't need all of them, you can pick only those parts that you actually use, and get rid of the rest (e.g. unnecessary translations). This approach reduces Handsontable's impact on the overall size of your app.

To make this possible, Handsontable is divided into [modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). The [full distribution/bundle/package](https://handsontable.com/docs/packages/#full-distribution-recommended) of Handsontable contains all the available modules, but you can decide to import only the ones that you actually use.

Learn more about JavaScript modules:
- MDN Web Docs: [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- Handsontable blog: [Modularizing to improve the developer experience](https://handsontable.com/blog/articles/2021/2/modularizing-to-improve-the-developer-experience)
- Handsontable blog: [Modularization for React, Angular, and Vue](https://handsontable.com/blog/articles/2021/11/handsontable-11.0.0-modularization-for-react-angular-and-vue)

#### Bundler support

To use Handsontable modules, your environment has to support the `import` syntax.

We recommend the following bundlers:
- [webpack](https://webpack.js.org)
- [Parcel](https://parceljs.org)

If Handsontable modules don't work with your bundler, [report it as a bug](https://github.com/handsontable/handsontable/issues/new?assignees=&labels=&template=01-handsontable.md&title=).

### List of all modules

Handsontable is made of the following modules:

| Type                                                                       | Modules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Required / optional |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Core functionalities                                                       | `handsontable/base`<br>`handsontable/dist/handsontable.full.css`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Required            |
| [Cell editors](@/guides/cell-functions/cell-editor.md)                     | `AutocompleteEditor`<br>`BaseEditor`<br>`CheckboxEditor`<br>`DateEditor`<br>`DropdownEditor`<br>`HandsontableEditor`<br>`NumericEditor`<br>`PasswordEditor`<br>`SelectEditor`<br>`TextEditor`                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Optional            |
| [Cell renderers](@/guides/cell-functions/cell-renderer.md)                 | `baseRenderer`<br>`autocompleteRenderer`<br>`checkboxRenderer`<br>`htmlRenderer`<br>`numericRenderer`<br>`passwordRenderer`<br>`textRenderer`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Optional            |
| [Cell validators](@/guides/cell-functions/cell-validator.md)               | `autocompleteValidator`<br>`dateValidator`<br>`numericValidator`<br>`timeValidator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Optional            |
| [Cell types](@/guides/cell-types/cell-type.md)                             | `AutocompleteCellType`<br>`CheckboxCellType`<br>`DateCellType`<br>`DropdownCellType`<br>`HandsontableCellType`<br>`NumericCellType`<br>`PasswordCellType`<br>`TextCellType`<br>`TimeCellType`                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Optional            |
| [Plugins](@/api/plugins.md)                                                | `AutoColumnSize`<br>`AutoRowSize`<br>`Autofill`<br>`BasePlugin`<br>`BindRowsWithHeaders`<br>`CollapsibleColumns`<br>`ColumnSorting`<br>`ColumnSummary`<br>`Comments`<br>`ContextMenu`<br>`CopyPaste`<br>`CustomBorders`<br>`DragToScroll`<br>`DropdownMenu`<br>`ExportFile`<br>`Filters`<br>`Formulas`<br>`HiddenColumns`<br>`HiddenRows`<br>`ManualColumnFreeze`<br>`ManualColumnMove`<br>`ManualColumnResize`<br>`ManualRowMove`<br>`ManualRowResize`<br>`MergeCells`<br>`MultiColumnSorting`<br>`MultipleSelectionHandles`<br>`NestedHeaders`<br>`NestedRows`<br>`PersistentState`<br>`Search`<br>`TouchScroll`<br>`TrimRows`<br>`UndoRedo` | Optional            |
| [Translations](@/guides/internationalization/internationalization-i18n.md) | `deCH` `deDE` `enUS` `esMX`<br>`frFR` `itIT` `jaJP` `koKR`<br>`lvLV` `nbNO` `nlNL` `plPL`<br>`ptBR` `ruRU` `zhCN` `zhTW`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Optional            |

### Importing and registering all modules

To see how to import and register all Handsontable modules, click below:

::: details Importing and registering all modules
```js
// import the required modules
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

// or, register all Handsontable modules at once
registerAllModules();

// create a Handsontable instance
new Handsontable(container, {});
```
:::

::: tip
When using [Parcel](https://parceljs.org/), [webpack 3](https://webpack.js.org/) (or older), and a few other bundlers,
you need to import modules one by one, from their respective files of origin. For the full list of such imports, click below:

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

## Using modules

To get the most out of using Handsontable modules:
1. [Import the required modules](#importing-required-modules).
2. Use optional modules of your choice:
   - [Editor modules](#using-editor-modules)
   - [Renderer modules](#using-renderer-modules)
   - [Validator modules](#using-validator-modules)
   - [Cell type modules](#using-cell-type-modules)
   - [Plugin modules](#using-plugin-modules)
   - [Translation modules](#using-translation-modules)
3. Remove redundant code, using [tree shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking).

### Importing required modules

No matter which of the [optional modules](#list-of-all-modules) you use, the following modules are always required:

- Handsontable's core functionalities
- The default [cell type](@/guides/cell-types/cell-type.md): `text`
- [moment.js](https://momentjs.com/) (you can easily [optimize its size]())
- [DOMpurify](https://www.npmjs.com/package/dompurify)
- [core-js](https://www.npmjs.com/package/core-js)
- Handsontable's CSS

To import the required modules:
1. Import Handsontable from `handsontable/base` (not from `handsontable`, which would give you the [full bundle](@/guides/building-and-testing/packages.md)).
2. Import Handsontable's CSS file as a whole (just like at [installation](@/guides/getting-started/installation.md)).

```js
import Handsontable from 'handsontable/base';

// if you have the full bundle import, remove it
import Handsontable from 'handsontable';

// if you bundler allows it, import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

Now, you're ready to use any [optional modules](#list-of-all-modules) of your choice.

### Using editor modules

Each editor module contains a different type of [cell editor](@/guides/cell-functions/cell-editor.md):

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

To start using an editor module, follow the steps below.

#### Step 1: Import the required modules

First, make sure to [import the required modules](#importing-required-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the editors' registering function

Import the `registerEditor()` function that lets you register your chosen editor:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerEditor } from 'handsontable/editors';
```

#### Step 3: Import your editor module

Import an editor module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerEditor, PasswordEditor } from 'handsontable/editors';
```

#### Step 4: Register your editor

Register your editor, using the `registerEditor()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerEditor, PasswordEditor } from 'handsontable/editors';

// register the `password` editor
registerEditor(PasswordEditor);
```

::: tip
#### Registering all editors at once

If you're importing [all editor modules](#list-of-all-modules), call the `registerAllEditors()` function to register all of them at once:

```js
import { registerAllEditors } from 'handsontable/editors';

// register all editors
registerAllEditors();
```
:::

#### Step 5: Use your editor

Now, you can start using your editor, by setting the [`editor`](@/api/options.md#editor) [configuration option](@/guides/getting-started/setting-options.md):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerEditor, PasswordEditor } from 'handsontable/editors';

registerEditor(PasswordEditor);

// an example
new Handsontable(container, {
  columns: [
    { 
      // use the `password` editor
      editor: 'password',
    },
  ]
});
```

### Using renderer modules

Each renderer module contains a different type of [cell renderer](@/guides/cell-functions/cell-renderer.md):

| Module                 | Cell renderer alias |
| ---------------------- | ------------------- |
| `autocompleteRenderer` | `autocomplete`      |
| `baseRenderer`         | `base`              |
| `checkboxRenderer`     | `checkbox`          |
| `htmlRenderer`         | `html`              |
| `numericRenderer`      | `numeric`           |
| `passwordRenderer`     | `password`          |
| `textRenderer`         | `text`              |

To start using a renderer module, follow the steps below.

#### Step 1: Import the required modules

First, make sure to [import the required modules](#importing-required-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the renderers' registering function

Import the `registerRenderer()` function that lets you register your chosen renderer:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerRenderer } from 'handsontable/renderers';
```

#### Step 3: Import your renderer module

Import a renderer module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `autocompleteRenderer` module
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';
```

#### Step 4: Register your renderer

Register your renderer, using the `registerRenderer()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';

// register the `autocomplete` renderer
registerRenderer(autocompleteRenderer);
```

::: tip
#### Registering all renderers at once

If you're importing [all renderer modules](#list-of-all-modules), call the `registerAllRenderers()` function to register all of them at once:

```js
import { registerAllRenderers } from 'handsontable/renderers';

// register all renderers
registerAllRenderers();
```
:::

#### Step 5: Use your renderer

Now, you can start using your renderer, by setting the [`renderer`](@/api/options.md#renderer) [configuration option](@/guides/getting-started/setting-options.md)::

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';

registerRenderer(autocompleteRenderer);

// an example
new Handsontable(container, {
  columns: [
    { 
      // use the `autocomplete` renderer
      renderer: 'autocomplete',
    },
  ]
});
```

### Using validator modules

Each validator module contains a different type of [cell validator](@/guides/cell-functions/cell-validator.md):

| Module                  | Cell validator alias |
| ----------------------- | -------------------- |
| `autocompleteValidator` | `autocomplete`       |
| `dateValidator`         | `date`               |
| `numericValidator`      | `numeric`            |
| `timeValidator`         | `time`               |

To start using a validator module, follow the steps below.

#### Step 1: Import the required modules

First, make sure to [import the required modules](#importing-required-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the validators' registering function

Import the `registerValidator()` function that lets you register your chosen validator:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerValidator } from 'handsontable/validators';
```

#### Step 3: Import your validator module

Import a validator module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `numericValidator` module
import { registerValidator, numericValidator } from 'handsontable/validators';
```

#### Step 4: Register your validator

Register your validator, using the `registerValidator()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerValidator, numericValidator } from 'handsontable/validators';

// register the `numeric` validator
registerValidator(numericValidator);
```

::: tip
#### Registering all validators at once

If you're importing [all validator modules](#list-of-all-modules), call the `registerAllValidators()` function to register all of them at once:

```js
import { registerAllValidators } from 'handsontable/validators';

// register all validators
registerAllValidators();
```
:::

#### Step 5: Use your validator

Now, you can start using your validator, by setting the [`validator`](@/api/options.md#validator) [configuration option](@/guides/getting-started/setting-options.md):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerValidator, numericValidator } from 'handsontable/validators';

registerValidator(numericValidator);

// an example
new Handsontable(container, {
  columns: [
    { 
      // use the `numeric` validator
      validator: 'numeric',
    },
  ]
});
```

### Using cell type modules

Each cell type module contains a different [cell type](@/guides/cell-types/cell-type.md):

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

To start using a cell type module, follow the steps below.

#### Step 1: Import the required modules

First, make sure to [import the required modules](#importing-required-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the cell types' registering function

Import the `registerCellType()` function that lets you register your cell type:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerCellType } from 'handsontable/cellTypes';
```

#### Step 3: Import your cell type module

Import a cell type module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `CheckboxCellType` module
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
```

#### Step 4: Register your cell type

Register your cell type, using the `registerCellType()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';

// register the `checkbox` cell type
registerCellType(CheckboxCellType);
```

::: tip
#### Registering all cell types at once

If you're importing [all cell type modules](#list-of-all-modules), call the `registerAllCellTypes()` function to register all of them at once:

```js
import { registerAllCellTypes } from 'handsontable/cellTypes';

// register all cell types
registerAllCellTypes();
```
:::

#### Step 5: Use your cell type

Now, you can start using your cell type, by setting the [`type`](@/api/options.md#type) [configuration option](@/guides/getting-started/setting-options.md):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';

registerCellType(CheckboxCellType);

// an example
new Handsontable(container, {
  columns: [
    { 
      // use the `checkbox` cell type
      type: 'checkbox',
    },
  ]
});
```

### Using plugin modules

Each plugin module contains a different [plugin](@/api/plugins.md):

| Module                     | Plugin                     |
| -------------------------- | -------------------------- |
| `AutoColumnSize`           | `AutoColumnSize`           |
| `AutoRowSize`              | `AutoRowSize`              |
| `Autofill`                 | `Autofill`                 |
| `BasePlugin`               | `BasePlugin`               |
| `BindRowsWithHeaders`      | `BindRowsWithHeaders`      |
| `CollapsibleColumns`       | `CollapsibleColumns`       |
| `ColumnSorting`            | `ColumnSorting`            |
| `ColumnSummary`            | `ColumnSummary`            |
| `Comments`                 | `Comments`                 |
| `ContextMenu`              | `ContextMenu`              |
| `CopyPaste`                | `CopyPaste`                |
| `CustomBorders`            | `CustomBorders`            |
| `DragToScroll`             | `DragToScroll`             |
| `DropdownMenu`             | `DropdownMenu`             |
| `ExportFile`               | `ExportFile`               |
| `Filters`                  | `Filters`                  |
| `Formulas`                 | `Formulas`                 |
| `HiddenColumns`            | `HiddenColumns`            |
| `HiddenRows`               | `HiddenRows`               |
| `ManualColumnFreeze`       | `ManualColumnFreeze`       |
| `ManualColumnMove`         | `ManualColumnMove`         |
| `ManualColumnResize`       | `ManualColumnResize`       |
| `ManualRowMove`            | `ManualRowMove`            |
| `ManualRowResize`          | `ManualRowResize`          |
| `MergeCells`               | `MergeCells`               |
| `MultiColumnSorting`       | `MultiColumnSorting`       |
| `MultipleSelectionHandles` | `MultipleSelectionHandles` |
| `NestedHeaders`            | `NestedHeaders`            |
| `NestedRows`               | `NestedRows`               |
| `PersistentState`          | `PersistentState`          |
| `Search`                   | `Search`                   |
| `TouchScroll`              | `TouchScroll`              |
| `TrimRows`                 | `TrimRows`                 |
| `UndoRedo`                 | `UndoRedo`                 |

To start using a plugin module, follow the steps below.

#### Step 1: Import the required modules

First, make sure to [import the required modules](#importing-required-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the plugins' registering function

Import the `registerPlugin()` function that lets you register your plugin:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerPlugin } from 'handsontable/plugins';
```

#### Step 3: Import your plugin module

Import a plugin module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `ContextMenu` module
import { registerPlugin, ContextMenu } from 'handsontable/plugins';
```

#### Step 4: Register your plugin

Register your plugin, using the `registerPlugin()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

// register the `ContextMenu` plugin
registerPlugin(ContextMenu);
```

::: tip
#### Registering all plugins at once

If you're importing [all plugin modules](#list-of-all-modules), call the `registerAllPlugins()` function to register all of them at once:

```js
import { registerAllPlugins } from 'handsontable/plugins';

// register all plugins
registerAllPlugins();
```
:::

#### Step 5: Use your plugin

Now, you can start using your plugin:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

registerPlugin(ContextMenu);

// an example
new Handsontable(container, {
  // use the `ContextMenu` plugin
  contextMenu: true,
});
```

### Using translation modules

Each translation module contains a different [translation](@/guides/internationalization/internationalization-i18n.md) package:

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

To start using a translation module, follow the steps below.

#### Step 1: Import the required modules

First, make sure to [import the required modules](#importing-required-modules):

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the translations' registering function

Import the `registerLanguageDictionary()` function that lets you register your translation:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

import { registerLanguageDictionary } from 'handsontable/i18n';
```

#### Step 3: Import your translation module

Import a translation module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `plPL` module
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';
```

#### Step 4: Register your translation

Register your translation, using the `registerLanguageDictionary()` function. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';

// register the `plPL` translation
registerLanguageDictionary(plPL.languageCode, plPL);
```

#### Step 5: Use your translation

Now, you can start using your translation, by setting the [`language`](@/api/options.md#language) [configuration option](@/guides/getting-started/setting-options.md):

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
#### Optimizing Moment.js locales

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

And then explicitly load Moment.js, importing only those locales that you need:

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

### Using modules with framework wrappers

You can use modules with Handsontable's framework wrappers:
- [Using modules with React](@/guides/integrate-with-react/react-modules.md)
- [Using modules with Angular](@/guides/integrate-with-angular/angular-modules.md)
- [Using modules with Vue 2](@/guides/integrate-with-vue/vue-modules.md)
- [Using modules with Vue 3](@/guides/integrate-with-vue3/vue3-modules.md)