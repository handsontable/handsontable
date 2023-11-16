---
id: migrating-13.1.0-to-14.0
title: Migrating from 13.1.0 to 14.0
metaTitle: Migrating from 13.1.0 to 14.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 13.1.0 to Handsontable 14.0, released on November 15th, 2023.
permalink: /migration-from-13.1.0-to-14.0
canonicalUrl: /migration-from-13.1.0-to-14.0
pageClass: migration-guide
react:
  id: migrating-13.1.0-to-14.0-react
  metaTitle: Migrate from 13.1.0 to 14.0 - React Data Grid | Handsontable
searchCategory: Guides
---

# Migrate from 13.1.0 to 14.0

Migrate from Handsontable 13.1.0 to Handsontable 14.0, released on November 16th, 2023.

[[toc]]

## `scrollViewportTo` method change

The `scrollViewportTo` method in Handsontable has been updated, ensuing backward compatibility.


## Changed behavior of selecting all cells feature

From now on, pressing <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>A</kbd> selects all cells, excluding headers. Additionally, when selecting all cells, the focus position remains unchanged.[#10464](https://github.com/handsontable/handsontable/pull/10464)

## Keyboard shortcuts changes: Navigation
The table below summarizes default keyboard shortcuts changes related to navigation:

| Shortcut | Description |
|----------|-------------|
| <kbd>Esc</kbd> | Closes the menu and all submenus, not just a submenu |
| <kbd>Arrow up</kbd>/<kbd>Arrow down</kbd> | On the first or last item, moves focus to the beginning or end of the list of items |
| <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>Arrow up</kbd>, <kbd>Home</kbd> | Leads to the first active item |
| <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>Arrow down</kbd>, <kbd>End</kbd> | Leads to the last active item |
| <kbd>Enter</kbd>, <kbd>Space</kbd> | Opens the submenu |
| <kbd>Tab</kbd> | Selects the next focusable element and closes the menu |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | Selects the previous focusable element and closes the menu |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>A</kbd> | Selects all cells and closes the menu while keeping the focus in its initial position |


`forwardToContext` option in `ShortcutManager` allows forwarding keyboard events from one context to another within the same or separate Handsontable instance, enabling reactions to keyboard shortcuts before executing the built-in action they trigger.

## Tab navigation updates and changes in Handsontable

There have been changes to grid navigation using <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd>, aligning it with native browser focus order. Now, reaching the last cell in the table or row and pressing <kbd>Tab</kbd> will deactivate the table and move the focus to the next page element.

### API Changes
1. **New Option: `disableTabNavigation`**
   - **Default:** `false`
   - When `true`, disables table navigation. Tab or <kbd>Shift</kbd>+<kbd>Tab</kbd> moves the focus to the next or previous page element.
   - When `false`, allows table navigation. Reaching the last cell deactivates the table, moving the focus to the next page element.

2. **New Hook: `modifyFocusOnTabNavigation`**
   - Customizes cell selection after table activation via <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd>.
   - **Default behavior:** selects the first visible cell or the last cell based on the direction of activation.

3. **Improved `Core.listen` Method**
   - Enhanced for multiple Handsontable instances. Activating one instance will trigger the 'unlisten' hook on others.

### Migration Steps
- Review and adjust the `disableTabNavigation` setting as needed.
- Consider using the `modifyFocusOnTabNavigation` hook for customized cell selection.
- Update implementations involving multiple Handsontable instances to accommodate the improved `Core.listen` method.

## Changes in image handling

The updates have focused on enhancing accessibility by addressing how images are handled within Handsontable. 
Review these changes for any impact on their implementations and ensure compliance with the updated accessibility standards.

### Changes and Improvements

1. **Base64 Images**
   - Sorting indicators (arrow up and down) are now accessible, handled on the `feature/accessibility` branch with the `aria-sort` attribute.

2. **CSS-Content Icons**
   - `.htSubmenu` (arrow left and right): Icons are now wrapped in divs with `aria-hidden` attribute added.
   - `.htUISelectDropdown` (filters input icon): Added `aria-hidden` attribute.
   - `.changeType` (dropdown menu opener): Added `aria-label`.
   - `th.beforeHiddenColumn` & `th.afterHiddenColumn` (hidden column indicators): Icons are now wrapped in divs with `aria-label` added.
   - `th.beforeHiddenRow` & `th.afterHiddenRow` (hidden row indicators): Icons are now wrapped in divs with `aria-label` added.
   - `.columnSorting.sort-X` (multi column sorting order indicators): Icons are now wrapped in divs with `aria-label` added.
   - `div.ht_nestingButton.ht_nestingExpand` & `div.ht_nestingButton.ht_nestingCollapse` (nested rows expand/collapse button): Added `aria-hidden` and `aria-description` for the TH element.
   - `span.ht_nestingLevel`: Removed as it was unused.
   - `.htGhostTable .columnSorting`: Ignored as `htGhostTable` is never visible.

3. **Other Elements**
   - Collapsible column expand/collapse button (+/- icon): Added `aria-hidden` and `aria-description` for the TH element.
   - `htUIInputIcon`: Removed as it was unused.

## Refactor Walkontable Selection rendering module

The changes have been implemented, focusing on optimizing the drawing logic and improving the overall structure.

1. **Selection Class Refinement**
   - The drawing logic has been extracted from the `Selection` class and moved to a new parent class, `SelectionManager`.

2. **Optimization of Selection Loop**
   - The main selection loop, previously used for scanning intersected elements, has been extracted and divided into smaller, more efficient loops.

3. **Creation of Selection Module**
   - A new `Selection` module has been created by moving related files and code, such as the `Selection` class, its manager, `Border`, and selection-related methods from the `Table` class to a dedicated "selection" directory.

4. **Overlay's Table Instance Extension**
   - The overlay's `Table` instances have been extended with a method that allows obtaining the number of rendered headers.

5. **Reorganization and Naming Adjustments**
   - The Handsontable Selection module has been reorganized and renamed to support the new Walkontable Selection API.

6. **ASCIITable Test Matcher Implementation**
   - An ASCIITable test matcher has been implemented for Walkontable tests, facilitating more convenient visual tests for selections.

## Changes in Cell Coordination and Navigation
Review these changes for their impact on existing implementations and adapt their code.

1. **CellCoords and CellRange Method Signature Changes**
   - The `CellCoords:isValid()` and `CellRange:isValid()` methods have been updated. Their original design required passing a whole Walkontable instance, making them cumbersome, especially for third-party developers. The new design simplifies their usage.

2. **Modification of CellRange:isSingle() Method**
   - The `CellRange:isSingle()` method's functionality has been altered. With the new navigable headers feature, this method now returns true for the selection of a single header, in addition to a single cell.

## Changes in copy/paste, focus management, and testing
 Review these changes for their impact on existing implementations, especially regarding the new focus management and imeFastEdit option. Adaptations to the enhanced testing framework and ARIA tag usage are also recommended for improved accessibility and testing accuracy.

1. **Changed Copy/Paste Logic**
   - Removed the "focusable element" logic from the Copy/Paste plugin. The functionality now relies on the Clipboard API.

2. **Focus Manager**
   - Implemented a "focus manager" to direct browser focus to the last selection's highlight element (TD). This change enhances screen reader accessibility but impacts the fastEdit feature for IME users.

3. **New Option: imeFastEdit**
   - To address the above issue, a new `imeFastEdit` option has been introduced. This option delays the focus shift from the TD element to the active editor's TEXTAREA (or a configured element), maintaining fastEdit functionality for IME users.

### ARIA Tags and Testing Enhancements

1. **Addition of ARIA Tags**
   - Added ARIA tags to improve screen reader compatibility. More tags will be introduced in future updates.

2. **Test Case Updates and Cleanup**
   - Enhanced and streamlined existing test cases.

3. **New Config Object for e2e Test Matchers**
   - Introduced a config object for e2e tests' custom matchers. This can be set using `spec().matchersConfig['matcherName']`.

### Test Matchers and Visual Test Adjustments

1. **Enhanced toMatchHTML Custom Matcher**
   - Modified the `toMatchHTML` matcher to allow skipping HTML attributes in comparisons. This feature is configurable and aids in focusing tests on relevant attributes.

2. **Visual Test Corrections**
   - Adjusted the `type` method in visual tests for improved accuracy and consistency.

3. **Cell-Targeting Helper in Visual Tests**
   - Updated the cell-targeting helper to use a `<0; n>` indexing system and to target only elements of the specified type.


Mention https://github.com/handsontable/handsontable/pull/10540
