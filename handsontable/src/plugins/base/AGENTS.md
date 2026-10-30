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
constructor      → binds afterPluginsInitialized / afterUpdateSettings
init()           → resolve pluginName, apply settings (core calls it, see below)
isEnabled()      → return !!this.hot.getSettings()[PLUGIN_KEY]
enablePlugin()   → init state, create IndexMaps, register hooks. super.enablePlugin() AT END.
updatePlugin()   → this.disablePlugin(); this.enablePlugin(); super.updatePlugin();
onGridReady()    → optional: work that reads the rows, hot.view, the DOM or the editor manager.
                   Core runs it once after every enable/update, when all of them exist.
disablePlugin()  → super.disablePlugin() FIRST. Then clean up.
destroy()        → null out fields. super.destroy() AT END.
```

Gold standard to copy: `../pagination/pagination.ts`.

Details that bite:

- **Core runs the init sequence, once per grid, from one `beforeInit` listener** (`initializePlugins()` in
  `base.ts`). In priority order: every plugin's `init()`, enabled or not; one error for all missing
  `PLUGIN_DEPS`; one `afterPluginsInitialized`, during which `onInitEnableTurn()` enables each enabled plugin
  once (hard-conflict check included). So `enablePlugin()` still runs during `beforeInit`, before the data
  loads and before `this.hot.view` exists — see [#6806](#6806-the-initialization-order-workarounds) below. The
  state of the sequence lives in that call. It used to live in module-level variables shared by every grid, and
  two `Handsontable.Core` grids built before either `init()` then fired `afterPluginsInitialized` once per
  plugin for the second grid, enabling each plugin before the next one was initialized (DEV-147). **Where the
  two listeners sit is the public order, so keep them there.** The `beforeInit` listener is added **before** the
  plugins are built: a `beforeInit` listener a plugin adds in its constructor must find every plugin enabled
  and its own `pluginName` set. The enables are a default-order listener **of** the `afterPluginsInitialized`
  dispatch, added right before it: a listener added earlier at the default order runs before them, and one at
  a positive `orderIndex` runs after them and sees the plugins enabled.
- **A plugin waiting for its turn is not enabled by a settings pass.** Two built-in plugins fire
  `afterUpdateSettings` mid-sequence: SheetsBar (910) builds its first sheet from its own `enablePlugin()`, and
  MultiColumnSorting (170) turns itself off when `columnSorting` is declared too. `onUpdateSettings` returns
  early for a plugin that has not had its turn yet, and records whether the pass carried the plugin's own
  option so `onInitEnableTurn()` reads the settings again. Without it, every later plugin (ViewState,
  DataProvider, UndoRedo, any plugin without a priority) was enabled early by branch 2 and then again by its
  own turn, with no `disablePlugin()` in between (DEV-147). A plugin turned off by
  such a pass stays off: its turn re-reads `isEnabled()`. The consequence for SheetsBar: those plugins now
  enable **after** SheetsBar's `enablePlugin()` returns, so they no longer see the first sheet's
  `_applySettingsAndData()` load – only core's own init pass. **The skip covers only a plugin that is not
  enabled yet.** One that another plugin enabled directly before its turn (Filters → DropdownMenu) takes the
  pass as usual, so branch 1 can turn it off and branch 4 can update it; skipping it too left such a plugin
  enabled while its setting said `false`, and lost new options.
- **`init()` is core's to call, once.** It marks the plugin as waiting for its init turn, and only
  `onInitEnableTurn()` clears that. A direct `plugin.init()` on a live grid therefore parks the plugin: every
  later `updateSettings()` skips it. Nothing in `src/` does that; do not start. A plugin destroyed before
  `init()` (`getPlugin(name).destroy()` on a `Handsontable.Core` built without init) has no `hot` and is left
  out of the sequence, as core's `destroy()` leaves it out; calling its `init()` threw.
- **Missing dependencies are collected, not thrown per plugin.** The sequence gathers every plugin's
  message and throws the combined error once, after the last `init()`. A single `throwWithCause` per
  plugin would hide the other missing modules.
- **A plugin that calls `updateSettings()` from its own `enablePlugin()` must not leave its own option on
  while it is still `enabled === false`**: the pass reaches its own `onUpdateSettings`, branch 2 enables it
  again, and that recurses. ColumnSorting only ever switches its *own* option off before returning, which is
  safe.
- **`destroy()` nulls every own property except `hot`, and `hot` is `delete`d** (it is non-writable, so
  `Reflect.set` silently fails on it). That is deliberate: an async guard written `if (!this.hot) { return; }`
  then reads `undefined` and returns. Write teardown guards that way, not `if (this.hot.isDestroyed)`.
- **The two constructor listeners live on the grid, so `destroy()` removes them itself.**
  `afterPluginsInitialized` and `afterUpdateSettings` are bound with `this.hot.addHook`
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
  two. Filters does it for `afterGetColHeader` (its callback reads `this.hot` and threw on the next
  header render). DropdownMenu deliberately keeps its own: its callback does not read `hot` on the
  disabled path, and it is what strips the destroyed plugin's buttons out of the reused header cells.
- **Default to `addHook()` on the plugin, not `this.hot.addHook()`.** The plugin's own `addHook` records the
  callback in `#hooks` so `disablePlugin()` can remove it; a hook registered straight on the instance
  survives `disablePlugin()` and can fire against a disabled plugin. **The exception is deliberate and
  real**: 20 `this.hot.addHook` / `addHookOnce` sites (`this.#hot` in `formulaBuilder/handsontableAdapter.ts`)
  exist in 12 plugin files: checkboxHeader, columnSorting (3), columnSummary/endpoints, contextMenu/menu,
  customBorders, dropdownMenu, filters, formulaBuilder, formulaBuilder/handsontableAdapter (4), formulas (2),
  hiddenColumns (2) and hiddenRows (2). Get the current list with
  `grep -rnE "this\.#?hot\.addHook(Once)?\(" src/plugins --include='*.ts' | grep -v -e __tests__ -e plugins/base/`. Several
  exist *because* the listener must outlive `disablePlugin()`. So do not convert these in a compliance
  pass — an instance-level hook needs a guard that tolerates being disabled, and the reason belongs in a
  comment. A listener can also outlive the disable through the tracked form: AutoColumnSize and
  AutoRowSize register their `before*Resize` listener again with `this.addHook()` after
  `super.disablePlugin()`, so double-click autofit still works while they are off. `../loading/`'s
  `afterDialogFocus` used to be listed here and no longer is: it was registered once behind a `#dialogPlugin === null` guard only to keep
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
2. disabled but `isEnabled()` now true → `updatePluginSettings(getSettings()[PLUGIN_KEY])`, then
   `enablePlugin()`, unless a hard conflict blocks it. The refresh comes first because `enablePlugin()`
   reads `getSetting()`: without it a plugin turned on by an update read the value it held before (the
   default, or the settings it was last disabled with), so `updateSettings({ bindRowsWithHeaders: 'strict' })`
   bound loose, and a SheetsBar turned off and on again rebuilt its old workbook first. Branch 4 then skips its
   own refresh in that call: a second one logged every validation warning twice, and for a payload carrying
   only a foreign `SETTING_KEYS` option it passed `undefined` and wiped what branch 2 read. A plugin whose
   `updatePlugin()` compares a value against the one it applied before can no longer see the change there in
   the enabling call, because `enablePlugin()` already applied it: AutoColumnSize and AutoRowSize record a
   sampling change seen in `enablePlugin()` for `updatePlugin()` to act on.
3. enabled and still enabled but a hard conflict is now active → `disablePlugin()` and **return**
4. enabled, still enabled, and the payload is relevant per `SETTING_KEYS` → `updatePluginSettings()` then
   `updatePlugin(newSettings)`

Branch 3 exists so a plugin already running gets switched off when a conflicting option appears later, even
when its own `SETTING_KEYS` do not overlap the payload. `relevantToSettings` is computed **before** those
branches, on purpose: branches 1 and 2 must not depend on it.

## The ready step: `onGridReady()`

`enablePlugin()` runs in three different states: at init (no data, no `hot.view`, no editor manager), on
`updateSettings()` (the new data and the view), and on a sheet switch (the departing data). The ready step
is the one place where the answer is always the same. Put **configuration** (hooks, index maps, settings,
own state) in `enablePlugin()`/`updatePlugin()`, and **everything that reads the rows, the view, the DOM or
the editor manager** in `onGridReady()`. Then no plugin needs an `if (this.hot.view)` guard.

The contract:

- **Once per enable or update.** An `enablePlugin()` or `updatePlugin()` call that returns with the plugin
  enabled makes it owe the step (`#readyStepOwed`). `disablePlugin()` clears the debt, so a plugin enabled
  and disabled in one pass runs nothing.
- **When everything exists, before the next render.** Core runs the owed steps, in `PLUGIN_PRIORITY`
  order: at init right after the view, the editor manager and the focus manager (before the `init` hook and
  the first render); in `updateSettings()` after the `min*` sizing, before its render; in `loadData()` and
  `updateData()` after the `afterLoadData`/`afterUpdateData` hook, before `afterChange` and the render that ends
  them (`beforeRender` in `replaceData()`), and in `alter()` before the closing render of `runAlter()`, for a step
  one of their hooks made a plugin owe; in `_applySettingsAndData()` after the `onDataReady()` pass, against the
  loaded data. Without the load and `alter()` points, a plugin that rebuilds from its `afterLoadData` listener
  (NestedHeaders, CollapsibleColumns) ran its step after the load had already rendered, and nothing rendered the
  new state. The load's step runs before `afterChange`, so an `afterChange` listener that renders draws the
  rebuilt state.
- **After the whole pass.** Core counts open lifecycle passes (`lifecyclePassDepth` in `core.ts`):
  `updateSettings()`, `_applySettingsAndData()`, `loadData()`, `updateData()`, `alter()`, every plugin
  lifecycle call, and a ready-step run. Steps run only when the outermost pass closes (or at its pre-render
  point). So `updatePlugin()` → `disablePlugin()` + `enablePlugin()` owes one step, not two, a plugin that
  enables another one (Filters → DropdownMenu) runs both steps after its own call returns, and a lifecycle
  call made from a `beforeLoadData` or `beforeRemoveRow` listener runs its step against the rows after the
  change, not the rows before it. A flag (`readyStepsMayBeOwed`) is set by every plugin lifecycle call, the
  only way to owe a step, so a pass that ran none (most `updateSettings()`, `loadData()` and `alter()` calls)
  skips the steps without looking at a plugin.
- **Direct calls count (Option B).** `hot.getPlugin('x').enablePlugin()` and a plugin calling
  `this.updatePlugin()` from a hook run the step as soon as the outermost call returns. The base constructor
  replaces the three lifecycle methods **on the instance** with wrappers (`#routeLifecycleCalls()`) that call
  `this.constructor.prototype.<method>` at call time, so overrides, `super` calls and prototype spies are
  unaffected. The wrappers are **not enumerable** on purpose: `destroy()` nulls every enumerable own
  property, and a nulled wrapper would turn Autofill's post-destroy `disablePlugin()` into a
  "not a function" throw instead of its own `!this.hot` guard. A spy on the instance replaces the wrapper.
  **A host that is not a Handsontable instance runs the method directly**, with no pass and no step: the
  FormulaBuilder and ImportFile unit tests (and any customer test of a custom plugin) build the plugin on a
  hand-made `hot` object, which has no `_runInPluginLifecyclePass()`. Before the fallback, 185 of those
  tests threw on the first `enablePlugin()`.
- **Never journaled.** Steps run inside `operationScope.suppress()`, like `updateSettings()` itself.
- **A pass that throws keeps the steps owed; a step that throws is not run again.** A step reads the grid as
  it is when it runs, so the next pass runs the steps a failed pass left; dropping them would leave an
  enabled plugin without its data work. The debt of a step is cleared before the step runs, so one that keeps
  failing does not throw on every later pass; its throw ends the pass like any throwing hook. A step that
  keeps re-enabling plugins is cut off after one round per plugin, and core warns only when a step is still
  owed after the last round.
- **At init core holds the renders the steps ask for.** The steps run inside a raised render-suspend
  counter, and core puts the counter back without rendering, because the first render follows the `init`
  hook. A step that renders (a sort, a cell write through `setDataAtCell()`, an explicit `hot.render()`)
  would otherwise draw the grid before the steps of the later plugins built their state, the early paint
  CustomBorders documents as #11031. The work is drawn by the first render, so the grid renders once at
  init. Outside init a step renders as it asks, on a grid that is already drawn. A held render also skips
  what a full render does first: forget which stored cell meta already ran its dynamic extension (the `cells`
  function and the meta hooks). So core calls `metaManager.invalidateMetaExtensions()` after the steps.
  Without it the `init` listeners read a meta as it was before a step changed it: AutoColumnSize's sweep
  read a merge's first cell (stored during the init load) without its `colspan`, and sized its column for
  the merge's text. **Only there, not on every held `Core#render()`.** Clearing on each held render would let
  a read inside `batch()` see what a `render()` call changed, but it re-runs the `cells` function and the meta
  hooks for every cell read after each such call: a `batch()` of 1,000 `render()` calls with 50 meta reads
  after each took 30.4 ms against 14.3 ms (medians of 10, Chromium), and batched `setDataAtCell()` writes do
  not go through `Core#render()` at all. A stale extension inside a batch is the older behavior and has no
  report behind it, so the read speed wins. The counter is put back to its value from before the steps, not
  decremented: a step that resumed rendering once more than it suspended left it below zero, and the next
  `suspendRender()` held nothing. **A step that needs to know it runs in the init pass asks
  `isInitReadyStep()`, never `view._wt.drawn`**: a grid built hidden is never drawn, so the view answer is
  wrong for every later enable on it (CustomBorders left an `afterInit` listener there that never fired).
- **One owner per enable for work that `updatePlugin()` or `onDataReady()` also does.** The step runs after
  every enable AND every update, and many plugins already do their data work in `updatePlugin()` (a settings
  sort, the declared borders, the page state). Such a plugin sets a private `#...Owed` flag in
  `enablePlugin()` and clears it in whichever path does the work, so the step does it only when nothing else
  did: at init, after a direct `enablePlugin()` call, and on a grid still being built where
  `deferDataWork()` recorded nothing. CustomBorders, Pagination, ColumnSorting, ColumnSummary, MergeCells and
  DataProvider follow it; DataProvider captures "owed" at enable time, because a passive enable
  (`_runWithoutFetching()`) must not fetch even when the step runs after the passive scope ended.
- **Known limit: the steps run before the end of `updateSettings()`.** They run before its render, which
  comes before the theme hook and the layout config (`finishSettingsUpdate()`), so a step sees the state
  that render draws. A step a plugin comes to owe during a render or that finishing work (a lifecycle call
  from an `afterRender` or `afterSetTheme` listener) runs when the pass closes, after the render, and
  nothing renders again for it.
- **Known limit: a call nested in another pass renders ahead of the step.** A plugin's `updatePlugin()` that
  calls `_applySettingsAndData()` during `updateSettings()` is such a call: its `resumeRender()` renders,
  then the outer pass runs the step and renders again. That costs one extra render and the end state is right.

**Not `onDataReady()`.** That hook stays the sheet-switch protocol below, called for every enabled plugin on
every `_applySettingsAndData()`. The ready step got its own name because ColumnSummary's `onDataReady()`
refreshes every endpoint when nothing was deferred (`refreshAllEndpoints()`, which writes through
`setDataAtCell`). Called at the new points it would write the summaries twice per `updateSettings()` and fire
an extra `afterChange`. Load hooks are not covered either: an `afterLoadData` listener still fires during
the init pass with no view, so a plugin that needs the view there skips `initialLoad` and leaves the work to
the step. **A load an `init` listener makes gets no step pass.** It runs after the init steps, with a truthy
`initialLoad` (`[null, 'loadData']`) and the view in place, and `replaceData()` skips `beforeRender` for it.
A plugin whose step built state from the rows redoes it from `afterLoadData` for exactly that value: a truthy
`initialLoad` while `this.hot.view` exists (ColumnSorting does, pinned by
`tests/e2e/column-sorting-init-load.spec.ts`). Which plugins implement `onGridReady()`, and which init listeners stay on purpose, is in the #6806
section below.

Pinned by `__tests__/readyStep.unit.js`.

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
3. **Data ready.** The cell meta the caller kept with the rows (the `keptCellMetas` argument: the meta set
   through `setCellMeta()` and the invalid marks, by physical index, minus entries past the data or on a
   `min*` filler) is written back, then the `cell` option (which wins on a key both set) and
   `afterCellMetaReset` run against the new data, then the
   source-data validators once (the load skips them on this path, because a `columns` function reaches the
   column meta only now, and validating during the load blanked a value under the previous sheet's rules),
   then every **enabled** plugin's optional `onDataReady()` in `PLUGIN_PRIORITY` order, then one render
   (rendering is suspended for the whole call and resumed in a `finally`). A grid without a view skips the
   `onDataReady()` loop: its plugins do that work from their ready step (`onGridReady()`).

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
that already reads the new rows): that work is correct as it is. ColumnSummary is the one exception: its `afterLoadData` refresh is skipped while the flag is up, because its endpoints are still the
departing sheet's until `onDataReady()` parses the arriving ones, so that refresh would read the new rows
with the old configuration. The plugins that defer today:
ColumnSummary (endpoints), ColumnSorting and MultiColumnSorting (the `initialConfig` sort), CustomBorders
(the declared borders), MergeCells (the settings pass, run by SheetsBar), NestedRows (the data check),
Formulas (bind only, no sheet fill), Pagination (the page state), EmptyDataState (the overlay toggle) and
DataProvider (the fetch). The public `updateSettings()` and `loadData()` never set the flag. Core skips the
`onDataReady()` pass on a grid still being built and the plugin's ready step does the work there, which
is why `deferDataWork()` records nothing without a view: a record made then would fire on a later, unrelated
switch (ColumnSorting ran its settings sort on the first switch, with its sort hooks). It returns whether it
recorded, so a plugin can tell which of the two owns the work. Declare `onDataReady()` as an ordinary method;
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
| `onInitEnableTurn()` (the init sequence) | warns **and writes `getSettings()[PLUGIN_KEY] = false`**, then returns |
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
| | | 265 | formulaBuilder |
| 70 | contextMenu | 270 | autoLink |
| 80 | copyPaste | 280 | nestedHeaders |
| | | 290 | collapsibleColumns |
| 100 | dragToScroll | 300 | nestedRows |
| 110 | manualColumnFreeze | 310 | hiddenColumns |
| 120 | manualColumnMove | 320 | hiddenRows |
| 130 | manualColumnResize | 330 | trimRows |
| 140 | manualRowMove | 335 | customBorders |
| 150 | mergeCells | 340 | asyncValues |
| 155 | stretchColumns | 350 | loading |
| 160 | multipleSelectionHandles | 360 | dialog |
| | | 370 | emptyDataState |
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
345 (`customBorders` took 335, see below). `900`+ is reserved for plugins that
must see every other plugin's state already settled (Pagination, DataProvider, UndoRedo).

**Priority orders `enablePlugin()`, and nothing else.** It does *not* order hook callbacks by itself — it
does so only transitively, because a hook registered during an earlier `enablePlugin()` lands earlier in that
hook's callback list. Four load-bearing cases, so do not renumber casually:

- NestedHeaders (280) rebuilds the header tree before CollapsibleColumns (290) re-derives its hidden set.
- MoveCells (25) and SelectionHandles (24) settle their drag state before DragToScroll (100) reads it in a hook.
- ColumnSorting (50) before MultiColumnSorting (170).
- CustomBorders (335) after every plugin that rewrites a row or column index map (ManualColumnMove 120,
  ManualRowMove 140, MultiColumnSorting 170, Filters 250, NestedRows 300, TrimRows 330). Its `updatePlugin()`
  converts the configured visual coordinates to physical ones, so run before them it stored the `borders` meta
  on the records the previous maps put there (see `../customBorders/AGENTS.md`). A plugin that rewrites a map
  from `updatePlugin()` and sits above 335 needs the same check.
- UndoRedo (1000) last, so every other plugin's hooks are registered before it starts recording actions.
- `formulaBuilder` (265) enables after `formulas` (260) because it borrows the engine at enable time. Its
  three cell mouse listeners do NOT rely on priority: they are registered at order index `-1`, because a
  reference pick must see the mousedown before NestedHeaders (280), ColumnSorting (50), and DragToScroll
  (100), and priority stops ordering them after the first `updatePlugin()` (see `../formulaBuilder/AGENTS.md`).
- `autoLink` (270) enables after `formulas` (260) so its `afterRenderer` runs after the HYPERLINK wrap on a fresh
  grid, but nothing relies on that: both `afterRenderer` callbacks converge from either order (see
  `../formulas/AGENTS.md`), because `updateSettings` can register `Formulas` later.

For a path with **no** hook — a raw DOM listener — priority is irrelevant and the ordering guarantee has to
come from somewhere else (DOM bubbling, for instance). `../dragToScroll/AGENTS.md` works through that
distinction.

## #6806: the initialization-order workarounds

Because `enablePlugin()` fires during `beforeInit`, before the data and the view exist, plugins used to guard
on `!this.hot.view` and park the work that needs them on an `init` or `afterInit` listener, which never fired
again for a later enable. **The fix is the ready step** (above), and these plugins use it:

| Plugin | Work in `onGridReady()` | Replaced |
|---|---|---|
| NestedHeaders, CollapsibleColumns | the header tree and the collapsed set | `init` replay of `updatePlugin()` |
| Filters | the per-column settings scan | `afterInit` on the first enable |
| NestedRows | the row header width | `afterInit` (with a second render) |
| EmptyDataState | the overlay toggle | `afterInit` (with a second render) |
| CustomBorders | the declared borders, when no update applied them | `init` |
| Pagination | the page state, when no update computed it | `init` at order index `-1` |
| ColumnSorting, MultiColumnSorting | the settings sort of an enable | `afterInit`, the `this.hot.view` branch, a dead `afterLoadData` branch |
| ColumnSummary | the endpoints | `afterInit` and the `this.hot.view` guard in `updatePlugin()` |
| MergeCells | the settings pass, when no update ran or handed it over | `afterInit` |
| DataProvider | the fetch of an enable or update | `afterInit` and the `this.hot.view` guard in `updatePlugin()` |
| Formulas | the index syncs the axis syncers postponed | a one-off `init` listener |

Every replaced listener ran after the first render (`afterInit`) or between the `init` hook and it; the steps
run before both, with the renders held (above), so these plugins' work is drawn by the first render and the
grid renders once at init. A direct `enablePlugin()` on a live grid now does the work too, which only
ColumnSorting's `this.hot.view` branch did before. Each plugin's `AGENTS.md` has its details, and its `__tests__/readyStep.unit.*` pins them.

What stays, on purpose:

- **AutoColumnSize and AutoRowSize keep their `init` listener.** The steps run in `PLUGIN_PRIORITY` order, so
  their steps would run at 10 and 40, before NestedHeaders, MergeCells and Pagination build what they
  measure. Since every step now runs before the `init` hook, `init` is where that state is in place and the
  first render has not run. `tests/e2e/nested-headers-autosize-init.spec.ts` fails if they move.
- **FormulaBuilder's `afterInit` listener** decides when to warn about a failed enable (Formulas off), and a
  plugin that did not enable owes no step.
- **Formulas' `this.hot.view` checks** tell construction from a later settings update for its eager first
  resync, which the step does not answer (`../formulas/AGENTS.md`).
- **`!this.hot.view` guards on the disable path** (NestedHeaders' `clearColspans()`, CollapsibleColumns'
  `clearButtons()`): `disablePlugin()` can run before the view exists and has no step.
- **A nested grid's own `afterInit`** (the context menu's `hotMenu`) belongs to that grid, not to a plugin of
  this one.

Do not move `enablePlugin()` itself later: plugins add their hooks there, before the init settings pass adds
the hooks declared in the settings, so a later enable would run every user callback ahead of the plugin's on
a shared hook (pinned by the `beforeInit` order test in `__tests__/initSequence.unit.js`), and index maps and
load hooks must be in place before the first load. Never copy the old workaround into a new plugin: put the
work in `onGridReady()`, and use the one-owner flag above when `updatePlugin()` does the same work.

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
