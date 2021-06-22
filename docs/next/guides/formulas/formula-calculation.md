---
title: Formula calculation
metaTitle: Formula calculation - Guide - Handsontable Documentation
permalink: /next/formula-calculation
canonicalUrl: /formula-calculation
---

# Formula calculation

[[toc]]

::: tip
This plugin has been permanently replaced with the new one in version 9.0. Please upgrade your Handsontable version to use the [new plugin](@/guides/formulas/hyperformula-integration.md).
:::

## Overview

The _Formulas_ plugin allows Handsontable to process formula expressions defined in the provided data. This plugin uses a [formula-parser](https://github.com/handsontable/formula-parser) library which takes most of functions from [formula.js](https://github.com/handsontable/formula.js).

**Features:**

* Any numbers, negative and positive as float or integer
* Arithmetic operations such as: `+`, `-`, `/`, `*`, `%`, `^`
* Logical operations such as: `AND()`, `OR()`, `NOT()`, `XOR()`
* Comparison operations such as: `=`, `>`, `>=`, `<`, `<=`, `<>`
* All JavaScript Math constants such as: `PI()`, `E()`, `LN10()`, `LN2()`, `LOG10E()`, `LOG2E()`, `SQRT1_2()`, `SQRT2()`
* Error handling: `#DIV/0!`, `#ERROR!`, `#VALUE!`, `#REF!`, `#NAME?`, `#N/A`, `#NUM!`
* String operations such as: `&` (concatenation eq. `=-(2&5)` will return `-25`)
* All excel formulas defined in [formula.js](https://github.com/handsontable/formula.js)
* Relative and absolute cell references such as: `A1`, `$A1`, `A$1`, `$A$1`
* Build-in variables such as: `TRUE`, `FALSE`, `NULL`
* Custom variables
* Nested functions
* Dynamic updates

**Known limitations:**

* Not working with filtering and column sorting;
* Not working with trimming rows.

## Quick setup

To enable the plugin you need to set the `formulas` property to `true`. Cells that are dependent on the edited value will be dynamically recalculated.

::: example #example1
```js
const container = document.querySelector('#example1');

const data = [
  ['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1'],
  [2009, 0, 2941, 4303, 354, 5814],
  [2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1'],
  [2011, 4, 2517, 4822, 552, 6127],
  [2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, 4151]
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  formulas: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Custom variables

You can pass your custom variables which can be ready to use in your formula expressions. To set custom variables pass an object with key:value pairs to the `formulas` property.

::: example #example2
```js
const container = document.querySelector('#example2');

const data = [
  ['Anderson', '92', '=IF(B1<RANGE_F, "F", IF(B1<RANGE_D, "D", IF(B1<RANGE_C, "C", IF(B1<RANGE_B, "B", "A"))))', '', '', '0-63', 'F'],
  ['Bautista', '85', '=IF(B2<RANGE_F, "F", IF(B2<RANGE_D, "D", IF(B2<RANGE_C, "C", IF(B2<RANGE_B, "B", "A"))))', '', '', '64-72', 'D'],
  ['Block', '96', '=IF(B3<RANGE_F, "F", IF(B3<RANGE_D, "D", IF(B3<RANGE_C, "C", IF(B3<RANGE_B, "B", "A"))))', '', '', '73-84', 'C'],
  ['Burrows', '79', '=IF(B4<RANGE_F, "F", IF(B4<RANGE_D, "D", IF(B4<RANGE_C, "C", IF(B4<RANGE_B, "B", "A"))))', '', '', '85-94', 'B'],
  ['Chandler', '82', '=IF(B5<RANGE_F, "F", IF(B5<RANGE_D, "D", IF(B5<RANGE_C, "C", IF(B5<RANGE_B, "B", "A"))))', '', '', '95-100', 'A'],
  ['Colby', '95', '=IF(B6<RANGE_F, "F", IF(B6<RANGE_D, "D", IF(B6<RANGE_C, "C", IF(B6<RANGE_B, "B", "A"))))', '', '', '', ''],
  ['Crosby', '90', '=IF(B7<RANGE_F, "F", IF(B7<RANGE_D, "D", IF(B7<RANGE_C, "C", IF(B7<RANGE_B, "B", "A"))))', '', '', '', ''],
  ['Dove', '65', '=IF(B8<RANGE_F, "F", IF(B8<RANGE_D, "D", IF(B8<RANGE_C, "C", IF(B8<RANGE_B, "B", "A"))))', '', '', '', ''],
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation',
  formulas: {
    variables: {
      RANGE_F: 64,
      RANGE_D: 73,
      RANGE_C: 85,
      RANGE_B: 95,
    }
  },
});
```
:::

**Updating custom variables**

At some point, you may want to update the custom variable's value. To do so, you need to use both `setVariable` and one of `recalculate*` methods.

::: example #example3 --html 1 --js 2
```html
<div id="example3"></div>
<input id="calculate-field" name="calculate-field" title="Extra cost" type="number" placeholder="Extra cost"/>
<button id="calculate" class="intext-btn">Calculate price</button>
```
```js
const container = document.querySelector('#example3');
const inputBox = document.querySelector('#calculate-field')
const calculateButton = document.querySelector('#calculate')

const data = [
  ['Travel ID', 'Destination', 'Base price', 'Price with extra cost'],
  ['154', 'Rome', 400, '=ROUND(ADDITIONAL_COST+C2;0)'],
  ['155', 'Athens', 300, '=ROUND(ADDITIONAL_COST+C3;0)'],
  ['156', 'Warsaw', 150, '=ROUND(ADDITIONAL_COST+C4;0)']
];

const hot = new Handsontable(container, {
  data,
  contextMenu: false,
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  formulas: {
    variables: {
      // set the initial value
      ADDITIONAL_COST: 0,
    }
  }
});

const formulasPlugin = hot.getPlugin('formulas');

Handsontable.dom.addEvent(calculateButton, 'click', () => {
  // set variable and its value
  formulasPlugin.setVariable('ADDITIONAL_COST', parseInt(inputBox.value));
  // recalculate all formulas
  formulasPlugin.recalculateFull();
});
```
:::

## Advanced example

The advanced example shows how to manage nested formulas. Also you can see how to set dependencies between different types of formulas.

::: example #example4
```js
const container = document.querySelector('#example4');

const data = [
  ['Example #1 (looking for particular words in a sentence)', '', '', '', '', '', '', ''],
  ['Text', 'yellow', 'red', 'blue', 'green', 'pink', 'gray'],
  ['Yellow dog on green grass', "=IF(ISNUMBER(SEARCH(B2, A3)), B2, '')", "=IF(ISNUMBER(SEARCH(C2, A3)), C2, '')", "=IF(ISNUMBER(SEARCH(D2, A3)), D2, '')", "=IF(ISNUMBER(SEARCH(E2, A3)), E2, '')", "=IF(ISNUMBER(SEARCH(F2, A3)), F2, '')", "=IF(ISNUMBER(SEARCH(G2, A3)), G2, '')"],
  ['Gray sweater with blue stripes', "=IF(ISNUMBER(SEARCH(B2, A4)), B2, '')", "=IF(ISNUMBER(SEARCH(C2, A4)), C2, '')", "=IF(ISNUMBER(SEARCH(D2, A4)), D2, '')", "=IF(ISNUMBER(SEARCH(E2, A4)), E2, '')", "=IF(ISNUMBER(SEARCH(F2, A4)), F2, '')", "=IF(ISNUMBER(SEARCH(G2, A4)), G2, '')"],
  ['A red sun on a pink horizon', "=IF(ISNUMBER(SEARCH(B2, A5)), B2, '')", "=IF(ISNUMBER(SEARCH(C2, A5)), C2, '')", "=IF(ISNUMBER(SEARCH(D2, A5)), D2, '')", "=IF(ISNUMBER(SEARCH(E2, A5)), E2, '')", "=IF(ISNUMBER(SEARCH(F2, A5)), F2, '')", "=IF(ISNUMBER(SEARCH(G2, A5)), G2, '')"],
  ['Blue neon signs everywhere', "=IF(ISNUMBER(SEARCH(B2, A6)), B2, '')", "=IF(ISNUMBER(SEARCH(C2, A6)), C2, '')", "=IF(ISNUMBER(SEARCH(D2, A6)), D2, '')", "=IF(ISNUMBER(SEARCH(E2, A6)), E2, '')", "=IF(ISNUMBER(SEARCH(F2, A6)), F2, '')", "=IF(ISNUMBER(SEARCH(G2, A6)), G2, '')"],
  ['Waves of blue and green', "=IF(ISNUMBER(SEARCH(B2, A7)), B2, '')", "=IF(ISNUMBER(SEARCH(C2, A7)), C2, '')", "=IF(ISNUMBER(SEARCH(D2, A7)), D2, '')", "=IF(ISNUMBER(SEARCH(E2, A7)), E2, '')", "=IF(ISNUMBER(SEARCH(F2, A7)), F2, '')", "=IF(ISNUMBER(SEARCH(G2, A7)), G2, '')"],
  ['Hot pink socks and gray socks', "=IF(ISNUMBER(SEARCH(B2, A8)), B2, '')", "=IF(ISNUMBER(SEARCH(C2, A8)), C2, '')", "=IF(ISNUMBER(SEARCH(D2, A8)), D2, '')", "=IF(ISNUMBER(SEARCH(E2, A8)), E2, '')", "=IF(ISNUMBER(SEARCH(F2, A8)), F2, '')", "=IF(ISNUMBER(SEARCH(G2, A8)), G2, '')"],
  ['Deep blue eyes', "=IF(ISNUMBER(SEARCH(B2, A9)), B2, '')", "=IF(ISNUMBER(SEARCH(C2, A9)), C2, '')", "=IF(ISNUMBER(SEARCH(D2, A9)), D2, '')", "=IF(ISNUMBER(SEARCH(E2, A9)), E2, '')", "=IF(ISNUMBER(SEARCH(F2, A9)), F2, '')", "=IF(ISNUMBER(SEARCH(G2, A9)), G2, '')"],
  ['Count of colors', '=COUNTIF(B3:B9, B2)', '=COUNTIF(C3:C9, C2)', '=COUNTIF(D3:D9, D2)', '=COUNTIF(E3:E9, E2)', '=COUNTIF(F3:F9, F2)', '=COUNTIF(G3:G9, G2)', '="SUM: "&SUM(B10:G10)'],
  ['', '', '', '', '', '', ''],
  ['Example #2 (extracting domains from emails)', '', '', '', '', '', ''],
  ['Name', 'Email', 'Email domain', '', '', ''],
  ['Ann Chang', 'achang@gmailtr.com', '=RIGHT(B14, LEN(B14) - FIND(EMAIL_SPLITTER, B14))', '', '', '', ''],
  ['Jan Siuk', 'jan@yahootr.com', '=RIGHT(B15, LEN(B15) - FIND(EMAIL_SPLITTER, B15))', '', '', '', ''],
  ['Ken Siuk', 'ken@gmailtr.com', '=RIGHT(B16, LEN(B16) - FIND(EMAIL_SPLITTER, B16))', '', '', '', ''],
  ['Marcin Kowalski', 'ken@gmailtr.pl', '=RIGHT(B17, LEN(B17) - FIND(EMAIL_SPLITTER, B17))', '', '', '', ''],
];

const hot = new Handsontable(container, {
  data,
  height: 320,
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation',
  formulas: {
    variables: {
      EMAIL_SPLITTER: '@',
    }
  },
  mergeCells: [
    { row: 0, col: 0, rowspan: 1, colspan: 8 },
    { row: 11, col: 0, rowspan: 1, colspan: 8 },
  ],
});
```
:::
