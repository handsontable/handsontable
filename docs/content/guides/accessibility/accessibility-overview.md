---
id: o4qhm1bg
title: Accessibility overview
metaTitle: Accessibility overview - JavaScript Data Grid | Handsontable
description: Learn about our accessibility approach, and get an overview of Handsontable's accessibility features.
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

Get an overview of Handsontable's accessibility features.

[[toc]]

## Overview

Accessibility is a key part of the Handsontable experience. We strive to make our product accessible to all users, including those with disabilities.

DRAFT: Our overview: There are no universal standards for spreadsheets, so Handsontable supports different user needs by providing flexible (configurable) keyboard navigation.

## Accessibility demo

DRAFT: A simple interactive demo showcasing Handsontable's capabilities for logical and intuitive keyboard navigation, and how the configuration affects the grid's behavior.

## Keyboard navigation

A word about our overview toward shortcuts, and a link to the new Keyboard navigation page.

## Screen readers

## Accessibility compliance

A word about our overview toward standards, and a link to the new Accessibility compliance page.

## Customizations

DRAFT: When creating custom cell types or making other customizations to Handsontable, developers are responsible for ensuring the accessibility of these components. This includes using proper color contrast, font size, and semantic HTML tags, as well as incorporating ARIA attributes if needed. Developers should also avoid using flashing or blinking content. Finally, it's important to test customizations with real users who have different disabilities to ensure their accessibility.

## Known limitations

There will be some limitations, such as a limited number of screen readers that the software is tested against, and high contrast theme as it's not built-in, so the only way to achieve it is through customization by overriding the CSS of Handsontable.

## Related API reference

- Configuration options:
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
  - [`enterMoves`](@/api/options.md#entermoves)
  - [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
  - [`navigableHeaders`](@/api/options.md#navigableheaders)
  - [`tabMoves`](@/api/options.md#tabmoves)
