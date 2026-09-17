# Documentation Standards

This document is written for both human authors and AI agents. All rules are stated explicitly so both roles can apply them without ambiguity.

Astro Starlight-based documentation site. **Requires Node 22**.

For detailed authoring guidance, use skills `writing-docs-pages` and `creating-docs-examples`.

---

## 2.1 Documentation Architecture (Diátaxis)

Every page belongs to exactly one of four content types from the [Diátaxis framework](https://diataxis.fr/). Mixing types on a single page creates confusion. When content doesn't fit one type, split it into two pages.

### The four content types

| Type | Serves | User's question | Handsontable example |
|---|---|---|---|
| **Tutorial** | Learning | "Teach me to do X" | "Build a sortable data grid from scratch" |
| **How-to guide** | Goals | "How do I accomplish X?" | "How to freeze the first two columns" |
| **Reference** | Information | "What are the options for X?" | "Column filter configuration options" |
| **Explanation** | Understanding | "Why does X work this way?" | "Understanding the plugin system" |

### Decision tree

Use this to pick the right type for a new page:

1. Is the reader a beginner who needs guided instruction? → **Tutorial**
2. Does the reader already know the basics and needs to accomplish a specific task? → **How-to guide**
3. Is the reader looking up a specific fact, option, or API signature? → **Reference**
4. Is the page answering "why?" or explaining a concept, design, or trade-off? → **Explanation**
5. Does the content fit two or more types? → Split into separate pages.

### Folder-to-type mapping

| Folder | Expected type |
|---|---|
| `guides/getting-started/` | How-to (task-oriented setup steps) |
| `guides/*/` (feature guides) | How-to or mixed (lean toward splitting) |
| `guides/upgrade-and-migration/migrating-from-*/` | How-to |
| `guides/upgrade-and-migration/changelog-*/` | Reference |
| `guides/upgrade-and-migration/versioning-policy/` | Explanation |
| `guides/upgrade-and-migration/deprecation-policy/` | Explanation |
| `api/` | Reference |
| `recipes/` | Tutorial |

### Required frontmatter field

Every page **must** declare its Diátaxis type in frontmatter:

```yaml
type: tutorial | how-to | reference | explanation
```

This field is in addition to the existing required frontmatter fields (see [Section 2.6](#26-frontmatter-schema)).

---

## 2.2 Voice and Style

This is the docs-**site** voice — it overrides the monorepo-wide documentation standards in `.ai/DOC-STANDARDS.md` where they differ (most notably clause separators: the site uses hyphens or double hyphens, never en dashes). Apply the monorepo standards for anything not restated here.

### Person, tense, and voice

- **Second person**: "you", not "we" or "the user".
- **Present tense**: "the plugin renders", not "the plugin will render".
- **Active voice**: "Click **Save**", not "The Save button should be clicked".
- **Direct imperative for instructions**: "Click **Save**" not "You should click **Save**".

### Words to avoid

| Avoid | Use instead |
|---|---|
| simply, just, easy, straightforward | (omit — state the fact directly) |
| note that, please | (omit — restructure as a callout or sentence) |
| allows you to | "lets you" or rephrase actively |
| in order to | "to" |
| utilize | "use" |

### Sentence length

- Instructions: max ~25 words per sentence.
- One idea per sentence.
- Separate compound sentences at conjunctions.

### Technical terms

- Define on first use in the page: "The `ColumnSorting` plugin -- which sorts rows by column values -- is disabled by default."
- On subsequent uses, link to the reference page once per page section.
- Use code formatting for all API names, option keys, file paths, and code values.

### Formatting conventions

- Hyphens (`-`) or double hyphens (`--`) to separate clauses. No en dashes or em dashes.
- Sentence case for every heading and for the frontmatter `title:`. Capitalize only the first word, plus proper nouns, product names, API identifiers, and acronyms: `Use a cell renderer`, not `Use a Cell Renderer`. Composes with the Diátaxis title patterns in 2.1.
- Straight quotes (`"` and `'`) only. No curly/smart quotes.
- Bold for UI elements: **Save**, **Add column**.
- Inline code for API names: `columnSorting`, `readOnly`.
- Oxford comma in lists of three or more items.
- American English spelling.

---

## 2.3 Page Structure Templates

Use the appropriate template for each Diátaxis type. Do not omit required sections.

### Tutorial template

```markdown
---
type: tutorial
title: <Verb phrase — Build/Create/Set up X>
metaTitle: <title> - JavaScript Data Grid | Handsontable
description: <1-2 sentences summarizing outcome and who benefits>
permalink: /<slug>
tags: [keyword1, keyword2]
searchCategory: Guides
category: <nav category>
---

In this tutorial, you will [concrete outcome]. You will learn [skill or concept].

## Before you begin

- [prerequisite 1]
- [prerequisite 2]

## Step 1 — [Action phrase]

[Instruction text. Keep to ~3-5 sentences. Show one code block.]

## Step 2 — [Action phrase]

...

## What you learned

- [learning point 1]
- [learning point 2]

## Next steps

- [link to related how-to or reference]
- [link to deeper topic]
```

### How-to guide template

```markdown
---
type: how-to
title: How to [specific goal]
metaTitle: How to [specific goal] - JavaScript Data Grid | Handsontable
description: <1-2 sentences: what this achieves and when to use it>
permalink: /<slug>
tags: [keyword1, keyword2]
searchCategory: Guides
category: <nav category>
---

[One sentence: what this accomplishes and when to use it.]

## Prerequisites

- [prerequisite 1]

## Steps

1. [First action]

   [Explanation and code block]

2. [Second action]

   [Explanation and code block]

## Result

[Describe what the reader now has. One or two sentences.]

## Related

- [link to related reference]
- [link to related how-to]
```

The ordered list under `## Steps` is rendered as a Starlight step list -- numbered bullets joined by a vertical line. `rehype-migration-steps.mjs` applies `class="sl-steps" role="list"` to the `<ol>` that directly follows that heading, so write a plain markdown list and add nothing by hand. Numbered `### 1. Title` headings under the same heading keep working too; they go through the heading-based wrapper in the same plugin.

### Reference template

```markdown
---
type: reference
title: [Component/API/option name]
metaTitle: [Component/API name] - JavaScript Data Grid | Handsontable
description: <1-2 sentences describing what this is>
permalink: /<slug>
tags: [keyword1, keyword2]
searchCategory: Guides
category: <nav category>
---

[One sentence describing what this is and what it does.]

## Syntax / Signature

```javascript
// function/option signature
```

## Parameters / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `'value'` | What this controls. |

## Returns

[Return type and description, if applicable.]

## Examples

[Minimal, runnable code example with language tag.]

## Related

- [link to how-to for this feature]
- [link to related reference]
```

### Explanation template

```markdown
---
type: explanation
title: Understanding [concept]
metaTitle: Understanding [concept] - JavaScript Data Grid | Handsontable
description: <1-2 sentences: why this concept matters and who should read this>
permalink: /<slug>
tags: [keyword1, keyword2]
searchCategory: Guides
category: <nav category>
---

[Why this concept matters and when it is relevant. 2-3 sentences.]

## Background

[Historical or architectural context.]

## How it works

[Mechanism, flow, or design explanation.]

## Trade-offs

[What you gain and what you give up. When to choose differently.]

## Related

- [link to how-to that applies this concept]
- [link to reference for this feature]
```

---

## 2.4 Example Data Standards

### Never use

The following placeholder values are banned from all published documentation:

`A1`, `A2`, `A3`, `foo`, `bar`, `baz`, `test`, `Column1`, `Column2`, `Item1`, `value1`, `xxx`, `sample`, `dummy`, `placeholder`, `name1`, `name2`, `data1`, `data2`

### Always use domain-realistic data

Each example must use data from a coherent, plausible real-world domain. Pick one domain per example and stay consistent throughout.

**Approved example domains:**

| Domain | Example data |
|---|---|
| **Financial** | Company names (Acme Corp, Vertex Industries), revenue ($4.2M, $18.7M), fiscal quarters (Q1 2025), currencies (USD, EUR) |
| **HR / workforce** | Employee names (diverse: Ana García, James Okafor, Li Wei), job titles (Senior Engineer, Product Manager), departments (Engineering, Marketing), hire dates (2022-03-14) |
| **Inventory** | Product SKUs (SKU-4821, SKU-0093), supplier names (Harbor Goods, Alpine Supply Co.), stock quantities (142, 0, 67), categories (Electronics, Apparel) |
| **Analytics** | Campaign names (Spring Sale 2025, Brand Awareness Q3), conversion rates (3.4%, 8.1%), channels (Email, Paid Search, Organic) |
| **Project management** | Task names (Update API docs, Deploy hotfix), assignees, due dates (2025-06-30), statuses (In progress, Blocked) |
| **Science / chemistry** | Element names and symbols (Hydrogen/H, Helium/He, Lithium/Li), atomic properties (atomic number, atomic mass, known isotopes, melting/boiling points) |

### Canonical reusable datasets

Two literal datasets are shared across guides so an example doesn't invent new data for a domain that already has one. Reuse the exact values (or a slice from the left/top of them) instead of writing a new one.

| Dataset | Shape | Example data | Lives at |
|---|---|---|---|
| **Inventory long set** (DEV-2915) | 12 rows x 5 columns | SKU (SKU-4821, SKU-0093), product (Stainless Steel Water Bottle, Wireless Mouse), supplier (Harbor Goods, Alpine Supply Co.), category (Drinkware, Electronics), warehouse (Seattle, Denver) | `docs/content/guides/rows/row-moving/javascript/example1.js` |
| **Periodic table narrow set** (DEV-2885) | 5 rows x 7 columns | Name (Hydrogen, Helium, Lithium, Beryllium, Boron), symbol (H, He, Li, Be, B), atomic number (1, 2, 3, 4, 5), atomic mass (1.008, 4.003, 6.94, 9.012, 10.81), known isotopes (7, 9, 9, 11, 11), melting point (-434.4°F, -458.0°F, 356.9°F, 2348.6°F, 3768.8°F), boiling point (-423.2°F, -452.1°F, 2447.6°F, 4478.8°F, 7100.6°F) | `docs/content/guides/columns/column-header/javascript/example2.js` |

### Data coherence rules

- All rows in an example use the same domain.
- Values must be plausible: no negative ages, no revenue of $1, no dates in 1900.
- The dataset should make the demonstrated feature meaningful. A sorting example must use data where sorting is useful. A filtering example must use data where filtering makes sense.
- Use at least five rows in table examples so the feature behavior is visible.
- For real-world physical, scientific, or converted values (e.g. °F/°C, unit conversions), verify each number against a reliable source before writing it down. Don't recompute or retype a value that's already used elsewhere without checking it matches.

---

## 2.5 Code Example Standards

### Language tags

All code blocks **must** include a language tag:

````markdown
```javascript
```typescript
```html
```css
```shell
```json
```yaml
````

Untagged code blocks (```` ``` ````) are not allowed.

### Example quality rules

- Examples must be self-contained and runnable (or clearly labeled as a snippet).
- Use `const` and `let`. Never use `var`.
- Always include `licenseKey: 'non-commercial-and-evaluation'` in `new Handsontable(...)` calls.
- No inline `// TODO` or `// ...` comments in published examples.
- Keep examples between 25 and 60 lines. If longer, link to the live sandbox instead.
- TypeScript is the primary language for new examples. Generate the JavaScript variant: `npm run docs:code-examples:generate-js <path>`.

### Example embedding

```markdown
::: example #example1 --js 1 --ts 2
@[code](@/content/guides/category/feature/javascript/example1.js)
@[code](@/content/guides/category/feature/javascript/example1.ts)
:::
```

### Framework-specific content

```markdown
::: only-for javascript
Content for vanilla JS only.
:::

::: only-for react
Content for React only.
:::
```

### Angular component rules (standalone pattern)

All Angular docs examples use `standalone: true` bootstrapped via `bootstrapApplication`. The Angular JIT compiler runs in the browser and **cannot resolve file-based resources at runtime**. Violating these rules causes the component to silently fail to render.

**Never do this:**
```typescript
@Component({
  standalone: true,
  styleUrls: ['./example1.css'],  // ❌ JIT cannot fetch files at runtime
  templateUrl: './example1.html', // ❌ JIT cannot fetch files at runtime
})
```

**Always do this instead:**

- **CSS**: Put styles in the `--css` slot of the example directive (the example-runner injects them as a global `<style>` tag). Do **not** reference them in `styleUrls`. If the CSS must live in the component, use inline `styles: ['...']` with `ViewEncapsulation.None`.
- **Template**: Always use an inline `template: \`...\`` in the `@Component` decorator. The `angular/example1.html` file is the **outer wrapper** (contains the selector tag) loaded by the example-runner, not the component's internal template.
- **Constructor DI**: Never inject services via the constructor. Use the `inject()` function instead -- constructors are not processed by Angular JIT without TypeScript decorator metadata.
- **Lifecycle hooks**: Put `afterInit`, `afterChange`, and other Handsontable hook functions inside `gridSettings`, not as template event bindings (e.g., `(afterInit)="..."` fails in JIT mode).
- **`@ViewChild`**: Safe to use. It is populated after the component view is initialized.
- **Control flow**: Use `@for`, `@if`, `@switch` (Angular 17+ built-in control flow). Do **not** use `*ngFor`, `*ngIf`, or `*ngSwitch` with structural directives — they require importing `NgFor`, `NgIf`, etc. from `@angular/common`, which is error-prone. The built-in control flow syntax requires no imports.
- **Imports**: Only import symbols you actually use. Unused imports (e.g., `RowObject`, `ViewChild`, `NgFor`) can cause module resolution errors.
- **`registerAllModules()` placement**: `app.config.ts` is the default home for it, but if `app.component.ts` reaches into a registry at module scope -- `getValidator('numeric')`, `getEditor('numeric')`, `getRenderer(...)` outside a function body -- call `registerAllModules()` at the top of `app.component.ts` instead. ES imports are hoisted, so the component module body runs before `app.config.ts` is ever evaluated, and the lookup throws `No registered validator found under "..." name`. Only the built-ins that core registers on import (for example the `text` editor) survive the wrong order, which is why the bug hides until an example uses a module-provided cell type.
- **Untyped third-party imports**: If an example imports a module with no TypeScript declarations (e.g. `numbro/dist/languages.min.js`), put `// @ts-expect-error` directly above the import in the example. Do not add a `declare module` shim to `docs/angular-type-check/types/shims.d.ts` -- a shim satisfies the type-check job while the same import still fails in the docs example runner and in a reader's own strict project. See `docs/angular-type-check/README.md`.

Correct standalone component skeleton:
```typescript
@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-feature-name',
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
  // No styleUrls, no templateUrl
})
export class AppComponent {
  readonly data = [...];
  readonly gridSettings: GridSettings = { ... };
}
```

---

## 2.6 Frontmatter Schema

Required fields for all pages:

```yaml
---
type: tutorial | how-to | reference | explanation   # Diátaxis type (required)
title: Feature Name       # Matches H1; do NOT add H1 in body (Starlight renders title once)
metaTitle: Feature Name - JavaScript Data Grid | Handsontable
description: Short SEO description (1-2 sentences)
permalink: /feature-name
tags: [keyword1, keyword2]  # Optional; kebab-case
react:
  metaTitle: Feature Name - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: new | updated    # Optional; sidebar badge -- see rule below
---
```

**Rules:**
- `title` is the only H1. Do not add `# Title` in the Markdown body.
- `description` is used in SEO meta and link previews -- make it specific and accurate.
- `tags` must be lowercase kebab-case.
- `menuTag` controls the sidebar badge. Set `menuTag: new` when you add a new page, and `menuTag: updated` when you make a substantive content change to an existing page. Omit it for trivial fixes -- typos, snippet/link corrections -- and for changelog and migration-guide pages. Existing tags are refreshed by hand for releases (for example, the RELEASE-631 batch), so leave any existing tag in place.

---

## 2.7 Links and Paths

Use the `@` prefix with `.md` extension for all internal links:

```markdown
[text](@/path/to/file.md#anchor)
```

Do not use relative paths (`../`) for internal links.

### Template variables in links

Never hardcode a branch name in a GitHub link. Five template variables resolve at
build time - production builds point at the frozen branch for the docs version,
every other build points at the development branch. All five are declared and
substituted in `src/plugins/template-variables.mjs`, the sole registry:

| Variable | Production | Otherwise | Use for |
|---|---|---|---|
| `{{$examplesBranch}}` | `prod-examples/<major>` | `master` | `handsontable/examples` starter sources |
| `{{$currentMinorVersion}}` | `prod-docs/<major>.<minor>` | `develop` | `handsontable/handsontable` sources |
| `{{$currentVersion}}` | package.json version | `0.0.0-next-<sha>-<date>` | version strings, runner links |
| `{{$latestChangelogVersion}}` | highest `changelog-N` major | same | links to the newest changelog page |
| `{{$basePath}}` | `''` | `''` | root-relative asset paths |

Three pipelines substitute them and all three go through that module: the content
loader (`src/plugins/framework-loader.mjs`), the Vite pre-transform
(`src/plugins/vuepress-preprocessor.mjs`), and the `_md` route generator in
`astro.config.mjs` that backs Copy Markdown. Add a variable in one place only.
The exception is `{{$basePath}}` inside **embedded example source files**, which
`framework-loader.mjs` substitutes with `/docs` rather than `''`.

A hardcoded `tree/master` link sends a reader on older docs to a starter that no
longer matches their version (DEV-2214).

Exception: the `server-side-*` recipes keep `tree/master/server-examples/...`.
`server-examples/` is not in the runner's `frameworks.json`, is not bucketed per
major, and receives no per-major repair, so a `prod-examples/<major>` copy of it
would be a frozen unmaintained snapshot.

### Reference links in changelog pages

`content/guides/upgrade-and-migration/changelog-<N>/changelog-<N>.md` is hand-written: the release
workflow writes the root `CHANGELOG.md` and the rolling `changelog/changelog.md`, and someone copies
the version's section into the per-major page by hand, demoting `###` to `####`.

**When you create the page for a new major, move the design system date with it.** The newest
`changelog-<N>` page carries a hidden `data-design-system-updated` block under its intro line, filled
in live from worker rule 18c. It belongs on the newest page only - the sidebar and the Introduction
page link there, while nothing links the rolling `changelog/changelog.md`. Cut the whole block from the
old page and paste it into the new one, blank lines included: the `[Design system](@/...)` link inside
the `<div>` is only parsed as Markdown - and so only resolved per framework - when blank lines separate
it from the tags. `src/scripts/__tests__/design-system-updated.test.mjs` fails if the newest page lacks
the block, if an older page keeps it, or if the link loses that shape.

When you edit a changelog page, **link every new option, hook, method, and plugin that an `Added`
entry names**:

```markdown
- Added an Enter key handler and a new [`searchMode`](@/api/options.md#searchmode) option to the
  [`Filters`](@/api/filters.md) plugin. [#11871](https://github.com/handsontable/handsontable/pull/11871)
```

Options go to `@/api/options.md`, hooks to `@/api/hooks.md`, Core methods to `@/api/core.md`, and a
plugin or its method to `@/api/<pluginName>.md`. The anchor is the plain lowercased member name, so
`#minRowHeights` never resolves and `#minrowheights` does.

Leave unlinked whatever has no reference page - theme tokens, CSS class names, TypeScript type names,
external APIs such as `Intl.NumberFormat`, object keys that are not API members, and wrapper package
names. A link to a page that does not document the name is worse than no link.

Run `npm run docs:validate-changelog-links` to list the candidates and to catch an `@/api/` link
whose file or anchor cannot resolve. It is report-only, and its candidate set is a heuristic, so judge
each finding rather than applying it blindly. It sees options, hooks, plugin classes, and `Core`
members; **it does not see plugin methods**, because a bare `collapseAll()` belongs to two plugins and
only the sentence says which, so link those by hand.

The link cannot come from the `.changelogs/*.json` entry instead. `bin/changelog` renders an entry
title verbatim into four destinations, and only the docs page resolves `@/api/` links: on GitHub the
root `CHANGELOG.md` and the release body render a link to a literal `@/api/...` path, and the
version-comparison UI drops the link and keeps the text. An entry title that needs a docs link uses
an absolute `https://handsontable.com/docs/...` URL. Full rule: `.changelogs/README.md`.

---

## 2.8 Trademark Notices

- Pages mentioning "Excel" must include the Microsoft trademark disclaimer.
- Pages also mentioning "Google Sheets" use the expanded disclaimer.
- Add the disclaimer in a callout or footnote at the bottom of the page.

---

## 2.9 Sidebar Registration

Register new pages in `content/guides/sidebar.js`. A page not registered there will not appear in navigation.

A page's sidebar badge (**New** / **Updated**) is driven by the `menuTag` frontmatter field (see Section 2.6), not by `sidebar.js`.

---

## 2.10 Checklist Before Submitting a Docs PR

Copy and complete this checklist in your PR description:

```markdown
## Docs PR checklist

- [ ] `type:` field added to frontmatter (tutorial | how-to | reference | explanation)
- [ ] Page uses the correct Diátaxis template for its type
- [ ] Title matches Diátaxis naming convention for its type
  - Tutorial: verb phrase ("Build X", "Create X")
  - How-to: starts with "How to ..."
  - Reference: component or API name
  - Explanation: starts with "Understanding ..."
- [ ] Intro paragraph states: what, for whom, and what outcome the reader gains
- [ ] No banned placeholder data (foo, bar, A1, Column1, etc.)
- [ ] All example data is domain-realistic and internally consistent
- [ ] All code blocks have language tags (```javascript, ```typescript, etc.)
- [ ] No `var` in code examples; uses `const` / `let`
- [ ] All examples include `licenseKey: 'non-commercial-and-evaluation'`
- [ ] Heading hierarchy is correct (no skipped levels, e.g., H2 → H4)
- [ ] Headings and the frontmatter `title:` use sentence case
- [ ] Active voice and second person ("you") used throughout
- [ ] No banned words: simply, just, easy, straightforward, note that, please
- [ ] Tutorials and how-tos have a Prerequisites section
- [ ] Tutorials have "What you learned" and "Next steps" sections
- [ ] How-tos have a "Result" section
- [ ] New page registered in `content/guides/sidebar.js`
- [ ] `menuTag: new` set on new pages / `menuTag: updated` set on substantively changed pages (omit for trivial fixes, changelogs, and migration guides)
- [ ] Microsoft trademark disclaimer added where "Excel" is mentioned
- [ ] TypeScript example exists; JS generated via `npm run docs:code-examples:generate-js`
- [ ] `[skip changelog]` in PR body (docs changes don't need changelog entries)
```

---

## 2.11 Redirects and Deployment

**Production, staging, and PR previews are all served by Cloudflare Pages.** Netlify has been fully removed - see `README-DEPLOYMENT.md` for the current platform table.

When you rename a page's `permalink` (or remove a page), add a redirect rule to `cloudflare/_worker.js` - the **sole**, hand-maintained authority for every redirect rule. Cloudflare Pages ignores `_redirects` when a `_worker.js` is present. Add old-slug-to-new-slug exact-path entries to its `crossFramework` map (matched before the static-asset fallthrough), one per framework prefix. Never point a `:major.:minor` versioned wildcard at the new slug; that wildcard matches frozen older versions where the page still lives at the old slug.

`docker/redirects-autogenerated.conf` is build-generated (`# DO NOT EDIT`) and only normalizes versions; `docker/redirects.conf` is for ancient slug families. Neither serves production. Full detail: `README-DEPLOYMENT.md` ("Redirects").

### Content-type overrides and the agent files (rule 18b, llms.txt)

Worker rule 18b is the first rule in `_worker.js` that is neither a redirect nor a mocked response: it re-serves a 200 static asset with a different `Content-Type`. It exists because Pages assigns `.md` assets `text/markdown`, which OpenAI's web-search fetch tool refuses; the Markdown twins under `/docs/_md/` and `/docs/llms*.txt` are re-served as `text/plain`. A new override belongs in that rule, or in a sibling placed right beside it - below rule 18a and above the static-asset fallback (rule 19), so the redirect rules keep matching first - never in a redirect map.

`/docs/llms.txt` and `/docs/llms-full.txt` are generated by `markdownRoutesIntegration()` in `astro.config.mjs` from the builders in `src/llms.mjs`, and their structure is coupled to the sidebar's own IA: section labels become llms.txt headings, and `buildLlmsSections()` matches the `'API reference'`, `'Policy'`, and `'Migration guides'` labels by name. Renaming a sidebar section label, or adding a sidebar source that `buildAllSidebars()` does not return, changes these published, crawler-facing files - `src/scripts/__tests__/llms.test.mjs` pins the labels and the output shape.

### The example dependencies are lockfile-pinned, and production lags develop

The interactive grids rendered directly on a docs page are built from `docs/package.json`. That is a **third** copy of every example dependency, separate from the `handsontable` npm package (which carries its own `hyperformula` devDependency into `handsontable.full.js`) and from the demos.handsontable.com runner (which has its own `package.json`). Fixing one fixes neither of the others – check all three when a report names a version.

A caret range does not track new releases. `pnpm-lock.yaml` pins the resolved version, so `"hyperformula": "^3.2.0"` still resolved to 3.3.0 a month after 3.4.0 shipped (DEV-2826: the page-freeze fix never reached the site). To move one, raise the specifier's floor in `docs/package.json`, then run `pnpm install --lockfile-only` from the repository root. The lockfile diff must be the two lines in the `docs:` importer and nothing else – see the lockfile-float entry in `.ai/CI.md` for why a wider diff is a problem.

`docs-production.yml` deploys from `prod-docs/**` and installs with `--frozen-lockfile`, so develop is not what the live site serves, and `publish.yml` never regenerates the lockfile at a release cut. A bump on develop protects the next cut only. To fix what a user sees today, repeat the change on the live `prod-docs/<major>.<minor>` branch. Redo the edit there rather than cherry-picking the lockfile hunk: an older branch usually has no package or snapshot stanza for the new version at all, so applying the importer hunk by itself leaves an invalid lockfile. Copy both stanzas across too, then validate with `pnpm install --lockfile-only --frozen-lockfile`.

### Getting a content fix to the live site

Land it on `develop` first. A workflow (`docs-sync.yml`, run on weekdays at
05:00 UTC and on manual dispatch; script
`.github/scripts/docs-sync.mjs`) ports **content-only** commits (`docs/content/**`,
`docs/public/img/**`) to the highest `prod-docs/<major>.<minor>` through one pull
request, `docs-sync/prod-docs-<major>.<minor>` → `prod-docs/<major>.<minor>`. An
LLM decides per commit whether the change applies to the released version; the
pull request body lists every decision with its reason. Merge it and
`docs-production.yml` deploys.

- A commit that also touches tooling, source, or agent docs is **not** split; it is
  listed under "mixed" for a hand port. Keep content fixes in their own pull request
  when they should reach the live site.
- Override the classifier with a label on the **source** pull request:
  `docs-sync: include` or `docs-sync: skip`. The sync pull request itself carries
  the `docs-sync` label.
- Set the repository variable `DOCS_SYNC_REVIEWERS` (comma-separated GitHub logins)
  to have the workflow request review on the sync pull request automatically.
- Never commit to a `docs-sync/*` branch by hand unless you mean to pause the bot:
  it stops rebuilding the branch while it carries a commit it did not make.
- Hand cherry-picks stay allowed (tooling, urgent fixes). Keep the `(#<n>)` in the
  squash subject; that is how the sync recognizes the change as already ported.
- Run it locally: `node .github/scripts/docs-sync.mjs --dry-run --no-llm` needs only
  `gh auth`; drop `--no-llm` with `LITELLM_BASE_URL`, `LITELLM_API_KEY`,
  `DOCS_SYNC_MODEL` set to exercise the classifier. Two optional repository
  variables tune it per provider: `DOCS_SYNC_TEMPERATURE` pins the sampling
  temperature (leave it unset to use the model's own default -- required for a
  reasoning-tier model that rejects any non-default temperature), and
  `DOCS_SYNC_JSON_MODE` (on by default) can be set to off for a model that
  rejects `response_format`. Add `--skip-lint` on a machine
  without the docs toolchain installed. The script checks out the sync branch in
  the checkout it runs in and restores your branch afterwards, so run it from a
  clean checkout or a worktree, never with uncommitted changes.

---

## 2.12 Content Pipeline and Dev-Server Memory (DEV-1991)

The custom loader (`src/plugins/framework-loader.mjs`) renders every source page once per framework (JS/React/Angular/Vue) at content-sync time. Astro's dev server materializes the entire `.astro/data-store.json` in memory several times over on the first page request, so **the data store must stay small**:

- Each entry's rendered HTML is written to `.astro/rendered-html/<id>.html`; the store holds only a `<!--hot-rendered:<id>-->` marker, which `src/middleware.ts` swaps for the file content (per request in dev, at prerender time in builds). Do not store large blobs (rendered HTML, raw bodies) in the data store.
- Expressive Code's per-token inline styles are interned into classes by `src/plugins/ec-token-styles.mjs`; the matching stylesheet is `src/styles/ec-token-classes.css`. After changing the map, regenerate the CSS with the command documented in that module (a unit test fails when they drift).
- Both `.astro/data-store.json` and `.astro/rendered-html/` are derived caches — reset them together with `rm -rf .astro`. Never delete one without the other.
- `npm run dev` must work with the default Node heap. Do not add `NODE_OPTIONS=--max-old-space-size` workarounds; shrink the data store instead.
- Plugin unit tests run with `node --test src/plugins/__tests__/*.test.mjs`.

### Starting the dev server from an agent session

`npm run dev` dies with `Dev server failed to start within 30s.` and exit 1 in every agent session, and the message is a lie - nothing in the config is broken. Astro 7's `astro dev` calls `isRunByAgent()`, and on a hit it force-enables **background mode**: it spawns a detached child, polls for that child's lock file for 30 seconds, then SIGTERMs the child and exits non-zero. This docs config never boots that fast, so the wrapper always kills a server that was on its way up. Run the server process itself instead:

```bash
ASTRO_DEV_BACKGROUND=1 npx astro dev
```

That env var is what the spawned child receives, so setting it makes the foreground process *be* the server and skips the timeout wrapper entirely. Do not raise the timeout (it is hardcoded in `astro/dist/cli/dev/background.js`) and do not conclude the config is at fault.

### The dev server 500s in a fresh worktree until the core CSS exists

Every page returns HTTP 500 with `[postcss] ENOENT: no such file or directory, open '../../../handsontable/styles/handsontable.min.css'`. `src/styles/handsontable-import.css` imports the **built** stylesheet from the core package, and `git worktree` materializes tracked files only, so a new worktree has no `handsontable/styles/`. Build the core package, or copy `handsontable/styles/` in from a checkout that already has it. Then **restart the dev server** - postcss caches the resolution failure, so a running server keeps 500ing after the file appears.

The framework examples have the same trap one layer up, and it reads as a network failure rather than a missing build. Pages load, JavaScript examples render, but **every** React and Vue example on the page fails with `[hot-example] JSX failed: ... TypeError: Failed to fetch dynamically imported module` - including examples nobody touched, which is the tell. The server log says what is really wrong: `Failed to resolve import "@handsontable/react-wrapper"`. The docs site links the wrappers from the workspace, and their `main`/`module` entries point at build output (`commonjs/`, `es/`) that a new worktree does not have. Build them (`npm run build --prefix wrappers/react-wrapper`, `--prefix wrappers/vue3`; the Angular examples need `wrappers/angular-wrapper/dist`), after the core build they compile against, then restart the dev server as above.

---

## 2.13 Example-Runner Error Handling

`src/scripts/example-runner.ts` catches every example failure so one broken example cannot take a page down. Two rules keep that from hiding real crashes (Sentry HANDSONTABLE-DOCS-20K) or leaking unhandled rejections (HANDSONTABLE-DOCS-1FX):

- **Every caught example failure goes through `reportExampleError()`** from `src/lib/example-error-reporting.mjs`. That module owns the drop list - failed chunk fetches, errors carrying `cause.handsontable` (core `throwWithCause()`), the expected `HTTP <status>` of the server-side data examples - plus deduplication by message and a cap of three forwarded failures per page load. Widen or narrow the drop list there, never at the call site. Sentry reaches the runner through the Loader Script (`window.Sentry`), whose deferred `<script>` tag precedes the bundled Head scripts, so the queueing stub exists by the time the runner runs; a blocked CDN request degrades to no report.
- **A framework runtime (`react`, `vue`, `zone.js`, `@angular/compiler`) must only be imported inside `loadRuntime()`.** A bare `await import(...)` there escapes every try/catch as an unhandled rejection and leaves each example of that framework stuck on its loading shimmer forever. `loadRuntime()` returns `null` on failure, and the group is marked with `markFailed()` - the only place that shows a reader-visible notice (`.hot-example-error`). Per-example failures keep the silent `markLoaded()` degradation, because some examples render nothing by design.

Guards for both rules live in `src/lib/__tests__/example-error-reporting.test.mjs` (run by `npm run docs:test:plugins`).

### The two-layer drop policy

`reportExampleError()` only sees failures the runner **caught**. Anything raised outside our try/catch - Astro's own island hydration, for one - reaches Sentry through `onerror`/`onunhandledrejection` and can only be filtered in the `beforeSend` hook inlined in `astro.config.mjs` (`window.sentryOnLoad`). When triage says "expected noise", ask which layer the event actually travels through before editing a drop list; a rule added to the wrong layer changes nothing in production.

The two layers overlap on failed dynamic imports of content-hashed `_astro/*.js` chunks - stale cached HTML, offline readers, blocking extensions. Three phrase lists must stay in step: `isChunkLoadError()` in `src/lib/example-error-reporting.mjs`, the same check in `src/scripts/docs-assistant-bootstrap.ts`, and `chunkLoadFailures` in the `beforeSend` hook. Each engine words the failure differently (Chrome `Failed to fetch dynamically imported module`, Firefox `error loading dynamically imported module`, Safari `Importing a module script failed`), so a one-engine list silently keeps filing issues from the other two.

Neither layer reaches a frozen version build under `/docs/<major>.<minor>/`. `deploy/build_previous_versions.sh` copies each archived version out of its own Docker image verbatim, so those pages run the `beforeSend` and the bundles that shipped at their release - a rule added on `develop` today never appears there. Check a Sentry issue's `url` tag before writing a filter for it: when the events come from a versioned path, the only mechanism that drops them is a **Sentry project-level inbound filter on the message** (server-side, so frozen HTML is irrelevant), and the group belongs in `ignored`/`archived forever`, never `resolved` - the archived page is live, so a resolve auto-regresses. Example: HANDSONTABLE-DOCS-1FM mixes both, 11 of 18 events on current recipe pages (which the hook does filter) and 1 on `/docs/17.1/`, still calling the `http://localhost:3000/tickets` its bundle was built with.

The same gap exists one branch away: production docs build from `prod-docs/<major>.<minor>`, which receives content through the docs sync and tooling through hand cherry-picks, and does not carry `sentryOnLoad` today. Every rule here is inert in production until that cherry-pick lands - say so when reporting that a filter is done.

Gate any rule that is expected noise only in one place (a recipe page with no backend, a demo without a server) on the page URL, so the same failure stays visible everywhere else.

Regression tests for the hook live in `src/scripts/__tests__/sentry-before-send.test.mjs`; it evaluates the script exactly as inlined, so every drop rule needs both a drops-it and a keeps-the-real-thing case.

---

## 2.14 Patching Starlight's Custom Elements

Starlight's custom elements assign their methods as **class fields** (`private init = (): void => {...}`), not as prototype methods. An own instance property never reaches the prototype, so `customElements.get('starlight-toc').prototype.init` is `undefined` and any prototype patch silently no-ops. A guard written that way looks correct in review, passes locally, and fixes nothing in production - that is exactly how the `:has()` table-of-contents guard stayed dead for two months (Sentry HANDSONTABLE-DOCS-1GA).

To patch such an element, intercept `customElements.define` in an `is:inline` head script and wrap the method on `this` right after `super()`. Two rules:

- **Cover every registered name.** `mobile-starlight-toc` (`components/MobileTableOfContents.astro`) extends the same `StarlightTOC` class but registers separately, so it needs its own wrap.
- **Subclass with `class extends`,** which keeps statics reachable through the prototype chain and keeps `instanceof` true for the original constructor. The browser reads `observedAttributes` off whatever constructor the registry holds, and it upgrades elements against it.

Wrapping after `super()` works because the base constructor only *schedules* the method through `requestIdleCallback`, and that callback reads `this.init` when it fires.

The install does not need a re-entry flag today. The site does not use `<ClientRouter />`, and Astro's swap logic keys executed scripts by `textContent` (`detectScriptExecuted()` in `astro/dist/transitions/swap-functions.js`), so an unchanged inline head script never runs twice. Add one if either of those stops holding.

The live guard is in `src/components/Head.astro`; its regression test is `src/components/__tests__/head-starlight-toc-has-guard.test.mjs`, which extracts the shipped script, asserts `Head.astro` holds exactly one guard script, and runs the guard against a double that replicates the class-field shape. It runs under `npm run docs:test:plugins`. Any claim that such a patch works needs a browser check of the *instance* property, not just the absence of a local error.

Unrelated to this: `src/plugins/replace-has-selectors.mjs` and `src/plugins/has-fallback-runtime.mjs` rewrite `:has()` in **stylesheets** for performance. They do not touch selector strings passed to `querySelectorAll` inside third-party bundles.

---

## 2.15 Cascade layers in the docs CSS

Starlight puts its own styles in cascade sublayers - `starlight.base`, `starlight.reset`, `starlight.core`, `starlight.content`, `starlight.components`, `starlight.utils`, in that order - and `starlight.reset` carries `* { margin: 0 }` while `starlight.content` carries the markdown spacing (`--sl-content-gap-y`). Later layers beat earlier ones regardless of specificity, so if `reset` ends up after `content`, every gap between paragraphs, code blocks, lists and asides collapses to zero on every page. Unlayered rules (most of `src/styles/base/typography.css`) beat all layers, so headings keep their margins and the breakage reads as "the prose is cramped" rather than "the CSS is broken" (DEV-2742).

Two things establish that order, and both matter:

- **`src/styles/custom.css` opens with an `@layer` statement** listing all six sublayers plus `rapide`. Keep it first in the file. Starlight ships the same statement in `@astrojs/starlight/style/layers.css`, but that copy is inert: the `customCss` stylesheets are bundled ahead of Starlight's own, so by the time `layers.css` appears the layers it names are already established.
- **Position decides whether a statement does anything.** Astro's `astro:css-target-lowering` plugin runs each emitted stylesheet through lightningcss, which resolves an `@layer a, b;` statement by physically reordering the blocks that follow it, then drops the statement. A statement that lands *after* a block for a layer it names cannot reorder that layer, so lightningcss drops it and changes nothing. Never expect to find the statement in `dist/_astro/*.css` - the invariant that ships is the order of the `@layer` blocks.

So an `@layer starlight.<name>` block in a docs stylesheet (`src/styles/**`) or in a component `<style>` block (`src/components/*.astro`) is only safe while `custom.css` lists that layer. Adding one that it does not list makes that layer's first appearance land wherever the bundler happens to put it.

**Not every markdown block can prove the order.** An unlayered docs override beats every layer, a broken order included, so a block that carries one is blind to this class of bug. Fenced code blocks are the case in point: #13409 gave them the interactive examples' block margin through an unlayered `.sl-markdown-content .expressive-code { margin-block: 2rem }` in `src/styles/components/code.css`, and their gap holds at 32px with the layers in the wrong order, while `p + p` and `p + ul` collapse to 0. So `tests/markdownProseSpacing.spec.ts` asserts two different things: the paragraph and list cases are the backstop, and the code block case pins the docs' own 2rem decision. Keep at least one assertion there on a block the layered rule still spaces, and check which rule wins - the Styles pane names the layer, and `CSS.getMatchedStylesForNode` over CDP prints it - before you read a gap assertion as a layer-order guard.

Both halves are guarded, on three different triggers - know which one you are relying on:

| Guard | What it checks | Runs |
|---|---|---|
| `src/lib/__tests__/cascade-layer-order.test.mjs` | the authoring rules: statement first, full order, no undeclared layer anywhere in the docs CSS | every PR, via `docs.yml`'s `plugins` job (`npm run docs:test:plugins`) |
| `scripts/validate-layer-order.mjs` | the built pages' stylesheets in document order (links and inline `<style>`), failing when the block order deviates | `npm run build`, after `astro build` - so every same-repo PR through the `preview` job, but **not** on a fork or Dependabot PR, where `preview` is guarded off |
| `tests/markdownProseSpacing.spec.ts` | the reader-visible gap on a built page | every docs PR, via `docs.yml`'s `functional` job (`npx playwright test --project=functional` against the preview) - report-only for one sprint, so a failure lands in the job summary and the `docs-functional-report` artifact, not in a red check (section 2.18) |

So the spec is a backstop, not a gate, until the `functional` job's `continue-on-error` is flipped off. The first two are what actually hold the line on a normal PR.

---

## 2.16 A guide page can be partly generated, and the frontmatter does not say so

`docs/content/**` is hand-written prose *except* inside marker comment pairs. A generator owns
everything between the markers and rewrites it from a source outside `docs/`, so an edit made there
is silently discarded on the generator's next run. Nothing in the page's frontmatter, and nothing at
the top of the file, warns you: the markers can sit hundreds of lines down, and the generated block
reads like ordinary Markdown.

**Before editing any guide page, grep it for `:start -->`.** If the line you want to change sits
between a `:start` and an `:end` marker, edit the generator's source instead, then re-run the
generator and commit its output.

The one page in this shape today:

| Page | Markers | Edit instead | Regenerate with |
|---|---|---|---|
| `guides/configuration/configuration-option-levels/configuration-option-levels.md` | `<!-- option-levels:start -->` / `<!-- option-levels:end -->` | levels: the `@configScope` tag on the option in `handsontable/src/dataMap/metaManager/metaSchema.ts`; Notes column: the `NOTES` map in `handsontable/scripts/utils/option-levels.js` | `npm run generate:option-levels --prefix handsontable` |

Two things make this easy to get wrong, and both cost a red pipeline:

- **The levels and the Notes column have different sources.** The `@configScope` tag is levels-only
  by design, so prose caveats live in the `NOTES` map in the generator's utility, not in
  `metaSchema.ts`. Adding a sub-option that is grid-level only means editing `NOTES`, not the schema.
- **A hand-edit inside the block can be byte-identical to what the generator produces and still fail
  the build.** `handsontable/test/__tests__/optionLevels.unit.js` compares the committed page against
  the generator's output *computed from the source*, so the page matching is not enough — the source
  has to carry the change too. Run `npm run test:unit --prefix handsontable --
  --testPathPattern=optionLevels` to prove you got it right.
- **The generator writes `option-levels.json` beside the page, and commit both — but only the page
  is fully guarded.** The JSON case in that test file asserts `total`, `levels`, and each option's
  `name` and `levels`; it never reads `note`. So a `NOTES`-only change committed to the page with a
  stale JSON passes the suite green. Re-run the generator rather than hand-editing either file, and
  if you want the gap closed, add `payload.options.map(o => o.note)` to that assertion.

---

## 2.17 Naming third-party utility iframes for accessibility

Marketing scripts inject utility iframes with no `title`, which axe and Lighthouse flag under `frame-title` and screen readers announce as an empty frame (DEV-63). An `is:inline` guard in `src/components/Head.astro` (a sibling of the Starlight TOC guard in §2.14 - same head-script pattern, different subject) gives each an accessible name once it appears: Headway's changelog panel (`#HW_frame`) and the Visual Website Optimizer communication proxy (`#_vwo_communication_proxy`). The scripts inject asynchronously - Headway through a deferred CDN script, VWO through a tag inside the externally managed Google Tag Manager container, so `#_vwo_communication_proxy` never appears on a non-production build - so the guard uses a `MutationObserver`. Two rules:

- **`title` names a frame; `aria-hidden` removes it.** They are different remediations. A frame that is real UI when shown (`#HW_frame` is the changelog panel) gets a `title` only - `aria-hidden="true"` on it would hide a working feature, and `aria-hidden` over a cross-origin frame you cannot inspect also risks the `aria-hidden-focus` violation. Only a genuinely contentless, never-displayed frame (`#_vwo_communication_proxy`) also gets `aria-hidden="true"` + `tabindex="-1"`.
- **Bound the observer, then re-arm on consent.** It disconnects once every target is patched, but a target may never appear (a blocker kills the scripts, declined consent stops the VWO tag, and VWO never appears off production), so a `setTimeout` deadline also disconnects it - a `childList`+`subtree` observer left live for the whole page churns a MutationRecord on every DOM change. The VWO tag inside GTM fires only after analytics consent and its proxy injects asynchronously after that, which can outlast the initial deadline, so the guard re-arms (re-observes with a fresh deadline) on Cookiebot's `CookiebotOnAccept` event - do not just widen the timer.

The regression test is `src/components/__tests__/head-hidden-iframe-a11y.test.mjs`, which extracts the shipped script and runs it against a fake DOM that injects the iframes asynchronously (run under `npm run docs:test:plugins`).

## 2.18 Visual tests have a real baseline in R2, and a missing golden fails on CI

`tests/visualDocs.spec.ts` takes one full-page screenshot per guide page in `tests/paths.js` for each of
the four frameworks – 441 as of 2026-09-14 – and compares each with `toHaveScreenshot` at a `maxDiffPixelRatio` of
0.01, or 0.05 for the pages listed in `pathsNeedingMoreTolerance`. Chromium only, against `BASE_URL`
(`http://localhost:4321/docs` by default; on CI the pull request's Cloudflare preview). Eleven functional
specs (`tests/*.spec.ts` other than `visualDocs`) share its `testDir`.

Until DEV-2860 the suite's baseline was not a baseline, and it passed by construction:

1. **The goldens came from `actions/cache`, keyed on `github.ref` with a `refs/heads/develop` restore key
   that nothing ever saved.** `develop.yml` never ran the docs suite, and GitHub scopes a pull request's
   cache to that pull request, so the only possible hit was the same pull request's earlier commit. Commit 2
   was compared against commit 1, never against develop (observed on PR #13440, 2026-09-08).
2. **On a miss the workflow ran `playwright test --update-snapshots`,** wrote whatever the preview rendered
   as the goldens, passed, and posted nothing. Playwright's default `updateSnapshots: 'missing'` does the
   same thing silently for any single missing golden even without the flag – a false green.
3. **The suite ran on one pull request in the three weeks before 2026-09-14** (the `run-docs-visual` label
   was applied to two). On #13440 it reported 61 failures, the label was removed to escape the red, and the
   61 accepted differences were recorded nowhere. The eleven functional specs, living in the same `testDir`,
   only ever ran under that label.

The fix reuses the core suite's contract (`visual-tests/AGENTS.md`, "Comparison and approval"): probe →
compare → gate → comment → environment approval, in the same R2 bucket, with the baseline seeded from the
develop staging deploy.

### Where the goldens live

Bucket `handsontable-visual`, public at `https://visual.handsontable.com`, the same three secrets as
`visual.yml` (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`):

| Key | Holds |
|---|---|
| `docs/base/<branch>/screenshots/**` | the golden PNGs – the `tests/test-artifacts/screenshots/` tree, paths like `visualDocs.spec.ts/js-introduction.png` |
| `docs/base/<branch>/out.json` | the baseline's manifest; what the probe reads |
| `docs/pr-<number>/<sha>/results/**` | one pull request run's Playwright HTML report (static – `index.html` plus `data/`, served from the CDN) |
| `docs/pr-<number>/<sha>/out.json` | that run's manifest |

`pr-cleanup.yml`'s `purge-visual-screenshots` deletes `docs/pr-<number>/` when the pull request closes. A
`Docs Visual Tests` dispatch publishes under `docs/dispatch/<branch>/<run_id>`, which nothing purges –
retention there is the bucket's business. `visual.handsontable.com` sits behind a CDN that caches PNGs for
four hours (`out.json` is not cached), so `curl -H 'Cache-Control: no-cache' '<url>?cb=$RANDOM'` before
concluding anything from a golden you read back.

### The contract

- **One implementation, two callers.** `.github/actions/docs-visual-run/action.yml` is a composite action
  with `mode: compare | seed`. `docs.yml`'s `visual` job calls it in `compare` mode against the pull
  request's preview with `base-key: docs/base/${{ github.base_ref }}` and
  `actual-key: docs/pr-<number>/<sha>`; `docs-visual-seed.yml` and `docs-visual-tests.yml` (dispatch only)
  call it in `seed` mode with `actual-key` equal to `base-key`. The caller passes the R2 secrets as inputs –
  a composite action cannot read `secrets` – and there is no `actions/cache` anywhere.
- **The probe never guesses.** `curl -I` on `https://visual.handsontable.com/<base-key>/out.json`: 2xx →
  compare; 404 → `DOCS_VISUAL_BOOTSTRAP=true`; anything else → exit 1. On bootstrap a same-repo pull request
  renders the baseline and seeds it itself (`bootstrap` verdict), and the next seed overwrites it. Otherwise
  `aws s3 sync` brings the goldens into `tests/test-artifacts/screenshots/` and `find` writes their list to
  `tests/test-artifacts/baseline.txt` – that list is how a deletion is detected.
- **A missing golden fails on CI.** `playwright.config.ts` sets `updateSnapshots: isCI ? 'none' : 'missing'`:
  on CI a test without a golden fails with "A snapshot doesn't exist at …" instead of writing one and
  passing; locally the old behavior stays. This is the rule of DEV-2860. The compare step runs with
  `continue-on-error: true` – a failing test is a visual difference, and the gate reports it, not the step.
  The seed step (`--update-snapshots`) does fail on a test failure: a seed with holes must not land, and a
  seed whose manifest is empty is refused (a blank `out.json` would make the probe return 200 forever).
- **Every `toHaveScreenshot` test declares its golden.** On CI the config adds a JSON reporter
  (`tests/test-artifacts/report.json`), and `tests/lib/visual-manifest.mjs` (CLI
  `tests/scripts/visual-manifest.mjs compare | seed`) maps that report to the reg-suit `out.json` the core
  gate already reads. It finds a test's golden through a `snapshot` annotation, so the first statement of a
  visual test body must be
  `test.info().annotations.push({ type: 'snapshot', description: 'visualDocs.spec.ts/<name>.png' })` –
  before `test.fixme()`, so a fixme'd page still declares its golden and never reads as deleted.
  **`<name>` must be sanitized the way Playwright sanitizes it**, because Playwright writes the file
  and the annotation only names it: `snapshotPath()` puts the argument through `sanitizeForFilePath`
  before substituting `{arg}`, turning every character outside `[\w-]` into `-`. The 35
  `migration-from-X.Y-to-Z.0` pages are the ones this bites – they land on disk as
  `migration-from-X-Y-to-Z-0.png`, and an annotation that kept the dots names a file that does not
  exist, so each reads as a deleted golden plus a new render and the verdict is `changed` forever
  with nothing to fix. The spec builds the name already sanitized; `docs-visual-baseline.test.mjs`
  derives the expected key from the template and checks it against every slug in `paths.js`. Measured
  on @playwright/test 1.61.1 – 1.45 did not sanitize here, so a Playwright bump can move this. Buckets:
  `expected` and `flaky` → passed; `unexpected` → new when an error says the snapshot doesn't exist, failed
  otherwise; `skipped` → declared but uncounted; a baseline path that no test declares → deleted. A test
  without the annotation is ignored. Tests: `tests/lib/__tests__/visual-manifest.test.mjs`, in the root
  `npm run test:tooling`.
- **The verdict, the comment, and the approval are the core gate's, relabeled.**
  `visual-tests/scripts/visual-gate.mjs` runs with `VISUAL_GATE_DIR=tests/test-artifacts`,
  `VISUAL_GATE_TITLE='Docs visual tests'`, `VISUAL_GATE_ENVIRONMENT=docs-visual-approval`,
  `VISUAL_GATE_ARTIFACT=docs-visual-report`, and `VISUAL_GATE_REPORT_PATH=results/index.html`. It writes
  `comment.md` – posted as the sticky comment `docs-visual-tests` on same-repo runs and mirrored to the job
  summary – and the `verdict` and `report-url` outputs: `clean`, `changed`, `bootstrap`, or `error` (no
  manifest, so a run that died reads "could not compare" and reds the job). On `changed`, `docs.yml`'s
  `approve` job waits on the **`docs-visual-approval` environment**: a reviewer approves or rejects the
  pending deployment on the run page, and "View deployment" opens the report at
  `https://visual.handsontable.com/docs/pr-<number>/<sha>/results/index.html`. Approval is per run and
  all-or-nothing, and the job fails closed – it asserts an approval through the approvals API – so **the
  environment must exist with required reviewers before the first docs pull request with differences
  runs**, or that pull request is stuck red until an admin creates it.
- **The baseline is seeded from the staging deploy.** `.github/workflows/docs-visual-seed.yml` chains
  (`workflow_run`) on a successful push run of `Docs Staging Deployment` and seeds `docs/base/<branch>`
  from what that run deployed: `develop` from `https://handsontable-docs-staging.pages.dev/docs`,
  `release/x.y.z` from `https://rc-x-y-z.handsontable-docs-staging.pages.dev/docs` (dots to dashes, as
  `docs-staging.yml`'s `cf-target` does). It checks out the deploy's `head_sha` so the spec matches the
  deployed pages, and `aws s3 sync --delete`s the screenshots, so a page removed from `paths.js` leaves the
  baseline. It never runs for a pull request's staging deploy. Its copy on the default branch is the one
  that runs, so a change to it is exercised only after merging – dispatch it with `branch` to test that, or
  to re-seed by hand. **Known lag:** the staging deploy triggers on `docs/**` and `handsontable/package.json`
  only, so a core-only merge that changes grid rendering is not in the baseline until the next docs merge,
  and a docs pull request opened in that window reports develop's own grid change as its differences.
  Widening that trigger is a separate call; it costs a ~10-minute docs deploy per core merge.
- **The visual project stays opt-in through the `run-docs-visual` label** – 441 full-page captures per run
  is the reason. Add the label and press "Re-run all jobs". Drop the label gate once the baseline has proven
  stable; the comment in `docs.yml`'s `visual` job marks the spot.
- **The functional specs run on every docs pull request, report-only for one sprint.**
  `playwright.config.ts` has two projects, `visual` (`visualDocs.spec.ts`) and `functional` (everything
  else); a bare `npx playwright test` still runs both. `docs.yml`'s `functional` job runs
  `--project=functional` against the preview with `continue-on-error: true`, writes one line to the job
  summary, and uploads `docs-functional-report` (7 days). After a sprint of green, flip `continue-on-error`
  off.
- **`PASS_COOKIE` is for `https://dev.handsontable.com/docs` only.** The spec sets it as a cookie on that
  domain; Cloudflare previews and the staging deploys need none. Callers pass `secrets.PASS_COOKIE` through
  the action's `pass-cookie` input.
- **A fork pull request gets no docs visual run.** `docs.yml`'s `preview` job is fork-guarded (the deploy
  needs Cloudflare secrets) and `visual` needs it. The action's report publish and seed steps carry the
  canonical guard as well; `.github/scripts/__tests__/fork-guards.test.mjs` pins all three sites.

### Running locally

Unchanged: `npm run docs:visual-test:update-screenshot` writes the goldens under
`tests/test-artifacts/screenshots/` on the first run, and `npm run docs:visual-test` compares against them.
`BASE_URL` targets another environment; `tests/.env.example` lists the variables. Add `--project=visual` or
`--project=functional` to run one project (`npx playwright test --project=visual`). Local goldens are yours,
not the CI baseline: to compare against what CI compares against, sync
`s3://handsontable-visual/docs/base/develop/screenshots` into that directory with the R2 credentials first,
or read `https://visual.handsontable.com/docs/base/develop/out.json` (`actualItems`) to see what the
baseline holds.

### Adding, removing, or breaking a page

- **A new page:** add it to `tests/paths.js`. The next seed – the staging deploy after your merge – writes
  its golden. Until then every pull request that renders it reports it as **new**, which is a `changed`
  verdict and needs the approval; that is expected, not a flake.
- **A removed or renamed page:** its golden reads as **deleted** on every pull request until the next seed
  reconciles the prefix.
- **A page that cannot be captured stably:** add its slug to `slugsToFix` (`test.fixme()`), as
  `column-filter` and `rows-sorting` are. The annotation is pushed first, so the golden stays declared and
  the page drops out of the count without reading as deleted.
- **Never add `{projectName}` to `snapshotPathTemplate`.** The template does not include the project name
  today; adding it re-keys every golden, which the next pull request reports as all of them new plus all of
  them deleted.

`.github/scripts/__tests__/docs-visual-baseline.test.mjs` pins the contract above against the config, the
spec, the action, and the workflows.

