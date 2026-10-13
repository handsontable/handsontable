---
name: writing-docs-pages
path: docs/**
description: Use when creating or editing documentation pages in docs/content/guides/ - covers YAML frontmatter, page structure, framework-specific example embedding, writing style, and sidebar registration
---

# Writing Documentation Pages

## 1. Frontmatter (required)

```yaml
---
title: Feature Name
metaTitle: Feature Name - JavaScript Data Grid | Handsontable
description: Short SEO description under 160 characters.
permalink: /feature-name
canonicalUrl: /feature-name
tags:
  - keyword1
react:
  metaTitle: Feature Name - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features    # Must match a sidebar category exactly
menuTag: new | updated     # Optional; sidebar badge
addedIn: "17.0.0"          # Optional; version that introduced the feature
---
```

- `menuTag: new` on a new page, `menuTag: updated` on a substantive content change. Omit it for typos, snippet/link corrections, and changelog and migration-guide pages; leave an existing tag in place.
- `addedIn`: set when the page documents a feature introduced in 14.0.0 or later. Use the full version as a quoted string (`"18.1.0"`, not `18.1`), from the changelog's "Added" entry or the option's `@since` tag. Leave it out for recipes, a new page about an old feature, and a feature that is one section of an older page. `npm run build` fails on a malformed or never-released version.

## 2. Page structure

1. No H1 in the body: Starlight renders the `title`.
2. Overview: 1-2 sentences right after the frontmatter.
3. `[[toc]]`.
4. `##` and below only, basic to advanced: Enable the feature, Basic usage, Configuration options, Advanced usage, Keyboard shortcuts, Known limitations, API reference links.

## 3. Framework-specific content

```markdown
::: only-for javascript

JavaScript-only content here.

:::
```

Put the `:::` markers on their own lines, with blank lines around the content. Frameworks: `javascript`, `react`, `angular`, `vue`.

## 4. Example embedding

`--js 1 --ts 2` sets tab order.

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

- **Vue 3:** embed a single TypeScript SFC (`<script setup lang="ts">`) with the `:vue3` preset (`:vue3-languages` or `:vue3-vuex` for extra dependencies). Skip `--html` / `--js` tabs. Full pattern: skill `creating-docs-examples`.
- **Angular:** `:angular` with `--ts 1 --html 2`.

## 5. Writing style

Full voice and words-to-avoid list: `docs/AGENTS.md` §2.2 (overrides `.ai/DOC-STANDARDS.md` for the docs site). Page rules:

- Active voice, American English, short sentences, "you", Oxford comma, no evaluative adjectives ("easy", "simple", "obvious").
- Separate clauses with hyphens (`-`) or double hyphens (`--`). The docs site uses these where JSDoc and changelog use en dashes.
- Bold for UI elements (**Add comment**), inline code for API names (`comments`).
- Internal links: `[text](@/path/to/file.md#anchor)`.
- End every sentence with a full stop, lists included.

## 6. Trademark

Pages mentioning "Excel" end with the Microsoft/Excel trademark disclaimer. Pages that also mention "Google Sheets" use the expanded disclaimer for both.

## 7. Sidebar registration

Add a new page to the right category array in `docs/content/guides/sidebar.js`:

```js
{ path: 'guides/category/feature-name/feature-name' }
```

Add `onlyFor: ['react']` or `onlyFor: ['angular']` for a framework-specific page.

## 8. Code example generation

Edit the TypeScript source first (`.ts` or `.tsx`), then generate JavaScript from `docs/` with a path relative to `docs/`:

```bash
cd docs && npm run docs:code-examples:generate-js -- content/recipes/foo/javascript/example1.ts
```

Vue examples are written directly in the `.vue` file; no JS variant exists.

## Reference

`docs/README-EDITING.md`: all frontmatter tags, container syntax, content formatting.
