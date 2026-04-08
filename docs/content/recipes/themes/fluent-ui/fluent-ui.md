---
id: p7f3k9d2
title: Handsontable with Fluent UI
metaTitle: Handsontable with Fluent UI - React Data Grid | Handsontable
description: Integrate Handsontable into a Fluent UI React app by registering a custom theme that uses Fluent tokens for colors, typography, spacing, and border radius.
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

## Overview

This recipe shows how to integrate Handsontable into a React app that uses Fluent UI. You register a custom Handsontable theme, map its colors and tokens to Fluent UI CSS variables, and apply the theme to your grid.

## What you'll build

- A Handsontable theme registered as `fluent-data-grid`.
- Theme colors mapped to Fluent variables such as `--colorNeutralBackground1`, `--colorNeutralForeground1`, and `--colorBrandBackground`.
- Theme tokens aligned with Fluent typography and radius tokens.

## Prerequisites

- A React application with Fluent UI installed and configured.
- Handsontable and `@handsontable/react-wrapper` installed.
- A root component wrapped with `FluentProvider` so Fluent variables are available in the DOM.

## Step 1: Install dependencies

```bash
npm install handsontable @handsontable/react-wrapper @fluentui/react-components
```

## Step 2: Wrap your app in FluentProvider

Fluent UI provides design tokens through the provider. Use either `webLightTheme`, `webDarkTheme`, or your own custom theme.

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

## Step 3: Define a Fluent UI color map for Handsontable

Create a color map that follows Handsontable's Theme API shape.

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

## Step 4: Register and apply your Fluent theme

Register all Handsontable modules, define the theme, and pass it to `HotTable`.

```tsx
import { HotTable } from '@handsontable/react-wrapper';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { registerTheme } from 'handsontable/themes';

import iconsMain from 'handsontable/themes/static/variables/icons/main';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';

import colorsFluent from './theme/colorsFluent';

registerAllModules();

const fluentDataGridTheme = registerTheme('fluent-data-grid', {
  colors: colorsFluent,
  icons: iconsMain,
  tokens: tokensHorizon,
}).params({
  tokens: {
    fontFamily: 'var(--fontFamilyBase)',
    wrapperBorderRadius: 'var(--borderRadiusMedium)',
    headerBackgroundColor: 'var(--colorNeutralBackground3)',
    headerForegroundColor: 'var(--colorNeutralForeground1)',
    cellSelectionBorderColor: 'var(--colorBrandStroke1)',
    cellSelectionBackgroundColor: 'var(--colorBrandBackground2)',
  },
});

const data = Handsontable.helper.createSpreadsheetData(20, 8);

export function FluentGrid() {
  return (
    <HotTable
      data={data}
      colHeaders={true}
      rowHeaders={true}
      width="100%"
      height="auto"
      theme={fluentDataGridTheme}
      licenseKey="non-commercial-and-evaluation"
    />
  );
}
```

## Step 5: Tune density and interaction styling

After the first integration, tune density and control tokens for your Fluent UI sizing scale:

- `cellHorizontalPadding`
- `cellVerticalPadding`
- `menuBorderRadius`
- `inputBorderRadius`
- `buttonBorderRadius`

Use `.params({ tokens: { ... } })` to iterate without creating another theme object.

## Related

- [Themes](/themes) - Built-in themes and Theme API.
- [Theme customization](/theme-customization) - Theme API parameters and CSS variable reference.
- [Handsontable Design System](/handsontable-design-system) - Design tokens and component styles.
