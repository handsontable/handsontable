---
title: Formula calculation
metaTitle: Formula calculation - Guide - Handsontable Documentation
permalink: /next/formula-calculation
canonicalUrl: /formula-calculation
tags:
  - formula
  - excel
  - spreadsheet
  - gpu
  - worksheet
  - workbook
  - sheet
  - function
---

# Formula calculation

[[toc]]

::: tip
To use HyperFormula within Handsontable's default [Formulas](@/api/Formulas.md) plugin, you only need your existing [Handsontable license key](@/guides/getting-started/license-key.md).<br><br>
To use HyperFormula independently from Handsontable, you need a license key dedicated to HyperFormula. For details, [contact our Sales Team](https://handsontable.com/get-a-quote).
:::

## Overview

The _Formulas_ plugin provides you an extensive calculation capabilities based on formulas using the spreadsheet notation. Under the hood, it uses an engine called [HyperFormula](https://handsontable.github.io/hyperformula/) created by the Handsontable team as an independent library to help developers build complex data management apps.

This plugin comes with a library of 386 functions grouped into categories, such as Math and trigonometry, Engineering, Statistical, Financial, and Logical. Using these, you can create complex data entry rules in business apps and much more. Below are some ideas on what you can do with it:

*   Fully-featured spreadsheet apps
*   Smart documents
*   Educational apps
*   Business logic builders
*   Forms and form builders
*   Online calculators
*   Low connectivity apps

## Features

*   High-speed formula calculations
*   Function syntax compatible with Excel and Google Sheets
*   A library of built-in functions available in 16 languages
*   Support for wildcard characters
*   Support for CRUD operations
*   Support for cross-sheet references
*   Support for multiple Handsontable instances
*   Uses GPU acceleration for better performance

**Known limitations:**

*   Doesn't work with nested rows
*   Doesn't work with undo/redo

## Available options and methods

For the list of available settings and methods, visit the [API reference](@/api/formulas.md).

## Available functions

This plugin inherits the calculation powers from _HyperFormula_. The complete functions reference can be found in the [HyperFormula documentation](https://handsontable.github.io/hyperformula/guide/built-in-functions.html).

## Basic multi-sheet example

It is possible to use the plugin in single sheet mode or with multiple Handsontable instances with cross-sheet references.

Double click on a cell to open the editor and preview the formula.

::: example #example1 --html 1 --css 2 --js 3
```html
<h3 class="demo-preview">Sheet 1</h3>
<div id="example-basic-multi-sheet-1"></div>
<h3 class="demo-preview">Sheet 2</h3>
<div id="example-basic-multi-sheet-2"></div>
```
```css
h3.demo-preview {
  margin-bottom: 0.3rem !important;
  padding-top: 0 !important;
  margin-top: 0.5rem !important;
}
```
```js
const data1 = [
  ['10.26', null, 'Sum', '=SUM(A:A)'],
  ['20.12', null, 'Average', '=AVERAGE(A:A)'],
  ['30.01', null, 'Median', '=MEDIAN(A:A)'],
  ['40.29', null, 'MAX', '=MAX(A:A)'],
  ['50.18', null, 'MIN', '=MIN(A1:A5)'],
];

const data2 = [
  ['Is A1 in Sheet1 > 10?', '=IF(Sheet1!A1>10,"TRUE","FALSE")'],
  ['Is A:A in Sheet > 150?', '=IF(SUM(Sheet1!A:A)>150,"TRUE","FALSE")'],
  ['How many blank cells are in the Sheet1?', '=COUNTBLANK(Sheet1!A1:D5)'],
  ['Generate a random number', '=RAND()'],
  ['Number of sheets in this workbook', '=SHEETS()'],
];

const hyperformulaInstance = HyperFormula.buildEmpty();

const container1 = document.getElementById('example-basic-multi-sheet-1');
new Handsontable(container1, {
  data: data1,
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet1'
  },
  licenseKey: 'non-commercial-and-evaluation'
});

const container2 = document.getElementById('example-basic-multi-sheet-2');
new Handsontable(container2, {
  data: data2,
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet2'
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Data grid example

This example is more typical of data grids than spreadsheets. Calculations are present in two places – in a column “Total due (fx)”, and in the summary row at the bottom.

::: example #example-data-grid
```js
const data = [
  ['150', '643', '0.32', '11', '=A1*(B1*C1)+D1'],
  ['172', '474', '0.51', '11', '=A2*(B2*C2)+D2'],
  ['188', '371', '0.59', '11', '=A3*(B3*C3)+D3'],
  ['162', '731', '0.21', '10', '=A4*(B4*C4)+D4'],
  ['133', '682', '0.81', '9', '=A5*(B5*C5)+D5'],
  ['87', '553', '0.66', '10', '=A6*(B6*C6)+D6'],
  ['26', '592', '0.62', '11', '=A7*(B7*C7)+D7'],
  ['110', '461', '0.73', '9', '=A8*(B8*C8)+D8'],
  ['50', '346', '0.52', '15', '=A9*(B9*C9)+D9'],
  ['160', '423', '0.82', '11', '=A10*(B10*C10)+D10'],
  ['30', '216', '0.26', '9', '=A11*(B11*C11)+D11'],
  ['39', '473', '0.44', '5', '=A12*(B12*C12)+D12'],
  ['96', '490', '0.43', '5', '=A13*(B13*C13)+D13'],
  ['108', '176', '0.71', '7', '=A14*(B14*C14)+D14'],
  ['46', '586', '0.01', '14', '=A15*(B15*C15)+D15'],
  ['97', '514', '0.7', '14', '=A16*(B16*C16)+D16'],
  ['161', '717', '0.01', '13', '=A17*(B17*C17)+D17'],
  ['58', '123', '0.4', '8', '=A18*(B18*C18)+D18'],
  ['92', '739', '0.76', '14', '=A19*(B19*C19)+D19'],
  ['5', '320', '0.52', '13', '=A20*(B20*C20)+D20'],
  ['158', '480', '0.65', '5', '=A21*(B21*C21)+D21'],
  ['121', '373', '0.66', '8', '=A22*(B22*C22)+D22'],
  ['61', '704', '0.95', '7', '=A23*(B23*C23)+D23'],
  ['155', '452', '0.71', '10', '=A24*(B24*C24)+D24'],
  ['162', '693', '0.73', '11', '=A25*(B25*C25)+D25'],
  ['46', '75', '0.14', '15', '=A26*(B26*C26)+D26'],
  ['47', '691', '0.58', '15', '=A27*(B27*C27)+D27'],
  ['104', '346', '0.04', '7', '=A28*(B28*C28)+D28'],
  ['101', '717', '0.87', '5', '=A29*(B29*C29)+D29'],
  ['150', '487', '0.26', '15', '=A30*(B30*C30)+D30'],
  ['42', '465', '0.09', '14', '=A31*(B31*C31)+D31'],
  ['144', '337', '0.72', '7', '=A32*(B32*C32)+D32'],
  ['195', '138', '0.3', '6', '=A33*(B33*C33)+D33'],
  ['199', '717', '0.16', '6', '=A34*(B34*C34)+D34'],
  ['110', '236', '0.91', '9', '=A35*(B35*C35)+D35'],
  ['51', '351', '0.81', '13', '=A36*(B36*C36)+D36'],
  ['69', '221', '0.64', '9', '=A37*(B37*C37)+D37'],
  ['53', '125', '0.28', '12', '=A38*(B38*C38)+D38'],
  ['168', '428', '0.68', '9', '=A39*(B39*C39)+D39'],
  ['58', '361', '0.36', '5', '=A40*(B40*C40)+D40'],
  ['152', '213', '0.13', '13', '=A41*(B41*C41)+D41'],
  ['66', '431', '0.93', '10', '=A42*(B42*C42)+D42'],
  ['112', '108', '0.5', '14', '=A43*(B43*C43)+D43'],
  ['50', '127', '0.7', '7', '=A44*(B44*C44)+D44'],
  ['31', '200', '0.15', '14', '=A45*(B45*C45)+D45'],
  ['132', '654', '0.81', '8', '=A46*(B46*C46)+D46'],
  ['45', '438', '0.79', '6', '=A47*(B47*C47)+D47'],
  ['197', '615', '0.63', '7', '=A48*(B48*C48)+D48'],
  ['190', '592', '0.37', '8', '=A49*(B49*C49)+D49'],
  ['184', '419', '0.78', '8', '=A50*(B50*C50)+D50'],
  ['169', '58', '0.13', '7', '=A51*(B51*C51)+D51'],
  ['152', '324', '0.58', '5', '=A52*(B52*C52)+D52'],
  ['182', '713', '0.53', '5', '=A53*(B53*C53)+D53'],
  ['141', '576', '0.63', '12', '=A54*(B54*C54)+D54'],
  ['169', '429', '0.14', '13', '=A55*(B55*C55)+D55'],
  ['39', '694', '0.98', '13', '=A56*(B56*C56)+D56'],
  ['71', '361', '0.3', '13', '=A57*(B57*C57)+D57'],
  ['148', '540', '0.89', '6', '=A58*(B58*C58)+D58'],
  ['116', '52', '0.3', '7', '=A59*(B59*C59)+D59'],
  ['96', '395', '0.28', '7', '=A60*(B60*C60)+D60'],
  ['35', '222', '0.86', '13', '=A61*(B61*C61)+D61'],
  ['16', '430', '0.8', '8', '=A62*(B62*C62)+D62'],
  ['194', '357', '0.72', '9', '=A63*(B63*C63)+D63'],
  ['24', '498', '0.7', '7', '=A64*(B64*C64)+D64'],
  ['170', '142', '0.52', '5', '=A65*(B65*C65)+D65'],
  ['184', '614', '0.68', '9', '=A66*(B66*C66)+D66'],
  ['153', '524', '0.15', '9', '=A67*(B67*C67)+D67'],
  ['88', '620', '0.39', '15', '=A68*(B68*C68)+D68'],
  ['57', '452', '0.11', '6', '=A69*(B69*C69)+D69'],
  ['62', '493', '0.03', '11', '=A70*(B70*C70)+D70'],
  ['123', '431', '0.75', '15', '=A71*(B71*C71)+D71'],
  ['77', '113', '0.63', '12', '=A72*(B72*C72)+D72'],
  ['199', '208', '0.07', '6', '=A73*(B73*C73)+D73'],
  ['149', '514', '0.42', '12', '=A74*(B74*C74)+D74'],
  ['191', '334', '0.78', '13', '=A75*(B75*C75)+D75'],
  ['150', '643', '0.32', '11', '=A76*(B76*C76)+D76'],
  ['130', '721', '0.62', '5', '=A77*(B77*C77)+D77'],
  ['179', '517', '0.1', '8', '=A78*(B78*C78)+D78'],
  ['98', '31', '0.01', '10', '=A79*(B79*C79)+D79'],
  ['175', '509', '0.7', '11', '=A80*(B80*C80)+D80'],
  ['11', '569', '0.37', '7', '=A81*(B81*C81)+D81'],
  ['184', '630', '0.19', '6', '=A82*(B82*C82)+D82'],
  ['27', '165', '0.51', '13', '=A83*(B83*C83)+D83'],
  ['186', '417', '0.85', '15', '=A84*(B84*C84)+D84'],
  ['20', '741', '0.76', '11', '=A85*(B85*C85)+D85'],
  ['153', '640', '0.28', '6', '=A86*(B86*C86)+D86'],
  ['161', '542', '0.43', '14', '=A87*(B87*C87)+D87'],
  ['98', '344', '0.77', '6', '=A88*(B88*C88)+D88'],
  ['30', '400', '0.71', '13', '=A89*(B89*C89)+D89'],
  ['73', '91', '0.78', '8', '=A90*(B90*C90)+D90'],
  ['158', '72', '0.66', '12', '=A91*(B91*C91)+D91'],
  ['122', '35', '0.32', '15', '=A92*(B92*C92)+D92'],
  ['33', '99', '0.92', '9', '=A93*(B93*C93)+D93'],
  ['107', '538', '0.75', '10', '=A94*(B94*C94)+D94'],
  ['15', '563', '0.32', '6', '=A95*(B95*C95)+D95'],
  ['168', '572', '0.71', '6', '=A96*(B96*C96)+D96'],
  ['135', '217', '0.49', '12', '=A97*(B97*C97)+D97'],
  ['11', '595', '0.03', '13', '=A98*(B98*C98)+D98'],
  ['41', '739', '0.88', '11', '=A99*(B99*C99)+D99'],
  ['144', '289', '0.87', '13', '=A100*(B100*C100)+D100'],
  ['Sum', 'Average', 'Average', 'Sum', 'Sum'],
  ['=SUM(A1:A100)', '=AVERAGE(B1:B100)', '=AVERAGE(C1:C100)', '=SUM(D1:D100)', '=SUM(E1:E100)']
];

const container = document.getElementById('example-data-grid');
new Handsontable(container, {
  data: data,
  formulas: {
    engine: HyperFormula,
  },
  colHeaders: ['Qty', 'Unit price', 'Discount', 'Freight', 'Total due (fx)'],
  fixedRowsBottom: 2,
  stretchH: 'all',
  height: 500,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Initialization methods

There're multiple ways of initializing the plugin. You can select the most convenient one depending on your use case.

In all cases, it is required to either pass in the `HyperFormula` object or a HyperFormula instance:

```js
import { HyperFormula } from 'hyperformula';
```

There are also other installation methods available. Check out [HyperFormula's installation documentation](https://handsontable.github.io/hyperformula/guide/client-side-installation.html).

### Passing the HyperFormula class/instance to Handsontable

```js
{
  formulas: {
    engine: HyperFormula,
    // [plugin configuration]
  }
}
```

or

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

### Single Handsontable instance with an external HyperFormula instance

```js
const hyperformulaInstance = HyperFormula.buildEmpty({})

{
  formulas: {
    engine: hyperformulaInstance
  }
}
```

### Multiple independent Handsontable instances

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

### Multiple Handsontable instances with an external shared HyperFormula instance

```js
const hyperformulaInstance = HyperFormula.buildEmpty({});

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

## `afterFormulasValuesUpdate` hook

This hook listens for any changes to cells in the calculation engine, including dependent cells containing formulas.

```js
const afterFormulasValuesUpdate = (changes) => {
  changes.forEach((change) => {
    console.log('change', change.address, change.newValue)
  })
}

new Handsontable(element, {
  formulas: {
    engine: HyperFormula
  },
  afterFormulasValuesUpdate
})
```

## Named expressions

You can use custom-named expressions in your formula expressions. A named expression can be either plain values or formulas with references to absolute cell addresses. To register a named expression, pass an array with `name` and `expression` to your `formulas` configuration object:

::: example #example-named-expressions1 --html 1 --js 2
```html
<div id="example-named-expressions1"></div>
<form id="named-expressions-form" class="controls" style="margin-top: 10px">
  <input id="named-expressions-calculate-input" type="text" value="=10 * Sheet1!$A$2"/>
  <button type="submit">Calculate price</button>
</form>
```
```js
const data = [
  ['Travel ID', 'Destination', 'Base price', 'Price with extra cost'],
  ['154', 'Rome', 400, '=ROUND(ADDITIONAL_COST+C2,0)'],
  ['155', 'Athens', 300, '=ROUND(ADDITIONAL_COST+C3,0)'],
  ['156', 'Warsaw', 150, '=ROUND(ADDITIONAL_COST+C4,0)']
];

const container = document.getElementById('example-named-expressions1');
const hotNamedExpressions = new Handsontable(container, {
  data: data,
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: HyperFormula,
    namedExpressions: [
      {
        name: 'ADDITIONAL_COST',
        expression: 100
      }
    ]
  },
  licenseKey: 'non-commercial-and-evaluation'
});

const input = document.getElementById('named-expressions-calculate-input');
const formulasPlugin = hotNamedExpressions.getPlugin('formulas');
const form = document.getElementById('named-expressions-form');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formulasPlugin.engine.changeNamedExpression('ADDITIONAL_COST', input.value);
  hotNamedExpressions.render();
});
```
:::

For more information about named expressions, please refer to the [HyperFormula docs](https://handsontable.github.io/hyperformula/guide/named-ranges.html).

## View the explainer video

<iframe width="100%" height="425px" src="https://www.youtube.com/embed/JJXUmACTDdk"></iframe>

## Learn more

*   [Plugin API reference](@/api/formulas.md)
*   [HyperFormula guides](https://handsontable.github.io/hyperformula/)
*   [HyperFormula API reference](https://handsontable.github.io/hyperformula/api/)
