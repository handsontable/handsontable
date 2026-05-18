---
type: how-to
id: q7n4k2p9
title: Handsontable with Base Web
metaTitle: Handsontable with Base Web - React Data Grid | Handsontable
description: Integrate Handsontable into a React app using Base Web and style a custom theme with your design tokens so the grid matches your design system.
permalink: /recipes/themes/base-theme
canonicalUrl: /recipes/themes/base-theme
tags:
  - guides
  - tutorial
  - recipes
  - base web
  - design system
  - React
  - themes
  - Theme API
  - custom theme
react:
  id: t3m8v6c1
  metaTitle: Handsontable with Base Web - React Data Grid | Handsontable
angular:
  id: w5r2d8h4
  metaTitle: Handsontable with Base Web - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Themes
---

This tutorial shows you how to integrate Handsontable into a React app that uses Base Web, mapping Base design tokens to Handsontable colors and tokens so the grid follows your design system.

<iframe src="https://codesandbox.io/embed/3ctq7w?view=preview"
  style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Handsontable with Base Web recipe"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in CodeSandbox**](https://codesandbox.io/p/sandbox/3ctq7w)

## Overview

This recipe shows how to integrate Handsontable into a React app that uses [Base Web](https://baseweb.design/). You register a custom Handsontable theme that maps Base Web design tokens to Handsontable colors and tokens, so the grid follows your system styles.

**Difficulty:** Beginner  
**Time:** ~20 minutes  
**Stack:** React, Base Web, Styletron, Handsontable, `@handsontable/react-wrapper`

## What You'll Get

- A Handsontable grid with a custom theme registered through `registerTheme('base-data-grid', { icons, colors, tokens })`.
- A color mapping layer that uses your Base token variables, such as `--bds-primary-a`, `--bds-background-primary`, and `--bds-content-primary`.
- Theme token overrides for spacing and radius, so the grid matches Base Web's component shape and density.

## Prerequisites

- A React app with Base Web set up (including `BaseProvider` and Styletron engine).
- Base design tokens exposed as CSS variables in your global stylesheet.
- Handsontable and the React wrapper installed.

## Step 1: Install dependencies

Install Handsontable and the React wrapper in your project root:

```bash
pnpm add handsontable@0.0.0-next-deba76c-20260408 @handsontable/react-wrapper@0.0.0-next-deba76c-20260408
```

If you are creating a new Base setup, install Base Web and Styletron as well:

```bash
pnpm add baseui styletron-engine-atomic styletron-react
```

## Step 2: Register Handsontable modules

Register Handsontable modules once before rendering the grid.

```tsx
import { registerAllModules } from 'handsontable/registry';
import { registerTheme } from 'handsontable/themes';

registerAllModules();
```

## Step 3: Map Base design tokens to Handsontable colors

Create a colors object that maps Handsontable color keys to your Base CSS variables.

**File: `src/theme/colorsBase.ts`**

```tsx
/**
 * Maps Handsontable theme colors to Base Web design tokens.
 * Keep this object focused on color variables so you can swap brands by changing token values only.
 */
export const colorsBase = {
  palette: {
    50: 'var(--bds-background-tertiary)',
    100: 'var(--bds-background-secondary)',
    200: 'var(--bds-background-primary)',
    300: 'var(--bds-border-opaque)',
    400: 'var(--bds-content-tertiary)',
    500: 'var(--bds-content-secondary)',
    600: 'var(--bds-content-primary)',
    700: 'var(--bds-content-inverse-secondary)',
    800: 'var(--bds-content-inverse-primary)',
    900: 'var(--bds-background-inverse-primary)',
    950: 'var(--bds-background-inverse-secondary)',
  },
  primary: {
    100: 'var(--bds-primary-a)',
    200: 'var(--bds-primary-b)',
    300: 'var(--bds-primary)',
    400: 'var(--bds-primary-hover)',
    500: 'var(--bds-primary-active)',
    600: 'var(--bds-content-primary)',
  },
  white: 'var(--bds-background-primary)',
  black: 'var(--bds-content-primary)',
  transparent: 'transparent',
};
```

If your app does not yet expose token variables, define them in your global stylesheet and keep names consistent with your design system naming convention.

## Step 4: Define icons and tokens

You can reuse Handsontable's built-in icon and token sets, then override only what you need.

```tsx
import iconsMain from 'handsontable/themes/static/variables/icons/main';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
```

For most Base Web integrations, start with the built-ins and only override shape and spacing tokens:

```tsx
const baseThemeTokenOverrides = {
  wrapperBorderRadius: 'var(--bds-radius-200)',
  buttonBorderRadius: 'var(--bds-radius-200)',
  menuBorderRadius: 'var(--bds-radius-300)',
  inputBorderRadius: 'var(--bds-radius-200)',
};
```

## Step 5: Register and use the Base theme

Create and register your theme, then pass it to `HotTable`.

```tsx
import React from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerTheme } from 'handsontable/themes';
import { registerAllModules } from 'handsontable/registry';
import iconsMain from 'handsontable/themes/static/variables/icons/main';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
import { colorsBase } from './theme/colorsBase';

registerAllModules();

const baseDataGridTheme = registerTheme('base-data-grid', {
  icons: iconsMain,
  colors: colorsBase,
  tokens: tokensHorizon,
}).params({
  tokens: {
    wrapperBorderRadius: 'var(--bds-radius-200)',
    buttonBorderRadius: 'var(--bds-radius-200)',
    menuBorderRadius: 'var(--bds-radius-300)',
    inputBorderRadius: 'var(--bds-radius-200)',
  },
});

const data = [
  { name: 'Alice', role: 'Designer', location: 'New York', active: true },
  { name: 'Jon', role: 'Engineer', location: 'Berlin', active: false },
  { name: 'Lina', role: 'Product Manager', location: 'Warsaw', active: true },
];

export default function BaseThemeExample() {
  return (
    <HotTable
      theme={baseDataGridTheme}
      data={data}
      width="100%"
      height="auto"
      rowHeaders={true}
      colHeaders={['Name', 'Role', 'Location', 'Active']}
      columns={[
        { data: 'name' },
        { data: 'role' },
        { data: 'location' },
        { data: 'active', type: 'checkbox' },
      ]}
      licenseKey="non-commercial-and-evaluation"
    />
  );
}
```

## Step 6: Keep styles consistent with Base Web

When you tune the grid, follow this order:

1. Update Base token values in one place.
2. Reuse those tokens through your `colorsBase` object.
3. Override only the minimum Handsontable tokens with `.params({ tokens: ... })`.

This keeps the grid aligned with system-level style updates and avoids one-off CSS overrides.

## Troubleshooting

### Theme does not apply.

- Confirm the registered theme object is passed to `theme`, not a string class name.
- Make sure `registerAllModules()` runs before rendering `HotTable`.
- Check that your CSS variables are available on the grid container.

### Colors look incorrect in dark mode.

- Verify your app switches the same token variables that `colorsBase` uses.
- Avoid hardcoded hex values in `colorsBase` when your app relies on dynamic themes.

## Related

- [Themes](/themes) - Built-in themes and Theme API.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Theme API parameters and CSS variable reference.
- [Design system (Figma)](/handsontable-design-system) - Figma kit and design tokens.

## What you learned

You registered a custom Handsontable theme that maps Base Web design tokens to Handsontable colors and tokens. You used `registerTheme` with a `colors` object backed by `var(--bds-*)` CSS variables, Horizon tokens as the base, and `.params()` overrides to match Base Web's border radius.

## Next steps

- [Handsontable with shadcn/ui](@/recipes/themes/custom-theme/custom-theme.md) - The same pattern using shadcn/ui CSS variables and Lucide icons.
- [Handsontable with MUI](@/recipes/themes/mui-theme/mui-theme.md) - The same pattern reading colors from the MUI `Theme` object via `useTheme()`.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Full reference for Theme API parameters and CSS variables.
