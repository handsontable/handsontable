---
id: c7m4n2p9
title: Handsontable with Material Design 3
metaTitle: Handsontable with Material Design 3 - React Data Grid | Handsontable
description: Integrate Handsontable with Material Design 3 by mapping M3 design tokens to the Handsontable Theme API.
permalink: /recipes/themes/material-design
canonicalUrl: /recipes/themes/material-design
tags:
  - guides
  - tutorial
  - recipes
  - material design
  - material design 3
  - m3
  - design system
  - React
  - themes
  - Theme API
react:
  id: r6d1k8v4
  metaTitle: Handsontable with Material Design 3 - React Data Grid | Handsontable
angular:
  id: a2q9m5t7
  metaTitle: Handsontable with Material Design 3 - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Themes
---

[[toc]]

## Overview

This recipe shows how to integrate Handsontable with [Material Design 3](https://m3.material.io/) by registering a custom theme that maps M3 color roles and shape tokens to Handsontable Theme API variables.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Stack:** React, Handsontable, `@handsontable/react-wrapper`, Material Design 3 tokens

## What you will build

- A reusable Handsontable theme registered with `registerTheme('material-data-grid', { ... })`.
- M3 color roles (for example `primary`, `surface`, `on-surface`, `outline`) mapped to Handsontable theme colors.
- Token overrides for border radius and spacing so the grid follows your Material Design system.

## Prerequisites

- A React project that already uses Material Design 3 styles or tokens.
- M3 CSS variables available in your app stylesheet (for example from a design-token pipeline or your own variables).
- Handsontable installed in your app.

## Step 1 - Install Handsontable

In your project root:

```bash
pnpm add handsontable @handsontable/react-wrapper
```

You can use `npm install` or `yarn add` instead.

## Step 2 - Register Handsontable modules

Register Handsontable modules before creating the grid:

```tsx
import { registerAllModules } from 'handsontable/registry';
import { registerTheme } from 'handsontable/themes';

registerAllModules();
```

## Step 3 - Define Material Design 3 colors

Create a color map that points to your M3 CSS variables. This keeps the grid aligned with the rest of your design system.

You can use Handsontable's built-in Material starter mapping:

```tsx
import colorsMaterial from 'handsontable/themes/static/variables/colors/material';
```

Or create your own mapping:

**File: `src/theme/colorsMaterial.ts`**

```tsx
export const colorsMaterial = {
  palette: {
    50: 'var(--md-sys-color-surface-container-lowest)',
    100: 'var(--md-sys-color-surface-container-low)',
    200: 'var(--md-sys-color-surface-container)',
    300: 'var(--md-sys-color-surface-container-high)',
    400: 'var(--md-sys-color-surface-container-highest)',
    500: 'var(--md-sys-color-surface-variant)',
    600: 'var(--md-sys-color-outline-variant)',
    700: 'var(--md-sys-color-outline)',
    800: 'var(--md-sys-color-on-surface-variant)',
    900: 'var(--md-sys-color-on-surface)',
    950: 'var(--md-sys-color-shadow)',
  },
  primary: {
    100: 'var(--md-sys-color-primary-container)',
    200: 'var(--md-sys-color-primary-fixed)',
    300: 'var(--md-sys-color-primary-fixed-dim)',
    400: 'var(--md-sys-color-primary)',
    500: 'var(--md-sys-color-primary)',
    600: 'var(--md-sys-color-on-primary)',
  },
  white: 'var(--md-sys-color-surface)',
  black: 'var(--md-sys-color-on-surface)',
  transparent: 'transparent',
};
```

## Step 4 - Create Material-style icons

Provide a theme icon set that follows your Material icon style. You can use SVG data URIs with `currentColor` so icons inherit theme colors.

**File: `src/theme/iconsMaterial.ts`**

```tsx
const iconAttrs =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"';

function icon(svgContent: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg ${iconAttrs}>${svgContent}</svg>`)}`;
}

export const iconsMaterial = {
  arrowRight: icon('<path d="m10 6 6 6-6 6"/>'),
  arrowLeft: icon('<path d="m14 6-6 6 6 6"/>'),
  arrowDown: icon('<path d="m6 10 6 6 6-6"/>'),
  menu: icon('<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>'),
  selectArrow: icon('<path d="m6 10 6 6 6-6"/>'),
  check: icon('<path d="m5 13 4 4L19 7"/>'),
  checkbox: icon('<path d="m5 13 4 4L19 7"/>'),
};
```

## Step 5 - Register the Material Design theme

Import a built-in token base, then override selected values with M3 variables.

**File: `src/components/DataGrid.tsx`**

```tsx
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { registerTheme } from 'handsontable/themes';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';

import { colorsMaterial } from '../theme/colorsMaterial';
import { iconsMaterial } from '../theme/iconsMaterial';

registerAllModules();

const materialDataGridTheme = registerTheme('material-data-grid', {
  icons: iconsMaterial,
  colors: colorsMaterial,
  tokens: tokensHorizon,
}).params({
  tokens: {
    wrapperBorderRadius: 'var(--md-sys-shape-corner-medium, 12px)',
    cellSelectionBorderColor: 'var(--md-sys-color-primary)',
    checkboxFocusRingColor: 'var(--md-sys-color-primary)',
  },
});

const data = [
  { product: 'Notebook', price: 12.5, stock: 120 },
  { product: 'Desk lamp', price: 28.0, stock: 45 },
  { product: 'Keyboard', price: 62.9, stock: 30 },
];

export function DataGrid() {
  return (
    <HotTable
      data={data}
      colHeaders={['Product', 'Price', 'Stock']}
      theme={materialDataGridTheme}
      stretchH="all"
      autoWrapRow={true}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="product" />
      <HotColumn data="price" type="numeric" />
      <HotColumn data="stock" type="numeric" />
    </HotTable>
  );
}
```

## Step 6 - Verify Material behavior

When your app toggles between light and dark mode, Handsontable updates automatically if your M3 variables change at runtime. Verify:

- Header and cell surfaces match your Material surface roles.
- Selection and focus states use your `primary` role.
- Borders and separators use your `outline` roles.
- Corner radius follows `--md-sys-shape-corner-*`.

## Troubleshooting

- If the table still looks like a default theme, confirm that `theme={materialDataGridTheme}` is set on `HotTable`.
- If colors do not change in dark mode, verify your M3 CSS variables are redefined in your dark theme scope.
- If some icons are missing, add all required icon keys used by your enabled Handsontable features.

## Related

- [Themes](@/guides/styling/themes/themes.md) - Learn how to apply built-in and custom themes.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Explore Theme API parameters and tokens.
- [Design system guide](@/guides/styling/design-system/design-system.md) - Review Handsontable design token concepts.
