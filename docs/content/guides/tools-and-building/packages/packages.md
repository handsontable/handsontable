---
type: reference
title: Packages
metaTitle: Packages - JavaScript Data Grid | Handsontable
description: Instantly add Handsontable to your web app, using pre-built UMD packages of JavaScript and CSS.
permalink: /packages
canonicalUrl: /packages
searchCategory: Guides
category: Tools and building
---
Handsontable is distributed as multiple packages targeting different use cases. This page describes each option and when to use it.

[[toc]]

## Full distribution (recommended)

To utilize the full distribution of Handsontable, you can choose either the default (main) styles or other theme styles.

### Option 1: Default (main) Styles
Include the following files in your project:
```html
<script src="dist/handsontable.full.js"></script>
```
Alternatively, you can opt for the minified versions:
```html
<script src="dist/handsontable.full.min.js"></script>
```

The **handsontable.full.js** are bundled with all necessary dependencies for seamless integration.

### Option 2: Theme-Based Styles

For projects utilizing themes, use the **Theme API** (recommended) or load theme **CSS files**. Available built-in themes are **main**, **horizon**, and **classic**.

#### Theme API (recommended)

Load the main script and the theme script, then pass the theme object to the `theme` option. The theme auto-registers when the script loads; use `Handsontable.themes.getTheme()` to retrieve it and configure color scheme or density at runtime.

```html
<script src="dist/handsontable.full.min.js"></script>
<script src="dist/themes/[name].min.js"></script>

<script>
  const theme = Handsontable.themes.getTheme('main')
    .setColorScheme('auto')   // 'light', 'dark', or 'auto'
    .setDensityType('default'); // 'default', 'compact', or 'comfortable'

  const hot = new Handsontable(document.getElementById('container'), {
    theme: theme,
    // ... other options
  });
</script>
```

Replace `[name]` with **main**, **horizon**, or **classic** (e.g. `dist/themes/main.min.js`). Unminified versions are also available: `dist/themes/[name].js`.

#### CSS files (alternative)

Alternatively, load a theme CSS file and pass the theme name as a string to the `theme` option:

```html
<script src="dist/handsontable.full.min.js"></script>
<link href="styles/ht-theme-[name].min.css" rel="stylesheet">

<script>
  const hot = new Handsontable(document.getElementById('container'), {
    theme: 'ht-theme-main',  // e.g. ht-theme-main, ht-theme-horizon, ht-theme-classic
    // ... other options
  });
</script>
```

Use `styles/ht-theme-[name].css` for development or `styles/ht-theme-[name].min.css` for production.

::: tip

Let's assume we're using the `horizon` theme for the rest of this page.

If you'd rather use a different theme, replace the theme script or CSS file and the theme name accordingly. For more on the Theme API and customization, see the [Themes](@/guides/styling/themes/themes.md) guide.

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
<link href="styles/ht-theme-horizon.css" rel="stylesheet">
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

<div class="boxes-list">

- [Building](@/guides/tools-and-building/custom-builds/custom-builds.md)
- [Testing](@/guides/tools-and-building/testing/testing.md)

</div>

## Related

<div class="boxes-list">

- [Modules](@/guides/tools-and-building/modules/modules.md)
- [Themes](@/guides/styling/themes/themes.md)

</div>