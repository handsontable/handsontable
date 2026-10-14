import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { apiGuideLinks, readGuideTitle } from './jsdoc-convert/apiGuideLinks.mjs';

const require = createRequire(import.meta.url);

/**
 * Validates the map that adds a "See the guide" line to the generated API pages (DEV-2809).
 *
 * A mapped guide that is missing, untitled, or hidden from some frameworks would ship a dead
 * link (the API page is rendered for every framework), so this script is the gate. It runs in
 * `npm run build` before `astro build`.
 */

/**
 * Collects the guide paths that the sidebar shows to a subset of frameworks.
 *
 * @param {object} sidebar The `content/guides/sidebar.js` export.
 * @returns {{ all: Set<string>, gated: Set<string> }} Registered guide paths (as `guides/x/x.md`),
 *   and the subset restricted by `onlyFor`.
 */
export function collectSidebarGuides(sidebar) {
  const all = new Set();
  const gated = new Set();

  function walk(items) {
    for (const item of items) {
      if (item.path) {
        const file = `${item.path}.md`;

        all.add(file);

        if (Array.isArray(item.onlyFor) && item.onlyFor.length > 0) {
          gated.add(file);
        }
      }

      if (Array.isArray(item.children)) {
        walk(item.children);
      }
    }
  }

  for (const value of Object.values(sidebar)) {
    if (Array.isArray(value)) {
      walk(value);
    }
  }

  return { all, gated };
}

/**
 * @param {object} options
 * @param {Record<string, string>} options.links The map to check.
 * @param {string} options.contentDir Absolute path to `docs/content`.
 * @param {string[]} options.pluginNames Plugin directory names from `handsontable/src/plugins`.
 * @param {{ all: Set<string>, gated: Set<string> }} options.sidebar From `collectSidebarGuides()`.
 * @returns {string[]} One message per problem; empty when all entries pass.
 */
export function validateApiGuideLinks({ links, contentDir, pluginNames, sidebar }) {
  const errors = [];

  for (const [apiFile, guidePath] of Object.entries(links)) {
    const name = apiFile.replace(/\.md$/, '');

    if (!apiFile.endsWith('.md') || !pluginNames.includes(name)) {
      errors.push(`${apiFile}: not a plugin API page (the map covers plugins only).`);
    }

    if (!guidePath.startsWith('guides/') || !guidePath.endsWith('.md')) {
      errors.push(`${apiFile}: "${guidePath}" must be a path like guides/<section>/<page>/<page>.md.`);
      continue;
    }

    if (!existsSync(join(contentDir, guidePath))) {
      errors.push(`${apiFile}: the guide "${guidePath}" does not exist.`);
      continue;
    }

    try {
      readGuideTitle(guidePath, contentDir);
    } catch (error) {
      errors.push(`${apiFile}: ${error.message}`);
    }

    if (!sidebar.all.has(guidePath)) {
      errors.push(`${apiFile}: the guide "${guidePath}" is not registered in the sidebar.`);
    }

    if (sidebar.gated.has(guidePath)) {
      errors.push(`${apiFile}: the guide "${guidePath}" is framework-specific (onlyFor), so the link would be dead in other frameworks.`);
    }
  }

  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const contentDir = resolve(process.cwd(), 'content');
  const pluginsDir = resolve(process.cwd(), '../handsontable/src/plugins');
  const pluginNames = readdirSync(pluginsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  const sidebar = collectSidebarGuides(require(join(contentDir, 'guides/sidebar.js')));
  const errors = validateApiGuideLinks({ links: apiGuideLinks, contentDir, pluginNames, sidebar });

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  console.log(`All API page guide links are valid (${Object.keys(apiGuideLinks).length} pages).`);
}
