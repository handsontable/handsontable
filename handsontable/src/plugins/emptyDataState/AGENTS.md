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

`__tests__/` splits into `hooks/`, `methods/`, `options/`, `keyboardShortcuts/`, `plugins/` plus
`ui.unit.js`.
