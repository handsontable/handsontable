# Breaking changes policy (monorepo-wide)

**Agents must try to avoid introducing breaking changes.** This is the single most important constraint. Existing customers depend on API stability. When a solution requires a breaking change, state it in **bold**.

The lean rule lives in the root `AGENTS.md` "Breaking changes policy" section (always loaded). This file is the full reference.

## What counts as a breaking change

| Change | Why it breaks | What to do instead |
|---|---|---|
| Renaming a CSS class produced by Handsontable | Breaks custom stylesheets | Keep the legacy class name in the DOM. Add tests verifying the old name still works. |
| Renaming APIs (methods, configuration options, hooks) | Breaks customer integrations | Keep the legacy API working and translate it to the new API internally. Legacy APIs do not produce console warnings. |
| Changing API signatures or behavior | Breaks customer integrations | Keep the deprecated API working until the next major release. Deprecated APIs produce a console warning (fired only once). |
| Removing hooks or configuration options | May go undetected by customers | Add the hook to `REMOVED_HOOKS` in `handsontable/src/core/hooks/constants.ts`, or the option to `REMOVED_OPTIONS` in `handsontable/src/core.ts`, so a one-time warning shows when someone uses it in configuration. The warning names the removing version and carries no `Deprecated:` prefix (`removedWarnOnce`, not `deprecatedWarnOnce`). |
| Changing a default setting value | 🚫 **Strictly forbidden** — a "really bad" breaking change. | Never change defaults. |

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
