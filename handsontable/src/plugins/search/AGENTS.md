# Search plugin — finding values and marking the matches

The `search` plugin runs a query over the data and marks matching cells. Read this before touching
`search.ts` — it is one file, ~500 lines.

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
  next `query()` re-applies it. A payload with `columns`, `cells` or `cell`, and a call that really changes the grid-level
  `type`, all reset the cache. The plugin keeps no last query, so it cannot re-apply the results itself: the guide
  tells the user to call `query()` again, and `__tests__/typeChangeReset.unit.js` pins it.

The set is created lazily — only matched cells pay for it. It is read as an **own** property only: an
inherited set belongs to the column or grid layer, and a `delete` through the prototype chain would edit it.

## `query()` stores meta for the matches only

One `query()` used to call `getCellMeta()` twice per cell (once in `query()`, once in the default callback),
which stored a meta object for every cell of the grid: +170 MB and about twice the time on 100k x 20, never
released, because a meta object far from the viewport is not evicted. Three rules keep it bounded:

- **`query()` reads meta through `getCellMetaTransient()`.** It resolves the same cascade, `cells()` and meta
  hooks, so per-cell `search` overrides and the `cellProperties` handed to `queryMethod` are unchanged, but a
  cell with no stored meta gets a temporary object. A `queryMethod` that writes to `cellProperties` loses the
  write there; the option's JSDoc says so.
- **`markSearchResult()` stores meta on a match only.** A non-match writes `false` to the meta it is given: a
  stored meta keeps the flag, a temporary one drops it. So a non-matching cell with no stored meta reads
  `isSearchResult` as `undefined`, not `false`, the same value a non-match reads after eviction; both are
  falsy, which is all the renderer and the documented recipe test. `__tests__/queryMetaRetention.unit.js`
  pins the exact values.
- **The default callback is matched by identity.** When a cell resolves to `DEFAULT_CALLBACK`, `query()` calls
  `markSearchResult()` with the meta it already read, so the cell is not read twice. `DEFAULT_CALLBACK` itself
  still works when a user callback wraps it (`getCallback()`), reading the meta again through the same
  no-store paths. A user callback that calls `getCellMeta()` on every cell still stores one per cell; the
  JSDoc and the guide show the match-only form.

Values are read per block of `QUERY_ROW_BLOCK_SIZE` rows, one column at a time, through the internal
`_getDataAtColumnForRows()` (the bulk form of `getDataAtCell()`, same values). The cells are still tested and
the callbacks called in row order, but a callback that writes data mid-query sees the values read at the start
of its block. `performance-tests/scenarios/search-query` guards the time and fails a run that stores more than
20000 meta objects.

The value read follows `getDataAtCell()`, so it carries the data-read rule from `../../dataMap/metaManager/AGENTS.md`:
unless `applyCellsToDataReads` is on, a `valueGetter` (or key/value cell type) supplied through `cells()` applies only
to cells with stored meta. A query over a grid like that tests the raw value of an unstored cell and the getter's
value of a stored one (rendered, or a match of an earlier query). Before, the first query stored meta for every cell,
so later queries read every cell through the getter. Turn the option on for a consistent read; do not store meta here
to get one.

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
- `npm run test:unit --prefix handsontable -- --testPathPattern='plugins/search'`

A change to the eviction interaction needs a spec that **scrolls away and back**, not just one that queries.

## Every `query()` invalidates every cell

The result class is applied inside `beforeRenderer`, from the plugin's own state, with no cell meta write. Under `renderMode: 'onChange'` a cell whose value did not change would keep the previous query's class, so `query()` ends with `hot.markAllCellsChanged()`, and so does `disablePlugin()`. Disabling strips the class from the `className` of every STORED cell meta (`#removeResultClassFromStoredMeta`), not through a render: a render reaches only the rendered band, and a match painted while highlighted and then scrolled away keeps the class in its meta until it scrolls back (the one-shot `beforeRenderer` that used to do the stripping had exactly that hole, and read `isEnabled()` - the `search` setting, still `true` after a direct `disablePlugin()` - so on that path it re-added the class instead). `isSearchResult` is deliberately left in place: `updatePlugin()` is disable + enable, and the results survive an `updateSettings({ search })` as they always did. `#onBeforeRenderer` decides by `this.enabled`, the runtime state, never by the setting. Do not "optimize" either to the matched cells only: the cells that *stopped* matching need the repaint too.

## `true` after an object resets the options; `true` after `true` does not

`updatePluginSettings()` remembers the last enabling value it applied (`#appliedSettings`). An object sets the
options it names and keeps the rest. `true` replacing an object puts all three options back to their defaults,
as a grid built with `true` starts: without it, the object's `queryMethod`, `callback` and `searchResultClass`
outlived it, and a sheets bar sheet declaring `search: true` inherited the previous sheet's object. That reset
includes values set at runtime through `setQueryMethod()`, `setCallback()` and `setSearchResultClass()` on a grid
built with an object. `true` sent again changes nothing, because React and Angular re-send every prop on each
render and the setters' values must survive that. Do not reset on every non-object value. `search: false` forgets
the object (`disablePlugin()` clears `#appliedSettings` when the setting is off, never on the disable half of
`updatePlugin()`), so object → `false` → `true` keeps the object's options, as releases before the reset did.
ColumnSorting differs there by construction: its options live on a manager that `disablePlugin()` destroys. Pinned by `__tests__/settingsReset.unit.js` and `../sheetsBar/__tests__/pluginOptionReset.unit.js`.

## `_getObjectSettingDefaults()` lists every option an object sets

`@private`, read by the SheetsBar plugin (see `../base/AGENTS.md`). An object sets the options it names and keeps
the others, so the override lists the default of each one: `searchResultClass`, `queryMethod` and `callback`. A new
option of the object form must be added there, or a sheet that leaves it out keeps the previous sheet's value.
