# AutoLink plugin — anchors from rendered text, never from the value

`autoLink.ts` owns the option and the `afterRenderer` pass; `linkifyCell.ts` owns the DOM work; `resolveSettings.ts`
owns the grid/cell settings merge. Read this before touching either, or `../../utils/cellLinks/`, which this plugin
shares with `Formulas`.

## What it owns and what it does not

- Owns: finding URLs in the **rendered text** of a TD and wrapping each in `a.ht-link.ht-auto-link`; removing those
  anchors when the option or plugin goes away; resolving the `target` / `schemes` / `inline` / `className` settings
  per cell.
- Does not own: URL parsing, the scheme allowlist, the anchor factory, unwrapping (`../../utils/cellLinks/`), the
  Alt+Enter chord (`shortcuts/contexts/commands/openCellLink.ts`), or the link styles
  (`styles/components/core/_links.scss`, keyed on `ht-link`).
- Never writes cell meta and never changes the value: copy, autofill, sort, export and search read the value and
  see no anchor.

## The traps

- **Decorate from `TD.textContent`, not from `value`.** The user links what they see, and a `valueFormatter` or a
  custom renderer may show something the raw value does not. Gating on the value would miss or mislink those.
- **Always unwrap first.** Walkontable recycles TDs and a renderer may keep its DOM, so every pass removes
  `a.ht-auto-link` and calls `normalize()` before tokenizing. Skipping the normalize leaves a URL split across two
  text nodes and the tokenizer sees neither half.
- **Skip any TD that already holds an `<a>`.** That is what keeps a HYPERLINK cell, an `html` cell with a user link,
  or a custom renderer's link from ending up as `a > a`. `Formulas` does the mirror move when its cell resolves to a
  link (unwraps every `a.ht-link`, then wraps), so the two converge whichever `afterRenderer` ran first —
  and the order is not fixed, because `updateSettings` can register `Formulas` after this plugin. Whole-cell mode
  (`inline: false`) also refuses a TD holding a `button`, `input`, `select`, or `textarea`, so a checkbox cell whose
  label is a URL does not get its input wrapped in the anchor.
- **`disablePlugin()` must unwrap the whole root and call `markAllCellsChanged()`.** Removing the hook removes
  nothing on screen; a memoizing renderer never repaints, and under `renderMode: 'onChange'` no cell would
  otherwise be marked. Same lesson as `Comments` and `Formulas`. `enablePlugin()` also calls
  `markAllCellsChanged()`, for the mirror reason: under `renderMode: 'onChange'` a bare `enablePlugin()` advances
  no render epoch, so nothing would paint the anchors.
- **Cell-level objects bypass `SETTINGS_VALIDATORS`.** The plugin validators only see the grid-level object, so
  `#resolveSettings` re-checks every key of a column or cell override. `resolveSettings.ts` never widens the fixed
  allowlist: an explicit `[]` at column or cell level keeps that column link-free, and a column or cell `schemes`
  array whose entries are all unknown falls back to the grid-level schemes instead of silently linking nothing (a
  typo must not fail closed at one level and open at another).
- **`javascript:` never tokenizes.** The scheme set is baked into the regex, and `resolveLinkUrl` checks the parsed
  protocol again. Do not "extend" the regex to `[a-z]+:`; the allowlist is the security boundary.
- **The `:` fast path is load-bearing.** Most cells hold no URL; `indexOf(':')` on `textContent` is what keeps the
  regex and the TreeWalker off them on every render.

## Where to look next

- Shared toolkit: `../../utils/cellLinks/` (`resolveLinkUrl`, `findLinkTokens`, `createLinkElement`, `unwrapLinks`).
- The other producer of cell links and its order rule: `../formulas/AGENTS.md`.
- Plugin contract, lifecycle, `PLUGIN_PRIORITY` table: `../base/AGENTS.md`; workflow: the `handsontable-plugin-dev` skill.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='autoLink|cellLinks'` — tokenizer, anchor factory,
  unwrap, and the jsdom linkifier.
- `cd tests && npx playwright test e2e/auto-link.spec.ts e2e/formulas-hyperlink.spec.ts` — run **all six legs**;
  the `umd` legs load HyperFormula as an external script for the both-features cases.
- Rebuild `dist/` (`npm --prefix handsontable run build`) before Playwright; the legs load the bundle, not the source.
