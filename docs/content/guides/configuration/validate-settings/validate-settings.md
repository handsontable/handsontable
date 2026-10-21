---
type: how-to
title: Validate settings
metaTitle: Validate settings | Handsontable DataGrid for JavaScript
description: Check a stored, user-edited, or generated configuration against the settings JSON Schema of Handsontable DataGrid before you apply it, and get a list of problems.
permalink: /validate-settings
canonicalUrl: /validate-settings
tags:
  - options
  - settings
  - json schema
  - validation
  - configuration
react:
  metaTitle: Validate settings | Handsontable DataGrid for React
angular:
  metaTitle: Validate settings | Handsontable DataGrid for Angular
vue:
  metaTitle: Validate settings | Handsontable DataGrid for Vue
searchCategory: Guides
category: Configuration
menuTag: new
addedIn: "19.0.0"
---

Check a configuration before you pass it to Handsontable DataGrid, and get a list of problems with a path and a message for each.

[[toc]]

## Overview

Handsontable ignores a misspelled option (`colHeader`) and most values of the wrong type. TypeScript catches these
mistakes in typed code at build time, but not in settings that you load from JSON, a database, a URL, a low-code
builder, or a language model.

The `handsontable/settingsSchema` module gives you two tools:

- `validateSettings()` checks a settings object and returns the problems it finds. It applies nothing and never
  throws.
- `settingsSchema` is a JSON Schema (draft 2020-12) of every grid, column, and cell option. Use it for form
  generation, your own validator, or, saved to a file, editor autocomplete for JSON configs. See
  [Use the JSON Schema](#use-the-json-schema).

Both tools read the cell types, editors, renderers, validators, and plugins that the `handsontable` npm package
registers on the page. Next to the UMD build loaded from a CDN, the module sees none of them, so use it with the
npm package.

Nothing runs on its own: the grid does not validate its settings, so existing configurations behave as before.

## Validate a configuration

Import `validateSettings()` and call it with a settings object:

```js
import { validateSettings } from 'handsontable/settingsSchema';

const settings = JSON.parse(localStorage.getItem('grid-config'));
const { valid, problems } = validateSettings(settings);

if (valid) {
  hot.updateSettings(settings);
} else {
  console.table(problems);
}
```

Each problem has four properties:

| Property   | Description                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `path`     | Where the problem is, such as `colHeader` or `columns[3].type`. `''` means the whole object. |
| `code`     | What the problem is about. See [Problem codes](#problem-codes).                      |
| `severity` | `error` for a setting that Handsontable ignores or cannot use. `warning` for a likely mistake that may be intended. |
| `message`  | A sentence that says what to change.                                                |

`valid` is `true` when no problem has the `error` severity. Warnings are listed, but they do not make the settings
invalid.

For example, this configuration has three problems:

```js
validateSettings({
  colHeader: true,
  stretchH: 'full',
  columns: [{ type: 'text' }, { type: 'currency' }],
});

// {
//   valid: false,
//   problems: [
//     { path: 'colHeader', code: 'unknownOption', severity: 'error',
//       message: "Unknown option 'colHeader'. Did you mean 'colHeaders'?" },
//     { path: 'stretchH', code: 'invalidValue', severity: 'error',
//       message: "Expected one of 'none', 'all', 'last', got 'full'." },
//     { path: 'columns[1].type', code: 'unknownCellType', severity: 'error',
//       message: "'currency' is not a registered cell type." },
//   ],
// }
```

## Problem codes

| Code                  | Reported when                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `invalidSettings`     | The input is not a settings object.                                                              |
| `unknownOption`       | A key is not an option, or not a key of a plugin's settings object. The message suggests the closest name when there is one. |
| `wrongLevel`          | An option is set at a level it is not read at, such as `fixedRowsTop` inside `columns`, or a hook inside `columns`. See [Option levels](@/guides/configuration/configuration-option-levels/configuration-option-levels.md). |
| `invalidType`         | A value has the wrong type, such as `rowHeaders: 5`.                                             |
| `invalidValue`        | A value is not in the allowed set, such as `stretchH: 'full'`, or a value cannot be read.        |
| `unknownCellType`     | A `type` names a cell type that is not registered on the page.                                   |
| `unknownEditor`       | An `editor` names an editor that is not registered on the page.                                  |
| `unknownRenderer`     | A `renderer` names a renderer that is not registered on the page.                                |
| `unknownValidator`    | A `validator` names a validator that is not registered on the page.                              |
| `pluginNotRegistered` | An option belongs to a plugin that is not registered on the page, for example with `handsontable/base` and no `registerPlugin()` call. |
| `pluginDisabled`      | A warning: an option has no effect because its plugin is off, such as `filterValueComparator` without `filters`. |
| `unknownDataProperty` | A warning: a `columns[].data` property that none of the first 50 data rows has, or an index past the rows. |

A later minor release can add a code, so give a `switch` over the codes a `default` branch.

A hook set to `undefined`, `null`, or `false` is not a problem: Handsontable skips it.

The registry checks look at what is registered on the page when you call `validateSettings()`, so call it after
`registerAllModules()` or your own `register*()` calls.

## Validate an update

An `updateSettings()` payload often leaves out `data` and the plugin switches. Pass the instance as `hot`, and the
check reads them from the grid. In React, Angular, and Vue, take the instance from the `HotTable` component's
`hotInstance`:

```js
const payload = { columns: [{ data: 'name' }, { data: 'agee' }] };
const { problems } = validateSettings(payload, { hot });

// [{ path: 'columns[1].data', code: 'unknownDataProperty', severity: 'warning',
//    message: "No row of 'data' has the property 'agee'. Did you mean 'age'?" }]
```

To check one column or one cell instead of the whole grid, pass `level`. It takes the level names of the schema's
`x-handsontable.levels`:

```js
validateSettings({ type: 'numeric', readOnly: true }, { level: 'columns' });
validateSettings({ readOnly: true }, { level: 'cells' });
validateSettings({ row: 0, col: 0, readOnly: true }, { level: 'cell' });
```

## Correct generated settings

A configuration that a language model writes needs a deterministic check before you apply it. Send the problems
back to the model and ask for a corrected configuration:

```js
async function createGridSettings(prompt) {
  let settings = await generateSettings(prompt);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { valid, problems } = validateSettings(settings);

    if (valid) {
      return settings;
    }

    const report = problems.map(({ path, message }) => `${path}: ${message}`).join('\n');

    settings = await generateSettings(`${prompt}\n\nFix these problems:\n${report}`);
  }

  throw new Error('The model did not produce valid settings.');
}
```

## Use the JSON Schema

`settingsSchema` is a frozen, JSON-serializable object. Its `properties` list every grid option and hook,
`$defs.columnSettings` describes an entry of `columns`, and `$defs.cellSettings` describes an entry of `cell`.

No schema file ships with the package. To get editor autocomplete for JSON configs, write the schema to a file in
your build, and point the `$schema` key of your config files at it:

```js
import { writeFileSync } from 'node:fs';
import { registerAllModules } from 'handsontable/registry';
import { settingsSchema } from 'handsontable/settingsSchema';

registerAllModules();
writeFileSync('handsontable-settings.schema.json', JSON.stringify(settingsSchema, null, 2));
```

```js
import { settingsSchema } from 'handsontable/settingsSchema';

settingsSchema.properties.stretchH;
// { description: '...', enum: ['none', 'all', 'last'], 'x-handsontable': { levels: ['grid'] } }
```

Each option carries Handsontable-specific details under the `x-handsontable` keyword:

| Key            | Description                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------- |
| `levels`       | The levels the option is read at: `grid`, `columns`, `cells`, and `cell`.                   |
| `plugin`       | The plugin the option belongs to, such as `Filters`.                                        |
| `since`        | The version that added the option.                                                          |
| `registry`     | For `type`, `editor`, `renderer`, and `validator`: the registry the names come from.        |
| `runtimeTypes` | Values JSON cannot hold but the option accepts, such as `function` or `RegExp`.             |
| `hook`         | `true` for a hook callback.                                                                 |

A value that JSON cannot hold, such as a function, is listed in `runtimeTypes` and not in `type`. A JSON Schema
validator therefore rejects a function in a JSON document, which cannot carry one anyway. A hook accepts `null` and
`false` in JSON, the values Handsontable skips. A validator that rejects
unknown keywords, such as Ajv in strict mode, needs the keyword registered:

```js
import Ajv from 'ajv/dist/2020';
import { settingsSchema } from 'handsontable/settingsSchema';

// Several options take more than one JSON type (`width` is a number or a string).
const ajv = new Ajv({ allowUnionTypes: true });

ajv.addKeyword('x-handsontable');

const validate = ajv.compile(settingsSchema);
```

The JSON Schema checks types and allowed values. It accepts unknown option names, because the cell meta takes
custom keys. It rejects an unknown key inside the settings object of a plugin option that lists every key, such as
`filters`, by setting `additionalProperties` to `false`. Use `validateSettings()` for the checks that depend on the
page: unknown option names, option levels, registered names, plugins, and data properties.

## Known limitations

- Custom keys that you store in the cell meta are reported as `unknownOption`. Filter them out by `code` and `path`
  if your application uses them.
- A column bound on purpose to a property no row has, such as an empty column, is reported as an
  `unknownDataProperty` warning.
- `validateSettings()` never calls a function it finds in the settings, so it does not check what a `columns` or
  `cells` function returns.
- `validateSettings()` reports a misspelled key, such as `filters: { serchMode: 'apply' }`, only inside the settings
  object of some options. Those options are `asyncValues`, `autoLink`, `dataProvider`, `dragToScroll`,
  `dropdownMenu`, `fillHandle`, `filters`, `manualColumnFreeze`, `pagination`, `rowSelection`, and `sheetsBar`.
  The `filters` object inside `columns` is checked too, and takes `availableConditions` only.
- The keys of an object nested in one of these, such as `dragToScroll.interval` and `sheetsBar.animation`, are not
  checked.
- The objects of other options, such as `contextMenu`, `columnSorting`, and `comments`, take keys that the schema does
  not list. A misspelled key inside them is not reported.
- A custom plugin can read keys from one of these objects that the schema does not list. `validateSettings()` reports
  those keys as `unknownOption`. A class instance, such as a `dataProvider` object with fields of its own, is not
  checked.
- A value that is an instance of a class, such as a `ThemeBuilder` for `theme`, is accepted without a check of its
  contents.
- Only the first 50 rows of `data` are checked, for their type and for the `columns[].data` properties.
- `settingsSchema` lists the hooks registered when the module loads. A hook that a plugin registers later, such as
  `afterContextMenuExecute`, is missing from the object if you import `handsontable/settingsSchema` before the
  plugin. `validateSettings()` accepts it either way.
- The module is not part of the UMD bundle. Import it from `handsontable/settingsSchema` in the npm package.

## Related API reference

- Configuration options:
  - [`columns`](@/api/options.md#columns)
  - [`cell`](@/api/options.md#cell)
  - [`type`](@/api/options.md#type)
- Core methods:
  - [`updateSettings()`](@/api/core.md#updatesettings)
