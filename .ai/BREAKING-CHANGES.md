# Breaking changes policy (monorepo-wide)

**Agents must try to avoid introducing breaking changes.** This is the single most important constraint. Existing customers depend on API stability. When a solution requires a breaking change, state it in **bold**.

The lean rule lives in the root `AGENTS.md` "Breaking changes policy" section (always loaded). This file is the full reference.

## What counts as a breaking change

| Change | Why it breaks | What to do instead |
|---|---|---|
| Renaming a CSS class produced by Handsontable | Breaks custom stylesheets | Keep the legacy class name in the DOM. Add tests verifying the old name still works. |
| Renaming APIs (methods, configuration options, hooks) | Breaks customer integrations | Keep the legacy API working and translate it to the new API internally. Legacy APIs do not produce console warnings. |
| Changing API signatures or behavior | Breaks customer integrations | Keep the deprecated API working until the next stable release. Deprecated APIs produce a console warning (fired only once). |
| Removing hooks or configuration options | May go undetected by customers | Add the hook or option to the list of removed hooks so an error shows when someone uses it in configuration. |
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
- **Deprecated**: Old API works until the next stable release, then is removed. Produces a one-time console warning. Tests must verify the old name keeps working until removal.

## What is NOT considered breaking

Changes to JavaScript APIs not listed in the public API reference (e.g., internal Walkontable code that does not affect the DOM or CSS). Note such changes in release notes.
