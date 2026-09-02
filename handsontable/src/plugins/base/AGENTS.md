# BasePlugin — the plugin contract every plugin inherits

`base.ts` is the class every plugin extends, and `conflictRegistry.ts` is where a plugin declares that
another setting must keep it switched off. Read this before touching either file, and before writing a
plugin that has to reason about *when* it runs relative to another one.

Nothing here is a feature. Change `base.ts` and you change all 42 plugins at once, so treat every edit
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
bugs — the full rules are in `../manualResize/AGENTS.md`. The one to remember here: `onUpdateSettings` calls
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
- **Default to `addHook()` on the plugin, not `this.hot.addHook()`.** The plugin's own `addHook` records the
  callback in `#hooks` so `disablePlugin()` can remove it; a hook registered straight on the instance
  survives `disablePlugin()` and can fire against a disabled plugin. **The exception is deliberate and
  real** — about two dozen `this.hot.addHook` / `addHookOnce` sites exist across the plugins (filters,
  dropdownMenu, columnSorting, search, comments, customBorders, columnSummary, formulas, loading,
  contextMenu/menu), several precisely *because* the listener must outlive `disablePlugin()`:
  `../loading/` registers `afterDialogFocus` once behind a `#dialogPlugin === null` guard, and the auto-size
  plugins keep their recalculation listener bound so double-click autofit still works while disabled. So do
  not convert these in a compliance pass — an instance-level hook needs a guard that tolerates being
  disabled, and the reason belongs in a comment.
- **Prefer arrow function class fields, passed directly**: `this.addHook('afterX', this.#onAfterX)`. This is
  the house rule (`../../../AGENTS.md` states it as Required) and it is what makes a listener nameable,
  greppable and individually removable with `removeHooks(name)`. Two corrections to how it is usually
  justified, both worth knowing before you enforce it:
  - **The plugin's own `addHook` does not care about identity.** It pushes whatever reference it was handed
    into `#hooks`, and `removeHooks` removes that same reference — so an inline wrapper registered through
    `this.addHook` *is* cleaned up by `disablePlugin()`. Identity only matters when you register on
    `this.hot.addHook` and later call `this.hot.removeHook` with a separately built function.
  - **About 27 inline-wrapper sites already exist**, across 11 plugins (autoColumnSize, autoRowSize,
    columnSummary, formulas, emptyDataState, dragToScroll, comments, customBorders, mergeCells, dialog,
    contextMenu, dropdownMenu). They work. **Do not bulk-rewrite them in a compliance pass** — two of them
    hold listeners deliberately left bound past `disablePlugin()`. Use the arrow field for new code.
  Never `.bind(this)`: that *does* build a new function per call, so the reference you registered is not the
  one you can remove.
- `addHook`'s third argument is an **order index**: negative runs before the un-indexed listeners, positive
  after. Reach for it only when two plugins must observe the same hook in a fixed order.

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
| 50 | columnSorting | 250 | filters |
| 60 | comments | 260 | formulas |
| 70 | contextMenu | 280 | nestedHeaders |
| 80 | copyPaste | 290 | collapsibleColumns |
| 90 | customBorders | 300 | nestedRows |
| 100 | dragToScroll | 310 | hiddenColumns |
| 110 | manualColumnFreeze | 320 | hiddenRows |
| 120 | manualColumnMove | 330 | trimRows |
| 130 | manualColumnResize | 350 | loading |
| 140 | manualRowMove | 360 | dialog |
| 150 | mergeCells | 370 | emptyDataState |
| 155 | stretchColumns | 375 | notification |
| 160 | multipleSelectionHandles | 900 | pagination |
| | | 950 | dataProvider |
| | | 1000 | undoRedo |

Free slots to pick a new number from: 180, 270, 340, and the 380–890 range. **340 is the only gap between
the trimming plugins (330) and the overlay plugins (350+)**, so it is the slot for a plugin that must enable
after trimming and before the overlays. `900`+ is reserved for plugins that
must see every other plugin's state already settled (Pagination, DataProvider, UndoRedo).

**Priority orders `enablePlugin()`, and nothing else.** It does *not* order hook callbacks by itself — it
does so only transitively, because a hook registered during an earlier `enablePlugin()` lands earlier in that
hook's callback list. Four load-bearing cases, so do not renumber casually:

- NestedHeaders (280) rebuilds the header tree before CollapsibleColumns (290) re-derives its hidden set.
- MoveCells (25) and SelectionHandles (24) settle their drag state before DragToScroll (100) reads it in a hook.
- ColumnSorting (50) before MultiColumnSorting (170).
- UndoRedo (1000) last, so every other plugin's hooks are registered before it starts recording actions.

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

## Where to look next

- Full plugin-authoring workflow: the `handsontable-plugin-dev` skill.
- Hook catalog and registration: `../../../.ai/HOOKS.md`, `../../core/hooks/AGENTS.md`.
- Registry and priority map internals: `../registry.ts`, `../../utils/dataStructures/priorityMap.ts`.
- Index maps a plugin registers: `../../../.ai/INDEX-MAPPING.md`, `../../translations/AGENTS.md`.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='plugins/base'`
