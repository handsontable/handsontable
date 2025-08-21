---
id: sf7vrh9z
title: Migrating from 16.0 to 16.2
metaTitle: Migrating from 16.0 to 16.2 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 16.0 to Handsontable 16.2, released on [TODO].
permalink: /migration-from-16.0-to-16.2
canonicalUrl: /migration-from-16.0-to-16.2
pageClass: migration-guide
react:
  id: 1k2grh9z
  metaTitle: Migrate from 16.0 to 16.2 - React Data Grid | Handsontable
angular:
  id: bv25a4sd
  metaTitle: Migrate from 16.0 to 16.2 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 16.0 to 16.2

Migrate from Handsontable 16.0 to Handsontable 16.2, released on TODO.

More information about this release can be found in the [`16.2.0` release blog post](TODO_URL]).

[[toc]]

## 1. Migrate from Classic (Legacy) to Classic (Modern) Theme

Handsontable 16.2 introduces a new **Classic (Modern)** theme that replaces the legacy classic theme. The legacy classic theme will be removed in version 17.0.

### What Changed

- **New Classic (Modern) Theme**: A new theme called `ht-theme-classic` that retains the familiar look and feel of the original classic theme
- **CSS Variables Support**: The new theme supports CSS variables for customization, unlike the legacy theme
- **Dark Mode Support**: The new theme includes built-in dark mode variants (`ht-theme-classic-dark` and `ht-theme-classic-dark-auto`)

### Why This Change

The legacy classic theme was built with hardcoded styles that couldn't be customized. The new Classic (Modern) theme provides the same visual appearance but with the flexibility of CSS variables, making it easier to customize and maintain consistency with your application's design system.

### How to Migrate

#### Step 1: Update CSS Imports

**Before (Legacy):**
```html
<link href="dist/handsontable.full.min.css" rel="stylesheet">
```

**After (Modern):**
```html
<link href="styles/handsontable.css" rel="stylesheet">
<link href="styles/ht-theme-classic.css" rel="stylesheet">
```

#### Step 2: Update Theme Configuration

**Before (Legacy):**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  // No theme configuration needed - used legacy classic by default
});
```

:::

::: only-for react

```jsx
<HotTable />
```

:::

::: only-for angular

```html
<hot-table></hot-table>
```

:::

**After (Modern):**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  themeName: 'ht-theme-classic'
});
```

:::

::: only-for react
```jsx
<HotTable themeName="ht-theme-classic" />
```

:::

::: only-for angular

```html
<hot-table [settings]="{ themeName: 'ht-theme-classic' }"></hot-table>
```

:::

#### Step 3: Choose Your Variant

The new Classic (Modern) theme offers three variants:

- **Light Mode**: `ht-theme-classic`
- **Dark Mode**: `ht-theme-classic-dark`
- **Auto Dark Mode**: `ht-theme-classic-dark-auto` (automatically follows system preference)

#### Step 4: Customize with CSS Variables (Optional)

The new theme supports over 180 CSS variables for [customization](@/guides/styling/themes/theme-customization.md):

```css
.ht-theme-classic {
  --ht-accent-color: #your-brand-color;
  --ht-foreground-color: #your-text-color;
  --ht-background-color: #your-background-color;
}
```

### What to Expect

- **Visual Consistency**: The new theme maintains the same visual appearance as the legacy theme
- **Future-Proof**: The new theme will continue to be supported and enhanced
- **Console Warning**: You'll see a deprecation warning if you're still using the legacy theme

### Timeline

- **Version 16.2**: New Classic (Modern) theme introduced
- **Version 17.0**: Legacy classic theme will be removed

We recommend migrating as soon as possible to avoid issues when version 17.0 is released.
