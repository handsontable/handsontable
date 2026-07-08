---
type: how-to
title: Formula calculation
metaTitle: Formula calculation - JavaScript Data Grid | Handsontable
description: Perform calculations on cells' values, using a powerful calculation engine that handles nearly 400 functions, custom functions, named expressions, and more.
permalink: /formula-calculation
canonicalUrl: /formula-calculation
tags:
  - formulas
  - formula
  - excel
  - spreadsheet
  - worksheet
  - workbook
  - sheet
  - function
  - hyperformula
react:
  metaTitle: Formula calculation - React Data Grid | Handsontable
angular:
  metaTitle: Formula calculation - Angular Data Grid | Handsontable
vue:
  metaTitle: Formula calculation - Vue Data Grid | Handsontable
searchCategory: Guides
category: Formulas
---
The `Formulas` plugin adds spreadsheet-style calculation to Handsontable, powered by [HyperFormula](https://hyperformula.handsontable.com/). It supports ~400 built-in functions, cross-sheet references, named expressions, and custom function implementations.

[[toc]]

## Basic multi-sheet example

You can use formulas in a single-sheet mode or with multiple Handsontable instances with
cross-sheet references.

Double click on a cell to open the editor and preview the formula.

::: only-for javascript

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/formulas/formula-calculation/javascript/example1.html)
@[code](@/content/guides/formulas/formula-calculation/javascript/example1.css)
@[code collapse={8-22}](@/content/guides/formulas/formula-calculation/javascript/example1.js)
@[code collapse={8-22}](@/content/guides/formulas/formula-calculation/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/formulas/formula-calculation/react/example1.css)
@[code collapse={9-23}](@/content/guides/formulas/formula-calculation/react/example1.jsx)
@[code collapse={9-23}](@/content/guides/formulas/formula-calculation/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code collapse={37-64}](@/content/guides/formulas/formula-calculation/angular/example1.ts)
@[code](@/content/guides/formulas/formula-calculation/angular/example1.html)

:::

:::

::: only-for vue

::: tip

When using HyperFormula with Vue 3, always wrap HyperFormula instances with `markRaw()`. Vue's reactivity proxy interferes with the engine's internal state, which leads to subtle bugs and degraded performance. The examples on this page use `markRaw()` for this reason.

:::

::: example #example1 :vue3 --css 1

@[code](@/content/guides/formulas/formula-calculation/vue/example1.css)
@[code](@/content/guides/formulas/formula-calculation/vue/example1.vue)

:::

:::

## Data grid example

This example is more typical of data grids than spreadsheets. Calculations are present in two places
– in column “Total due (fx)”, and in the summary row at the bottom.

::: only-for javascript

::: example #example-data-grid --js 1 --ts 2

@[code collapse={8-111}](@/content/guides/formulas/formula-calculation/javascript/example-data-grid.js)
@[code collapse={8-111}](@/content/guides/formulas/formula-calculation/javascript/example-data-grid.ts)

:::

:::

::: only-for react

::: example #example-data-grid :react --js 1 --ts 2

@[code collapse={9-112}](@/content/guides/formulas/formula-calculation/react/example-data-grid.jsx)
@[code collapse={9-112}](@/content/guides/formulas/formula-calculation/react/example-data-grid.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code collapse={17-126}](@/content/guides/formulas/formula-calculation/angular/example2.ts)
@[code](@/content/guides/formulas/formula-calculation/angular/example2.html)

:::

:::

::: only-for vue

::: example #example-data-grid :vue3

@[code collapse={9-112}](@/content/guides/formulas/formula-calculation/vue/example-data-grid.vue)

:::

:::

## Initialization methods

The `formulas` option accepts either the `HyperFormula` class or an already-created HyperFormula
instance. Choose the pattern that matches your use case.

All patterns require importing HyperFormula:

```js
import { HyperFormula } from 'hyperformula';
```

See [HyperFormula's installation docs](https://handsontable.github.io/hyperformula/guide/client-side-installation.html)
for alternative installation methods (CDN, UMD, etc.).

::: tip HyperFormula instance

To use the [`Formulas`](@/api/formulas.md) plugin with an external HyperFormula instance, initialize
HyperFormula with the `'internal-use-in-handsontable'` license key:

:::

```js
// create an external HyperFormula instance
const hyperformulaInstance = HyperFormula.buildEmpty({
  // initialize it with the `'internal-use-in-handsontable'` license key
  licenseKey: 'internal-use-in-handsontable',
});
```

### Pass the HyperFormula class/instance to Handsontable

::: only-for javascript

```js
{
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  }
}
```

:::

::: only-for react

```jsx
<HotTable
  formulas={{
    engine: HyperFormula,
    // [plugin configuration]
  }}
/>
```

:::

::: only-for angular

```ts
{
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  }
}
```

:::

::: only-for vue

```js
const hotSettings = ref({
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  },
});
```

:::

or

::: only-for javascript

```js
{
  formulas: {
    engine: {
      hyperformula: HyperFormula, // or `engine: hyperformulaInstance`
      leapYear1900: false,
      // ...and more engine configuration options.
      // See https://handsontable.github.io/hyperformula/api/interfaces/configparams.html#number
    },
    // [plugin configuration]
  }
}
```

:::

::: only-for react

```jsx
<HotTable
  formulas={{
    engine: {
      hyperformula: HyperFormula, // or `engine: hyperformulaInstance`
      leapYear1900: false,
      // ...and more engine configuration options.
      // See https://handsontable.github.io/hyperformula/api/interfaces/configparams.html#number
    },
    // [plugin configuration]
  }}
/>
```

:::

::: only-for angular

```ts
{
  formulas: {
    engine: {
      hyperformula: HyperFormula, // or `engine: hyperformulaInstance`
      leapYear1900: false,
      // ...and more engine configuration options.
      // See https://handsontable.github.io/hyperformula/api/interfaces/configparams.html#number
    },
    // [plugin configuration]
  }
}
```

:::

::: only-for vue

```js
const hotSettings = ref({
  formulas: {
    engine: {
      hyperformula: HyperFormula, // or `engine: hyperformulaInstance`
      leapYear1900: false,
      // ...and more engine configuration options.
      // See https://handsontable.github.io/hyperformula/api/interfaces/configparams.html#number
    },
    // [plugin configuration]
  },
});
```

:::

### Single Handsontable instance with an external HyperFormula instance

::: only-for javascript

```js
const hyperformulaInstance = HyperFormula.buildEmpty({
  // to use an external HyperFormula instance,
  // initialize it with the `'internal-use-in-handsontable'` license key
  licenseKey: 'internal-use-in-handsontable',
});

{
  formulas: {
    engine: hyperformulaInstance;
  }
}
```

:::

::: only-for react

```jsx
const ExampleComponent = () => {
  const hyperformulaInstance = HyperFormula.buildEmpty({
    // to use an external HyperFormula instance,
    // initialize it with the `'internal-use-in-handsontable'` license key
    licenseKey: 'internal-use-in-handsontable',
  });

  return (
    <HotTable
      formulas={{
        engine: hyperformulaInstance,
      }}
    />
  );
};
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';
import {HyperFormula} from 'hyperformula';

const hyperformulaInstance = HyperFormula.buildEmpty({
  // to use an external HyperFormula instance,
  // initialize it with the `'internal-use-in-handsontable'` license key
  licenseKey: 'internal-use-in-handsontable',
});

const configurationOptions: GridSettings = {
  formulas: {
    engine: hyperformulaInstance
  }
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```js
const hyperformulaInstance = markRaw(
  HyperFormula.buildEmpty({
    // to use an external HyperFormula instance,
    // initialize it with the `'internal-use-in-handsontable'` license key
    licenseKey: 'internal-use-in-handsontable',
  })
);

const hotSettings = ref({
  formulas: {
    engine: hyperformulaInstance,
  },
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

### Multiple independent Handsontable instances

::: only-for javascript

```js
// Instance 1
{
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  }
}

// Instance 2
{
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  }
}
```

:::

::: only-for react

```jsx
const ExampleComponent = () => {
  return (
    <>
      <HotTable
        formulas={{
          engine: HyperFormula,
          // [plugin configuration]
        }}
      />
      <HotTable
        formulas={{
          engine: HyperFormula,
          // [plugin configuration]
        }}
      />
    </>
  );
};
```

:::

::: only-for angular

```ts
// Instance 1
{
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  }
}

// Instance 2
{
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  }
}
```

:::

::: only-for vue

```js
// Instance 1
const hotSettings1 = ref({
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  },
});

// Instance 2
const hotSettings2 = ref({
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  },
});
```

```html
<HotTable :settings="hotSettings1" />
<HotTable :settings="hotSettings2" />
```

:::

::: only-for javascript

### Multiple Handsontable instances with a shared HyperFormula instance

```js
// Instance 1
{
  formulas: {
    engine: HyperFormula,
    sheetName: 'Sheet1'
    // [plugin configuration]
  }
}

// Instance 2
{
  formulas: {
    engine: hot1.getPlugin('formulas').engine,
    sheetName: 'Sheet2'
    // [plugin configuration]
  }
}
```

:::

### Multiple Handsontable instances with an external shared HyperFormula instance

::: only-for javascript

```js
const hyperformulaInstance = HyperFormula.buildEmpty({
  // to use an external HyperFormula instance,
  // initialize it with the `'internal-use-in-handsontable'` license key
  licenseKey: 'internal-use-in-handsontable',
});

// Instance 1
{
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet1'
    // [plugin configuration]
  }
}

// Instance 2
{
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet2'
    // [plugin configuration]
  }
}
```

:::

::: only-for react

```jsx
const ExampleComponent = () => {
  const hyperformulaInstance = HyperFormula.buildEmpty({
    // to use an external HyperFormula instance,
    // initialize it with the `'internal-use-in-handsontable'` license key
    licenseKey: 'internal-use-in-handsontable',
  });

  return (
    <>
      <HotTable
        formulas={{
          engine: hyperformulaInstance,
          sheetName: 'Sheet1',
          // [plugin configuration]
        }}
      />
      <HotTable
        formulas={{
          engine: hyperformulaInstance,
          sheetName: 'Sheet2',
          // [plugin configuration]
        }}
      />
    </>
  );
};
```

:::

::: only-for angular

```ts
const hyperformulaInstance = HyperFormula.buildEmpty({
  // to use an external HyperFormula instance,
  // initialize it with the `'internal-use-in-handsontable'` license key
  licenseKey: 'internal-use-in-handsontable',
});

// Instance 1
{
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet1'
    // [plugin configuration]
  }
}

// Instance 2
{
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet2'
    // [plugin configuration]
  }
}
```

:::

::: only-for vue

```js
const hyperformulaInstance = markRaw(
  HyperFormula.buildEmpty({
    // to use an external HyperFormula instance,
    // initialize it with the `'internal-use-in-handsontable'` license key
    licenseKey: 'internal-use-in-handsontable',
  })
);

// Instance 1
const hotSettings1 = ref({
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet1',
    // [plugin configuration]
  },
});

// Instance 2
const hotSettings2 = ref({
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet2',
    // [plugin configuration]
  },
});
```

```html
<HotTable :settings="hotSettings1" />
<HotTable :settings="hotSettings2" />
```

:::

## Available options and methods

For the full list of configuration options and plugin methods, see the
[`Formulas` API reference](@/api/formulas.md).

## Available functions

The plugin inherits all calculation capabilities from HyperFormula. The complete function reference
(386 functions across Math, Engineering, Statistical, Financial, Logical, and other categories) is
in the
[HyperFormula built-in functions docs](https://handsontable.github.io/hyperformula/guide/built-in-functions.html).

## [`afterFormulasValuesUpdate`](@/api/hooks.md#afterformulasvaluesupdate) hook

This hook fires whenever the calculation engine recomputes cell values - including cells that
changed directly and all dependent formula cells. Use it to react to recalculations outside of the
normal `afterChange` flow.

::: only-for javascript

```js
const afterFormulasValuesUpdate = (changes) => {
  changes.forEach((change) => {
    console.log('change', change.address, change.newValue);
  });
};

new Handsontable(element, {
  formulas: {
    engine: HyperFormula,
  },
  afterFormulasValuesUpdate,
});
```

:::

::: only-for react

```jsx
const ExampleComponent = () => {
  const afterFormulasValuesUpdate = (changes) => {
    changes.forEach((change) => {
      console.log('change', change.address, change.newValue);
    });
  };

  return (
    <HotTable
      formulas={{
        engine: HyperFormula,
      }}
      afterFormulasValuesUpdate={afterFormulasValuesUpdate}
    />
  );
};
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';
import {HyperFormula} from 'hyperformula';

const afterFormulasValuesUpdate = (changes) => {
  changes.forEach((change) => {
    console.log('change', change.address, change.newValue);
  });
};

const configurationOptions: GridSettings = {
  formulas: {
    engine: HyperFormula,
  },
  afterFormulasValuesUpdate,
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```js
const hotSettings = ref({
  formulas: {
    engine: HyperFormula,
  },
  afterFormulasValuesUpdate(changes) {
    changes.forEach((change) => {
      console.log('change', change.address, change.newValue);
    });
  },
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

## Named expressions

A named expression assigns a human-friendly label to a value or formula. Once defined, the name can
be used anywhere in cell formulas across the workbook - the same way a cell reference or constant
would be. This is useful for shared constants, computed ranges, or any value you want to reference
by a meaningful name instead of repeating a formula.

The `expression` field accepts:

- A **number** (e.g. `100`) or **string** (e.g. `'"My Label"'` - note the inner quotes, which are
  part of HyperFormula formula syntax for string literals).
- A **formula string** starting with `=`, using the same syntax as cell formulas.

**Plain values** can be registered directly in the `namedExpressions` config array:

```js
formulas: {
  engine: HyperFormula,
  namedExpressions: [
    { name: 'ADDITIONAL_COST', expression: 100 },
  ],
}
```

**Range-formula expressions** (those that reference cells with `Sheet1!...`) must be registered on
a pre-built HyperFormula instance after the sheet has been created. Registering them via the config
array causes a `#REF!` error because the sheet does not exist yet at that point in the
initialization sequence:

```js
const hfInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

hfInstance.addSheet('Sheet1');
hfInstance.addNamedExpression('Q1_TOTAL', '=SUM(Sheet1!$B$1:$B$3)');
hfInstance.addNamedExpression('COMBINED', '=SUM(Sheet1!$A$1:$A$3)+SUM(Sheet1!$B$1:$B$3)');

new Handsontable(container, {
  formulas: { engine: hfInstance, sheetName: 'Sheet1' },
  // ...
});
```

::: tip

References inside named expressions must use **absolute notation** (`$A$1`). The sheet name (e.g.
`Sheet1!`) must match the `sheetName` passed to both `addSheet` and the Handsontable `formulas`
config. See the
[HyperFormula named expressions guide](https://hyperformula.handsontable.com/guide/named-expressions.html)
for the full naming rules and supported expression types.

:::

### Demo: plain-value named expression

The example below registers `ADDITIONAL_COST` as a plain number. Cell formulas in column D add that
constant to each base price. The input below the grid lets you replace the expression at runtime
using `changeNamedExpression()`.

::: only-for javascript

::: example #example-named-expressions1 --html 1 --js 2 --ts 3

@[code](@/content/guides/formulas/formula-calculation/javascript/example-named-expressions1.html)
@[code](@/content/guides/formulas/formula-calculation/javascript/example-named-expressions1.js)
@[code](@/content/guides/formulas/formula-calculation/javascript/example-named-expressions1.ts)

:::

:::

[//]: # 'TODO: [react-docs] Requires rewriting the input submission logic'

::: only-for react

::: example #example-named-expressions1 :react --js 1 --ts 2

@[code](@/content/guides/formulas/formula-calculation/react/example-named-expressions1.jsx)
@[code](@/content/guides/formulas/formula-calculation/react/example-named-expressions1.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/formulas/formula-calculation/angular/example3.ts)
@[code](@/content/guides/formulas/formula-calculation/angular/example3.html)

:::

:::

::: only-for vue

::: example #example-named-expressions1 :vue3

@[code](@/content/guides/formulas/formula-calculation/vue/example-named-expressions1.vue)

:::

:::

### Demo: formula-based named expressions

The example below registers `Q1_TOTAL` and `Q2_TOTAL` as range-sum formulas on a pre-built
HyperFormula instance. The "Totals" row references those names directly as `=Q1_TOTAL` and
`=Q2_TOTAL`.

::: only-for javascript

::: example #example-named-expressions2 --html 1 --js 2 --ts 3

@[code](@/content/guides/formulas/formula-calculation/javascript/example-named-expressions2.html)
@[code](@/content/guides/formulas/formula-calculation/javascript/example-named-expressions2.js)
@[code](@/content/guides/formulas/formula-calculation/javascript/example-named-expressions2.ts)

:::

:::

::: only-for react

::: example #example-named-expressions2 :react --js 1 --ts 2

@[code](@/content/guides/formulas/formula-calculation/react/example-named-expressions2.jsx)
@[code](@/content/guides/formulas/formula-calculation/react/example-named-expressions2.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/formulas/formula-calculation/angular/example4.ts)
@[code](@/content/guides/formulas/formula-calculation/angular/example4.html)

:::

:::

::: only-for vue

::: example #example-named-expressions2 :vue3

@[code](@/content/guides/formulas/formula-calculation/vue/example-named-expressions2.vue)

:::

:::

For more information about named expressions, refer to the
[HyperFormula named expressions docs](https://hyperformula.handsontable.com/guide/named-expressions.html).

## View the explainer video

<div class="docs-video-embed">
  <iframe src="https://www.youtube.com/embed/JJXUmACTDdk"></iframe>
</div>

## Known limitations

- Using the [`IndexMapper`](@/api/indexMapper.md) API to programmatically [move rows](@/guides/rows/row-moving/row-moving.md) or [columns](@/guides/columns/column-moving/column-moving.md) that contain formulas is not supported. Instead, use the [`ManualRowMove`](@/api/manualRowMove.md) or [`ManualColumnMove`](@/api/manualColumnMove.md) APIs.
- Formulas don't support [`getSourceData()`](@/api/core.md#getsourcedata), as this method operates on source data (using [physical indexes](@/api/indexMapper.md)), whereas formulas operate on visual data (using visual indexes).
- Formulas don't support nested data, i.e., when Handsontable's [`data`](@/api/options.md#data) is set to an [array of nested objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects).

### HyperFormula version support

Different versions of Handsontable support different versions of HyperFormula.

To find out which HyperFormula version to use, see the table below:

| Handsontable version                                                                    | HyperFormula version                                                        |
|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| [`8.x.x`](https://github.com/handsontable/handsontable/releases/tag/8.0.0) and lower    | No HyperFormula support
| [`9.x.x`](https://github.com/handsontable/handsontable/releases/tag/9.0.0)              | [`0.6.2`](https://github.com/handsontable/hyperformula/releases/tag/0.6.2)  |
| [`10.x.x`](https://github.com/handsontable/handsontable/releases/tag/10.0.0)            | [`^1.2.0`](https://github.com/handsontable/hyperformula/releases/tag/1.2.0) |
| [`11.x.x`](https://github.com/handsontable/handsontable/releases/tag/11.0.0)            | [`^1.2.0`](https://github.com/handsontable/hyperformula/releases/tag/1.2.0) |
| [`12.x.x`](https://github.com/handsontable/handsontable/releases/tag/12.0.0)            | [`^2.0.0`](https://github.com/handsontable/hyperformula/releases/tag/2.0.0) |
| [`13.x.x`](https://github.com/handsontable/handsontable/releases/tag/13.0.0)            | [`^2.4.0`](https://github.com/handsontable/hyperformula/releases/tag/2.4.0) |
| [`14.x.x`](https://github.com/handsontable/handsontable/releases/tag/14.0.0)            | [`^2.4.0`](https://github.com/handsontable/hyperformula/releases/tag/2.4.0) |
| [`14.3.x - 15.0.x`](https://github.com/handsontable/handsontable/releases/tag/14.3.0)   | [`^2.6.2`](https://github.com/handsontable/hyperformula/releases/tag/2.6.2) |
| [`15.1.x`](https://github.com/handsontable/handsontable/releases/tag/15.1.0) and higher | [`^3.0.0`](https://github.com/handsontable/hyperformula/releases/tag/3.0.0) |

::: tip

You can use the `'internal-use-in-handsontable'` license key only in those HyperFormula instances
that are connected to a Handsontable instance.

To use HyperFormula outside of a Handsontable instance (e.g., on a server), you need a dedicated
[HyperFormula license key](https://hyperformula.handsontable.com/guide/license-key.html). For
details, [contact our Sales Team](https://handsontable.com/get-a-quote).

:::

## Related articles

**HyperFormula documentation**

<div class="boxes-list">

- [HyperFormula guides](https://handsontable.github.io/hyperformula/)
- [HyperFormula API reference](https://handsontable.github.io/hyperformula/api/)

</div>

**Related blog articles**

<div class="boxes-list">

- [HyperFormula 3.2.0: Expanding Excel parity and removing scalability limits](https://handsontable.com/blog/hyperformula-3.2.0-expanding-excel-parity-and-removing-scalability-limits)
- [HyperFormula 3.1.1: Improved lazy computations and easier sheet dependency handling](https://handsontable.com/blog/hyperformula-3.1.1-improved-lazy-computations-and-easier-sheet-dependency-handling)
- [HyperFormula 3.1.0: Improved cross-sheet operations, easier APIs, and clearer docs](https://handsontable.com/blog/hyperformula-3.1.0-improved-cross-sheet-operations-easier-apis-and-clearer-docs)
- [HyperFormula 3.0.1: Community fixes, improved docs, and roadmap insights](https://handsontable.com/blog/hyperformula-3.0.1-community-fixes-improved-docs-and-roadmap-insights)
- [HyperFormula 3.0: Introducing the XLOOKUP function](https://handsontable.com/blog/hyperformula-3-0-introducing-the-xlookup-function)
- [Handsontable 9.0.0: New formula plugin](https://handsontable.com/blog/handsontable-9.0.0-new-formula-plugin)
- [8 examples of useful Excel functions in HyperFormula](https://handsontable.com/blog/8-examples-of-useful-excel-functions-in-hyperformula)

</div>

**Configuration options**

<div class="boxes-list">

- [formulas](@/api/options.md#formulas)

</div>

**Hooks**

<div class="boxes-list">

- [afterFormulasValuesUpdate](@/api/hooks.md#afterformulasvaluesupdate)
- [afterNamedExpressionAdded](@/api/hooks.md#afternamedexpressionadded)
- [afterNamedExpressionRemoved](@/api/hooks.md#afternamedexpressionremoved)
- [afterSheetAdded](@/api/hooks.md#aftersheetadded)
- [afterSheetRemoved](@/api/hooks.md#aftersheetremoved)
- [afterSheetRenamed](@/api/hooks.md#aftersheetrenamed)

</div>

**Plugins**

<div class="boxes-list">

- [Formulas](@/api/formulas.md)

</div>

## Result

After setting up the `Formulas` plugin with a HyperFormula engine, cells that contain a formula (starting with `=`) are evaluated automatically. Editing a cell updates all dependent formula cells in real time, and cross-sheet references stay in sync across linked Handsontable instances.
