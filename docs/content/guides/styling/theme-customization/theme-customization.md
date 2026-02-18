---
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

# Theme Customization

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
import { HotTable } from '@handsontable/react';

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

## Option 4: Use the Theme Builder UI

If you prefer a visual approach to creating themes, use the [Handsontable Theme Builder](https://handsontable.com/theme-builder). This online tool provides an intuitive interface for customizing colors, spacing, and other theme properties without writing code. Once you're satisfied with your design, you can export the generated your theme and integrate it into your project.

## Variables Reference

Handsontable provides a comprehensive set of JS and CSS variables that let you customize the appearance of every component.

**CSS Variable column** — The names of the CSS custom properties (e.g. `--ht-sizing-size-1`) you can override in your stylesheet.

**JS Option column** — The values in this column are the keys you use when customizing a theme via the Theme API. Call `theme.params()` on your registered theme and pass an object where each key is nested under one of:

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

### Sizing Variables

| CSS Variable            | JS Option   | Description             |
| ----------------------- | ----------- | ----------------------- |
| `--ht-sizing-size-0`    | `size_0`    | Zero size (0px)         |
| `--ht-sizing-size-0-25` | `size_0_25` | Quarter unit size (1px) |
| `--ht-sizing-size-0-5`  | `size_0_5`  | Half unit size (2px)    |
| `--ht-sizing-size-1`    | `size_1`    | Base unit size (4px)    |
| `--ht-sizing-size-1-5`  | `size_1_5`  | 1.5x unit size (6px)    |
| `--ht-sizing-size-2`    | `size_2`    | 2x unit size (8px)      |
| `--ht-sizing-size-3`    | `size_3`    | 3x unit size (12px)     |
| `--ht-sizing-size-4`    | `size_4`    | 4x unit size (16px)     |
| `--ht-sizing-size-5`    | `size_5`    | 5x unit size (20px)     |
| `--ht-sizing-size-6`    | `size_6`    | 6x unit size (24px)     |
| `--ht-sizing-size-7`    | `size_7`    | 7x unit size (28px)     |
| `--ht-sizing-size-8`    | `size_8`    | 8x unit size (32px)     |
| `--ht-sizing-size-9`    | `size_9`    | 9x unit size (36px)     |
| `--ht-sizing-size-10`   | `size_10`   | 10x unit size (40px)    |

### Density Variables

| CSS Variable                        | JS Option            | Description                       |
| ----------------------------------- | -------------------- | --------------------------------- |
| `--ht-density-cell-vertical`        | `cellVertical`       | Vertical padding for cells        |
| `--ht-density-cell-horizontal`      | `cellHorizontal`     | Horizontal padding for cells      |
| `--ht-density-bars-horizontal`      | `barsHorizontal`     | Horizontal padding for bars       |
| `--ht-density-bars-vertical`        | `barsVertical`       | Vertical padding for bars         |
| `--ht-density-gap`                  | `gap`                | Standard gap size                 |
| `--ht-density-button-horizontal`    | `buttonHorizontal`   | Horizontal padding for buttons    |
| `--ht-density-button-vertical`      | `buttonVertical`     | Vertical padding for buttons      |
| `--ht-density-dialog-horizontal`    | `dialogHorizontal`   | Horizontal padding for dialogs    |
| `--ht-density-dialog-vertical`      | `dialogVertical`     | Vertical padding for dialogs      |
| `--ht-density-input-horizontal`     | `inputHorizontal`    | Horizontal padding for inputs     |
| `--ht-density-input-vertical`       | `inputVertical`      | Vertical padding for inputs       |
| `--ht-density-menu-vertical`        | `menuVertical`       | Vertical padding for menus        |
| `--ht-density-menu-horizontal`      | `menuHorizontal`     | Horizontal padding for menus      |
| `--ht-density-menu-item-vertical`   | `menuItemVertical`   | Vertical padding for menu items   |
| `--ht-density-menu-item-horizontal` | `menuItemHorizontal` | Horizontal padding for menu items |

### Color Palette Variables

| CSS Variable              | JS Option     | Description                 |
| ------------------------- | ------------- | --------------------------- |
| `--ht-colors-white`       | `white`       | Pure white color            |
| `--ht-colors-black`       | `black`       | Pure black color            |
| `--ht-colors-transparent` | `transparent` | Transparent color           |
| `--ht-colors-primary-100` | `primary.100` | Lightest primary accent     |
| `--ht-colors-primary-200` | `primary.200` | Light primary accent        |
| `--ht-colors-primary-300` | `primary.300` | Medium-light primary accent |
| `--ht-colors-primary-400` | `primary.400` | Medium primary accent       |
| `--ht-colors-primary-500` | `primary.500` | Main primary accent         |
| `--ht-colors-primary-600` | `primary.600` | Dark primary accent         |
| `--ht-colors-palette-50`  | `palette.50`  | Lightest gray               |
| `--ht-colors-palette-100` | `palette.100` | Very light gray             |
| `--ht-colors-palette-200` | `palette.200` | Light gray                  |
| `--ht-colors-palette-300` | `palette.300` | Medium-light gray           |
| `--ht-colors-palette-400` | `palette.400` | Medium gray                 |
| `--ht-colors-palette-500` | `palette.500` | Medium-dark gray            |
| `--ht-colors-palette-600` | `palette.600` | Dark gray                   |
| `--ht-colors-palette-700` | `palette.700` | Darker gray                 |
| `--ht-colors-palette-800` | `palette.800` | Very dark gray              |
| `--ht-colors-palette-900` | `palette.900` | Near black                  |
| `--ht-colors-palette-950` | `palette.950` | Darkest gray                |

### Tokens Variables

#### Typography Variables

| CSS Variable             | JS Option         | Description                          |
| ------------------------ | ----------------- | ------------------------------------ |
| `--ht-font-family`       | `fontFamily`      | Font family for all text elements    |
| `--ht-font-size`         | `fontSize`        | Base font size for all text elements |
| `--ht-font-size-small`   | `fontSizeSmall`   | Font size for smaller text           |
| `--ht-line-height`       | `lineHeight`      | Line height for text elements        |
| `--ht-line-height-small` | `lineHeightSmall` | Line height for smaller text         |
| `--ht-font-weight`       | `fontWeight`      | Font weight for text elements        |
| `--ht-letter-spacing`    | `letterSpacing`   | Letter spacing for text elements     |

#### Layout & Spacing Variables

| CSS Variable            | JS Option         | Description                                     |
| ----------------------- | ----------------- | ----------------------------------------------- |
| `--ht-gap-size`         | `gapSize`         | Standard gap size used throughout the component |
| `--ht-icon-size`        | `iconSize`        | Size of icons throughout the interface          |
| `--ht-table-transition` | `tableTransition` | Transition duration for table animations        |

#### Color System Variables

| CSS Variable                      | JS Option                  | Description                                                |
| --------------------------------- | -------------------------- | ---------------------------------------------------------- |
| `--ht-border-color`               | `borderColor`              | Default border color for all elements                      |
| `--ht-accent-color`               | `accentColor`              | Primary accent color used for highlights and active states |
| `--ht-foreground-color`           | `foregroundColor`          | Primary text color                                         |
| `--ht-foreground-secondary-color` | `foregroundSecondaryColor` | Secondary text color                                       |
| `--ht-background-color`           | `backgroundColor`          | Primary background color                                   |
| `--ht-background-secondary-color` | `backgroundSecondaryColor` | Secondary background color                                 |
| `--ht-placeholder-color`          | `placeholderColor`         | Color for placeholder text                                 |
| `--ht-read-only-color`            | `readOnlyColor`            | Color for read-only text                                   |
| `--ht-disabled-color`             | `disabledColor`            | Color for disabled elements                                |

#### Shadow Variables

| CSS Variable          | JS Option       | Description                  |
| --------------------- | --------------- | ---------------------------- |
| `--ht-shadow-color`   | `shadowColor`   | Base color used for shadows  |
| `--ht-shadow-x`       | `shadowX`       | Horizontal offset of shadows |
| `--ht-shadow-y`       | `shadowY`       | Vertical offset of shadows   |
| `--ht-shadow-blur`    | `shadowBlur`    | Blur radius of shadows       |
| `--ht-shadow-opacity` | `shadowOpacity` | Opacity of shadows           |

#### Bar Variables

| CSS Variable                  | JS Option              | Description                            |
| ----------------------------- | ---------------------- | -------------------------------------- |
| `--ht-bar-foreground-color`   | `barForegroundColor`   | Foreground color of bar elements       |
| `--ht-bar-background-color`   | `barBackgroundColor`   | Background color of bar elements       |
| `--ht-bar-horizontal-padding` | `barHorizontalPadding` | Horizontal padding inside bar elements |
| `--ht-bar-vertical-padding`   | `barVerticalPadding`   | Vertical padding inside bar elements   |

#### Cell Border Variables

| CSS Variable                        | JS Option                   | Description                      |
| ----------------------------------- | --------------------------- | -------------------------------- |
| `--ht-cell-horizontal-border-color` | `cellHorizontalBorderColor` | Color of horizontal cell borders |
| `--ht-cell-vertical-border-color`   | `cellVerticalBorderColor`   | Color of vertical cell borders   |

#### Wrapper Variables

| CSS Variable                 | JS Option             | Description                        |
| ---------------------------- | --------------------- | ---------------------------------- |
| `--ht-wrapper-border-width`  | `wrapperBorderWidth`  | Width of the table wrapper border  |
| `--ht-wrapper-border-radius` | `wrapperBorderRadius` | Border radius of the table wrapper |
| `--ht-wrapper-border-color`  | `wrapperBorderColor`  | Color of the table wrapper border  |

#### Row Styling Variables

| CSS Variable                            | JS Option                      | Description                           |
| --------------------------------------- | ------------------------------ | ------------------------------------- |
| `--ht-row-header-odd-background-color`  | `rowHeaderOddBackgroundColor`  | Background color for odd row headers  |
| `--ht-row-header-even-background-color` | `rowHeaderEvenBackgroundColor` | Background color for even row headers |
| `--ht-row-cell-odd-background-color`    | `rowCellOddBackgroundColor`    | Background color for odd row cells    |
| `--ht-row-cell-even-background-color`   | `rowCellEvenBackgroundColor`   | Background color for even row cells   |

#### Cell Padding Variables

| CSS Variable                   | JS Option               | Description                     |
| ------------------------------ | ----------------------- | ------------------------------- |
| `--ht-cell-horizontal-padding` | `cellHorizontalPadding` | Horizontal padding inside cells |
| `--ht-cell-vertical-padding`   | `cellVerticalPadding`   | Vertical padding inside cells   |

#### Cell Editor Variables

| CSS Variable                          | JS Option                    | Description                         |
| ------------------------------------- | ---------------------------- | ----------------------------------- |
| `--ht-cell-editor-border-width`       | `cellEditorBorderWidth`      | Border width of cell editors        |
| `--ht-cell-editor-border-color`       | `cellEditorBorderColor`      | Border color of cell editors        |
| `--ht-cell-editor-foreground-color`   | `cellEditorForegroundColor`  | Text color in cell editors          |
| `--ht-cell-editor-background-color`   | `cellEditorBackgroundColor`  | Background color of cell editors    |
| `--ht-cell-editor-shadow-blur-radius` | `cellEditorShadowBlurRadius` | Shadow blur radius for cell editors |
| `--ht-cell-editor-shadow-color`       | `cellEditorShadowColor`      | Shadow color for cell editors       |

#### Cell State Variables

| CSS Variable                           | JS Option                     | Description                                     |
| -------------------------------------- | ----------------------------- | ----------------------------------------------- |
| `--ht-cell-success-background-color`   | `cellSuccessBackgroundColor`  | Background color for successful cell operations |
| `--ht-cell-error-background-color`     | `cellErrorBackgroundColor`    | Background color for error states in cells      |
| `--ht-cell-read-only-background-color` | `cellReadOnlyBackgroundColor` | Background color for read-only cells            |

#### Cell Selection Variables

| CSS Variable                           | JS Option                      | Description                         |
| -------------------------------------- | ------------------------------ | ----------------------------------- |
| `--ht-cell-selection-border-color`     | `cellSelectionBorderColor`     | Border color for selected cells     |
| `--ht-cell-selection-background-color` | `cellSelectionBackgroundColor` | Background color for selected cells |

#### Cell Autofill Variables

| CSS Variable                           | JS Option                     | Description                             |
| -------------------------------------- | ----------------------------- | --------------------------------------- |
| `--ht-cell-autofill-size`              | `cellAutofillSize`            | Size of the autofill handle             |
| `--ht-cell-autofill-hit-area-size`     | `cellAutofillHitAreaSize`     | Size of the autofill hit area           |
| `--ht-cell-autofill-border-width`      | `cellAutofillBorderWidth`     | Border width of autofill elements       |
| `--ht-cell-autofill-border-radius`     | `cellAutofillBorderRadius`    | Border radius of autofill elements      |
| `--ht-cell-autofill-border-color`      | `cellAutofillBorderColor`     | Border color of autofill elements       |
| `--ht-cell-autofill-background-color`  | `cellAutofillBackgroundColor` | Background color of autofill elements   |
| `--ht-cell-autofill-fill-border-color` | `cellAutofillFillBorderColor` | Border color of autofill fill indicator |

#### Cell Mobile Handle Variables

| CSS Variable                                 | JS Option                           | Description                          |
| -------------------------------------------- | ----------------------------------- | ------------------------------------ |
| `--ht-cell-mobile-handle-size`               | `cellMobileHandleSize`              | Size of mobile touch handles         |
| `--ht-cell-mobile-handle-border-width`       | `cellMobileHandleBorderWidth`       | Border width of mobile handles       |
| `--ht-cell-mobile-handle-border-radius`      | `cellMobileHandleBorderRadius`      | Border radius of mobile handles      |
| `--ht-cell-mobile-handle-border-color`       | `cellMobileHandleBorderColor`       | Border color of mobile handles       |
| `--ht-cell-mobile-handle-background-color`   | `cellMobileHandleBackgroundColor`   | Background color of mobile handles   |
| `--ht-cell-mobile-handle-background-opacity` | `cellMobileHandleBackgroundOpacity` | Background opacity of mobile handles |

#### Indicator Variables

| CSS Variable                  | JS Option              | Description                          |
| ----------------------------- | ---------------------- | ------------------------------------ |
| `--ht-resize-indicator-color` | `resizeIndicatorColor` | Color of resize indicators           |
| `--ht-move-backlight-color`   | `moveBacklightColor`   | Background color for move operations |
| `--ht-move-backlight-opacity` | `moveBacklightOpacity` | Opacity of move backlight            |
| `--ht-move-indicator-color`   | `moveIndicatorColor`   | Color of move indicators             |
| `--ht-hidden-indicator-color` | `hiddenIndicatorColor` | Color of hidden element indicators   |

#### Scrollbar Variables

| CSS Variable                   | JS Option               | Description                          |
| ------------------------------ | ----------------------- | ------------------------------------ |
| `--ht-scrollbar-border-radius` | `scrollbarBorderRadius` | Border radius of scrollbars          |
| `--ht-scrollbar-track-color`   | `scrollbarTrackColor`   | Background color of scrollbar tracks |
| `--ht-scrollbar-thumb-color`   | `scrollbarThumbColor`   | Color of scrollbar thumbs            |

#### Header Variables

| CSS Variable                               | JS Option                          | Description                              |
| ------------------------------------------ | ---------------------------------- | ---------------------------------------- |
| `--ht-header-font-weight`                  | `headerFontWeight`                 | Font weight for header text              |
| `--ht-header-foreground-color`             | `headerForegroundColor`            | Text color for headers                   |
| `--ht-header-background-color`             | `headerBackgroundColor`            | Background color for headers             |
| `--ht-header-highlighted-shadow-size`      | `headerHighlightedShadowSize`      | Shadow size for highlighted headers      |
| `--ht-header-highlighted-foreground-color` | `headerHighlightedForegroundColor` | Text color for highlighted headers       |
| `--ht-header-highlighted-background-color` | `headerHighlightedBackgroundColor` | Background color for highlighted headers |
| `--ht-header-active-border-color`          | `headerActiveBorderColor`          | Border color for active headers          |
| `--ht-header-active-foreground-color`      | `headerActiveForegroundColor`      | Text color for active headers            |
| `--ht-header-active-background-color`      | `headerActiveBackgroundColor`      | Background color for active headers      |
| `--ht-header-filter-background-color`      | `headerFilterBackgroundColor`      | Background color for header filters      |

#### Header Row Variables

| CSS Variable                                   | JS Option                             | Description                                  |
| ---------------------------------------------- | ------------------------------------- | -------------------------------------------- |
| `--ht-header-row-foreground-color`             | `headerRowForegroundColor`            | Text color for header rows                   |
| `--ht-header-row-background-color`             | `headerRowBackgroundColor`            | Background color for header rows             |
| `--ht-header-row-highlighted-foreground-color` | `headerRowHighlightedForegroundColor` | Text color for highlighted header rows       |
| `--ht-header-row-highlighted-background-color` | `headerRowHighlightedBackgroundColor` | Background color for highlighted header rows |
| `--ht-header-row-active-foreground-color`      | `headerRowActiveForegroundColor`      | Text color for active header rows            |
| `--ht-header-row-active-background-color`      | `headerRowActiveBackgroundColor`      | Background color for active header rows      |

#### Checkbox Variables

| CSS Variable                                            | JS Option                                      | Description                                           |
| ------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `--ht-checkbox-size`                                    | `checkboxSize`                                 | Size of checkbox elements                             |
| `--ht-checkbox-border-radius`                           | `checkboxBorderRadius`                         | Border radius of checkboxes                           |
| `--ht-checkbox-border-color`                            | `checkboxBorderColor`                          | Border color of checkboxes                            |
| `--ht-checkbox-background-color`                        | `checkboxBackgroundColor`                      | Background color of checkboxes                        |
| `--ht-checkbox-icon-color`                              | `checkboxIconColor`                            | Color of checkbox icons                               |
| `--ht-checkbox-focus-border-color`                      | `checkboxFocusBorderColor`                     | Border color of focused checkboxes                    |
| `--ht-checkbox-focus-background-color`                  | `checkboxFocusBackgroundColor`                 | Background color of focused checkboxes                |
| `--ht-checkbox-focus-icon-color`                        | `checkboxFocusIconColor`                       | Icon color of focused checkboxes                      |
| `--ht-checkbox-focus-ring-color`                        | `checkboxFocusRingColor`                       | Focus ring color for checkboxes                       |
| `--ht-checkbox-disabled-border-color`                   | `checkboxDisabledBorderColor`                  | Border color of disabled checkboxes                   |
| `--ht-checkbox-disabled-background-color`               | `checkboxDisabledBackgroundColor`              | Background color of disabled checkboxes               |
| `--ht-checkbox-disabled-icon-color`                     | `checkboxDisabledIconColor`                    | Icon color of disabled checkboxes                     |
| `--ht-checkbox-checked-border-color`                    | `checkboxCheckedBorderColor`                   | Border color of checked checkboxes                    |
| `--ht-checkbox-checked-background-color`                | `checkboxCheckedBackgroundColor`               | Background color of checked checkboxes                |
| `--ht-checkbox-checked-icon-color`                      | `checkboxCheckedIconColor`                     | Icon color of checked checkboxes                      |
| `--ht-checkbox-checked-focus-border-color`              | `checkboxCheckedFocusBorderColor`              | Border color of focused checked checkboxes            |
| `--ht-checkbox-checked-focus-background-color`          | `checkboxCheckedFocusBackgroundColor`          | Background color of focused checked checkboxes        |
| `--ht-checkbox-checked-focus-icon-color`                | `checkboxCheckedFocusIconColor`                | Icon color of focused checked checkboxes              |
| `--ht-checkbox-checked-disabled-border-color`           | `checkboxCheckedDisabledBorderColor`           | Border color of disabled checked checkboxes           |
| `--ht-checkbox-checked-disabled-background-color`       | `checkboxCheckedDisabledBackgroundColor`       | Background color of disabled checked checkboxes       |
| `--ht-checkbox-checked-disabled-icon-color`             | `checkboxCheckedDisabledIconColor`             | Icon color of disabled checked checkboxes             |
| `--ht-checkbox-indeterminate-border-color`              | `checkboxIndeterminateBorderColor`             | Border color of indeterminate checkboxes              |
| `--ht-checkbox-indeterminate-background-color`          | `checkboxIndeterminateBackgroundColor`         | Background color of indeterminate checkboxes          |
| `--ht-checkbox-indeterminate-icon-color`                | `checkboxIndeterminateIconColor`               | Icon color of indeterminate checkboxes                |
| `--ht-checkbox-indeterminate-focus-border-color`        | `checkboxIndeterminateFocusBorderColor`        | Border color of focused indeterminate checkboxes      |
| `--ht-checkbox-indeterminate-focus-background-color`    | `checkboxIndeterminateFocusBackgroundColor`    | Background color of focused indeterminate checkboxes  |
| `--ht-checkbox-indeterminate-focus-icon-color`          | `checkboxIndeterminateFocusIconColor`          | Icon color of focused indeterminate checkboxes        |
| `--ht-checkbox-indeterminate-disabled-border-color`     | `checkboxIndeterminateDisabledBorderColor`     | Border color of disabled indeterminate checkboxes     |
| `--ht-checkbox-indeterminate-disabled-background-color` | `checkboxIndeterminateDisabledBackgroundColor` | Background color of disabled indeterminate checkboxes |
| `--ht-checkbox-indeterminate-disabled-icon-color`       | `checkboxIndeterminateDisabledIconColor`       | Icon color of disabled indeterminate checkboxes       |

#### Radio Button Variables

| CSS Variable                                   | JS Option                             | Description                                        |
| ---------------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| `--ht-radio-size`                              | `radioSize`                           | Size of radio button elements                      |
| `--ht-radio-border-color`                      | `radioBorderColor`                    | Border color of radio buttons                      |
| `--ht-radio-background-color`                  | `radioBackgroundColor`                | Background color of radio buttons                  |
| `--ht-radio-icon-color`                        | `radioIconColor`                      | Color of radio button icons                        |
| `--ht-radio-focus-border-color`                | `radioFocusBorderColor`               | Border color of focused radio buttons              |
| `--ht-radio-focus-background-color`            | `radioFocusBackgroundColor`           | Background color of focused radio buttons          |
| `--ht-radio-focus-icon-color`                  | `radioFocusIconColor`                 | Icon color of focused radio buttons                |
| `--ht-radio-focus-ring-color`                  | `radioFocusRingColor`                 | Focus ring color for radio buttons                 |
| `--ht-radio-disabled-border-color`             | `radioDisabledBorderColor`            | Border color of disabled radio buttons             |
| `--ht-radio-disabled-background-color`         | `radioDisabledBackgroundColor`        | Background color of disabled radio buttons         |
| `--ht-radio-disabled-icon-color`               | `radioDisabledIconColor`              | Icon color of disabled radio buttons               |
| `--ht-radio-checked-border-color`              | `radioCheckedBorderColor`             | Border color of checked radio buttons              |
| `--ht-radio-checked-background-color`          | `radioCheckedBackgroundColor`         | Background color of checked radio buttons          |
| `--ht-radio-checked-icon-color`                | `radioCheckedIconColor`               | Icon color of checked radio buttons                |
| `--ht-radio-checked-focus-border-color`        | `radioCheckedFocusBorderColor`        | Border color of focused checked radio buttons      |
| `--ht-radio-checked-focus-background-color`    | `radioCheckedFocusBackgroundColor`    | Background color of focused checked radio buttons  |
| `--ht-radio-checked-focus-icon-color`          | `radioCheckedFocusIconColor`          | Icon color of focused checked radio buttons        |
| `--ht-radio-checked-disabled-border-color`     | `radioCheckedDisabledBorderColor`     | Border color of disabled checked radio buttons     |
| `--ht-radio-checked-disabled-background-color` | `radioCheckedDisabledBackgroundColor` | Background color of disabled checked radio buttons |
| `--ht-radio-checked-disabled-icon-color`       | `radioCheckedDisabledIconColor`       | Icon color of disabled checked radio buttons       |

#### Icon Button Variables

| CSS Variable                                     | JS Option                              | Description                                     |
| ------------------------------------------------ | -------------------------------------- | ----------------------------------------------- |
| `--ht-icon-button-border-radius`                 | `iconButtonBorderRadius`               | Border radius of icon buttons                   |
| `--ht-icon-button-large-border-radius`           | `iconButtonLargeBorderRadius`          | Border radius of large icon buttons             |
| `--ht-icon-button-large-padding`                 | `iconButtonLargePadding`               | Padding of large icon buttons                   |
| `--ht-icon-button-border-color`                  | `iconButtonBorderColor`                | Border color of icon buttons                    |
| `--ht-icon-button-background-color`              | `iconButtonBackgroundColor`            | Background color of icon buttons                |
| `--ht-icon-button-icon-color`                    | `iconButtonIconColor`                  | Color of icon button icons                      |
| `--ht-icon-button-hover-border-color`            | `iconButtonHoverBorderColor`           | Border color of hovered icon buttons            |
| `--ht-icon-button-hover-background-color`        | `iconButtonHoverBackgroundColor`       | Background color of hovered icon buttons        |
| `--ht-icon-button-hover-icon-color`              | `iconButtonHoverIconColor`             | Icon color of hovered icon buttons              |
| `--ht-icon-button-active-border-color`           | `iconButtonActiveBorderColor`          | Border color of active icon buttons             |
| `--ht-icon-button-active-background-color`       | `iconButtonActiveBackgroundColor`      | Background color of active icon buttons         |
| `--ht-icon-button-active-icon-color`             | `iconButtonActiveIconColor`            | Icon color of active icon buttons               |
| `--ht-icon-button-active-hover-border-color`     | `iconButtonActiveHoverBorderColor`     | Border color of hovered active icon buttons     |
| `--ht-icon-button-active-hover-background-color` | `iconButtonActiveHoverBackgroundColor` | Background color of hovered active icon buttons |
| `--ht-icon-button-active-hover-icon-color`       | `iconButtonActiveHoverIconColor`       | Icon color of hovered active icon buttons       |

#### Collapse Button Variables

| CSS Variable                                         | JS Option                                 | Description                                          |
| ---------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `--ht-collapse-button-border-radius`                 | `collapseButtonBorderRadius`              | Border radius of collapse buttons                    |
| `--ht-collapse-button-open-border-color`             | `collapseButtonOpenBorderColor`           | Border color of open collapse buttons                |
| `--ht-collapse-button-open-background-color`         | `collapseButtonOpenBackgroundColor`       | Background color of open collapse buttons            |
| `--ht-collapse-button-open-icon-color`               | `collapseButtonOpenIconColor`             | Icon color of open collapse buttons                  |
| `--ht-collapse-button-open-icon-active-color`        | `collapseButtonOpenIconActiveColor`       | Active icon color of open collapse buttons           |
| `--ht-collapse-button-open-hover-border-color`       | `collapseButtonOpenHoverBorderColor`      | Border color of hovered open collapse buttons        |
| `--ht-collapse-button-open-hover-background-color`   | `collapseButtonOpenHoverBackgroundColor`  | Background color of hovered open collapse buttons    |
| `--ht-collapse-button-open-hover-icon-color`         | `collapseButtonOpenHoverIconColor`        | Icon color of hovered open collapse buttons          |
| `--ht-collapse-button-open-hover-icon-active-color`  | `collapseButtonOpenHoverIconActiveColor`  | Active icon color of hovered open collapse buttons   |
| `--ht-collapse-button-close-border-color`            | `collapseButtonCloseBorderColor`          | Border color of closed collapse buttons              |
| `--ht-collapse-button-close-background-color`        | `collapseButtonCloseBackgroundColor`      | Background color of closed collapse buttons          |
| `--ht-collapse-button-close-icon-color`              | `collapseButtonCloseIconColor`            | Icon color of closed collapse buttons                |
| `--ht-collapse-button-close-icon-active-color`       | `collapseButtonCloseIconActiveColor`      | Active icon color of closed collapse buttons         |
| `--ht-collapse-button-close-hover-border-color`      | `collapseButtonCloseHoverBorderColor`     | Border color of hovered closed collapse buttons      |
| `--ht-collapse-button-close-hover-background-color`  | `collapseButtonCloseHoverBackgroundColor` | Background color of hovered closed collapse buttons  |
| `--ht-collapse-button-close-hover-icon-color`        | `collapseButtonCloseHoverIconColor`       | Icon color of hovered closed collapse buttons        |
| `--ht-collapse-button-close-hover-icon-active-color` | `collapseButtonCloseHoverIconActiveColor` | Active icon color of hovered closed collapse buttons |

#### Button Variables

| CSS Variable                     | JS Option                 | Description                   |
| -------------------------------- | ------------------------- | ----------------------------- |
| `--ht-button-border-radius`      | `buttonBorderRadius`      | Border radius of buttons      |
| `--ht-button-horizontal-padding` | `buttonHorizontalPadding` | Horizontal padding of buttons |
| `--ht-button-vertical-padding`   | `buttonVerticalPadding`   | Vertical padding of buttons   |

#### Primary Button Variables

| CSS Variable                                    | JS Option                              | Description                                  |
| ----------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| `--ht-primary-button-border-color`              | `primaryButtonBorderColor`             | Border color of primary buttons              |
| `--ht-primary-button-foreground-color`          | `primaryButtonForegroundColor`         | Text color of primary buttons                |
| `--ht-primary-button-background-color`          | `primaryButtonBackgroundColor`         | Background color of primary buttons          |
| `--ht-primary-button-disabled-border-color`     | `primaryButtonDisabledBorderColor`     | Border color of disabled primary buttons     |
| `--ht-primary-button-disabled-foreground-color` | `primaryButtonDisabledForegroundColor` | Text color of disabled primary buttons       |
| `--ht-primary-button-disabled-background-color` | `primaryButtonDisabledBackgroundColor` | Background color of disabled primary buttons |
| `--ht-primary-button-hover-border-color`        | `primaryButtonHoverBorderColor`        | Border color of hovered primary buttons      |
| `--ht-primary-button-hover-foreground-color`    | `primaryButtonHoverForegroundColor`    | Text color of hovered primary buttons        |
| `--ht-primary-button-hover-background-color`    | `primaryButtonHoverBackgroundColor`    | Background color of hovered primary buttons  |
| `--ht-primary-button-focus-border-color`        | `primaryButtonFocusBorderColor`        | Border color of focused primary buttons      |
| `--ht-primary-button-focus-foreground-color`    | `primaryButtonFocusForegroundColor`    | Text color of focused primary buttons        |
| `--ht-primary-button-focus-background-color`    | `primaryButtonFocusBackgroundColor`    | Background color of focused primary buttons  |

#### Secondary Button Variables

| CSS Variable                                      | JS Option                                | Description                                    |
| ------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `--ht-secondary-button-border-color`              | `secondaryButtonBorderColor`             | Border color of secondary buttons              |
| `--ht-secondary-button-foreground-color`          | `secondaryButtonForegroundColor`         | Text color of secondary buttons                |
| `--ht-secondary-button-background-color`          | `secondaryButtonBackgroundColor`         | Background color of secondary buttons          |
| `--ht-secondary-button-disabled-border-color`     | `secondaryButtonDisabledBorderColor`     | Border color of disabled secondary buttons     |
| `--ht-secondary-button-disabled-foreground-color` | `secondaryButtonDisabledForegroundColor` | Text color of disabled secondary buttons       |
| `--ht-secondary-button-disabled-background-color` | `secondaryButtonDisabledBackgroundColor` | Background color of disabled secondary buttons |
| `--ht-secondary-button-hover-border-color`        | `secondaryButtonHoverBorderColor`        | Border color of hovered secondary buttons      |
| `--ht-secondary-button-hover-foreground-color`    | `secondaryButtonHoverForegroundColor`    | Text color of hovered secondary buttons        |
| `--ht-secondary-button-hover-background-color`    | `secondaryButtonHoverBackgroundColor`    | Background color of hovered secondary buttons  |
| `--ht-secondary-button-focus-border-color`        | `secondaryButtonFocusBorderColor`        | Border color of focused secondary buttons      |
| `--ht-secondary-button-focus-foreground-color`    | `secondaryButtonFocusForegroundColor`    | Text color of focused secondary buttons        |
| `--ht-secondary-button-focus-background-color`    | `secondaryButtonFocusBackgroundColor`    | Background color of focused secondary buttons  |

#### Chip Variables

| CSS Variable                   | JS Option               | Description                         |
| ------------------------------ | ----------------------- | ----------------------------------- |
| `--ht-chip-background`         | `chipBackground`        | Background color of chip elements   |
| `--ht-chip-border-radius`      | `chipBorderRadius`      | Border radius of chip elements      |
| `--ht-chip-vertical-padding`   | `chipVerticalPadding`   | Vertical padding of chip elements   |
| `--ht-chip-horizontal-padding` | `chipHorizontalPadding` | Horizontal padding of chip elements |
| `--ht-chip-gap`                | `chipGap`               | Gap between chip elements           |

#### Comments Variables

| CSS Variable                                    | JS Option                              | Description                                   |
| ----------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| `--ht-comments-textarea-horizontal-padding`     | `commentsTextareaHorizontalPadding`    | Horizontal padding of comment textareas       |
| `--ht-comments-textarea-vertical-padding`       | `commentsTextareaVerticalPadding`      | Vertical padding of comment textareas         |
| `--ht-comments-textarea-border-width`           | `commentsTextareaBorderWidth`          | Border width of comment textareas             |
| `--ht-comments-textarea-border-color`           | `commentsTextareaBorderColor`          | Border color of comment textareas             |
| `--ht-comments-textarea-foreground-color`       | `commentsTextareaForegroundColor`      | Text color of comment textareas               |
| `--ht-comments-textarea-background-color`       | `commentsTextareaBackgroundColor`      | Background color of comment textareas         |
| `--ht-comments-textarea-focus-border-width`     | `commentsTextareaFocusBorderWidth`     | Border width of focused comment textareas     |
| `--ht-comments-textarea-focus-border-color`     | `commentsTextareaFocusBorderColor`     | Border color of focused comment textareas     |
| `--ht-comments-textarea-focus-foreground-color` | `commentsTextareaFocusForegroundColor` | Text color of focused comment textareas       |
| `--ht-comments-textarea-focus-background-color` | `commentsTextareaFocusBackgroundColor` | Background color of focused comment textareas |
| `--ht-comments-indicator-size`                  | `commentsIndicatorSize`                | Size of comment indicators                    |
| `--ht-comments-indicator-color`                 | `commentsIndicatorColor`               | Color of comment indicators                   |

#### License Variables

| CSS Variable                      | JS Option                  | Description                            |
| --------------------------------- | -------------------------- | -------------------------------------- |
| `--ht-license-horizontal-padding` | `licenseHorizontalPadding` | Horizontal padding of license elements |
| `--ht-license-vertical-padding`   | `licenseVerticalPadding`   | Vertical padding of license elements   |
| `--ht-license-foreground-color`   | `licenseForegroundColor`   | Text color of license elements         |
| `--ht-license-background-color`   | `licenseBackgroundColor`   | Background color of license elements   |

#### Link Variables

| CSS Variable            | JS Option        | Description            |
| ----------------------- | ---------------- | ---------------------- |
| `--ht-link-color`       | `linkColor`      | Color of links         |
| `--ht-link-hover-color` | `linkHoverColor` | Color of hovered links |

#### Input Variables

| CSS Variable                           | JS Option                      | Description                                 |
| -------------------------------------- | ------------------------------ | ------------------------------------------- |
| `--ht-input-border-width`              | `inputBorderWidth`             | Border width of input elements              |
| `--ht-input-border-radius`             | `inputBorderRadius`            | Border radius of input elements             |
| `--ht-input-horizontal-padding`        | `inputHorizontalPadding`       | Horizontal padding of input elements        |
| `--ht-input-vertical-padding`          | `inputVerticalPadding`         | Vertical padding of input elements          |
| `--ht-input-border-color`              | `inputBorderColor`             | Border color of input elements              |
| `--ht-input-foreground-color`          | `inputForegroundColor`         | Text color of input elements                |
| `--ht-input-background-color`          | `inputBackgroundColor`         | Background color of input elements          |
| `--ht-input-hover-border-color`        | `inputHoverBorderColor`        | Border color of hovered input elements      |
| `--ht-input-hover-foreground-color`    | `inputHoverForegroundColor`    | Text color of hovered input elements        |
| `--ht-input-hover-background-color`    | `inputHoverBackgroundColor`    | Background color of hovered input elements  |
| `--ht-input-disabled-border-color`     | `inputDisabledBorderColor`     | Border color of disabled input elements     |
| `--ht-input-disabled-foreground-color` | `inputDisabledForegroundColor` | Text color of disabled input elements       |
| `--ht-input-disabled-background-color` | `inputDisabledBackgroundColor` | Background color of disabled input elements |
| `--ht-input-focus-border-color`        | `inputFocusBorderColor`        | Border color of focused input elements      |
| `--ht-input-focus-foreground-color`    | `inputFocusForegroundColor`    | Text color of focused input elements        |
| `--ht-input-focus-background-color`    | `inputFocusBackgroundColor`    | Background color of focused input elements  |

#### Menu Variables

| CSS Variable                          | JS Option                    | Description                             |
| ------------------------------------- | ---------------------------- | --------------------------------------- |
| `--ht-menu-border-width`              | `menuBorderWidth`            | Border width of menu elements           |
| `--ht-menu-border-radius`             | `menuBorderRadius`           | Border radius of menu elements          |
| `--ht-menu-horizontal-padding`        | `menuHorizontalPadding`      | Horizontal padding of menu elements     |
| `--ht-menu-vertical-padding`          | `menuVerticalPadding`        | Vertical padding of menu elements       |
| `--ht-menu-item-horizontal-padding`   | `menuItemHorizontalPadding`  | Horizontal padding of menu items        |
| `--ht-menu-item-vertical-padding`     | `menuItemVerticalPadding`    | Vertical padding of menu items          |
| `--ht-menu-border-color`              | `menuBorderColor`            | Border color of menu elements           |
| `--ht-menu-shadow-x`                  | `menuShadowX`                | Horizontal shadow offset of menus       |
| `--ht-menu-shadow-y`                  | `menuShadowY`                | Vertical shadow offset of menus         |
| `--ht-menu-shadow-blur`               | `menuShadowBlur`             | Shadow blur radius of menus             |
| `--ht-menu-shadow-color`              | `menuShadowColor`            | Shadow color of menus                   |
| `--ht-menu-shadow-opacity`            | `menuShadowOpacity`          | Shadow opacity of menus                 |
| `--ht-menu-item-hover-color`          | `menuItemHoverColor`         | Background color of hovered menu items  |
| `--ht-menu-item-hover-color-opacity`  | `menuItemHoverColorOpacity`  | Opacity of hovered menu item background |
| `--ht-menu-item-active-color`         | `menuItemActiveColor`        | Background color of active menu items   |
| `--ht-menu-item-active-color-opacity` | `menuItemActiveColorOpacity` | Opacity of active menu item background  |

#### Dialog Variables

| CSS Variable                                      | JS Option                                | Description                                         |
| ------------------------------------------------- | ---------------------------------------- | --------------------------------------------------- |
| `--ht-dialog-semi-transparent-background-color`   | `dialogSemiTransparentBackgroundColor`   | Semi-transparent background color of dialog overlay |
| `--ht-dialog-semi-transparent-background-opacity` | `dialogSemiTransparentBackgroundOpacity` | Opacity of semi-transparent dialog background       |
| `--ht-dialog-solid-background-color`              | `dialogSolidBackgroundColor`             | Solid background color of dialog overlay            |
| `--ht-dialog-content-padding-horizontal`          | `dialogContentPaddingHorizontal`         | Horizontal padding of dialog content                |
| `--ht-dialog-content-padding-vertical`            | `dialogContentPaddingVertical`           | Vertical padding of dialog content                  |
| `--ht-dialog-content-border-radius`               | `dialogContentBorderRadius`              | Border radius of dialog content                     |
| `--ht-dialog-content-background-color`            | `dialogContentBackgroundColor`           | Background color of dialog content                  |

#### Pagination Variables

| CSS Variable                             | JS Option                        | Description                          |
| ---------------------------------------- | -------------------------------- | ------------------------------------ |
| `--ht-pagination-bar-foreground-color`   | `paginationBarForegroundColor`   | Text color of pagination bar         |
| `--ht-pagination-bar-background-color`   | `paginationBarBackgroundColor`   | Background color of pagination bar   |
| `--ht-pagination-bar-horizontal-padding` | `paginationBarHorizontalPadding` | Horizontal padding of pagination bar |
| `--ht-pagination-bar-vertical-padding`   | `paginationBarVerticalPadding`   | Vertical padding of pagination bar   |
