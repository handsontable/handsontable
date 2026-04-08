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

<iframe src="https://codesandbox.io/p/sandbox/2hnsy8" title="Handsontable with Atlassian Design System demo" width="100%" height="500" frameborder="0" allowfullscreen style="border-radius: 8px; min-height: 500px;"></iframe>

[**Open in CodeSandbox**](https://codesandbox.io/p/sandbox/2hnsy8)

## Overview

This recipe shows how to style Handsontable with the [Atlassian Design System](https://atlassian.design/) by mapping ADS design tokens to the Handsontable Theme API. You register one custom theme, then reuse it across all your grids.

**Difficulty:** Intermediate  
**Time:** ~15 minutes  
**Stack:** React, Handsontable, `@handsontable/react-wrapper`, Atlassian Design System tokens

## What you'll build

- A reusable `atlassian-data-grid` Handsontable theme.
- Color mappings based on ADS token values.
- Theme registration with required `icons`, `colors`, and `tokens`.
- A minimal React table that imports Handsontable CSS and renders with ADS styling.

## Prerequisites

- A React app.
- Handsontable and the React wrapper.
- Atlassian Design System tokens available through `@atlaskit/tokens`.

## Step 1 - Install dependencies

```bash
npm install react react-dom handsontable@0.0.0-next-deba76c-20260408 @handsontable/react-wrapper@0.0.0-next-deba76c-20260408 @atlaskit/tokens @atlaskit/css-reset
```

## Step 2 - Register Handsontable modules

Register modules once before rendering the grid.

```tsx
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

## Step 3 - Create token-based color mapping

Create a `colors` object from ADS tokens. The Theme API expects `palette`, `primary`, `white`, `black`, and `transparent`.

**File: `src/theme.ts`**

```tsx
import { token } from '@atlaskit/tokens';
import { registerTheme } from 'handsontable/themes';
import iconsHorizon from 'handsontable/themes/static/variables/icons/horizon';
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';

const ds = (name: string, fallback: string) => token(name, fallback);

const colorsAtlassian = {
  palette: {
    50: ds('color.background.neutral.subtle', '#F7F8F9'),
    100: ds('elevation.surface', '#FFFFFF'),
    200: ds('elevation.surface.hovered', '#F1F2F4'),
    300: ds('elevation.surface.pressed', '#DCDFE4'),
    400: ds('color.border', '#B3B9C4'),
    500: ds('color.text.subtlest', '#626F86'),
    600: ds('color.text.subtle', '#44546F'),
    700: ds('color.text', '#172B4D'),
    800: ds('color.text', '#172B4D'),
    900: ds('color.text', '#172B4D'),
    950: ds('color.text', '#172B4D'),
  },
  primary: {
    100: ds('color.background.selected', '#E9F2FF'),
    200: ds('color.background.selected.hovered', '#CCE0FF'),
    300: ds('color.background.selected.pressed', '#85B8FF'),
    400: ds('color.link', '#0C66E4'),
    500: ds('color.link', '#0C66E4'),
    600: ds('color.link.pressed', '#0055CC'),
  },
  white: ds('elevation.surface', '#FFFFFF'),
  black: ds('color.text', '#172B4D'),
  transparent: 'transparent',
};

const atlassianDataGridTheme = registerTheme('atlassian-data-grid', {
  // icons are required by Theme Builder.
  icons: iconsHorizon,
  colors: colorsAtlassian,
  tokens: tokensHorizon,
}).params({
  tokens: {
    wrapperBorderRadius: ds('border.radius.100', '3px'),
  },
});
```

## Step 4 - Build a themed React table

Use your theme in `HotTable` and keep the setup minimal.

```tsx
import { HotTable, HotColumn } from '@handsontable/react-wrapper';

const data = [
  { name: 'Alice', team: 'Platform', active: true },
  { name: 'Bob', team: 'Payments', active: false },
  { name: 'Carla', team: 'Growth', active: true },
];

export default function DataGrid() {
  return (
    <HotTable
      theme={atlassianDataGridTheme}
      data={data}
      colHeaders={['Name', 'Team', 'Active']}
      rowHeaders={true}
      width="100%"
      height="auto"
      autoWrapRow={true}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="name" />
      <HotColumn data="team" />
      <HotColumn data="active" type="checkbox" className="htCenter" />
    </HotTable>
  );
}
```

## Step 5 - Add required CSS imports

Import Handsontable styles, plus ADS reset and light token CSS.

```tsx
import '@atlaskit/css-reset';
import '@atlaskit/tokens/css/atlassian-light.css';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
```

## Step 6 - Verify the result

Check these states in your running app:

- Header, cell background, and text colors.
- Selection, hover, and focus contrast.
- Borders and radius around the grid wrapper.

## Related

- [Themes](@/guides/styling/themes/themes.md) - Built-in themes and Theme API basics.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Theme API parameters and CSS variables.
- [Handsontable with shadcn/ui](@/recipes/themes/custom-theme/custom-theme.md) - Another design system recipe.
