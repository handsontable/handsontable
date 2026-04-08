---
id: p6t9k2m4
title: Handsontable with Atlassian Design System
metaTitle: Handsontable with Atlassian Design System - React Data Grid | Handsontable
description: Integrate Handsontable with Atlassian Design System tokens by registering a custom theme that maps ADS colors, typography, and radius values.
permalink: /recipes/themes/atlassian-design-system
canonicalUrl: /recipes/themes/atlassian-design-system
tags:
  - guides
  - tutorial
  - recipes
  - Atlassian
  - design system
  - themes
  - Theme API
  - React
react:
  id: q3v8n1c7
  metaTitle: Handsontable with Atlassian Design System - React Data Grid | Handsontable
angular:
  id: r5x2b9d4
  metaTitle: Handsontable with Atlassian Design System - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Themes
---

## Overview

This recipe shows how to style Handsontable with the [Atlassian Design System](https://atlassian.design/) by mapping ADS design tokens to the Handsontable Theme API. You register one custom theme, then reuse it across all your grids.

**Difficulty:** Intermediate  
**Stack:** React, Handsontable, `@handsontable/react-wrapper`, Atlassian Design System tokens

## What you'll build

- A reusable `atlassian-data-grid` Handsontable theme.
- Color mappings based on ADS token variables.
- Optional icon mappings for a stronger Atlassian look.
- Token overrides for border radius and spacing.

## Prerequisites

- A React app that already uses Atlassian Design System tokens.
- Handsontable and the React wrapper.
- ADS token CSS variables available at runtime (for example through your app's global styles).

## Step 1 - Install Handsontable packages

```bash
pnpm add handsontable @handsontable/react-wrapper
```

## Step 2 - Register Handsontable modules

Register modules once before rendering the grid.

```tsx
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

## Step 3 - Map Atlassian tokens to Handsontable colors

Create a color mapping object with `var(--ds-...)` values so the grid follows your ADS theme mode and palette.

**File: `src/theme/colorsAtlassian.ts`**

```tsx
export const colorsAtlassian = {
  palette: {
    50: 'var(--ds-surface-sunken, #F7F8F9)',
    100: 'var(--ds-surface, #FFFFFF)',
    200: 'var(--ds-surface-hovered, #F1F2F4)',
    300: 'var(--ds-surface-pressed, #DCDFE4)',
    400: 'var(--ds-border, #B3B9C4)',
    500: 'var(--ds-text-subtlest, #626F86)',
    600: 'var(--ds-text-subtle, #44546F)',
    700: 'var(--ds-text, #172B4D)',
    800: 'var(--ds-text, #172B4D)',
    900: 'var(--ds-text, #172B4D)',
    950: 'var(--ds-text, #172B4D)',
  },
  primary: {
    100: 'var(--ds-background-selected, #E9F2FF)',
    200: 'var(--ds-background-selected-hovered, #CCE0FF)',
    300: 'var(--ds-background-selected-pressed, #85B8FF)',
    400: 'var(--ds-link, #0C66E4)',
    500: 'var(--ds-link, #0C66E4)',
    600: 'var(--ds-link-pressed, #0055CC)',
  },
  white: 'var(--ds-surface, #FFFFFF)',
  black: 'var(--ds-text, #172B4D)',
  transparent: 'transparent',
};
```

## Step 4 - (Optional) map icons to match ADS styling

You can keep Handsontable default icons, or register your own icon pack. If you use custom icons, return SVG data URIs and keep the required icon keys.

**File: `src/theme/iconsAtlassian.ts`**

```tsx
function icon(svgContent: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svgContent}</svg>`
  )}`;
}

export const iconsAtlassian = {
  arrowRight: icon('<path d="m9 18 6-6-6-6"/>'),
  arrowLeft: icon('<path d="m15 18-6-6 6-6"/>'),
  arrowDown: icon('<path d="m6 9 6 6 6-6"/>'),
  check: icon('<path d="M20 6 9 17l-5-5"/>'),
};
```

## Step 5 - Register and apply the theme

Use a built-in token set as your base, then override only the values you want to align with ADS.

```tsx
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerTheme } from 'handsontable/themes';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';

import { colorsAtlassian } from './theme/colorsAtlassian';
import { iconsAtlassian } from './theme/iconsAtlassian';

const atlassianDataGridTheme = registerTheme('atlassian-data-grid', {
  colors: colorsAtlassian,
  icons: iconsAtlassian,
  tokens: tokensHorizon,
}).params({
  tokens: {
    wrapperBorderRadius: 'var(--ds-border-radius, 3px)',
  },
});

const data = [
  { name: 'Alice', team: 'Platform', status: 'Active' },
  { name: 'Bob', team: 'Payments', status: 'Paused' },
];

export default function DataGrid() {
  return (
    <HotTable
      theme={atlassianDataGridTheme}
      data={data}
      colHeaders={['Name', 'Team', 'Status']}
      rowHeaders={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="name" />
      <HotColumn data="team" />
      <HotColumn data="status" />
    </HotTable>
  );
}
```

## Step 6 - Verify light and dark mode

Because the theme uses `var(--ds-...)`, Handsontable follows your ADS mode automatically when your app changes token values. Verify:

- Header, cell background, and text colors.
- Selection, hover, and focus contrast.
- Borders and radius around the grid wrapper.

## Related

- [Themes](@/guides/styling/themes/themes.md) - Built-in themes and Theme API basics.
- [Theme customization](@/guides/styling/themes/theme-customization.md) - Theme API parameters and CSS variables.
- [Handsontable with shadcn/ui](@/recipes/themes/custom-theme/custom-theme.md) - Another design system recipe.
