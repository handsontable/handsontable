---
id: g7i1xok4
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
  id: 05z3cjez
  metaTitle: Formula calculation - React Data Grid | Handsontable
searchCategory: Guides
category: Formulas
---

# Formula calculation

Perform calculations on cells' values, using a powerful calculation engine that handles nearly 400
functions, custom functions, named expressions, and more.

[[toc]]

## Overview

The _Formulas_ plugin provides you an extensive calculation capabilities based on formulas using the
spreadsheet notation. Under the hood, it uses an engine called
[HyperFormula](https://hyperformula.handsontable.com/) created by the Handsontable team as an
independent library to help developers build complex data management apps.

This plugin comes with a library of 386 functions grouped into categories, such as Math and
trigonometry, Engineering, Statistical, Financial, and Logical. Using these, you can create complex
data entry rules in business apps and much more. Below are some ideas on what you can do with it:

- Fully-featured spreadsheet apps
- Smart documents
- Educational apps
- Business logic builders
- Forms and form builders
- Online calculators
- Low connectivity apps

## Basic multi-sheet example

You can use formulas in a single-sheet mode or with multiple Handsontable instances with
cross-sheet references.

Double click on a cell to open the editor and preview the formula.

::: only-for javascript

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/formulas/formula-calculation/javascript/example1.html)
@[code](@/content/guides/formulas/formula-calculation/javascript/example1.css)
@[code](@/content/guides/formulas/formula-calculation/javascript/example1.js)
@[code](@/content/guides/formulas/formula-calculation/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/formulas/formula-calculation/react/example1.css)
@[code](@/content/guides/formulas/formula-calculation/react/example1.jsx)
@[code](@/content/guides/formulas/formula-calculation/react/example1.tsx)

:::

:::

## Data grid example

This example is more typical of data grids than spreadsheets. Calculations are present in two places
– in column “Total due (fx)”, and in the summary row at the bottom.

::: only-for javascript

::: example #example-data-grid --js 1 --ts 2

@[code](@/content/guides/formulas/formula-calculation/javascript/example-data-grid.js)
@[code](@/content/guides/formulas/formula-calculation/javascript/example-data-grid.ts)

:::

:::

::: only-for react

::: example #example-data-grid :react --js 1 --ts 2

@[code](@/content/guides/formulas/formula-calculation/react/example-data-grid.jsx)
@[code](@/content/guides/formulas/formula-calculation/react/example-data-grid.tsx)

:::

:::

## Initialization methods

There are multiple ways of initializing the Formulas plugin. You can select the most convenient one
depending on your use case.

In all cases, it is required to either pass in the `HyperFormula` object or a HyperFormula instance:

```js
import { HyperFormula } from 'hyperformula';
```

There are also other installation methods available. Check out
[HyperFormula's installation documentation](https://handsontable.github.io/hyperformula/guide/client-side-installation.html).

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

## Available options and methods

For the list of available settings and methods, visit the [API reference](@/api/formulas.md).

## Available functions

This plugin inherits the calculation powers from _HyperFormula_. The complete functions reference
can be found in the
[HyperFormula documentation](https://handsontable.github.io/hyperformula/guide/built-in-functions.html).

## [`afterFormulasValuesUpdate`](@/api/hooks.md#afterformulasvaluesupdate) hook

This hook listens for any changes to cells in the calculation engine, including dependent cells
containing formulas.

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

## Named expressions

You can use custom-named expressions in your formula expressions. A named expression can be either
plain values or formulas with references to absolute cell addresses. To register a named expression,
pass an array with `name` and `expression` to your `formulas` configuration object:

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

For more information about named expressions, refer to the
[HyperFormula docs](https://hyperformula.handsontable.com/guide/cell-references.html#relative-references).

## View the explainer video

<iframe width="100%" height="425px" src="https://www.youtube.com/embed/JJXUmACTDdk"></iframe>

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

### HyperFormula documentation

<div class="boxes-list gray">

- [HyperFormula guides](https://handsontable.github.io/hyperformula/)
- [HyperFormula API reference](https://handsontable.github.io/hyperformula/api/)

</div>

### Related blog articles

<div class="boxes-list gray">

- [Handsontable 9.0.0: New formula plugin](https://handsontable.com/blog/handsontable-9.0.0-new-formula-plugin)
- [8 examples of useful Excel functions in HyperFormula](https://handsontable.com/blog/8-examples-of-useful-excel-functions-in-hyperformula)

</div>

### Related API reference

- Configuration options:
  - [`formulas`](@/api/options.md#formulas)
- Hooks:
  - [`afterFormulasValuesUpdate`](@/api/hooks.md#afterformulasvaluesupdate)
  - [`afterNamedExpressionAdded`](@/api/hooks.md#afternamedexpressionadded)
  - [`afterNamedExpressionRemoved`](@/api/hooks.md#afternamedexpressionremoved)
  - [`afterSheetAdded`](@/api/hooks.md#aftersheetadded)
  - [`afterSheetRemoved`](@/api/hooks.md#aftersheetremoved)
  - [`afterSheetRenamed`](@/api/hooks.md#aftersheetrenamed)
- Plugins:
  - [`Formulas`](@/api/formulas.md)
