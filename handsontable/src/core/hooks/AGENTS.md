# Hook / event system — landmines

This directory holds the `Hooks` singleton, the per-instance `HooksBucket`, and the hook-name constants. It is the global publish-subscribe bus that decouples Core, plugins, and user code through a `before*`/`after*` convention. Full reference: `handsontable/.ai/HOOKS.md`.

- **Adding a new built-in hook is a TWO-step.** (1) Add the name to the `REGISTERED_HOOKS` array literal in `constants.ts` — this makes the bus recognize it. (2) Add the callback signature to the `GridSettings` interface in `src/core/settings.ts` — the `Events` type derives from it and gives `addHook<K>` autocomplete. Miss step 1 and the hook is unrecognized; miss step 2 and it has no typing.
- **Plugins that introduce a hook call `Hooks.getSingleton().register('beforeMyAction')` at MODULE level, outside the class.** This appends to `REGISTERED_HOOKS` once on import. Still add the signature to `GridSettings` for typing.
- **`before*` cancels by returning `false`; `after*` cannot.** Cancellation works only because the Core call site checks the value `run` threads back. An `after*` return value is ignored by Core. Never put cancellation logic in an `after*` hook.
- **In a plugin use `this.addHook(...)` — it auto-removes on `disablePlugin`/`destroy`.** `this.hot.addHook(...)` needs a manual `this.hot.removeHook(...)` with the same reference. Pass callbacks as arrow-function class fields directly (`this.addHook('afterX', this.#onAfterX)`); never wrap in an inline arrow and never `.bind(this)` — `removeHook` needs a stable reference. Matches `handsontable/AGENTS.md`.
- **Removed/deprecated hooks WARN, they do not throw — and the warning is NOT once.** `add`/`once` call `console.warn` on every attach for a name in `REMOVED_HOOKS` or `DEPRECATED_HOOKS`; there is no dedup. (The breaking-changes policy says "error" and "once" — stale for the hook path; repo wins.) Removing or renaming a public hook is a breaking change: deprecate first, then add it to `REMOVED_HOOKS` with the removal version so misuse surfaces.
- **Global singleton vs per-instance buckets.** `Hooks.getSingleton()` holds a `globalBucket` (fires for all instances) and one `HooksBucket` per instance (`context.pluginHookBucket`). `run` fires global callbacks first, then instance callbacks. `orderIndex` orders entries within a bucket (`< 0` earlier, `> 0` later, `0`/omitted in between).
- **Do not refactor the `run` loop for style.** It uses `while` loops over a linked list and `fastCall` on purpose; arrow functions or `arrayEach` there regress performance through GC. `remove` is a **true delete** (the list is relinked) — there is no `skip` flag and no compaction threshold; a duplicate `add` is silently ignored, and that reference check runs before the `initialHook` branch, so a repeated `addAsFixed` with the same callback is a no-op too.
- **`beforeInit` is the one settings-declared hook registered outside the `updateSettings` walk.** That walk is what attaches callbacks written in the settings object, and `init()` runs it *after* firing `beforeInit` — so `core.ts` registers `beforeInit` alone up front, right before `runHooks('beforeInit')` (GitHub issue #5933). Keep both call sites on the shared `registerSettingsHook()` helper. Do **not** pull the rest of the settings object forward: plugins attach their feature hooks inside `enablePlugin()`, which runs during the `beforeInit` dispatch, so an early bulk registration would order settings-declared callbacks ahead of every plugin callback. `construct` and `afterPluginsInitialized` have the same timing problem and are documented on their JSDoc as global-only rather than fixed.
- **A settings hook set to `null` is removed; `undefined` is "not passed".** `registerSettingsHook()` removes every bucket entry of the hook the settings registered and stores `null`. That is more than `getSettings()[hook]` holds: an array is added beside the fixed callback, never replacing it, so after `afterChange: fn` and then `afterChange: [g]` both run, and removing only `[g]` left `fn` running with nothing in the settings pointing at it. **It removes only entries the settings registered, never an `addHook()` listener**: settings callbacks go in through `Hooks#_addFromSettings()`, which marks the bucket entry `fromSettings`, and come out through `Hooks#_removeFromSettings()` / `HooksBucket#removeFromSettings()`, which skip an unmarked entry. A duplicate `add()` keeps one entry for one function, so the mark is cleared whenever any other registration (`addHook()`, the public `addAsFixed()`) meets the same callback; without that, `null` removed an `addHook()` listener that happened to be the same function the settings passed. Such a claim also clears `initialHook`, or the next settings function replaced the `addHook()` listener in place; a `runOnce` duplicate (`addHookOnce()`) is dropped and claims nothing. `HooksBucket#removeFromSettings()` removes in one pass and points every removed entry at the next entry that stays: an array callback that sets its own hook to `null` mid-run used to walk on through the other removed entries and run them. `HooksBucket#replaceFromSettings()` (`Hooks#_replaceFromSettings()`, used by the sheets bar) makes the settings entries exactly a given value instead: a function goes into the fixed entry in place, an array keeps the entries it names where they are, and the rest go. Never route the removal through the public `Hooks#remove()`, which matches by callback alone. Only `null` removes: `undefined` has always meant "not passed" for a hook key, and a host or a wrapper that spreads a settings object with `undefined` keys on every update would otherwise drop its callbacks on each call. A listener added with `addHook()` is a different entry and is never touched. Pinned by `src/__tests__/core/settingsHookRemoval.unit.js`. The wrappers still send nothing for a hook prop the app removes, so that callback keeps running there.
- **A function that only forwards to a callback counts as that callback** (`FORWARDED_HOOK_CALLBACK` in
  `bucket.ts`, the `Symbol.for('handsontable.forwardedHookCallback')` key). Each entry stores that identity
  (`HookEntry.identity`, read once by `callbackIdentity()` when the entry is added, and set again wherever the
  entry's callback is swapped), and every identity test of the bucket (the duplicate check of `add()`,
  `remove()`, and both branches of `replaceFromSettings()`) compares it, so no test reads the key off a
  function per node. The Angular wrapper runs a hook its `settings` input declares inside Angular's zone by
  registering a wrapper function, and without the key the bucket saw two listeners: a callback the app also
  passed to `addHook()` ran twice, and `removeHook()` with the callback removed nothing. Three rules ride along.
  (1) When the second add is the forwarding function, it takes the entry's place (`#claimDuplicate()`): the
  app may have called `addHook(fn)` before the wrapper arrived through the settings, and keeping the plain
  callback ran the hook outside the zone. (2) A settings function that claims an entry first added through
  `addHook()` removes the other settings entries of that hook, the way a new settings function replaces the
  old one: otherwise settings `g`, then `addHook(f)`, then settings `f` left `g` running. That holds for every
  grid, with or without a wrapper. (3) A lasting registration (`addHook()`, the settings) that meets an
  `addHookOnce()` entry turns it into a lasting entry with its own flags, deciding rule (2) from the entry's
  flags before it overwrites them: keeping `runOnce` made a declared hook run once and vanish, and with rule (2)
  nothing ran after the first call. A second `addHookOnce()` still leaves the entry once. The key is a
  `Symbol.for()` so the wrapper, bundled apart from core, needs no import. Pinned by the "a function that
  forwards to a callback", "a settings function already added through `addHook()`" and "a lasting
  registration of a callback first added with `addHookOnce()`" blocks of `__tests__/bucket.unit.ts`.
- **The four execution hooks (`before`/`afterSuspendExecution`, `before`/`afterResumeExecution`) fire on the
  state change only, and `afterResumeExecution` is a release point.** `Core#suspendExecution()` fires the suspend
  pair when the counter goes 0 to 1, `Core#resumeExecution()` fires the resume pair when it comes back to 0;
  nested, forced nested and stray calls fire nothing, and all four are silent once `destroy()` has started (its
  teardown `batchExecution()` resumes after `afterDestroy`). Before hooks see the old state, after hooks the new
  one, and `afterResumeExecution` runs after both index mappers resumed. A plugin may hold something from the
  suspend pair until `afterResumeExecution` (Formulas does), so three rules keep the pairs balanced: a throwing
  `afterSuspendExecution` listener makes `suspendExecution()` resume through the resume pair and rethrow; a throw
  from `beforeResumeExecution` or from a cache update still updates the counter, resumes both mappers and fires
  `afterResumeExecution` (a later throw replaces an earlier one); and `batch()`, `batchExecution()` and
  `safeBatch()` keep `resumeRender()` and `resumeExecution()` in `finally` blocks around the suspend. Renders
  suspend the execution too (AutoColumnSize, AutoRowSize), so a listener that renders re-enters the hooks.
  A suspend or resume a `before*` listener makes on the same grid fires no hooks
  (`isRunningBeforeExecutionHook` in `core.ts`): the counter is still unchanged while that listener runs, so
  the call would fire the hook again and recurse. `resumeExecution()` therefore decrements the LIVE counter
  after `beforeResumeExecution` and fires `afterResumeExecution` only when the execution is really resumed;
  a listener that leaves a suspension open keeps the grid suspended, and `beforeResumeExecution` fires AGAIN
  with the call that ends it (two before events for one after event; a listener that always re-suspends never lets
  the grid resume). The mirror case holds for `beforeSuspendExecution`: a suspension its listener leaves open
  outlives the caller's matching resume. A throw from `beforeSuspendExecution`/`beforeResumeExecution` clears
  the flag in a `finally`.
  When the callback of `batch()`/`batchExecution()`/`safeBatch()` throws and a resume listener throws as well,
  the listener's error replaces the callback's (`finally` semantics; `suspendExecution()`'s own rollback keeps
  the original cause).
  Pinned by `src/__tests__/core/executionSuspendHooks.unit.js`.

Pointers:
- Deep reference: `handsontable/.ai/HOOKS.md`
- `handsontable/.ai/ARCHITECTURE.md` — "Hooks System" and "Hook / event system"
- Skill: `handsontable-plugin-dev`
