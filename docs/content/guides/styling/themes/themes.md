---
id: jn1po47i
title: Themes
metaTitle: Themes - JavaScript Data Grid | Handsontable
description: Use one of the built-in themes - main and horizon. They switch between light and dark modes automatically.
permalink: /themes
canonicalUrl: /themes
tags:
  - styling
  - theming
  - themes
  - figma
  - UI kit
  - CSS variables
  - light theme
  - dark theme
  - colors
  - palette
  - appearance
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

Handsontable themes manage most visual elements of the data grid and are easy to customize, thanks to over 180 CSS variables available for each theme. By default, two built-in themes are available: `main` and `horizon`. Both include dark and light modes that automatically detect your application's preferred color scheme.

## Built-in themes

The `main` ([source](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/main.scss)) theme offers a spreadsheet-like interface, perfect for batch-editing tasks and providing users with a familiar experience, similar to other popular spreadsheet software on the market.

The `horizon` ([source](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/horizon.scss)) theme, on the other hand, is better suited for data display and analysis. It hides the vertical lines between columns, giving it a cleaner and more lightweight feel.

Keep in mind that starting from version `15.0`, importing a theme is required.

::: only-for javascript

::: example #exampleTheme .disable-auto-theme --html 1 --js 2 --ts 3 --css 4
@[code](@/content/guides/styling/themes/javascript/exampleTheme.html)
@[code](@/content/guides/styling/themes/javascript/exampleTheme.js)
@[code](@/content/guides/styling/themes/javascript/exampleTheme.ts)
@[code](@/content/guides/styling/themes/javascript/exampleTheme.css)
:::

:::

::: only-for react

::: example #exampleTheme .disable-auto-theme :react --js 1 --ts 2 --css 3
@[code](@/content/guides/styling/themes/react/exampleTheme.jsx)
@[code](@/content/guides/styling/themes/react/exampleTheme.tsx)
@[code](@/content/guides/styling/themes/react/exampleTheme.css)
:::

:::

## Light and dark modes

Each theme comes with three modes:

- Light mode
- Dark mode
- Auto-dark mode

The light and dark modes ignore the parent container's color scheme and remain either light or dark regardless the `prefers-color-scheme` media query value. The auto-dark mode automatically follow the preferred color of the parent container.

Here's a summary of each available theme, mode, and their corresponding file names.

## Use a theme

### Load CSS files

To ensure Handsontable renders correctly, it's required to load both the base and theme CSS files. The base file contains structural styles, while the theme file includes colors, sizes, and other variables needed for the grid.

```js
// ESM (ECMAScript modules)
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// CommonJS
require('handsontable/styles/handsontable.min.css');
require('handsontable/styles/ht-theme-main.min.css');
```

Alternatively, you can import the necessary files from the recommended CDN such as [JSDelivr](https://jsdelivr.com/package/npm/handsontable) or [cdnjs](https://cdnjs.com/libraries/handsontable).

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css" />
```

## Pass a theme name

To use a theme in your app, you need to add the specific class name to the `div` container that holds Handsontable. For the `main` theme, you can choose from the following CSS classes:

- `ht-theme-main` - light mode
- `ht-theme-main-dark` - dark mode
- `ht-theme-main-dark-auto (recommended)` - auto dark mode

```html
<div id="handsontable-example" class="ht-theme-main-dark-auto"></div>
```

Alternatively, you can specify the theme name in the data grid's global settings object. This method will automatically inject the class name for you, overriding any class name passed in the `div` container.

**Use either this method or the class name in the `div`, but not both.**

::: only-for javascript

```js
const container = document.querySelector('#handsontable-example');

const hot = new Handsontable(container, {
  // theme name with obligatory `ht-theme-*` prefix
  themeName: 'ht-theme-main-dark-auto',
  // other options
});
```

:::

::: only-for react

```jsx
<HotTable
  themeName="ht-theme-main-dark-auto"
/>
```

:::

## Create a custom theme

Creating a custom theme is straightforward. Follow these steps to set up your custom design:

### ① Create a new CSS file

Start by copying one of the CSS files provided with Handsontable, such as [`ht-theme-main.css`](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/main.scss). Rename it to something unique for your project. For this example, let’s name the new theme `falcon`, making the full file name `ht-theme-falcon.css`.

Next, customize the existing variables to match your design requirements. If you need icons, you can use the ones available in the [GitHub repository](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/utils/_icons.scss) or create your own icon set using the `@use "utils/[theme]/icons";` directive.

### ② Load and apply the theme

Include the new CSS file in your project, ensuring it’s loaded after the base CSS file (`styles/handsontable.min.css`). If you’re using imports, it might look like this:

```js
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-falcon.min.css';
```

Apply the theme in one of two ways:

- Using a CSS class: Add the theme class (e.g., `ht-theme-falcon-dark-auto`) to the container element that holds the data grid.

```html
<div id="handsontable-example" class="ht-theme-falcon-dark-auto"></div>
```

- Using the themeName option: Specify the theme in the configuration, like so:

::: only-for javascript

```js
const hot = new Handsontable(container, {
  themeName: 'ht-theme-falcon',
  // other options
});
```

:::

::: only-for react

```jsx
<HotTable
  themeName="ht-theme-falcon"
  // other options
/>
```

:::

## The classic theme
The classic CSS file ([`handsontable.full.min.css`](https://github.com/handsontable/handsontable/blob/master/handsontable/dist/handsontable.full.min.css)) was the default theme up until `version 15` (released in December 2024). While it will still be supported and tested in future Handsontable updates, it is no longer recommended for new projects.
  
## Known limitations

In some cases, global styles enforced by the browser or operating system can impact the appearance of the data grid. This is a common challenge faced by all websites, not just Handsontable. Here are two specific scenarios and how to handle them:

- **High contrast mode in Windows**: To style the component when Windows' high contrast mode is active, use the `forced-colors` media query. This allows you to detect and adapt to forced color settings. [Read more](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/)
- **Auto dark theme in Google Chrome**: Chrome automatically applies a dark theme in some scenarios. To detect and manage this behavior, refer to the official [Chrome guide](https://developer.chrome.com/blog/auto-dark-theme)
- By default, Handsontable wraps overflowing text within cells. To crop the content, you can apply the following CSS targeting all cells:

```scss
#handsontable-example .handsontable td {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
```
  
## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/issues/) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
