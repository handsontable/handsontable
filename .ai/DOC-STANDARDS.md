# Documentation standards (monorepo-wide)

These standards apply to **all** documentation across the monorepo — guides, the API reference (JSDoc/Typedoc inside `handsontable/src`), code comments, changelog entries, release notes, migration guides, and READMEs. An agent editing core JSDoc applies these without opening `docs/AGENTS.md`. The docs *site* has additional mechanics (frontmatter, sidebar, example embedding, and its own voice overrides) in `docs/AGENTS.md`.

The gating policy and a digest of the most-violated rules live in the root `AGENTS.md` "Documentation standards" section (always loaded). This file is the full reference.

## When documentation is required

- Any change to a public API (methods, options, hooks, plugins, typings, errors) **must** update the corresponding JSDoc/Typedoc comments and guides.
- Any change to user-facing behavior or look-and-feel **must** be documented.
- Any breaking change **must** include a migration guide step (see below).

## Documentation branch conventions

- Feature docs branches: `docs/<TASK-ID>_Short-Description` (e.g., `docs/DEV-458_Clarify-undo-redo-docs`), branched from the feature branch or `develop`. `<TASK-ID>` is the ClickUp custom ID, whose prefix follows the task's space (`DEV`, `SU`, `PRO`).
- Release docs branches: `release/x.y.z-docs`, branched from `release/x.y.z`.

## Writing style rules

Apply to all documentation text — guides, JSDoc comments, changelog entries, migration guides, and PR descriptions.

1. **Short sentences.** Split longer sentences in two.
2. **Active voice.** Never passive. ("Configure the parameters" not "The parameters should be configured.")
3. **Simple verb syntax.** ("To ensure performance…" not "In order to ensure that the system will be capable of…")
4. **American English spelling.** (`recognize`, `program`, `behavior`, not `recognise`, `programme`, `behaviour`.)
5. **Commonized forms.** `frontend`, `backend`, `webhook`, `internet` (not `front-end`, `back end`, `web hook`, `Internet`).
6. **Use "you" not "we".** ("In this example, you can see…" not "In this example, we can see…")
7. **Oxford comma.** Use a comma before `and`/`or` in lists of 3 or more items. ("berries, apples, and bacon.")
8. **No evaluative adjectives.** Eliminate "easy", "simple", "obvious", "straightforward" from explanations.
9. **Do not assume user background knowledge.** Bridge the gap between specialists and non-specialists.
10. **Max 3 adjectives before a noun.**
11. **Clause separators.** Use en dashes (–) in non-site text (JSDoc, changelog, migration guides). The docs *site* uses hyphens or double hyphens instead — see `docs/AGENTS.md` 2.2.
12. **Consistent 3rd-party naming.** Use official capitalization: `Node.js`, `webpack`, `GitLab`, `TypeScript`.
13. **PR descriptions**: Use plain, concise language. Avoid literary wording — developers need to parse it quickly.
14. **Sentence case headings.** Capitalize only the first word, plus proper nouns, product names, API identifiers, and acronyms. ("Definition of done (local enforcement)", not "Definition of Done (Local Enforcement)".) Applies to Markdown headings at every level and to the docs frontmatter `title:` field. Terms with fixed capitalization keep it: `Node.js`, `HyperFormula`, `Handsontable DataGrid`, `HotTable`, `UndoRedo`, `Content Security Policy (CSP)`. Sentence case composes with the Diátaxis title patterns in `docs/AGENTS.md` 2.1 (verb phrase, "How to …", "Understanding …") rather than replacing them. **Not covered:** `README.md`, which is marketing-facing and uses Title Case with emoji headings by design, and agent instruction files (`AGENTS.md`, `.claude/skills/**`), whose heading style is currently mixed and out of scope for this rule.

## Product naming

Handsontable is the company. It makes two products: **Handsontable DataGrid** and **HyperFormula**. For years "Handsontable" meant the grid, so text has to say which one it means. The source is the company Brand Voice (Names section).

- **First mention:** introduce the product as `Handsontable DataGrid` on the first prose mention on a page, and in descriptions, intros, and headings that name it. Later mentions on the same page can say `Handsontable`.
- **Surfaces without pages** (JSDoc, changelog entries, PR descriptions): keep `Handsontable` for generic references such as "the Handsontable instance" or "Handsontable options". Use `Handsontable DataGrid` where the text introduces or describes the product, such as an overview block. Release notes that describe past versions keep `Handsontable`.
- **Never `DataGrid` alone** as a first mention or in a `title:`, a `metaTitle:`, or a heading. It is fine alone in a toggle or tab beside HyperFormula, in a table label, or as a repeat in the same section after the full name.
- **Page titles:** a `metaTitle:` reads `<Page> | Handsontable DataGrid for <Framework>`, where `<Framework>` is JavaScript, React, Angular, or Vue and `<Page>` is the page title or a short form of it, with the same casing as `title:` (sentence case applies to `title:` itself) (`Row headers | Handsontable DataGrid for React`). Use the pipe as the only separator, with no dashes. The `framework:` blocks (`react:`, `angular:`, `vue:`) carry their own framework name. The docs site title is `Handsontable DataGrid`, so the visible tab title reads `<Page> | Handsontable DataGrid`. The docs site does not render `metaTitle:` yet, so the framework name does not show in the tab. Changelog and migration pages keep their old titles.
- **Stays `Handsontable`:** code and imports (`new Handsontable(...)`), package names (`handsontable`, `@handsontable/react-wrapper`), API, option, class, and hook names, console and error messages shipped in the UI, customer quotes, version references such as "Handsontable 10.0", migration guides, "Handsontable Team", and "Handsoncode".
- **Category:** "data grid" in lowercase, two words ("a JavaScript data grid"). Not "data table", and not "spreadsheet" as the category (comparing the product with spreadsheet software is fine). When the sentence already names Handsontable DataGrid, do not repeat the noun: write "Handsontable DataGrid is a JavaScript component", not "Handsontable DataGrid is a JavaScript data grid".
- **HyperFormula** on its own is correct everywhere. Use `Handsontable HyperFormula` on first mention where the company also has to be named (pricing, licenses, legal lines).
- **Never** "HOT", "HandsOnTable", or "Hands On Table" in prose (`HOT` is fine in code). The `.datagrid` logotype is a visual mark, never a word in a sentence or heading.
- **Versions:** `18.1` in prose, `18.1.0` when the exact release matters, never `v18.1`.
- **Renaming a heading moves its anchor.** Before you change a heading, grep the repository for inbound `#anchor` links and update them in the same change.

## Migration guide requirements

A migration guide is required for every major release and some minor releases. Each breaking change needs a separate migration guide step that includes:

1. Who the breaking change affects.
2. A brief reason for the change (what the user gains).
3. A brief description of the change itself.
4. What the user needs to do (step-by-step, with substeps if needed).
5. Code examples (before/after).
6. Links to more detailed information (new pages, PRs).

Follow the structure of previous migration guides for consistency. Migration guides live in `docs/content/guides/upgrade-and-migration/`.

**Sections are numbered, and the number lives in two places.** Each step is an `## <N>. <title>`
heading, and the paragraph just after `[[toc]]` names every section by that number ("Section 9
concerns ..."). Two pull requests open at the same time both add the next number, so the guide is a
reliable merge conflict on a busy release, and the conflict has two regions: the intro paragraph and
the heading. Resolve both — renumber the later section and add its sentence to the intro. Nothing
checks the intro against the headings, so a half-resolved merge ships an intro that describes the
wrong section and no gate complains.

**The section number is not part of the anchor.** `docs/src/plugins/rehype-migration-steps.mjs`
strips the `<N>. ` and `Step <N>:`/`Step <N>.` prefixes from every step heading (h2–h4) before the
heading IDs are generated, so `## 24. Icons are rendered as <i> elements` gets the ID
`icons-are-rendered-as-i-elements`, not `24-icons-...`. Link to a section as
`migrating-from-X-to-Y.md#<title-slug>`; a `#<n>-...` or `#step-<n>-...` link never resolves, and no
checker reports it. Renumbering therefore does not break links. The slug comes from github-slugger on
the rendered text: smartypants turns ` -- ` into an en dash, which the slugger drops while keeping both
spaces, so `Step 4: Renderer -- Build the UI` becomes `renderer--build-the-ui`.

## Trademark rules

- Any documentation page mentioning "Excel" must include the Microsoft/Excel trademark disclaimer.
- If the page also mentions "Google Sheets", use the expanded disclaimer covering both trademarks.
- Avoid third-party trademarks in documentation unless practically necessary (e.g., to describe compatibility or integration).
