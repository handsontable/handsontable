# Documentation Site

VuePress-based documentation. **Requires Node 20** (separate from core's Node 22).

## Writing Style

- Active voice, American English, short sentences
- "you" not "we", Oxford comma
- No evaluative adjectives ("easy", "simple", "obvious")
- En dashes (-) to separate clauses
- Bold for UI elements: **Add comment**
- Inline code for API: `comments`

## Page Frontmatter (required)

```yaml
---
id: abc12345              # 8 random alphanumeric chars (NEVER change existing)
title: Feature Name
metaTitle: Feature Name - JavaScript Data Grid | Handsontable
description: Short SEO description
permalink: /feature-name
tags: [keyword1, keyword2]
react:
  id: def67890            # Different ID per framework
  metaTitle: Feature Name - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---
```

## Framework-Specific Content

```markdown
::: only-for javascript
Content for JS only
:::

::: only-for react
Content for React only
:::
```

## Example Embedding

```markdown
::: example #example1 --js 1 --ts 2
@[code](@/content/guides/category/feature/javascript/example1.js)
@[code](@/content/guides/category/feature/javascript/example1.ts)
:::
```

## Links

`[text](@/path/to/file.md#anchor)` - always use `@` prefix with `.md` extension.

## Code Examples

- TypeScript is primary. Generate JS: `npm run docs:code-examples:generate-js <path>`
- Always include `licenseKey: 'non-commercial-and-evaluation'`
- One concept per example, 25-60 lines

## Trademark

Pages mentioning "Excel" must include Microsoft trademark disclaimer. Pages also mentioning "Google Sheets" use expanded disclaimer.

## Sidebar

Register new pages in `content/guides/sidebar.js`.

For detailed guidance: use skills `writing-docs-pages`, `creating-docs-examples`
