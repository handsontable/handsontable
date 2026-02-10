---
id: yfus6qpz
title: Legacy Style
metaTitle: Legacy Style - JavaScript Data Grid | Handsontable
description: The legacy stylesheet was removed in Handsontable 17.0.0. Learn how to migrate to the Classic theme using the Theme API or CSS imports.
permalink: /legacy-style
canonicalUrl: /legacy-style
tags:
  - styling
  - migration
  - themes
  - CSS variables
  - classic theme
  - legacy
react:
  id: jn3po47i
  metaTitle: Legacy Style - React Data Grid | Handsontable
angular:
  id: 1sco7djp
  metaTitle: Legacy Style - Angular Data Grid | Handsontable
searchCategory: Guides
category: Styling
menuTag: updated
---

# Legacy Style

Starting from **version 17.0.0**, the legacy stylesheet has been removed from Handsontable. If you're upgrading from an earlier version, you must migrate to the **Classic** theme.

[[toc]]

## Legacy styles are no longer available

The legacy CSS file (`handsontable.full.min.css`) was the default stylesheet up until **version 15** (released in December 2024). In version 16.1, Handsontable introduced a new theming system with the **Classic** theme as a replacement. As of **version 17.0.0**, the legacy stylesheet has been completely removed.

If you're upgrading from a version prior to 17.0.0, you must migrate to the Classic theme to ensure your grid displays correctly.

## Migrate to the Classic theme

There are two ways to apply the Classic theme. The recommended approach is to use the Theme API with a theme object.

### Option 1: Using the Theme API (recommended)

The Theme API allows you to import and register themes programmatically. This approach provides full access to theme customization features like density modes and color schemes.

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

### Option 2: Using CSS files with theme as string

Alternatively, you can use CSS files and pass the theme name as a string to the `theme` option.

#### Step 1. Update your CSS imports

Replace your existing CSS import with the base styles and Classic theme:

```diff
- @import 'handsontable/dist/handsontable.full.min.css';
+ @import 'handsontable/styles/ht-theme-classic.min.css';
```

Or if you're using JavaScript imports:

```diff
- import 'handsontable/dist/handsontable.full.min.css';
+ import 'handsontable/styles/ht-theme-classic.min.css';
```

#### Step 2. Set the theme in Handsontable configuration

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

### Why migrate to Classic?

The Classic theme provides the same visual appearance as the legacy style, but with significant improvements:

- **CSS variables**: Easily customize colors, spacing, and other visual properties
- **Better maintainability**: The theming system is designed for long-term support
- **Consistency**: Works seamlessly with the new Design System

For more detailed migration instructions, see:

- [Migrate from 16.2 to 17.0](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md)

For more information about the theming system, see:

- [Themes](@/guides/styling/themes/themes.md)