<div align="center">

<a href="//handsontable.com" rel="nofollow"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/handsontable-logo.svg?sanitize=true" alt="Handsontable" width="300"></a>

**Handsontable** is a JavaScript/HTML5 data grid component with spreadsheet look & feel. <br>
It provides easy data binding, data validation, filtering, sorting and CRUD operations.

Handsontable works with [Vue](//github.com/handsontable/vue-handsontable-official), [React](//github.com/handsontable/react-handsontable) and [Angular](//github.com/handsontable/angular-handsontable).
<br><br>
[![npm](https://img.shields.io/npm/dt/handsontable.svg)](//npmjs.com/package/handsontable)
[![npm](https://img.shields.io/npm/dm/handsontable.svg)](//npmjs.com/package/handsontable)
[![Build status](https://app.codeship.com/projects/1ec34290-ed0a-0131-911c-1a47c8fbcce0/status?branch=master)](https://app.codeship.com/projects/26649)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable?ref=badge_shield)
[![Known Vulnerabilities](https://snyk.io/test/github/handsontable/handsontable/badge.svg?targetFile=package.json)](https://snyk.io/test/github/handsontable/handsontable?targetFile=package.json)
[![](https://data.jsdelivr.com/v1/package/npm/handsontable/badge?style=rounded)](https://www.jsdelivr.com/package/npm/handsontable)
</div>

<br>

<div align="center">
<a href="//handsontable.com/examples?headers">
<img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/handsontable-github-preview.png" align="center" alt="Handsontable Screenshot" width="861"/>
</a>
</div>

<br>

## Installation

Use npm to install the latest version.
```
npm install handsontable
```

You can use Yarn, NuGet or [other methods](//handsontable.com/download) as well. You can load it directly from [jsDelivr](//www.jsdelivr.com/package/npm/handsontable).

## Usage

Create a placeholder - an HTML element holding a place for a data grid.

```html
<div id="example"></div>
```

Import Handsontable and its stylesheet.
```js
import Handsontable from "handsontable";
import 'handsontable/dist/handsontable.full.css';
```

Alternatively, you can simply embed it in your HTML file.
```html
<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" rel="stylesheet">
```

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

##### [See the live demo](//handsontable.com/examples)

## Features

A list of some of the most popular features:

- Multiple column sorting
- Non-contiguous selection
- Filtering data
- Export to file
- Validating data
- Conditional formatting
- Merging cells
- Custom cell types
- Freezing rows/columns
- Moving rows/columns
- Resizing rows/columns
- Hiding rows/columns
- Context menu
- Comments
- Auto-fill option

## Framework support

Use one of the available wrappers to use Handsontable with your favorite framework:

- [Handsontable for Vue](//github.com/handsontable/vue-handsontable-official)
- [Handsontable for React](//github.com/handsontable/react-handsontable)
- [Handsontable for Angular](//github.com/handsontable/angular-handsontable)

## Documentation

- [Developer guides](//handsontable.com/docs)
- [API Reference](//handsontable.com/docs/Core.html)
- [Release notes](//handsontable.com/docs/tutorial-release-notes.html)
- [Twitter](//twitter.com/handsontable) (News and updates)

## Support and contribution

We provide support for all users through [GitHub issues](//github.com/handsontable/handsontable/issues). If you have a commercial license then you can add a new ticket through the [contact form](//handsontable.com/contact?category=technical_support).

If you would like to contribute to this project, make sure you first read the [guide for contributors](//github.com/handsontable/handsontable/blob/master/CONTRIBUTING.md).

## Browser compatibility

Handsontable is compatible with modern browsers such as Chrome, Firefox, Safari, Opera, and Edge. It also supports Internet Explorer 9 to 11 but with limited performance.

## License

Handsontable is dual-licensed. You can either use a free license for all your non-commercial projects or purchase a commercial license. See the table below for a comparison of these two.

<table>
  <thead align="center">
    <tr>
      <th width="50%">Free license</th>
      <th width="50%">Paid license</th>
    </tr>    
  </thead>
  <tbody align="center">
    <tr>
      <td>For non-commercial purposes such as teaching, academic research, personal experimentation, and evaluating  on development and testing servers.</td>
      <td>For all commercial purposes</td>
    </tr>
    <tr>
      <td>All features are available</td>
      <td>All features are available</td>
    </tr>
    <tr>
      <td>Community support</td>
      <td>Dedicated support</td>
    </tr>    
    <tr>
      <td><a href="//github.com/handsontable/handsontable/blob/master/LICENSE.txt">Read the license</a></td>
      <td><a href="//handsontable.com/pricing">See plans</a></td>
    </tr>
  </tbody>
</table>

## License key

**The license key is obligatory since [Handsontable 7.0.0](//github.com/handsontable/handsontable/releases/tag/7.0.0) (released in March 2019).**

If you use Handsontable for purposes not intended toward monetary compensation such as, but not limited to, teaching, academic research, evaluation, testing and experimentation, pass the phrase `'non-commercial-and-evaluation'`, as presented below:

```js
const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```

If, on the other hand, you use Handsontable in a project that supports your commercial activity, then you must purchase the license key at [handsontable.com](//handsontable.com/pricing).

The license key is validated in an offline mode.  No connection is made to any server. [Learn more](//handsontable.com/docs/tutorial-license-key.html) about how it works.

<br>
<br>

Created by [Handsoncode](//handsoncode.net) with ❤ and ☕ in [Tricity](//en.wikipedia.org/wiki/Tricity,_Poland).
