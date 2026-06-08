---
type: how-to
id: 8f3c91ab
title: Handsontable with shadcn/ui
metaTitle: Handsontable with shadcn/ui - React Data Grid | Handsontable
description: Integrate Handsontable into a React app using shadcn/ui so the grid matches your design system colors, typography, and dark mode via the Theme API.
permalink: /recipes/themes/custom-theme
canonicalUrl: /recipes/themes/custom-theme
tags:
  - guides
  - tutorial
  - recipes
  - shadcn
  - tailwind
  - design system
  - React
  - themes
  - Theme API
  - custom theme
react:
  id: 9a4d82bc
  metaTitle: Handsontable with shadcn/ui - React Data Grid | Handsontable
angular:
  id: b582k93d
  metaTitle: Handsontable with shadcn/ui - Angular Data Grid | Handsontable
vue:
  id: jo0cv4kp
searchCategory: Recipes
category: Themes
---

This tutorial shows you how to integrate Handsontable into a Next.js app that uses shadcn/ui, registering a custom theme that maps shadcn CSS variables and Lucide icons to the Handsontable Theme API.

<iframe src="https://4y8dv9-3000.csb.app/" title="Handsontable with shadcn/ui demo" width="100%" height="500" frameborder="0" allowfullscreen style="border-radius: 8px; min-height: 500px;"></iframe>

[**Open in CodeSandbox**](https://codesandbox.io/p/devbox/github/handsontable/examples/tree/master/examples/next-shadcn.js)

## Overview

This recipe shows how to integrate Handsontable into a Next.js that uses [shadcn/ui](https://ui.shadcn.com/) by registering a **custom theme** that uses shadcn's CSS variables for colors, Lucide-style icons, and Horizon tokens. The grid follows your design system.

**Difficulty:** Beginner  
**Time:** ~15 minutes  
**Stack:** Next.js, shadcn/ui (Tailwind CSS), Handsontable, `@handsontable/react-wrapper`

## What You'll Get

- A Handsontable grid with a custom theme (`registerTheme('shadcn-data-grid', { icons, colors, tokens })`) where **colors** map to shadcn's `--primary`, `--background`, `--foreground`, `--muted`, `--border`, etc. via `var(--…)`.
- **Icons** using Lucide-style SVGs (data URIs with `currentColor`) so they match your theme.
- **Tokens** from Handsontable's Horizon set, with overrides (e.g. `wrapperBorderRadius`) to match shadcn's `--radius`.

## Prerequisites

- A Next.js project with shadcn/ui already set up (e.g. `app/globals.css` with shadcn imports and `:root` variables).
- shadcn's CSS variables defined (e.g. `--primary`, `--background`, `--foreground`, `--muted`, `--border`, `--radius`).
- This recipe uses `lib/` for theme and helpers and `components/` for the grid, adjust paths if your structure differs.

## Step 1: Install Handsontable

In your project root:

```bash
pnpm add handsontable @handsontable/react-wrapper
```

(or `npm install` / `yarn add`). Use `@handsontable/react-wrapper` for `HotTable` + `HotColumn` and `HotTableRef`.

## Step 2: Register modules

Register Handsontable modules (e.g. in your grid component).

```tsx
import { registerAllModules } from 'handsontable/registry';
import { registerTheme } from 'handsontable/themes';

registerAllModules();
```

## Step 3: Define shadcn colors for the theme

Create a colors object that maps Handsontable's expected shape to shadcn CSS variables. The grid will follow light/dark automatically because `var(--…)` is resolved at render time.

**Option A – use the built-in shadcn colors:**  
You can import the official mapping from Handsontable instead of defining your own:

```tsx
import colorsShadcn from 'handsontable/themes/static/variables/colors/shadcn';
```

**Option B – define your own (e.g. to match your globals.css):**  
**File: `lib/theme/colorsShadcn.ts`**

```tsx
/**
 * Handsontable theme colors mapped to shadcn CSS variables (globals.css).
 * Structure must match what tokens/main expects: palette (50–950), primary (100–600), white, black, transparent.
 * Uses var(--…) so the grid follows your shadcn theme and dark mode.
 */
export const colorsShadcn = {
  palette: {
    50: "var(--color-neutral-50)",
    100: "var(--color-neutral-200)",
    200: "var(--color-neutral-100)",
    300: "var(--color-neutral-300)",
    400: "var(--color-neutral-400)",
    500: "var(--color-neutral-500)",
    600: "var(--color-neutral-600)",
    700: "var(--color-neutral-700)",
    800: "var(--color-neutral-800)",
    900: "var(--color-neutral-900)",
    950: "var(--color-neutral-950)",
  },
  primary: {
    100: "var(--primary)",
    200: "var(--primary)",
    300: "var(--primary)",
    400: "var(--color-neutral-900)",
    500: "var(--primary)",
    600: "var(--color-neutral-800)",
  },
  white: "var(--background)",
  black: "var(--foreground)",
  transparent: "transparent",
}
```

## Step 4: Define Lucide-style icons for the theme

Handsontable themes accept an `icons` object. Use SVGs with `currentColor` so they follow your text/foreground color. Export as data URIs or inline SVG strings keyed by the theme's expected icon keys.

**File: `lib/theme/iconsShadcn.ts`**

```tsx
/**
 * Handsontable theme icons using Lucide (shadcn) icon set.
 * SVGs use currentColor so they follow shadcn theme. Keys must match VALID_ICON_KEYS.
 */
const lucideAttrs =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

function icon(svgContent: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg ${lucideAttrs}>${svgContent}</svg>`)}`;
}

// Lucide: ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ChevronsRight, ChevronsLeft, Check, Menu, Plus, Minus, Circle (filled for radio)
export const iconsShadcn = {
  arrowRight: icon('<path d="m9 18 6-6-6-6"/>'),
  arrowRightWithBar: icon('<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>'),
  arrowLeft: icon('<path d="m15 18-6-6 6-6"/>'),
  arrowLeftWithBar: icon('<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>'),
  arrowDown: icon('<path d="m6 9 6 6 6-6"/>'),
  menu: icon('<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>'),
  selectArrow: icon('<path d="m6 9 6 6 6-6"/>'),
  arrowNarrowUp: icon('<path d="m18 15-6-6-6 6"/>'),
  arrowNarrowDown: icon('<path d="m6 9 6 6 6-6"/>'),
  check: icon('<g transform="translate(3,3) scale(0.75)"><path d="M20 6 9 17l-5-5"/></g>'),
  checkbox: icon('<g transform="translate(3,3) scale(0.75)"><path d="M20 6 9 17l-5-5"/></g>'),
  caretHiddenLeft: icon('<path d="m15 18-6-6 6-6"/>'),
  caretHiddenRight: icon('<path d="m9 18 6-6-6-6"/>'),
  caretHiddenUp: icon('<path d="m18 15-6-6-6 6"/>'),
  caretHiddenDown: icon('<path d="m6 9 6 6 6-6"/>'),
  collapseOff: icon('<path d="M5 12h14"/>'),
  collapseOn: icon('<path d="M5 12h14"/><path d="M12 5v14"/>'),
  radio: icon('<circle cx="12" cy="12" r="6" fill="currentColor"/>'),
} as const;
```

Use the exact icon keys required by your Handsontable theme (e.g. from the theme's type or docs).

## Step 5: Register the custom theme and create the grid component

Import Horizon tokens (or another built-in token set), override tokens to match shadcn (e.g. `--radius`), and register the theme. Then use `HotTable` + `HotColumn` with that theme.

**Helpers (data and config):** Create a module that exports sample grid data and shared HotTable options. The `data` array should have one object per row, with keys matching your column `data` props (`name`, `age`, `country`, `city`, `isActive`, `interest`, etc.). The `config` object holds common props like `licenseKey` and `height`.

**File: `lib/helpers.ts`**

```ts
import { HotTableProps } from "@handsontable/react-wrapper";

export const config: Partial<HotTableProps> = {
  width: "100%",
  height: "auto",
  licenseKey: "non-commercial-and-evaluation",
  autoWrapRow: true,
  filters: true,
  // Add more options: nestedHeaders, contextMenu, dropdownMenu, pagination, etc.
};

export const data = [
  { name: "Alice", age: 28, country: "USA", city: "New York", isActive: true, interest: "Tech Gadgets", favoriteProduct: "Laptop", lastLoginDate: "Jan 15, 2025", lastLoginTime: "09:30" },
  { name: "Bob", age: 34, country: "UK", city: "London", isActive: false, interest: "Books & Literature", favoriteProduct: "Headphones", lastLoginDate: "Feb 01, 2025", lastLoginTime: "14:00" },
  // Add more rows; keys must match HotColumn data props
];
```

Then in your grid component (**File: `components/DataGrid.tsx`**):

```tsx
"use client";
import { forwardRef } from "react";
import { HotTable, HotColumn, HotTableRef } from "@handsontable/react-wrapper";
import { registerTheme } from "handsontable/themes";
import { registerAllModules } from "handsontable/registry";

import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';

import { colorsShadcn } from "@/lib/theme/colorsShadcn";
import { iconsShadcn } from "@/lib/theme/iconsShadcn";
import { data, config } from "@/lib/helpers";

registerAllModules();

const shadcnDataGridTheme = registerTheme('shadcn-data-grid', {
  icons: iconsShadcn,
  colors: colorsShadcn,
  tokens: tokensHorizon,
}).params({
  tokens: {
    wrapperBorderRadius: "var(--radius)",
  },
})

const DataGrid = forwardRef<HotTableRef, unknown>(function DataGrid(_, ref) {
  return (<HotTable
    ref={ref}
    theme={shadcnDataGridTheme}
    data={data}
    {...config}
  >
    <HotColumn data="name" width={160} />
    <HotColumn data="age" type="numeric" width={100} />
    <HotColumn
      data="country"
      type="autocomplete"
      source={[
        "Germany",
        "China",
        "France",
        "Netherlands",
        "Switzerland",
        "USA",
        "Canada",
        "UK",
        "Australia",
        "Spain",
        "Japan",
        "Brazil",
        "South Korea",
        "Mexico",
      ]}
      strict={true}
      allowInvalid={true}
      width={160}
    />
    <HotColumn
      data="city"
      type="dropdown"
      source={[
        "Walldorf",
        "Shenzhen",
        "Lyon",
        "Amsterdam",
        "Zurich",
        "New York",
        "Toronto",
        "London",
        "Sydney",
        "Los Angeles",
        "Barcelona",
        "Tokyo",
        "Manchester",
        "Sao Paulo",
        "Miami",
        "Madrid",
        "Seoul",
        "Vancouver",
        "Valencia",
        "Chicago",
        "Mexico City",
        "Houston",
      ]}
      width={160}
    />
    <HotColumn
      data="isActive"
      type="checkbox"
      className="htCenter"
      width={120}
    />
    <HotColumn
      data="interest"
      type="dropdown"
      source={[
        "Electronics",
        "Fashion",
        "Tech Gadgets",
        "Home Decor",
        "Sports & Fitness",
        "Books & Literature",
        "Beauty & Personal Care",
        "Food & Cooking",
        "Travel & Adventure",
        "Art & Collectibles",
      ]}
      width={220}
    />
    <HotColumn data="favoriteProduct" width={220} />
    <HotColumn
      data="lastLoginDate"
      type="date"
      className="htRight"
      dateFormat={{ year: 'numeric', month: 'short', day: 'numeric' }}
      width={180}
    />
    <HotColumn
      data="lastLoginTime"
      type="time"
      className="htRight"
      timeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      width={180}
    />
  </HotTable>);
});
```

Use the grid in your page (e.g. **`app/page.tsx`**): `import DataGrid from "@/components/DataGrid"` and render `<DataGrid />`.

## Complete example (minimal single-file shape)

The complete example adds a `DataGridWrapper` that wires the grid ref to URL search params for filtering. It uses the same `DataGrid` component from Step 5, wrapped with `memo` and `forwardRef`.

```tsx
"use client";
import { useRef, useEffect, memo, forwardRef } from "react";
import { useSearchParams } from "next/navigation";
import { HotTable, HotColumn, HotTableRef } from "@handsontable/react-wrapper";
import { registerTheme } from "handsontable/themes";
import { registerAllModules } from "handsontable/registry";
import tokensHorizon from 'handsontable/themes/static/variables/tokens/horizon';
import { colorsShadcn } from "@/lib/theme/colorsShadcn";
import { iconsShadcn } from "@/lib/theme/iconsShadcn";
import { data, config } from "@/lib/helpers";

registerAllModules();

// Theme registration and DataGrid component (same as Step 5)
const shadcnDataGridTheme = registerTheme('shadcn-data-grid', {
  icons: iconsShadcn,
  colors: colorsShadcn,
  tokens: tokensHorizon,
}).params({ tokens: { wrapperBorderRadius: "var(--radius)" } });

const DataGrid = forwardRef<HotTableRef, unknown>(function DataGrid(_, ref) {
  return (
    <HotTable ref={ref} theme={shadcnDataGridTheme} data={data} {...config}>
      {/* HotColumn definitions (see Step 5) */}
    </HotTable>
  );
});

const MemoizedDataGrid = memo(DataGrid);

function DataGridWrapper() {
  const hotTableRef = useRef<HotTableRef>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const hot = hotTableRef.current?.hotInstance;
    const params = Object.fromEntries(searchParams.entries());

    if (hot) {
      const filtersPlugin = hot.getPlugin('filters');

      if (filtersPlugin) {
        filtersPlugin.clearConditions();

        if (params.q) filtersPlugin.addCondition(0, 'begins_with', [params.q]);
        if (params.country) filtersPlugin.addCondition(2, 'contains', [params.country]);
        if (params.status) filtersPlugin.addCondition(4, 'eq', [params.status === 'active']);

        filtersPlugin.filter();
        hot?.render();
      }
    }
  }, [searchParams]);

  return <MemoizedDataGrid ref={hotTableRef} />;
}

export default DataGridWrapper;
```


## What you learned

You registered a custom Handsontable theme that maps shadcn CSS variables to Handsontable colors. You used Lucide-style SVG data URIs for icons, Horizon tokens as the base token set, and `.params()` overrides to apply your `--radius` variable to the grid wrapper.

## Next steps

- [Handsontable with Base Web](@/recipes/themes/base-theme/base-theme.md) - The same pattern using Base Web design tokens.
- [Handsontable with MUI](@/recipes/themes/mui-theme/mui-theme.md) - The same pattern reading colors from the MUI `Theme` object.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Full reference for Theme API parameters and CSS variables.

## Related

<div class="boxes-list">

- [Themes](@/guides/styling/themes/themes.md)
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md)
- [Design system](@/guides/styling/design-system/design-system.md)

</div>
