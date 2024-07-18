<div align="center">

<a href="https://handsontable.com" rel="nofollow"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/handsontable-logo-blue.svg" alt="Handsontable" width="300"></a>
  
<div align="center">
  <h2>
    A front-end component that combines data grid features </br>
    with spreadsheet UX/UI </br>
  <br />
  </h2>
</div>

<h3>
  <a href="https://handsontable.com/docs/react-data-grid/installation/">&nbsp;&nbsp;<img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/react-icon.svg" width="14" height="14"> <strong>React</strong>&nbsp;&nbsp;</a> |
  <a href="https://handsontable.com/docs/javascript-data-grid/angular-installation/">&nbsp;&nbsp;<img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/angular-icon.svg" width="14" height="14"> <strong>Angular</strong>&nbsp;&nbsp;</a> |
  <a href="https://handsontable.com/docs/javascript-data-grid/vue3-installation/">&nbsp;&nbsp;<img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/vue-icon.svg" width="14" height="14"> <strong>Vue</strong>&nbsp;&nbsp;</a> |
  <a href="https://handsontable.com/docs/javascript-data-grid/installation/">&nbsp;&nbsp;<img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/javascript-icon.svg" width="14" height="14"> <strong>JavaScript</strong>&nbsp;&nbsp;</a>
</h3>

[![](https://data.jsdelivr.com/v1/package/npm/handsontable/badge)](https://www.jsdelivr.com/package/npm/handsontable)
[![npm](https://img.shields.io/npm/dm/handsontable.svg)](https://npmjs.com/package/handsontable)
[![CI status](https://github.com/handsontable/handsontable/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/handsontable/handsontable/actions/workflows/test.yml?query=branch%3Amaster)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable?ref=badge_shield)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=handsontable_handsontable&metric=alert_status)](https://sonarcloud.io/dashboard?id=handsontable_handsontable)

<br />

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

---
<h4>
<a target="_blank" href="https://handsontable.com/docs" rel="dofollow"><strong>Explore the Docs</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://handsontable.com/docs/api/core/" rel="dofollow"><strong>Check out the API</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://handsontable.com/demo" rel="dofollow"><strong>Try The Demo</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://handsontable.com/docs/release-notes/" rel="dofollow"><strong>View our Changelog</strong></a>&nbsp;
</h4>

---

<div id="installation"></div>

## Installation

You can install Handsontable with [NPM](https://www.npmjs.com/), [Yarn](https://yarnpkg.com/), [PNpm](https://pnpm.io/), or a `<script>`.
  
#### NPM
```bash
npm i handsontable @handsontable/vue
```

#### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@handsontable/vue/dist/vue-handsontable.min.js"></script>

<link href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" rel="stylesheet">
```
  
### Quick Start
Below is a very simple example of Handsontable.

```vue
<template>
  <hot-table :data="data" colHeaders="true" rowHeaders="true" width="600" height="300"></hot-table>
</template>

<script>
  import { HotTable } from '@handsontable/vue';
  import 'handsontable/dist/handsontable.full.css';

  export default {
    data: function() {
      return {
        data: [
          ['', 'Tesla', 'Mercedes', 'Toyota', 'Volvo'],
          ['2019', 10, 11, 12, 13],
          ['2020', 20, 11, 14, 13],
          ['2021', 30, 15, 12, 13]
        ],
      };
    },
    components: {
      HotTable
    }
  }
</script>
```

### [View live demo](https://handsontable.com/docs/vue-simple-example/)

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