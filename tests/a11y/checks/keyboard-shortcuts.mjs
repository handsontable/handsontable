/**
 * Every row of the keyboard shortcuts guide
 * (`docs/content/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md`), and how the keyboard
 * walker (`keyboard-walker.spec.ts`) proves it does what the guide says. An entry names its row by
 * `section`, `keys` (the Windows column, as `parseShortcutTables()` in `lib/keyboard-walker.mjs` reads
 * it) and `ordinal` (when a section lists the same keys twice), and holds either a `probe` or a
 * `notProbed` reason. `lib/__tests__/keyboard-walker.test.mjs` fails on a documented row without an
 * entry and on an entry whose row is gone, so a shortcut added to the guide is accounted for here in
 * the same change.
 *
 * A probe:
 *
 * - `page`: the page it runs on, a catalog id of `../pages.mjs`, or `keyboard-shortcuts` (the default:
 *   `fixtures/demo/keyboard-shortcuts.html`, one grid with the plugins most rows need);
 * - `setup`: where the focus is before the key (`cell` at `at`, a `range` from `at` to `to`, an open
 *   `editor`, the `context-menu`, the column `dropdown-menu`, the `comment` editor, a `column-header` or a
 *   `row-header` at `at`, the first `freeze-bar`, or `outside` the grid);
 * - `prepare`: what to do before the snapshot, in order: a key to press (a string), or a step the spec
 *   runs (`{ api: '<name>' }`, `{ focus: '<selector>' }` inside the grid's portal, `{ type: '<text>' }`);
 * - `press`: the key, a Playwright chord, or a list of keys each probed on its own from the same setup
 *   (`Arrow keys` is four probes); a key of the list can be `{ key, prepare }` when it needs steps of its
 *   own after the shared ones. `ControlOrMeta` is the guide's Ctrl that is ⌘ on macOS; `Control` is
 *   the Ctrl that stays ⌃;
 * - `then`: steps run after the key and before the snapshot that judges it (the `prepare` vocabulary), for a
 *   key whose effect shows only on the key after it, like a mode switch; the probe's comment says what those
 *   steps do without the key, so the effect is the key's;
 * - `expect`: the effect the guide describes (`effectsBetween()`), or a list of effects any of which
 *   satisfies it.
 *
 * The walker loads the page again before a probe when the one before changed the data, the merges, the
 * sort, the filters, the collapsed groups, the frozen counts or the row selection, so every probe starts
 * from the page as it loads. A probe whose key changes nothing is a `shortcut-does-nothing` finding (2.1.1); one that moves the
 * focus out of the grid is `shortcut-moves-focus-out` (2.4.3); one that does something else is an
 * advisory `shortcut-unexpected-effect`.
 */
export const SHORTCUT_PROBES = [
  // Navigation.
  { section: 'Navigation keyboard shortcuts', keys: 'Arrow keys',
    probe: { setup: 'cell', at: [5, 5], press: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+Backspace',
    probe: { setup: 'cell', at: [5, 5], prepare: [{ api: 'scrollAway' }], press: 'ControlOrMeta+Backspace', expect: 'scrolls' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+↑', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+ArrowUp', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+↓', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+ArrowDown', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+←', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+ArrowLeft', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+→', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+ArrowRight', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'F2', probe: { setup: 'cell', at: [5, 5], press: 'F2', expect: 'editor-opens' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Enter', probe: { setup: 'cell', at: [5, 5], press: 'Enter', expect: 'editor-opens' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Shift+Enter', probe: { setup: 'cell', at: [5, 5], press: 'Shift+Enter', expect: 'editor-opens' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+Shift+Enter',
    probe: { setup: 'editor', at: [5, 5], press: 'ControlOrMeta+Shift+Enter', expect: 'editor-closes' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Alphanumeric keys', probe: { setup: 'cell', at: [5, 5], press: ['a', '7'], expect: 'editor-opens' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Tab', probe: { setup: 'cell', at: [5, 5], press: 'Tab', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Shift+Tab', probe: { setup: 'cell', at: [5, 5], press: 'Shift+Tab', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Home', probe: { setup: 'cell', at: [5, 5], press: 'Home', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+Home', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+Home', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'End', probe: { setup: 'cell', at: [5, 5], press: 'End', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Ctrl+End', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+End', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Page Up', probe: { setup: 'cell', at: [30, 5], press: 'PageUp', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Page Down', probe: { setup: 'cell', at: [5, 5], press: 'PageDown', expect: 'selection-moves' } },
  { section: 'Navigation keyboard shortcuts', keys: 'Alt+Enter', probe: { page: 'auto-link', setup: 'cell', at: [0, 0], press: 'Alt+Enter', expect: 'link-opens' } },

  // Selection.
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+A', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+a', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+Shift+Space',
    probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+Shift+Space', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+Space', probe: { setup: 'cell', at: [5, 5], press: 'Control+Space', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Shift+Space', probe: { setup: 'cell', at: [5, 5], press: 'Shift+Space', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+Shift+↑', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+Shift+ArrowUp', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+Shift+↓',
    probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+Shift+ArrowDown', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+Shift+←',
    probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+Shift+ArrowLeft', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+Shift+→',
    probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+Shift+ArrowRight', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Shift+Arrow keys',
    probe: { setup: 'cell', at: [5, 5], press: ['Shift+ArrowUp', 'Shift+ArrowDown', 'Shift+ArrowLeft', 'Shift+ArrowRight'], expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Shift+Home', probe: { setup: 'cell', at: [5, 5], press: 'Shift+Home', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Shift+End', probe: { setup: 'cell', at: [5, 5], press: 'Shift+End', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Shift+Page Up', probe: { setup: 'cell', at: [30, 5], press: 'Shift+PageUp', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Shift+Page Down', probe: { setup: 'cell', at: [5, 5], press: 'Shift+PageDown', expect: 'selection-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Ctrl+Enter',
    probe: { setup: 'range', at: [5, 5], to: [7, 6], press: 'ControlOrMeta+Enter', expect: 'value-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Delete', probe: { setup: 'range', at: [5, 5], to: [6, 6], press: 'Delete', expect: 'value-changes' } },
  { section: 'Selection keyboard shortcuts', keys: 'Backspace', probe: { setup: 'range', at: [5, 5], to: [6, 6], press: 'Backspace', expect: 'value-changes' } },

  // Edition: the editor opens on a cell holding `F6`, with the caret at the end of the text.
  { section: 'Edition keyboard shortcuts', keys: 'Arrow keys', probe: { setup: 'editor', at: [5, 5], press: ['ArrowLeft', 'ArrowUp'], expect: 'caret-moves' } },
  { section: 'Edition keyboard shortcuts', keys: 'Alphanumeric keys', probe: { setup: 'editor', at: [5, 5], press: ['a', '7'], expect: 'text-changes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Enter', probe: { setup: 'editor', at: [5, 5], press: 'Enter', expect: 'editor-closes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Shift+Enter', probe: { setup: 'editor', at: [5, 5], press: 'Shift+Enter', expect: 'editor-closes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Tab', probe: { setup: 'editor', at: [5, 5], press: 'Tab', expect: 'editor-closes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Shift+Tab', probe: { setup: 'editor', at: [5, 5], press: 'Shift+Tab', expect: 'editor-closes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Delete', probe: { setup: 'editor', at: [5, 5], prepare: ['Home'], press: 'Delete', expect: 'text-changes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Backspace', probe: { setup: 'editor', at: [5, 5], press: 'Backspace', expect: 'text-changes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Home', probe: { setup: 'editor', at: [5, 5], press: 'Home', expect: 'caret-moves' } },
  { section: 'Edition keyboard shortcuts', keys: 'End', probe: { setup: 'editor', at: [5, 5], prepare: ['Home'], press: 'End', expect: 'caret-moves' } },
  { section: 'Edition keyboard shortcuts', keys: 'Ctrl+Arrow keys', probe: { setup: 'editor', at: [5, 5], press: 'ControlOrMeta+ArrowLeft', expect: 'caret-moves' } },
  { section: 'Edition keyboard shortcuts', keys: 'Ctrl+Shift+Arrow keys',
    probe: { setup: 'editor', at: [5, 5], press: 'ControlOrMeta+Shift+ArrowLeft', expect: 'caret-moves' } },
  { section: 'Edition keyboard shortcuts', keys: 'Page Up', probe: { setup: 'editor', at: [30, 5], press: 'PageUp', expect: 'editor-closes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Page Down', probe: { setup: 'editor', at: [5, 5], press: 'PageDown', expect: 'editor-closes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Alt+Enter', probe: { setup: 'editor', at: [5, 5], press: 'Alt+Enter', expect: 'text-changes' } },
  { section: 'Edition keyboard shortcuts', keys: 'Ctrl+Enter', probe: { setup: 'editor', at: [5, 5], press: 'ControlOrMeta+Enter', expect: ['text-changes', 'editor-closes'] } },
  { section: 'Edition keyboard shortcuts', keys: 'Escape', probe: { setup: 'editor', at: [5, 5], prepare: [{ type: 'x' }], press: 'Escape', expect: 'editor-closes' } },

  // The cell editors, on the catalog pages that draw them.
  { section: 'Checkbox editor keyboard shortcuts', keys: 'Space', probe: { page: 'checkbox', setup: 'cell', at: [0, 1], press: 'Space', expect: 'value-changes' } },
  { section: 'Checkbox editor keyboard shortcuts', keys: 'Enter', probe: { page: 'checkbox', setup: 'cell', at: [0, 1], press: 'Enter', expect: 'value-changes' } },
  { section: 'Checkbox editor keyboard shortcuts', keys: 'Delete',
    probe: { page: 'checkbox', setup: 'cell', at: [1, 1], prepare: [{ api: 'check' }], press: 'Delete', expect: 'value-changes' } },
  { section: 'Checkbox editor keyboard shortcuts', keys: 'Backspace',
    probe: { page: 'checkbox', setup: 'cell', at: [1, 1], prepare: [{ api: 'check' }], press: 'Backspace', expect: 'value-changes' } },
  { section: 'handsontable editor keyboard shortcuts', keys: '↑',
    probe: { page: 'handsontable-editor', setup: 'editor', at: [0, 0], prepare: ['ArrowDown', 'ArrowDown'], press: 'ArrowUp', expect: 'list-moves' } },
  { section: 'handsontable editor keyboard shortcuts', keys: '↓', probe: { page: 'handsontable-editor', setup: 'editor', at: [0, 0], press: 'ArrowDown', expect: 'list-moves' } },
  // The select starts with no option chosen when the cell's value is not one of them, so ArrowUp starts two options down.
  { section: 'Select editor keyboard shortcuts', keys: '↑',
    probe: { page: 'select-editor', setup: 'editor', at: [0, 3], prepare: ['ArrowDown', 'ArrowDown'], press: 'ArrowUp', expect: 'text-changes' } },
  { section: 'Select editor keyboard shortcuts', keys: '↓', probe: { page: 'select-editor', setup: 'editor', at: [0, 3], press: 'ArrowDown', expect: 'text-changes' } },
  { section: 'MultiSelect editor keyboard shortcuts', keys: '↑ / ↓',
    probe: { page: 'multiselect-editor', setup: 'editor', at: [0, 0], prepare: ['ArrowDown', 'ArrowDown'], press: ['ArrowDown', 'ArrowUp'], expect: 'focus-moves' } },
  { section: 'MultiSelect editor keyboard shortcuts', keys: 'Space',
    probe: { page: 'multiselect-editor', setup: 'editor', at: [0, 0], prepare: ['ArrowDown'], press: 'Space', expect: 'text-changes' } },
  { section: 'MultiSelect editor keyboard shortcuts', keys: 'Enter',
    probe: { page: 'multiselect-editor', setup: 'editor', at: [0, 0], prepare: ['ArrowDown'], press: 'Enter', expect: ['text-changes', 'editor-closes'] } },

  // Plugins.
  { section: 'Clipboard keyboard shortcuts', keys: 'Ctrl+X', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+x', expect: 'clipboard' } },
  { section: 'Clipboard keyboard shortcuts', keys: 'Ctrl+C', probe: { setup: 'cell', at: [5, 5], press: 'ControlOrMeta+c', expect: 'clipboard' } },
  { section: 'Clipboard keyboard shortcuts', keys: 'Ctrl+V',
    probe: { setup: 'cell', at: [5, 5], prepare: ['ControlOrMeta+c', { api: 'selectNeighbor' }], press: 'ControlOrMeta+v', expect: 'clipboard' } },
  { section: 'Cell merging keyboard shortcuts', keys: 'Ctrl+M', probe: { setup: 'range', at: [5, 5], to: [6, 6], press: 'Control+m', expect: 'merges' } },
  { section: 'Undo and redo keyboard shortcuts', keys: 'Ctrl+Z',
    probe: { setup: 'cell', at: [5, 5], prepare: [{ api: 'change' }], press: 'ControlOrMeta+z', expect: 'value-changes' } },
  { section: 'Undo and redo keyboard shortcuts', keys: 'Ctrl+Y',
    probe: { setup: 'cell', at: [5, 5], prepare: [{ api: 'change' }, { api: 'undo' }], press: 'ControlOrMeta+y', expect: 'value-changes' } },
  { section: 'Undo and redo keyboard shortcuts', keys: 'Ctrl+Shift+Z',
    probe: { setup: 'cell', at: [5, 5], prepare: [{ api: 'change' }, { api: 'undo' }], press: 'ControlOrMeta+Shift+z', expect: 'value-changes' } },
  { section: 'Context menu keyboard shortcuts', keys: 'Ctrl+Shift+\\ or Shift+F10',
    probe: { setup: 'cell', at: [5, 5], press: ['ControlOrMeta+Shift+Backslash', 'Shift+F10'], expect: 'menu-opens' } },
  { section: 'Context menu keyboard shortcuts', keys: 'Arrow keys',
    probe: { setup: 'context-menu', at: [5, 5], prepare: ['ArrowDown'], press: ['ArrowDown', 'ArrowUp'], expect: 'menu-moves' } },
  { section: 'Context menu keyboard shortcuts', keys: 'Page Up',
    probe: { setup: 'context-menu', at: [5, 5], prepare: ['ArrowDown', 'ArrowDown', 'ArrowDown'], press: 'PageUp', expect: 'menu-moves' } },
  { section: 'Context menu keyboard shortcuts', keys: 'Page Down', probe: { setup: 'context-menu', at: [5, 5], prepare: ['ArrowDown'], press: 'PageDown', expect: 'menu-moves' } },
  { section: 'Context menu keyboard shortcuts', keys: 'Escape', probe: { setup: 'context-menu', at: [5, 5], press: 'Escape', expect: 'menu-closes' } },
  { section: 'Context menu keyboard shortcuts', keys: 'Enter',
    probe: { setup: 'context-menu', at: [5, 5], prepare: ['ArrowDown'], press: 'Enter', expect: ['menu-closes', 'value-changes'] } },
  { section: 'Column groups keyboard shortcuts', keys: 'Enter',
    probe: { page: 'nested-headers', setup: 'column-header', at: [-2, 3], press: 'Enter', expect: 'collapses' } },
  { section: 'Row parent-child keyboard shortcuts', keys: 'Enter', probe: { page: 'nested-rows', setup: 'row-header', at: [0, -1], press: 'Enter', expect: 'collapses' } },
  { section: 'Row parent-child keyboard shortcuts', keys: 'Ctrl+→',
    probe: { page: 'nested-rows', setup: 'row-header', at: [0, -1], prepare: ['Enter'], press: 'ControlOrMeta+ArrowRight', expect: 'collapses' } },
  { section: 'Row parent-child keyboard shortcuts', keys: 'Ctrl+←',
    probe: { page: 'nested-rows', setup: 'row-header', at: [0, -1], press: 'ControlOrMeta+ArrowLeft', expect: 'collapses' } },
  { section: 'Rows sorting keyboard shortcuts', keys: 'Enter', probe: { setup: 'column-header', at: [-1, 2], press: 'Enter', expect: 'sorts' } },
  { section: 'Rows sorting keyboard shortcuts', keys: 'Shift+Enter',
    probe: { setup: 'column-header', at: [-1, 3], prepare: [{ api: 'sortFirstColumn' }], press: 'Shift+Enter', expect: 'sorts' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Shift+Alt+↓', probe: { setup: 'cell', at: [5, 5], press: 'Shift+Alt+ArrowDown', expect: 'menu-opens' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Ctrl+Enter', probe: { setup: 'column-header', at: [-1, 2], press: 'ControlOrMeta+Enter', expect: 'menu-opens' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Arrow keys',
    probe: { setup: 'dropdown-menu', at: [5, 5], prepare: ['ArrowDown'], press: ['ArrowDown', 'ArrowUp'], expect: 'menu-moves' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Ctrl+↑ or Home',
    probe: { setup: 'dropdown-menu', at: [5, 5], prepare: ['ArrowDown', 'ArrowDown', 'ArrowDown'], press: ['ControlOrMeta+ArrowUp', 'Home'], expect: 'menu-moves' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Ctrl+↓ or End',
    probe: { setup: 'dropdown-menu', at: [5, 5], prepare: ['ArrowDown'], press: ['ControlOrMeta+ArrowDown', 'End'], expect: 'menu-moves' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Page Up',
    probe: { setup: 'dropdown-menu', at: [5, 5], prepare: ['ArrowDown', 'ArrowDown', 'ArrowDown'], press: 'PageUp', expect: 'menu-moves' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Page Down', probe: { setup: 'dropdown-menu', at: [5, 5], prepare: ['ArrowDown'], press: 'PageDown', expect: 'menu-moves' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Escape', probe: { setup: 'dropdown-menu', at: [5, 5], press: 'Escape', expect: 'menu-closes' } },
  { section: 'Column menu keyboard shortcuts', keys: 'Enter or Space',
    probe: { setup: 'dropdown-menu', at: [5, 5], prepare: ['ArrowDown'], press: ['Enter', 'Space'], expect: ['menu-closes', 'menu-opens', 'value-changes'] } },
  { section: 'Column filter keyboard shortcuts', keys: 'Alt+A', probe: { setup: 'cell', at: [5, 5], prepare: [{ api: 'filter' }], press: 'Alt+a', expect: 'filters' } },
  { section: 'Column filter keyboard shortcuts', keys: 'Tab', probe: { setup: 'dropdown-menu', at: [5, 5], press: 'Tab', expect: 'focus-moves' } },
  { section: 'Column filter keyboard shortcuts', keys: 'Shift+Tab', probe: { setup: 'dropdown-menu', at: [5, 5], press: 'Shift+Tab', expect: 'focus-moves' } },
  { section: 'Column filter keyboard shortcuts', keys: '↑ / ↓',
    probe: { setup: 'dropdown-menu', at: [5, 5], prepare: [{ focus: '.htUIMultipleSelectSearch input' }, 'ArrowDown'], press: ['ArrowDown', 'ArrowUp'], expect: 'any' } },
  { section: 'Column filter keyboard shortcuts', keys: 'Enter / Space',
    probe: { setup: 'dropdown-menu', at: [5, 5], prepare: [{ focus: '.htUISelectionControls .htUIClearAll a' }], press: ['Enter', 'Space'], expect: 'any' } },
  { section: 'Comments keyboard shortcuts', keys: 'Ctrl+Alt+M', probe: { setup: 'cell', at: [5, 5], press: 'Control+Alt+m', expect: 'comment-opens' } },
  { section: 'Comments keyboard shortcuts', keys: 'Ctrl+Enter',
    probe: { setup: 'comment', at: [5, 5], prepare: [{ type: 'Checked' }], press: 'ControlOrMeta+Enter', expect: 'comment-closes' } },
  { section: 'Comments keyboard shortcuts', keys: 'Escape', probe: { setup: 'comment', at: [5, 5], press: 'Escape', expect: 'comment-closes' } },
  { section: 'Comments keyboard shortcuts', keys: 'Tab', probe: { setup: 'comment', at: [5, 5], press: 'Tab', expect: 'comment-closes' } },
  { section: 'Comments keyboard shortcuts', keys: 'Shift+Tab', probe: { setup: 'comment', at: [5, 5], press: 'Shift+Tab', expect: 'comment-closes' } },
  // Row 2 of the row-selection fixture holds a read-only checkbox on purpose, so the probes use rows 3 and 4.
  { section: 'Row selection keyboard shortcuts', keys: 'Space', ordinal: 1,
    probe: { page: 'row-selection', setup: 'cell', at: [3, 0], press: 'Space', expect: ['value-changes', 'row-selection-changes'] } },
  { section: 'Row selection keyboard shortcuts', keys: 'Space', ordinal: 2,
    probe: { page: 'row-selection', setup: 'cell', at: [4, 1], press: 'Space', expect: ['value-changes', 'row-selection-changes'] } },
  { section: 'Row selection keyboard shortcuts', keys: 'Space', ordinal: 3,
    probe: { page: 'row-selection', setup: 'column-header', at: [-1, 1], press: 'Space', expect: ['value-changes', 'row-selection-changes'] } },
  { section: 'Column header checkbox keyboard shortcuts', keys: 'Space',
    probe: { page: 'checkbox', setup: 'column-header', at: [-1, 1], press: 'Space', expect: 'value-changes' } },
  { section: 'Formulas keyboard shortcuts', keys: 'Ctrl+`',
    notProbed: 'Needs HyperFormula, which the plain UMD bundle the walker runs loads only on a formulas fixture; e2e/formulas-show-formulas.spec.ts presses it' },
  // Formula builder: the formula editor on the formula-builder page (A1:C5, formulas in column C, the
  // formula bar on). The probes that edit open the editor with Enter (full edit mode), so a key the formula
  // editor misses only moves the caret, which the snapshot does not read; its caret is not read either (the
  // editor has no TEXTAREA of the grid's own), so its keys show as text, a focus move, or a commit's
  // selection move. F2 or Ctrl+E only switches point mode, so its `then` presses the arrow that shows it: in
  // C2 the caret sits after a reference, where an arrow without point mode only moves the caret.
  { section: 'Formula builder keyboard shortcuts', keys: 'Enter', ordinal: 1,
    probe: { page: 'formula-builder', setup: 'editor', at: [0, 2], press: 'Enter', expect: 'selection-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Shift+Enter',
    probe: { page: 'formula-builder', setup: 'editor', at: [1, 2], press: 'Shift+Enter', expect: 'selection-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Tab', probe: { page: 'formula-builder', setup: 'editor', at: [0, 1], press: 'Tab', expect: 'selection-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Shift+Tab', ordinal: 1,
    probe: { page: 'formula-builder', setup: 'editor', at: [0, 2], press: 'Shift+Tab', expect: 'selection-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Ctrl+Enter',
    probe: { page: 'formula-builder', setup: 'range', at: [3, 0], to: [4, 1], prepare: [{ type: '7' }], press: 'ControlOrMeta+Enter', expect: 'value-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Alt+Enter', probe: { page: 'formula-builder', setup: 'editor', at: [0, 2], press: 'Alt+Enter', expect: 'text-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Escape', ordinal: 1,
    probe: { page: 'formula-builder', setup: 'editor', at: [0, 2], prepare: [{ type: '*10' }], press: 'Escape', expect: 'editor-closes' } },
  { section: 'Formula builder keyboard shortcuts', keys: '↑ / ↓',
    probe: { page: 'formula-builder', setup: 'editor', at: [3, 1], prepare: [{ type: '=SU' }, 'ArrowDown'], press: ['ArrowDown', 'ArrowUp'], expect: 'focus-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Arrow keys',
    probe: { page: 'formula-builder', setup: 'editor', at: [3, 1], prepare: [{ type: '=' }], press: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], expect: 'text-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Shift+Arrow keys',
    probe: { page: 'formula-builder', setup: 'editor', at: [3, 1], prepare: [{ type: '=' }, 'ArrowUp'], press: ['Shift+ArrowUp', 'Shift+ArrowDown', 'Shift+ArrowLeft', 'Shift+ArrowRight'], expect: 'text-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Ctrl+Arrow keys',
    probe: { page: 'formula-builder', setup: 'editor', at: [3, 0], prepare: [{ type: '=' }, 'ArrowUp'], press: 'ControlOrMeta+ArrowUp', expect: 'text-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Ctrl+Shift+Arrow keys',
    probe: { page: 'formula-builder', setup: 'editor', at: [3, 1], prepare: [{ type: '=' }, 'ArrowUp'], press: 'ControlOrMeta+Shift+ArrowUp', expect: 'text-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'F2 or Ctrl+E',
    probe: { page: 'formula-builder', setup: 'editor', at: [1, 2], press: ['F2', 'ControlOrMeta+e'], then: ['ArrowUp'], expect: 'text-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'F4', probe: { page: 'formula-builder', setup: 'editor', at: [0, 2], press: 'F4', expect: 'text-changes' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'F6 / Shift+F6',
    probe: { page: 'formula-builder', setup: 'editor', at: [0, 2], press: ['F6', 'Shift+F6', { key: 'F6', prepare: ['F6'] }], expect: 'focus-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Shift+Tab', ordinal: 2,
    probe: { page: 'formula-builder', setup: 'cell', at: [0, 0], press: ['Shift+Tab', { key: 'Shift+Tab', prepare: ['Shift+Tab'] }], expect: 'focus-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Enter', ordinal: 2,
    probe: { page: 'formula-builder', setup: 'cell', at: [0, 0], prepare: ['Shift+Tab', 'Shift+Tab', 'ControlOrMeta+a', { type: 'C3' }], press: 'Enter', expect: 'selection-moves' } },
  { section: 'Formula builder keyboard shortcuts', keys: 'Escape', ordinal: 2,
    probe: { page: 'formula-builder', setup: 'cell', at: [0, 0], prepare: ['Shift+Tab', 'Shift+Tab', 'ControlOrMeta+a', { type: 'C3' }], press: 'Escape', expect: 'text-changes' } },
  { section: 'Freeze bar keyboard shortcuts', keys: 'F6', probe: { page: 'freeze-bar', setup: 'cell', at: [5, 5], press: 'F6', expect: 'focus-moves' } },
  { section: 'Freeze bar keyboard shortcuts', keys: 'Shift+F6', probe: { page: 'freeze-bar', setup: 'cell', at: [5, 5], press: 'Shift+F6', expect: 'focus-moves' } },
  // F6 focuses the start (column) bar first, which takes the horizontal arrows; one more F6 reaches the top (row) bar.
  { section: 'Freeze bar keyboard shortcuts', keys: '→ / ↓',
    probe: { page: 'freeze-bar', setup: 'freeze-bar', at: [5, 5], press: ['ArrowRight', { key: 'ArrowDown', prepare: ['F6'] }], expect: 'freezes' } },
  { section: 'Freeze bar keyboard shortcuts', keys: '← / ↑',
    probe: { page: 'freeze-bar', setup: 'freeze-bar', at: [5, 5], press: ['ArrowLeft', { key: 'ArrowUp', prepare: ['F6'] }], expect: 'freezes' } },
  { section: 'Freeze bar keyboard shortcuts', keys: 'Home', probe: { page: 'freeze-bar', setup: 'freeze-bar', at: [5, 5], press: 'Home', expect: 'freezes' } },
  { section: 'Freeze bar keyboard shortcuts', keys: 'End', probe: { page: 'freeze-bar', setup: 'freeze-bar', at: [5, 5], press: 'End', expect: 'freezes' } },
  { section: 'Freeze bar keyboard shortcuts', keys: 'Escape', probe: { page: 'freeze-bar', setup: 'freeze-bar', at: [5, 5], press: 'Escape', expect: 'focus-moves' } },
];
