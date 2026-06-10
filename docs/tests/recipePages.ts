/**
 * Scans docs/content/recipes/ and returns the list of recipe pages to test.
 *
 * `hasExamples` is inferred from whether the page content contains an
 * interactive hot-example block (`:hot-recipe`, `:react-advanced`, or
 * `:angular` marker).  Pages that only show code snippets via `--code-only`
 * or have no examples at all return `false`.
 *
 * `framework` is read from the optional `framework` frontmatter field
 * (values: `angular` | `react`).  Pages without that field default to
 * `javascript-data-grid`.
 *
 * Adding a new recipe page to docs/content/recipes/ is the ONLY step
 * required for it to appear in the smoke-test run.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

type Framework = 'javascript-data-grid' | 'react-data-grid' | 'angular-data-grid';

export type RecipePage = {
  path: string;
  framework: Framework;
  hasExamples: boolean;
};

const INTERACTIVE_EXAMPLE_RE = /:::\s+example\s+#\S+\s+:(hot-recipe|react-advanced|angular)\b/;

function frameworkPrefix(value?: string): Framework {
  if (value === 'angular') return 'angular-data-grid';
  if (value === 'react') return 'react-data-grid';
  return 'javascript-data-grid';
}

function collectMarkdownFiles(dir: string, results: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectMarkdownFiles(full, results);
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

export function loadRecipePages(contentRecipesDir: string): RecipePage[] {
  const files = collectMarkdownFiles(contentRecipesDir);
  const pages: RecipePage[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);

    if (typeof data.permalink !== 'string') continue;

    // Strip leading and trailing slashes so it matches the test URL helper.
    const pagePath = data.permalink.replace(/^\/|\/$/g, '');

    if (!pagePath.startsWith('recipes')) continue;

    pages.push({
      path: pagePath,
      framework: frameworkPrefix(data.framework),
      hasExamples: INTERACTIVE_EXAMPLE_RE.test(content),
    });
  }

  return pages.sort((a, b) => a.path.localeCompare(b.path));
}
