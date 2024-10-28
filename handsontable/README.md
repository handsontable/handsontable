<div align="center">

<a href="https://handsontable.com" rel="nofollow"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/handsontable-logo-blue.svg" alt="Handsontable" width="300"></a>

Handsontable is a JavaScript component that combines data grid features with spreadsheet-like UX. <br>
It provides data binding, data validation, filtering, sorting, and CRUD operations.

[![npm](https://img.shields.io/npm/dt/handsontable.svg)](https://npmjs.com/package/handsontable)
[![npm](https://img.shields.io/npm/dm/handsontable.svg)](https://npmjs.com/package/handsontable)
[![CI status](https://github.com/handsontable/handsontable/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/handsontable/handsontable/actions/workflows/test.yml?query=branch%3Amaster)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable?ref=badge_shield)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=handsontable_handsontable&metric=alert_status)](https://sonarcloud.io/dashboard?id=handsontable_handsontable)

---
#### Get Started with Handsontable

<table border="0">
  <tr>
    <td>
      <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/react-icon.svg" width="14" height="14">
      <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/react"> <strong>React</strong></a>&nbsp;
    </td>
    <td>
      <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/angular-icon.svg" width="14" height="14">
      <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/angular"> <strong>Angular</strong></a>&nbsp;
    </td>
    <td>
      <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/vue-icon.svg" width="14" height="14">
      <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/vue"> <strong>Vue</strong></a>&nbsp;
    </td>
    <td>
      <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/vue-icon.svg" width="14" height="14">
      <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/vue3"> <strong>Vue 3</strong></a>&nbsp;
    </td>
    <td>
      <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/javascript-icon.svg" width="14" height="14">&nbsp;
      <a href="#installation"> <strong>JavaScript</strong></a>&nbsp;
    </td>
  </tr>
</table>

---

<a href="https://handsontable.com/demo"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/handsontable-github-preview.png" alt="Handsontable data grid" width="805"/></a>

</div>

## Features

The most popular features of Handsontable:

&nbsp;&nbsp;✓&nbsp; Multiple column sorting <br>
&nbsp;&nbsp;✓&nbsp; Non-contiguous selection <br>
&nbsp;&nbsp;✓&nbsp; Filtering data <br>
&nbsp;&nbsp;✓&nbsp; Export to file <br>
&nbsp;&nbsp;✓&nbsp; Validating data <br>
&nbsp;&nbsp;✓&nbsp; Conditional formatting <br>
&nbsp;&nbsp;✓&nbsp; Merging cells <br>
&nbsp;&nbsp;✓&nbsp; Freezing rows/columns <br>
&nbsp;&nbsp;✓&nbsp; Moving rows/columns <br>
&nbsp;&nbsp;✓&nbsp; Resizing rows/columns <br>
&nbsp;&nbsp;✓&nbsp; Hiding rows/columns <br>
&nbsp;&nbsp;✓&nbsp; Context menu <br>
&nbsp;&nbsp;✓&nbsp; Comments <br>

## Documentation

- [Developer guides](https://handsontable.com/docs)
- [API Reference](https://handsontable.com/docs/api/core/)
- [Changelog](https://handsontable.com/docs/release-notes/)
- [Demo](https://handsontable.com/demo)

<div id="installation"></div>

## Get Started
### Install with npm

Run the following command in your terminal
```
npm install handsontable
```

You can also use [Yarn](https://yarnpkg.com/package/handsontable), [NuGet](https://www.nuget.org/packages/Handsontable) or load the bundle directly from [jsDelivr](https://jsdelivr.com/package/npm/handsontable).

### Create a placeholder

Create an HTML placeholder

```html
<div id="example"></div>
```

Import Handsontable and its stylesheet
```js
import Handsontable from "handsontable";
import 'handsontable/dist/handsontable.full.css';
```

### Initialize the grid

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
  colHeaders: true
});
```

## Support

We provide support for developers working with commercial version via [contact form](https://handsontable.com/contact?category=technical_support)</a> or at support@handsontable.com.

If you use a non-commercial version then please ask your tagged question on [StackOverflow](https://stackoverflow.com/questions/tagged/handsontable).

## License

Handsontable is a commercial software with two licenses available:

- Free for non-commercial purposes such as teaching, academic research, and evaluation. [Read it here](https://github.com/handsontable/handsontable/blob/master/handsontable-non-commercial-license.pdf).
- Commercial license with support and maintenance included. See [pricing plans](https://handsontable.com/pricing).

## License key

If you use Handsontable in a project that supports your commercial activity, then you must purchase the license key at [handsontable.com](https://handsontable.com/pricing).

If you use the free for non-commercial license of Handsontable, then pass the phrase `'non-commercial-and-evaluation'`, as described in [this documentation](https://handsontable.com/docs/license-key/).

<br>
<br>

Proudly created and maintained by the [Handsontable Team](https://handsontable.com/team).
