<div align="center">
  <br><br>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/handsontable/handsontable/blob/feature/dev-issue-2137/resources/handsontable-logo-white.svg?raw=true"/>
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/handsontable/handsontable/blob/feature/dev-issue-2137/resources/handsontable-logo-black.svg?raw=true"/>
    <img width="400" alt="Handsontable logo" src="https://github.com/handsontable/handsontable/blob/feature/dev-issue-2137/resources/handsontable-logo-black.svg?raw=true"/>
  </picture>
  <br><br>
  <h3>Handsontable is a highly-customizable <a href="https://handsontable/docs/javascript-data-grid" target="_blank">JavaScript data grid</a> with a spreadsheet-like look and feel.</h3>
  <p>
    It supports frameworks like 
    <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/react-wrapper" target="_blank">React</a>, 
    <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/angular" target="_blank">Angular</a>, and 
    <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/vue" target="_blank">Vue</a>. 
    It is perfect for data-rich internal applications, allowing users to enter, edit, and validate data from various sources. Common use cases include resource planning software (ERP), inventory management systems, and data modeling applications.
  </p>
  
  ![NPM version](https://img.shields.io/npm/v/handsontable)
  [![Total downloads](https://img.shields.io/npm/dt/handsontable.svg)](https://npmjs.com/package/handsontable)
  [![Monthly downloads](https://img.shields.io/npm/dm/handsontable.svg)](https://npmjs.com/package/handsontable)
  [![Contributors](https://img.shields.io/github/contributors/handsontable/handsontable)](https://npmjs.com/package/handsontable)
  [![CI status](https://github.com/handsontable/handsontable/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/handsontable/handsontable/actions/workflows/test.yml?query=branch%3Amaster)
  [![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=handsontable_handsontable&metric=alert_status)](https://sonarcloud.io/dashboard?id=handsontable_handsontable)
  [![FOSSA status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable?ref=badge_shield)

  <br>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/handsontable/handsontable/blob/feature/dev-issue-2137/resources/handsontable-preview-dark-theme.png?raw=true"/>
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/handsontable/handsontable/blob/feature/dev-issue-2137/resources/handsontable-preview-light-theme.png?raw=true"/>
    <img width="760" alt="JavbaScript data grid preview" src="https://github.com/handsontable/handsontable/blob/feature/dev-issue-2137/resources/handsontable-preview-light-theme.png?raw=true"/>
  </picture>
</div>

<div id="installation">

  ## Installation
  Below, you'll find the installation guide for the JavaScript component. If you're using a specific framework, refer to its dedicated project for installation instructions:
  
  - <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/react-wrapper"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/react-icon.svg" width="12" height="12"> React functional component</a>
  - <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/react"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/react-icon.svg" width="12" height="12" alt="React"> React class component</a>
  - <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/angular"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/angular-icon.svg" width="12" height="12" alt="Angular"> Angular</a>
  - <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/vue3"><img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/vue-icon.svg" width="12" height="12"> Vue</a>
  ---
  
  ### Install with npm
  
  ```bash
  npm install handsontable
  ```
  
  You can also use [Yarn](https://yarnpkg.com/package/handsontable), [NuGet](https://www.nuget.org/packages/Handsontable) or load the package from [CDN](https://jsdelivr.com/package/npm/handsontable).
  
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
</div>

## Key Features

&nbsp;&nbsp;✅&nbsp; [Built-in themes](https://handsontable.com/docs/javascript-data-grid/themes/) <br>
&nbsp;&nbsp;✅&nbsp; [Flexible API](https://handsontable.com/docs/javascript-data-grid/api/) <br>
&nbsp;&nbsp;✅&nbsp; [Virtualization](https://handsontable.com/docs/javascript-data-grid/row-virtualization/) <br>
&nbsp;&nbsp;✅&nbsp; [Accessibility](https://handsontable.com/docs/javascript-data-grid/accessibility/) <br>
&nbsp;&nbsp;✅&nbsp; [Mutil-column sorting](https://handsontable.com/docs/javascript-data-grid/rows-sorting/) <br>
&nbsp;&nbsp;✅&nbsp; [Data filtering](https://handsontable.com/docs/javascript-data-grid/column-filter/) <br>
&nbsp;&nbsp;✅&nbsp; [400 built-in formulas](https://handsontable.com/docs/javascript-data-grid/formula-calculation/) <br>
&nbsp;&nbsp;✅&nbsp; [Configurable selection](https://handsontable.com/docs/javascript-data-grid/selection/) <br>
&nbsp;&nbsp;✅&nbsp; [Data validation](https://handsontable.com/docs/javascript-data-grid/cell-validator/) <br>
&nbsp;&nbsp;✅&nbsp; [Conditional formatting](https://handsontable.com/docs/javascript-data-grid/conditional-formatting/) <br>
&nbsp;&nbsp;✅&nbsp; [Merged cells](https://handsontable.com/docs/javascript-data-grid/merge-cells/) <br>
&nbsp;&nbsp;✅&nbsp; [Pinned/frozen columns](https://handsontable.com/docs/javascript-data-grid/column-freezing/) <br>
&nbsp;&nbsp;✅&nbsp; [Movable rows](https://handsontable.com/docs/javascript-data-grid/row-moving/) / [Moving columns](https://handsontable.com/docs/javascript-data-grid/column-moving/) <br>
&nbsp;&nbsp;✅&nbsp; [Hiding columns](https://handsontable.com/docs/javascript-data-grid/column-hiding/) <br>
&nbsp;&nbsp;✅&nbsp; [Right-click context menu](https://handsontable.com/docs/javascript-data-grid/context-menu/) <br>

## Resources

- [Website](https://handsontable.com)
- [Demo](https://handsontable.com/demo)
- [Documentation](https://handsontable.com/docs)
- [npm](https://www.npmjs.com/package/handsontable)
- [CDN](https://www.jsdelivr.com/package/npm/handsontable)
- [Forum](https://forum.handsontable.com/)
- [Blog](https://handsontable.com/blog)
- [Contact support team](https://handsontable.com/contact)
- [Get a quote](https://handsontable.com/get-a-quote)

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
