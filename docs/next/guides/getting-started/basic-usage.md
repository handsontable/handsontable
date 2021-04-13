---
title: Basic usage
permalink: /next/basic-usage
canonicalUrl: /basic-usage
---

# {{ $frontmatter.title }}

[[toc]]

## Install with npm

Run the following command in your terminal
```
npm install handsontable
```

You can also use [Yarn](https://yarnpkg.com/package/handsontable), [NuGet](https://www.nuget.org/packages/Handsontable) or load the bundle directly from [jsDelivr](https://jsdelivr.com/package/npm/handsontable).

## Create a placeholder

Create an HTML placeholder

```html
<div id="example"></div>
```

Import Handsontable and its stylesheet
```js
import Handsontable from "handsontable";
import 'handsontable/dist/handsontable.full.css';
```

## Initialize the grid

Now turn your placeholder into a data grid with sample data.
```js
const data = [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
  ['2019', 10, 11, 12, 13],
  ['2020', 20, 11, 14, 13],
  ['2021', 30, 15, 12, 13]
];

const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
});
```

## Result preview

:::: tabs
::: tab Preview

::: example #example


:::
::: tab "Edit in CodeSandbox"
``` javascript
Turn this into a link
```
:::
::::
