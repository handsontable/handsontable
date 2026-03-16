# Handsontable core review notes

Apply these checks when changed files are in `handsontable/**`.

- Core source is JavaScript. Do not add TypeScript files under `handsontable/src/`.
- For new or changed behavior, require both unit tests and E2E tests.
- Verify new public methods include JSDoc comments.
- Ensure new feature paths are guarded by flags when applicable.
