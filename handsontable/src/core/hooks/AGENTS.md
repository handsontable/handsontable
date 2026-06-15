# Hook / event system — landmines

This directory holds the `Hooks` singleton, the per-instance `HooksBucket`, and the hook-name constants. It is the global publish-subscribe bus that decouples Core, plugins, and user code through a `before*`/`after*` convention. Full reference: `handsontable/.ai/HOOKS.md`.

- **Adding a new built-in hook is a TWO-step.** (1) Add the name to the `REGISTERED_HOOKS` array literal in `constants.ts` — this makes the bus recognize it. (2) Add the callback signature to the `GridSettings` interface in `src/core/settings.ts` — the `Events` type derives from it and gives `addHook<K>` autocomplete. Miss step 1 and the hook is unrecognized; miss step 2 and it has no typing.
- **Plugins that introduce a hook call `Hooks.getSingleton().register('beforeMyAction')` at MODULE level, outside the class.** This appends to `REGISTERED_HOOKS` once on import. Still add the signature to `GridSettings` for typing.
- **`before*` cancels by returning `false`; `after*` cannot.** Cancellation works only because the Core call site checks the value `run` threads back. An `after*` return value is ignored by Core. Never put cancellation logic in an `after*` hook.
- **In a plugin use `this.addHook(...)` — it auto-removes on `disablePlugin`/`destroy`.** `this.hot.addHook(...)` needs a manual `this.hot.removeHook(...)` with the same reference. Pass callbacks as arrow-function class fields directly (`this.addHook('afterX', this.#onAfterX)`); never wrap in an inline arrow and never `.bind(this)` — `removeHook` needs a stable reference. Matches `handsontable/AGENTS.md`.
- **Removed/deprecated hooks WARN, they do not throw — and the warning is NOT once.** `add`/`once` call `console.warn` on every attach for a name in `REMOVED_HOOKS` or `DEPRECATED_HOOKS`; there is no dedup. (The breaking-changes policy says "error" and "once" — stale for the hook path; repo wins.) Removing or renaming a public hook is a breaking change: deprecate first, then add it to `REMOVED_HOOKS` with the removal version so misuse surfaces.
- **Global singleton vs per-instance buckets.** `Hooks.getSingleton()` holds a `globalBucket` (fires for all instances) and one `HooksBucket` per instance (`context.pluginHookBucket`). `run` fires global callbacks first, then instance callbacks. `orderIndex` orders entries within a bucket (`< 0` earlier, `> 0` later, `0`/omitted in between).
- **Do not refactor the `run` loop for style.** It uses index `while` loops and `fastCall` on purpose; arrow functions or `arrayEach` there regress performance through GC. `remove` is a soft delete (`skip` flag), compacted only past `MAX_SKIPPED_HOOKS_COUNT` (100); a duplicate `add` is silently ignored.

Pointers:
- Deep reference: `handsontable/.ai/HOOKS.md`
- `handsontable/.ai/ARCHITECTURE.md` — "Hooks System" and "Hook / event system"
- Skill: `handsontable-plugin-dev`
