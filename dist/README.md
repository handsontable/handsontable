# Handsontable distributions

## Full distribution (recommended)

The full distribution allows you to use Handsontable by just including 2 files:
```html
<script src="dist/handsontable.full.js"></script>
<link rel="stylesheet" media="screen" href="dist/handsontable.full.css">
```
(It may also require Pikaday, moment.js and numbro.js, if you're using the Datepicker for date input or numeric cell types)

**handsontable.full.js** and **handsontable.full.css** are compiled with ___all___ the needed dependencies (except extra internationizations - see below).

Using this has the same effect as loading all the dependencies from the Bare distribution (see below).

## Bare distribution

If you are a "Bob the Builder" kind of hacker, you will need to load Handsontable JS, CSS and their dependencies:
```html
<!-- Required dependencies (as external scripts) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.5.1/pikaday.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/numbro/1.9.3/numbro.min.js"></script>

<!-- Handsontable bare files -->
<script src="dist/handsontable.js"></script>
<link rel="stylesheet" media="screen" href="https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.5.1/css/pikaday.min.css">
<link rel="stylesheet" media="screen" href="dist/handsontable.css">
```

**handsontable.js** and **handsontable.css** are compiled ___without___ the needed dependencies.

## Internationalization
Since Handsontable [35.0.0](https://docs.handsontable.com/0.34.5/tutorial-release-notes.html) it is possible to include files which will register languages dictionaries. They allow to translate parts of Handsontable UI. You can include only language dictionary you need **or** all possible language dictionaries. List of available translations can be found [here](https://docs.handsontable.com/0.35.0/internationalization.html).

```html
<!-- Internationalization, Polish - Poland language-country file -->
<!-- pl-PL language can be used after loading file -->
<script src="languages/pl-PL.js"></script>

<!-- Internationalization, all available language dictionaries
<!-- all possible languages can be used after loading file -->
<script src="languages/all.js"></script>
```

## Custom distribution

If you want to build your own custom Handsontable package distribution check out our [tool](https://github.com/handsontable/hot-builder) designed for this.
