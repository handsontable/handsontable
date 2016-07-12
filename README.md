# [![Build Status](https://raw.githubusercontent.com/handsontable/static-files/master/Images/Logo/Handsontable/Handsontable-logo-300-74.png)](https://handsontable.com)

[**Handsontable**](https://handsontable.com) is a pure JavaScript/HTML5 spreadsheet component with an Excel-like appearance. It can easily integrate with any data source and comes with a variety of useful features like data binding, validation, sorting or powerful custom context menu. Actively supported by the [Handsoncode team](https://handsontable.com/team.html) team and [many contributors](https://github.com/handsontable/handsontable/graphs/contributors).

[![Build status](https://travis-ci.org/handsontable/handsontable.png?branch=master)](https://travis-ci.org/handsontable/handsontable)
[![npm](https://img.shields.io/github/contributors/handsontable/handsontable.svg)](https://github.com/handsontable/handsontable/graphs/contributors)
[![npm](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/handsontable/handsontable/blob/master/LICENSE)

## What to use it for?
We have seen Handsontable being used in many different, sometimes completely unexpected fields. The list below is just to give you a rough idea on what you can do with Handsontable, but it doesn't limit you in any way.

- Database editing
- Configuration controlling
- Data merging
- Team scheduling
- Sales reporting
- Financial analysis

## Installation
There are many ways to install Handsontable but we suggest using npm or Bower.

```
npm install handsontable --save
```
or 
```
bower install handsontable --save
```

### Alternative installation
- [Download ZIP](https://github.com/handsontable/handsontable/archive/master.zip)
- [Download from nuget](https://www.nuget.org/packages/Handsontable/)

### AMD support
If you use a modular script loader then you can require Handsontable just like any other module:

```javascript
require(['handsontable'], function(Handsontable) {
    var hot = new Handsontable(document.getElementById('example'), {
      data: [[1, 2, 3, 4], [1, 2, 3, 4]]
    });
});
```

### CommonJS module support
If you use a CommonJS compatible environment you can use the `require` function to import Handsontable:

```javascript
var handsontable = require('handsontable');
```
To bundle Handsontable with [Browserify](http://browserify.org) you must specify the module names of all required modules:

`browserify main.js -o bundle.js -r moment -r pikaday -r zeroclipboard -r numbro`

## Basic usage
Assuming you have already installed Handsontable, add an empty `<div>` element that will be turned into a spreadsheet:

```html
<div id="example"></div>
```
In the next step, pass a reference to that `<div>` element and fill it with sample data:
```javascript
var data = [
  ["", "Ford", "Volvo", "Toyota", "Honda"],
  ["2016", 10, 11, 12, 13],
  ["2017", 20, 11, 14, 13],
  ["2018", 30, 15, 12, 13]
];

var container = document.getElementById('example');
var hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true
});
```

## Examples
- [Explore our features](https://handsontable.com/examples.html)
- [Basic demo](http://jsfiddle.net/handsoncode/s6t768pq)
- [Handling a large dataset](http://jsfiddle.net/handsoncode/Lp4qn55v)
- [Finance](http://jsfiddle.net/handsoncode/b2g2h7oh)
- [Sport](http://jsfiddle.net/handsoncode/b5rvw5zk)
- [Science](http://jsfiddle.net/handsoncode/g1hnaxtt)

## Resources
- [API Reference](http://docs.handsontable.com/Core.html)
- [List of features](http://docs.handsontable.com/tutorial-features.html)
- [Compatibility](http://docs.handsontable.com/tutorial-compatibility.html)
- [Performance tips](http://docs.handsontable.com/tutorial-performance-tips.html)
- [Roadmap](https://trello.com/b/PztR4hpj/handsontable-roadmap-2016)
- [Known limitations](http://docs.handsontable.com/tutorial-known-limitations.html)

## Commercial version
[Handsontable Pro](https://handsontable.com/pricing.html) is our premium spreadsheet solution packed with business-ready features. It comes with [forum support](https://forum.handsontable.com), where you can find the answers to common questions as well as talk directly with our core team members.

| Pro Feature                 | Description                                                                            	|
|---------------------------	|----------------------------------------------------------------------------------------	|
| Binding rows with headers 	| Bind rows with headers to lock the row number and always display one beside the other. 	|
| Collapsing columns        	| Expand and collapse columns to better fit the content.                                 	|
| Column summary            	| Carry out pre-defined calculations and display the results in Handsontable.                 	|
| Dropdown menu             	| Add a menu to the heading to enable additional operations for the columns.             	|
| Export to file            	| Export data to a flat file like CSV or a string.                                       	|
| Filtering                 	| Display rows that meet your criteria and hide the rest.                                	|
| Gantt Chart               	| Create a simple Gantt Chart using Handsontable.                                        	|
| Header tooltips           	| Display the header label in a tooltip.                                                 	|
| Hiding columns            	| Hide specific columns and show the rest.                                               	|
| Hiding rows               	| Hide specific rows and show the rest.                                                  	|
| Nested headers            	| Create a nested, hierarchical structure of headers to get your data into groups.       	|
| Trimming rows             	| Exclude specific rows from the rendering process so they won't be displayed.           	|

Have questions regarding the Pro version? [Contact us](https://handsontable.com/contact.html?category=general_question) or take a look at the [Frequently Asked Questions](https://handsontable.com/faq.html).

## Screenshot
<p align="center">
<img src="https://raw.githubusercontent.com/handsontable/static-files/master/Images/Screenshots/handsontable-showcase.png" align="center" alt="Handsontable Screenshot"/>
</p>

## Community
- [Forum](https://forum.handsontable.com)
- [Google group](https://groups.google.com/forum/#!forum/handsontable)
- [GitHub](https://github.com/handsontable/handsontable/issues)
- [Twitter](https://twitter.com/handsontable)

## Contributing
If you would like to help us in writing the code, please take a look into [CONTRIBUTING.md](https://github.com/handsontable/handsontable/blob/master/CONTRIBUTING.md)

## Copyright and license
Handsontable is released under the [MIT license](https://github.com/handsontable/handsontable/blob/master/LICENSE).

Copyrights belong to Handsoncode sp. z o.o.
