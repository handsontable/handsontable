import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { apiGuideLinks, readGuideTitle, unmappedPlugins } from './jsdoc-convert/apiGuideLinks.mjs';

const require = createRequire(import.meta.url);

/**
 * Directories of `handsontable/src/plugins` that are not plugins with an API page.
 */
const NON_PLUGIN_DIRS = ['base', '__tests__'];

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
 * @param {string[]} [options.unmapped] Plugins that deliberately have no guide link.
 * @returns {string[]} One message per problem; empty when all entries pass.
 */
export function validateApiGuideLinks({ links, contentDir, pluginNames, sidebar, unmapped = unmappedPlugins }) {
  const errors = [];

  for (const name of pluginNames) {
    if (NON_PLUGIN_DIRS.includes(name)) {
      continue;
    }

    const isMapped = Object.hasOwn(links, `${name}.md`);
    const isUnmapped = unmapped.includes(name);

    if (!isMapped && !isUnmapped) {
      errors.push(`${name}: plugin has no guide link. Add it to apiGuideLinks, or list it in unmappedPlugins.`);
    }

    if (isMapped && isUnmapped) {
      errors.push(`${name}: plugin is both mapped and listed in unmappedPlugins.`);
    }
  }

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

// process.argv[1] may be relative, so compare it as a file URL the way Node resolves import.meta.url.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Resolve from this file, not the working directory, so the script runs from any directory.
  const docsDir = resolve(import.meta.dirname, '..');
  const contentDir = join(docsDir, 'content');
  const pluginsDir = resolve(docsDir, '../handsontable/src/plugins');
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
