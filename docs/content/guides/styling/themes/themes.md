---
id: jn1po47i
title: Themes
metaTitle: Themes - JavaScript Data Grid | Handsontable
description: Use one of the built-in themes - light and dark - or the auto version, which switches between light and dark modes automatically.
permalink: /themes
canonicalUrl: /themes
tags:
  - styling
  - themes
  - figma
  - UI kit
  - CSS variables
  - light theme
  - dark theme
  - colors
  - appearance
  - look and feel
  - visual tokens
  - design system
react:
  id: jn2po47i
  metaTitle: Themes - React Data Grid | Handsontable
searchCategory: Guides
category: Styling
---

# Themes

[[toc]]

Use Handsontable's built-in themes or customize its look by adjusting available CSS variables.

## Overview

Handsontable themes manage most visual elements of the design and are simple to customize. By default, two built-in themes are available: `main` and `horizon`. Both themes feature dark and light modes that automatically adjust to your app's preferred color scheme.

The themes give you control over grid elements and components, allowing you to customize properties like colors and sizes.

## Built-in themes

Handsontable includes two built-in themes. The `main` theme offers a spreadsheet-like interface, perfect for batch-editing tasks and providing users with a familiar experience, similar to other popular spreadsheet software on the market.

The `horizon` theme, on the other hand, is better suited for data display and analysis. It hides the vertical lines between columns, giving it a cleaner and more lightweight feel.

## Light and dark modes

Each theme comes with three modes:

- Light mode
- Dark mode
- Auto-dark mode

The light and dark modes ignore the parent container's color scheme and remain either light or dark regardless the `prefers-color-scheme` media query value. The auto-dark mode automatically follow the preferred color of the parent container.

Here's a summary of each available theme, mode, and their corresponding file names.

| File name                                         | Root CSS class                                                       | Description                                                                                                                                                                        |
| ----------------------------------------------    | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ht-theme-main.css<br>ht-theme-main.min.css        | ht-theme-main<br>ht-theme-main-dark<br>ht-theme-main-dark-auto       | The main theme resembles spreadsheet software, featuring soft colors primarily from a white and grey palette, with blue accents.                                                   |
| ht-theme-horizon.css<br>ht-theme-horizon.min.css    | ht-theme-horizon<br>ht-theme-horizon-dark<br>ht-theme-horizon-dark-auto | A sleek and elegant theme designed to feel like an enterprise data grid, optimized for improved data readability in internal applications.                                         |
| handsontable.css<br>handsontable.min.css          | Not required                                                         | The classic theme, available only in light mode. While it will continue to be supported and tested in future Handsontable releases, it is not recommended for use in new projects. |

## Load CSS files

To ensure Handsontable works correctly, it's essential to load both the base and theme CSS files. The base file contains structural styles, while the theme file includes colors, sizes, and other crucial variables needed for the grid.

### Import CSS files (recommended)

```js
// Import minified base
import 'handsontable/styles/handsontable.min.css';
// Import minified theme
import 'handsontable/styles/ht-theme-main.min.css';
```

### Load CSS from CDN

Load the necessary files from the recommended CDNs such as [JSDelivr](https://www.jsdelivr.com/package/npm/handsontable) or [cdnjs](https://cdnjs.com/libraries/handsontable).

```js
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css" />
```

### Use with bundlers

If you use Vite, Webpack, Parcel, or any other bundler, you can import CSS files like so:

```js
// ESM (ECMAScript modules)
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.min.css";

// CommonJS
require("handsontable/styles/handsontable.css");
require("handsontable/styles/ht-theme-main.min.css");
```

## Use a theme

To use a theme in your app, you need to add the specific class name to the div container that holds Handsontable. For the `main` theme, you can choose from the following CSS classes:

 - `ht-theme-main`
 - `ht-theme-main-dark`
 - `ht-theme-main-dark-auto (recommended)`

```html
<div id="handsontable-example" class="ht-theme-main-dark-auto"></div>
```

Alternatively, you can specify the theme name in the data grid's global settings object. This method will automatically inject the class name for you, overriding any class name passed in the `div` constructor.

Use either this method or the class name in the `div`, but not both.

```js
const container = document.querySelector('#handsontable-example');

const hot = new Handsontable(container, {
  // theme name with obligatory `ht-theme` prefix
  themeName: 'ht-theme-main-dark-auto'
  // some other options
});
```

## Create custom theme

In order to create 

## Known limitations

In some cases global styles enforced by the browser or operating system might affect Handsontable's appearance.

- The size of the grid and its sub-elements in most cases cannot be set with just CSS. We're working on making this possible by the end of 2024.
- High contrast mode in Microsoft Windows. To handle this, use the `forced-colors` media query.
- Auto dark theme in Google Chrome. To detect the Auto Dark Theme, follow the official [Chrome guide](https://developer.chrome.com/blog/auto-dark-theme).

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/issues/) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
