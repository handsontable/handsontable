---
id: demo-numeric
title: Numeric
sidebar_label: Numeric
slug: /demo-numeric
---

function getCarData() { return \[ {car: "Mercedes A 160", year: 2017, price\_usd: 7000, price\_eur: 7000}, {car: "Citroen C4 Coupe", year: 2018, price\_usd: 8330, price\_eur: 8330}, {car: "Audi A4 Avant", year: 2019, price\_usd: 33900, price\_eur: 33900}, {car: "Opel Astra", year: 2020, price\_usd: 5000, price\_eur: 5000}, {car: "BMW 320i Coupe", year: 2021, price\_usd: 30500, price\_eur: 30500} \]; }

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/numeric.html)

By default, Handsontable treats all cell values as `string` type. This is because `<textarea>` returns a string as its value. In many cases you will prefer cell values to be treated as `number` type. This allows to format displayed numbers nicely and sort them correctly.

To trigger the Numeric cell type, use the option `type: 'numeric'` in `columns` array or `cells` function. Make sure your cell values are numbers and not strings as Handsontable will not parse strings to numbers. You can input float-typed values in the numeric editor only using a dot or a comma as a decimal separator. For example, both `500000.5`, `500000,5` will be accepted. You are not able to use thousands separator in the editor.

You can format the displayed values of the entered numbers. It can be done using the [numericFormat](/docs/8.2.0/Options.html#numericFormat) option. Please keep in mind that it **have no influence on the way you enter data**.

Note that all the positive and negative integers whose magnitude is no greater than 253 (+/- 9007199254740991) are representable in the `Number` type (safe integer). Any calculations that are performed on bigger numbers won't be calculated precisely due to JavaScript limitation (more at [w3schools](http://www.w3schools.com/js/js_numbers.asp)).

Edit Log to console

var container = document.getElementById('example1'), hot; hot = new Handsontable(container, { data: getCarData(), colHeaders: \['Car', 'Year', 'Price ($)', 'Price (€)'\], columnSorting : true, columns: \[ { data: 'car' // 1nd column is simple text, no special options here }, { data: 'year', type: 'numeric' }, { data: 'price\_usd', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' // this is the default culture, set up for USD }, allowEmpty: false }, { data: 'price\_eur', type: 'numeric', numericFormat: { pattern: '0,0.00 $', culture: 'de-DE' // use this for EUR (German), // more cultures available on http://numbrojs.com/languages.html } } \] });

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/numeric.html)
