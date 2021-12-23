---
title: Modules
metaTitle: Modules - Guide - Handsontable Documentation
permalink: /next/modules
canonicalUrl: /modules
tags:
  - tree shaking
---

# Modules

You can use Handsontable through individual modules.

[[toc]]

## About modules

With modules, you can pick and choose only those parts of Handsontable that you actually need. This can significantly reduce the size of your app.

Read more:
- [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Modularizing to improve the developer experience](https://handsontable.com/blog/articles/2021/2/modularizing-to-improve-the-developer-experience)
- [Handsontable 11.0.0: modularization for React, Angular, and Vue](https://handsontable.com/blog/articles/2021/11/handsontable-11.0.0-modularization-for-react-angular-and-vue)

### All modules

Handsontable is made of the following modules:

| Module types                                                               | Modules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Required? |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Base                                                                       | `handsontable/base`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Required  |
| [Cell editors](@/guides/cell-functions/cell-editor.md)                     | `AutocompleteEditor`<br>`BaseEditor`<br>`CheckboxEditor`<br>`DateEditor`<br>`DropdownEditor`<br>`HandsontableEditor`<br>`NumericEditor`<br>`PasswordEditor`<br>`SelectEditor`<br>`TextEditor`                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Optional  |
| [Cell renderers](@/guides/cell-functions/cell-renderer.md)                 | `baseRenderer`<br>`autocompleteRenderer`<br>`checkboxRenderer`<br>`htmlRenderer`<br>`numericRenderer`<br>`passwordRenderer`<br>`textRenderer`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Optional  |
| [Cell validators](@/guides/cell-functions/cell-validator.md)               | `autocompleteValidator`<br>`dateValidator`<br>`numericValidator`<br>`timeValidator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Optional  |
| [Cell types](@/guides/cell-types/cell-type.md)                             | `AutocompleteCellType`<br>`CheckboxCellType`<br>`DateCellType`<br>`DropdownCellType`<br>`HandsontableCellType`<br>`NumericCellType`<br>`PasswordCellType`<br>`TextCellType`<br>`TimeCellType`                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Optional  |
| [Plugins](@/api/plugins.md)                                                | `AutoColumnSize`<br>`AutoRowSize`<br>`Autofill`<br>`BasePlugin`<br>`BindRowsWithHeaders`<br>`CollapsibleColumns`<br>`ColumnSorting`<br>`ColumnSummary`<br>`Comments`<br>`ContextMenu`<br>`CopyPaste`<br>`CustomBorders`<br>`DragToScroll`<br>`DropdownMenu`<br>`ExportFile`<br>`Filters`<br>`Formulas`<br>`HiddenColumns`<br>`HiddenRows`<br>`ManualColumnFreeze`<br>`ManualColumnMove`<br>`ManualColumnResize`<br>`ManualRowMove`<br>`ManualRowResize`<br>`MergeCells`<br>`MultiColumnSorting`<br>`MultipleSelectionHandles`<br>`NestedHeaders`<br>`NestedRows`<br>`PersistentState`<br>`Search`<br>`TouchScroll`<br>`TrimRows`<br>`UndoRedo` | Optional  |
| [Translations](@/guides/internationalization/internationalization-i18n.md) | `deCH` `deDE` `enUS` `esMX`<br>`frFR` `itIT` `jaJP` `koKR`<br>`lvLV` `nbNO` `nlNL` `plPL`<br>`ptBR` `ruRU` `zhCN` `zhTW`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Optional  |

To see how to import all the modules that Handsontable is made of, click below:

::: details Importing all modules
```js
// import the `handsontable/base` module
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
  registerEditor, // editors' registering method
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
  registerRenderer, // renderers' registering method
} from 'handsontable/renderers';

// import validators
import {
  registerValidator,
  autocompleteValidator,
  dateValidator,
  numericValidator,
  timeValidator, // validators' registering method
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
  TimeCellType, // renderers' registering method
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
  registerPlugin, // plugins' registering method
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
  registerLanguageDictionary, // translations' registering method
} from 'handsontable/i18n';

// optionally, import registering methods
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

## Using modules

To start using Handsontable modules:
1. [Import the required modules](#importing-required-modules).
2. Use optional modules of your choice:
   - [Editor modules](#using-editor-modules)
   - [Renderer modules](#using-renderer-modules)
   - [Validator modules](#using-validator-modules)
   - [Cell type modules](#using-cell-type-modules)
   - [Plugin modules](#using-plugin-modules)
   - [Translation modules](#using-translation-modules)
3. Use [tree shaking](#tree-shaking) to remove unused code.

### Importing required modules

The required modules contain core elements of Handsontable. Without those modules, Handsontable doesn't work.

To import the required modules, follow the steps below.

#### Step 1: Remove the full Handsontable import

When using modules, you no longer need to import the full version of Handsontable.

Remove the `handsontable` import:

```js
// remove this line
import Handsontable from 'handsontable';
```

#### Step 2: Import the `handsontable/base` module

Instead of the full Handsontable version, import the `handsontable/base` module.

The `handsontable/base` module contains:
- Handsontable's core functionalities
- The default [cell type](@/guides/cell-types/cell-type.md): `text`
- [moment.js](https://momentjs.com/)
- [DOMpurify](https://www.npmjs.com/package/dompurify)
- [core-js](https://www.npmjs.com/package/core-js)

```js
// import the `handsontable/base` module
import Handsontable from 'handsontable/base';
```

#### Step 3: Import the CSS

Handsontable's CSS file is not modularized, so you need to import it separately:

```js
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

Now, you're ready to use [any optional modules](#all-modules) of your choice.

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
// import the `handsontable/base` module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the editors' registering method

Import the `registerEditor()` method that lets you register your chosen editor:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `registerEditor()` method
import { registerEditor } from 'handsontable/editors';
```

#### Step 3: Import your editor module

Import an editor module of your choice. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `PasswordEditor` module
import { registerEditor, PasswordEditor } from 'handsontable/editors';
```

#### Step 4: Register your editor

Register your editor, using the `registerEditor()` method. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerEditor, PasswordEditor } from 'handsontable/editors';

// register the `password` editor
registerEditor(PasswordEditor);
```

#### Step 5: Use your editor

Now, you can start using your editor:

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

::: tip
#### Registering all editors at once

If you import all of Handsonable's editor modules, register all of them at once with the `registerAllEditors()` method:

```js
// import the `registerAllEditors()` method
import { registerAllEditors } from 'handsontable/registry';

// register all editors
registerAllEditors();
```
:::

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
// import the `handsontable/base` module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the renderers' registering method

Import the `registerRenderer()` method that lets you register your chosen renderer:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `registerRenderer()` method
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

Register your renderer, using the `registerRenderer()` method. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerRenderer, autocompleteRenderer } from 'handsontable/renderers';

// register the `autocomplete` renderer
registerRenderer(autocompleteRenderer);
```

#### Step 5: Use your renderer

Now, you can start using your renderer:

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

::: tip
#### Registering all renderers at once

If you import all of Handsonable's renderer modules, register all of them at once with the `registerAllRenderers()` method:

```js
// import the `registerAllRenderers()` method
import { registerAllRenderers } from 'handsontable/registry';

// register all renderers
registerAllRenderers();
```
:::

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
// import the `handsontable/base` module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the validators' registering method

Import the `registerValidator()` method that lets you register your chosen validator:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `registerValidator()` method
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

Register your validator, using the `registerValidator()` method. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerValidator, numericValidator } from 'handsontable/validators';

// register the `numeric` validator
registerValidator(numericValidator);
```

#### Step 5: Use your validator

Now, you can start using your validator:

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

::: tip
#### Registering all validators at once

If you import all of Handsonable's validator modules, register all of them at once with the `registerAllValidators()` method:

```js
// import the `registerAllValidators()` method
import { registerAllValidators } from 'handsontable/registry';

// register all validators
registerAllValidators();
```
:::

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
// import the `handsontable/base` module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the cell types' registering method

Import the `registerCellType()` method that lets you register your cell type:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `registerCellType()` method
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

Register your cell type, using the `registerCellType()` method. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';

// register the `checkbox` cell type
registerCellType(CheckboxCellType);
```

#### Step 5: Use your cell type

Now, you can start using your cell type:

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

::: tip
#### Registering all cell types at once

If you import all of Handsonable's cell type modules, register all of them at once with the `registerAllCellTypes()` method:

```js
// import the `registerAllCellTypes()` method
import { registerAllCellTypes } from 'handsontable/registry';

// register all cell types
registerAllCellTypes();
```
:::

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
// import the `handsontable/base` module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.css';
```

#### Step 2: Import the plugins' registering method

Import the `registerPlugin()` method that lets you register your plugin:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';

// import the `registerPlugin()` method
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

Register your plugin, using the `registerPlugin()` method. For example:

```js
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.full.css';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

// register the `ContextMenu` plugin
registerPlugin(ContextMenu);
```

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

::: tip
#### Registering all plugins at once

If you import all of Handsonable's plugin modules, register all of them at once with the `registerAllPlugins()` method:

```js
// import the `registerAllPlugins()` method
import { registerAllPlugins } from 'handsontable/registry';

// register all plugins
registerAllPlugins();
```
:::

### Using translation modules

Importing translations works slightly different than in case of other elements. Let's try adding the `pl-PL` language.

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

Now, you can use newly registered translation. The full example looks like this:

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

And that is all! You can use the PL-pl translation!

#### Optimizing moment.js locales

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

### Using modules with framework wrappers

You can also use modules with Handsontable's framework wrappers:
- [Using modules with React](@/guides/integrate-with-react/react-modules.md)
- [Using modules with Angular](@/guides/integrate-with-angular/angular-modules.md)
- [Using modules with Vue](@/guides/integrate-with-vue/vue-modules.md)

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