# AutoLink plugin — anchors from rendered text, never from the value

`autoLink.ts` owns the option and the `afterRenderer` pass; `linkifyCell.ts` owns the DOM work; `resolveSettings.ts`
owns the grid/cell settings merge. Read this before touching either, or `../../utils/cellLinks/`, which this plugin
shares with `Formulas`.

## What it owns and what it does not

- Owns: finding URLs in the **rendered text** of a TD and wrapping each in `a.ht-link.ht-auto-link`; removing those
  anchors when the option or plugin goes away; resolving the `target` / `schemes` / `inline` / `strict` / `className`
  settings per cell.
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
  otherwise be marked. `enablePlugin()` also calls `markAllCellsChanged()`, for the mirror reason: under
  `renderMode: 'onChange'` a bare `enablePlugin()` advances no render epoch, so nothing would paint the anchors.
  Both `AutoLink` and `Formulas` (since 18.2.0) call `markAllCellsChanged()` in `enablePlugin()`, for that mirror
  reason - `Formulas` gates its call on `#hyperlinksEnabled`, since with `hyperlinks` off there is nothing to
  repaint. `AutoLink` calls it in `disablePlugin()` too, as does `Comments`. `Formulas` calls it on BOTH
  transitions when hyperlinks were or become on - `disablePlugin()`, and the `hyperlinks`-off branch of
  `#refreshHyperlinksSetting()` - even though `#unwrapRenderedHyperlinks()` already removes its own anchors from
  the currently-rendered DOM eagerly, not through a render pass. That eager removal is not the whole story: once a
  `HYPERLINK` anchor is gone, the cell's label is plain URL text again, and only `AutoLink`'s OWN next paint of
  that cell can claim it - so under `renderMode: 'onChange'` the epoch still has to advance, or a freed URL stays
  unlinked until something unrelated repaints it.
- **Cell-level objects bypass `SETTINGS_VALIDATORS`.** The plugin validators only see the grid-level object, so
  `#resolveSettings` re-checks every key of a column or cell override. `resolveSettings.ts` never widens the fixed
  four-scheme allowlist: a column or cell `schemes` REPLACES the grid-level list for those cells (a standard
  cascading override, not a merge), and every level can only narrow the allowlist, never widen it. An explicit `[]`
  at column or cell level keeps that column link-free, and a column or cell `schemes` array whose entries are all
  unknown falls back to the grid-level schemes instead of silently linking nothing (a typo must not fail closed at
  one level and open at another). `#resolveSettings` caches the merged result per override object in
  `#overrideCache` (a `WeakMap`), and caches the `LinkifyOptions` built from it in `#optionsCache` keyed on that
  merged object, so neither the merge-and-validate work nor the `baseUrl` spread repeats on every render for a cell
  whose override object is unchanged; both caches are dropped (a fresh `WeakMap`, which has no `clear()`) in
  `disablePlugin()`.
- **`javascript:` never tokenizes.** The scheme set is baked into the regex, and `resolveLinkUrl` checks the parsed
  protocol again. Do not "extend" the regex to `[a-z]+:`; the allowlist is the security boundary.
- **The `:` fast path is load-bearing.** Most cells hold no URL; `indexOf(':')` on `textContent` is what keeps the
  regex and the TreeWalker off them on every render.
- **The `mailto:`/`tel:` scheme prefix is hidden, not removed.** `hideSchemePrefix` (`../../utils/cellLinks/`)
  wraps it in `span.ht-link-scheme`, which the stylesheet hides — it stays in `textContent` because every render
  re-tokenizes the rendered text, and a text that lost `mailto:` would look like plain text on the next pass.
  `unlinkifyCell` unwraps the spans before the anchors, so a disabled grid returns to plain text with the prefix
  visible again.
- **A jsdom unit test builds a TD with `document.createElement`, which is detached, so `Node.isConnected` is
  `false` for everything inside it.** `unwrapLinks` (`../../utils/cellLinks/linkElement.ts`) therefore guards its
  defensive check with `root.contains(link)`, not `link.isConnected` — the latter would read `true` for anchors
  this function is meant to reach whenever the caller passes a detached `TD`, which every jsdom unit test does.
- **The Playwright fixture's row height must stay generous on every theme.** `horizon`'s rows render taller than
  `main`'s and `classic`'s, so a `height` sized only for `main` can virtualize the fixture's last data row out of
  the DOM on `horizon` while the other two legs still render it — a silent gap in coverage, not a failure. When
  adding rows to `tests/fixtures/demo/auto-link.html`, keep `height` generous enough (`800` as of this writing) and
  run **every** leg, not only `e2e-main`.
- **The bundled TLD list is generated — never hand-edit `../../utils/cellLinks/tlds.ts`.** It is produced by
  `handsontable/scripts/generate-tlds.mjs` from IANA's `tlds-alpha-by-domain.txt`, fetched once at generation time
  (never at runtime — the grid stays usable air-gapped). Regenerate it with
  `npm run generate:tlds --prefix handsontable` when preparing a minor release, so a newly delegated TLD (or one
  IANA retired) reaches `strict: false` before the next release, and commit the regenerated file. There is no
  exclusion list: the FULL IANA list is bundled, punycode entries aside, so a bare domain whose TLD also reads as a
  common file extension (`report.zip`, `README.md`) links too — do not reintroduce a hand-picked exclusion here,
  the trade-off is documented and deliberate (product decision, 2026-09-10).
- **`strict` defaults to `true`, and every example or demo outside the dedicated strict-mode one must stay on that
  default.** `strict: false` is opt-in for data known to hold bare domains or email addresses, not a general
  upgrade — the docs (`metaSchema.ts`, the clickable-links guide) recommend keeping the default and call out the
  file-extension/phishing-bait trade-off (`.zip`, `.mov`) before showing `strict: false`. Do not flip the default in
  an unrelated example or in `tests/fixtures/demo/auto-link.html`'s other columns; only column H there carries
  `strict: false`.
- **`autoLink.strict: false`'s bare-domain pass runs only on the gaps a scheme token left behind.**
  `findLinkTokens` (`../../utils/cellLinks/findLinkTokens.ts`) finds every `http(s):`/`mailto:`/`tel:` token first,
  then — only when `strict` is `false` — finds every bare domain and bare email address that does NOT overlap one
  of those spans (and, for a domain, does not overlap an already-found bare email either), so `foo.example.com`
  inside `https://foo.example.com` is never linked a second time, and the domain half of a bare email address is
  never linked on its own. Do not "simplify" this into one combined regex pass; the overlap check is what keeps a
  URL's own host from becoming a second, redundant anchor.
- **The `:` fast path in `linkifyCell` differs by mode, and `strict: false` must not narrow it to `:` alone.** A
  strict pass only ever needs to look for a scheme, so `text.indexOf(':') === -1` is enough to skip a cell. A
  non-strict pass also has to catch a bare domain (needs a `.`) or a bare email address (needs an `@`), neither of
  which carries a `:` — narrowing the fast path to `:` under `strict: false` would silently stop linking
  `google.com` and `jane@example.com`.
- **`autoColumnSize` measures the hidden `mailto:`/`tel:` prefix, but the grid never renders it.** `afterRenderer`
  is fired by `TableView`, not by `renderCell()`, and `renderCell()` is what `GhostTable`'s sampling table calls —
  so no anchor and no `span.ht-link-scheme` is ever built there, and the sampler measures the FULL
  `mailto:jane@example.com` string while the rendered cell hides the `mailto:` prefix (`hideSchemePrefix`, see
  above). A `mailto:`/`tel:` column therefore auto-sizes a few characters wider than its visible text. Cosmetic
  and deliberate: teaching `GhostTable` about this plugin's hidden-prefix convention is worse than a slightly
  oversized column, so do not "fix" this by reaching into the sampler.

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
