---
id: p7f3k9d2
title: Handsontable with Fluent UI
metaTitle: Handsontable with Fluent UI - React Data Grid | Handsontable
description: Integrate Handsontable into a React app with Fluent UI so your grid follows Fluent colors, typography, and spacing.
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
  id: v4m8q1t6
  metaTitle: Handsontable with Fluent UI - React Data Grid | Handsontable
searchCategory: Recipes
category: Themes
---

<iframe src="https://codesandbox.io/embed/z89zf5?view=preview"
     style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
     title="Handsontable with Fluent UI recipe"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

[**Open in CodeSandbox**](https://codesandbox.io/p/sandbox/z89zf5)

## Overview

This recipe shows how to integrate Handsontable into a React app that uses [Fluent UI](https://react.fluentui.dev/) by registering a custom theme with Theme API colors and tokens. The grid follows your Fluent design language.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Stack:** React, Fluent UI, Handsontable, `@handsontable/react-wrapper`

## What You'll Get

- A reusable Handsontable theme (`registerTheme('fluent-data-grid', { icons, colors, tokens })`) that maps to Fluent UI colors.
- A React grid component that applies the custom theme and keeps Fluent typography and spacing.
- A working baseline you can extend with dark mode and custom icon overrides.

## Prerequisites

- A React app with Fluent UI configured.
- Handsontable and the React wrapper installed.
- A `FluentProvider` at your app root.

## Step 1: Install dependencies with pinned Handsontable versions

```bash
npm install \
  handsontable@0.0.0-next-deba76c-20260408 \
  @handsontable/react-wrapper@0.0.0-next-deba76c-20260408 \
  @fluentui/react-components
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

Handsontable's Theme API expects the `palette`, `primary`, `white`, `black`, and `transparent` structure.

**File: `src/theme/colorsFluent.ts`**

```ts
const colorsFluent = {
  palette: {
    50: 'var(--colorNeutralBackground1)',
    100: 'var(--colorNeutralBackground2)',
    200: 'var(--colorNeutralBackground3)',
    300: 'var(--colorNeutralBackground4)',
    400: 'var(--colorNeutralStroke1)',
    500: 'var(--colorNeutralStroke2)',
    600: 'var(--colorNeutralForeground3)',
    700: 'var(--colorNeutralForeground2)',
    800: 'var(--colorNeutralForeground1)',
    900: 'var(--colorNeutralForegroundOnBrand)',
    950: 'var(--colorNeutralForegroundOnBrand)',
  },
  primary: {
    100: 'var(--colorBrandBackground)',
    200: 'var(--colorBrandBackground2)',
    300: 'var(--colorBrandBackgroundInverted)',
    400: 'var(--colorBrandStroke1)',
    500: 'var(--colorBrandForeground1)',
    600: 'var(--colorBrandForeground2)',
  },
  white: 'var(--colorNeutralBackground1)',
  black: 'var(--colorNeutralForeground1)',
  transparent: 'transparent',
};

export default colorsFluent;
```

## Step 4: Register your Fluent Handsontable theme

Import `icons` together with `colors` and `tokens`. `registerTheme()` requires `icons` - if omitted, ThemeBuilder throws an error.

```tsx
import { registerTheme } from 'handsontable/themes';
import iconsHorizon from 'handsontable/themes/static/variables/icons/horizon';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
import colorsFluent from './theme/colorsFluent';

export const fluentDataGridTheme = registerTheme('fluent-data-grid', {
  icons: iconsHorizon,
  colors: colorsFluent,
  tokens: tokensHorizon,
}).params({
  tokens: {
    fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', system-ui, sans-serif",
    wrapperBorderRadius: '4px',
  },
});
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
      theme={fluentDataGridTheme}
      data={data}
      colHeaders={['Team', 'Owner', 'Status', 'Priority']}
      rowHeaders={true}
      width="100%"
      height="auto"
      dropdownMenu={true}
      filters={true}
      licenseKey="non-commercial-and-evaluation"
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

## Related

- [Themes](@/guides/styling/themes/themes.md) - Built-in themes and Theme API.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Theme API parameters and CSS variable reference.
- [Theme Recipes](/recipes/themes) - Practical design-system recipes for Handsontable.
