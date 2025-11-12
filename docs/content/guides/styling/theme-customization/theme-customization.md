---
id: x2u15qpx
title: Theme Customization
metaTitle: Theme Customization - JavaScript Data Grid | Handsontable
description: Customize Handsontable's appearance using CSS variables to create consistent themes and styles across your application.
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
---

# Theme Customization

Customize Handsontable's appearance using CSS variables to create consistent themes and styles across your application.

[[toc]]

CSS variables provide a powerful and flexible way to customize Handsontable's appearance by adjusting design elements such as colors, spacing, borders, and typography to match your application's design system. Those variables gives you granular control over every visual aspect of the data grid, from basic styling to advanced component customization.

We provide multiple approaches for leveraging CSS variables to create any look that your designer can imagine. From quick theme modifications to completely custom designs, your options include:

1. **Override built-in theme variables** to quickly customize existing themes like `ht-theme-main`.
2. **Create custom theme files** by copying and modifying existing theme SCSS files.
3. Use the **Figma Theme Generator** to convert design tokens into CSS variables automatically.

The data grid's styling system is built entirely on CSS variables, with over 200 variables organized into logical categories covering typography, colors, spacing, borders, and component-specific styling listed below.

## Usage Examples

### Basic theme customization by overriding css variables

Follow these [steps](@/guides/styling/themes/themes.md#use-a-theme) to apply a theme, then override the variables for your chosen theme.

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

### Create a custom theme based on an existing SCSS file

Creating a custom theme is straightforward. You just need a local clone of the [Handsontable repository](https://github.com/handsontable/handsontable) and follow these steps to set up your custom design:

#### 1. Create a new SCSS file

Start by copying one of the existing SCSS theme files from `handsontable/src/styles/themes`, for example [`theme-main.scss`](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/theme-main.scss). Rename the copied file to something unique for your project — in this example, call it `theme-falcon.scss`. The theme filename must include the `theme-` prefix (e.g., `theme-falcon.scss`). The prefix is required for proper theme recognition.

Next, create a variables file at `utils/falcon/_variables.scss`, based on the existing [`main/_variables.scss`](https://github.com/handsontable/handsontable/blob/develop/handsontable/src/styles/themes/utils/main/_variables.scss) file. Adjust it to match your design requirements.

If your theme needs custom icons, you can either reuse the icons from the main theme or create your own in `utils/falcon/_icons.scss`. To use your custom icons, update the import path in your theme file with `@use "utils/falcon/icons";`.

#### 2. Compile your SCSS file

After customizing your theme file, you'll need to compile it into CSS. To do this, run the build command in the `handsontable/handsontable` directory.


#### 3. Load and apply the theme

Include the new CSS file into your project, ensuring it's loaded after the base CSS file (`handsontable/styles/handsontable.min.css`). If you're using imports, it might look like this:

```js
import 'handsontable/styles/handsontable.min.css';
import './ht-theme-falcon.min.css';
```

To apply a theme, use the `themeName` option by specifying it in the configuration, like this:

::: only-for javascript

```js
const hot = new Handsontable(container, {
  // theme name with obligatory `ht-theme-*` prefix
  themeName: 'ht-theme-falcon',
  // other options
});
```

:::

::: only-for react

```jsx
<HotTable
  // theme name with obligatory `ht-theme-*` prefix
  themeName="ht-theme-falcon"
  // other options
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  // theme name with obligatory `ht-theme-*` prefix
  themeName: 'ht-theme-falcon'
  // other options
}">
</hot-table>
```

:::

### Generate a CSS theme file from Figma

To create a new theme or modify an existing one in Figma, visit the [Handsontable Theme Generator](https://github.com/handsontable/handsontable-figma) and follow the instructions to convert your Figma tokens into a CSS theme file that works with Handsontable. The Theme Generator will help you transform the JSON tokens exported from Figma into a properly formatted CSS theme file.

## CSS Variables Reference

Handsontable provides a comprehensive set of CSS variables that allow you to customize the appearance of every component. These variables are organized into logical categories for easy reference.

### Color Variables

| Variable                                | Description                                    |
|-----------------------------------------|------------------------------------------------|
| `--ht-color-transparent-0`              | Fully transparent background (light mode)      |
| `--ht-color-transparent-80`             | 80% transparent background (light mode)        |
| `--ht-color-gray-100`                   | Main white background                          |
| `--ht-color-gray-200`                   | Lightest gray background                       |
| `--ht-color-gray-250`                   | Very light gray background                     |
| `--ht-color-gray-300`                   | Light gray border                              |
| `--ht-color-gray-350`                   | Soft gray                                      |
| `--ht-color-gray-400`                   | Placeholder and disabled text                  |
| `--ht-color-gray-500`                   | Read-only or secondary text                    |
| `--ht-color-gray-800`                   | Main text and icon color                       |
| `--ht-color-gray-900`                   | Strongest black text                           |
| `--ht-color-gray-800-40`                | Shadow, overlays - 40% opacity                 |
| `--ht-color-gray-800-8`                 | Subtle divider or shadow - 8% opacity          |
| `--ht-color-gray-800-4`                 | Subtle border or background highlight - 4%     |
| `--ht-color-accent-300`                 | Light accent color                             |
| `--ht-color-accent-350`                 | Lighter primary accent                         |
| `--ht-color-accent-400`                 | Main accent color                              |
| `--ht-color-accent-500`                 | Strong accent color                            |
| `--ht-color-accent-400-40`              | Accent color at 40% opacity                    |
| `--ht-color-notification-search`        | Background for search highlights               |
| `--ht-color-notification-error`         | Background for error notifications             |
| `--ht-color-notification-success`       | Background for success messages                |
| `--ht-color-notification-warning`       | Background for warning messages                |
| `--ht-color-notification-informational` | Background for informational messages          |

### Common Color Variables

| Variable                                | Description                                    |
|-----------------------------------------|------------------------------------------------|
| `--ht-common-accent`                    | Reference to accent color                      |
| `--ht-common-background`                | Main background                                |
| `--ht-common-foreground`                | Main foreground (text/icons)                   |
| `--ht-common-border`                    | Default border color                           |
| `--ht-common-disabled`                  | Disabled color                                 |
| `--ht-common-read-only`                 | Read-only coloring                             |
| `--ht-common-placeholder`               | Placeholder text color                         |
| `--ht-common-shadow`                    | Shadow effect color                            |
| `--ht-common-background-secondary`      | Secondary background                           |
| `--ht-common-overlay`                   | Overlay color                                  |
| `--ht-common-foreground-secondary`      | Secondary foreground (subtle text/icons)       |

### Typography Variables

| Variable | Description |
|----------|-------------|
| `--ht-font-size` | Base font size for all text elements |
| `--ht-font-size-small` | Font size for smaller text |
| `--ht-line-height` | Line height for text elements |
| `--ht-line-height-small` | Line height for smaller text |
| `--ht-font-weight` | Font weight for text elements |
| `--ht-letter-spacing` | Letter spacing for text elements |

### Layout & Spacing Variables

| Variable | Description |
|----------|-------------|
| `--ht-gap-size` | Standard gap size used throughout the component |
| `--ht-icon-size` | Size of icons throughout the interface |
| `--ht-table-transition` | Transition duration for table animations |

### Color System Variables

| Variable | Description |
|----------|-------------|
| `--ht-border-color` | Default border color for all elements |
| `--ht-accent-color` | Primary accent color used for highlights and active states |
| `--ht-foreground-color` | Primary text color |
| `--ht-foreground-secondary-color` | Secondary text color |
| `--ht-background-color` | Primary background color |
| `--ht-placeholder-color` | Color for placeholder text |
| `--ht-read-only-color` | Color for read-only text |
| `--ht-disabled-color` | Color for disabled elements |

### Shadow Variables

| Variable | Description |
|----------|-------------|
| `--ht-shadow-color` | Base color used for shadows |
| `--ht-shadow-x` | Horizontal offset of shadows |
| `--ht-shadow-y` | Vertical offset of shadows |
| `--ht-shadow-blur` | Blur radius of shadows |

### Bar Variables

| Variable | Description |
|----------|-------------|
| `--ht-bar-foreground-color` | Foreground color of bar elements |
| `--ht-bar-background-color` | Background color of bar elements |
| `--ht-bar-horizontal-padding` | Horizontal padding inside bar elements |
| `--ht-bar-vertical-padding` | Vertical padding inside bar elements |

### Cell Border Variables

| Variable | Description |
|----------|-------------|
| `--ht-cell-horizontal-border-color` | Color of horizontal cell borders |
| `--ht-cell-vertical-border-color` | Color of vertical cell borders |

### Wrapper Variables

| Variable | Description |
|----------|-------------|
| `--ht-wrapper-border-width` | Width of the table wrapper border |
| `--ht-wrapper-border-radius` | Border radius of the table wrapper |
| `--ht-wrapper-border-color` | Color of the table wrapper border |

### Row Styling Variables

| Variable | Description |
|----------|-------------|
| `--ht-row-header-odd-background-color` | Background color for odd row headers |
| `--ht-row-header-even-background-color` | Background color for even row headers |
| `--ht-row-cell-odd-background-color` | Background color for odd row cells |
| `--ht-row-cell-even-background-color` | Background color for even row cells |

### Cell Padding Variables

| Variable | Description |
|----------|-------------|
| `--ht-cell-horizontal-padding` | Horizontal padding inside cells |
| `--ht-cell-vertical-padding` | Vertical padding inside cells |

### Cell Editor Variables

| Variable | Description |
|----------|-------------|
| `--ht-cell-editor-border-width` | Border width of cell editors |
| `--ht-cell-editor-border-color` | Border color of cell editors |
| `--ht-cell-editor-foreground-color` | Text color in cell editors |
| `--ht-cell-editor-background-color` | Background color of cell editors |
| `--ht-cell-editor-shadow-blur-radius` | Shadow blur radius for cell editors |
| `--ht-cell-editor-shadow-color` | Shadow color for cell editors |

### Cell State Variables

| Variable | Description |
|----------|-------------|
| `--ht-cell-success-background-color` | Background color for successful cell operations |
| `--ht-cell-error-background-color` | Background color for error states in cells |
| `--ht-cell-read-only-background-color` | Background color for read-only cells |

### Cell Selection Variables

| Variable | Description |
|----------|-------------|
| `--ht-cell-selection-border-color` | Border color for selected cells |
| `--ht-cell-selection-background-color` | Background color for selected cells |

### Cell Autofill Variables

| Variable | Description |
|----------|-------------|
| `--ht-cell-autofill-size` | Size of the autofill handle |
| `--ht-cell-autofill-border-width` | Border width of autofill elements |
| `--ht-cell-autofill-border-radius` | Border radius of autofill elements |
| `--ht-cell-autofill-border-color` | Border color of autofill elements |
| `--ht-cell-autofill-background-color` | Background color of autofill elements |
| `--ht-cell-autofill-fill-border-color` | Border color of autofill fill indicator |

### Cell Mobile Handle Variables

| Variable | Description |
|----------|-------------|
| `--ht-cell-mobile-handle-size` | Size of mobile touch handles |
| `--ht-cell-mobile-handle-border-width` | Border width of mobile handles |
| `--ht-cell-mobile-handle-border-radius` | Border radius of mobile handles |
| `--ht-cell-mobile-handle-border-color` | Border color of mobile handles |
| `--ht-cell-mobile-handle-background-color` | Background color of mobile handles |

### Indicator Variables

| Variable | Description |
|----------|-------------|
| `--ht-resize-indicator-color` | Color of resize indicators |
| `--ht-move-backlight-color` | Background color for move operations |
| `--ht-move-indicator-color` | Color of move indicators |
| `--ht-hidden-indicator-color` | Color of hidden element indicators |

### Scrollbar Variables

| Variable | Description |
|----------|-------------|
| `--ht-scrollbar-border-radius` | Border radius of scrollbars |
| `--ht-scrollbar-track-color` | Background color of scrollbar tracks |
| `--ht-scrollbar-thumb-color` | Color of scrollbar thumbs |

### Header Variables

| Variable | Description |
|----------|-------------|
| `--ht-header-font-weight` | Font weight for header text |
| `--ht-header-foreground-color` | Text color for headers |
| `--ht-header-background-color` | Background color for headers |
| `--ht-header-highlighted-shadow-size` | Shadow size for highlighted headers |
| `--ht-header-highlighted-foreground-color` | Text color for highlighted headers |
| `--ht-header-highlighted-background-color` | Background color for highlighted headers |
| `--ht-header-active-border-color` | Border color for active headers |
| `--ht-header-active-foreground-color` | Text color for active headers |
| `--ht-header-active-background-color` | Background color for active headers |
| `--ht-header-filter-background-color` | Background color for header filters |

### Header Row Variables

| Variable | Description |
|----------|-------------|
| `--ht-header-row-foreground-color` | Text color for header rows |
| `--ht-header-row-background-color` | Background color for header rows |
| `--ht-header-row-highlighted-foreground-color` | Text color for highlighted header rows |
| `--ht-header-row-highlighted-background-color` | Background color for highlighted header rows |
| `--ht-header-row-active-foreground-color` | Text color for active header rows |
| `--ht-header-row-active-background-color` | Background color for active header rows |

### Checkbox Variables

| Variable | Description |
|----------|-------------|
| `--ht-checkbox-size` | Size of checkbox elements |
| `--ht-checkbox-border-radius` | Border radius of checkboxes |
| `--ht-checkbox-border-color` | Border color of checkboxes |
| `--ht-checkbox-background-color` | Background color of checkboxes |
| `--ht-checkbox-icon-color` | Color of checkbox icons |
| `--ht-checkbox-focus-border-color` | Border color of focused checkboxes |
| `--ht-checkbox-focus-background-color` | Background color of focused checkboxes |
| `--ht-checkbox-focus-icon-color` | Icon color of focused checkboxes |
| `--ht-checkbox-focus-ring-color` | Focus ring color for checkboxes |
| `--ht-checkbox-disabled-border-color` | Border color of disabled checkboxes |
| `--ht-checkbox-disabled-background-color` | Background color of disabled checkboxes |
| `--ht-checkbox-disabled-icon-color` | Icon color of disabled checkboxes |
| `--ht-checkbox-checked-border-color` | Border color of checked checkboxes |
| `--ht-checkbox-checked-background-color` | Background color of checked checkboxes |
| `--ht-checkbox-checked-icon-color` | Icon color of checked checkboxes |
| `--ht-checkbox-checked-focus-border-color` | Border color of focused checked checkboxes |
| `--ht-checkbox-checked-focus-background-color` | Background color of focused checked checkboxes |
| `--ht-checkbox-checked-focus-icon-color` | Icon color of focused checked checkboxes |
| `--ht-checkbox-checked-disabled-border-color` | Border color of disabled checked checkboxes |
| `--ht-checkbox-checked-disabled-background-color` | Background color of disabled checked checkboxes |
| `--ht-checkbox-checked-disabled-icon-color` | Icon color of disabled checked checkboxes |
| `--ht-checkbox-indeterminate-border-color` | Border color of indeterminate checkboxes |
| `--ht-checkbox-indeterminate-background-color` | Background color of indeterminate checkboxes |
| `--ht-checkbox-indeterminate-icon-color` | Icon color of indeterminate checkboxes |
| `--ht-checkbox-indeterminate-focus-border-color` | Border color of focused indeterminate checkboxes |
| `--ht-checkbox-indeterminate-focus-background-color` | Background color of focused indeterminate checkboxes |
| `--ht-checkbox-indeterminate-focus-icon-color` | Icon color of focused indeterminate checkboxes |
| `--ht-checkbox-indeterminate-disabled-border-color` | Border color of disabled indeterminate checkboxes |
| `--ht-checkbox-indeterminate-disabled-background-color` | Background color of disabled indeterminate checkboxes |
| `--ht-checkbox-indeterminate-disabled-icon-color` | Icon color of disabled indeterminate checkboxes |

### Radio Button Variables

| Variable | Description |
|----------|-------------|
| `--ht-radio-size` | Size of radio button elements |
| `--ht-radio-border-color` | Border color of radio buttons |
| `--ht-radio-background-color` | Background color of radio buttons |
| `--ht-radio-icon-color` | Color of radio button icons |
| `--ht-radio-focus-border-color` | Border color of focused radio buttons |
| `--ht-radio-focus-background-color` | Background color of focused radio buttons |
| `--ht-radio-focus-icon-color` | Icon color of focused radio buttons |
| `--ht-radio-focus-ring-color` | Focus ring color for radio buttons |
| `--ht-radio-disabled-border-color` | Border color of disabled radio buttons |
| `--ht-radio-disabled-background-color` | Background color of disabled radio buttons |
| `--ht-radio-disabled-icon-color` | Icon color of disabled radio buttons |
| `--ht-radio-checked-border-color` | Border color of checked radio buttons |
| `--ht-radio-checked-background-color` | Background color of checked radio buttons |
| `--ht-radio-checked-icon-color` | Icon color of checked radio buttons |
| `--ht-radio-checked-focus-border-color` | Border color of focused checked radio buttons |
| `--ht-radio-checked-focus-background-color` | Background color of focused checked radio buttons |
| `--ht-radio-checked-focus-icon-color` | Icon color of focused checked radio buttons |
| `--ht-radio-checked-disabled-border-color` | Border color of disabled checked radio buttons |
| `--ht-radio-checked-disabled-background-color` | Background color of disabled checked radio buttons |
| `--ht-radio-checked-disabled-icon-color` | Icon color of disabled checked radio buttons |

### Icon Button Variables

| Variable | Description |
|----------|-------------|
| `--ht-icon-button-border-radius` | Border radius of icon buttons |
| `--ht-icon-button-large-border-radius` | Border radius of large icon buttons |
| `--ht-icon-button-large-padding` | Padding of large icon buttons |
| `--ht-icon-button-border-color` | Border color of icon buttons |
| `--ht-icon-button-background-color` | Background color of icon buttons |
| `--ht-icon-button-icon-color` | Color of icon button icons |
| `--ht-icon-button-hover-border-color` | Border color of hovered icon buttons |
| `--ht-icon-button-hover-background-color` | Background color of hovered icon buttons |
| `--ht-icon-button-hover-icon-color` | Icon color of hovered icon buttons |
| `--ht-icon-button-active-border-color` | Border color of active icon buttons |
| `--ht-icon-button-active-background-color` | Background color of active icon buttons |
| `--ht-icon-button-active-icon-color` | Icon color of active icon buttons |
| `--ht-icon-button-active-hover-border-color` | Border color of hovered active icon buttons |
| `--ht-icon-button-active-hover-background-color` | Background color of hovered active icon buttons |
| `--ht-icon-button-active-hover-icon-color` | Icon color of hovered active icon buttons |

### Collapse Button Variables

| Variable | Description |
|----------|-------------|
| `--ht-collapse-button-border-radius` | Border radius of collapse buttons |
| `--ht-collapse-button-open-border-color` | Border color of open collapse buttons |
| `--ht-collapse-button-open-background-color` | Background color of open collapse buttons |
| `--ht-collapse-button-open-icon-color` | Icon color of open collapse buttons |
| `--ht-collapse-button-open-icon-active-color` | Active icon color of open collapse buttons |
| `--ht-collapse-button-open-hover-border-color` | Border color of hovered open collapse buttons |
| `--ht-collapse-button-open-hover-background-color` | Background color of hovered open collapse buttons |
| `--ht-collapse-button-open-hover-icon-color` | Icon color of hovered open collapse buttons |
| `--ht-collapse-button-open-hover-icon-active-color` | Active icon color of hovered open collapse buttons |
| `--ht-collapse-button-close-border-color` | Border color of closed collapse buttons |
| `--ht-collapse-button-close-background-color` | Background color of closed collapse buttons |
| `--ht-collapse-button-close-icon-color` | Icon color of closed collapse buttons |
| `--ht-collapse-button-close-icon-active-color` | Active icon color of closed collapse buttons |
| `--ht-collapse-button-close-hover-border-color` | Border color of hovered closed collapse buttons |
| `--ht-collapse-button-close-hover-background-color` | Background color of hovered closed collapse buttons |
| `--ht-collapse-button-close-hover-icon-color` | Icon color of hovered closed collapse buttons |
| `--ht-collapse-button-close-hover-icon-active-color` | Active icon color of hovered closed collapse buttons |

### Button Variables

| Variable | Description |
|----------|-------------|
| `--ht-button-border-radius` | Border radius of buttons |
| `--ht-button-horizontal-padding` | Horizontal padding of buttons |
| `--ht-button-vertical-padding` | Vertical padding of buttons |

### Primary Button Variables

| Variable | Description |
|----------|-------------|
| `--ht-primary-button-border-color` | Border color of primary buttons |
| `--ht-primary-button-foreground-color` | Text color of primary buttons |
| `--ht-primary-button-background-color` | Background color of primary buttons |
| `--ht-primary-button-disabled-border-color` | Border color of disabled primary buttons |
| `--ht-primary-button-disabled-foreground-color` | Text color of disabled primary buttons |
| `--ht-primary-button-disabled-background-color` | Background color of disabled primary buttons |
| `--ht-primary-button-hover-border-color` | Border color of hovered primary buttons |
| `--ht-primary-button-hover-foreground-color` | Text color of hovered primary buttons |
| `--ht-primary-button-hover-background-color` | Background color of hovered primary buttons |
| `--ht-primary-button-focus-border-color` | Border color of focused primary buttons |
| `--ht-primary-button-focus-foreground-color` | Text color of focused primary buttons |
| `--ht-primary-button-focus-background-color` | Background color of focused primary buttons |

### Secondary Button Variables

| Variable | Description |
|----------|-------------|
| `--ht-secondary-button-border-color` | Border color of secondary buttons |
| `--ht-secondary-button-foreground-color` | Text color of secondary buttons |
| `--ht-secondary-button-background-color` | Background color of secondary buttons |
| `--ht-secondary-button-disabled-border-color` | Border color of disabled secondary buttons |
| `--ht-secondary-button-disabled-foreground-color` | Text color of disabled secondary buttons |
| `--ht-secondary-button-disabled-background-color` | Background color of disabled secondary buttons |
| `--ht-secondary-button-hover-border-color` | Border color of hovered secondary buttons |
| `--ht-secondary-button-hover-foreground-color` | Text color of hovered secondary buttons |
| `--ht-secondary-button-hover-background-color` | Background color of hovered secondary buttons |
| `--ht-secondary-button-focus-border-color` | Border color of focused secondary buttons |
| `--ht-secondary-button-focus-foreground-color` | Text color of focused secondary buttons |
| `--ht-secondary-button-focus-background-color` | Background color of focused secondary buttons |

### Comments Variables

| Variable | Description |
|----------|-------------|
| `--ht-comments-textarea-horizontal-padding` | Horizontal padding of comment textareas |
| `--ht-comments-textarea-vertical-padding` | Vertical padding of comment textareas |
| `--ht-comments-textarea-border-width` | Border width of comment textareas |
| `--ht-comments-textarea-border-color` | Border color of comment textareas |
| `--ht-comments-textarea-foreground-color` | Text color of comment textareas |
| `--ht-comments-textarea-background-color` | Background color of comment textareas |
| `--ht-comments-textarea-focus-border-width` | Border width of focused comment textareas |
| `--ht-comments-textarea-focus-border-color` | Border color of focused comment textareas |
| `--ht-comments-textarea-focus-foreground-color` | Text color of focused comment textareas |
| `--ht-comments-textarea-focus-background-color` | Background color of focused comment textareas |
| `--ht-comments-indicator-size` | Size of comment indicators |
| `--ht-comments-indicator-color` | Color of comment indicators |

### License Variables

| Variable | Description |
|----------|-------------|
| `--ht-license-horizontal-padding` | Horizontal padding of license elements |
| `--ht-license-vertical-padding` | Vertical padding of license elements |
| `--ht-license-foreground-color` | Text color of license elements |
| `--ht-license-background-color` | Background color of license elements |

### Link Variables

| Variable | Description |
|----------|-------------|
| `--ht-link-color` | Color of links |
| `--ht-link-hover-color` | Color of hovered links |

### Input Variables

| Variable | Description |
|----------|-------------|
| `--ht-input-border-width` | Border width of input elements |
| `--ht-input-border-radius` | Border radius of input elements |
| `--ht-input-horizontal-padding` | Horizontal padding of input elements |
| `--ht-input-vertical-padding` | Vertical padding of input elements |
| `--ht-input-border-color` | Border color of input elements |
| `--ht-input-foreground-color` | Text color of input elements |
| `--ht-input-background-color` | Background color of input elements |
| `--ht-input-hover-border-color` | Border color of hovered input elements |
| `--ht-input-hover-foreground-color` | Text color of hovered input elements |
| `--ht-input-hover-background-color` | Background color of hovered input elements |
| `--ht-input-disabled-border-color` | Border color of disabled input elements |
| `--ht-input-disabled-foreground-color` | Text color of disabled input elements |
| `--ht-input-disabled-background-color` | Background color of disabled input elements |
| `--ht-input-focus-border-color` | Border color of focused input elements |
| `--ht-input-focus-foreground-color` | Text color of focused input elements |
| `--ht-input-focus-background-color` | Background color of focused input elements |

### Menu Variables

| Variable | Description |
|----------|-------------|
| `--ht-menu-border-width` | Border width of menu elements |
| `--ht-menu-border-radius` | Border radius of menu elements |
| `--ht-menu-horizontal-padding` | Horizontal padding of menu elements |
| `--ht-menu-vertical-padding` | Vertical padding of menu elements |
| `--ht-menu-item-horizontal-padding` | Horizontal padding of menu items |
| `--ht-menu-item-vertical-padding` | Vertical padding of menu items |
| `--ht-menu-border-color` | Border color of menu elements |
| `--ht-menu-shadow-x` | Horizontal shadow offset of menus |
| `--ht-menu-shadow-y` | Vertical shadow offset of menus |
| `--ht-menu-shadow-blur` | Shadow blur radius of menus |
| `--ht-menu-shadow-color` | Shadow color of menus |
| `--ht-menu-item-hover-color` | Background color of hovered menu items |
| `--ht-menu-item-active-color` | Background color of active menu items |

### Dialog Variables

| Variable | Description |
|----------|-------------|
| `--ht-dialog-semi-transparent-background-color` | Semi-transparent background color of dialog overlay |
| `--ht-dialog-solid-background-color` | Solid background color of dialog overlay |
| `--ht-dialog-content-padding-horizontal` | Horizontal padding of dialog content |
| `--ht-dialog-content-padding-vertical` | Vertical padding of dialog content |
| `--ht-dialog-content-border-radius` | Border radius of dialog content |
| `--ht-dialog-content-background-color` | Background color of dialog content |

### Pagination Variables

| Variable | Description |
|----------|-------------|
| `--ht-pagination-bar-foreground-color` | Text color of pagination bar |
| `--ht-pagination-bar-background-color` | Background color of pagination bar |
| `--ht-pagination-bar-horizontal-padding` | Horizontal padding of pagination bar |
| `--ht-pagination-bar-vertical-padding` | Vertical padding of pagination bar |
