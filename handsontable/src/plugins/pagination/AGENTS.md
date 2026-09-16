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

## `PLUGIN_PRIORITY = 900`, and the `init` hook is pinned early

Priority 900 puts it after every ordinary plugin. Separately, **the `init` hook callback is placed before
the others**, so the pagination state is computed and applied to the index mapper *before* AutoColumnSize
starts calculating column sizes. Those are two different mechanisms — see the priority-versus-hook-order
note in `../base/AGENTS.md`.

## The layout manager owns the pager's placement, unless `uiContainer` is set

- **Default**: the UI registers its container with `hot.getLayoutManager()` and the manager appends it into
  the **bottom slot**. **The element stays detached until then** — do not `appendChild` it yourself.
- **With a custom `uiContainer`**: the UI installs itself there and the slot registration is skipped.
- **`#onBeforeHeightChange`'s `calc(height - bar)` is only for an explicit pixel `height`.** Every other
  layout (scrollable ancestor, CSS-sized container) is sized by core: the engine reserves the slots'
  height inside the axis owner (`layoutReservedHeight`) and the wrapper follows its content when the
  window scrolls the rows. Do not add a second reservation here – with an explicit `height` the root
  element is the axis owner and reserves 0, so the two never stack (DEV-2848).

The manager exists only on the root instance. `isEnabled()` is already gated on `isRootInstance`, so by
the time `enablePlugin()` reaches that guard **the `isRootInstance` half is always true and its else-branch
is unreachable**; it stays as a statement of the requirement, **not** as support for a nested grid. (The
source comment at `pagination.ts:262` says "always false in practice", meaning the non-root *case* never
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

It also reacts to `afterSetTheme` (a theme changes row heights, and `useTheme()` does not go through
`updateSettings`), `afterLanguageChange` (the pager's labels), `beforeHeightChange` and
`afterDataProviderFetch`.

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
