# Hook and event system

Deep reference for `handsontable/src/core/hooks/`. This subsystem is the global publish-subscribe event bus that decouples Core, plugins, and user code. It uses a `before*`/`after*` naming convention. Read this when you add a hook, fire a hook, register a plugin hook, subscribe a callback, or debug why a hook does not run, runs in the wrong order, or warns in the console.

For the lean landmines, see `handsontable/src/core/hooks/AGENTS.md`. For the broader system context, see `handsontable/.ai/ARCHITECTURE.md` ("Hooks System" and "Hook / event system").

## What the hook system is

Hooks are the common extension interface. Core, plugins, the `EditorManager`, and the selection layer all fire and listen on the same bus. A Handsontable event functions in two ways at once:

- As a **callback** — code reacts to something that happened (`afterChange`, `afterRender`).
- As **middleware** — code intercepts and transforms a value in flight (`modifyColWidth`, `modifyRowData`), or cancels an action (`beforeChange` returning `false`).

Both modes use the same mechanism: the bus threads a value through every callback and returns it. See "The `run` mechanism" below.

This bus is separate from `src/eventManager.ts`. `EventManager` manages **DOM** event listeners (mouse, keyboard, touch) with delegation and cleanup. The hook bus manages **Handsontable** events. DeepWiki groups both under "Event System"; keep them distinct. This document covers the hook bus only.

## The singleton and the per-instance buckets

There is one global `Hooks` singleton, reached with `Hooks.getSingleton()` (`src/core/hooks/index.ts`). The singleton holds:

- A `globalBucket` — one `HooksBucket` for callbacks registered globally, with no instance context. A global callback fires for every Handsontable instance.
- A per-instance `HooksBucket` for each Handsontable instance. The singleton lazily creates and stores it on the instance as `context.pluginHookBucket` the first time a callback is added with that context.

```
                 Hooks.getSingleton()  (one per page)
                 ┌───────────────────────────────────┐
                 │ globalBucket : HooksBucket        │  ← global callbacks (all instances)
                 └───────────────────────────────────┘
                               │ getBucket(context)
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
   hotA.pluginHookBucket  hotB.pluginHookBucket  ...
   (HooksBucket)          (HooksBucket)
   instance-local         instance-local
```

`getBucket(context)` returns the instance bucket when a context is passed, and the `globalBucket` when it is not. So the same singleton routes a callback to the right bucket based on whether a context was supplied.

### `HooksBucket`

`HooksBucket` (`src/core/hooks/bucket.ts`) stores callbacks per hook name in a `Map<string, HookEntry[]>`. Each `HookEntry` has `callback`, `orderIndex`, `runOnce`, `initialHook`, and `skip`. The bucket constructor seeds an empty array for every name in `REGISTERED_HOOKS`, so known hooks start with a collection.

Two mechanics are load-bearing:

- **Soft delete via `skip`.** `remove` does not splice the array. It sets `skip = true` on the entry and increments a per-name skipped counter. `run` ignores entries whose `skip` is `true`. The array is compacted (filtered) only when the skipped counter passes `MAX_SKIPPED_HOOKS_COUNT` (100). This keeps `run` allocation-free during normal add/remove churn. Re-adding the same callback flips `skip` back to `false` rather than pushing a duplicate.
- **Duplicate add is silently ignored.** `add` looks up the callback by reference. If the same function is already registered for that name, the call returns without adding a second entry.

## The `Hooks` class API

These methods live on the `Hooks` class (`src/core/hooks/index.ts`). Most application code does not call them directly — it uses the Core-level wrappers below or the config object. Plugins call `Hooks.getSingleton().register(...)` at module level.

| Method | Signature | What it does |
|---|---|---|
| `getSingleton()` | static, — | Returns the global `Hooks` singleton. |
| `getBucket(context?)` | `(context = null)` | Returns the instance bucket for `context`, or the global bucket when `context` is null. Creates the instance bucket on first use. |
| `add(key, callback, context?, orderIndex?)` | | Adds a listener. Global when `context` is null, instance-local otherwise. Accepts a single function or an array. Warns when `key` is in `REMOVED_HOOKS` or `DEPRECATED_HOOKS`. Returns the `Hooks` instance. |
| `once(key, callback, context?, orderIndex?)` | | Same as `add`, but the entry is marked `runOnce` and removed after it fires once. Does **not** emit removed/deprecated warnings. |
| `addAsFixed(key, callback, context?)` | | Adds a callback into a single reserved "initial hook" slot. A later `addAsFixed` for the same name overwrites that slot's callback rather than appending. Used by config-object function hooks (see below). Does **not** emit removed/deprecated warnings. |
| `remove(key, callback, context?)` | | Soft-removes a listener (sets `skip`). Returns `true` if found, `false` otherwise. The callback reference must match the one added. |
| `has(key, context?)` | | Returns `true` if the bucket holds at least one entry for `key`. |
| `run(context, key, p1..p6)` | | Runs all global then all instance callbacks for `key`. Returns the threaded value. See below. |
| `register(key)` | | Adds `key` to `REGISTERED_HOOKS` if absent. Used by plugins that introduce a hook. |
| `deregister(key)` | | Removes `key` from `REGISTERED_HOOKS`. |
| `isRegistered(key)` | | Returns `true` if `key` is in `REGISTERED_HOOKS`. |
| `isDeprecated(key)` | | Returns `true` if `key` is in `DEPRECATED_HOOKS` **or** `REMOVED_HOOKS`. |
| `getRegistered()` | | Returns the `REGISTERED_HOOKS` array. |
| `destroy(context?)` | | Destroys the bucket for `context`, or the global bucket. |

Note: there is no `addHook`/`runHooks` method on the `Hooks` class. Those names exist only on the Core instance (next section). On the `Hooks` class the verbs are `add`/`once`/`remove`/`has`/`run`.

## The Core-level API

`core.ts` exposes thin wrappers on every Handsontable instance. They bind the singleton to that instance's context, so application code never passes a context manually.

| Core method | Delegates to | Notes |
|---|---|---|
| `hot.addHook(key, callback, orderIndex?)` | `Hooks.getSingleton().add(key, callback, instance, orderIndex)` | Adds an instance-local listener. |
| `hot.addHookOnce(key, callback, orderIndex?)` | `Hooks.getSingleton().once(key, callback, instance, orderIndex)` | Adds an instance-local one-shot listener. |
| `hot.removeHook(key, callback)` | `Hooks.getSingleton().remove(key, callback, instance)` | Removes an instance-local listener. The callback reference must match. |
| `hot.hasHook(key)` | `has(key, instance) \|\| has(key)` | Checks the instance bucket **and** the global bucket. |
| `hot.runHooks(key, p1..p6)` | `Hooks.getSingleton().run(instance, key, ...)` | Fires the hook and returns the threaded value. |

The typed overloads for these methods live on the `HotInstance` interface in `src/core/types.ts`:

```ts
addHook<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, orderIndex?: number): void;
addHook(key: string, callback: HookCallback | HookCallback[], orderIndex?: number): void;
```

The first overload gives IDE autocomplete on hook names and parameter types. The second accepts any string for custom hooks.

## The `run` mechanism

`Hooks.run(context, key, p1..p6)` is the dispatcher. Read it as a single value-threading pass over two buckets in order:

1. Run every non-skipped entry in the **global** bucket for `key`.
2. Then run every non-skipped entry in the **instance** bucket for `key`.

For each entry:

- The callback is invoked with `context` as `this` and the up-to-six arguments.
- If the callback returns a value other than `undefined`, that return value **replaces `p1`**. The next callback receives the replaced `p1`.
- If the entry is `runOnce`, it is removed after it fires.

After both buckets run, `run` returns the final `p1`.

```
run(context, key, p1, ...rest)
   │
   ├─ global bucket entries for key  ─┐
   │     each: res = cb.call(context, p1, ...rest)   │ threads p1
   │           if res !== undefined → p1 = res      │
   │                                                 ▼
   └─ instance bucket entries for key ─┐    (p1 carried forward)
         each: res = cb.call(context, p1, ...rest)
               if res !== undefined → p1 = res
                                                  │
                                                  ▼
                                          return p1
```

This one mechanism produces every hook behavior:

- **`before*` cancellation.** A `before*` callback that returns `false` makes `run` return `false`. The Core **call site** then checks the return value and aborts the action. The bus does not cancel anything itself — it threads the value, and the caller decides. So returning `false` from a `before*` hook only cancels because Core reads the result.
- **`after*` notification.** An `after*` callback's return value still replaces `p1`, but Core does not act on the result of an `after*` hook. So an `after*` hook cannot cancel anything. Do not put cancellation logic in an `after*` hook.
- **`modify*` transformation.** A `modify*` callback returns the transformed value, which threads to the next callback and back to the caller, which uses it.

The `run` loop uses index-based `while` loops and `fastCall` on purpose. The source comment warns against rewriting it with `arrayEach` or arrow functions, because that regresses performance through garbage collection in this hot path. Do not refactor it for style.

## Call ordering — `orderIndex`

Within one bucket, entries run in array order. `orderIndex` controls that order:

- `orderIndex > 0` — runs after entries with a lower index (added "later").
- `orderIndex < 0` — runs before entries with a higher index (added "earlier").
- `orderIndex === 0` or omitted — runs between the negative and positive groups, in insertion order.

The bucket sorts by `orderIndex` (stable, ascending) only when a non-zero index is present. Global callbacks always run before instance callbacks regardless of `orderIndex`, because `run` processes the global bucket first.

## Registration — how a hook becomes known

A hook name must be **registered** for buckets to seed a collection for it and for `isRegistered` to return `true`. Built-in hooks and plugin hooks register differently.

### Built-in hook — the two-step

To add a new built-in hook, do **both** steps. Each step serves a different purpose.

1. **Register the name.** Add the string to the `REGISTERED_HOOKS` **array literal** in `src/core/hooks/constants.ts`. This makes the bus recognize the hook (`isRegistered`, bucket seeding, the config-object detector).
2. **Type the callback.** Add the callback signature to the `GridSettings` interface in `src/core/settings.ts`. The `Events` type is derived from `GridSettings`:

   ```ts
   // src/core/settings.ts
   type HookKey = {
     [K in keyof GridSettings]-?: NonNullable<GridSettings[K]> extends (...args: any[]) => any ? K : never;
   }[keyof GridSettings];

   export type Events = Required<Pick<GridSettings, HookKey>>;
   ```

   So `Events` is every `GridSettings` key whose value is a function. The typed `addHook<K extends keyof Events>` overload draws its autocomplete from `Events`. A hook absent from `GridSettings` works at runtime but has no type and no autocomplete.

Miss step 1 and the bus does not recognize the name. Miss step 2 and the hook has no IDE support. When changing a hook signature, add a TypeScript regression test (`src/__tests__/core/settings.types.ts`) alongside the runtime test.

> Type locations. Consumers import hook types from the package: `import type { Events } from 'handsontable'`, where `Events` maps each hook name to its callback signature — see `docs/content/guides/tools-and-building/typescript-types/typescript-types.md`. To add a built-in hook in core, edit the source: the `GridSettings` interface in `src/core/settings.ts` (from which `Events` derives) and the `REGISTERED_HOOKS` array in `src/core/hooks/constants.ts`. The `register()` method in `src/core/hooks/index.ts` is the runtime call plugins use to add their own hook names (next section), not where built-in names are declared.

### Plugin hook — register at module level

A plugin that introduces its own hook registers the name at **module level, outside the class**, so it runs once on import:

```ts
import { Hooks } from '../../core/hooks';

Hooks.getSingleton().register('beforeMyAction');
Hooks.getSingleton().register('afterMyAction');

export class MyPlugin extends BasePlugin {
  // ...
}
```

`register` appends to `REGISTERED_HOOKS` if absent. The plugin then fires the hook with `this.hot.runHooks('beforeMyAction', ...)`. Add the same names to `GridSettings` for typing.

## How callbacks attach

Three paths attach a listener. They route to the same buckets.

### Config object

A hook passed in the constructor settings or `updateSettings` attaches automatically. `core.ts` walks the settings and, for any key where `isRegistered(key) || isDeprecated(key)` is true, treats the value as a hook:

- A **function** value attaches through `addAsFixed` into the reserved initial-hook slot, and is also written onto `tableMeta`.
- An **array** of functions attaches through `add`.

```js
new Handsontable(el, {
  afterChange(changes, source) { /* attaches as an instance-local hook */ },
});
```

Because `addAsFixed` is used for the function form, a config-object function hook does **not** trigger the removed/deprecated warning. The array form goes through `add` and does warn.

### `this.addHook` in a plugin (auto-cleanup)

Inside a `BasePlugin`, `this.addHook(name, callback, orderIndex?)` records the callback in the plugin's private `#hooks` map and then calls `this.hot.addHook`. On `disablePlugin` and `destroy`, `BasePlugin` calls `clearHooks`, which removes every recorded callback through `this.hot.removeHook`. So a plugin hook added with `this.addHook` is cleaned up automatically. This is the version to use in plugin code.

### `this.hot.addHook` (manual cleanup)

`this.hot.addHook` adds the listener but does **not** record it in the plugin. You must call `this.hot.removeHook(name, callback)` yourself, with the same callback reference. Use this only when you need a listener that outlives `disablePlugin`. Otherwise prefer `this.addHook`.

Pass hook callbacks as arrow-function class fields and pass them directly:

```ts
#onAfterChange: Hook<'afterChange'> = (changes, source) => { /* ... */ };

enablePlugin() {
  this.addHook('afterChange', this.#onAfterChange);
  super.enablePlugin();
}
```

Do not wrap the callback in an inline arrow (`(args) => this.#onAfterChange(args)`) and do not use `.bind(this)`. A stable reference is required so `removeHook` can find and remove it. `Hook<K>` is exported from `src/core/settings.ts` and types the field to the hook's signature.

## Removed and deprecated hooks

Two maps in `constants.ts` mark hook names that should no longer be used.

| Map | Type | Meaning | Current contents |
|---|---|---|---|
| `REMOVED_HOOKS` | `Map<string, string>` | Hook name → the version it was removed in. | `modifyRow`, `modifyCol`, `unmodifyRow`, `unmodifyCol`, `skipLengthCache`, `hiddenColumn`, `hiddenRow` — all `'8.0.0'`. |
| `DEPRECATED_HOOKS` | `Map<string, string>` | Hook name → the warning message to print. | Empty on this branch. |

Behavior, verified against `add` in `index.ts` and `warn` in `src/helpers/console.ts`:

- When `add` (or the config-object array path) attaches a callback for a name in `REMOVED_HOOKS`, it prints a `console.warn` built from a template that names the hook and the removal version and links to the release notes.
- When the name is in `DEPRECATED_HOOKS`, it prints the stored message via `console.warn`.
- **Both are warnings, not errors.** Using a removed or deprecated hook does not throw. The action still proceeds; the listener still attaches and runs.
- **The warning fires every time `add`/`once` runs for that name, not once.** `warn` calls `console.warn` directly with no deduplication. There is no once-guard in the hook path or in `warn`.

> Repo-vs-doc conflict (repo wins). The breaking-changes policy in `handsontable/AGENTS.md` describes removed hooks as showing "an error" and deprecated APIs producing a warning "fired only once." For the **hook** path, the code does neither: removed and deprecated hooks both emit a non-deduplicated `console.warn`. When you remove or rename a public hook, add it to `REMOVED_HOOKS` with the removal version so misuse surfaces in the console. Removing or renaming a public hook is a breaking change — deprecate it first.

## Cross-references

- `handsontable/src/core/hooks/AGENTS.md` — the lean landmines for this directory.
- `handsontable/.ai/ARCHITECTURE.md` — "Hooks System" (component) and "Hook / event system" (mechanism and taxonomy) place this subsystem in the wider system.
- `handsontable/.ai/META-MANAGEMENT.md` — the `beforeGetCellMeta`/`afterGetCellMeta` local hooks and the dynamic-meta path that consumes them.
- Skill: `handsontable-plugin-dev` — the plugin lifecycle, where to register hooks, and the `this.addHook` versus `this.hot.addHook` choice.
