# Handsontable distributions

## Full distribution (recommended)

The full distribution allows you to use Handsontable by including just 2 files:
```html
<script src="dist/handsontable.full.js"></script>
<link rel="stylesheet" media="screen" href="dist/handsontable.full.css">
```
You can also use minified files:  
```html
<script src="dist/handsontable.full.min.js"></script>
<link rel="stylesheet" media="screen" href="dist/handsontable.full.min.css">
```

If you use a date picker or numeric cell types, you will also have to include Pikaday, moment.js and numbro.js.

**handsontable.full.js** and **handsontable.full.css** are compiled with ___all___ the needed dependencies (except language files - see below).

## Bare distribution

If you are a "Bob the Builder" kind of hacker, you will need to load Handsontable JS, CSS and their dependencies:
```html
<!-- Required dependencies (as external scripts) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.5.1/pikaday.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/numbro/1.11.0/numbro.min.js"></script>

<!-- Handsontable bare files -->
<script src="dist/handsontable.js"></script>
<link rel="stylesheet" media="screen" href="https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.5.1/css/pikaday.min.css">
<link rel="stylesheet" media="screen" href="dist/handsontable.css">
```

**handsontable.js** and **handsontable.css** are compiled ___without___ the needed dependencies.

## Internationalization
Since Handsontable [35.0.0](https://docs.handsontable.com/0.35.0/tutorial-release-notes.html) it is possible to include files which will register languages dictionaries. They allow to translate parts of Handsontable UI. You can either use only particular languages files or include all of them at once as a single file.

All the information about the API and additional options can be found at our [official documentation](https://docs.handsontable.com/0.35.0/tutorial-internationalization.html).

```html
<!-- Internationalization, Polish - Poland language-country file -->
<script src="languages/pl-PL.js"></script>

<!-- Internationalization, all available language files in one file -->
<script src="languages/all.js"></script>
```

## Custom distribution

If you want to build your own custom Handsontable package distribution check out our [guide](https://docs.handsontable.com/tutorial-custom-build.html) covering all the details.
