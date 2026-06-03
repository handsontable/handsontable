# Documentation standards (monorepo-wide)

These standards apply to **all** documentation across the monorepo — guides, the API reference (JSDoc/Typedoc inside `handsontable/src`), code comments, changelog entries, release notes, migration guides, and READMEs. An agent editing core JSDoc applies these without opening `docs/AGENTS.md`. The docs *site* has additional mechanics (frontmatter, sidebar, example embedding, and its own voice overrides) in `docs/AGENTS.md`.

The gating policy and a digest of the most-violated rules live in the root `AGENTS.md` "Documentation standards" section (always loaded). This file is the full reference.

## When documentation is required

- Any change to a public API (methods, options, hooks, plugins, typings, errors) **must** update the corresponding JSDoc/Typedoc comments and guides.
- Any change to user-facing behavior or look-and-feel **must** be documented.
- Any breaking change **must** include a migration guide step (see below).
- A PR that adds a new documentation page is included in the changelog (do not use `[skip changelog]`).

## Documentation branch conventions

- Feature docs branches: `docs/issue-xxxx` (e.g., `docs/issue-9024`), branched from the feature branch or `develop`.
- Release docs branches: `release/x.y.z-docs`, branched from `release/x.y.z`.
- Documentation-only PRs use `[skip changelog]` in the PR description, **unless** the PR adds a new documentation page.

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

## Migration guide requirements

A migration guide is required for every major release and some minor releases. Each breaking change needs a separate migration guide step that includes:

1. Who the breaking change affects.
2. A brief reason for the change (what the user gains).
3. A brief description of the change itself.
4. What the user needs to do (step-by-step, with substeps if needed).
5. Code examples (before/after).
6. Links to more detailed information (new pages, PRs).

Follow the structure of previous migration guides for consistency. Migration guides live in `docs/content/guides/upgrade-and-migration/`.

## Trademark rules

- Any documentation page mentioning "Excel" must include the Microsoft/Excel trademark disclaimer.
- If the page also mentions "Google Sheets", use the expanded disclaimer covering both trademarks.
- Avoid third-party trademarks in documentation unless practically necessary (e.g., to describe compatibility or integration).
