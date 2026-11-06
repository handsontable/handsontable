---
type: how-to
title: Handsontable DataGrid with MUI
metaTitle: MUI theme | Handsontable DataGrid for JavaScript
description: Integrate Handsontable DataGrid into a React app with MUI so your grid follows Material UI colors, typography, and spacing.
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
  metaTitle: MUI theme | Handsontable DataGrid for React
angular:
  metaTitle: MUI theme | Handsontable DataGrid for Angular
vue:
  metaTitle: MUI theme | Handsontable DataGrid for Vue
searchCategory: Recipes
category: Themes
menuTag: updated
---

This tutorial shows you how to integrate Handsontable DataGrid into a React app that uses MUI, registering a custom theme that maps MUI palette values to Handsontable colors and tokens.

<iframe src="https://demos.handsontable.com/embed/2n1i1s6572"
  style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Handsontable with MUI recipe (icons fixed)"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in sandbox**](https://demos.handsontable.com/?example=mui&v={{$currentVersion}})
[**View source on GitHub**](https://github.com/handsontable/examples/tree/{{$examplesBranch}}/examples/mui)

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

## Step 2: Register Handsontable DataGrid modules

Register Handsontable modules once in your grid module:

```tsx
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

## Step 3: Create MUI color mapping for Theme API

Handsontable's Theme API expects a specific `colors` shape. Create a mapping helper that reads from your MUI theme. Keep `white` and `black` static: in dark mode, Horizon uses `white` for light text, such as the cell editor text, so it can't follow MUI's dark `background.paper`.

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
    white: theme.palette.common.white,
    black: theme.palette.common.black,
    transparent: 'transparent',
  };
}
```

## Step 4: Register your MUI Handsontable DataGrid theme

Register a custom Handsontable theme that uses your mapped colors and Horizon tokens.

`registerTheme()` registers a name only once. If the name is already registered, it logs a warning and returns the existing theme, with the old colors. This function runs again whenever the MUI theme changes (and twice in React Strict Mode), so it re-creates an existing theme with `reinitTheme()` instead. `colorScheme` follows MUI's `palette.mode`, so Horizon uses its light or dark token set to match.

**File: `src/theme/muiDataGridTheme.ts`**

```ts
import type { Theme } from '@mui/material/styles';
import { hasTheme, registerTheme, reinitTheme } from 'handsontable/themes';
import iconsHorizon from 'handsontable/themes/static/variables/icons/horizon';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
import { createHandsontableMuiColors } from './handsontableMuiColors';

const THEME_NAME = 'mui-data-grid';

export function createMuiDataGridTheme(theme: Theme) {
  const themeConfig = {
    colorScheme: theme.palette.mode,
    icons: iconsHorizon,
    colors: createHandsontableMuiColors(theme),
    tokens: tokensHorizon,
  };

  const hotTheme = hasTheme(THEME_NAME)
    ? reinitTheme(THEME_NAME, themeConfig)!
    : registerTheme(THEME_NAME, themeConfig);

  return hotTheme.params({
    tokens: {
      // Match MUI's default rounded corners.
      borderRadius: '4px',
    },
  });
}
```

## Step 5: Build a themed grid component

Use `useTheme()` to read MUI palette values, then create and apply your custom Handsontable theme. `useMemo` re-creates the Handsontable theme only when the MUI theme changes.

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
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      theme={hotTheme}
      data={data}
      colHeaders={['Name', 'Age', 'Country', 'Active']}
      rowHeaders={true}
      autoWrapRow={true}
      width="100%"
      height="auto"
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

- Add a dark mode toggle in MUI. When the mode changes, `useTheme()` returns a new theme, and `createMuiDataGridTheme()` re-creates the Handsontable theme in the matching color scheme.
- Add custom `icons` in `registerTheme()` to align sort/menu/filter icons with Material Symbols.
- Override more Theme API tokens (for example spacing and border styles) to match your component library standards.

## Related

<div class="boxes-list">

- [Themes](@/guides/styling/themes/themes.md)
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md)
- [Design system](@/guides/styling/design-system/design-system.md)

</div>

## What you learned

You registered a custom Handsontable theme that maps MUI palette values to Handsontable colors. You used `useTheme()` to read MUI palette values at runtime, `useMemo` to re-create the theme only when the MUI theme changes, `registerTheme()` and `reinitTheme()` to register the theme once and update it afterward, and Horizon tokens with a `borderRadius` override.

## Next steps

- [Handsontable DataGrid with shadcn/ui](@/recipes/themes/custom-theme/custom-theme.md) - The same pattern using shadcn CSS variables and Lucide icons.
- [Handsontable DataGrid with Base Web](@/recipes/themes/base-theme/base-theme.md) - The same pattern using Base Web design tokens.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Full reference for Theme API parameters and CSS variables.
