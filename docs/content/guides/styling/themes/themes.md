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
angular:
  id: 1sco6djp
  metaTitle: Themes - Angular Data Grid | Handsontable
searchCategory: Guides
category: Styling
---

# Themes

Use Handsontable's built-in themes or customize its look by adjusting available CSS variables.

[[toc]]

## Overview

Handsontable themes manage most visual elements of the data grid and are easy to customize, thanks to over 180 CSS variables available for each theme. By default, two built-in themes are available: `main`, `horizon` and classic (modern). Both include dark and light modes that automatically detect your application's preferred color scheme.

## Built-in themes

The `main` ([source](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/main.scss)) theme offers a spreadsheet-like interface, perfect for batch-editing tasks and providing users with a familiar experience, similar to other popular spreadsheet software on the market.

The `horizon` ([source](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/horizon.scss)) theme, on the other hand, is better suited for data display and analysis. It hides the vertical lines between columns, giving it a cleaner and more lightweight feel.

The `classic (modern)` ([source](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/classic.scss)) theme is a replacement for the old legacy classic theme. It retains the familiar look and feel of the original classic theme, but has been updated to allow customization with CSS variables. This theme is ideal for users who prefer the traditional appearance of Handsontable but want to benefit from the theming system. The `classic (modern)` theme supports both light and dark modes, ensuring a seamless integration with your application's color scheme preferences.

Keep in mind that starting from version `15.0`, importing a theme is required.

::: only-for javascript

::: example #exampleTheme --html 1 --js 2 --ts 3 --css 4
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


::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/styling/themes/angular/example1.ts)
@[code](@/content/guides/styling/themes/angular/example1.html)

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

::: only-for angular

The recommended approach for applying global styles is to include them in the `styles` array defined in the `angular.json` configuration file.

```json5
{
  // ...
  "styles": [
    "src/styles.css",
    "node_modules/handsontable/styles/handsontable.min.css",
    "node_modules/handsontable/styles/ht-theme-main.min.css"
  ],
  // ...
}
```

:::

Alternatively, you can import the necessary files from the recommended CDN such as [JSDelivr](https://jsdelivr.com/package/npm/handsontable) or [cdnjs](https://cdnjs.com/libraries/handsontable).

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css" />
```

## Pass a theme name

To use a theme in your app, you need to specify the theme name in the data grid's global settings object. For the `main` theme, you can choose from the following theme modes:

- `ht-theme-main` - light mode
- `ht-theme-main-dark` - dark mode
- `ht-theme-main-dark-auto (recommended)` - auto dark mode

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

::: only-for angular

```html
<hot-table [settings]="{
  themeName: 'ht-theme-main-dark-auto'
}">
</hot-table>
```

:::

::: only-for angular

## Global Theme Management

In addition to passing a theme name via the settings object for individual Handsontable instances, you can set a global default theme that applies to all instances. This can be accomplished in two ways:

### Using ApplicationConfig

You can use `ApplicationConfig` to provide a global configuration via the `HOT_GLOBAL_CONFIG` injection token.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig } from '@angular/core';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';
import { AppComponent } from './app/app.component';

export const appConfig: ApplicationConfig = {
  providers: [{
    provide: HOT_GLOBAL_CONFIG,
    useValue: { themeName: 'ht-theme-main-dark-auto' } as HotGlobalConfig
  }],
};

bootstrapApplication(AppComponent, appConfig);
```
This global configuration is then merged with local settings when initializing each Handsontable instance.

### Using HotGlobalConfigService

You can manage the global theme at runtime using the `HotGlobalConfigService`.

```ts
hotConfigService.setConfig({ themeName: 'ht-theme-horizon-dark' });
```
When the configuration changes, all Handsontable instances will automatically update their settings.

### Theme settings hierarchy

When both a global theme and a local themeName are defined, the local setting takes precedence. This means:
- Local Setting: If a `<hot-table>` component is provided with a `themeName` via its `settings` input, that value overrides the global default.
- Global Setting: If no local theme is specified, the component falls back to the global configuration provided via the injection token or the configuration service.

This hierarchy ensures that you can define a consistent default theme for your entire application while still allowing individual components to customize their appearance when needed.

## The classic (legacy) theme

The classic (legacy) CSS file ([`handsontable.full.min.css`](https://github.com/handsontable/handsontable/blob/master/handsontable/dist/handsontable.full.min.css)) was the default theme up until `version 15` (released in December 2024). This theme is a legacy theme and will be removed in version 17.0.0.
  
## Known limitations

In some cases, global styles enforced by the browser or operating system can impact the appearance of the data grid. This is a common challenge faced by all websites, not just Handsontable. Here are two specific scenarios and how to handle them:

- **High contrast mode in Windows**: To style the component when Windows' high contrast mode is active, use the `forced-colors` media query. This allows you to detect and adapt to forced color settings. [Read more](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/)
- **Auto dark theme in Google Chrome**: Chrome automatically applies a dark theme in some scenarios. To detect and manage this behavior, refer to the official [Chrome guide](https://developer.chrome.com/blog/auto-dark-theme)

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/issues/) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
