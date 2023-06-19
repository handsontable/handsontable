---
id: o4qhm1bg
title: Accessibility overview
metaTitle: Accessibility overview - JavaScript Data Grid | Handsontable
description: Learn about our approach to accessibility, and get an overview of Handsontable's accessibility features.
permalink: /accessibility-overview
canonicalUrl: /accessibility-overview
tags:
  - accessibility
  - a11y
  - aria
react:
  id: x82phf34
  metaTitle: Accessibility overview - React Data Grid | Handsontable
searchCategory: Guides
---

# Accessibility overview

Learn about our approach to accessibility, and get an overview of Handsontable's accessibility features.

[[toc]]

## Overview

At Handsontable, we believe in a web that's accessible to everyone. That's why we designed our data grid to be used by people with disabilities, including those who use assistive technologies like screen readers and keyboard navigation.

In case of data grids and spreadsheet components, there's no universal accessibility standard. Depending on your use case, industry or location, your application may need to meet different accessibility requirements. That's why we're opting for a flexible approach to accessibility. This means that we strive to make our data grid accessible to as many users as possible, while still letting developers customize the grid to meet their specific needs.

## Accessibility demo

A simple interactive demo showcasing Handsontable's capabilities for logical and intuitive keyboard navigation, and how the configuration affects the grid's behavior.

## Keyboard navigation

A word about our approach toward shortcuts, and a link to the new Keyboard navigation page.

## Supported screen readers

### JAWS

One sentence about JAWS + how compatible HoT is with it

### NVDA

One sentence about NVDA + how compatible HoT is with it

### VoiceOver

One sentence about VoiceOver + how compatible HoT is with it

## Accessibility testing

How we test accessibility (what browser versions etc.)

## Accessibility compliance

A word about our accessibility certificates, standards that we meet, and a link to the new Accessibility compliance page.

## Known limitations

- Limited number of screen readers that we test Handsontable against
- High contrast theme is not built in, so the only way to achieve it is through customization by overriding the CSS of Handsontable.
- IME fast editing [#10342](https://github.com/handsontable/handsontable/pull/10342)

## Customization and accessibility

DRAFT: When creating custom cell types or making other customizations to Handsontable, developers are responsible for ensuring the accessibility of these components. This includes using proper color contrast, font size, and semantic HTML tags, as well as incorporating ARIA attributes if needed. Developers should also avoid using flashing or blinking content. Finally, it's important to test customizations with real users who have different disabilities to ensure their accessibility.

## Related API reference

- Configuration options:
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
  - [`enterMoves`](@/api/options.md#entermoves)
  - [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
  - [`navigableHeaders`](@/api/options.md#navigableheaders)
  - [`tabMoves`](@/api/options.md#tabmoves)
