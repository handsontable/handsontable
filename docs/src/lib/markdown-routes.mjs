import { filterOnlyFor } from '../plugins/framework-loader.mjs';

/**
 * Builds the per-framework Markdown twins of one docs page, the files behind
 * Copy Markdown (`/docs/_md/{prefix}/{slug}.md`) and the pages of
 * `llms-full.txt`. Each framework gets the body with its own `::: only-for`
 * blocks kept and every other framework's blocks removed, the same filter the
 * content loader applies to the HTML page, so no `only-for` marker line
 * reaches the output.
 *
 * @param {string} slug The page slug, without the framework prefix or `.md`.
 * @param {string} content The page body, frontmatter removed.
 * @param {Record<string, string>} frameworkPrefixes Framework name to URL prefix,
 *   e.g. `{ react: 'react-data-grid' }`.
 * @param {(content: string) => string} build Turns a filtered body into the
 *   final Markdown file.
 * @returns {Array<[string, string]>} `[routePath, markdown]` pairs, one per framework.
 */
export function buildFrameworkMarkdownRoutes(slug, content, frameworkPrefixes, build) {
  return Object.entries(frameworkPrefixes).map(([framework, prefix]) => [
    `${prefix}/${slug}.md`,
    build(filterOnlyFor(content, framework)),
  ]);
}
