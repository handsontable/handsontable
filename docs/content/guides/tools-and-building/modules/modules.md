---
id: ffimaicc
title: Modules
metaTitle: Modules - JavaScript Data Grid | Handsontable
description: Reduce the size of your JavaScript bundle, by importing only the modules that you need. The base module is mandatory, all other modules are optional.
permalink: /modules
canonicalUrl: /modules
tags:
  - tree shaking
react:
  id: weudz1vh
  metaTitle: Modules - React Data Grid | Handsontable
searchCategory: Guides
category: Tools and building
---

# Modules

Reduce the size of your JavaScript bundle, by importing only the modules that you need. The base module is mandatory, all other modules are optional.

[[toc]]

## Overview

Handsontable is a comprehensive tool with a broad range of features. If you don't use all of them, you can pick just the parts that you need, and get rid of the rest (e.g., unnecessary translations). This approach reduces Handsontable's impact on the overall size of your app.

To make this possible, Handsontable is divided into modules.

### Use modules

To get the most out of using Handsontable's modules:
1. Import the [base module](#base-module).
2. Import [optional modules](#optional-modules) of your choice.
3. Remove redundant code (so-called tree shaking).

#### Bundler support

To use Handsontable's modules, your environment needs to support the `import` syntax, which is typically provided by a bundler.

We successfully tested Handsontable with the following bundlers:
- webpack
- Parcel
- Rollup
- Vite

If Handsontable's modules don't work with your bundler, report it as a [bug](https://github.com/handsontable/handsontable/issues/new?assignees=&labels=&template=01-handsontable.md&title=).

## Base module

No matter which of the optional modules you use, you always need to import the base module (`handsontable/base`), which covers:
- Handsontable's core functionalities
- The default cell type: [`text`](@/guides/cell-types/cell-type/cell-type.md#available-cell-types)

### Import the base module

::: only-for javascript

To get the base JavaScript module, import Handsontable from `handsontable/base` (not from `handsontable`, which would give you the [full distribution package](@/guides/tools-and-building/packages/packages.md)):

:::

::: only-for react

To get the base JavaScript module, import Handsontable from `handsontable/base` (not from `handsontable`, which would give you the full distribution package):

:::

```js
import Handsontable from 'handsontable/base';
```

Handsontable's CSS stylesheets are not modular. You need to import them separately:
- [Import Handsontable's CSS](@/guides/getting-started/installation/installation.md#import-handsontable-s-css)

Now, you're ready to use any [optional modules](#optional-modules) of your choice.
## Optional modules

Handsontable's optional modules are grouped into:
- [Cell type modules](#cell-type-modules)
- [Plugin modules](#plugin-modules)
- [Translation modules](#translation-modules)

### Cell type modules

Cell type modules contain Handsontable's [cell types](@/guides/cell-types/cell-type/cell-type.md).

You can import the following cell type modules:

```js
import {
  registerCellType, // cell types' registering function
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  SelectCellType,
  TextCellType,
  TimeCellType,
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
| `SelectCellType`       | `select`        |
| `TextCellType`         | `text`          |
| `TimeCellType`         | `time`          |

:::

#### Import a cell type module

1. Make sure you import the [base module](#base-module):
    ```js
    import Handsontable from 'handsontable/base';
    ```
2. Import the registering function and a cell type module of your choice. For example:
    ```js
    import {
      registerCellType,
      NumericCellType,
    } from 'handsontable/cellTypes';
    ```
3. Register your cell type module, to let Handsontable recognize it. For example:
    ```js
    registerCellType(NumericCellType);
    ```

    A full example:

    ```js
    import Handsontable from 'handsontable/base';
    import {
      registerCellType,
      NumericCellType,
    } from 'handsontable/cellTypes';

    registerCellType(NumericCellType);
    ```

#### Renderer, editor, and validator modules

Each cell type module is made of:
- A [renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) module
- An [editor](@/guides/cell-functions/cell-editor/cell-editor.md) module
- A [validator](@/guides/cell-functions/cell-validator/cell-validator.md) module (optionally)

::: tip

To find out which renderer, editor, and validator a given cell type is made of,
see the API reference of the [`type`](@/api/options.md#type) configuration option.

:::

You can import renderer, editor, and validator modules individually.
For the full list of those modules, see the [List of all modules](#list-of-all-modules) section.

For example, you can import the `numeric` cell type as a whole:

::: only-for javascript

```js
import Handsontable from 'handsontable/base';
import {
  registerCellType,
  NumericCellType,
} from 'handsontable/cellTypes';

registerCellType(NumericCellType);

const container = document.querySelector('#example1');

new Handsontable(container, {
  columns: [
    {
      type: 'numeric'
    }
  ]
});
```

:::

::: only-for react

```jsx
import Handsontable from 'handsontable/base';
import { HotTable } from '@handsontable/react-wrapper';
import {
  registerCellType,
  NumericCellType,
} from 'handsontable/cellTypes';

registerCellType(NumericCellType);

const container = document.querySelector('#example1');

<HotTable
  columns={[
    {
      type: 'numeric'
    }
  ]}
/>
```

:::

Or, you can import the `numeric` cell type's renderer, editor, and validator individually (the effect is the same as above):

::: only-for javascript

```js
import Handsontable from 'handsontable/base';
import {
  registerRenderer,
  numericRenderer,
} from 'handsontable/renderers';
import {
  registerEditor,
  NumericEditor,
} from 'handsontable/editors';
import {
  registerValidator,
  numericValidator,
} from 'handsontable/validators';

registerRenderer(numericRenderer);
registerEditor(NumericEditor);
registerValidator(numericValidator);

new Handsontable(container, {
  columns: [
    {
      renderer: 'numeric',
      editor: 'numeric',
      validator: 'numeric',
      dataType: 'number',
      type: 'numeric',
    }
  ]
});
```

:::

::: only-for react

```jsx
import Handsontable from 'handsontable/base';
import { HotTable } from '@handsontable/react-wrapper';
import {
  registerRenderer,
  numericRenderer,
} from 'handsontable/renderers';
import {
  registerEditor,
  NumericEditor,
} from 'handsontable/editors';
import {
  registerValidator,
  numericValidator,
} from 'handsontable/validators';

registerRenderer(numericRenderer);
registerEditor(NumericEditor);
registerValidator(numericValidator);

<HotTable
  columns={[
    {
      renderer: 'numeric',
      editor: 'numeric',
      validator: 'numeric',
      dataType: 'number',
      type: 'numeric',
    }
  ]}
/>

```

:::

### Plugin modules

Plugin modules contain Handsontable's [plugins](@/api/plugins.md).

You can import the following plugin modules:

```js
import {
  registerPlugin, // plugins' registering function
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
  StretchColumns,
  TouchScroll,
  TrimRows,
  UndoRedo,
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
| `StretchColumns`           | [`StretchColumns`](@/api/stretchColumns.md)           |
| `TouchScroll`              | `TouchScroll`                                         |
| `TrimRows`                 | [`TrimRows`](@/api/trimRows.md)                       |
| `UndoRedo`                 | [`UndoRedo`](@/api/undoRedo.md)                       |

:::

#### Import a plugin module

1. Make sure you import the [base module](#base-module):
    ```js
    import Handsontable from 'handsontable/base';
    ```
2. Import registering function and a plugin module of your choice. For example:
    ```js
    import {
      registerPlugin,
      ContextMenu,
    } from 'handsontable/plugins';
    ```
3. Register your plugin module, to let Handsontable recognize it. For example:
    ```js
    registerPlugin(ContextMenu);
    ```

    A full example:

    ```js
    import Handsontable from 'handsontable/base';
    import {
      registerPlugin,
      ContextMenu,
    } from 'handsontable/plugins';

    registerPlugin(ContextMenu);
    ```

### Translation modules

Translation modules contain Handsontable's [translations](@/guides/internationalization/language/language.md).

You can import the following translation modules:

```js
import {
  registerLanguageDictionary, // translations' registering function
  arAR,
  csCZ,
  deCH,
  deDE,
  enUS,
  esMX,
  frFR,
  hrHR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  srSP,
  zhCN,
  zhTW,
} from 'handsontable/i18n';
```

Each translation module contains a different translation package:

::: details Translation modules

| Module | Translation                 |
| ------ | --------------------------- |
| `arAR` | Arabic - Global             |
| `csCZ` | Czech - Czech Republic      |
| `deCH` | German - Switzerland        |
| `deDE` | German - Germany            |
| `enUS` | English - United States     |
| `esMX` | Spanish - Mexico            |
| `frFR` | French - France             |
| `hrHR` | Croatian - Croatia          |
| `itIT` | Italian - Italy             |
| `jaJP` | Japanese - Japan            |
| `koKR` | Korean - Korea              |
| `lvLV` | Latvian - Latvia            |
| `nbNO` | Norwegian (Bokmål) - Norway |
| `nlNL` | Dutch - Netherlands         |
| `plPL` | Polish - Poland             |
| `ptBR` | Portuguese - Brazil         |
| `ruRU` | Russian - Russia            |
| `srSP` | Serbian - Serbia            |
| `zhCN` | Chinese - China             |
| `zhTW` | Chinese - Taiwan            |

:::

#### Import a translation module

1. Make sure you import the [base module](#base-module):
    ```js
    import Handsontable from 'handsontable/base';
    ```
2. Import the registering function and and a translation module of your choice. For example:
    ```js
    import {
      registerLanguageDictionary,
      plPL,
    } from 'handsontable/i18n';
    ```
3. Register your translation module, to let Handsontable recognize it. For example:
    ```js
    registerLanguageDictionary(plPL);
    ```

    A full example:

    ```js
    import Handsontable from 'handsontable/base';
    import {
      registerLanguageDictionary,
      plPL,
    } from 'handsontable/i18n';

    registerLanguageDictionary(plPL);
    ```

## List of all modules

The table below lists all of Handsontable's modules:

| Type                                                         | Modules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Required / optional |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Core functionalities                                         | `handsontable/base`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Required            |
| [Cell types](@/guides/cell-types/cell-type/cell-type.md)               | `AutocompleteCellType`<br>`CheckboxCellType`<br>`DateCellType`<br>`DropdownCellType`<br>`HandsontableCellType`<br>`NumericCellType`<br>`PasswordCellType`<br>`SelectCellType`<br>`TextCellType`<br>`TimeCellType`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Optional            |
| [Cell renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md)   | `baseRenderer`<br>`autocompleteRenderer`<br>`checkboxRenderer`<br>`dateRenderer`<br>`dropdownRenderer`<br>`handsontableRenderer`<br>`htmlRenderer`<br>`numericRenderer`<br>`passwordRenderer`<br>`selectRenderer`<br>`textRenderer`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Optional            |
| [Cell editors](@/guides/cell-functions/cell-editor/cell-editor.md)       | `AutocompleteEditor`<br>`BaseEditor`<br>`CheckboxEditor`<br>`DateEditor`<br>`DropdownEditor`<br>`HandsontableEditor`<br>`NumericEditor`<br>`PasswordEditor`<br>`SelectEditor`<br>`TextEditor`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Optional            |
| [Cell validators](@/guides/cell-functions/cell-validator/cell-validator.md) | `autocompleteValidator`<br>`dateValidator`<br>`dropdownValidator`<br>`numericValidator`<br>`timeValidator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Optional            |
| [Plugins](@/api/plugins.md)                                  | [`AutoColumnSize`](@/api/autoColumnSize.md)<br>[`Autofill`](@/api/autofill.md)<br>[`AutoRowSize`](@/api/autoRowSize.md)<br>[`BasePlugin`](@/api/basePlugin.md)<br>[`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md)<br>[`CollapsibleColumns`](@/api/collapsibleColumns.md)<br>[`ColumnSorting`](@/api/columnSorting.md)<br>[`ColumnSummary`](@/api/columnSummary.md)<br>[`Comments`](@/api/comments.md)<br>[`ContextMenu`](@/api/contextMenu.md)<br>[`CopyPaste`](@/api/copyPaste.md)<br>[`CustomBorders`](@/api/customBorders.md)<br>[`DragToScroll`](@/api/dragToScroll.md)<br>[`DropdownMenu`](@/api/dropdownMenu.md)<br>[`ExportFile`](@/api/exportFile.md)<br>[`Filters`](@/api/filters.md)<br>[`Formulas`](@/api/formulas.md)<br>[`HiddenColumns`](@/api/hiddenColumns.md)<br>[`HiddenRows`](@/api/hiddenRows.md)<br>[`ManualColumnFreeze`](@/api/manualColumnFreeze.md)<br>[`ManualColumnMove`](@/api/manualColumnMove.md)<br>[`ManualColumnResize`](@/api/manualColumnResize.md)<br>[`ManualRowMove`](@/api/manualRowMove.md)<br>[`ManualRowResize`](@/api/manualRowResize.md)<br>[`MergeCells`](@/api/mergeCells.md)<br>[`MultiColumnSorting`](@/api/multiColumnSorting.md)<br>`MultipleSelectionHandles`<br>[`NestedHeaders`](@/api/nestedHeaders.md)<br>[`NestedRows`](@/api/nestedRows.md)<br>[`PersistentState`](@/api/persistentState.md)<br>[`Search`](@/api/search.md)<br>[`StretchColumns`](@/api/stretchColumns.md)<br>`TouchScroll`<br>[`TrimRows`](@/api/trimRows.md)<br>[`UndoRedo`](@/api/undoRedo.md) | Optional            |
| [Translations](@/guides/internationalization/language/language.md)    | `arAR` `csCZ` `deCH` `deDE` `enUS` `esMX`<br>`frFR` `hrHR` `itIT` `jaJP` `koKR`<br>`lvLV` `nbNO` `nlNL` `plPL`<br>`ptBR` `ruRU` `srSP` `zhCN` `zhTW`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Optional            |

## List of all module imports

To quickly register all modules in bulk, use these registering functions:
- `registerAllCellTypes()`
- `registerAllRenderers()`
- `registerAllEditors()`
- `registerAllValidators()`
- `registerAllPlugins()`
- `registerAllModules()`

::: details Import and register all modules in bulk

```js
// the base module
import Handsontable from 'handsontable/base';

// cell type modules
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
} from 'handsontable/cellTypes';

// renderer modules
import {
  baseRenderer,
  autocompleteRenderer,
  checkboxRenderer,
  dropdownRenderer,
  htmlRenderer,
  numericRenderer,
  passwordRenderer,
  textRenderer,
} from 'handsontable/renderers';

// editor modules
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
} from 'handsontable/editors';

// validator modules
import {
  autocompleteValidator,
  dateValidator,
  dropdownValidator,
  numericValidator,
  timeValidator,
} from 'handsontable/validators';

// plugin modules
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
  StretchColumns,
  TouchScroll,
  TrimRows,
  UndoRedo,
} from 'handsontable/plugins';

// translation modules
import {
  arAR,
  csCZ,
  deCH,
  deDE,
  enUS,
  esMX,
  frFR,
  hrHR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  srSP,
  zhCN,
  zhTW,
} from 'handsontable/i18n';

// registering functions that let you quickly register all modules at once
import {
  registerAllCellTypes,
  registerAllRenderers,
  registerAllEditors,
  registerAllValidators,
  registerAllPlugins,
  registerAllModules,
} from 'handsontable/registry'

// register all cell types at once
registerAllCellTypes();

// register all renderers at once
registerAllRenderers();

// register all editors at once
registerAllEditors();

// register all validators at once
registerAllValidators();

// register all plugins at once
registerAllPlugins();

// register individual translations
registerLanguageDictionary(arAR);
registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(enUS);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(hrHR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
registerLanguageDictionary(srSP);
registerLanguageDictionary(zhCN);
registerLanguageDictionary(zhTW);

// or, register all of Handsontable's modules at once
registerAllModules();
```

:::

To register individual modules explicitly, use these registering functions:
- `registerCellType()`
- `registerRenderer()`
- `registerEditor()`
- `registerValidator()`
- `registerPlugin()`
- `registerLanguageDictionary()`

::: details Import and register all modules explicitly

```js
// the base module
import Handsontable from 'handsontable/base';

// cell type modules
import {
  registerCellType, // cell types' registering function
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

// renderer modules
import {
  registerRenderer, // renderers' registering function
  baseRenderer,
  autocompleteRenderer,
  checkboxRenderer,
  dropdownRenderer,
  htmlRenderer,
  numericRenderer,
  passwordRenderer,
  textRenderer,
} from 'handsontable/renderers';

// editor modules
import {
  registerEditor, // editors' registering function
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

// validator modules
import {
  registerValidator, // validators' registering function
  autocompleteValidator,
  dateValidator,
  dropdownValidator,
  numericValidator,
  timeValidator,
} from 'handsontable/validators';

// plugin modules
import {
  registerPlugin, // plugins' registering function
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
  StretchColumns,
  TouchScroll,
  TrimRows,
  UndoRedo,
} from 'handsontable/plugins';

// translation modules
import {
  registerLanguageDictionary, // translations' registering function
  arAR,
  csCZ,
  deCH,
  deDE,
  enUS,
  esMX,
  frFR,
  hrHR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  srSP,
  zhCN,
  zhTW,
} from 'handsontable/i18n';

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

// register individual renderers
registerRenderer(baseRenderer);
registerRenderer(autocompleteRenderer);
registerRenderer(checkboxRenderer);
registerRenderer(dropdownRenderer);
registerRenderer(htmlRenderer);
registerRenderer(numericRenderer);
registerRenderer(passwordRenderer);
registerRenderer(textRenderer);

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

// register individual validators
registerValidator(autocompleteValidator);
registerValidator(dateValidator);
registerValidator(dropdownValidator);
registerValidator(numericValidator);
registerValidator(timeValidator);

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
registerPlugin(StretchColumns);
registerPlugin(TouchScroll);
registerPlugin(TrimRows);
registerPlugin(UndoRedo);

// register individual translations
registerLanguageDictionary(arAR);
registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(enUS);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(hrHR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
registerLanguageDictionary(srSP);
registerLanguageDictionary(zhCN);
registerLanguageDictionary(zhTW);
```

:::

::: tip

Parcel, webpack 3 (and older), and a few other bundlers require you to import modules one by one, from their respective files of origin. See the full list of such imports:

:::

::: details All imports

```js
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

import { registerRenderer } from 'handsontable/renderers/registry';
import { autocompleteRenderer } from 'handsontable/renderers/autocompleteRenderer';
import { baseRenderer } from 'handsontable/renderers/baseRenderer';
import { checkboxRenderer } from 'handsontable/renderers/checkboxRenderer';
import { dropdownRenderer } from 'handsontable/renderers/dropdownRenderer';
import { htmlRenderer } from 'handsontable/renderers/htmlRenderer';
import { numericRenderer } from 'handsontable/renderers/numericRenderer';
import { passwordRenderer } from 'handsontable/renderers/passwordRenderer';
import { textRenderer } from 'handsontable/renderers/textRenderer';

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

import { registerValidator } from 'handsontable/validators/registry';
import { autocompleteValidator } from 'handsontable/validators/autocompleteValidator';
import { dateValidator } from 'handsontable/validators/dateValidator';
import { dropdownValidator } from 'handsontable/validators/dropdownValidator';
import { numericValidator } from 'handsontable/validators/numericValidator';
import { timeValidator } from 'handsontable/validators/timeValidator';

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
import { StretchColumns } from 'handsontable/plugins/stretchColumns';
import { TouchScroll } from 'handsontable/plugins/touchScroll';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { UndoRedo } from 'handsontable/plugins/undoRedo';

import { registerLanguageDictionary } from 'handsontable/i18n/registry';
```

:::

::: only-for javascript

## Using modules with frameworks

You can also use modules with Handsontable's framework wrappers:

<div class="boxes-list">

- [Using modules with React](@/react/guides/tools-and-building/modules/modules.md)
- [Using modules with Angular](@/guides/integrate-with-angular/angular-modules/angular-modules.md)
- [Using modules with Vue 2](@/guides/integrate-with-vue/vue-modules/vue-modules.md)
- [Using modules with Vue 3](@/guides/integrate-with-vue3/vue3-modules/vue3-modules.md)

</div>

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Bundle size](@/guides/optimization/bundle-size/bundle-size.md)
- [Installation](@/guides/getting-started/installation/installation.md)

::: only-for javascript

- [Modules in React](@/react/guides/tools-and-building/modules/modules.md)
- [Modules in Angular](@/guides/integrate-with-angular/angular-modules/angular-modules.md)
- [Modules in Vue 2](@/guides/integrate-with-vue/vue-modules/vue-modules.md)
- [Modules in Vue 3](@/guides/integrate-with-vue3/vue3-modules/vue3-modules.md)

:::

</div>

### Related blog articles

<div class="boxes-list">

- [Modularizing to improve the developer experience](https://handsontable.com/blog/modularizing-to-improve-the-developer-experience)
- [Handsontable 11.0.0: modularization for React, Angular, and Vue](https://handsontable.com/blog/handsontable-11.0.0-modularization-for-react-angular-and-vue)

</div>
