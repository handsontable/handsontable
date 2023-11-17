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

## `scrollViewportTo` method enhancement

The `scrollViewportTo` method in core Handsontable has been enhanced to provide more fine-grained control over viewport positioning. Importantly, this improvement is fully backward compatible, meaning existing code utilizing this method will continue to function without requiring any migration.

### Auto-Snapping Behavior
The enhanced `scrollViewportTo` method introduces optional auto-snapping behavior. If users do not provide additional options when calling the method, the coordinates will be automatically snapped to the top-start position, preserving the previous behavior.

If you wish to take advantage of the new auto-snapping behavior, you can provide additional options when calling the `scrollViewportTo` method. This allows for more control over the exact positioning of the viewport based on the specified coordinates.


**Example**
```js
hot.scrollViewportTo({
  row: 10,
  col: 10,
  verticalSnap: 'top',
  horizontalSnap: 'start',
});
```


## Changes to selecting all cells feature

The modifications to the "Select All Cells" feature bring about the following improvements:

- Hitting <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>A</kbd> will now select all cells without including the headers in the selection.
- Selecting all cells will no longer alter the focus position. The focus position remains stationary, providing a more predictable and user-friendly interaction.


## Improved Keyboard Navigation through Context and Dropdown Menus
Significant enhancements have been made to the keyboard navigation within the Menu module, benefiting both the `ContextMenu` and `DropdownMenu` plugins. These changes aim to elevate the overall user experience by introducing new shortcuts and refining existing ones.

The introduction of a new option, `forwardToContext` in the `ShortcutManager`, facilitates forwarding keyboard events between different contexts within the same or separate Handsontable instances. Enabling you to react to keyboard shortcuts before executing the built-in action they trigger.

The table below summarizes keyboard shortcuts changes related to navigation of Context and Dropdown Menus:

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



## Changes to tab navigation



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
 Review these changes for their impact on existing implementations, especially regarding the new focus management and imeFastEdit option.

1. **Changed Copy/Paste Logic**
   - Removed the "focusable element" logic from the Copy/Paste plugin. The functionality now relies on the Clipboard API.

2. **Focus Manager**
   - Implemented a "focus manager" to direct browser focus to the last selection's highlight element (TD). This change enhances screen reader accessibility but impacts the fast edit feature for IME users.

3. **New Option: imeFastEdit**
   - To address the above issue, a new imeFastEdit option has been introduced. This option delays the focus shift from the TD element to the active editor's TEXTAREA (or a configured element), maintaining fast edit functionality for IME users.


<!-- Mention https://github.com/handsontable/handsontable/pull/10540

Mention dom tree change
 I’d mention only the changes that structurally changed the DOM tree, like wrapping icons in elements, as that potentially can affect the CSS selectors that some developers might have used to target those icons --> 