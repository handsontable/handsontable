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

## Legacy vs deprecated

- **Legacy**: Old API kept working forever alongside the new API. No console warnings. The legacy feature set may be frozen. Tests must verify the old name keeps working.
- **Deprecated**: Old API works until the next stable release, then is removed. Produces a one-time console warning. Tests must verify the old name keeps working until removal.

## What is NOT considered breaking

Changes to JavaScript APIs not listed in the public API reference (e.g., internal Walkontable code that does not affect the DOM or CSS). Note such changes in release notes.
