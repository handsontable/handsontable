# Breaking changes policy (monorepo-wide)

**Agents must try to avoid introducing breaking changes.** This is the single most important constraint. Existing customers depend on API stability. When a solution requires a breaking change, state it in **bold**.

The lean rule lives in the root `AGENTS.md` "Breaking changes policy" section (always loaded). This file is the full reference.

## What counts as a breaking change

| Change | Why it breaks | What to do instead |
|---|---|---|
| Renaming a CSS class produced by Handsontable | Breaks custom stylesheets | Keep the legacy class name in the DOM. Add tests verifying the old name still works. |
| Renaming APIs (methods, configuration options, hooks) | Breaks customer integrations | Keep the legacy API working and translate it to the new API internally. Legacy APIs do not produce console warnings. |
| Changing API signatures or behavior | Breaks customer integrations | Keep the deprecated API working until the next major release. Deprecated APIs produce a console warning (fired only once). |
| Removing hooks or configuration options | May go undetected by customers | Add the hook to `REMOVED_HOOKS` in `handsontable/src/core/hooks/constants.ts`, or the option to `REMOVED_OPTIONS` in `handsontable/src/core.ts`, so a warning shows when someone uses it in configuration. Both warnings name the removing version and carry no `Deprecated:` prefix. The option warning is one-time (`removedWarnOnce`, not `deprecatedWarnOnce`); the hook warning goes through plain `warn()` on every `add()` and links to the release notes (see `handsontable/.ai/HOOKS.md`). |
| Changing a default setting value | 🚫 **Strictly forbidden** — a "really bad" breaking change. | Never change defaults. |

## Narrowing a callback parameter typed `any`

Elaborates the "Changing API signatures" row above. A public option or hook whose callback declares a parameter as `any` (or absorbs it in `...args: any[]`) cannot be narrowed to a named type without risking a build break, on three independent axes. Verified with `tsc` on the `sanitizer` option in DEV-2620.

| Axis | What breaks | Error |
|---|---|---|
| Assignment contravariance | Under `strictFunctionTypes`, a **function-typed property** checks its parameters contravariantly, so a consumer callback annotating the parameter more narrowly than you declare it is rejected. **Method** syntax (`opt?(a, b): R`) is exempt and clears this axis. | TS2322 |
| Call arity | A declared parameter ahead of a rest parameter raises the option's minimum **call** arity, so a consumer who reads the option back out and invokes it with the old argument count fails. Independent of method vs property syntax — both forms break this way. | TS2555 |
| Optionality | Declaring the parameter optional fixes the arity axis but types it `T \| undefined`, so any consumer body using it as a definite value fails. | TS2345 / TS18048 |

Assignability and callability are separate checks: a type test that only assigns callbacks will not catch the arity axis.

Shapes tested in DEV-2620, none of which clears all three: function-typed property, method syntax, optional parameter, overloads, labeled-tuple rest (`...args: [b?: T, ...rest: any[]]`), and rest union (`[] | [b: T, ...rest: any[]]`). This is the set that was measured, not a proof that no signature can exist.

**The non-breaking route**: leave the callback's signature untouched and export the union as a named type that consumers opt into on their own parameter. That is zero-break by construction. Reach for method syntax only when declaring a **new** callback, where there is no installed base to break.

## Legacy vs deprecated

- **Legacy**: Old API kept working forever alongside the new API. No console warnings. The legacy feature set may be frozen. Tests must verify the old name keeps working.
- **Deprecated**: Old API works until the next major release, then is removed. Produces a one-time console warning. Tests must verify the old name keeps working until removal.

## Deprecation checklist

When you deprecate a public API, do all of the following in the same PR:

1. JSDoc: `@deprecated Since X.Y.Z. <reason>. It will be removed in <next major>. Use <replacement> instead.` – never a bare `@deprecated` (the API docs render the text as a warning box).
2. Runtime (methods, options, helpers): call `deprecatedWarnOnce('<Owner>.<name>', '<message>')` from `handsontable/src/helpers/console.ts`. Types cannot warn; the JSDoc tag is enough.
3. Tests: keep a test proving the old API still works, and one proving the warning prints once. The once-state is module-global, so call `_resetDeprecationWarnings()` (from `handsontable/src/helpers/console.ts`) in `beforeEach` – otherwise the assertion silently passes whenever another spec printed that warning first.
4. Docs: add a row to `docs/content/guides/upgrade-and-migration/deprecation-policy/deprecation-policy.md` ("List of current deprecations") and, when the release has a migration guide (minor releases usually do not), a step in it.
5. Changelog: `.changelogs/<PR>.json` with `"type": "deprecated"`.
6. Removal happens only in the next major release, at least 3 months later: delete the code, move the docs row to "Removed in version N.0", add a `"type": "removed", "breaking": true` changelog entry, and add a migration step.

## What is NOT considered breaking

Changes to JavaScript APIs not listed in the public API reference (e.g., internal Walkontable code that does not affect the DOM or CSS). Note such changes in release notes.
