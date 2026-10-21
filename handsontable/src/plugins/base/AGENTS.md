# BasePlugin — the plugin contract every plugin inherits

`base.ts` is the class every plugin extends, and `conflictRegistry.ts` is where a plugin declares that
another setting must keep it switched off. Read this before touching either file, and before writing a
plugin that has to reason about *when* it runs relative to another one.

Nothing here is a feature. Change `base.ts` and you change all 43 plugins at once, so treat every edit
as monorepo-wide.

## The statics, and what each one really controls

`base.ts` declares **five**: `PLUGIN_KEY`, `SETTING_KEYS`, `DEFAULT_SETTINGS`, `SETTINGS_VALIDATORS` and
`PLUGIN_DEPS`. `PLUGIN_PRIORITY` is listed with them because a plugin must supply it, but it is **not on
the base class** — it is a per-plugin module export plus a per-plugin `static get`, read by `registry.ts`
at registration. There is no default and no getter to override: a plugin that declares none is not
mis-prioritized, it lands in the un-prioritized registration-order bucket.

| Static | Answers | Trap |
|---|---|---|
| `PLUGIN_KEY` | which top-level setting switches the plugin on | also the key `getSetting()` reads and the key `onUpdateSettings` feeds to `updatePluginSettings()` |
| `PLUGIN_PRIORITY` | **enable order**, ascending | registration fails loudly on a duplicate — see the table below for free slots |
| `SETTING_KEYS` | which `updateSettings()` calls reach `updatePlugin()` | `true` = every call, `false` = never, array = only when one of those keys is present |
| `DEFAULT_SETTINGS` | the fallback `getSetting()` merges under the user value | `defaultMainSettingSymbol` names the key an array/primitive setting maps onto |
| `SETTINGS_VALIDATORS` | per-key (object) or whole-value (function) validation | only the validator's **own** keys are checked — unknown keys inside a settings object pass untouched |
| `PLUGIN_DEPS` | required modules, as `'type:Name'` | types are `plugin`, `cell-type`, `editor`, `renderer`, `validator`; a wrong type **throws** |

`SETTING_KEYS` defaults to `[this.PLUGIN_KEY]`, so a plugin that says nothing updates only when its own
option is passed.

### `SETTING_KEYS` may name an option the plugin does not own

Both manual resize plugins list their size option beside their own key, so `updateSettings({ rowHeights })`
reaches them at all. That changes what `updatePlugin()` must assume, in three ways that have all shipped as
bugs — the full rules are in `../../utils/manualResize/AGENTS.md`. The one to remember here: `onUpdateSettings` calls
`updatePluginSettings(newSettings[PLUGIN_KEY])`, and a call that carries only a *foreign* key passes
`undefined`, which **wipes the stored setting** for the rest of the session.

## Lifecycle, in the order it actually runs

```
constructor      → binds afterPluginsInitialized / afterUpdateSettings / beforeInit
init()           → resolve pluginName, apply settings, check PLUGIN_DEPS,
                   queue enablePlugin() on a once-only afterPluginsInitialized
isEnabled()      → return !!this.hot.getSettings()[PLUGIN_KEY]
enablePlugin()   → init state, create IndexMaps, register hooks. super.enablePlugin() AT END.
updatePlugin()   → this.disablePlugin(); this.enablePlugin(); super.updatePlugin();
disablePlugin()  → super.disablePlugin() FIRST. Then clean up.
destroy()        → null out fields. super.destroy() AT END.
```

Gold standard to copy: `../pagination/pagination.ts`.

Details that bite:

- **`init()` runs on `beforeInit` for every registered plugin, enabled or not.** `enablePlugin()` is deferred
  to `afterPluginsInitialized`, which is why `this.hot.view` may or may not exist inside it — see
  [#6806](#6806-the-initialization-order-workarounds) below.
- **Missing dependencies are collected, not thrown per plugin.** `init()` pushes a message into a
  module-level list and only the *last* plugin to initialize throws the combined error. A single
  `throwWithCause` per plugin would hide the other missing modules.
- **`destroy()` nulls every own property except `hot`, and `hot` is `delete`d** (it is non-writable, so
  `Reflect.set` silently fails on it). That is deliberate: an async guard written `if (!this.hot) { return; }`
  then reads `undefined` and returns. Write teardown guards that way, not `if (this.hot.isDestroyed)`.
- **The three constructor listeners live on the grid, so `destroy()` removes them itself.**
  `afterPluginsInitialized`, `afterUpdateSettings` and `beforeInit` are bound with `this.hot.addHook`
  (kept in `#lifecycleHooks`), not the tracked `addHook()`, because they must survive `disablePlugin()`.
  `clearHooks()` therefore never sees them. Before DEV-775 they also survived `destroy()`, so a plugin
  destroyed ahead of the grid (`getPlugin(name).destroy()`) made **every** later `updateSettings()` throw
  from `isEnabled()` reading the deleted `hot`, whatever the payload. The grid's own `destroy()` calls each
  plugin's `destroy()` again after that, with `hot` already gone, so the removal is guarded on `this.hot`.
  `getPlugin(name)` still returns the destroyed object; a plugin whose public lifecycle methods can be
  called on it afterwards guards them with `if (!this.hot) { return; }` (Autofill does).
- **Core never destroys a plugin twice.** The grid's `destroy()` skips a plugin that has no `hot` left,
  because many overrides run their own teardown before `super.destroy()` and read `hot` or a field the
  first `destroy()` nulled (AutoColumnSize's `ghostTable`, NestedHeaders' `hot.rootElement`). A throw
  there used to stop core's plugin loop, so the later plugins, `pluginsRegistry.clear()` and
  `afterDestroy` never ran. Do not rely on the skip from inside a plugin: `destroy()` can still be called
  twice by hand, so an override that reads `hot` should tolerate a missing one.
- **A listener a subclass constructor binds with `this.hot.addHook()` is the subclass's to remove in
  `destroy()`**, while `hot` still exists, before `super.destroy()`. The base class only knows its own
  three. Filters does it for `afterGetColHeader` (its callback reads `this.hot` and threw on the next
  header render). DropdownMenu deliberately keeps its own: its callback does not read `hot` on the
  disabled path, and it is what strips the destroyed plugin's buttons out of the reused header cells.
- **Default to `addHook()` on the plugin, not `this.hot.addHook()`.** The plugin's own `addHook` records the
  callback in `#hooks` so `disablePlugin()` can remove it; a hook registered straight on the instance
  survives `disablePlugin()` and can fire against a disabled plugin. **The exception is deliberate and
  real** — about two dozen `this.hot.addHook` / `addHookOnce` sites exist across the plugins (filters,
  dropdownMenu, columnSorting, search, customBorders, columnSummary, formulas, contextMenu/menu), several
  precisely *because* the listener must outlive `disablePlugin()`: the auto-size plugins keep their
  recalculation listener bound so double-click autofit still works while disabled. So do
  not convert these in a compliance pass — an instance-level hook needs a guard that tolerates being
  disabled, and the reason belongs in a comment. `../loading/`'s `afterDialogFocus` used to be listed here
  and no longer is: it was registered once behind a `#dialogPlugin === null` guard only to keep
  `updatePlugin()` from doubling it, which the tracked `addHook` handles by itself, and the guard was
  dropping the hook for good on the first `updateSettings()` (#13410). Inside `enablePlugin()` the tracked
  form is also enforced by the `handsontable/require-tracked-hook-in-enable` lint rule.
- **Prefer arrow function class fields, passed directly**: `this.addHook('afterX', this.#onAfterX)`. This is
  the house rule (`../../../AGENTS.md` states it as Required) and it is what makes a listener nameable,
  greppable and individually removable with `removeHooks(name)`. Two corrections to how it is usually
  justified, both worth knowing before you enforce it:
  - **The plugin's own `addHook` does not care about identity.** It pushes whatever reference it was handed
    into `#hooks`, and `removeHooks` removes that same reference — so an inline wrapper registered through
    `this.addHook` *is* cleaned up by `disablePlugin()`. Identity only matters when you register on
    `this.hot.addHook` and later call `this.hot.removeHook` with a separately built function.
  - **Inline-wrapper sites already exist in bulk** — at least 38 through `this.addHook` alone, spread over
    16 plugins, including the auto-size pair, `columnSummary`, `formulas`, `comments`, `customBorders`,
    `mergeCells`, `contextMenu`, `dropdownMenu`, `dialog` and `emptyDataState`. Grep `this.addHook('` for
    the current set rather than trusting that number. They work, and by the point above they are torn down
    correctly, so **rewriting them is churn with no functional gain** — do not do it in a compliance pass.
    Use the arrow field for new code.
  Never `.bind(this)`: that *does* build a new function per call, so the reference you registered is not the
  one you can remove.
- `addHook`'s third argument is an **order index**: negative runs before the un-indexed listeners, positive
  after. Reach for it only when two plugins must observe the same hook in a fixed order.
- **A plugin's `ui.ts` builds DOM through `buildTemplate()` (`helpers/dom/template.ts`), never an HTML
  string.** Every HTML parse entry point is a Trusted Types sink, so a plain string is rejected under a CSP
  carrying `require-trusted-types-for 'script'` and the plugin dies where it writes. Clear with `empty()` or
  `replaceChildren()`, never `innerHTML = ''`. Library-authored copy goes through `htmlToPlainText()`
  (`helpers/string.ts`); grid *content* leaving the DOM goes through `textExtractor`. Full rule:
  `../../../AGENTS.md`; worked examples in `../dialog/AGENTS.md`, `../emptyDataState/AGENTS.md` and
  `../loading/AGENTS.md`.

## `onUpdateSettings` is a state machine, and the order of its branches is the contract

`onUpdateSettings` runs on *every* `afterUpdateSettings`, for every plugin, and decides between four
outcomes in this order:

1. enabled but `isEnabled()` now false → `disablePlugin()`
2. disabled but `isEnabled()` now true → `enablePlugin()`, unless a hard conflict blocks it
3. enabled and still enabled but a hard conflict is now active → `disablePlugin()` and **return**
4. enabled, still enabled, and the payload is relevant per `SETTING_KEYS` → `updatePluginSettings()` then
   `updatePlugin(newSettings)`

Branch 3 exists so a plugin already running gets switched off when a conflicting option appears later, even
when its own `SETTING_KEYS` do not overlap the payload. `relevantToSettings` is computed **before** those
branches, on purpose: branches 1 and 2 must not depend on it.

## Deferred data work: `isDataWorkDeferred()` and `onDataReady()`

Core's private `_applySettingsAndData(settings, data, source)` applies settings and the data they describe
in the order the grid's own initialization uses, for a caller that replaces both at once (SheetsBar, on a
sheet switch). A plain `updateSettings()` followed by `loadData()` lets every plugin reconfigure against the
data the grid still holds. The call has three phases:

1. **Configure.** The settings merge and `onUpdateSettings` runs for every plugin as usual (enable, disable,
   update), while `isDataWorkDeferred()` answers `true`. Core skips the data phase, the late `columns` pass,
   the `cell` option, `afterCellMetaReset`, the `min*` padding and surplus removal, and the render. A
   `columns` value the early column pass cannot apply (`null`, or a function) resets the column meta here,
   so the load does not read the previous columns' types. On a grid still being built there is no data map
   yet, so nothing may count rows here.
2. **Load.** A normal `loadData()` with the new configuration in force. The load hooks reach the plugins
   enabled in phase 1, every index map re-initializes, and the load sizes the new data to the new `min*`
   values. `isDataWorkDeferred()` still answers `true`.
3. **Data ready.** The `cell` option and `afterCellMetaReset` run against the new data, then the
   source-data validators once (the load skips them on this path, because a `columns` function reaches the
   column meta only now, and validating during the load blanked a value under the previous sheet's rules),
   then every **enabled** plugin's optional `onDataReady()` in `PLUGIN_PRIORITY` order, then one render
   (rendering is suspended for the whole call and resumed in a `finally`). A grid without a view skips the
   `onDataReady()` loop: its plugins do that work from their own `afterInit`.

The rule for a plugin: **work in `enablePlugin()`, `updatePlugin()` or a load hook that reads or writes the
loaded rows checks `isDataWorkDeferred()` and, while it is `true`, records it with `deferDataWork()` and does
it in `onDataReady()` when `takeDeferredDataWork()` answers `true`.** Configuration (hooks, maps, the plugin's
own state) stays where it is. The record lives in BasePlugin, never in a flag of the plugin's own, because
three owners have to be able to drop it: `disablePlugin()` (a plugin turned off in the same pass), core when
the call throws before the `onDataReady()` pass (`dropDeferredDataWork()`; a listener that throws mid-switch
left the plugins' own flags set, and the next switch ran the owed work against another sheet's data), and
`deferDataWork()` itself, which records nothing while the grid has no view. **Work that needs the load itself
rather than the loaded rows** (NestedRows' check of the incoming array, Formulas binding a sheet the load fills,
MergeCells' held settings pass) asks `isDataLoadPending()` instead, which answers `true` only before the call's
load. `isDataWorkDeferred()` stays `true` through the load and the meta phase, so a plugin enabled from an
`afterLoadData` listener that waited on it waited for a load that had already run. Do not
read the flag to skip work that the load itself redoes (a map's `init` hook, an `afterLoadData` refresh
that already reads the new rows): that work is correct as it is. The plugins that defer today:
ColumnSummary (endpoints), ColumnSorting and MultiColumnSorting (the `initialConfig` sort), CustomBorders
(the declared borders), MergeCells (the settings pass, run by SheetsBar), NestedRows (the data check),
Formulas (bind only, no sheet fill), Pagination (the page state), EmptyDataState (the overlay toggle) and
DataProvider (the fetch). The public `updateSettings()` and `loadData()` never set the flag. Core skips the
`onDataReady()` pass on a grid still being built and the plugin's own `afterInit` does the work there, which
is why `deferDataWork()` records nothing without a view (a record made then would fire on a later, unrelated
switch: ColumnSorting ran its settings sort on the first switch, with its sort hooks). Declare `onDataReady()` as an ordinary method;
BasePlugin declares the optional signature. MergeCells is the one plugin whose owed pass is run by its caller
(SheetsBar's `runDeferredSettingsPass(apply)`), not by `onDataReady()`, because only the bar knows whether the
sheet returns with a stored state that must build no declared merges; it still keeps the record in
BasePlugin, so a failed call drops it too. A public `updateSettings()` made during phase 1 (ColumnSorting turning a conflicting
plugin off from `enablePlugin()`) is deferred like the call's own: core skips its data phase, padding and
render, and runs its meta phase after the call's own, in the order the updates were made. Applied in full
there, it padded the departing rows to the arriving `min*` values, and a single shared slot for the held
meta phase let it overwrite the call's own. One made in phase 2 or 3 (an `afterLoadData` listener) is
applied in full. The step is saved and restored around a nested `_applySettingsAndData()`, never reset to
"off". In every case the flag plugins read stays `true`, so their work still waits for the call's
`onDataReady()` pass. Pinned by `src/__tests__/core/applySettingsAndData.unit.js`.

## Hard conflicts

`registerConflict(blockedKey, incompatibleSettingKeys)` declares "this plugin must never enable while that
top-level setting is truthy". It is checked in two places, and **they do not behave identically**:

| Site | On a block |
|---|---|
| `init()`'s deferred enable | warns **and writes `getSettings()[PLUGIN_KEY] = false`**, then returns |
| `onUpdateSettings` branch 3 | warns and calls `disablePlugin()`; the setting is left alone |

The consequence: a grid blocked at init reports its own option as `false`, so a test asserting
`getSettings().pagination === true` fails, and removing the conflicting option later does not bring the
plugin back at init.

Note `isHardConflictBlocked()` warns as a *side effect* of being asked, which reads like a double-warning
hazard and is not one: branch 2 **returns** when it blocks, so branch 3 is only reached when branch 2 did
not warn, and branch 3 returns after warning once. One `updateSettings()` pass warns at most once.

The check is `!!settings[incompatibleSettingKey]`. It is a *setting* key, not a plugin key, so it also
catches options no plugin owns (`fixedRowsTop`).

Both registrations live at module scope in the blocked plugin's own file, so the conflict is declared where
someone reading that plugin will find it:

| Blocked | Blocked by | Declared in |
|---|---|---|
| `pagination` | `nestedRows`, `mergeCells`, `fixedRowsTop`, `fixedRowsBottom` | `../pagination/pagination.ts` |
| `dataProvider` | `manualRowMove`, `manualColumnMove`, `trimRows`, `multiColumnSorting` | `../dataProvider/dataProvider.ts` |
| `asyncValues` | `nestedRows` | `../asyncValues/asyncValues.ts` |

A hard conflict is a blunt instrument: it disables the plugin outright. Use it only for combinations that
cannot be made to work. Anything softer belongs in the plugin's own logic.

## `PLUGIN_PRIORITY` — the enable-order table

`registry.ts` returns priority-registered plugins in **ascending** priority, then anything registered
without a priority in registration order. Registering two plugins on the same priority **throws**.

| # | Plugin | # | Plugin |
|---|---|---|---|
| 10 | autoColumnSize | 170 | multiColumnSorting |
| 20 | autofill | 190 | search |
| 24 | selectionHandles | 200 | touchScroll |
| 25 | moveCells | 210 | bindRowsWithHeaders |
| 30 | manualRowResize | 220 | columnSummary |
| 40 | autoRowSize | 230 | dropdownMenu |
| 45 | autoRowHeaderSize | 240 | exportFile |
| | | 245 | importFile |
| 50 | columnSorting | 250 | filters |
| 60 | comments | 260 | formulas |
| 70 | contextMenu | 270 | autoLink |
| 80 | copyPaste | 280 | nestedHeaders |
| 90 | customBorders | 290 | collapsibleColumns |
| 100 | dragToScroll | 300 | nestedRows |
| 110 | manualColumnFreeze | 310 | hiddenColumns |
| 120 | manualColumnMove | 320 | hiddenRows |
| 130 | manualColumnResize | 330 | trimRows |
| 140 | manualRowMove | 340 | asyncValues |
| 150 | mergeCells | 350 | loading |
| 155 | stretchColumns | 360 | dialog |
| 160 | multipleSelectionHandles | 370 | emptyDataState |
| | | 375 | notification |
| | | 380 | freezeBar |
| | | 385 | rowSelection |
| | | 390 | checkboxHeader |
| | | 900 | pagination |
| | | 910 | sheetsBar |
| | | 920 | viewState |
| | | 950 | dataProvider |
| | | 1000 | undoRedo |

Free slots to pick a new number from: 180 and the 400–890 range (plus the odd numbers between the rows
above). `asyncValues` took 340, the gap between the trimming plugins (330) and the overlay plugins (350+);
it relies on neither side, so a plugin that must enable after trimming and before the overlays can take
335 or 345. `900`+ is reserved for plugins that
must see every other plugin's state already settled (Pagination, DataProvider, UndoRedo).

**Priority orders `enablePlugin()`, and nothing else.** It does *not* order hook callbacks by itself — it
does so only transitively, because a hook registered during an earlier `enablePlugin()` lands earlier in that
hook's callback list. Four load-bearing cases, so do not renumber casually:

- NestedHeaders (280) rebuilds the header tree before CollapsibleColumns (290) re-derives its hidden set.
- MoveCells (25) and SelectionHandles (24) settle their drag state before DragToScroll (100) reads it in a hook.
- ColumnSorting (50) before MultiColumnSorting (170).
- UndoRedo (1000) last, so every other plugin's hooks are registered before it starts recording actions.
- `autoLink` (270) enables after `formulas` (260) so its `afterRenderer` runs after the HYPERLINK wrap on a fresh
  grid, but nothing relies on that: both `afterRenderer` callbacks converge from either order (see
  `../formulas/AGENTS.md`), because `updateSettings` can register `Formulas` later.

For a path with **no** hook — a raw DOM listener — priority is irrelevant and the ordering guarantee has to
come from somewhere else (DOM bubbling, for instance). `../dragToScroll/AGENTS.md` works through that
distinction.

## #6806: the initialization-order workarounds

Because `enablePlugin()` fires on `afterPluginsInitialized`, a plugin that needs rendering state has to
guard on `!this.hot.view` and sometimes force an `updatePlugin()` call from inside `enablePlugin()`.
**Only CollapsibleColumns' three sites are actually marked `#6806`** (`collapsibleColumns.ts`); grep for
that number and NestedHeaders looks clean. It is not — it carries an unnumbered
`// @TODO: Workaround for broken plugin initialization abstraction.` (`nestedHeaders.ts:1593`) plus its
`this.hot.view` guards. `../../../.ai/CONCERNS.md` counts 4 sites there; do not trust a grep alone.

Do not copy the workaround into a new plugin without checking whether you actually need `view` during
enable. The real fix — guaranteeing `hot.view` before `enablePlugin()` — is tracked in
`../../../.ai/CONCERNS.md`.

## Undo/redo: `runOperation()` and the snapshot contract

Every public method that changes what the user sees runs its body in `this.runOperation(name, fn,
details?, source?)` - the outermost operation becomes one undo step, named `name` (`actionType`), with
`${pluginName}.${name}` as the default source. Nested calls join the open operation. `details` become
fields of the step the undo hooks receive; put plain copies there, never live objects.

State the undo stack cannot see on its own - neither an index map nor cell meta nor the settings
`alter()` changes - is exposed through optional methods (found by `typeof`, no default bodies):
`captureState(previous)` / `restoreState(state, context?)`, and for a plugin that reshapes the source
array itself, `captureSourceStructure(previous)` / `restoreSourceStructure(state)`. Return `previous`
by reference when nothing changed. `context` (`PluginRestoreContext`: `other`, `direction`,
`reordered`) names the step being restored, so a plugin can apply only what the step changed and
keep a change made outside any step. A plugin with `captureState()` should also implement
`getStateColumns(state, other)` - the physical columns its state differs in across a step - or every
step that changed its state is dropped on a `columns` settings update that changes a column's field.
Details and traps: `../undoRedo/AGENTS.md`.

## Where to look next

- Full plugin-authoring workflow: the `handsontable-plugin-dev` skill.
- Hook catalog and registration: `../../../.ai/HOOKS.md`, `../../core/hooks/AGENTS.md`.
- Registry and priority map internals: `../registry.ts`, `../../utils/dataStructures/priorityMap.ts`.
- Index maps a plugin registers: `../../../.ai/INDEX-MAPPING.md`, `../../translations/AGENTS.md`.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='plugins/base'`
