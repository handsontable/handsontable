# Code quality dimension

Review staged or changed code for compliance with Handsontable coding conventions. Run `git diff` (or `git diff --staged`) to collect the changes, then check each item below.

## Checklist

1. **ESLint rules (custom):**
   - Errors must use `throwWithCause('...', cause)` from `src/helpers/errors.ts` - never `throw new Error()`.
   - No imports from barrel index files (`plugins/index`, `editors/index`, `renderers/index`, `validators/index`, `cellTypes/index`, `i18n/index`). Import from the specific submodule path.
   - Every `it()` callback in `*.spec.js` files must be `async`. HOT API calls inside tests must be `await`-ed.
   - No bare `window`, `document`, or `console` globals. Use `this.hot.rootWindow`, `this.hot.rootDocument`, and helpers from `src/helpers/console.ts`.

2. **JSDoc:**
   - All public and private APIs must have JSDoc comments.
   - New hooks and configuration options must include a `@since` tag.
   - Use Markdown formatting, not HTML tags. Line breaks use empty lines, never `<br>`.
   - Use `[[MY_LINK]]` syntax for links, not `{@link MY_LINK}`. End every sentence with a full stop.

3. **Private fields:**
   - Use the `#` prefix for private class fields and methods. Do not use `@private` JSDoc tag unless `#` is avoided for documented performance reasons.

4. **Naming:**
   - Full names required: `row` and `columns`, not `cols`. Use `Handsontable` in text, never `HOT`.
   - Functions: `camelCase`. Classes: `PascalCase`. Constants: `UPPER_SNAKE_CASE`.
   - Public API names must be generic, self-explanatory, and collision-free.

5. **Cognitive complexity:**
   - Each function must stay at 15 or below on the Sonar cognitive-complexity metric. Extract helpers or add early-return guards when exceeded.

6. **Optional chaining (`?.`):**
   - Use only when a value is genuinely optional by design. Do not use as a blanket safety net for values guaranteed by the data contract.

7. **Silent catch blocks:**
   - Every empty or swallowed `catch` must include a comment explaining why the error is ignored.

8. **Browser compatibility:**
   - Verify that all JS and CSS APIs are supported across browsers listed in `browser-targets.js` at the repo root.

9. **Bundle size:**
   - Prefer grammar that produces smaller compressed output (e.g., `===` over verbose helpers, short-circuit evaluation over full `if` blocks).

10. **DRY:**
    - No duplicated logic. Reuse existing helpers and mixins from `src/helpers/`. Extract shared code into utility functions.

11. **Core language boundary:**
    - `handsontable/src/` is **TypeScript** — all source files are `.ts`, including Walkontable (`src/3rdparty/walkontable/src/`). Walkontable is excluded from the main `tsconfig.json` and has its own separate build/test pipeline.
    - Type declarations are **auto-generated** into `handsontable/tmp/*.d.ts` by `build:types` (`tsc -p tsconfig.build-types.json`).
    - Do not hand-edit files in `tmp/`. Regenerate with `npm run build:types` after changing source.

12. **Documentation and AGENTS.md updates:**
    - If the change introduces new conventions, constraints, or gotchas, require an `AGENTS.md` update.
    - User-facing behavior or UX changes require matching docs updates in `docs/content/`.

13. **Public API naming:**
    - New option, hook, and method names must be generic, self-explanatory, and free of internal jargon.
    - Check for collisions with existing API names (options, hooks, methods, plugin keys, CSS classes) before approving.
    - Public API names carry long-term maintenance weight - once released, they must be maintained indefinitely.

## References

- `handsontable/.ai/CONVENTIONS.md` for the complete coding conventions.
- `.eslintrc.js` (root) and `handsontable/.eslintrc.js` for ESLint configuration.
- `browser-targets.js` for supported browser list.
