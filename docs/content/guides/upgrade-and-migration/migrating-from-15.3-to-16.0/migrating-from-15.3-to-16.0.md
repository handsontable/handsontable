---
id: migrating-15.3-to-16.0
title: Migrating from 15.3 to 16.0
metaTitle: Migrating from 15.3 to 16.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 15.3 to Handsontable 16.0, released on [].
permalink: /migration-from-15.3-to-16.0
canonicalUrl: /migration-from-15.3-to-16.0
pageClass: migration-guide
react:
  id: migrating-15.3-to-16.0-react
  metaTitle: Migrate from 15.3 to 16.0 - React Data Grid | Handsontable
angular:
  id: migrating-15.3-to-16.0-angular
  metaTitle: Migrate from 15.3 to 16.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 15.3 to 16.0

Migrate from Handsontable 15.3 to Handsontable 16.0, released on [TODO].

[[toc]]

## 1. Introducing the new DOM structure

In Handsontable 16.0, we updated the DOM structure. The main change is how the table is mounted. Previously, the container `<div>` you provided became the root element of the table. In the new approach, that `<div>` is now just the element into which the Handsontable instance is injected.

Here is a comparison of the old and new DOM structures:

Old DOM structure:

```
body
├── #example.ht-wrapper.handsontable
│   ├── Focus catcher (top)
│   ├── Personal details table/grid content
│   └── Focus catcher (bottom)
├── License key notification bar
└── Context menus, dropdowns, pop-ups, sidebars
    (absolutely positioned elements)
```

New DOM structure:

```
body
└── #example
    └── .ht-root-wrapper
        ├── Focus catcher (top)
        ├── .ht-wrapper.handsontable
        │   ├── Personal details table/grid content
        │   ├── License key notification bar
        │   ├── Future: Status bar
        │   └── Future: Pagination bar
        ├── Focus catcher (bottom)
        └── .ht-portal
            └── Context menus, dropdowns, pop-ups, sidebars
                (absolutely positioned elements)
```

### Key changes
- Root Wrapper: User-provided div is now used as a container for the new DOM structure
- Focus Catcher Relocation: Input elements used as focus catchers have been moved outside of the treegrid element for accessibility compliance
- Portal Element: New div.ht-portal with ht-theme class for absolutely positioned elements
- Root Element: rootElement is now created internally by Handsontable instead of using the user-provided container directly

## 2. Update the css variables

In Handsontable 16.0, we've made significant improvements to our CSS variables system to adjust themes colors, variable order and provide better customization options. Here are the key changes:

### New css variables
We've introduced new variables that allow for easier customization: 

 - `--ht-letter-spacing`: controls the spacing between letters for better readability and visual appearance
 - `--ht-radio-[]`: style radio input more accurate
 - `--ht-cell-read-only-background-color`: better adjust readonly cells
 - `--ht-checkbox-indeterminate`: customize checkbox indeterminate state

### Renamed CSS variables
We've renamed a few variables to ensure more consistent naming: 

| Old variable name                                | New variable name                                |
|--------------------------------------------------|--------------------------------------------------|
| `--ht-icon-active-button-border-color`           | `--ht-icon-button-active-border-color`           |
| `--ht-icon-active-button-background-color`       | `--ht-icon-button-active-background-color`       |
| `--ht-icon-active-button-icon-color`             | `--ht-icon-button-active-icon-color`             |
| `--ht-icon-active-button-hover-border-color`     | `--ht-icon-button-active-hover-border-color`     |
| `--ht-icon-active-button-hover-background-color` | `--ht-icon-button-active-hover-background-color` |
| `--ht-icon-active-button-hover-icon-color`       | `--ht-icon-button-active-hover-icon-color`       |

### Migration notes
If you were using custom CSS variables in version 15.3, you'll need to:

1. Review your custom variable names against the new naming convention
2. Update variable references to the new radio input (only if checkbox variables were changed)
3. Take advantage of the new variables for more granular control

## 3. Update the placement of custom borders

In Handsontable 16.0, we've updated how custom borders are positioned to improve accuracy and consistency.

### Key changes in border placement
- Borders are positioned to ensure that all borders remain within the table

### Migration notes
No code changes are required - the improvements are handled automatically by the new version.
