<div align="center">
  <a href="//handsontable.com" target="_blank"><img src="https://raw.githubusercontent.com/handsontable/static-files/master/Images/Logo/Handsontable/Handsontable-logo-300-74-new.png" alt="Handsontable logo" /></a>
</div>

<br>

[**Handsontable**](//handsontable.com) is an open source JavaScript/HTML5 data grid component with spreadsheet look & feel. It easily integrates with any data source and comes with a variety of useful features like data binding, validation, sorting or powerful context menu. It is available for [Vue](//github.com/handsontable/vue-handsontable-official), [React](//github.com/handsontable/react-handsontable) and [Angular](//github.com/handsontable/angular-handsontable).

[![npm](https://img.shields.io/npm/dt/handsontable.svg)](//npmjs.com/package/handsontable)
[![npm](https://img.shields.io/npm/dm/handsontable.svg)](//npmjs.com/package/handsontable)
[![Build status](https://travis-ci.org/handsontable/handsontable.png?branch=master)](//travis-ci.org/handsontable/handsontable)
[![npm](https://img.shields.io/github/contributors/handsontable/handsontable.svg)](//github.com/handsontable/handsontable/graphs/contributors)

## Table of contents

1. [What to use it for?](#what-to-use-it-for)
1. [Installation](#installation)
2. [Basic usage](#basic-usage)
3. [Examples](#examples)
4. [Features](#features)
5. [Screenshot](#screenshot)
6. [Resources](#resources)
7. [Wrappers](#wrappers)
8. [Support](#support)
9. [Contributing](#contributing)
10. [Community](#community)
11. [License](#license)

### What to use it for?
The list below gives a rough idea on what you can do with Handsontable CE, but it shouldn't limit you in any way:

- Database editing
- Configuration controlling
- Data merging
- Team scheduling
- Sales reporting
- Financial analysis

### Installation
There are [many ways to install](//handsontable.com/download) Handsontable, but we suggest using npm.

**Community Edition:**
```
npm install handsontable
```

**Handsontable Pro:**
```
npm install handsontable-pro
```

### Basic usage
Assuming that you have already installed Handsontable, create an empty `<div>` element that will be turned into a spreadsheet:

```html
<div id="example"></div>
```
In the next step, pass a reference to that `<div>` element into the Handsontable CE constructor and fill the instance with sample data:
```javascript
const data = [
  ["", "Tesla", "Volvo", "Toyota", "Honda"],
  ["2017", 10, 11, 12, 13],
  ["2018", 20, 11, 14, 13],
  ["2019", 30, 15, 12, 13]
];

const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true
});
```

### Examples
- [See a live demo](//handsontable.com/examples.html)

### Features

Some of the most popular features include:

| Community Edition        	| Handsontable Pro           	|
|--------------------------	|---------------------------	|
| Sorting data             	| Filtering                 	|
| Validating data          	| Export to file            	|
| Conditional formatting   	| Dropdown menu             	|
| Merging cells            	| Nested headers            	|
| Custom cell types        	| Collapsing columns        	|
| Freezing rows/columns    	| Multiple Column Sorting   	|
| Moving rows/columns      	| Hiding rows               	|
| Resizing rows/columns    	| Hiding columns            	|
| Context menu             	| Trimming rows             	|
| Comments                 	| Column summary            	|
| Auto-fill option         	| Header tooltips           	|
| Non-contiguous selection 	| Binding rows with headers 	|

### Screenshot
<div align="center">
<a href="//handsontable.com/examples.html?manual-resize&manual-move&conditional-formatting&context-menu&filters&dropdown-menu&headers">
<img src="https://raw.githubusercontent.com/handsontable/static-files/master/Images/Screenshots/handsontable-pro-showcase.png" align="center" alt="Handsontable Pro Screenshot"/>
</a>
</div>

### Resources
- [API Reference](//handsontable.com/docs/Core.html)
- [Compatibility](//handsontable.com/docs/tutorial-compatibility.html)
- [Change log](//github.com/handsontable/handsontable/releases)
- [Newsroom](//twitter.com/handsontable)

### Wrappers
Handsontable comes with wrappers and directives for most popular frameworks:

- [Angular](//github.com/handsontable/angular-handsontable)
- [Angular 1](//github.com/handsontable/ngHandsontable)
- [React](//github.com/handsontable/react-handsontable)
- [Vue](//github.com/handsontable/vue-handsontable-official)
- [Polymer](//github.com/handsontable/hot-table)

### Support
You can help us in developing this project by making pull requests and [reporting issues](//github.com/handsontable/handsontable/issues).

If you have an active support package for Handsontable Pro then write to us at support/at/handsontable.com or through the [contact form](https://handsontable.com/contact?category=technical_support).

### Contributing
If you would like to help us to develop Handsontable, please take a look at this [guide for contributors](//github.com/handsontable/handsontable/blob/master/CONTRIBUTING.md).

### Community
- [GitHub issues](//github.com/handsontable/handsontable/issues)
- [Stackoverflow](//stackoverflow.com/tags/handsontable)
- [Twitter](//twitter.com/handsontable)

### License
Handsontable Community Edition is released under the [MIT license](//github.com/handsontable/handsontable/blob/master/licenses/CE/LICENSE.txt) but some of the plugins (Pro) are distributed under the [commercial license](//github.com/handsontable/handsontable/blob/master/licenses/Pro/handsontable-pro-general-terms.pdf). See the table below for details.

| Name                    	| Localization                    	|
|--------------------------	|---------------------------------	|
| Bind rows with headers   	| /src/plugins/bindRowsWithHeaders 	|
| Collapsing columns       	| /src/plugins/collapsibleColumns 	|
| Summary calculations     	| /src/plugins/columnSummary      	|
| Dropdown menu            	| /src/plugins/dropdownMenu       	|
| Export to file           	| /src/plugins/exportFile         	|
| Filtering                	| /src/plugins/filters            	|
| Formula support          	| /src/plugins/formulas           	|
| Gantt Chart              	| /src/plugins/ganttChart         	|
| Header tooltips          	| /src/plugins/headerTooltips      	|
| Hiding columns           	| /src/plugins/hiddenColumns      	|
| Hiding rows              	| /src/plugins/hiddenRows         	|
| Multi-column sorting     	| /src/plugins/multiColumnSorting 	|
| Nested headers           	| /src/plugins/nestedHeaders      	|
| Nested rows              	| /src/plugins/nestedRows         	|
| Trimming rows            	| /src/plugins/trimRows           	|

<br>

**License key**

Handsontable Pro requires passing a valid license key in the configuration section.
You can find your purchased license key in your account at [my.handsontable.com](//my.handsontable.com/sign-in.html).

An example of what the configuration object should look like:

```javascript
const hot = new Handsontable(container,{
  data: data,
  rowHeaders: true,
  colHeaders: true,
  licenseKey: '00000-00000-00000-00000-00000'
});
```

**Note that the license key is passed as a string so you need to wrap it in quotes ('').**

<br>

Copyrights belong to Handsoncode sp. z o.o.
