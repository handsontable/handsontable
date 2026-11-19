/**
 * Group name for keyboard shortcuts that are active when the cell is selected.
 */
export const GRID_GROUP = 'gridDefault';
/**
 * Group name for the keyboard shortcuts that mark the clipboard keys as default grid shortcuts. The browser
 * runs the action, so the shortcuts do nothing. Removing one tells the `CopyPaste` plugin to cancel that key.
 */
export const GRID_CLIPBOARD_GROUP = 'gridClipboard';
/**
 * The keys of the clipboard shortcuts: copy, cut, and paste.
 */
export const GRID_CLIPBOARD_KEYS = [['Control/Meta', 'C'], ['Control/Meta', 'X'], ['Control/Meta', 'V']];
/**
 * Scope name for the grid.
 */
export const GRID_SCOPE = 'grid';
/**
 * A special group that is used to group keyboard shortcuts that listen to tab navigation events only to
 * handle the tab navigation logic and proper focus movement between the grid and other UI elements
 * provided by the plugin (e.g. dialog or pagination).
 */
export const GRID_TAB_NAVIGATION_GROUP = 'grid.tabNavigation';
/**
 * Group name for keyboard shortcuts that are active when the cell editor is active.
 */
export const EDITOR_EDIT_GROUP = 'editorManager.handlingEditor';
/**
 * Scope name for the editor.
 */
export const EDITOR_SCOPE = 'editor';
