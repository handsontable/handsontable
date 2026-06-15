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
vue:
  id: 1idm09eu
searchCategory: Recipes
category: Themes
type: how-to
---

In this tutorial, you will integrate Handsontable into a React app that uses Ant Design and align the grid with your design system tokens through the Theme API. You will learn how to map Ant Design tokens to Handsontable theme parameters so the grid matches your existing styles.

<iframe src="https://codesandbox.io/embed/n3c25x?view=preview&module=%2Fsrc%2FApp.tsx"
  style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Handsontable with AntDesign"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in CodeSandbox**](https://codesandbox.io/p/sandbox/handsontable-with-antdesign-n3c25x)
[**View source on GitHub**](https://github.com/handsontable/examples/tree/master/examples/ant-design)

## Overview

This recipe uses the official [handsontable/examples Ant Design demo](https://github.com/handsontable/examples/tree/master/examples/ant-design) as the live reference implementation. It shows how to integrate Handsontable into a React app that uses [Ant Design](https://ant.design/) by registering a custom theme and mapping Handsontable theme colors and tokens to Ant Design table-like styles.

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

## Step 2: Register modules, data, and the Ant-like theme

Mirror the official example setup by registering modules, preparing row data, and creating a reusable theme instance.

```tsx
import { registerAllModules } from 'handsontable/registry';
import { getTheme, hasTheme, horizonTheme, registerTheme } from 'handsontable/themes';
import colorsAnt from 'handsontable/themes/static/variables/colors/ant';

registerAllModules();

const data = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
    actionHint: null,
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
    actionHint: null,
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sydney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
    actionHint: null,
  },
];

const THEME_NAME = 'horizon-ant-table';

const antTableTheme = (() => {
  if (hasTheme(THEME_NAME)) {
    return getTheme(THEME_NAME);
  }

  return registerTheme(THEME_NAME, horizonTheme)
    .params({
      colors: colorsAnt,
      tokens: {
        borderRadius: '8px',
        headerBackgroundColor: ['colors.palette.100', 'colors.palette.800'],
        headerFontWeight: '600',
        cellHorizontalBorderColor: ['colors.palette.200', 'colors.palette.700'],
        cellVerticalBorderColor: ['colors.palette.200', 'colors.palette.700'],
        cellHorizontalPadding: '16px',
        cellVerticalPadding: '8px',
        rowCellEvenBackgroundColor: ['colors.white', 'colors.palette.950'],
        rowCellOddBackgroundColor: ['colors.white', 'colors.palette.950'],
        cellReadOnlyBackgroundColor: ['colors.white', 'colors.palette.950'],
        foregroundColor: ['colors.palette.800', 'colors.palette.100'],
        linkColor: ['colors.primary.200', 'colors.primary.100'],
        linkHoverColor: ['colors.primary.100', 'colors.primary.200'],
      },
    })
    .setColorScheme('light')
    .setDensityType('comfortable');
})();
```

## Step 3: Create custom Ant-like cell renderers

Use Ant Design typography, tags, and spacing inside custom renderer components.

```tsx
import { Space, Tag, Typography } from 'antd';

function NameCell({ value }) {
  const label = value != null ? String(value) : '';

  return (
    <Typography.Link href="#" onClick={(event) => event.preventDefault()}>
      {label}
    </Typography.Link>
  );
}

function TagsCell({ value }) {
  const tags = Array.isArray(value) ? value : [];

  if (tags.length === 0) {
    return null;
  }

  return (
    <Space size={4} wrap>
      {tags.map((tag) => {
        let color = tag.length > 5 ? 'geekblue' : 'green';

        if (tag === 'loser') {
          color = 'volcano';
        }

        return (
          <Tag key={tag} color={color}>
            {String(tag).toUpperCase()}
          </Tag>
        );
      })}
    </Space>
  );
}

function ActionCell({ instance, row }) {
  const rowData = instance.getSourceDataAtRow(row);

  return (
    <Space size="middle">
      <Typography.Link href="#" onClick={(event) => event.preventDefault()}>
        Invite {rowData?.name ?? ''}
      </Typography.Link>
      <Typography.Link href="#" onClick={(event) => event.preventDefault()}>
        Delete
      </Typography.Link>
    </Space>
  );
}
```

## Step 4: Create the Handsontable grid component

Build the Ant-like table layout with `HotTable`, fixed column widths, and read-only cells.

```tsx
import { useCallback } from 'react';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';

function AntLikeGrid() {
  const readOnlyCell = useCallback(() => ({ readOnly: true }), []);

  return (
    <HotTable
      theme={antTableTheme}
      data={data}
      colHeaders={['Name', 'Age', 'Address', 'Tags', 'Action']}
      rowHeaders={false}
      stretchH="all"
      height="auto"
      autoRowSize={false}
      licenseKey="non-commercial-and-evaluation"
      cells={readOnlyCell}
    >
      <HotColumn data="name" width={160} renderer={NameCell} />
      <HotColumn data="age" width={72} type="numeric" />
      <HotColumn data="address" width={280} />
      <HotColumn data="tags" width={240} renderer={TagsCell} />
      <HotColumn data="actionHint" width={220} renderer={ActionCell} />
    </HotTable>
  );
}
```

## Step 5: Wrap the grid in Ant Design `Card`

Render the final view with Ant Design card styling around the table component.

```tsx
import { Card, Typography } from 'antd';

export default function App() {
  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card title={<Typography.Text strong>Handsontable with Ant Design theme tokens</Typography.Text>}>
        <AntLikeGrid />
      </Card>
    </div>
  );
}
```

## Tips

- Keep one source of truth - prefer Ant Design tokens as your source, and map Handsontable theme params from those tokens.
- Start with `colors/ant`, then override only the values you need.
- Use the same token map for dark mode, and switch it through Ant Design's `ConfigProvider`.

## What you learned

- How to extract Ant Design token values from `theme.getDesignToken()` and map them to Handsontable Theme API parameters.
- How to apply the mapped theme with `hot.updateSettings({ theme: new HotTableTheme({ ... }) })`.
- How to use `ConfigProvider` from Ant Design to drive both the Ant Design components and the Handsontable theme from a single source of truth.
- How to switch to dark mode by swapping the Ant Design algorithm and updating the Handsontable theme in the same callback.

## Next steps

- Explore [Handsontable with MUI](@/recipes/themes/mui-theme/mui-theme.md) for the same token-mapping approach with Material UI.
- Explore [Handsontable with shadcn/ui](@/recipes/themes/custom-theme/custom-theme.md) for Tailwind-based design system integration.

## Related

- [Themes](@/guides/styling/themes/themes.md) - Built-in themes and Theme API.
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md) - Theme API parameters and CSS variable reference.
- [Theme Recipes](@/recipes/themes/themes.md) - More recipes for design-system integration.
