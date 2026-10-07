# Search plugin — finding values and marking the matches

The `search` plugin runs a query over the data and marks matching cells. Read this before touching
`search.ts` — it is one file, ~360 lines.

It **finds and marks; it does not filter, hide or scroll**. Everything the plugin does is: set
`isSearchResult` on matching cell meta, and add a class in `beforeRenderer`.

## Three replaceable pieces

| Option | Default | Job |
|---|---|---|
| `callback` | `DEFAULT_CALLBACK` | what happens to a cell once tested |
| `queryMethod` | `DEFAULT_QUERY_METHOD` | whether a query matches a value |
| `searchResultClass` | `'htSearchResult'` | the class added to a match |

All three are also readable **per cell** — `query()` prefers `cellSearch.callback` / `cellSearch.queryMethod`
from the cell's own meta over the plugin-level ones. So a `search` entry in `cells` / `columns` overrides
the global setting; keep that precedence when adding an option.

There are setters (`setCallback`, `setQueryMethod`, `setSearchResultClass`) as well as the settings, and both
paths must stay equivalent.

## `isSearchResult` and the viewport meta eviction

This is the subtle part of the plugin. `DEFAULT_CALLBACK` writes `isSearchResult` **directly on the meta
object, not through `setMeta`**, so on its own it would be dropped when the cell is evicted from the viewport
— the highlight would be lost after scrolling away and back.

The fix is `_persistedMetaProps`:

- **On a match**, `'isSearchResult'` is added to the cell's `_persistedMetaProps` set, so the viewport meta
  eviction keeps the cell. It then also **shifts with the data** on row/column insert and remove, exactly
  like the meta object itself.
- **On a non-match**, it is *deleted* from the set, so the cell stays evictable. Forgetting this leaks
  retained meta across queries.
- **It is intentionally not recorded as user-defined**, so an `updateSettings` cache reset clears it and the
  next `query()` re-applies it.

The set is created lazily — only matched cells pay for it.

## `queryMethod` is locale-aware, and must stay so

`DEFAULT_QUERY_METHOD` reads `cellProperties.locale` and compares through `localeLowerCase(value, locale)`.
**Never call `String.prototype.toLocaleLowerCase` directly** — it is banned by `no-restricted-syntax`, an
explicit locale argument forces the ICU path (~45× slower) and throws on an invalid tag. The helper detects
the three languages that actually tailor lowercasing (Turkish, Azeri, Lithuanian) and otherwise uses the fast
`toLowerCase()`.

It guards `!query.toLocaleLowerCase` before using the query, which is how a non-string query returns `false`
instead of throwing.

## `beforeRenderer` and the `className` union

The hook normalizes `cellProperties.className`, which is publicly `string | string[]`, through the shared
`normalizeClassNames()` helper (`helpers/dom/element`) — the same one `#removeResultClassFromStoredMeta()`
uses, so both paths in this file agree on what counts as a class. It stores the normalized form back as a
**string**, which is the shape the rest of the codebase expects — `numericRenderer`, `../hiddenColumns/` and
`../hiddenRows/` all do the same. `../hiddenColumns/AGENTS.md` documents the full rule and its three shipped
failure modes.

The write at the end of the hook is **unconditional**, so every rendered cell gets an own string `className`
even when nothing changed. On a grid-level or column-level array that stops the value cascading, and a value
set through `setCellMeta` is replaced permanently via the `_userDefinedMetaProps` replay. Pre-existing, and
tracked with the rest of the family in DEV-2803 — do not copy this hook as the reference for that part.

There is a standing `// TODO: #4972` on this handler.

## Where to look next

- `className` normalization and `afterGetCellMeta` hygiene, in full: `../hiddenColumns/AGENTS.md` and the
  core-package `../../../AGENTS.md`.
- Cell meta eviction and `_persistedMetaProps`: `../../dataMap/metaManager/AGENTS.md`.
- The other plugin that writes declarative meta for styling: `../columnSummary/AGENTS.md`.
- Filtering rows rather than marking them: `../filters/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='search'`

A change to the eviction interaction needs a spec that **scrolls away and back**, not just one that queries.

## Every `query()` invalidates every cell

The result class is applied inside `beforeRenderer`, from the plugin's own state, with no cell meta write. Under `renderMode: 'onChange'` a cell whose value did not change would keep the previous query's class, so `query()` ends with `hot.markAllCellsChanged()`, and so does `disablePlugin()`. Disabling strips the class from the `className` of every STORED cell meta (`#removeResultClassFromStoredMeta`), not through a render: a render reaches only the rendered band, and a match painted while highlighted and then scrolled away keeps the class in its meta until it scrolls back (the one-shot `beforeRenderer` that used to do the stripping had exactly that hole, and read `isEnabled()` - the `search` setting, still `true` after a direct `disablePlugin()` - so on that path it re-added the class instead). `isSearchResult` is deliberately left in place: `updatePlugin()` is disable + enable, and the results survive an `updateSettings({ search })` as they always did. `#onBeforeRenderer` decides by `this.enabled`, the runtime state, never by the setting. Do not "optimize" either to the matched cells only: the cells that *stopped* matching need the repaint too.
