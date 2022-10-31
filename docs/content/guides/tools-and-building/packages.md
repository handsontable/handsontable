---
title: Packages
metaTitle: Packages - JavaScript Data Grid | Handsontable
description: Instantly add Handsontable to your web app, using pre-built UMD packages of JavaScript and CSS.
permalink: /packages
canonicalUrl: /packages
searchCategory: Guides
---

# Packages

Instantly add Handsontable to your web app, using pre-built UMD packages of JavaScript and CSS.

[[toc]]

## Full distribution (recommended)

The full distribution allows you to use Handsontable by including just 2 files:
```html
<script src="dist/handsontable.full.js"></script>
<link href="dist/handsontable.full.css" rel="stylesheet">
```
You can also use minified files:
```html
<script src="dist/handsontable.full.min.js"></script>
<link href="dist/handsontable.full.min.css" rel="stylesheet">
```

**handsontable.full.js** and **handsontable.full.css** are compiled with ___all___ the needed dependencies.

## Bare distribution

If you are a "Bob the Builder" kind of hacker, you will need to load Handsontable JS, CSS and their dependencies:
```html
<!-- Required dependencies (as external scripts) -->
<link href="https://cdn.jsdelivr.net/npm/pikaday@1.8.2/css/pikaday.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pikaday@1.8.2/pikaday.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/numbro@2.1.2/dist/numbro.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@2.4.0/dist/purify.js"></script>

<!-- Handsontable bare files -->
<script src="dist/handsontable.js"></script>
<link href="dist/handsontable.css" rel="stylesheet">
```

**handsontable.js** and **handsontable.css** are compiled ___without___ the needed dependencies. You will have to include `pikaday.js`, `moment.js`, `numbro.js`, and `dompurify` on your own ie. from JSDelivr CDN.

## Internationalization
It is possible to include files which will register languages dictionaries. They allow to translate parts of Handsontable UI. You can either use only particular languages files or include all of them at once as a single file.

All the information about the API and additional options can be found at our [official documentation](@/guides/internationalization/language.md).

```html
<!-- Internationalization, Polish - Poland language-country file -->
<script src="dist/languages/pl-PL.js"></script>

<!-- Internationalization, all available language files in one file -->
<script src="dist/languages/all.js"></script>
```

## Custom distribution

If you want to build your own custom Handsontable package distribution check out our [guide](@/guides/tools-and-building/custom-builds.md) covering all the details.

## Related guides

- [Building](@/guides/tools-and-building/custom-builds.md)
- [Testing](@/guides/tools-and-building/testing.md)
