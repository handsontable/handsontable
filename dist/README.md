# Handsontable distributions

## Full distribution (recommended)

The full distribution allows you to use Handsontable by just including jQuery and 2 files:
```html
<script src="lib/jquery.min.js"></script>
<script src="dist/jquery.handsontable.full.js"></script>
<link rel="stylesheet" media="screen" href="dist/jquery.handsontable.full.css">
```

**jquery.handsontable.full.js** and **jquery.handsontable.full.css** are compiled with ___all___ the needed dependencies.

Using this has the same effect as loading all the dependencies from the Bare distribution (see below).

## Bare distribution

If you are a "Bob the Builder" kind of hacker, you will need to load Handsontable JS, CSS and their dependecies:
```html
<script src="lib/jquery.min.js"></script>
<script src="dist/jquery.handsontable.js"></script>
<script src="lib/bootstrap-typeahead.js"></script>
<script src="lib/jQuery-contextMenu/jquery.contextMenu.js"></script>
<script src="lib/jQuery-contextMenu/jquery.ui.position.js"></script>
<link rel="stylesheet" media="screen" href="dist/jquery.handsontable.css">
<link rel="stylesheet" media="screen" href="lib/jQuery-contextMenu/jquery.contextMenu.css">
```

**jquery.handsontable.js** and **jquery.handsontable.css** are compiled ___without___ the needed dependencies.