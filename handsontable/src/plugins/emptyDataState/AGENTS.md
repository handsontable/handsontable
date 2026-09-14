# EmptyDataState plugin — the "no data" placeholder

The `emptyDataState` plugin shows a message in place of the grid body when there is nothing to display.
Read this before touching `emptyDataState.ts` or `ui.ts`.

## Root instances only

`isEnabled()` is `isRootInstance(this.hot) && !!getSettings()[PLUGIN_KEY]`, like `../dialog/`,
`../notification/` and `../loading/`.

## It installs into `ht-grid`, and into the Walkontable holder

Two placements, for two purposes:

- The message container goes into the **`ht-grid` container**, which it overlays. That is a fixed internal
  element, not a user-orderable layout slot — see `../../../AGENTS.md` for the distinction.
- A placeholder element is appended into `view._wt.wtTable.holder`, so it scrolls with the table.

Because `ht-grid` holds the grid *and* the empty-data state, the two are siblings, not nested.

## The `message` option accepts three shapes

`string` | `function` | a record. `SETTINGS_VALIDATORS` accepts all three plus `undefined`, and the plugin
normalizes: a bare string becomes the title, an absent value becomes the default message object. After that
normalization the value is a record, which is why the later code reads it as one — the union is narrowed by
the checks above it, not by a cast.

## Button types go through `helpers/uiButton.ts`

`isButtonType()` / `resolveButtonType()` are used at the render site **and** in `SETTINGS_VALIDATORS` — same
rule as `../dialog/AGENTS.md`, which spells out why duplicating `['primary', 'secondary']` inline caused a
drift between the two.

Titles go through `htmlToPlainText()` (`helpers/string.ts`) and are set as `text:` on a `TemplateSpec` in
`ui.ts` — DEV-2617 removed this plugin's HTML sinks. The helper is `stripTags()` plus character-reference
decoding, so the surface renders what it rendered when it still wrote through `innerHTML`, and it inherits
that limit (`'5 < 10 rows'` → `'5 '`). Acceptable for library-authored copy, never for a user's header or
cell value. `../dialog/` uses the same helper — keep the two together.

## The horizontal wheel handler exists because the body is replaced

With the placeholder overlaying the grid, the table's own scroll handling no longer receives the wheel, so
`#onMouseWheel` forwards horizontal deltas to `view.setTableScrollPosition()`.

Two details:

- **`wheelDeltaX` is non-standard** (Safari). It is the fallback when `event.deltaX` is `NaN`, and the sign
  is inverted (`-1 * wheelDeltaX`).
- **Only forward when the table actually has a horizontal scroll and is not window-scrollable**
  (`hasHorizontalScroll() && !isHorizontallyScrollableByWindow()`), then `preventDefault()`. Without those
  guards the page stops scrolling.

## It owns a shortcut context, and it INHERITS the grid's

`#show()` activates the plugin's focus scope, and the focus scope manager switches the shortcut manager to
`plugin:emptyDataState`. The manager runs the **active context only** — `handleEventWithScope()` in
`../../shortcuts/manager.ts` — and `runGlobalScopedShortcuts` is no escape hatch, because both this context
and `grid` are `table`-scoped. The plugin shipped with that context empty, so every grid shortcut was dead
for as long as the overlay was on screen. That is DEV-53: undo, redo and select all all died.

The scope therefore declares `fallbackShortcutsContextName: GRID_SCOPE`. The manager walks that chain when
it dispatches a key, so the overlay answers **everything the grid answers**, including shortcuts added to
the grid after this file was written. Listing keys here instead would rot silently — the first design did
exactly that, with two `forwardToContext` entries, and it was rejected for this reason.

Select all is the one shortcut this plugin still registers itself, and it is an **override**, not a gap:
the grid's own `Control/Meta+A` is guarded on `isDefined(getSelected())`, and the overlay starts with
nothing selected, so the inherited one is silently inert exactly when it is needed — with every column
hidden, where selecting the data is the only route back to a context menu.

Do **not** guard the override on `isVisible()`. The context being active is the guard; a second one only
adds another way for the shortcut to go dead.

**The safety half of this lives in `../../shortcuts/contexts/grid.ts`, not here.** Inheriting is only safe
because a grid shortcut that reads or writes cell CONTENT refuses while the grid renders nothing
(`hasRenderedCells()`). Without it, the `Ctrl`+`A` above hands the user a selection over hidden data and
`Delete` blanks the whole dataset — measured, 40 cells, on a grid whose columns were all hidden. If you add
a destructive shortcut to the grid context, guard it there; every inheriting overlay depends on it.

## `#hide()` must roll the shortcut context back itself

`deactivateScope()` (`../../focusManager/scopeManager.ts`) clears the active scope and **never** touches the
shortcut context — `setActiveContextName` is called on activation only. After that, nothing rolls it back
except a later focus or click event reaching `processScopes()`.

Undoing a full row removal from the context menu fires neither, so the grid came back full of data, looking
completely normal, with every shortcut dead until the user clicked a cell. `#hide()` therefore resets the
context to `grid` when no other scope took over, the same way `../comments/` does after hiding its editor.

Two explanations for why only that path broke were measured and are **both wrong**, so do not reach for
either when changing this: it is not which branch `#hide()` takes (the `updateData` path takes the
`importSelection` branch too and recovers), and it is not where focus lands (in the broken path
`document.activeElement` is a `TD` inside the grid and the context is still stuck).

## Selection on hide

`#show()` captures the current selection through `selection.exportSelection()`. `#hide()` restores it with
`selection.importSelection()` and re-renders, so the selection the user had comes back when data arrives.

Only when nothing was captured — no ranges — does it fall back to selecting `(0, 0)`, and there **scrolling
is suppressed**. That is deliberate: a scroll-into-view on an arriving dataset would jump the viewport.
Either way, `afterEmptyDataStateHide` fires last.

## Where to look next

- Sibling overlay surfaces and the shared button-type rule: `../dialog/AGENTS.md`,
  `../notification/AGENTS.md`, `../loading/AGENTS.md`.
- Where the message usually comes from on a server-backed grid: `../dataProvider/AGENTS.md`.
- Layout slots vs fixed internal elements: `../../core/layout/`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='emptyDataState'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='emptyDataState'`
- `npm --prefix tests run test:e2e -- e2e/empty-data-state-shortcuts.spec.ts`

`__tests__/` splits into `hooks/`, `methods/`, `options/`, `keyboardShortcuts/`, `plugins/` plus
`ui.unit.js`.

The shortcut behavior is pinned by the Playwright spec, not by `__tests__/keyboardShortcuts/`: it needs a
real context menu and real key events, and the legacy suite is frozen.
