# Handsontable [![Build Status](https://travis-ci.org/handsontable/handsontable.png?branch=master)](https://travis-ci.org/handsontable/handsontable)

Handsontable is a minimalist approach to Excel-like table editor (datagrid/data grid) in HTML & JavaScript. 

Runs in IE 10+, Firefox, Chrome, Safari and Opera.

See the demos at http://handsontable.com/ or fork the example on [JSFiddle](http://jsfiddle.net/warpech/hU6Kz/).

## Usage

First, include all the dependencies. All the files that you need are in the `dist\` directory:

```html
<script src="dist/handsontable.full.js"></script>
<link rel="stylesheet" media="screen" href="dist/handsontable.full.css">
```

Then, create a new `Handsontable` object, passing a reference to an empty div as a first argument. After that, load some data if you wish:

```html
<div id="hot"></div>
<script>
  var data = [
    ["", "Kia", "Nissan", "Toyota", "Honda"],
    ["2008", 10, 11, 12, 13],
    ["2009", 20, 11, 14, 13],
    ["2010", 30, 15, 12, 13]
  ];
  
  var container = document.getElementById('hot');
  var hot = new Handsontable(container,
    {
      data: data,
      minSpareRows: 1,
      colHeaders: true,
      contextMenu: true
    });
</script>
```

## API Reference

Check out the new wiki pages: [Options](https://github.com/handsontable/handsontable/wiki/Options), [Methods](https://github.com/handsontable/handsontable/wiki/Methods) and [Events](https://github.com/handsontable/handsontable/wiki/Events)

## Changelog

To see the list of recent changes, see [Releases](https://github.com/handsontable/handsontable/releases).

## Questions

Please use the :new: [Handsontable Google Group](https://groups.google.com/forum/?fromgroups=#!forum/handsontable) for posting general **Questions**.

Make sure the question was not answered before in [FAQ](https://github.com/handsontable/handsontable/wiki/FAQ) or [GitHub Issues](https://github.com/handsontable/handsontable/issues)

## Reporting bugs and feature requests

Please follow this guidelines when reporting bugs and feature requests:

1. Use [GitHub Issues](https://github.com/handsontable/handsontable/issues) board to report bugs and feature requests (not my email address)
2. Please **always** write steps to reporoduce the error. That way we can focus on fixing the bug, not scratching our heads trying to reproduce it.
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

## Contact

You can contact us at hello@handsontable.com.

## License

The MIT License (see the [LICENSE](https://github.com/handsontable/handsontable/blob/master/LICENSE) file for the full text)
