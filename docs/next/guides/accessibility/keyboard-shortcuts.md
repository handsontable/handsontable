---
title: Keyboard shortcuts
metaTitle: Keyboard shortcuts - Guide - Handsontable Documentation
permalink: /next/keyboard-shortcuts
canonicalUrl: /keyboard-shortcuts
tags:
  - key bindings
  - keymap
  - shortcut manager
---

# Keyboard shortcuts

Manage Handsontable's keyboard shortcuts.

[[toc]]

## About keyboard shortcuts

## Default keyboard shortcuts

By default, Handsontable features the following keyboard shortcuts:

::: details Default keyboard shortcuts
<br>
<br>

#### NAVIGATION

| Windows                           | macOS                                                                                        | Action                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| <kbd>Up↑</kbd>                    | <kbd>Up↑</kbd>                                                                               | Move to the cell directly above              |
| <kbd>Down↓</kbd>                  | <kbd>Down↓</kbd>                                                                             | Move to the cell directly below              |
| <kbd>Right→</kbd>                 | <kbd>Right→</kbd>                                                                            | Move to the cell directly to the right       |
| <kbd>Left←</kbd>                  | <kbd>Left←</kbd>                                                                             | Move to the cell directly to the left        |
| <kbd>Tab</kbd>                    | <kbd>Tab</kbd>                                                                               | Move to the cell directly to the right       |
| <kbd>Tab</kbd> + <kbd>Shift</kbd> | <kbd>Tab</kbd> + <kbd>Shift</kbd>                                                            | Move to the cell directly to the left        |
| <kbd>Home</kbd>                   | <kbd>Fn</kbd> + <kbd>Left←</kbd>                                                             | Jump to the first cell of the current row    |
| <kbd>End</kbd>                    | <kbd>Fn</kbd> + <kbd>Right→</kbd>                                                            | Jump to the last cell of the current row     |
| <kbd>Ctrl</kbd> + <kbd>Home</kbd> | <kbd>Ctrl</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Home</kbd> | Jump to the first cell of the current column |
| <kbd>Ctrl</kbd> + <kbd>End</kbd>  | <kbd>Ctrl</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>End</kbd> | Jump to the last cell of the current column  |

<br>
<br>

#### SELECTION

| Windows                                              | macOS                                                                                                                              | Action                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| <kbd>Ctrl</kbd> + <kbd>A</kbd>                       | <kbd>Cmd</kbd> + <kbd>A</kbd>                                                                                                      | Select all cells and headers                                                                              |
| <kbd>Shift</kbd> + <kbd>Up↑</kbd>                    | <kbd>Shift</kbd> + <kbd>Up↑</kbd>                                                                                                  | Extend selection to include the cell directly above                                                       |
| <kbd>Shift</kbd> + <kbd>Down↓</kbd>                  | <kbd>Shift</kbd> + <kbd>Down↓</kbd>                                                                                                | Extend selection to include the cell directly below                                                       |
| <kbd>Shift</kbd> + <kbd>Right→</kbd>                 | <kbd>Shift</kbd> + <kbd>Right→</kbd>                                                                                               | Extend selection to include the cell directly to the right                                                |
| <kbd>Shift</kbd> + <kbd>Left←</kbd>                  | <kbd>Shift</kbd> + <kbd>Left←</kbd>                                                                                                | Extend selection to include the cell directly to the left                                                 |
| <kbd>Shift</kbd> + <kbd>Home</kbd>                   | <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Shift</kbd> + <kbd>Home</kbd>                                    | Extend selection to include all cells to the left, in the current row                                     |
| <kbd>Shift</kbd> + <kbd>End</kbd>                    | <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Shift</kbd> + <kbd>End</kbd>                                    | Extend selection to include all cells to the right, in the current row                                    |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Home</kbd> | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Home</kbd> | Extend selection to include all cells above, in the current column                                        |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>End</kbd>  | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>End</kbd> | Extend selection to include all cells below, in the current column                                        |
| <kbd>Ctrl</kbd> + <kbd>M</kbd>                       | <kbd>Cmd</kbd> + <kbd>M</kbd>                                                                                                      | When the [`MergeCells`](@/api/mergeCells.md) plugin is enabled:<br>merge/unmerge currently-selected cells |

<br>
<br>

#### EDITING

| Windows                                                                      | macOS                               | Action                                                                                                  |
| ---------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| <kbd>Enter</kbd>                                                             | <kbd>Enter</kbd>                    | Start editing<br><br>When editing: stop editing, save your changes, and move to the cell directly below |
| <kbd>Shift</kbd> + <kbd>Enter</kbd>                                          | <kbd>Shift</kbd> + <kbd>Enter</kbd> | Start editing<br><br>When editing: stop editing, save your changes, and move to the cell directly above |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                                           | <kbd>Ctrl</kbd> + <kbd>Enter</kbd>  | Start editing<br><br>When editing: add a new line inside the cell                                       |
| <kbd>F2</kbd>                                                                | <kbd>F2</kbd>                       | Start editing                                                                                           |
| <kbd>Esc</kbd>                                                               | <kbd>Esc</kbd>                      | When editing: stop editing, and cancel your changes                                                     |
| <kbd>Backspace</kbd>                                                         | <kbd>Backspace</kbd>                | Clear the cell's contents                                                                               |
| <kbd>Delete</kbd>                                                            | <kbd>Delete</kbd>                   | Clear the cell's contents                                                                               |
| <kbd>Ctrl</kbd> + <kbd>C</kbd><br>or<br><kbd>Ctrl</kbd> + <kbd>Insert</kbd>  | <kbd>Cmd</kbd> + <kbd>C</kbd>       | Copy the cell's contents                                                                                |
| <kbd>Ctrl</kbd> + <kbd>X</kbd>                                               | <kbd>Cmd</kbd> + <kbd>X</kbd>       | Cut the cell's contents                                                                                 |
| <kbd>Ctrl</kbd> + <kbd>V</kbd><br>or<br><kbd>Shift</kbd> + <kbd>Insert</kbd> | <kbd>Cmd</kbd> + <kbd>V</kbd>       | Paste into the cell                                                                                     |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                                           | <kbd>Cmd</kbd> + <kbd>Enter</kbd>   | When editing: fill all currently-selected cells with the contents of the currently-edited cell          |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd>                                               | <kbd>Cmd</kbd> + <kbd>Z</kbd>       | Undo                                                                                                    |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd>                                               | <kbd>Cmd</kbd> + <kbd>Y</kbd>       | Redo                                                                                                    |

<br>
<br>

#### CONTEXT MENU

| Windows          | macOS            | Action                                          |
| ---------------- | ---------------- | ----------------------------------------------- |
| <kbd>Down↓</kbd> | <kbd>Down↓</kbd> | Move to the next option of the context menu     |
| <kbd>Up↑</kbd>   | <kbd>Up↑</kbd>   | Move to the previous option of the context menu |
| <kbd>Enter</kbd> | <kbd>Enter</kbd> | Select the context menu option                  |
:::

## Managing keyboard shortcuts

### Removing default keyboard shortcuts

### Replacing default keyboard shortcuts

### Adding custom keyboard shortcuts