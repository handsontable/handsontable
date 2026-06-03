# Documentation Standards

This document is written for both human authors and AI agents. All rules are stated explicitly so both roles can apply them without ambiguity.

Astro Starlight-based documentation site. **Requires Node 20** (separate from core's Node 22).

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
id: <8-char alphanum>
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
id: <8-char alphanum>
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

### Reference template

```markdown
---
type: reference
id: <8-char alphanum>
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
id: <8-char alphanum>
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

### Data coherence rules

- All rows in an example use the same domain.
- Values must be plausible: no negative ages, no revenue of $1, no dates in 1900.
- The dataset should make the demonstrated feature meaningful. A sorting example must use data where sorting is useful. A filtering example must use data where filtering makes sense.
- Use at least five rows in table examples so the feature behavior is visible.

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
id: abc12345              # 8 random alphanumeric chars — NEVER change existing IDs
title: Feature Name       # Matches H1; do NOT add H1 in body (Starlight renders title once)
metaTitle: Feature Name - JavaScript Data Grid | Handsontable
description: Short SEO description (1-2 sentences)
permalink: /feature-name
tags: [keyword1, keyword2]  # Optional; kebab-case
react:
  id: def67890            # Different ID per framework variant
  metaTitle: Feature Name - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---
```

**Rules:**
- Never change an existing `id` value. IDs are permanent.
- `title` is the only H1. Do not add `# Title` in the Markdown body.
- `description` is used in SEO meta and link previews -- make it specific and accurate.
- `tags` must be lowercase kebab-case.

---

## 2.7 Links and Paths

Use the `@` prefix with `.md` extension for all internal links:

```markdown
[text](@/path/to/file.md#anchor)
```

Do not use relative paths (`../`) for internal links.

---

## 2.8 Trademark Notices

- Pages mentioning "Excel" must include the Microsoft trademark disclaimer.
- Pages also mentioning "Google Sheets" use the expanded disclaimer.
- Add the disclaimer in a callout or footnote at the bottom of the page.

---

## 2.9 Sidebar Registration

Register new pages in `content/guides/sidebar.js`. A page not registered there will not appear in navigation.

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
- [ ] Active voice and second person ("you") used throughout
- [ ] No banned words: simply, just, easy, straightforward, note that, please
- [ ] Tutorials and how-tos have a Prerequisites section
- [ ] Tutorials have "What you learned" and "Next steps" sections
- [ ] How-tos have a "Result" section
- [ ] New page registered in `content/guides/sidebar.js`
- [ ] `id` field uses 8 random alphanumeric chars (existing IDs are unchanged)
- [ ] Microsoft trademark disclaimer added where "Excel" is mentioned
- [ ] TypeScript example exists; JS generated via `npm run docs:code-examples:generate-js`
- [ ] `[skip changelog]` in PR body (docs changes don't need changelog entries)
```
