---
id: sf7vrh9z
title: Migrating from 16.0 to 16.1
metaTitle: Migrating from 16.0 to 16.1 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 16.0 to Handsontable 16.1, released on [TODO].
permalink: /migration-from-16.0-to-16.1
canonicalUrl: /migration-from-16.0-to-16.1
pageClass: migration-guide
react:
  id: 1k2grh9z
  metaTitle: Migrate from 16.0 to 16.1 - React Data Grid | Handsontable
angular:
  id: bv25a4sd
  metaTitle: Migrate from 16.0 to 16.1 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 16.0 to 16.1

Migrate from Handsontable 16.0 to Handsontable 16.1, released on September 15, 2025.

More information about this release can be found in the [`16.1.0` release blog post](https://handsontable.com/blog/handsontable-16.1-row-pagination-loading-plugin-and-long-term-support-policy).<br/>
For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md#_16-1-0).

[[toc]]

## 1. Migrate from Legacy Styles to Classic Theme

Handsontable 16.1 introduces a new **Classic** theme that replaces the legacy theme. The legacy styles will be removed in version 17.0.

### What Changed

- **New Classic Theme**: A new theme called `ht-theme-classic` that retains the familiar look and feel of the original classic styles
- **CSS Variables Support**: The new theme supports CSS variables for customization, unlike the legacy theme
- **Dark Mode Support**: The new theme includes built-in dark mode variants (`ht-theme-classic-dark` and `ht-theme-classic-dark-auto`)

### Why This Change

The legacy style was built with hardcoded styles that couldn't be customized. The new Classic theme provides the same visual appearance but with the flexibility of CSS variables, making it easier to customize and maintain consistency with your application's design system.

### How to Migrate

#### Step 1: Update CSS Imports

**Before:**
```html
<link href="dist/handsontable.full.min.css" rel="stylesheet">
```

**After:**
```html
<link href="styles/handsontable.css" rel="stylesheet">
<link href="styles/ht-theme-classic.css" rel="stylesheet">
```

#### Step 2: Update Theme Configuration

**Before:**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  // No theme configuration needed - used legacy styles by default
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

**After:**

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

The new Classic theme offers three variants:

- **Light Mode**: `ht-theme-classic`
- **Dark Mode**: `ht-theme-classic-dark`
- **Auto Dark Mode**: `ht-theme-classic-dark-auto` (automatically follows system preference)

#### Step 4: Customize with CSS Variables (Optional)

The new theme supports over 180 CSS variables for [customization](@/guides/styling/theme-customization/theme-customization.md):

```css
.ht-theme-classic {
  --ht-accent-color: #your-brand-color;
  --ht-foreground-color: #your-text-color;
  --ht-background-color: #your-background-color;
}
```

### What to Expect

- **Visual Consistency**: The new theme maintains the same visual appearance as the legacy style
- **Future-Proof**: The new theme will continue to be supported and enhanced
- **Console Warning**: You'll see a deprecation warning if you're still using the legacy style

### Timeline

- **Version 16.1**: New Classic theme introduced
- **Version 17.0**: Legacy style will be removed

We recommend migrating as soon as possible to avoid issues when version 17.0 is released.
