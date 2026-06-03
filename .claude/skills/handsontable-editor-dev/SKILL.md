---
name: handsontable-editor-dev
path: handsontable/src/editors/**
description: Use when creating or modifying a Handsontable cell editor - covers the editor lifecycle state machine (VIRGIN/EDITING/WAITING/FINISHED), DOM management, focus handling, positioning with getEditedCellRect, and validation integration
---

# Handsontable Editor Development

## Editor state machine

Editors are stateful objects cycling through four states: **VIRGIN** (just created, never opened), **EDITING** (visible and accepting input), **WAITING** (editing finished, awaiting async validation), and **FINISHED** (validation complete, editor closed). Never skip states or transition backwards except through a full reset.

## File structure

```
src/editors/{editorName}/
  {editorName}.ts    # Main class extending BaseEditor
  index.ts           # Re-exports
```

Registry: `src/editors/registry.ts`. Factory: `src/editors/factory.ts`.

## Lifecycle methods (required overrides)

| Method | Purpose |
|--------|---------|
| `init()` | Create DOM elements, set up event listeners. |
| `prepare()` | Called before editing starts. Receives row, col, prop, TD, cellProperties. |
| `getValue()` | Return the current editor value. |
| `setValue(newValue)` | Set the editor value (called before `open`). |
| `open()` | Show the editor, position it, capture focus. |
| `close()` | Hide the editor, release focus. |
| `focus()` | Set focus to the editor's input element. |
| `beginEditing()` | Start the editing process (calls prepare, setValue, open). |
| `finishEditing()` | End editing, trigger validation, close if valid. |

## Positioning

Always use `getEditedCellRect()` for viewport-, scroll-, and overlay-aware positioning. Never calculate position manually - it will break with frozen rows/columns and scrolled viewports.

## Key patterns

- All editors extend `BaseEditor` from `src/editors/baseEditor/baseEditor.ts`.
- Support both **full edit mode** (Enter key opens editor, all keys go to the editor) and **fast edit mode** (typing a character immediately opens the editor with that character).
- `finishEditing()` supports async validation - the editor enters WAITING state until the validator resolves.
- Use `this.hot.rootDocument` instead of `document` for DOM creation (required for iframe support).
- Use `EventManager` for event handling so listeners are cleaned up automatically.

## Reference implementations

- `src/editors/textEditor/textEditor.ts` - Standard text editing with a textarea.
- `src/editors/selectEditor/selectEditor.ts` - Dropdown selection pattern.
- `src/editors/baseEditor/baseEditor.ts` - Base class defining all lifecycle methods and state transitions.

## IME (Input Method Editor) gotcha

For CJK languages, `compositionstart`/`compositionend` events have timing issues that affect when to read the editor value. Do not read or commit the value between `compositionstart` and `compositionend` - the composition is still in progress and the value is intermediate. The BaseEditor handles this, but custom editors that override key event handling must respect composition state.

## Common mistakes

- Forgetting to clean up DOM elements and event listeners in `close()`.
- Not handling focus correctly, which breaks keyboard navigation after closing the editor.
- Positioning without `getEditedCellRect()`, which breaks with overlays, scroll, and frozen rows/columns.
- Not supporting both LTR and RTL layouts - always use logical CSS properties or check `this.hot.isRtl()`.
- Using `document` directly instead of `this.hot.rootDocument`.
- Not calling `super` methods in lifecycle overrides (`super.init()`, `super.close()`, etc.).
