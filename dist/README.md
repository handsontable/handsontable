# Handsontable distributions

## Full distribution (recommended)

The full distribution allows you to use Handsontable by just including 2 files:
```html
<script src="dist/handsontable.full.js"></script>
<link rel="stylesheet" media="screen" href="dist/handsontable.full.css">
```
(It may also require Pikaday and moment.js, if you're using the Datepicker for date input)

**handsontable.full.js** and **handsontable.full.css** are compiled with ___all___ the needed dependencies.

Using this has the same effect as loading all the dependencies from the Bare distribution (see below).

## Bare distribution

If you are a "Bob the Builder" kind of hacker, you will need to load Handsontable JS, CSS and their dependencies:
```html
<script src="dist/handsontable.js"></script>
<script src="lib/numeral.js"></script>
<link rel="stylesheet" media="screen" href="dist/handsontable.css">
```

**handsontable.js** and **handsontable.css** are compiled ___without___ the needed dependencies.

## Custom distribution

If you want to build your own custom Handsontable package distribution check out our [tool](https://github.com/handsontable/hot-builder) designed for this.
