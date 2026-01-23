---
id: sf8vrh9z
title: Migrating from 16.2 to 17.0
metaTitle: Migrating from 16.2 to 17.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 16.2 to Handsontable 17.0, released on [TODO].
permalink: /migration-from-16.2-to-17.0
canonicalUrl: /migration-from-16.2-to-17.0
pageClass: migration-guide
react:
  id: 1k3grh9z
  metaTitle: Migrate from 16.2 to 17.0 - React Data Grid | Handsontable
angular:
  id: bv26a4sd
  metaTitle: Migrate from 16.2 to 17.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 16.2 to 17.0

Migrate from Handsontable 16.2 to Handsontable 17.0, released on [TODO].

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md#_17-0-0).

[[toc]]

## 1. Legacy styles have been removed

Starting from **version 17.0.0**, the legacy stylesheet (`dist/handsontable.full.min.css`) has been completely removed from Handsontable. If you're upgrading from an earlier version and still using the legacy styles, you must migrate to a theme.

::: tip Using the main theme without modifications
If you want to use the `main` theme without any modifications, you don't need to configure anything. Simply import the base styles (`handsontable/styles/handsontable.min.css`) and Handsontable will automatically use the `main` theme with default settings. However, if you want to retain the legacy look and feel, migrate to the **Classic** theme as described below.
:::

### What Changed

- The legacy CSS file (`dist/handsontable.full.min.css`) is no longer available
- You must now use the new theming system with either the Theme API or CSS-based themes
- The Classic theme (`ht-theme-classic`) provides the same visual appearance as the legacy styles

### How to Migrate

If you were using the legacy styles, migrate to the Classic theme using one of the two options below.

#### Option 1: Using the Theme API (recommended)

The Theme API allows you to register and configure themes programmatically with runtime features like density modes and color schemes.

**Step 1: Update your CSS imports**

```diff
- import 'handsontable/dist/handsontable.full.min.css';
+ import 'handsontable/styles/handsontable.min.css';
```

**Step 2: Import and register the Classic theme**

::: only-for javascript

```js
import Handsontable from 'handsontable';
import { classicTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(classicTheme);

const hot = new Handsontable(container, {
  theme: theme,
  // ... other options
});
```

:::

::: only-for react

```jsx
import { HotTable } from '@handsontable/react-wrapper';
import { classicTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(classicTheme);

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
import { classicTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(classicTheme);

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

#### Option 2: Using CSS files with theme as string

Alternatively, you can use CSS files and pass the theme name as a string to the `theme` option.

**Step 1: Update your CSS imports**

```diff
- @import 'handsontable/dist/handsontable.full.min.css';
+ @import 'handsontable/styles/handsontable.min.css';
+ @import 'handsontable/styles/ht-theme-classic.min.css';
```

Or if you're using JavaScript imports:

```diff
- import 'handsontable/dist/handsontable.full.min.css';
+ import 'handsontable/styles/handsontable.min.css';
+ import 'handsontable/styles/ht-theme-classic.min.css';
```

::: only-for angular

Or in `angular.json`:

```json5
{
  // ...
  "styles": [
    "src/styles.css",
    "node_modules/handsontable/styles/handsontable.min.css",
    "node_modules/handsontable/styles/ht-theme-classic.min.css"
  ],
  // ...
}
```

:::

**Step 2: Set the theme in Handsontable configuration**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  theme: 'ht-theme-classic',
  // ... other options
});
```

:::

::: only-for react

```jsx
<HotTable
  theme="ht-theme-classic"
  // ... other options
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  theme: 'ht-theme-classic'
}">
</hot-table>
```

:::

### Why Migrate to Classic?

The Classic theme provides the same visual appearance as the legacy style, but with significant improvements:

- **CSS Variables**: Easily customize colors, spacing, and other visual properties
- **Dark Mode Support**: Built-in dark mode variants (`ht-theme-classic-dark` and `ht-theme-classic-dark-auto`)
- **Better Maintainability**: The theming system is designed for long-term support
- **Consistency**: Works seamlessly with the new Design System

## 2. Migrate from CSS-based themes to the Theme API

If you're currently using CSS-based themes (loading theme CSS files and passing theme name as a string), we recommend migrating to the Theme API for better runtime control and customization options.

### What Changed

The Theme API provides a programmatic way to configure themes with runtime features that CSS-based themes don't support:

- **Runtime color scheme switching**: Change between light, dark, and auto modes programmatically
- **Density types**: Switch between compact, default, and comfortable density modes
- **Dynamic customization**: Modify theme parameters at runtime using the `params()` method

### How to Migrate

#### Before: CSS-based theme

::: only-for javascript

```js
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

const hot = new Handsontable(container, {
  theme: 'ht-theme-main',
  // ... other options
});
```

:::

::: only-for react

```jsx
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

function App() {
  return (
    <HotTable
      theme="ht-theme-main"
      // ... other options
    />
  );
}
```

:::

::: only-for angular

```ts
// In angular.json:
// "styles": [
//   "node_modules/handsontable/styles/handsontable.min.css",
//   "node_modules/handsontable/styles/ht-theme-main.min.css"
// ]

@Component({
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  hotSettings = {
    theme: 'ht-theme-main',
    // ... other options
  };
}
```

:::

#### After: Theme API

::: only-for javascript

```js
import 'handsontable/styles/handsontable.min.css';
import Handsontable from 'handsontable';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')  // 'light', 'dark', or 'auto'
  .setDensityType('default');  // 'compact', 'default', or 'comfortable'

const hot = new Handsontable(container, {
  theme: theme,
  // ... other options
});

// You can now change the theme at runtime
theme.setColorScheme('dark');
theme.setDensityType('compact');
```

:::

::: only-for react

```jsx
import 'handsontable/styles/handsontable.min.css';
import { HotTable } from '@handsontable/react-wrapper';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')
  .setDensityType('default');

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
import 'handsontable/styles/handsontable.min.css';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')
  .setDensityType('default');

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

### Advanced: Customizing theme parameters

The Theme API allows you to customize theme parameters dynamically using the `params()` method:

```js
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme);

// Customize theme parameters
theme.params({
  colors: {
    primary: {
      500: '#9333ea', // Custom primary color
    },
  },
  tokens: {
    fontSize: '14px',
    borderColor: ['colors.palette.200', 'colors.palette.700'], // [light, dark]
  },
});
```

### Available themes

The following themes are available through the Theme API:

| Theme | Import | Description |
|-------|--------|-------------|
| Main | `mainTheme` | Spreadsheet-like interface, perfect for batch-editing tasks |
| Horizon | `horizonTheme` | Cleaner look without vertical lines, ideal for data display |
| Classic | `classicTheme` | Retains the legacy style appearance with CSS variable support |

::: only-for angular

### Global Theme Management in Angular

In Angular, you can set a global default theme using the `HOT_GLOBAL_CONFIG` injection token:

```ts
import { ApplicationConfig } from '@angular/core';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme).setColorScheme('auto');

export const appConfig: ApplicationConfig = {
  providers: [{
    provide: HOT_GLOBAL_CONFIG,
    useValue: { theme: theme } as HotGlobalConfig
  }],
};
```

Or use the `HotGlobalConfigService` to manage the theme at runtime:

```ts
import { HotGlobalConfigService } from '@handsontable/angular-wrapper';
import { horizonTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(horizonTheme).setColorScheme('dark');

// In your component or service
hotConfigService.setConfig({ theme: theme });
```

:::

## Summary of breaking changes

| Change | Action Required |
|--------|-----------------|
| Legacy stylesheet removed | Migrate to Classic theme or another built-in theme |
| `handsontable.full.min.css` no longer available | Use `handsontable/styles/handsontable.min.css` + theme CSS |
| CSS-based themes (optional migration) | Consider migrating to Theme API for runtime features |

## Related resources

- [Themes](@/guides/styling/themes/themes.md) - Learn about the theming system
- [Theme Customization](@/guides/styling/theme-customization/theme-customization.md) - Customize themes with CSS variables
- [Legacy Style](@/guides/styling/legacy-style/legacy-style.md) - Information about the legacy style deprecation
