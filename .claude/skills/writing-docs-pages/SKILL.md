---
name: writing-docs-pages
path: docs/**
description: Use when creating or editing documentation pages in docs/content/guides/ - covers YAML frontmatter, page structure, framework-specific example embedding, writing style, and sidebar registration
---

# Writing Documentation Pages

This skill covers how to create and edit guide pages in `docs/content/guides/`.

## 1. Frontmatter (required)

Every `.md` file starts with YAML frontmatter.

```yaml
---
title: Feature Name
metaTitle: Feature Name - JavaScript Data Grid | Handsontable
description: Short SEO description under 160 characters.
permalink: /feature-name
canonicalUrl: /feature-name
tags:
  - keyword1
  - keyword2
react:
  metaTitle: Feature Name - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features    # Must match a sidebar category exactly
menuTag: new | updated     # Optional; sidebar badge
---
```

Set `menuTag: new` when you create a new page and `menuTag: updated` when you make a substantive content change to an existing page. Omit it for trivial fixes (typos, snippet/link corrections) and for changelog and migration-guide pages; leave any existing tag in place.

## 2. Page Structure

Follow this order consistently:

1. **No H1 in the Markdown body** - Starlight renders the page heading from the `title` frontmatter field. Do not add `# Title` (or any other H1) after the frontmatter, or the title appears twice on the page.
2. **Overview** - start with 1-2 sentences describing what the feature does and why it matters (first content after `---`).
3. **`[[toc]]`** - auto-generates a table of contents from headings.
4. **Progressive sections** - use `##` and below only, ordered from basic to advanced: Enable the feature, Basic usage, Configuration options, Advanced usage, Keyboard shortcuts, Known limitations, API reference links.

## 3. Framework-Specific Content

Wrap content that applies to only one framework:

```markdown
::: only-for javascript

JavaScript-only content here.

:::

::: only-for react

React-only content here.

:::
```

**Important:** The `:::` markers must be on their own lines with blank lines before and after the content block.

## 4. Example Embedding

Embed runnable code examples using this pattern. The `--js 1 --ts 2` flags set tab order.

```markdown
::: only-for javascript

::: example #example1 --js 1 --ts 2
@[code](@/content/guides/category/feature/javascript/example1.js)
@[code](@/content/guides/category/feature/javascript/example1.ts)
:::

:::

::: only-for react

::: example #example1 :react --tsx 1 --jsx 2
@[code](@/content/guides/category/feature/react/example1.tsx)
@[code](@/content/guides/category/feature/react/example1.jsx)
:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/category/feature/vue/example1.vue)

:::

:::
```

**Vue 3:** Embed a single TypeScript SFC (`vue/example1.vue` with `<script setup lang="ts">`). Use the `:vue3` preset (or `:vue3-languages`, `:vue3-vuex` when the feature needs extra dependencies). Do not use `--html` / `--js` tabs for new Vue examples. See skill `creating-docs-examples` for the full Vue SFC pattern.

**Angular:** Use `:angular` with `--ts 1 --html 2`.

## 5. Writing Style

Full site voice and the words-to-avoid list are in `docs/AGENTS.md` §2.2 (the docs-site override of the monorepo standards in `.ai/DOC-STANDARDS.md`). Key points for pages:

- Active voice, American English, short sentences.
- Address the reader as "you", never "we". Use the Oxford comma.
- No evaluative adjectives ("easy", "simple", "obvious").
- Use hyphens (`-`) or double hyphens (`--`) to separate clauses, not en dashes — this is the docs-site convention (unlike JSDoc/changelog, which use en dashes).
- Bold for UI elements: **Add comment**. Inline code for API names: `comments`.
- Internal links: `[text](@/path/to/file.md#anchor)` syntax.
- End every sentence with a full stop, including in lists.

## 6. Trademark Rules

Pages mentioning "Excel" must include the Microsoft/Excel trademark disclaimer at the bottom. Pages that also mention "Google Sheets" use the expanded disclaimer covering both trademarks.

## 7. Sidebar Registration

After creating a new page, add it to `docs/content/guides/sidebar.js`. Find the correct category array and insert an entry:

```js
{ path: 'guides/category/feature-name/feature-name' }
```

Use `onlyFor: ['react']` or `onlyFor: ['angular']` if the page is framework-specific.

## 8. Code Example Generation

For **JavaScript** and **React** examples, edit the TypeScript source first (`.ts` or `.tsx`). Then generate the JavaScript variant from the `docs/` directory:

```bash
cd docs && npm run docs:code-examples:generate-js -- <path-to-ts-file>
```

Use a path relative to `docs/` (for example `content/recipes/foo/javascript/example1.ts`).

For **Vue** examples, write TypeScript directly in the `.vue` file (`<script setup lang="ts">`). There is no separate JS file to generate.

## Reference

See `docs/README-EDITING.md` for the complete editing rules, including all frontmatter tags, container syntax, and content formatting details.
