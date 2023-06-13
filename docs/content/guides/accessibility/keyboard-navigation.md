---
id: 6qwoo503
title: Keyboard navigation
metaTitle: Keyboard navigation - JavaScript Data Grid | Handsontable
description: Navigate the grid with the keyboard alone. Use additional options to make your application more accessible.
permalink: /keyboard-navigation
canonicalUrl: /keyboard-navigation
tags:
- accessibility
- certification
- section 508
- WCAG
- ADA
- a11y
- aria
react:
  id: 3m72vkzl
  metaTitle: Keyboard navigation - React Data Grid | Handsontable
searchCategory: Guides
---

# Keyboard navigation

Navigate the grid with the keyboard alone. Use additional options to make your application more accessible.

[[toc]]

## Overview

You can easily access all of Handsontable's features without using a mouse. This is especially useful for people with disabilities who rely on keyboard navigation.

Navigating the grid is intuitive, and involves a few simple keystrokes. Try it out in the [demo](#default-keyboard-navigation) below. For example, you can move the focus with the arrow keys, press <kbd>**Enter**</kbd> to edit a cell, and press <kbd>**Esc**</kbd> to cancel editing. For more advanced actions, see the list of all [built-in shortcuts](@/guides/accessories-and-menus/keyboard-shortcuts.md#default-keyboard-shortcuts) or add shortcuts of [your own](@/guides/accessories-and-menus/keyboard-shortcuts.md#custom-keyboard-shortcuts).

Handsontable's keyboard navigation works out of the box and follows international standards. You can also fine-tune its behavior by using the navigation [options](#enable-tab-key-navigation).

## Default keyboard navigation

list shortcuts (which ones?)
demo

## Keyboard navigation options

Demo with options:

- `disableTabNavigation`
- `navigableHeaders`
- `tabMoves`
- `enterMoves`
- `enterBeginsEditing`

## Related API reference

- Configuration options:
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
  - [`enterMoves`](@/api/options.md#entermoves)
  - [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
  - [`navigableHeaders`](@/api/options.md#navigableheaders)
  - [`tabMoves`](@/api/options.md#tabmoves)
