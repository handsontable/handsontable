---
type: how-to
id: f2a7b9c1
title: Handsontable with MUI
metaTitle: Handsontable with MUI - JavaScript Data Grid | Handsontable
description: Integrate Handsontable into a React app with MUI so your grid follows Material UI colors, typography, and spacing.
permalink: /recipes/themes/mui-theme
canonicalUrl: /recipes/themes/mui-theme
tags:
  - guides
  - tutorial
  - recipes
  - MUI
  - Material UI
  - design system
  - React
  - themes
  - Theme API
react:
  id: d4e8a6f2
  metaTitle: Handsontable with MUI - React Data Grid | Handsontable
angular:
  id: a3b7c9e1
  metaTitle: Handsontable with MUI - Angular Data Grid | Handsontable
vue:
  id: 6qpczr7i
  metaTitle: Handsontable with MUI - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Themes
---

This tutorial shows you how to integrate Handsontable into a React app that uses MUI, registering a custom theme that maps MUI palette values to Handsontable colors and tokens.

<iframe src="https://codesandbox.io/embed/y4vsfq?view=preview"
  style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Handsontable with MUI recipe (icons fixed)"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in CodeSandbox**](https://codesandbox.io/p/sandbox/y4vsfq)

## Overview

This recipe shows how to integrate Handsontable into a React app that uses [MUI](https://mui.com/) by registering a custom theme with Theme API colors and tokens. The grid follows your Material UI design language.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Stack:** React, MUI, Handsontable, `@handsontable/react-wrapper`

## What You'll Get

- A reusable Handsontable theme (`registerTheme('mui-data-grid', { icons, colors, tokens })`) that maps to your MUI palette.
- A React grid component that uses the custom theme and keeps your MUI typography and spacing.
- A base setup you can extend with dark mode and custom icons.

## Prerequisites

- A React app with MUI configured.
- Handsontable and the React wrapper installed.
- A `ThemeProvider` at your app root.

## Step 1: Install dependencies

In your project root:

```bash
npm install handsontable @handsontable/react-wrapper @mui/material @emotion/react @emotion/styled
```

## Step 2: Register Handsontable modules

Register Handsontable modules once in your grid module:

```tsx
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

## Step 3: Create MUI color mapping for Theme API

Handsontable's Theme API expects a specific `colors` shape. Create a mapping helper that reads from your MUI theme.

**File: `src/theme/handsontableMuiColors.ts`**

```ts
import type { Theme } from '@mui/material/styles';

export function createHandsontableMuiColors(theme: Theme) {
  return {
    palette: {
      50: theme.palette.grey[50],
      100: theme.palette.grey[100],
      200: theme.palette.grey[200],
      300: theme.palette.grey[300],
      400: theme.palette.grey[400],
      500: theme.palette.grey[500],
      600: theme.palette.grey[600],
      700: theme.palette.grey[700],
      800: theme.palette.grey[800],
      900: theme.palette.grey[900],
      950: theme.palette.grey[900],
    },
    primary: {
      100: theme.palette.primary.light,
      200: theme.palette.primary.light,
      300: theme.palette.primary.main,
      400: theme.palette.primary.main,
      500: theme.palette.primary.dark,
      600: theme.palette.primary.dark,
    },
    white: theme.palette.background.paper,
    black: theme.palette.text.primary,
    transparent: 'transparent',
  };
}
```

## Step 4: Register your MUI Handsontable theme

Register a custom Handsontable theme that uses your mapped colors and Horizon tokens.

**File: `src/theme/muiDataGridTheme.ts`**

```ts
import type { Theme } from '@mui/material/styles';
import { registerTheme } from 'handsontable/themes';
import iconsHorizon from 'handsontable/themes/static/variables/icons/horizon';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
import { createHandsontableMuiColors } from './handsontableMuiColors';

export function createMuiDataGridTheme(theme: Theme) {
  return registerTheme('mui-data-grid', {
    icons: iconsHorizon,
    colors: createHandsontableMuiColors(theme),
    tokens: tokensHorizon,
  }).params({
    tokens: {
      // Match MUI's default rounded corners.
      borderRadius: '4px',
    },
  });
}
```

## Step 5: Build a themed grid component

Use `useTheme()` to read MUI palette values, then register and apply your custom Handsontable theme.

**File: `src/components/MuiHotTable.tsx`**

```tsx
import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { createMuiDataGridTheme } from '../theme/muiDataGridTheme';

registerAllModules();

const data = [
  { name: 'Alice', age: 28, country: 'USA', status: true },
  { name: 'Bob', age: 34, country: 'UK', status: false },
  { name: 'Carla', age: 41, country: 'Germany', status: true },
];

export default function MuiHotTable() {
  const theme = useTheme();
  const hotTheme = useMemo(() => createMuiDataGridTheme(theme), [theme]);

  return (
    <HotTable
      theme={hotTheme}
      data={data}
      colHeaders={['Name', 'Age', 'Country', 'Active']}
      rowHeaders={true}
      autoWrapRow={true}
      width="100%"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="name" width={160} />
      <HotColumn data="age" type="numeric" width={100} />
      <HotColumn data="country" width={160} />
      <HotColumn data="status" type="checkbox" className="htCenter" width={120} />
    </HotTable>
  );
}
```

## Step 6: Render inside MUI `ThemeProvider`

Wrap your app with MUI's `ThemeProvider`, then render the table component.

```tsx
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import MuiHotTable from './components/MuiHotTable';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MuiHotTable />
    </ThemeProvider>
  );
}
```

## Optional enhancements

- Add a dark mode toggle in MUI, then re-create your Handsontable theme when MUI mode changes.
- Add custom `icons` in `registerTheme()` to align sort/menu/filter icons with Material Symbols.
- Override more Theme API tokens (for example spacing and border styles) to match your component library standards.

## Related

<div class="boxes-list">

- [Themes](@/guides/styling/themes/themes.md)
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md)
- [Design system](@/guides/styling/design-system/design-system.md)

</div>

## What you learned

You registered a custom Handsontable theme that maps MUI palette values to Handsontable colors. You used `useTheme()` to read MUI palette values at runtime, `useMemo` to avoid unnecessary theme re-registrations, and `registerTheme` with Horizon tokens and a `borderRadius` override.

## Next steps

- [Handsontable with shadcn/ui](@/recipes/themes/custom-theme/custom-theme.md) - The same pattern using shadcn CSS variables and Lucide icons.
- [Handsontable with Base Web](@/recipes/themes/base-theme/base-theme.md) - The same pattern using Base Web design tokens.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Full reference for Theme API parameters and CSS variables.
