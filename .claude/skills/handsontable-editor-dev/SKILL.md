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

## Dropdown lists are positioned `fixed` (#8688)

The list of the `handsontable`, `autocomplete`, `dropdown`, and `multiselect` editors stays a child of the grid root in the DOM (focus, ARIA, and outside-click detection are untouched) but is positioned `position: fixed`, so the grid root's `overflow: clip` (any sized `height`) and a scrolling ancestor cannot cut it. Thirteen things follow:

- **A `fixed` box is NOT always laid out in the viewport, and the host page decides.** Any ancestor with a `transform`, `translate`, `rotate`, `scale`, `perspective`, `filter`, `backdrop-filter`, a `will-change` naming one of those or `contain`, or `contain: paint|layout|strict|content` becomes the containing block, and `top`/`left` then resolve against ITS padding box. **A `container-type` does NOT, and an earlier version of this note said it did.** It once implied layout containment, and the CSS working group dropped that: measured with positive controls in Chromium 148 and 151, Firefox 153 and WebKit 26.5, no value of it (`size`, `inline-size`, `scroll-state`) anchors a fixed descendant - only `container-type` together with an explicit `contain: layout` does, and then it is the `contain` doing it. Checking `container-type` put the list 208px off its cell inside a container-query wrapper, the everyday layout of a component-based page. So before adding any property to that list, measure it in all three engines with a control that DOES anchor (`transform: translateX(0)`) beside it, or a "does not anchor" reading proves nothing about the probe. A grid in a centred modal (`transform: translate(-50%, -50%)`) is the everyday case: positioning from raw `getBoundingClientRect()` values drifted the list 313px down and 384px right of its cell, with 1 of 8 options reachable - worse than the bug being fixed. Handsontable's own DOM sets none of those properties, so auditing the grid's markup proves nothing; the host page is what matters. Every coordinate therefore goes through `getFixedContainingBlockRect()` (`helpers/dom/element.ts`), which returns that box in viewport coordinates and falls back to the viewport, so callers subtract its origin unconditionally. The same box is the bound for the flip decision and the clamp.
- **Escaping the clip does not guarantee painting above neighbouring page content.** A `fixed` box still paints inside its ancestor stacking context, and `.ht-root-wrapper.ht-shadow-dom` carries `isolation: isolate` (`styles/base/_base.scss`) precisely so an embedded grid stays below its host's chrome. The list's `z-index: 200` is confined inside that, so under `ht-shadow-dom` - or any host that puts the grid in its own `z-index` layer - the list hangs outside the grid's box but still paints under the host's chrome.

- **The VERTICAL axis measures against the window; the HORIZONTAL one still measures against the grid's workspace.** #8688 is a vertical defect, so only `flipDropdownVerticallyIfNeeded()` and `MultiSelectEditor#getAvailableSpace()` moved to `cell.getBoundingClientRect()` + `rootWindow.innerHeight`. `flipDropdownHorizontallyIfNeeded()` deliberately kept `getWorkspaceWidth()`: a list kept inside the grid's width is inside the viewport too, so widening it would only let the list hang off the grid's side for no gain - and it broke 8 legacy specs that pin the sideways placement. Do not "finish the job" by making both axes viewport-based.
- **Resolve the coordinates against the editor HOLDER's rect (`TEXTAREA_PARENT`), not the cell's.** `TextEditor#refreshDimensions()` has already placed the holder at exactly the offset the old `absolute` rules resolved against, border compensation included. That compensation is CONDITIONAL - `BaseEditor#getEditedCellRect()` cancels a 1px shift for a cell that draws its own inline-start border, which depends on row headers and on which columns are rendered - so a hardcoded `cell.left - 1` lands the list a pixel off on some columns and not others. Reading the holder keeps the geometry byte-identical to the old rules and changes only the coordinate space.
- **Write the same physical property the old rules wrote: `left` under LTR, `right` under RTL, and clear the other.** Mirroring RTL into a `left` value has to assume the holder is exactly as wide as the cell, which put the flipped list 2px off its edge. And the two properties carry OPPOSITE signs: `right: offset` against the holder moved the list's right edge `offset` px to the LEFT of the holder's, so the viewport distance is `viewportWidth - holder.right + offset`, while `left` is `holder.left + offset`. Getting that sign wrong moves the flipped RTL list by twice the overhang, in the wrong direction.
- **`HandsontableEditor#htContainer` IS the sub-grid's `rootElement`.** A non-root instance uses the element it was given as its root (`core.ts`), so `htContainer`, `htEditor.rootElement`, and the element `applyRootSize()` writes `height`/`overflow` on are one and the same. A style written on one is overwritten by the next writer of the other - the flip methods are the last writer of `position`/`top`/`left`.
- **A document `scroll` listener that follows the cell must be guarded with `hot.isDestroyed`**, because `getEditedCell()` throws on a destroyed instance. Note what the guard does and does not cover: `instance.isDestroyed = true` is the LAST assignment in `Core#destroy()` (`core.ts`), after `runHooks('afterDestroy')` (which is what releases the editor's event manager) and after the `objectEach` sweep that sets the flag to `null` on its way past. So the flag reads falsy for the whole teardown, and the guard cannot protect a mid-teardown delivery - what it protects is delivery AFTER `destroy()` returns, which is reachable two ways: `scroll` is dispatched asynchronously, so one fired just before the teardown can run after it, and an editor whose own `destroy()` does not release its event manager keeps the listener attached for good. The second is what actually threw in the legacy suites, on `MultiSelectEditor`. Do not write the guard's rationale as "the teardown's scroll arrives before the listener is released" - that sequence does not happen.
- **Every scroll that moves the cell must RE-CLAMP the list, not only move it, and the re-clamp must keep the list's own scroll.** `MultiSelectEditor#followCell()` serves the grid's `afterScroll*` hooks and the page-scroll listener alike, and runs `updateDimensions()` before `refreshDimensions()`: a list moved without a re-clamp keeps its opening height and hangs past the containing block's edge (0 of 8 options reachable once a grid scroll carried the cell to the viewport's bottom). `updateDimensions()` ends with `scrollTop = 0`, and a wheel past the list's last entry spills into the grid or the page, so read `scrollTop` before it and write it back after, or the list jumps to its top under the pointer. A re-clamp must measure the height the list WANTS, never the height it has: `getDropdownHeight()` is the sub-grid's current table height, so `AutocompleteEditor#limitDropdownIfNeeded()` compares `getTargetEditorHeight()` (computed from the choices and `visibleRows`) instead - reading the current height let one trim freeze the list at its edge size, unable to grow when the cell gained room or to shrink when it lost more. The restore is gated on the current height being smaller, so an untrimmed list pays no `updateSettings()` per scroll event. The sub-grid keeps its own holder scroll across that `updateSettings()` (measured on `main` and `horizon`, including a call that changed the height), so only the multiselect's list needs its scroll restored by hand. The re-clamp must also decide the vertical flip BOTH ways: `DropdownController#updateDimensions()` used to only ever set `flippedVertically`, which was harmless while it ran once per open (`prepare()` resets it), but under a scroll follow it kept a list flipped above a cell scrolled back to the top - off the screen. Only `noFlip` (the filter path) keeps the flip as it is. And guard `getEditedCell()`: the capture-phase page-scroll listener runs BEFORE the grid redraws, so the scroll that unrenders the row still finds its cell and every later one does not - a follow that measures unconditionally throws on each of them.
- **Clamping the list's TOP is not enough - a `fixed` list must cap its HEIGHT to the free space too, and the plain `handsontable` type is the one with no trim of its own.** `AutocompleteEditor` (and so `dropdown`) trims to whole rows, and `MultiSelectEditor` clamps its entry count, but the base `HandsontableEditor` opened at whatever height its sub-grid asked for and only clamped `top`. That is invisible under `absolute` - the overhang added to the PAGE's scroll height, so the user scrolled down and reached it - and becomes unreachable under `fixed`: a fixed box contributes nothing to page overflow, and the sub-grid's holder only scrolls WITHIN the height the list was given. Measured with `elementFromPoint` over a full holder sweep: 19 of 20 options on `main` and `horizon`, 18 of 20 on `classic`, against 20 of 20 on the `absolute` rules. Cap to the free space on the side the flip chose, NOT to the whole containing block - capping to the block pins the list at the block's top edge and covers the edited cell. Keep a one-row floor (#8872). Two traps in the cap itself: `getTargetDropdownHeight()` measures the RENDERED sub-grid, so once capped it returns the capped value and the wanted height can never be re-derived - store it at `open()` (a cap does NOT survive into the next open, measured, so per-open is enough). And gate the write on the height you WROTE, never on `getDropdownHeight()`: that reads `offsetHeight`, which comes back a pixel or two off the setting, so such a gate never matches and every scroll pays a sub-grid render. **The gate belongs on EVERY writer of that height, and it is shared state** - `appliedDropdownHeight` is `protected` rather than `#private` because `AutocompleteEditor#setDropdownHeight()` is a second writer, and gating only the base left a trimmed `dropdown` list re-writing the identical height TWICE per scroll event (measured: 20 writes of `203` across 10 scrolls, down to 1 with the gate). `updateDropdownDimensions()` is a third writer and must record the value it wrote, or the next trim to that same number is skipped as a false match. Note the sibling gate on the RESTORE path reads `getDropdownHeight()` and is fine as it stands - measured 0 writes per scroll on an untrimmed list, on both cell types - because there it is compared against the wanted height rather than against a height just written. The residual pixel or two is absorbed by the existing `maxTop` clamp, which lands the list's bottom exactly on the block's edge.
- **Adding the FIRST `eventManager` listener to an editor may mean its `destroy()` never released it.** `MultiSelectEditor` constructed an `EventManager` and never used it, so its `destroy()` (unlike `TextEditor`'s) had no `this.eventManager.destroy()` call - harmless until the scroll follow above became its first listener, at which point the listener outlived every grid and `MemoryLeakTest` counted 88 of them. Before registering a DOM listener on an editor, check that its own `destroy()` tears the manager down.
- **Any spec that asserts WHICH SIDE the list opens on must be run on all three themes.** Each theme's row height sets the list's height, so the same grid flips on `horizon` and does not on `main`. A spec that pins a side passes locally (the legacy runner defaults to `main`, and the Playwright local gate is pinned to `e2e-main`) and fails in CI on one theme only, with a message about coordinates that says nothing about the cause. Assert ADJACENCY instead - the list touches the cell on one side or the other - and leave "which side, and does it escape the grid" to a spec whose grid is shaped to force it on every theme. The legacy suite takes `--theme=horizon`; Playwright takes `--project=e2e-horizon`. This shipped a red `E2E / UMD (theme: horizon)` on #13417 while `main` and `classic` were green.
- **Get a baseline before believing a legacy failure is a stale expectation.** Restoring the two editor sources from `HEAD` and re-running gave `328 specs, 0 failures`, which proved all 11 failures were mine rather than pre-existing - and 6 of them turned out to be real coordinate bugs, not expectations needing an update. Only 5 were genuinely stale (the vertical-flip specs, which encode "the list must stay inside the grid" - exactly what #8688 says is wrong).
- **A test helper that walks clipping ancestors must stop at a `fixed` element** and clamp to the viewport from there (`tests/fixtures/pages/DropdownHeightPage.ts#visibleHeightOfOption`), or it intersects the option with the grid root and calls a readable option clipped. Count reachable options with `document.elementFromPoint()`, never by counting rendered cells: under a clip a cell exists and has a size while nothing on screen can reach it.
