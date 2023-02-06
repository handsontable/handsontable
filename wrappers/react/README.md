<div align="center">

<a href="https://handsontable.com" rel="nofollow"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/handsontable-logo-blue.svg" alt="Handsontable - data grid for React" width="300"></a>

# React Data Grid <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/react-icon.svg" width="22" height="22">

Handsontable's wrapper for React combines data grid features with spreadsheet-like UX. <br>
It provides data binding, data validation, filtering, sorting, and CRUD operations.

[![npm](https://img.shields.io/npm/dt/@handsontable/react.svg)](https://npmjs.com/package/@handsontable/react)
[![npm](https://img.shields.io/npm/dm/@handsontable/react.svg)](https://npmjs.com/package/@handsontable/react)
[![CI status](https://github.com/handsontable/handsontable/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/handsontable/handsontable/actions/workflows/test.yml?query=branch%3Amaster)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable?ref=badge_shield)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=handsontable_handsontable&metric=alert_status)](https://sonarcloud.io/dashboard?id=handsontable_handsontable)

---

<a href="https://handsontable.com/demo"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/handsontable-github-preview.png" alt="Handsontable data grid for React" width="805"/></a>

</div>

## Features

The most popular features of Handsontable for React:

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

- [Developer guides](https://handsontable.com/docs/react-installation/)
- [API Reference](https://handsontable.com/docs/api/core/)
- [Changelog](https://handsontable.com/docs/release-notes/)
- [Demo](https://handsontable.com/demo)

<div id="installation"></div>

## Get started

### 1. Install Handsontable

Get Handsontable from [npm](https://www.npmjs.com/package/@handsontable/react) or [Yarn](https://yarnpkg.com/package/@handsontable/react).

```bash
npm install handsontable @handsontable/react
```

Import Handsontable's CSS:

```jsx
import 'handsontable/dist/handsontable.full.min.css';
```

### 2. Register Handsontable's modules

```jsx
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

### 3. Use the `HotTable` component

The main Handsontable component is called `HotTable`.

```jsx
import { HotTable } from '@handsontable/react';
```

To set Handsontable's [configuration options](https://handsontable.com/docs/react-data-grid/configuration-options), use `HotTable`'s props. For example:

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

registerAllModules();

export const ExampleComponent = () => {

  return (
      <HotTable
        // set `HotTable`'s props here
        data={[
          ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
          ['2019', 10, 11, 12, 13],
          ['2020', 20, 11, 14, 13],
          ['2021', 30, 15, 12, 13]
        ]}
        rowHeaders={true}
        colHeaders={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation" // for non-commercial use only
      />
  );
};
```



### [View live demo](https://handsontable.com/docs/react-data-grid/demo/)

## Support

We provide support for developers working with commercial version via [contact form](https://handsontable.com/contact?category=technical_support)</a> or at support@handsontable.com.

If you use a non-commercial version then please ask your tagged question on [StackOverflow](https://stackoverflow.com/questions/tagged/handsontable).

## License

Handsontable is a commercial software with two licenses available:

- Free for non-commercial purposes such as teaching, academic research, and evaluation. [Read it here](https://github.com/handsontable/handsontable/blob/master/handsontable-non-commercial-license.pdf).
- Commercial license with support and maintenance included. See [pricing plans](https://handsontable.com/pricing).

## License key

If you use Handsontable for React in a project that supports your commercial activity, then you must purchase the license key at [handsontable.com](https://handsontable.com/pricing).

If you use the free for non-commercial license of Handsontable, then pass the phrase `'non-commercial-and-evaluation'`, as described in [this documentation](https://handsontable.com/docs/license-key/).

<br>
<br>

Proudly created and maintained by the [Handsontable Team](https://handsontable.com/team).
