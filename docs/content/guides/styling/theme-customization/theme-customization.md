---
type: how-to
id: x2u15qpx
title: Theme Customization
metaTitle: Theme Customization - JavaScript Data Grid | Handsontable
description: Customize Handsontable's appearance using the Theme API, Figma Theme Generator, CSS variables, or the visual Theme Builder.
permalink: /theme-customization
canonicalUrl: /theme-customization
tags:
  - styling
  - figma
  - UI kit
  - design system
  - grid components
  - prototyping
  - themes
  - CSS variables
  - local variables
  - tokens
react:
  id: 0m19ic0d
  metaTitle: Theme Customization - React Data Grid | Handsontable
angular:
  id: xau2jfok
  metaTitle: Theme Customization - Angular Data Grid | Handsontable
searchCategory: Guides
category: Styling
menuTag: updated
---
Customize Handsontable's appearance using the Theme API, Figma Theme Generator, CSS variables, or the visual Theme Builder.

[[toc]]

## Overview

CSS variables provide a powerful and flexible way to customize Handsontable's appearance by adjusting design elements such as colors, spacing, borders, and typography to match your application's design system. These variables give you granular control over every visual aspect of the data grid, from basic styling to advanced component customization.

We provide multiple approaches for leveraging CSS variables to create any look that your designer can imagine. From quick theme modifications to completely custom designs, your options include:

1. **Theme API** – Modify themes via configuration parameters or register your own custom theme programmatically.
2. **Figma Theme Generator** – Modify design variables in Figma and export them using the Figma Theme Generator tool.
3. **Override CSS variables** – Directly override CSS variables or edit CSS files from the `/styles` directory for full control.
4. **Theme Builder UI** – Use the online [Theme Builder](https://handsontable.com/theme-builder) to visually customize and export your theme without writing code.

The data grid's styling system is built entirely on CSS variables, with over 200 variables organized into logical categories covering typography, colors, spacing, borders, and component-specific styling listed below.

## Option 1: Theme API

The Theme API allows you to customize themes programmatically by registering custom themes and configuring them at runtime. You can use the `theme` option with a `ThemeBuilder` object for dynamic configuration.

### Register a custom theme

Use `registerTheme` to create a custom theme with your own configuration:

::: only-for javascript

```js
import Handsontable from 'handsontable';

import { mainTheme, registerTheme } from 'handsontable/themes';

// Register main theme
const myTheme = registerTheme(mainTheme);

// Configure the theme at runtime
myTheme.setColorScheme('light'); // 'light', 'dark', or 'auto'
myTheme.setDensityType('default'); // 'compact', 'default', or 'comfortable'

const hot = new Handsontable(container, {
  theme: myTheme,
  // other options
});
```

:::

::: only-for react

```jsx
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react-wrapper';

import { mainTheme, registerTheme } from 'handsontable/themes';

// Register main theme
const myTheme = registerTheme(mainTheme);

// Configure the theme at runtime
myTheme.setColorScheme('light');
myTheme.setDensityType('default');

function App() {
  return (
    <HotTable
      theme={myTheme}
      // other options
    />
  );
}
```

:::

::: only-for angular

```ts
import Handsontable from 'handsontable';

import { mainTheme, registerTheme } from 'handsontable/themes';

// Register main theme
const myTheme = registerTheme(mainTheme);

// Configure the theme at runtime
myTheme.setColorScheme('light');
myTheme.setDensityType('default');
```

```html
<hot-table [theme]="myTheme">
</hot-table>
```

:::

::: only-for vue

```ts
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { mainTheme, registerTheme } from 'handsontable/themes';

registerAllModules();

const myTheme = registerTheme(mainTheme);

myTheme.setColorScheme('light');
myTheme.setDensityType('default');

const hotSettings = ref({
  theme: myTheme,
  // other options
  licenseKey: 'non-commercial-and-evaluation',
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

### Configure theme parameters

Use the `params()` method to update theme parameters dynamically:

```js
myTheme.params({
  colors: {
    primary: {
      500: '#9333ea', // Change primary color
    },
  },
  tokens: {
    fontSize: '16px',
    iconSize: 'sizing.size_5',
    borderColor: ['colors.primary.500', 'colors.primary.600'],
  },
});
```

### Theme API example

The following example demonstrates using the Theme API to register a theme with a custom purple accent color:

::: only-for javascript

::: example #example2 --html 1 --js 2 --ts 3
@[code](@/content/guides/styling/theme-customization/javascript/example2.html)
@[code](@/content/guides/styling/theme-customization/javascript/example2.js)
@[code](@/content/guides/styling/theme-customization/javascript/example2.ts)
:::

:::

::: only-for react

::: example #example2 .disable-auto-theme :react --js 1 --ts 2
@[code](@/content/guides/styling/theme-customization/react/example2.jsx)
@[code](@/content/guides/styling/theme-customization/react/example2.tsx)
:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2
@[code](@/content/guides/styling/theme-customization/angular/example2.ts)
@[code](@/content/guides/styling/theme-customization/angular/example2.html)
:::

:::

::: only-for vue

::: example #example2 .disable-auto-theme :vue3

@[code](@/content/guides/styling/theme-customization/vue/example2.vue)

:::

:::

## Option 2: Figma Theme Generator

The Figma Theme Generator allows designers and developers to work together seamlessly by exporting design tokens directly from Figma into a CSS theme file.

### Export themes from Figma

To create a new theme or modify an existing one in Figma:

1. Open your Figma design file and modify the design variables (colors, spacing, typography, etc.) to match your requirements.
2. Export the design tokens as JSON using Figma's built-in variables export or a plugin.
3. Visit the [Handsontable Theme Generator](https://github.com/handsontable/handsontable-figma) and follow the instructions to convert your Figma tokens into CSS theme files or JS variable objects.

The Theme Generator transforms JSON tokens exported from Figma into properly formatted theme files that work with Handsontable. It outputs CSS files (with or without icons) and JS variable files for colors, tokens, and icons. This approach is ideal for teams where designers define the visual language in Figma and developers implement it in code.

## Option 3: Override CSS variables

For full control over your theme, you can override CSS variables directly. Follow these [steps](@/guides/styling/themes/themes.md#use-a-theme) to apply a theme, then override the variables for your chosen theme.

You can also directly modify the CSS theme files located in `handsontable/dist/styles/themes/`. This gives you immediate access to all CSS variables and allows for quick iterations.

Here's an example for `.ht-theme-main`:

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3
@[code](@/content/guides/styling/theme-customization/javascript/example1.html)
@[code](@/content/guides/styling/theme-customization/javascript/example1.js)
@[code](@/content/guides/styling/theme-customization/javascript/example1.ts)
:::

:::

::: only-for react

::: example #example1 .disable-auto-theme :react --js 1 --ts 2
@[code](@/content/guides/styling/theme-customization/react/example1.jsx)
@[code](@/content/guides/styling/theme-customization/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2
@[code](@/content/guides/styling/theme-customization/angular/example1.ts)
@[code](@/content/guides/styling/theme-customization/angular/example1.html)
:::

:::

::: only-for vue

::: example #example1 .disable-auto-theme :vue3

@[code](@/content/guides/styling/theme-customization/vue/example1.vue)

:::

:::

## Option 4: Use the Theme Builder UI

If you prefer a visual approach to creating themes, use the [Handsontable Theme Builder](https://handsontable.com/theme-builder). This online tool provides an intuitive interface for customizing colors, spacing, and other theme properties without writing code. Once you're satisfied with your design, you can export the generated your theme and integrate it into your project.

## Variables Reference

Handsontable provides a comprehensive set of JS and CSS variables that let you customize the appearance of every component.

**CSS Variable** — The names of the CSS custom properties (e.g. `--ht-sizing-size-1`) you can override in your stylesheet.

**JS Option** — The values in this column are the keys you use when customizing a theme via the Theme API. Call `theme.params()` on your registered theme and pass an object where each key is nested under one of:

- **`sizing`** — spacing and size scale (e.g. `sizing.size_1`)
- **`density.sizes.default`**, **`density.sizes.compact`**, or **`density.sizes.comfortable`** — density-specific spacing (e.g. `cellVertical`, `gap`)
- **`colors`** — color palette (e.g. `colors.primary.500`)
- **`tokens`** — design tokens used by components (e.g. `tokens.fontSize`)

Example: to override the `tokens.gapSize`, use the JS Option like this:

```js
  myTheme.params({
    tokens: {
      gapSize: 'sizing.size_1'
    }
  })
```

<div class="variables-table">

### Sizing Variables

| Variable | Description             |
| -------- | ----------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-0` </div><div class="variables-table__item"><span>JS:</span> `size_0` </div>    | Zero size (0px)         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-0-25` </div><div class="variables-table__item"><span>JS:</span> `size_0_25` </div> | Quarter unit size (1px) |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-0-5` </div><div class="variables-table__item"><span>JS:</span> `size_0_5` </div>  | Half unit size (2px)    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-1` </div><div class="variables-table__item"><span>JS:</span> `size_1` </div>    | Base unit size (4px)    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-1-5` </div><div class="variables-table__item"><span>JS:</span> `size_1_5` </div>  | 1.5x unit size (6px)    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-2` </div><div class="variables-table__item"><span>JS:</span> `size_2` </div>    | 2x unit size (8px)      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-3` </div><div class="variables-table__item"><span>JS:</span> `size_3` </div>    | 3x unit size (12px)     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-4` </div><div class="variables-table__item"><span>JS:</span> `size_4` </div>    | 4x unit size (16px)     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-5` </div><div class="variables-table__item"><span>JS:</span> `size_5` </div>    | 5x unit size (20px)     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-6` </div><div class="variables-table__item"><span>JS:</span> `size_6` </div>    | 6x unit size (24px)     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-7` </div><div class="variables-table__item"><span>JS:</span> `size_7` </div>    | 7x unit size (28px)     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-8` </div><div class="variables-table__item"><span>JS:</span> `size_8` </div>    | 8x unit size (32px)     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-9` </div><div class="variables-table__item"><span>JS:</span> `size_9` </div>    | 9x unit size (36px)     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-sizing-size-10` </div><div class="variables-table__item"><span>JS:</span> `size_10` </div>   | 10x unit size (40px)    |

### Density Variables

| Variable | Description                       |
| -------- | --------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-cell-vertical` </div><div class="variables-table__item"><span>JS:</span> `cellVertical` </div>       | Vertical padding for cells        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-cell-horizontal` </div><div class="variables-table__item"><span>JS:</span> `cellHorizontal` </div>     | Horizontal padding for cells      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-bars-horizontal` </div><div class="variables-table__item"><span>JS:</span> `barsHorizontal` </div>     | Horizontal padding for bars       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-bars-vertical` </div><div class="variables-table__item"><span>JS:</span> `barsVertical` </div>       | Vertical padding for bars         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-gap` </div><div class="variables-table__item"><span>JS:</span> `gap` </div>                | Standard gap size                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-button-horizontal` </div><div class="variables-table__item"><span>JS:</span> `buttonHorizontal` </div>   | Horizontal padding for buttons    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-button-vertical` </div><div class="variables-table__item"><span>JS:</span> `buttonVertical` </div>     | Vertical padding for buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-dialog-horizontal` </div><div class="variables-table__item"><span>JS:</span> `dialogHorizontal` </div>   | Horizontal padding for dialogs    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-dialog-vertical` </div><div class="variables-table__item"><span>JS:</span> `dialogVertical` </div>     | Vertical padding for dialogs      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-input-horizontal` </div><div class="variables-table__item"><span>JS:</span> `inputHorizontal` </div>    | Horizontal padding for inputs     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-input-vertical` </div><div class="variables-table__item"><span>JS:</span> `inputVertical` </div>      | Vertical padding for inputs       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-menu-vertical` </div><div class="variables-table__item"><span>JS:</span> `menuVertical` </div>       | Vertical padding for menus        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-menu-horizontal` </div><div class="variables-table__item"><span>JS:</span> `menuHorizontal` </div>     | Horizontal padding for menus      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-menu-item-vertical` </div><div class="variables-table__item"><span>JS:</span> `menuItemVertical` </div>   | Vertical padding for menu items   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-density-menu-item-horizontal` </div><div class="variables-table__item"><span>JS:</span> `menuItemHorizontal` </div> | Horizontal padding for menu items |

### Color Palette Variables

| Variable | Description                 |
| -------- | --------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-white` </div><div class="variables-table__item"><span>JS:</span> `white` </div>       | Pure white color            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-black` </div><div class="variables-table__item"><span>JS:</span> `black` </div>       | Pure black color            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-transparent` </div><div class="variables-table__item"><span>JS:</span> `transparent` </div> | Transparent color           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-primary-100` </div><div class="variables-table__item"><span>JS:</span> `primary.100` </div> | Lightest primary accent     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-primary-200` </div><div class="variables-table__item"><span>JS:</span> `primary.200` </div> | Light primary accent        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-primary-300` </div><div class="variables-table__item"><span>JS:</span> `primary.300` </div> | Medium-light primary accent |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-primary-400` </div><div class="variables-table__item"><span>JS:</span> `primary.400` </div> | Medium primary accent       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-primary-500` </div><div class="variables-table__item"><span>JS:</span> `primary.500` </div> | Main primary accent         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-primary-600` </div><div class="variables-table__item"><span>JS:</span> `primary.600` </div> | Dark primary accent         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-50` </div><div class="variables-table__item"><span>JS:</span> `palette.50` </div>  | Lightest gray               |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-100` </div><div class="variables-table__item"><span>JS:</span> `palette.100` </div> | Very light gray             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-200` </div><div class="variables-table__item"><span>JS:</span> `palette.200` </div> | Light gray                  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-300` </div><div class="variables-table__item"><span>JS:</span> `palette.300` </div> | Medium-light gray           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-400` </div><div class="variables-table__item"><span>JS:</span> `palette.400` </div> | Medium gray                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-500` </div><div class="variables-table__item"><span>JS:</span> `palette.500` </div> | Medium-dark gray            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-600` </div><div class="variables-table__item"><span>JS:</span> `palette.600` </div> | Dark gray                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-700` </div><div class="variables-table__item"><span>JS:</span> `palette.700` </div> | Darker gray                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-800` </div><div class="variables-table__item"><span>JS:</span> `palette.800` </div> | Very dark gray              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-900` </div><div class="variables-table__item"><span>JS:</span> `palette.900` </div> | Near black                  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-colors-palette-950` </div><div class="variables-table__item"><span>JS:</span> `palette.950` </div> | Darkest gray                |

### Tokens Variables

#### Typography Variables

| Variable | Description                          |
| -------- | ------------------------------------ |
| <div class="variables-table__item"><span>CSS:</span> `--ht-font-family` </div><div class="variables-table__item"><span>JS:</span> `fontFamily` </div>      | Font family for all text elements    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-font-size` </div><div class="variables-table__item"><span>JS:</span> `fontSize` </div>        | Base font size for all text elements |
| <div class="variables-table__item"><span>CSS:</span> `--ht-font-size-small` </div><div class="variables-table__item"><span>JS:</span> `fontSizeSmall` </div>   | Font size for smaller text           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-line-height` </div><div class="variables-table__item"><span>JS:</span> `lineHeight` </div>      | Line height for text elements        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-line-height-small` </div><div class="variables-table__item"><span>JS:</span> `lineHeightSmall` </div> | Line height for smaller text         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-font-weight` </div><div class="variables-table__item"><span>JS:</span> `fontWeight` </div>      | Font weight for text elements        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-letter-spacing` </div><div class="variables-table__item"><span>JS:</span> `letterSpacing` </div>   | Letter spacing for text elements     |

#### Layout & Spacing Variables

| Variable | Description                                     |
| -------- | ----------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-gap-size` </div><div class="variables-table__item"><span>JS:</span> `gapSize` </div>         | Standard gap size used throughout the component |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-size` </div><div class="variables-table__item"><span>JS:</span> `iconSize` </div>        | Size of icons throughout the interface          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-table-transition` </div><div class="variables-table__item"><span>JS:</span> `tableTransition` </div> | Transition duration for table animations        |

#### Color System Variables

| Variable | Description                                                |
| -------- | ---------------------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-border-color` </div><div class="variables-table__item"><span>JS:</span> `borderColor` </div>              | Default border color for all elements                      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-accent-color` </div><div class="variables-table__item"><span>JS:</span> `accentColor` </div>              | Primary accent color used for highlights and active states |
| <div class="variables-table__item"><span>CSS:</span> `--ht-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `foregroundColor` </div>          | Primary text color                                         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-foreground-secondary-color` </div><div class="variables-table__item"><span>JS:</span> `foregroundSecondaryColor` </div> | Secondary text color                                       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-background-color` </div><div class="variables-table__item"><span>JS:</span> `backgroundColor` </div>          | Primary background color                                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-background-secondary-color` </div><div class="variables-table__item"><span>JS:</span> `backgroundSecondaryColor` </div> | Secondary background color                                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-placeholder-color` </div><div class="variables-table__item"><span>JS:</span> `placeholderColor` </div>         | Color for placeholder text                                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-read-only-color` </div><div class="variables-table__item"><span>JS:</span> `readOnlyColor` </div>            | Color for read-only text                                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-disabled-color` </div><div class="variables-table__item"><span>JS:</span> `disabledColor` </div>             | Color for disabled elements                                |

#### Shadow Variables

| Variable | Description                  |
| -------- | ---------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-shadow-color` </div><div class="variables-table__item"><span>JS:</span> `shadowColor` </div>   | Base color used for shadows  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-shadow-x` </div><div class="variables-table__item"><span>JS:</span> `shadowX` </div>       | Horizontal offset of shadows |
| <div class="variables-table__item"><span>CSS:</span> `--ht-shadow-y` </div><div class="variables-table__item"><span>JS:</span> `shadowY` </div>       | Vertical offset of shadows   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-shadow-blur` </div><div class="variables-table__item"><span>JS:</span> `shadowBlur` </div>    | Blur radius of shadows       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-shadow-opacity` </div><div class="variables-table__item"><span>JS:</span> `shadowOpacity` </div> | Opacity of shadows           |

#### Bar Variables

| Variable | Description                            |
| -------- | -------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-bar-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `barForegroundColor` </div>   | Foreground color of bar elements       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-bar-background-color` </div><div class="variables-table__item"><span>JS:</span> `barBackgroundColor` </div>   | Background color of bar elements       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-bar-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `barHorizontalPadding` </div> | Horizontal padding inside bar elements |
| <div class="variables-table__item"><span>CSS:</span> `--ht-bar-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `barVerticalPadding` </div>   | Vertical padding inside bar elements   |

#### Cell Border Variables

| Variable | Description                      |
| -------- | -------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-horizontal-border-color` </div><div class="variables-table__item"><span>JS:</span> `cellHorizontalBorderColor` </div> | Color of horizontal cell borders |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-vertical-border-color` </div><div class="variables-table__item"><span>JS:</span> `cellVerticalBorderColor` </div>   | Color of vertical cell borders   |

#### Wrapper Variables

| Variable | Description                        |
| -------- | ---------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-wrapper-border-width` </div><div class="variables-table__item"><span>JS:</span> `wrapperBorderWidth` </div>  | Width of the table wrapper border  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-wrapper-border-radius` </div><div class="variables-table__item"><span>JS:</span> `wrapperBorderRadius` </div> | Border radius of the table wrapper |
| <div class="variables-table__item"><span>CSS:</span> `--ht-wrapper-border-color` </div><div class="variables-table__item"><span>JS:</span> `wrapperBorderColor` </div>  | Color of the table wrapper border  |

#### Row Styling Variables

| Variable | Description                           |
| -------- | ------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-row-header-odd-background-color` </div><div class="variables-table__item"><span>JS:</span> `rowHeaderOddBackgroundColor` </div>  | Background color for odd row headers  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-row-header-even-background-color` </div><div class="variables-table__item"><span>JS:</span> `rowHeaderEvenBackgroundColor` </div> | Background color for even row headers |
| <div class="variables-table__item"><span>CSS:</span> `--ht-row-cell-odd-background-color` </div><div class="variables-table__item"><span>JS:</span> `rowCellOddBackgroundColor` </div>    | Background color for odd row cells    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-row-cell-even-background-color` </div><div class="variables-table__item"><span>JS:</span> `rowCellEvenBackgroundColor` </div>   | Background color for even row cells   |

#### Cell Padding Variables

| Variable | Description                     |
| -------- | ------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `cellHorizontalPadding` </div> | Horizontal padding inside cells |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `cellVerticalPadding` </div>   | Vertical padding inside cells   |

#### Cell Editor Variables

| Variable | Description                         |
| -------- | ----------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-editor-border-width` </div><div class="variables-table__item"><span>JS:</span> `cellEditorBorderWidth` </div>      | Border width of cell editors        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-editor-border-color` </div><div class="variables-table__item"><span>JS:</span> `cellEditorBorderColor` </div>      | Border color of cell editors        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-editor-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `cellEditorForegroundColor` </div>  | Text color in cell editors          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-editor-background-color` </div><div class="variables-table__item"><span>JS:</span> `cellEditorBackgroundColor` </div>  | Background color of cell editors    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-editor-shadow-blur-radius` </div><div class="variables-table__item"><span>JS:</span> `cellEditorShadowBlurRadius` </div> | Shadow blur radius for cell editors |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-editor-shadow-color` </div><div class="variables-table__item"><span>JS:</span> `cellEditorShadowColor` </div>      | Shadow color for cell editors       |

#### Cell State Variables

| Variable | Description                                     |
| -------- | ----------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-success-background-color` </div><div class="variables-table__item"><span>JS:</span> `cellSuccessBackgroundColor` </div>  | Background color for successful cell operations |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-error-background-color` </div><div class="variables-table__item"><span>JS:</span> `cellErrorBackgroundColor` </div>    | Background color for error states in cells      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-read-only-background-color` </div><div class="variables-table__item"><span>JS:</span> `cellReadOnlyBackgroundColor` </div> | Background color for read-only cells            |

#### Cell Selection Variables

| Variable | Description                         |
| -------- | ----------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-selection-border-color` </div><div class="variables-table__item"><span>JS:</span> `cellSelectionBorderColor` </div>     | Border color for selected cells     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-selection-background-color` </div><div class="variables-table__item"><span>JS:</span> `cellSelectionBackgroundColor` </div> | Background color for selected cells |

#### Cell Autofill Variables

| Variable | Description                             |
| -------- | --------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-autofill-size` </div><div class="variables-table__item"><span>JS:</span> `cellAutofillSize` </div>            | Size of the autofill handle             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-autofill-hit-area-size` </div><div class="variables-table__item"><span>JS:</span> `cellAutofillHitAreaSize` </div>     | Size of the autofill hit area           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-autofill-border-width` </div><div class="variables-table__item"><span>JS:</span> `cellAutofillBorderWidth` </div>     | Border width of autofill elements       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-autofill-border-radius` </div><div class="variables-table__item"><span>JS:</span> `cellAutofillBorderRadius` </div>    | Border radius of autofill elements      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-autofill-border-color` </div><div class="variables-table__item"><span>JS:</span> `cellAutofillBorderColor` </div>     | Border color of autofill elements       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-autofill-background-color` </div><div class="variables-table__item"><span>JS:</span> `cellAutofillBackgroundColor` </div> | Background color of autofill elements   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-autofill-fill-border-color` </div><div class="variables-table__item"><span>JS:</span> `cellAutofillFillBorderColor` </div> | Border color of autofill fill indicator |

#### Cell Mobile Handle Variables

| Variable | Description                          |
| -------- | ------------------------------------ |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-mobile-handle-size` </div><div class="variables-table__item"><span>JS:</span> `cellMobileHandleSize` </div>              | Size of mobile touch handles         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-mobile-handle-border-width` </div><div class="variables-table__item"><span>JS:</span> `cellMobileHandleBorderWidth` </div>       | Border width of mobile handles       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-mobile-handle-border-radius` </div><div class="variables-table__item"><span>JS:</span> `cellMobileHandleBorderRadius` </div>      | Border radius of mobile handles      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-mobile-handle-border-color` </div><div class="variables-table__item"><span>JS:</span> `cellMobileHandleBorderColor` </div>       | Border color of mobile handles       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-mobile-handle-background-color` </div><div class="variables-table__item"><span>JS:</span> `cellMobileHandleBackgroundColor` </div>   | Background color of mobile handles   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-cell-mobile-handle-background-opacity` </div><div class="variables-table__item"><span>JS:</span> `cellMobileHandleBackgroundOpacity` </div> | Background opacity of mobile handles |

#### Indicator Variables

| Variable | Description                          |
| -------- | ------------------------------------ |
| <div class="variables-table__item"><span>CSS:</span> `--ht-resize-indicator-color` </div><div class="variables-table__item"><span>JS:</span> `resizeIndicatorColor` </div> | Color of resize indicators           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-move-backlight-color` </div><div class="variables-table__item"><span>JS:</span> `moveBacklightColor` </div>   | Background color for move operations |
| <div class="variables-table__item"><span>CSS:</span> `--ht-move-backlight-opacity` </div><div class="variables-table__item"><span>JS:</span> `moveBacklightOpacity` </div> | Opacity of move backlight            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-move-indicator-color` </div><div class="variables-table__item"><span>JS:</span> `moveIndicatorColor` </div>   | Color of move indicators             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-hidden-indicator-color` </div><div class="variables-table__item"><span>JS:</span> `hiddenIndicatorColor` </div> | Color of hidden element indicators   |

#### Scrollbar Variables

| Variable | Description                          |
| -------- | ------------------------------------ |
| <div class="variables-table__item"><span>CSS:</span> `--ht-scrollbar-border-radius` </div><div class="variables-table__item"><span>JS:</span> `scrollbarBorderRadius` </div> | Border radius of scrollbars          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-scrollbar-track-color` </div><div class="variables-table__item"><span>JS:</span> `scrollbarTrackColor` </div>   | Background color of scrollbar tracks |
| <div class="variables-table__item"><span>CSS:</span> `--ht-scrollbar-thumb-color` </div><div class="variables-table__item"><span>JS:</span> `scrollbarThumbColor` </div>   | Color of scrollbar thumbs            |

#### Header Variables

| Variable | Description                              |
| -------- | ---------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-font-weight` </div><div class="variables-table__item"><span>JS:</span> `headerFontWeight` </div>                 | Font weight for header text              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `headerForegroundColor` </div>            | Text color for headers                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-background-color` </div><div class="variables-table__item"><span>JS:</span> `headerBackgroundColor` </div>            | Background color for headers             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-highlighted-shadow-size` </div><div class="variables-table__item"><span>JS:</span> `headerHighlightedShadowSize` </div>      | Shadow size for highlighted headers      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-highlighted-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `headerHighlightedForegroundColor` </div> | Text color for highlighted headers       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-highlighted-background-color` </div><div class="variables-table__item"><span>JS:</span> `headerHighlightedBackgroundColor` </div> | Background color for highlighted headers |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-active-border-color` </div><div class="variables-table__item"><span>JS:</span> `headerActiveBorderColor` </div>          | Border color for active headers          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-active-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `headerActiveForegroundColor` </div>      | Text color for active headers            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-active-background-color` </div><div class="variables-table__item"><span>JS:</span> `headerActiveBackgroundColor` </div>      | Background color for active headers      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-filter-background-color` </div><div class="variables-table__item"><span>JS:</span> `headerFilterBackgroundColor` </div>      | Background color for header filters      |

#### Header Row Variables

| Variable | Description                                  |
| -------- | -------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-row-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `headerRowForegroundColor` </div>            | Text color for header rows                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-row-background-color` </div><div class="variables-table__item"><span>JS:</span> `headerRowBackgroundColor` </div>            | Background color for header rows             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-row-highlighted-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `headerRowHighlightedForegroundColor` </div> | Text color for highlighted header rows       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-row-highlighted-background-color` </div><div class="variables-table__item"><span>JS:</span> `headerRowHighlightedBackgroundColor` </div> | Background color for highlighted header rows |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-row-active-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `headerRowActiveForegroundColor` </div>      | Text color for active header rows            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-header-row-active-background-color` </div><div class="variables-table__item"><span>JS:</span> `headerRowActiveBackgroundColor` </div>      | Background color for active header rows      |

#### Checkbox Variables

| Variable | Description                                           |
| -------- | ----------------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-size` </div><div class="variables-table__item"><span>JS:</span> `checkboxSize` </div>                                 | Size of checkbox elements                             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-border-radius` </div><div class="variables-table__item"><span>JS:</span> `checkboxBorderRadius` </div>                         | Border radius of checkboxes                           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxBorderColor` </div>                          | Border color of checkboxes                            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxBackgroundColor` </div>                      | Background color of checkboxes                        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIconColor` </div>                            | Color of checkbox icons                               |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxFocusBorderColor` </div>                     | Border color of focused checkboxes                    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxFocusBackgroundColor` </div>                 | Background color of focused checkboxes                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-focus-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxFocusIconColor` </div>                       | Icon color of focused checkboxes                      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-focus-ring-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxFocusRingColor` </div>                       | Focus ring color for checkboxes                       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxDisabledBorderColor` </div>                  | Border color of disabled checkboxes                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxDisabledBackgroundColor` </div>              | Background color of disabled checkboxes               |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-disabled-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxDisabledIconColor` </div>                    | Icon color of disabled checkboxes                     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedBorderColor` </div>                   | Border color of checked checkboxes                    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedBackgroundColor` </div>               | Background color of checked checkboxes                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedIconColor` </div>                     | Icon color of checked checkboxes                      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedFocusBorderColor` </div>              | Border color of focused checked checkboxes            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedFocusBackgroundColor` </div>          | Background color of focused checked checkboxes        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-focus-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedFocusIconColor` </div>                | Icon color of focused checked checkboxes              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedDisabledBorderColor` </div>           | Border color of disabled checked checkboxes           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedDisabledBackgroundColor` </div>       | Background color of disabled checked checkboxes       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-checked-disabled-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxCheckedDisabledIconColor` </div>             | Icon color of disabled checked checkboxes             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateBorderColor` </div>             | Border color of indeterminate checkboxes              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateBackgroundColor` </div>         | Background color of indeterminate checkboxes          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateIconColor` </div>               | Icon color of indeterminate checkboxes                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateFocusBorderColor` </div>        | Border color of focused indeterminate checkboxes      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateFocusBackgroundColor` </div>    | Background color of focused indeterminate checkboxes  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-focus-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateFocusIconColor` </div>          | Icon color of focused indeterminate checkboxes        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateDisabledBorderColor` </div>     | Border color of disabled indeterminate checkboxes     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateDisabledBackgroundColor` </div> | Background color of disabled indeterminate checkboxes |
| <div class="variables-table__item"><span>CSS:</span> `--ht-checkbox-indeterminate-disabled-icon-color` </div><div class="variables-table__item"><span>JS:</span> `checkboxIndeterminateDisabledIconColor` </div>       | Icon color of disabled indeterminate checkboxes       |

#### Radio Button Variables

| Variable | Description                                        |
| -------- | -------------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-size` </div><div class="variables-table__item"><span>JS:</span> `radioSize` </div>                           | Size of radio button elements                      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-border-color` </div><div class="variables-table__item"><span>JS:</span> `radioBorderColor` </div>                    | Border color of radio buttons                      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-background-color` </div><div class="variables-table__item"><span>JS:</span> `radioBackgroundColor` </div>                | Background color of radio buttons                  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-icon-color` </div><div class="variables-table__item"><span>JS:</span> `radioIconColor` </div>                      | Color of radio button icons                        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `radioFocusBorderColor` </div>               | Border color of focused radio buttons              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `radioFocusBackgroundColor` </div>           | Background color of focused radio buttons          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-focus-icon-color` </div><div class="variables-table__item"><span>JS:</span> `radioFocusIconColor` </div>                 | Icon color of focused radio buttons                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-focus-ring-color` </div><div class="variables-table__item"><span>JS:</span> `radioFocusRingColor` </div>                 | Focus ring color for radio buttons                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `radioDisabledBorderColor` </div>            | Border color of disabled radio buttons             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `radioDisabledBackgroundColor` </div>        | Background color of disabled radio buttons         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-disabled-icon-color` </div><div class="variables-table__item"><span>JS:</span> `radioDisabledIconColor` </div>              | Icon color of disabled radio buttons               |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-border-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedBorderColor` </div>             | Border color of checked radio buttons              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-background-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedBackgroundColor` </div>         | Background color of checked radio buttons          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-icon-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedIconColor` </div>               | Icon color of checked radio buttons                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedFocusBorderColor` </div>        | Border color of focused checked radio buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedFocusBackgroundColor` </div>    | Background color of focused checked radio buttons  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-focus-icon-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedFocusIconColor` </div>          | Icon color of focused checked radio buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedDisabledBorderColor` </div>     | Border color of disabled checked radio buttons     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedDisabledBackgroundColor` </div> | Background color of disabled checked radio buttons |
| <div class="variables-table__item"><span>CSS:</span> `--ht-radio-checked-disabled-icon-color` </div><div class="variables-table__item"><span>JS:</span> `radioCheckedDisabledIconColor` </div>       | Icon color of disabled checked radio buttons       |

#### Icon Button Variables

| Variable | Description                                     |
| -------- | ----------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-border-radius` </div><div class="variables-table__item"><span>JS:</span> `iconButtonBorderRadius` </div>               | Border radius of icon buttons                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-large-border-radius` </div><div class="variables-table__item"><span>JS:</span> `iconButtonLargeBorderRadius` </div>          | Border radius of large icon buttons             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-large-padding` </div><div class="variables-table__item"><span>JS:</span> `iconButtonLargePadding` </div>               | Padding of large icon buttons                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-border-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonBorderColor` </div>                | Border color of icon buttons                    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-background-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonBackgroundColor` </div>            | Background color of icon buttons                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-icon-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonIconColor` </div>                  | Color of icon button icons                      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonHoverBorderColor` </div>           | Border color of hovered icon buttons            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonHoverBackgroundColor` </div>       | Background color of hovered icon buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-hover-icon-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonHoverIconColor` </div>             | Icon color of hovered icon buttons              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-active-border-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonActiveBorderColor` </div>          | Border color of active icon buttons             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-active-background-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonActiveBackgroundColor` </div>      | Background color of active icon buttons         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-active-icon-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonActiveIconColor` </div>            | Icon color of active icon buttons               |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-active-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonActiveHoverBorderColor` </div>     | Border color of hovered active icon buttons     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-active-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonActiveHoverBackgroundColor` </div> | Background color of hovered active icon buttons |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-active-hover-icon-color` </div><div class="variables-table__item"><span>JS:</span> `iconButtonActiveHoverIconColor` </div>       | Icon color of hovered active icon buttons       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-icon-button-hit-area-size` </div><div class="variables-table__item"><span>JS:</span> `iconButtonHitAreaSize` </div>               | Hit area size of icon buttons |

#### Collapse Button Variables

| Variable | Description                                          |
| -------- | ---------------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-border-radius` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonBorderRadius` </div>              | Border radius of collapse buttons                    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-border-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenBorderColor` </div>           | Border color of open collapse buttons                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-background-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenBackgroundColor` </div>       | Background color of open collapse buttons            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-icon-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenIconColor` </div>             | Icon color of open collapse buttons                  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-icon-active-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenIconActiveColor` </div>       | Active icon color of open collapse buttons           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenHoverBorderColor` </div>      | Border color of hovered open collapse buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenHoverBackgroundColor` </div>  | Background color of hovered open collapse buttons    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-hover-icon-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenHoverIconColor` </div>        | Icon color of hovered open collapse buttons          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-open-hover-icon-active-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonOpenHoverIconActiveColor` </div>  | Active icon color of hovered open collapse buttons   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-border-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseBorderColor` </div>          | Border color of closed collapse buttons              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-background-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseBackgroundColor` </div>      | Background color of closed collapse buttons          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-icon-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseIconColor` </div>            | Icon color of closed collapse buttons                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-icon-active-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseIconActiveColor` </div>      | Active icon color of closed collapse buttons         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseHoverBorderColor` </div>     | Border color of hovered closed collapse buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseHoverBackgroundColor` </div> | Background color of hovered closed collapse buttons  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-hover-icon-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseHoverIconColor` </div>       | Icon color of hovered closed collapse buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-collapse-button-close-hover-icon-active-color` </div><div class="variables-table__item"><span>JS:</span> `collapseButtonCloseHoverIconActiveColor` </div> | Active icon color of hovered closed collapse buttons |

#### Button Variables

| Variable | Description                   |
| -------- | ----------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-button-border-radius` </div><div class="variables-table__item"><span>JS:</span> `buttonBorderRadius` </div>      | Border radius of buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-button-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `buttonHorizontalPadding` </div> | Horizontal padding of buttons |
| <div class="variables-table__item"><span>CSS:</span> `--ht-button-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `buttonVerticalPadding` </div>   | Vertical padding of buttons   |

#### Primary Button Variables

| Variable | Description                                  |
| -------- | -------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-border-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonBorderColor` </div>             | Border color of primary buttons              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonForegroundColor` </div>         | Text color of primary buttons                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-background-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonBackgroundColor` </div>         | Background color of primary buttons          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonDisabledBorderColor` </div>     | Border color of disabled primary buttons     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-disabled-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonDisabledForegroundColor` </div> | Text color of disabled primary buttons       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonDisabledBackgroundColor` </div> | Background color of disabled primary buttons |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonHoverBorderColor` </div>        | Border color of hovered primary buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-hover-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonHoverForegroundColor` </div>    | Text color of hovered primary buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonHoverBackgroundColor` </div>    | Background color of hovered primary buttons  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonFocusBorderColor` </div>        | Border color of focused primary buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-focus-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonFocusForegroundColor` </div>    | Text color of focused primary buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-primary-button-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `primaryButtonFocusBackgroundColor` </div>    | Background color of focused primary buttons  |

#### Secondary Button Variables

| Variable | Description                                    |
| -------- | ---------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-border-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonBorderColor` </div>             | Border color of secondary buttons              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonForegroundColor` </div>         | Text color of secondary buttons                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-background-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonBackgroundColor` </div>         | Background color of secondary buttons          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonDisabledBorderColor` </div>     | Border color of disabled secondary buttons     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-disabled-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonDisabledForegroundColor` </div> | Text color of disabled secondary buttons       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonDisabledBackgroundColor` </div> | Background color of disabled secondary buttons |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonHoverBorderColor` </div>        | Border color of hovered secondary buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-hover-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonHoverForegroundColor` </div>    | Text color of hovered secondary buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonHoverBackgroundColor` </div>    | Background color of hovered secondary buttons  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonFocusBorderColor` </div>        | Border color of focused secondary buttons      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-focus-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonFocusForegroundColor` </div>    | Text color of focused secondary buttons        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-secondary-button-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `secondaryButtonFocusBackgroundColor` </div>    | Background color of focused secondary buttons  |

#### Chip Variables

| Variable | Description                         |
| -------- | ----------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-chip-background` </div><div class="variables-table__item"><span>JS:</span> `chipBackground` </div>        | Background color of chip elements   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-chip-border-radius` </div><div class="variables-table__item"><span>JS:</span> `chipBorderRadius` </div>      | Border radius of chip elements      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-chip-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `chipVerticalPadding` </div>   | Vertical padding of chip elements   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-chip-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `chipHorizontalPadding` </div> | Horizontal padding of chip elements |
| <div class="variables-table__item"><span>CSS:</span> `--ht-chip-gap` </div><div class="variables-table__item"><span>JS:</span> `chipGap` </div>               | Gap between chip elements           |

#### Comments Variables

| Variable | Description                                   |
| -------- | --------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaHorizontalPadding` </div>    | Horizontal padding of comment textareas       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaVerticalPadding` </div>      | Vertical padding of comment textareas         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-border-width` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaBorderWidth` </div>          | Border width of comment textareas             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-border-color` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaBorderColor` </div>          | Border color of comment textareas             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaForegroundColor` </div>      | Text color of comment textareas               |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-background-color` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaBackgroundColor` </div>      | Background color of comment textareas         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-focus-border-width` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaFocusBorderWidth` </div>     | Border width of focused comment textareas     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaFocusBorderColor` </div>     | Border color of focused comment textareas     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-focus-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaFocusForegroundColor` </div> | Text color of focused comment textareas       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-textarea-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `commentsTextareaFocusBackgroundColor` </div> | Background color of focused comment textareas |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-indicator-size` </div><div class="variables-table__item"><span>JS:</span> `commentsIndicatorSize` </div>                | Size of comment indicators                    |
| <div class="variables-table__item"><span>CSS:</span> `--ht-comments-indicator-color` </div><div class="variables-table__item"><span>JS:</span> `commentsIndicatorColor` </div>               | Color of comment indicators                   |

#### License Variables

| Variable | Description                            |
| -------- | -------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-license-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `licenseHorizontalPadding` </div> | Horizontal padding of license elements |
| <div class="variables-table__item"><span>CSS:</span> `--ht-license-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `licenseVerticalPadding` </div>   | Vertical padding of license elements   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-license-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `licenseForegroundColor` </div>   | Text color of license elements         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-license-background-color` </div><div class="variables-table__item"><span>JS:</span> `licenseBackgroundColor` </div>   | Background color of license elements   |

#### Link Variables

| Variable | Description            |
| -------- | ---------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-link-color` </div><div class="variables-table__item"><span>JS:</span> `linkColor` </div>      | Color of links         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-link-hover-color` </div><div class="variables-table__item"><span>JS:</span> `linkHoverColor` </div> | Color of hovered links |

#### Input Variables

| Variable | Description                                 |
| -------- | ------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-border-width` </div><div class="variables-table__item"><span>JS:</span> `inputBorderWidth` </div>             | Border width of input elements              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-border-radius` </div><div class="variables-table__item"><span>JS:</span> `inputBorderRadius` </div>            | Border radius of input elements             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `inputHorizontalPadding` </div>       | Horizontal padding of input elements        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `inputVerticalPadding` </div>         | Vertical padding of input elements          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-border-color` </div><div class="variables-table__item"><span>JS:</span> `inputBorderColor` </div>             | Border color of input elements              |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `inputForegroundColor` </div>         | Text color of input elements                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-background-color` </div><div class="variables-table__item"><span>JS:</span> `inputBackgroundColor` </div>         | Background color of input elements          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `inputHoverBorderColor` </div>        | Border color of hovered input elements      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-hover-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `inputHoverForegroundColor` </div>    | Text color of hovered input elements        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `inputHoverBackgroundColor` </div>    | Background color of hovered input elements  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `inputDisabledBorderColor` </div>     | Border color of disabled input elements     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-disabled-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `inputDisabledForegroundColor` </div> | Text color of disabled input elements       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `inputDisabledBackgroundColor` </div> | Background color of disabled input elements |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `inputFocusBorderColor` </div>        | Border color of focused input elements      |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-focus-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `inputFocusForegroundColor` </div>    | Text color of focused input elements        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-input-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `inputFocusBackgroundColor` </div>    | Background color of focused input elements  |

#### Menu Variables

| Variable | Description                             |
| -------- | --------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-border-width` </div><div class="variables-table__item"><span>JS:</span> `menuBorderWidth` </div>            | Border width of menu elements           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-border-radius` </div><div class="variables-table__item"><span>JS:</span> `menuBorderRadius` </div>           | Border radius of menu elements          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `menuHorizontalPadding` </div>      | Horizontal padding of menu elements     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `menuVerticalPadding` </div>        | Vertical padding of menu elements       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-item-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `menuItemHorizontalPadding` </div>  | Horizontal padding of menu items        |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-item-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `menuItemVerticalPadding` </div>    | Vertical padding of menu items          |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-border-color` </div><div class="variables-table__item"><span>JS:</span> `menuBorderColor` </div>            | Border color of menu elements           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-shadow-x` </div><div class="variables-table__item"><span>JS:</span> `menuShadowX` </div>                | Horizontal shadow offset of menus       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-shadow-y` </div><div class="variables-table__item"><span>JS:</span> `menuShadowY` </div>                | Vertical shadow offset of menus         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-shadow-blur` </div><div class="variables-table__item"><span>JS:</span> `menuShadowBlur` </div>             | Shadow blur radius of menus             |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-shadow-color` </div><div class="variables-table__item"><span>JS:</span> `menuShadowColor` </div>            | Shadow color of menus                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-shadow-opacity` </div><div class="variables-table__item"><span>JS:</span> `menuShadowOpacity` </div>          | Shadow opacity of menus                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-item-hover-color` </div><div class="variables-table__item"><span>JS:</span> `menuItemHoverColor` </div>         | Background color of hovered menu items  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-item-hover-color-opacity` </div><div class="variables-table__item"><span>JS:</span> `menuItemHoverColorOpacity` </div>  | Opacity of hovered menu item background |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-item-active-color` </div><div class="variables-table__item"><span>JS:</span> `menuItemActiveColor` </div>        | Background color of active menu items   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-menu-item-active-color-opacity` </div><div class="variables-table__item"><span>JS:</span> `menuItemActiveColorOpacity` </div> | Opacity of active menu item background  |

#### Dialog Variables

| Variable | Description                                         |
| -------- | --------------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-dialog-semi-transparent-background-color` </div><div class="variables-table__item"><span>JS:</span> `dialogSemiTransparentBackgroundColor` </div>   | Semi-transparent background color of dialog overlay |
| <div class="variables-table__item"><span>CSS:</span> `--ht-dialog-semi-transparent-background-opacity` </div><div class="variables-table__item"><span>JS:</span> `dialogSemiTransparentBackgroundOpacity` </div> | Opacity of semi-transparent dialog background       |
| <div class="variables-table__item"><span>CSS:</span> `--ht-dialog-solid-background-color` </div><div class="variables-table__item"><span>JS:</span> `dialogSolidBackgroundColor` </div>             | Solid background color of dialog overlay            |
| <div class="variables-table__item"><span>CSS:</span> `--ht-dialog-content-padding-horizontal` </div><div class="variables-table__item"><span>JS:</span> `dialogContentPaddingHorizontal` </div>         | Horizontal padding of dialog content                |
| <div class="variables-table__item"><span>CSS:</span> `--ht-dialog-content-padding-vertical` </div><div class="variables-table__item"><span>JS:</span> `dialogContentPaddingVertical` </div>           | Vertical padding of dialog content                  |
| <div class="variables-table__item"><span>CSS:</span> `--ht-dialog-content-border-radius` </div><div class="variables-table__item"><span>JS:</span> `dialogContentBorderRadius` </div>              | Border radius of dialog content                     |
| <div class="variables-table__item"><span>CSS:</span> `--ht-dialog-content-background-color` </div><div class="variables-table__item"><span>JS:</span> `dialogContentBackgroundColor` </div>           | Background color of dialog content                  |

#### Notification Variables

These variables style the [Notification](@/guides/dialog/notification/notification.md) plugin toasts. Shared layout tokens (for example `wrapperBorderRadius`, `tableTransition`, `gapSize`) and icon-button tokens still apply to the close control and spacing.

| Variable | Description                                         |
| -------- | --------------------------------------------------- |
| <div class="variables-table__item"><span>CSS:</span> `--ht-notification-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `notificationForegroundColor` </div>   | Text color of notification toasts                   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-notification-background-color` </div><div class="variables-table__item"><span>JS:</span> `notificationBackgroundColor` </div>   | Background color of notification toasts           |
| <div class="variables-table__item"><span>CSS:</span> `--ht-notification-border-color` </div><div class="variables-table__item"><span>JS:</span> `notificationBorderColor` </div>       | Border color of notification toasts                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-notification-success-accent` </div><div class="variables-table__item"><span>JS:</span> `notificationSuccessAccent` </div>       | Accent bar color for success toasts                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-notification-warning-accent` </div><div class="variables-table__item"><span>JS:</span> `notificationWarningAccent` </div>       | Accent bar color for warning toasts                 |
| <div class="variables-table__item"><span>CSS:</span> `--ht-notification-error-accent` </div><div class="variables-table__item"><span>JS:</span> `notificationErrorAccent` </div>         | Accent bar color for error toasts                   |

#### Pagination Variables

| Variable | Description                          |
| -------- | ------------------------------------ |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-bar-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `paginationBarForegroundColor` </div>   | Text color of pagination bar         |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-bar-background-color` </div><div class="variables-table__item"><span>JS:</span> `paginationBarBackgroundColor` </div>   | Background color of pagination bar   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-bar-horizontal-padding` </div><div class="variables-table__item"><span>JS:</span> `paginationBarHorizontalPadding` </div> | Horizontal padding of pagination bar |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-bar-vertical-padding` </div><div class="variables-table__item"><span>JS:</span> `paginationBarVerticalPadding` </div>   | Vertical padding of pagination bar   |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-border-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonBorderColor` </div>   | Border color of pagination navigation button |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonForegroundColor` </div>   | Icon color of pagination navigation button |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-background-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonBackgroundColor` </div>   | Background color of pagination navigation button |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-hover-border-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonHoverBorderColor` </div>   | Border color of pagination navigation button on hover |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-hover-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonHoverForegroundColor` </div>   | Icon color of pagination navigation button on hover |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-hover-background-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonHoverBackgroundColor` </div>   | Background color of pagination navigation button on hover |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-disabled-border-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonDisabledBorderColor` </div>   | Border color of pagination navigation button when disabled |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-disabled-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonDisabledForegroundColor` </div>   | Icon color of pagination navigation button when disabled |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-disabled-background-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonDisabledBackgroundColor` </div>   | Background color of pagination navigation button when disabled |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-focus-border-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonFocusBorderColor` </div>   | Border color of pagination navigation button on focus |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-focus-foreground-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonFocusForegroundColor` </div>   | Icon color of pagination navigation button on focus |
| <div class="variables-table__item"><span>CSS:</span> `--ht-pagination-button-focus-background-color` </div><div class="variables-table__item"><span>JS:</span> `paginationButtonFocusBackgroundColor` </div>   | Background color of pagination navigation button on focus |

</div>

## Related blog articles

<div class="boxes-list gray">

- [From components to tables: Designing a data table component in your design system](https://handsontable.com/blog/from-components-to-tables-designing-a-data-table-component-in-your-design-system)
- [Handsontable 14.6.0: Easier styling and enhanced undo-redo](https://handsontable.com/blog/handsontable-14-6-0-easier-styling-and-enhanced-undo-redo)

</div>
