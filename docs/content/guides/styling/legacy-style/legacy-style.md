---
id: yfus6qpz
title: Legacy Style
metaTitle: Legacy Style - JavaScript Data Grid | Handsontable
description: Design, prototype, and customize spreadsheet-like components with the Design System for Figma.
permalink: /legacy-theme
canonicalUrl: /legacy-theme
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
  id: jn3po47i
  metaTitle: Legacy Style - React Data Grid | Handsontable
angular:
  id: 1sco7djp
  metaTitle: Legacy Style - Angular Data Grid | Handsontable
searchCategory: Guides
category: Styling
---

# Legacy Classic Style

Handsontable 16.1 introduced a new **Classic (Modern)** theme that replaces the legacy `classic` style. The legacy classic stylesheet will be removed in version 17.0.

[[toc]]

## About the Legacy style

The `classic` (legacy) CSS file ([`handsontable.full.min.css`](https://github.com/handsontable/handsontable/blob/master/handsontable/dist/handsontable.full.min.css)) was the default stylesheet up until **version 15** (released in December 2024). This style is now considered legacy and **will be removed in version 17.0.0**.

![Handsontable legacy classic style]({{$basePath}}/img/legacy_classic_theme.png)

### Limitations of the Legacy Style

The legacy classic style was built with hardcoded styles that couldn't be customized with CSS variables. The new Classic (Modern) theme provides the same visual appearance but with the flexibility of CSS variables, making it easier to customize and maintain consistency with your application's design system.

### Benefits of Migrating

- **Visual Consistency**: The new theme maintains the same visual appearance as the legacy theme
- **Future-Proof**: The new theme will continue to be supported and enhanced
- **Console Warning**: You'll see a deprecation warning if you're still using the legacy theme

## Migration Guide

If you're using the legacy `classic` theme and would like to upgrade, please read the following migration guide:

- [Migrate from 16.0 to 16.1](@/guides/upgrade-and-migration/migrating-from-16.0-to-16.1/migrating-from-16.0-to-16.1.md)