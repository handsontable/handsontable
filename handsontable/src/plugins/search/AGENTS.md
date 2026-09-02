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

The hook normalizes `cellProperties.className`, which is publicly `string | string[]`. This plugin stores
the normalized form back as a **string**, which is the shape the rest of the codebase expects —
`numericRenderer`, `../hiddenColumns/` and `../hiddenRows/` all do the same, and their comments name this
plugin as the reference. `../hiddenColumns/AGENTS.md` documents the full rule and its three shipped failure
modes.

There is a standing `// TODO: #4972` on this handler.

## Where to look next

- `className` normalization and `afterGetCellMeta` hygiene, in full: `../hiddenColumns/AGENTS.md` and the
  root `../../../AGENTS.md`.
- Cell meta eviction and `_persistedMetaProps`: `../../dataMap/metaManager/AGENTS.md`.
- The other plugin that writes declarative meta for styling: `../columnSummary/AGENTS.md`.
- Filtering rows rather than marking them: `../filters/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='search'`

A change to the eviction interaction needs a spec that **scrolls away and back**, not just one that queries.
