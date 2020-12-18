---
id: demo-dropdown-menu
title: Dropdown menu
sidebar_label: Dropdown menu
slug: /demo-dropdown-menu
---

*   [Overview](#overview)
*   [Quick setup](#setup)
*   [Plugin configuration](#config)

### Overview

This plugin allows adding a configurable dropdown menu to the table's column headers.  
The dropdown menu acts like the **Context Menu**, but is triggered by clicking the button in the header.

### Quick setup

To enable the plugin, simply set the `dropdownMenu` property to `true`, when initializing Handsontable.

Edit in jsFiddle Log to console

var example1 = document.getElementById('example1'); var hot = new Handsontable(example1, { data: Handsontable.helper.createSpreadsheetData(3, 7), colHeaders: true, dropdownMenu: true });

### Plugin configuration

You can use the default dropdown contents by setting it to `true`, but if you'd like to customize it a little you can set it to use a custom list of actions. For the entry options reference, see the [Context Menu demo](https://handsontable.com/docs/8.2.0/demo-context-menu.html#page-specific).

Edit in jsFiddle Log to console

var example2 = document.getElementById('example2'); var hot2 = new Handsontable(example2, { data: Handsontable.helper.createSpreadsheetData(3, 7), colHeaders: true, dropdownMenu: \[ 'remove\_col', '---------', 'make\_read\_only', '---------', 'alignment' \] });

