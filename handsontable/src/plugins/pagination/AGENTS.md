# Pagination plugin — showing one page of rows at a time

The `pagination` plugin limits the grid to one page of rows and renders a pager below it. Read this before
touching `pagination.ts`, `ui.ts` or anything in `strategies/`.

**This plugin is the lifecycle gold standard** — the core-package `../../../AGENTS.md` names
`pagination.ts` as the file to copy when writing a new plugin. Keep it that way: if you shortcut the
lifecycle here, you teach every future plugin the shortcut.

## Pagination HIDES rows; it does not trim them

```js
this.#pagedRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginName, 'hiding', false);
```

A `'hiding'` map affects the **renderable** tier, so paginated-away rows keep their visual indexes and
`countRows()` does not shrink. Filters, by contrast, registers a *trimming* map and affects the visual tier.
(The DeepWiki page groups filtering with hiding and pagination; it is wrong. See
`../../../.ai/INDEX-MAPPING.md`.)

## Hard conflicts, declared at module scope in this file

```js
registerConflict('pagination', ['nestedRows', 'mergeCells', 'fixedRowsTop', 'fixedRowsBottom']);
```

While any of those top-level settings is truthy, **this plugin stays disabled** and warns to the console.
Note `fixedRowsTop` / `fixedRowsBottom` are plain options no plugin owns — a hard conflict is against a
*setting*, not a plugin. The mechanism is in `../base/AGENTS.md`.

## `initialPage` is applied on first enable and when its value changes (DEV-1140)

`enablePlugin()` used to copy `initialPage` onto `#currentPage` whenever the raw
settings object declared the key. `updatePlugin()` is always
`disablePlugin(); enablePlugin()`, and the React wrapper re-sends the full
`pagination` object on every render, so next/prev snapped back to `initialPage`.
`#appliedInitialPage` records the last applied declared value; the same number
on a later enable is a no-op. `updatePlugin()` sets `#isUpdatingPlugin` around
its disable/enable cycle so the tracker survives that path. A real disable
(`pagination: false`) clears the tracker, and the next enable applies
`initialPage` again. An `updateSettings` payload whose `pagination` object omits
`initialPage` (or declares a non-number) also clears the tracker, so declaring
that same number later is applied again — from the settings side the value went
N, then absent, then N. Changing `initialPage` to a different number via
`updateSettings` still jumps, which `__tests__/options/initialPage.spec.js`
pins. To force the declared page after the user has navigated, call `setPage()`
or `resetPage()`.

Copy `#currentPage` from the raw `hot.getSettings().pagination.initialPage`, not
from `getSetting('initialPage')`. `onUpdateSettings` branch 2 (disabled →
enabled) calls `enablePlugin()` before `updatePluginSettings()`, so
`#pluginSettings` still holds the previous value. Stamping the tracker from the
new declared number while applying the stale `getSetting()` result would skip
the later `updatePlugin()` pass and leave the wrong page. The grid settings
object is already merged when `enablePlugin()` runs.

## `PLUGIN_PRIORITY = 900`, and the `init` hook is pinned early

Priority 900 puts it after every ordinary plugin. Separately, **the `init` hook callback is placed before
the others**, so the pagination state is computed and applied to the index mapper *before* AutoColumnSize
starts calculating column sizes. Those are two different mechanisms — see the priority-versus-hook-order
note in `../base/AGENTS.md`.

## The layout manager owns the pager's placement, unless `uiContainer` is set

- **Default**: the UI registers its container with `hot.getLayoutManager()` and the manager appends it into
  the **bottom slot**. **The element stays detached until then** — do not `appendChild` it yourself.
- **With a custom `uiContainer`**: the UI installs itself there and the slot registration is skipped.
- **This plugin no longer reserves its own height.** Its `beforeHeightChange` `calc(height - bar)` hook
  moved into core (`reserveEdgeSlotsHeight` in `core/rootSize.ts`), which subtracts EVERY bottom- and top-slot
  bar from a pixel `height` — the sheets bar and the license notification too, so both bars behave
  the same. Inside a scrollable ancestor or a CSS-sized container the engine reserves the slots'
  height instead (`layoutReservedHeight`). Do not add a reservation back here: it would stack on
  core's and shrink the grid twice (DEV-2848).

The manager exists only on the root instance. `isEnabled()` is already gated on `isRootInstance`, so by
the time `enablePlugin()` reaches that guard **the `isRootInstance` half is always true and its else-branch
is unreachable**; it stays as a statement of the requirement, **not** as support for a nested grid. (The
source comment at `pagination.ts:312` says "always false in practice", meaning the non-root *case* never
arises — read it that way, it is easy to take backwards.) A direct `enablePlugin()` call on a non-root
instance dies earlier, in the UI, which reads `rootGridElement`. The same guard is mirrored later in the
file with a comment pointing back — keep both, and keep the comments.

## Two page-size strategies

| `pageSize` | Strategy | Behavior |
|---|---|---|
| a number | `strategies/fixedPageSize.ts` | fixed count per page |
| `'auto'` | `strategies/autoPageSize.ts` | computes how many rows fit, **per page** |

`'auto'` **requires AutoRowSize** and warns when it is missing (`AUTO_PAGE_SIZE_WARNING`). The check appears
twice — at enable and on a page-size change — because either path can introduce `'auto'`.

Because the auto strategy computes a size *per page*, page boundaries are not uniform: never assume
`page * pageSize` arithmetic works. Go through the strategy.

## Selection hooks it must intercept

`beforeSelectAll`, `beforeSelectColumns`, `beforeSetRangeEnd`, `beforeSelectionHighlightSet`,
`beforePaste` — all so a selection or a paste cannot reach rows that are off-page. Adding a new
selection entry point means adding it here too.

**These hooks scope the *selection*, not the data.** They only reach a data method that routes
through the selection, and that coupling is a trap in both directions. `Core#clear()` used to call
`selectAll()` and then empty the selection, so `#onBeforeSelectAllRows` silently narrowed it to the
current page and `clear()` left every other page filled. It now empties the data set directly
(DEV-121), so it crosses page boundaries **on purpose** — do not "restore" the page scoping. The
rule to carry over: a method that changes *data* must not borrow the selection to decide its range,
because every selection constraint — this plugin's page window, and `selectionMode: 'single'`, which
collapses any range to the highlighted cell — then silently becomes a data constraint.

It also reacts to `afterSetTheme` (a theme changes row heights, and `useTheme()` does not go through
`updateSettings`), `afterLanguageChange` (the pager's labels) and `afterDataProviderFetch`.

## `beforePaste` keeps the clipboard prefix when it overflows the page

`#onBeforePaste` truncates `pastedData` to the remaining rows on the current page
(`pastedData.length = remainingRowCount`). **Do not `splice(0, n)`.** That removes the head
and keeps the last *n* rows, so a mid-page paste of a long clipboard writes the suffix
(DEV-1119 / private #2861). The unique-value case in `__tests__/plugins/copyPaste.spec.js`
is the regression pin; the older case used identical letters and could not catch it.

## Styling: the page-size select fill lives on the wrapper, not the select

In `../../styles/components/plugins/_pagination.scss`, the page-size control's background, border-radius
and hover/focus fills sit on `.ht-page-size-section__select-wrapper` (a `<div>`), and the inner `<select>`
is `background-color: transparent`. **Do not move the fill back onto the `<select>`.** A native `<select>`
clips its own `background-color` to a radius smaller than its `border-radius`, so its rounded corners stay
unfilled and the layer behind shows through (DEV-42); a `<div>` fills them correctly. The select fills the
wrapper exactly (asserted in `tests/e2e/pagination-select-background.spec.ts`), so the wrapper's `:hover` /
`:focus-within` stand in for the select's `:hover` / `:focus` — needed because `:has()` is banned in core
CSS. The select's `:disabled` background was dropped: it is safe only because `setPageSizeSectionVisibility`
in `ui.ts` sets `pageSizeSelect.disabled` *only* while it hides the section (`display: none`), so a disabled
select is never rendered. That coupling is pinned by `__tests__/ui.unit.js` — keep it.

## Where to look next

- The plugins it hard-conflicts with: `../nestedRows/AGENTS.md`, `../mergeCells/AGENTS.md`.
- The plugin `'auto'` depends on: `../autoRowSize/AGENTS.md`.
- Server-backed paging: `../dataProvider/AGENTS.md`.
- Trimming rather than hiding: `../trimRows/AGENTS.md`; tiers: `../../../.ai/INDEX-MAPPING.md`.
- Layout slots: `../../core/layout/`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='pagination'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='pagination'`

`__tests__/conflictingOptions.spec.js` pins the hard-conflict behavior, and `__tests__/strategies/`
covers the two page-size strategies. There are also `hooks/`, `methods/`, `options/`,
`keyboardShortcuts/`, `plugins/`, `selection.spec.js` and `ui.spec.js`.
