---
id: f2a9c4d1
title: Handsontable with Ant Design
metaTitle: Handsontable with Ant Design - React Data Grid | Handsontable
description: Integrate Handsontable into a React app that uses Ant Design, and align the grid with your design system tokens through the Theme API.
permalink: /recipes/themes/ant-design
canonicalUrl: /recipes/themes/ant-design
tags:
  - guides
  - tutorial
  - recipes
  - ant design
  - design system
  - React
  - themes
  - Theme API
react:
  id: a8d3e6f2
  metaTitle: Handsontable with Ant Design - React Data Grid | Handsontable
angular:
  id: c4b7e1a9
  metaTitle: Handsontable with Ant Design - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Themes
---

<iframe src="https://codesandbox.io/embed/ylxwyx?view=preview"
  style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Handsontable with Ant Design recipe"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in CodeSandbox**](https://codesandbox.io/p/sandbox/ylxwyx)

## Overview

This recipe shows how to integrate Handsontable into a React app that uses [Ant Design](https://ant.design/) by registering a custom theme. You map Handsontable theme colors and tokens to Ant Design tokens, so the grid follows your UI system.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Stack:** React, Ant Design, Handsontable, `@handsontable/react-wrapper`

## What You'll Get

- A Handsontable grid with a custom theme registered through `registerTheme('ant-data-grid', { icons, colors, tokens })`.
- Theme colors based on Handsontable's built-in Ant palette (`colors/ant`) with token-based overrides.
- Zebra rows, typography, spacing, and colors aligned with Ant Design table tokens.

## Prerequisites

- A React app with Ant Design already configured.
- `handsontable` and `@handsontable/react-wrapper` installed in your app.

## Step 1: Install dependencies

In your project root:

```bash
npm install handsontable @handsontable/react-wrapper antd
```

(or `npm install` / `yarn add`).

## Step 2: Register modules and create a base Ant theme

Create a shared theme module, and register all Handsontable modules.

```tsx
import { registerAllModules } from 'handsontable/registry';
import { registerTheme } from 'handsontable/themes';
import colorsAnt from 'handsontable/themes/static/variables/colors/ant';
import iconsMain from 'handsontable/themes/static/variables/icons/main';
import tokensMain from 'handsontable/themes/static/variables/tokens/main';

registerAllModules();

export const antDataGridTheme = registerTheme('ant-data-grid', {
  icons: iconsMain,
  colors: colorsAnt,
  tokens: tokensMain,
}).params({
  tokens: {
    wrapperBorderRadius: '8px',
    wrapperBorderWidth: '1px',
    wrapperBorderColor: 'tokens.borderColor',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});
```

## Step 3: Map Ant Design tokens to Handsontable theme params

Use Ant Design's token hook to keep Handsontable in sync with your active Ant Design theme.

```tsx
import { theme as antdTheme } from 'antd';
import colorsAnt from 'handsontable/themes/static/variables/colors/ant';
import { antDataGridTheme } from './theme';

export function useAntHandsontableTheme() {
  const { token } = antdTheme.useToken();

  return antDataGridTheme.params({
    colors: {
      ...colorsAnt,
      primary: {
        ...colorsAnt.primary,
        500: token.colorPrimary,
        600: token.colorPrimaryHover,
      },
      white: token.colorBgContainer,
      black: token.colorText,
    },
    tokens: {
      backgroundColor: token.colorBgContainer,
      backgroundSecondaryColor: token.colorFillAlter,
      foregroundColor: token.colorText,
      foregroundSecondaryColor: token.colorTextDescription,
      borderColor: token.colorBorder,
      accentColor: token.colorPrimary,
      headerBackgroundColor: token.colorFillAlter,
      headerForegroundColor: token.colorTextHeading,
      cellHorizontalBorderColor: token.colorBorderSecondary,
      cellVerticalBorderColor: token.colorBorderSecondary,
      // Zebra rows like Ant Design tables.
      rowCellOddBackgroundColor: token.colorFillAlter,
      rowCellEvenBackgroundColor: token.colorBgContainer,
      rowHeaderOddBackgroundColor: token.colorFillAlter,
      rowHeaderEvenBackgroundColor: token.colorBgContainer,
      // Ant-like compact spacing.
      cellHorizontalPadding: `${token.paddingSM}px`,
      cellVerticalPadding: `${token.paddingXS}px`,
      wrapperBorderRadius: `${token.borderRadiusLG}px`,
      wrapperBorderWidth: '1px',
      wrapperBorderColor: token.colorBorderSecondary,
      fontFamily: token.fontFamily,
      fontSize: `${token.fontSize}px`,
      lineHeight: `${token.lineHeight}px`,
      headerFontWeight: `${token.fontWeightStrong}`,
    },
  });
}
```

## Step 4: Create the grid component

Pass the mapped theme to `HotTable`.

```tsx
import { HotTable } from '@handsontable/react-wrapper';
import { useMemo } from 'react';
import { useAntHandsontableTheme } from './useAntHandsontableTheme';

const data = [
  { name: 'Alice', role: 'Designer', country: 'USA' },
  { name: 'Bob', role: 'Engineer', country: 'Germany' },
  { name: 'Carla', role: 'Product', country: 'UK' },
];

export function AntDesignGrid() {
  const theme = useAntHandsontableTheme();
  const columns = useMemo(() => ([
    { data: 'name', title: 'Name' },
    { data: 'role', title: 'Role' },
    { data: 'country', title: 'Country' },
  ]), []);

  return (
    <HotTable
      data={data}
      colHeaders
      columns={columns}
      theme={theme}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
}
```

## Step 5: Wrap with `ConfigProvider`

Control your Ant Design theme (light, dark, custom brand), and Handsontable will reuse those values through your token mapping.

```tsx
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AntDesignGrid } from './AntDesignGrid';

export function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <AntDesignGrid />
    </ConfigProvider>
  );
}
```

## Tips

- Keep one source of truth - prefer Ant Design tokens as your source, and map Handsontable theme params from those tokens.
- Start with `colors/ant`, then override only the values you need.
- Use the same token map for dark mode, and switch it through Ant Design's `ConfigProvider`.

## Related

- [Themes](/themes) - Built-in themes and Theme API.
- [Theme customization](/theme-customization) - Theme API params and CSS variable reference.
- [Theme Recipes](/recipes/themes) - More recipes for design-system integration.
