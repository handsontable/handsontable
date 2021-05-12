---
title: Column menu
metaTitle: Column menu - Guide - Handsontable Documentation
permalink: /next/column-menu
canonicalUrl: /column-menu
tags:
  - dropdown menu
---

# Column menu

[[toc]]

## Overview

This plugin allows adding a configurable dropdown menu to the table's column headers.
The dropdown menu acts like the **Context Menu**, but is triggered by clicking the button in the header.

## Quick setup

To enable the plugin, simply set the `dropdownMenu` property to `true`, when initializing Handsontable.

::: example #example1
```js
var example1 = document.getElementById('example1');
var hot1 = new Handsontable(example1, {
  data: Handsontable.helper.createSpreadsheetData(3, 7),
  colHeaders: true,
  dropdownMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Plugin configuration

You can use the default dropdown contents by setting it to `true`, but if you'd like to customize it a little you can set it to use a custom list of actions. For the entry options reference, see the [Context Menu demo](context-menu.md#page-specific).

::: example #example2
```js
var example2 = document.getElementById('example2');
var hot2 = new Handsontable(example2, {
  data: Handsontable.helper.createSpreadsheetData(3, 7),
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  dropdownMenu: [
    'remove_col',
    '---------',
    'make_read_only',
    '---------',
    'alignment'
  ]
});
```
:::
