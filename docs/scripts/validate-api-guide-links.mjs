import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { apiGuideLinks, readGuideFrontmatter, unmappedPlugins } from './jsdoc-convert/apiGuideLinks.mjs';

const require = createRequire(import.meta.url);

/**
 * Directories of `handsontable/src/plugins` that are not plugins with an API page.
 */
const NON_PLUGIN_DIRS = ['base', '__tests__'];

/**
 * API pages that are not plugins but still link to a guide. `Options` already links its guides from the
 * text of each option, and `Core` is skipped, so neither is listed.
 */
const NON_PLUGIN_API_PAGES = ['hooks.md', 'baseEditor.md'];

/**
 * Where the class description of each non-plugin API page lives, relative to `handsontable/src`.
 * The Hooks description is the first JSDoc block of its file and has no `@class` tag.
 */
const NON_PLUGIN_SOURCES = {
  'hooks.md': { file: 'core/hooks/constants.ts', firstBlock: true },
  'baseEditor.md': { file: 'editors/baseEditor/baseEditor.ts' },
};

/**
 * Validates the map that adds a "See the guide" line to the generated API pages (DEV-2809).
 *
 * A mapped guide that is missing, untitled, or without a `permalink` would ship a dead link
 * (the content loader skips a page with no permalink). One that the sidebar limits to some
 * frameworks would link readers to a page missing from their navigation. This script is the gate. It runs in
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

        // `onlyFor` is an array or a plain string, as in src/sidebar.mjs.
        if (item.onlyFor && [].concat(item.onlyFor).length > 0) {
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
 * Checks one guide path of a map entry.
 *
 * @param {string} apiFile The API page file name, used in the messages.
 * @param {unknown} guidePath The guide path relative to `docs/content/`.
 * @param {string} contentDir Absolute path to `docs/content`.
 * @param {{ all: Set<string>, gated: Set<string> }} sidebar From `collectSidebarGuides()`.
 * @returns {string[]} One message per problem.
 */
function validateGuide(apiFile, guidePath, contentDir, sidebar) {
  const errors = [];

  if (typeof guidePath !== 'string' || !guidePath.startsWith('guides/') || !guidePath.endsWith('.md')) {
    return [`${apiFile}: ${JSON.stringify(guidePath)} must be a path like guides/<section>/<page>/<page>.md.`];
  }

  if (!existsSync(join(contentDir, guidePath))) {
    return [`${apiFile}: the guide "${guidePath}" does not exist.`];
  }

  const frontmatter = readGuideFrontmatter(guidePath, contentDir);

  if (typeof frontmatter.title !== 'string' || !frontmatter.title) {
    errors.push(`${apiFile}: the guide "${guidePath}" has no title in its frontmatter.`);
  }

  if (typeof frontmatter.permalink !== 'string' || !frontmatter.permalink) {
    errors.push(`${apiFile}: the guide "${guidePath}" has no permalink, so the link would 404.`);
  }

  if (!sidebar.all.has(guidePath)) {
    errors.push(`${apiFile}: the guide "${guidePath}" is not registered in the sidebar.`);
  }

  if (sidebar.gated.has(guidePath)) {
    errors.push(`${apiFile}: the guide "${guidePath}" is framework-specific (onlyFor), so other frameworks would link to a page missing from their navigation.`);
  }

  return errors;
}

/**
 * @param {object} options
 * @param {Record<string, string | string[]>} options.links The map to check. A value is one guide path or an array of them.
 * @param {string} options.contentDir Absolute path to `docs/content`.
 * @param {string[]} options.pluginNames Plugin directory names from `handsontable/src/plugins`.
 * @param {{ all: Set<string>, gated: Set<string> }} options.sidebar From `collectSidebarGuides()`.
 * @param {string[]} [options.unmapped] Plugins that deliberately have no guide link.
 * @returns {string[]} One message per problem; empty when all entries pass.
 */
export function validateApiGuideLinks({ links, contentDir, pluginNames, sidebar, unmapped = unmappedPlugins }) {
  const errors = [];

  for (const name of unmapped) {
    if (!pluginNames.includes(name)) {
      errors.push(`${name}: listed in unmappedPlugins but is not a plugin directory.`);
    }
  }

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

  for (const [apiFile, value] of Object.entries(links)) {
    const name = apiFile.replace(/\.md$/, '');

    if (!apiFile.endsWith('.md') || (!pluginNames.includes(name) && !NON_PLUGIN_API_PAGES.includes(apiFile))) {
      errors.push(`${apiFile}: not a plugin, hooks, or baseEditor API page (the map covers those only).`);
    }

    const guidePaths = [].concat(value);

    if (guidePaths.length === 0) {
      errors.push(`${apiFile}: the guide list is empty. Remove the entry or add a guide.`);
    }

    for (const guidePath of guidePaths) {
      errors.push(...validateGuide(apiFile, guidePath, contentDir, sidebar));
    }
  }

  return errors;
}

/**
 * Finds the class description (the JSDoc block that carries `@class <Name>`) of an API page in its source.
 *
 * @param {string} sourceFile Absolute path to the source file.
 * @param {string} pageName The API page name without `.md`, for example `contextMenu`.
 * @param {boolean} [firstBlock] Use the first JSDoc block of the file instead of looking for `@class`.
 * @returns {string | null} The JSDoc block, or null when the file or the block is missing.
 */
function readClassDescription(sourceFile, pageName, firstBlock = false) {
  if (!existsSync(sourceFile)) {
    return null;
  }

  const blocks = readFileSync(sourceFile, 'utf8').match(/\/\*\*[\s\S]*?\*\//g) ?? [];

  if (firstBlock) {
    return blocks[0] ?? null;
  }

  return blocks.find((block) => {
    const tag = block.match(/@class\s+(\w+)/);

    return tag !== null && tag[1].toLowerCase() === pageName.toLowerCase();
  }) ?? null;
}

/**
 * Tells whether a line only points the reader at a guide: a "See ..." or "Read more ..." sentence, or a
 * bullet that holds nothing but a link. A link inside a sentence that explains something else is not a
 * pointer.
 *
 * @param {string} line One line of text, with or without the JSDoc ` * ` prefix.
 * @returns {boolean} True for a pointer line.
 */
export function isGuidePointerLine(line) {
  const text = line.replace(/^\s*\*\s?/, '').trim();

  return /^(?:[-*]\s+)?(?:see|read more|learn more|for more|guides?\b)/i.test(text)
    || /^[-*]\s+\[[^\]]+\]\([^)]*\)\s*$/.test(text);
}

/**
 * Counts the lines of a text that point at a guide with an unanchored link. A link with an anchor
 * (`...guide.md#section`) points at a part of the guide and is not counted.
 *
 * @param {string} text The text to scan.
 * @param {string} guidePath The guide path relative to `docs/content/`.
 * @returns {number} The number of pointer lines that link to the guide.
 */
export function countGuidePointerLines(text, guidePath) {
  const link = `](@/${guidePath})`;

  return text.split('\n').filter(line => line.includes(link) && isGuidePointerLine(line)).length;
}

/**
 * Fails on a hand-written pointer to a mapped guide in the class description of its API page. The
 * renderer already writes that pointer (the "See the guide" line), so a second one in any wording
 * ("See ...", "Read more ...", a bullet that is only a link) shows twice. A link with an anchor, and a
 * link inside a sentence that explains something else, stay allowed.
 *
 * @param {object} options
 * @param {Record<string, string | string[]>} options.links The map to check.
 * @param {string} options.srcDir Absolute path to `handsontable/src`.
 * @returns {string[]} One message per duplicate pointer; empty when none is found.
 */
export function validateNoHandWrittenGuideLinks({ links, srcDir }) {
  const errors = [];

  for (const [apiFile, value] of Object.entries(links)) {
    const name = apiFile.replace(/\.md$/, '');
    const source = NON_PLUGIN_SOURCES[apiFile] ?? { file: `plugins/${name}/${name}.ts` };
    const description = readClassDescription(join(srcDir, source.file), name, source.firstBlock);

    if (description === null) {
      continue;
    }

    for (const guidePath of [].concat(value)) {
      if (typeof guidePath === 'string' && countGuidePointerLines(description, guidePath) > 0) {
        errors.push(`${apiFile}: the class description has a hand-written pointer to "${guidePath}". The generated "See the guide" line already does, so delete it, or point it at an anchor.`);
      }
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
  const errors = [
    ...validateApiGuideLinks({ links: apiGuideLinks, contentDir, pluginNames, sidebar }),
    ...validateNoHandWrittenGuideLinks({ links: apiGuideLinks, srcDir: resolve(docsDir, '../handsontable/src') }),
  ];

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  console.log(`All API page guide links are valid (${Object.keys(apiGuideLinks).length} pages).`);
}
