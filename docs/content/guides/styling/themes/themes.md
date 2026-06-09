---
type: how-to
id: jn1po47i
title: Themes
metaTitle: Themes - JavaScript Data Grid | Handsontable
description: Apply themes using the Theme API or CSS files. Built-in themes include main, horizon, and classic with automatic light and dark modes.
permalink: /themes
canonicalUrl: /themes
tags:
  - styling
  - theming
  - themes
  - Theme API
  - registerTheme
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
vue:
  id: ioop937e
  metaTitle: Themes - Vue Data Grid | Handsontable
searchCategory: Guides
category: Styling
---
Use Handsontable's built-in themes or customize its look using the Theme API or CSS variables.

[[toc]]

## Overview

Handsontable themes manage most visual elements of the data grid. Three built-in themes are available: `main`, `horizon`, and `classic`. All themes include dark and light modes.

The recommended way to apply themes is using the **Theme API**, which allows you to register and configure themes programmatically with runtime features like density modes and color schemes. Alternatively, you can use **CSS files** and pass the theme name as a string for a simpler setup.

## Built-in themes

The `main` theme offers a spreadsheet-like interface, perfect for batch-editing tasks and providing users with a familiar experience, similar to other popular spreadsheet software on the market.

The `horizon` theme, on the other hand, is better suited for data display and analysis. It hides the vertical lines between columns, giving it a cleaner and more lightweight feel.

The `classic` theme is a replacement for the old legacy style. It retains the familiar look and feel of the original legacy styles, but has been updated to allow customization with CSS variables. This theme is ideal for users who prefer the traditional appearance of Handsontable but want to benefit from the theming system. The `classic` theme supports both light and dark modes, ensuring a seamless integration with your application's color scheme preferences.

Keep in mind that starting from version `15.0`, importing a theme is required.

::: tip Default theme

If you want to use the `main` theme without any modifications, you don't need to configure anything. Handsontable will automatically use the `main` theme with default settings.

:::

::: only-for javascript

::: example #exampleTheme --html 1 --js 2 --ts 3 --css 4
@[code](@/content/guides/styling/themes/javascript/exampleTheme.html)
@[code collapse={9-110}](@/content/guides/styling/themes/javascript/exampleTheme.js)
@[code collapse={9-111}](@/content/guides/styling/themes/javascript/exampleTheme.ts)
@[code](@/content/guides/styling/themes/javascript/exampleTheme.css)
:::

:::

::: only-for react

::: example #exampleTheme .disable-auto-theme :react --js 1 --ts 2 --css 3
@[code collapse={13-114}](@/content/guides/styling/themes/react/exampleTheme.jsx)
@[code collapse={14-115}](@/content/guides/styling/themes/react/exampleTheme.tsx)
@[code](@/content/guides/styling/themes/react/exampleTheme.css)
:::

:::


::: only-for angular

::: example #example1 :angular --css 1 --ts 2 --html 3
@[code](@/content/guides/styling/themes/angular/exampleTheme.css)
@[code](@/content/guides/styling/themes/angular/example1.ts)
@[code](@/content/guides/styling/themes/angular/example1.html)
:::

:::

::: only-for vue

::: example #exampleTheme .disable-auto-theme :vue3 --css 1

@[code](@/content/guides/styling/themes/vue/exampleTheme.css)
@[code collapse={14-116,221-233}](@/content/guides/styling/themes/vue/exampleTheme.vue)

:::

:::

## Light and dark modes

Each theme comes with three modes:

- Light mode
- Dark mode
- Auto mode

When using the Theme API, you can configure the color scheme using `setColorScheme()` with `'light'`, `'dark'`, or `'auto'` values. The `'auto'` option allows programmatic control over light/dark switching based on your application's logic.

When using CSS files, color scheme switching is controlled through CSS class names. Use `ht-theme-{name}` for light mode, `ht-theme-{name}-dark` for dark mode, or `ht-theme-{name}-dark-auto` for automatic switching based on system preferences (e.g., `ht-theme-main`, `ht-theme-main-dark`, `ht-theme-main-dark-auto`).


## Use a theme

There are two ways to apply a theme. The recommended approach is to use the Theme API with a theme object, which provides full access to runtime configuration features like density modes and color schemes.

### Option 1: Using the Theme API (recommended)

The Theme API allows you to import and register themes programmatically. This approach provides runtime access to theme customization features.

#### Step 1. Import a theme

::: only-for javascript

```js
import Handsontable from 'handsontable';
import { classicTheme } from 'handsontable/themes';

const hot = new Handsontable(container, {
  theme: classicTheme,
  // ... other options
});
```

:::

::: only-for react

```jsx
import { HotTable } from '@handsontable/react-wrapper';
import { mainTheme, registerTheme } from 'handsontable/themes';

function App() {
  return (
    <HotTable
      theme={mainTheme}
      // ... other options
    />
  );
}
```

:::

::: only-for angular

```ts
import { mainTheme, registerTheme } from 'handsontable/themes';

// In your component
@Component({
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  hotSettings = {
    theme: mainTheme,
    // ... other options
  };
}
```

:::

::: only-for vue

```ts
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { mainTheme } from 'handsontable/themes';

registerAllModules();

const hotSettings = ref({
  theme: mainTheme,
  // ... other options
  licenseKey: 'non-commercial-and-evaluation',
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

#### Step 2. Configure the theme

You can configure the theme before creating the instance using the builder pattern:

::: only-for javascript

```js
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')   // 'light', 'dark', or 'auto'
  .setDensityType('comfortable');  // 'default', 'compact', or 'comfortable'

const hot = new Handsontable(container, {
  theme,
});
```

Or configure it after init by retrieving the registered theme with `getTheme()` (the theme is registered when you pass it to the config):

```js
import { mainTheme, getTheme } from 'handsontable/themes';

const hot = new Handsontable(container, {
  theme: mainTheme,
});

getTheme('main')
  ?.setColorScheme('auto')
  ?.setDensityType('comfortable');
```

**UMD build (script tags)**

When using Handsontable via CDN or script tags, load the theme script after the main Handsontable script. The theme auto-registers itself, and you can retrieve it using `getTheme()`:

```html
<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/themes/main.min.js"></script>

<script>
  // The theme is auto-registered when the script loads
  // Retrieve it using getTheme()
  const theme = Handsontable.themes.getTheme('main')
    .setColorScheme('auto')
    .setDensityType('default');

  const hot = new Handsontable(document.getElementById('container'), {
    theme: theme,
    // ... other options
  });
</script>
```

:::

::: only-for react

```jsx
import { HotTable } from '@handsontable/react-wrapper';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')
  .setDensityType('comfortable');

function App() {
  return (
    <HotTable
      theme={theme}
      // ... other options
    />
  );
}
```

:::

::: only-for angular

```ts
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')
  .setDensityType('comfortable');

// In your component
@Component({
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  hotSettings = {
    theme: theme,
    // ... other options
  };
}
```

:::

::: only-for vue

```ts
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')
  .setDensityType('comfortable');

const hotSettings = ref({
  theme: theme,
  // ... other options
  licenseKey: 'non-commercial-and-evaluation',
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

### Option 2: Using CSS files

Alternatively, you can load theme CSS files and pass the theme name as a string to the `theme` option.

#### Step 1. Load CSS files

To ensure Handsontable renders correctly, it's required to load both the base and theme CSS files. The base file contains structural styles, while the theme file includes colors, sizes, and other variables needed for the grid.

```js
// ESM (ECMAScript modules)
import 'handsontable/styles/ht-theme-main.min.css';

// CommonJS
require('handsontable/styles/ht-theme-main.min.css');
```

::: only-for angular

The recommended approach for applying global styles is to include them in the `styles` array defined in the `angular.json` configuration file.

```json5
{
  // ...
  "styles": [
    "src/styles.css",
    "node_modules/handsontable/styles/ht-theme-main.min.css"
  ],
  // ...
}
```

:::

Alternatively, you can import the necessary files from the recommended CDN such as [JSDelivr](https://jsdelivr.com/package/npm/handsontable) or [cdnjs](https://cdnjs.com/libraries/handsontable).

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css" />
```

#### Step 2. Pass a theme name

To use a theme, specify the theme name in the data grid's global settings object:

::: only-for javascript

```js
const container = document.querySelector('#handsontable-example');

const hot = new Handsontable(container, {
  // theme name with obligatory `ht-theme-*` prefix
  theme: 'ht-theme-main',
  // other options
});
```

:::

::: only-for react

```jsx
<HotTable
  theme="ht-theme-main"
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  theme: 'ht-theme-main'
}">
</hot-table>
```

:::

::: only-for vue

```ts
const hotSettings = ref({
  theme: 'ht-theme-main',
  // ... other options
  licenseKey: 'non-commercial-and-evaluation',
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

::: only-for angular

## Global Theme Management

In addition to passing a theme via the settings object for individual Handsontable instances, you can set a global default theme that applies to all instances. This can be accomplished in two ways:

### Using ApplicationConfig

You can use `ApplicationConfig` to provide a global configuration via the `HOT_GLOBAL_CONFIG` injection token.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig } from '@angular/core';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';
import { mainTheme, registerTheme } from 'handsontable/themes';
import { AppComponent } from './app/app.component';

const theme = registerTheme(mainTheme).setColorScheme('auto');

export const appConfig: ApplicationConfig = {
  providers: [{
    provide: HOT_GLOBAL_CONFIG,
    useValue: { theme: theme } as HotGlobalConfig
  }],
};

bootstrapApplication(AppComponent, appConfig);
```
This global configuration is then merged with local settings when initializing each Handsontable instance.

### Using HotGlobalConfigService

You can manage the global theme at runtime using the `HotGlobalConfigService`.

```ts
import { horizonTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(horizonTheme).setColorScheme('dark');

hotConfigService.setConfig({ theme: theme });
```
When the configuration changes, all Handsontable instances will automatically update their settings.

### Theme settings hierarchy

When both a global theme and a local theme are defined, the local setting takes precedence. This means:
- Local Setting: If a `<hot-table>` component is provided with a `theme` via its `settings` input, that value overrides the global default.
- Global Setting: If no local theme is specified, the component falls back to the global configuration provided via the injection token or the configuration service.

This hierarchy ensures that you can define a consistent default theme for your entire application while still allowing individual components to customize their appearance when needed.

:::

## Theme reference

### Theme API parameters

When registering a theme with `registerTheme()` or updating it using the `params()` method, you can configure the following keys:

| Key           | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `name`        | Theme name string (can only be set during `registerTheme()`, cannot be updated via `params()`) |
| `sizing`      | Size scale values (`size_0` through `size_10`)                                                 |
| `density`     | Density type (`'default'`, `'compact'`, `'comfortable'`) or density configuration object       |
| `icons`       | SVG icon definitions                                                                           |
| `colors`      | Color palette with nested color values                                                         |
| `tokens`      | Design tokens for visual properties                                                            |
| `colorScheme` | Color scheme (`'light'`, `'dark'`, or `'auto'`)                                                |

#### Token value references

Token values support a powerful reference system using dot notation. Instead of hardcoding values, you can reference values from other configuration namespaces:

| Reference pattern | Example                    | Description                        |
| ----------------- | -------------------------- | ---------------------------------- |
| Direct value      | `'14px'`                   | Use a literal CSS value            |
| `tokens.*`        | `'tokens.foregroundColor'` | Reference another token value      |
| `sizing.*`        | `'sizing.size_4'`          | Reference a sizing scale value     |
| `colors.*`        | `'colors.primary.500'`     | Reference a color from the palette |
| `density.*`       | `'density.gap'`            | Reference a density-specific value |

##### Sizing references

The sizing scale provides consistent spacing values:

```js
myTheme.params({
  tokens: {
    iconSize: 'sizing.size_5',             // References e.g. 20px
    wrapperBorderRadius: 'sizing.size_2',  // References e.g. 8px
  },
});
```

##### Color references

Colors use a hierarchical structure with dot notation for nested values:

```js
myTheme.params({
  tokens: {
    accentColor: 'colors.primary.500',      // References primary color
    borderColor: 'colors.palette.200',      // References palette color
    backgroundColor: 'colors.white',        // References base white color
  },
});
```

##### Density references

Density values adjust spacing based on the selected density type:

```js
myTheme.params({
  tokens: {
    cellHorizontalPadding: 'density.cellHorizontal',
    buttonVerticalPadding: 'density.buttonVertical',
    gapSize: 'density.gap',
  },
});
```

##### Token cross-references

Tokens can reference other tokens for consistent styling:

```js
myTheme.params({
  tokens: {
    barForegroundColor: 'tokens.foregroundColor',
    cellEditorBackgroundColor: 'tokens.backgroundColor',
  },
});
```

#### Light and dark mode values

For tokens that should have different values in light and dark modes, use an array with two values where the first value is for light mode and the second is for dark mode:

```js
myTheme.params({
  tokens: {
    // [lightModeValue, darkModeValue]
    borderColor: ['colors.palette.100', 'colors.palette.700'],
    foregroundColor: ['colors.palette.800', 'colors.palette.200'],
    backgroundColor: ['colors.white', 'colors.palette.950'],
  },
});
```

### CSS files

Handsontable provides CSS files needed to style your data grid. Here's an overview of what's available:

#### Base CSS file

- **`handsontable.css`** / **`handsontable.min.css`** - The base stylesheet containing all structural styles, layout rules, and core functionality. This file is auto-injected by default. You can inject it manually instead, but you must set [`injectCoreCss`](@/api/options.md#injectcorecss) to `false` first. It includes border styles, cell rendering rules, and other fundamental grid components.

#### Theme files

All themes are available in two variants:

- **`ht-theme-{name}.css`** / **`ht-theme-{name}.min.css`** - Complete theme with icons included (where `{name}` is `main`, `horizon`, or `classic`).
- **`ht-theme-{name}-no-icons.css`** / **`ht-theme-{name}-no-icons.min.css`** - Theme without icon styles.

#### Icon files

If you're using a theme without icons (`*-no-icons.css`), you can optionally load separate icon files:

- **`ht-icons-{name}.css`** / **`ht-icons-{name}.min.css`** - Icon styles for the theme (where `{name}` is `main` or `horizon`).

#### Recommended usage

For production, use the minified versions (`.min.css`) to reduce file size and improve load times. For development, you may prefer the unminified versions (`.css`) for easier debugging.

## The legacy theme

The legacy CSS file ([`handsontable.full.min.css`](https://github.com/handsontable/handsontable/blob/master/handsontable/dist/handsontable.full.min.css)) was the default styles up until `version 15` (released in December 2024). These styles are legacy and are removed in version 17.0.0.
  
## Known limitations

In some cases, global styles enforced by the browser or operating system can impact the appearance of the data grid. This is a common challenge faced by all websites, not just Handsontable. Here are two specific scenarios and how to handle them:

- **High contrast mode in Windows**: To style the component when Windows' high contrast mode is active, use the `forced-colors` media query. This allows you to detect and adapt to forced color settings. [Read more](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/)
- **Auto dark theme in Google Chrome**: Chrome automatically applies a dark theme in some scenarios. To detect and manage this behavior, refer to the official [Chrome guide](https://developer.chrome.com/blog/auto-dark-theme)

## Related blog articles

<div class="boxes-list gray">

- [From components to tables: Designing a data table component in your design system](https://handsontable.com/blog/from-components-to-tables-designing-a-data-table-component-in-your-design-system)
- [Handsontable 15.0.0: Introducing Themes and Functional React Wrapper](https://handsontable.com/blog/handsontable-15.0.0-introducing-themes-and-functional-react-wrapper)
- [Handsontable 16.2.0: Simplified Theming and Advanced User Notifications](https://handsontable.com/blog/handsontable-16.2.0-simplified-theming-and-advanced-user-notifications)

</div>

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list">

- [View related topics](https://github.com/handsontable/handsontable/issues/) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>

## Result

Your grid now renders with the theme you configured. You can switch color schemes and density modes at runtime using the Theme API.
