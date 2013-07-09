# Handsontable [![Build Status](https://travis-ci.org/warpech/jquery-handsontable.png?branch=master)](https://travis-ci.org/warpech/jquery-handsontable)

Handsontable is a minimalistic approach to Excel-like table editor in HTML & jQuery. Requires jQuery 1.9+ or 2.0+ (may work with 1.7+ too, but there are known issues with [IE10](https://github.com/warpech/jquery-handsontable/issues/410)).

Runs in IE8, IE9, IE10, Firefox, Chrome, Safari and Opera.

See the demos at http://handsontable.com/ or fork the example on [JSFiddle](http://jsfiddle.net/warpech/hU6Kz/).

## Usage

First, include all the dependencies. All the files that you need (apart from jQuery) are in the `dist\` directory:

```html
<script src="../lib/jquery.min.js"></script>
<script src="dist/jquery.handsontable.full.js"></script>
<link rel="stylesheet" media="screen" href="dist/jquery.handsontable.full.css">
```

Then, run `handsontable()` constructor on an empty div. After that, load some data if you wish:

```html
<div id="dataTable"></div>
<script>
  var data = [
    ["", "Kia", "Nissan", "Toyota", "Honda"],
    ["2008", 10, 11, 12, 13],
    ["2009", 20, 11, 14, 13],
    ["2010", 30, 15, 12, 13]
  ];
  $("#dataTable").handsontable({
    data: data,
    startRows: 6,
    startCols: 8
  });
</script>
```

## API Reference

Check out the new wiki pages: [Options](https://github.com/warpech/jquery-handsontable/wiki/Options), [Methods](https://github.com/warpech/jquery-handsontable/wiki/Methods) and [Events](https://github.com/warpech/jquery-handsontable/wiki/Events)

## Changelog

To see the list of recent changes, see the [CHANGELOG.md](./CHANGELOG.md).

## Questions

Please use the :new: [Handsontable Google Group](https://groups.google.com/forum/?fromgroups=#!forum/handsontable) for posting general **Questions**.

Make sure the question was not answered before in [FAQ](https://github.com/warpech/jquery-handsontable/wiki/FAQ) or [GitHub Issues](https://github.com/warpech/jquery-handsontable/issues)

## Reporting bugs and feature requests

Please follow this guidelines when reporting bugs and feature requests:

1. Use [GitHub Issues](https://github.com/warpech/jquery-handsontable/issues) board to report bugs and feature requests (not my email address)
2. Please **always** write steps to reporoduce the error. That way I can focus on fixing the bug, not scratching my had how to reproduce it.
3. If possible, please add a JSFiddle link that shows the problem (start by forking [this fiddle](http://jsfiddle.net/warpech/hU6Kz/)). It saves me much time.
4. If you can't reproduce it on JSFiddle, please add a screenshot that shows the problem. JSFiddle is much more appreciated because it lets me start fixing straight away.

Thanks for understanding!

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## Similar projects

I want to stay motivated to keep Handsontable the best possible editable datagrid on the Web. Therefore, I invite you to check out alternative projects. I would love to receive feedback if you would like to import some of their features to Handsontable.

 - [DataTables](http://datatables.net/)
 - [SlickGrid](https://github.com/mleibman/SlickGrid)
 - [jqGrid](http://www.trirand.com/blog/)
 - [jTable](http://www.jtable.org/)
 - [jui_datagrid](http://www.pontikis.net/labs/jui_datagrid/)
 - [ParamQuery](http://paramquery.com/)
 - [Ember Table](http://addepar.github.io/ember-table/)
 - [Backgrid.js](http://backgridjs.com/)
 - [dgrid](http://dojofoundation.org/packages/dgrid/)

## License

(The MIT License)

Copyright (c) 2012 Marcin Warpechowski &lt;marcin@nextgen.pl&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
