# Bugbot review context (Handsontable)

Use this policy for PR reviews in this monorepo.

## Scope

- Always include this root `.cursor/BUGBOT.md`.
- Include additional `.cursor/BUGBOT.md` files found while traversing upward from changed files.

## Repository-level checks

1. Changelog requirement:
   - If package source code changes, require a new `/.changelogs/*.json` file.
2. Test requirement for core behavior changes:
   - For changes under `/handsontable/src/**` that alter behavior, require both:
     - unit tests (`*.unit.js`)
     - e2e tests (`*.spec.js`).
3. Public API docs + typing requirement:
   - For new public options/methods, require JSDoc updates and matching updates in `/handsontable/types/**`.

## Blocking quality rule for backend changes

If a PR modifies files in any of these paths:
- `server/**`
- `api/**`
- `backend/**`

and there are no test changes in any of these paths:
- `**/*.test.*`
- `**/__tests__/**`
- `tests/**`

then add a blocking bug with:
- Title: `Missing tests for backend changes`
- Body: `This PR modifies backend code but includes no accompanying tests. Please add or update tests.`
- Label: `quality`
