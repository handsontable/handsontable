# Handsontable [![Build Status](https://travis-ci.org/handsontable/handsontable.png?branch=master)](https://travis-ci.org/handsontable/handsontable)

Handsontable is a data grid component with an Excel-like appearance. Built in JavaScript, it integrates with any data source and comes with [features](http://docs.handsontable.com/0.17.0/tutorial-features.html) like data validation, sorting, grouping, data binding or column ordering. Actively supported by the Handsoncode team and the GitHub community.

Check out the demos at http://handsontable.com/examples.html or fork the example on
[JSFiddle](http://jsfiddle.net/js_ziggle/hU6Kz/3228/) to see Handsontable in action.

- - -

### Quick start

1. A recommended way to install Handsontable is through [Bower](http://bower.io/search/?q=handsontable) package manager using the following command:

  `bower install handsontable --save`

  Alternatively, you can [download it in a ZIP file](https://github.com/handsontable/handsontable/archive/master.zip).

2. After Handsontable is downloaded, embed the code into your project. All the files that you need are in the `dist\` directory:

  ```html
  <script src="dist/handsontable.full.js"></script>
  <link rel="stylesheet" media="screen" href="dist/handsontable.full.css">
  ```

3. Then, create a new `Handsontable` object, passing a reference to an empty div as a first argument. After that, load some data if you wish:

  ```html
  <div id="example"></div>

  <script>
    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];
    
   var container = document.getElementById('example');
    var hot = new Handsontable(container,
     {
       data: data
      });
  </script>
  ```

### API Reference

- [Core methods](http://docs.handsontable.com/Core.html)
- [Options](http://docs.handsontable.com/Options.html)
- [Hooks](http://docs.handsontable.com/Hooks.html)

### Troubleshooting

Please follow this guidelines when reporting bugs and feature requests:

1. Use [GitHub Issues](https://github.com/handsontable/handsontable/issues) board to report bugs and feature requests (not our email address)
2. Please **always** write steps to reproduce the error. That way we can focus on fixing the bug, not scratching our heads trying to reproduce it.
3. If possible, please add a JSFiddle link that shows the problem (start by forking [this fiddle](http://jsfiddle.net/js_ziggle/hU6Kz/3228/)). It saves us much time.
4. If you can't reproduce it on JSFiddle, please add a screenshot that shows the problem. JSFiddle is much more appreciated because it lets us start fixing straight away.

Thanks for understanding!

### Compatibility

Handsontable is compatible with IE 9+, Firefox, Chrome, Safari and Opera.

### Want to help?

Please see [CONTRIBUTING.md](CONTRIBUTING.md)

### Changelog

To see the list of recent changes, see [Releases section](https://github.com/handsontable/handsontable/releases).

### License

The MIT License (see the [LICENSE](https://github.com/handsontable/handsontable/blob/master/LICENSE) file for the full text)

### Contact

You can contact us at hello@handsontable.com.
