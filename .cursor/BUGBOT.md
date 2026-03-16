# Bugbot review context

Use this project-specific policy during PR reviews.

## Scope

- Always include this root `.cursor/BUGBOT.md`.
- Include any additional `.cursor/BUGBOT.md` files found while traversing upward from changed files.

## Blocking quality rule for backend changes

If a PR modifies files in any of these paths:

- `server/**`
- `api/**`
- `backend/**`

and there are no test changes in any of these paths:

- `**/*.test.*`
- `**/__tests__/**`
- `tests/**`

then report a blocking bug with:

- Title: `Missing tests for backend changes`
- Body: `This PR modifies backend code but includes no accompanying tests. Please add or update tests.`
- Label: `quality`
