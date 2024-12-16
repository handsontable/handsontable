---
id: xt5zuczu
title: Packages
metaTitle: Packages - JavaScript Data Grid | Handsontable
description: Instantly add Handsontable to your web app, using pre-built UMD packages of JavaScript and CSS.
permalink: /packages
canonicalUrl: /packages
searchCategory: Guides
category: Tools and building
---

# Packages

Instantly add Handsontable to your web app, using pre-built UMD packages of JavaScript and CSS.

[[toc]]

## Full distribution (recommended)

To utilize the full distribution of Handsontable, you can choose either the classic styles or the theme-based styles. Do not mix files from both options.

### Option 1: Classic Styles
Include the following files in your project:
```html
<script src="dist/handsontable.full.js"></script>
<link href="dist/handsontable.full.css" rel="stylesheet">
```
Alternatively, you can opt for the minified versions:
```html
<script src="dist/handsontable.full.min.js"></script>
<link href="dist/handsontable.full.min.css" rel="stylesheet">
```

Both **handsontable.full.js** and **handsontable.full.css** are bundled with all necessary dependencies for seamless integration.

### Option 2: Theme-Based Styles
For projects utilizing themes, include the following files in the specified order:
```html
<script src="dist/handsontable.full.js"></script>
<link href="styles/handsontable.css" rel="stylesheet">
<link href="styles/ht-theme-[name].css" rel="stylesheet">
```
Here, `[name]` represents the desired theme. Currently, the available themes are **main** and **horizon**. 

Minified versions of these files are also available:
```html
<script src="dist/handsontable.full.min.js"></script>
<link href="styles/handsontable.min.css" rel="stylesheet">
<link href="styles/ht-theme-[name].min.css" rel="stylesheet">
```

::: tip

Let's assume we're using the `main` theme for the rest of this page.

If you'd rather use a different theme or classic styles, replace the `css` files accordingly.

:::

## Bare distribution

If you are a "Bob the Builder" kind of hacker, you will need to load Handsontable JS, CSS and their dependencies:
```html
<!-- Required dependencies (as external scripts) -->
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@handsontable/pikaday@1.0.0/pikaday.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/numbro@2.1.2/dist/numbro.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@2.4.5/dist/purify.js"></script>

<!-- Handsontable bare files -->
<script src="dist/handsontable.js"></script>
<link href="styles/handsontable.css" rel="stylesheet">
<link href="styles/ht-theme-main.css" rel="stylesheet">
```

**handsontable.js** is compiled ___without___ the needed dependencies. You will have to include `pikaday.js`, `moment.js`, `numbro.js`, and `dompurify` on your own, ie. from JSDelivr CDN.

## Internationalization
It is possible to include files which will register languages dictionaries. They allow to translate parts of Handsontable UI. You can either use only particular languages files or include all of them at once as a single file.

All the information about the API and additional options can be found at our [official documentation](@/guides/internationalization/language/language.md).

```html
<!-- Internationalization, Polish - Poland language-country file -->
<script src="dist/languages/pl-PL.js"></script>

<!-- Internationalization, all available language files in one file -->
<script src="dist/languages/all.js"></script>
```

## Custom distribution

If you want to build your own custom Handsontable package distribution check out our [guide](@/guides/tools-and-building/custom-builds/custom-builds.md) covering all the details.

## Related guides

<div class="boxes-list gray">

- [Building](@/guides/tools-and-building/custom-builds/custom-builds.md)
- [Testing](@/guides/tools-and-building/testing/testing.md)

</div>
