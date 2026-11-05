---
title: Handsontable DataGrid with Fluent UI
metaTitle: Fluent UI theme | Handsontable DataGrid for JavaScript
description: Integrate Handsontable DataGrid into a React app with Fluent UI so your grid follows Fluent colors, typography, and spacing.
permalink: /recipes/themes/fluent-ui
canonicalUrl: /recipes/themes/fluent-ui
tags:
  - guides
  - tutorial
  - recipes
  - fluent ui
  - design system
  - React
  - themes
  - Theme API
react:
  metaTitle: Fluent UI theme | Handsontable DataGrid for React
searchCategory: Recipes
category: Themes
type: how-to
menuTag: updated
---

In this tutorial, you will integrate Handsontable DataGrid into a React app with Fluent UI so your grid follows Fluent colors, typography, and spacing. You will learn how to map Fluent UI tokens to Handsontable theme parameters through the Theme API.

<iframe src="https://demos.handsontable.com/embed/3w4w5x6f54"
  style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Handsontable with Fluent UI"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in sandbox**](https://demos.handsontable.com/?example=fluent-ui&v={{$currentVersion}})
[**View source on GitHub**](https://github.com/handsontable/examples/tree/{{$examplesBranch}}/examples/fluent-ui)

## Overview

This recipe shows how to integrate Handsontable into a React app that uses [Fluent UI](https://react.fluentui.dev/) by registering a custom theme with Theme API colors and tokens. The grid follows your Fluent design language.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Stack:** React, Fluent UI, Handsontable, `@handsontable/react-wrapper`

## What You'll Get

- A reusable Handsontable theme (`registerTheme('fluent-data-grid', { icons, colors, tokens })`) that maps to Fluent UI colors.
- A React grid component that applies Fluent-like typography (`Segoe UI`), neutral table colors, and roomier cell paddings.
- A light-mode baseline you can extend with dark mode and custom icon overrides.

## Prerequisites

- A React app with Fluent UI configured.
- Handsontable and the React wrapper installed.
- A `FluentProvider` at your app root.

## Step 1: Install dependencies

```bash
npm install handsontable @handsontable/react-wrapper @fluentui/react-components
```

## Step 2: Wrap your app in FluentProvider

Fluent UI tokens are available through the provider. Use `webLightTheme`, `webDarkTheme`, or your own custom theme.

```tsx
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

export function AppRoot() {
  return (
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  );
}
```

## Step 3: Create Fluent color mapping for Theme API

Handsontable's Theme API expects the `palette`, `primary`, `white`, `black`, and `transparent` structure. The `palette` runs from the lightest color (`50`) to the darkest (`950`).

Read the values from the Fluent theme object, not from Fluent's CSS variables. Fluent names its variables in camelCase (for example, `--colorNeutralBackground1`), and the Theme API converts color values to kebab case, so `var(--colorNeutralBackground1)` would point to a variable that doesn't exist.

**File: `src/theme/colorsFluent.ts`**

```ts
import { webLightTheme } from '@fluentui/react-components';

const colorsFluent = {
  palette: {
    50: webLightTheme.colorNeutralBackground1,
    100: webLightTheme.colorNeutralBackground2,
    200: webLightTheme.colorNeutralBackground3,
    300: webLightTheme.colorNeutralBackground4,
    400: webLightTheme.colorNeutralStroke2,
    500: webLightTheme.colorNeutralStroke1,
    600: webLightTheme.colorNeutralForeground3,
    700: webLightTheme.colorNeutralForeground2,
    800: webLightTheme.colorNeutralForeground1,
    900: webLightTheme.colorNeutralForeground1,
    950: webLightTheme.colorNeutralForeground1,
  },
  primary: {
    100: webLightTheme.colorBrandBackground,
    200: webLightTheme.colorBrandBackground2,
    300: webLightTheme.colorBrandBackgroundInverted,
    400: webLightTheme.colorBrandStroke1,
    500: webLightTheme.colorBrandForeground1,
    600: webLightTheme.colorBrandForeground2,
  },
  white: webLightTheme.colorNeutralBackground1,
  black: webLightTheme.colorNeutralForeground1,
  transparent: 'transparent',
};

export default colorsFluent;
```

## Step 4: Register your Fluent Handsontable DataGrid theme

Import `icons` together with `colors` and `tokens`. `registerTheme()` requires `icons` - if omitted, ThemeBuilder throws an error.

The colors and the `.params()` overrides are Fluent's light values, so `.setColorScheme('light')` pins the theme to light mode. Without it, the theme follows the operating system's color scheme, and a visitor in dark mode gets Horizon's dark token values mixed with these light colors.

**File: `src/theme/fluentDataGridTheme.ts`**

```tsx
import { registerTheme } from 'handsontable/themes';
import iconsHorizon from 'handsontable/themes/static/variables/icons/horizon';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
import colorsFluent from './colorsFluent';

export const fluentDataGridTheme = registerTheme('fluent-data-grid', {
  icons: iconsHorizon,
  colors: colorsFluent,
  tokens: tokensHorizon,
}).params({
  tokens: {
    fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', system-ui, sans-serif",
    fontSize: '14px',
    lineHeight: '20px',
    headerFontWeight: '600',
    foregroundColor: '#242424',
    foregroundSecondaryColor: '#616161',
    backgroundColor: '#ffffff',
    backgroundSecondaryColor: '#fafafa',
    borderColor: '#e1dfdd',
    cellVerticalBorderColor: '#e1dfdd',
    headerBackgroundColor: '#f5f5f5',
    headerForegroundColor: '#242424',
    rowCellOddBackgroundColor: '#ffffff',
    rowCellEvenBackgroundColor: '#ffffff',
    rowHeaderOddBackgroundColor: '#ffffff',
    rowHeaderEvenBackgroundColor: '#ffffff',
    cellHorizontalPadding: '12px',
    cellVerticalPadding: '10px',
    barHorizontalPadding: '12px',
    barVerticalPadding: '8px',
    menuItemHorizontalPadding: '12px',
    menuItemVerticalPadding: '8px',
    borderRadius: '8px',
    cellSelectionBorderColor: '#0f6cbd',
    cellSelectionBackgroundColor: '#deecf9',
  },
}).setColorScheme('light');
```

## Step 5: Build a themed grid component

Register modules, apply the theme, import Handsontable CSS, and render a minimal table.

**File: `src/components/FluentHotTable.tsx`**

```tsx
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-horizon.min.css';

import { fluentDataGridTheme } from '../theme/fluentDataGridTheme';

registerAllModules();

const data = [
  { team: 'Design', owner: 'Ava', status: 'In progress', priority: 'High' },
  { team: 'Platform', owner: 'Noah', status: 'Blocked', priority: 'Medium' },
  { team: 'Docs', owner: 'Liam', status: 'Done', priority: 'Low' },
];

export default function FluentHotTable() {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      theme={fluentDataGridTheme}
      data={data}
      colHeaders={['Team', 'Owner', 'Status', 'Priority']}
      rowHeaders={true}
      width="100%"
      height="auto"
      dropdownMenu={true}
      filters={true}
    >
      <HotColumn data="team" width={180} />
      <HotColumn data="owner" width={140} />
      <HotColumn data="status" width={160} />
      <HotColumn data="priority" width={140} />
    </HotTable>
  );
}
```

## Step 6: Render inside FluentProvider

Wrap your app with Fluent's provider, then render the table component.

```tsx
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import FluentHotTable from './components/FluentHotTable';

export default function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <FluentHotTable />
    </FluentProvider>
  );
}
```

## Optional enhancements

- Switch to `webDarkTheme` and tune Theme API token overrides for dark mode.
- Override additional Theme API tokens (for example, header colors, cell selection, and spacing).
- Replace `iconsHorizon` with your own icon set while keeping all required icon keys.

## What you learned

- How to map Fluent UI color tokens from `webLightTheme` to the Theme API `colors` structure.
- How to register a custom theme with `registerTheme()`, Horizon icons and tokens, and `.params()` overrides for Fluent typography, spacing, and colors.
- How to pin the theme to light mode with `.setColorScheme('light')` so it matches the light Fluent values.
- How to render the grid inside a `FluentProvider` next to other Fluent components.

## Next steps

- Explore [Handsontable DataGrid with Ant Design](@/recipes/themes/ant-design/ant-design.md) for the same token-mapping approach with Ant Design.
- Explore [Handsontable DataGrid with MUI](@/recipes/themes/mui-theme/mui-theme.md) for Material UI integration.

## Related

- [Themes](@/guides/styling/themes/themes.md) - Built-in themes and Theme API.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Theme API parameters and CSS variable reference.
- [Theme Recipes](@/recipes/themes/themes.md) - Practical design-system recipes for Handsontable.
