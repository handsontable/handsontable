/**
 * Generates the Starlight sidebar configuration from the existing VuePress
 * sidebar.js data files. No content files are moved or renamed.
 *
 * Titles are read from frontmatter via gray-matter for accuracy; the path's
 * last segment is used as a fallback.
 */

import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve paths relative to this file (docs/src/sidebar.mjs)
const CONTENT_DIR = join(__dirname, '..', 'content');

const { guides } = require('../content/sidebars.js');
const { sidebar: apiItems } = require('../content/api/sidebar.js');
const { sidebar: recipeItems } = require('../content/recipes/sidebar.js');

const FRAMEWORK_PREFIXES = {
  javascript: 'javascript-data-grid',
  react: 'react-data-grid',
  angular: 'angular-data-grid',
  vue: 'vue-data-grid',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a kebab-case slug to Title Case. */
function humanize(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns the frontmatter title for a content path, falling back to a
 * humanized version of the last path segment.
 *
 * @param {string} path - e.g. "guides/getting-started/introduction/introduction"
 */
function getTitle(path) {
  const mdFile = join(CONTENT_DIR, `${path}.md`);

  if (existsSync(mdFile)) {
    try {
      const { data } = matter(readFileSync(mdFile, 'utf-8'));

      if (data.title) return data.title;
    } catch {
      // Fall through to the humanized fallback
    }
  }

  return humanize(path.split('/').pop());
}

/**
 * Returns the `menuTag` frontmatter value for a content path, or null if not found.
 * Supported values: 'new' | 'updated'
 *
 * @param {string} path - e.g. "guides/getting-started/installation/installation"
 */
function getMenuTag(path) {
  const mdFile = join(CONTENT_DIR, `${path}.md`);

  if (existsSync(mdFile)) {
    try {
      const { data } = matter(readFileSync(mdFile, 'utf-8'));

      if (data.menuTag) return String(data.menuTag).toLowerCase();
    } catch {
      // Fall through to null
    }
  }

  return null;
}

/**
 * Converts a menuTag string to a Starlight badge config.
 *
 * @param {string|null} tag - 'new' | 'updated' | null
 * @returns {{ text: string, variant: string }|undefined}
 */
function tagToBadge(tag) {
  if (!tag) return undefined;

  const MAP = {
    new:     { text: 'New',     variant: 'success' },
    updated: { text: 'Updated', variant: 'caution' },
  };

  return MAP[tag] ?? { text: tag.charAt(0).toUpperCase() + tag.slice(1), variant: 'default' };
}

/**
 * Returns the `permalink` frontmatter value for a content path, or null if not found.
 *
 * @param {string} path - e.g. "guides/getting-started/introduction/introduction"
 */
function getPermalink(path) {
  const mdFile = join(CONTENT_DIR, `${path}.md`);

  if (existsSync(mdFile)) {
    try {
      const { data } = matter(readFileSync(mdFile, 'utf-8'));

      if (data.permalink) return data.permalink;
    } catch {
      // Fall through to null
    }
  }

  return null;
}

/**
 * Converts a VuePress sidebar path to a Starlight link using the page's
 * permalink frontmatter. Falls back to the file-path-based URL if no
 * permalink is found.
 *
 * Production URL pattern: "/{prefix}{permalink}/"
 * e.g. "/react-data-grid/installation/"
 *
 * @param {string} path - e.g. "guides/getting-started/installation/installation"
 * @param {string} prefix - e.g. "javascript-data-grid"
 */
function toLink(path, prefix) {
  const permalink = getPermalink(path);

  if (permalink) {
    // permalink: '/'         → "/{prefix}/"
    // permalink: '/foo'      → "/{prefix}/foo/"
    // permalink: '/recipes/' → "/{prefix}/recipes/" (trailing slash stripped before append)
    if (permalink === '/') return `/${prefix}/`;

    return `/${prefix}${permalink.replace(/\/$/, '')}/`;
  }

  // Fallback: strip duplicate trailing segment from file path
  const parts = path.split('/');

  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    parts.pop();
  }

  return `/${prefix}/${parts.join('/')}/`;
}

/**
 * Converts a VuePress sidebar items array to Starlight sidebar items,
 * filtering out entries restricted to other frameworks.
 *
 * @param {Array<{ path: string, onlyFor?: string[] }>} items
 * @param {string} framework
 * @param {string} prefix
 */
function toStarlightItems(items, framework, prefix) {
  return items
    .filter((item) => {
      if (!item.onlyFor) return true;

      const allowed = Array.isArray(item.onlyFor) ? item.onlyFor : [item.onlyFor];

      return allowed.includes(framework);
    })
    .map((item) => {
      const entry = {
        label: getTitle(item.path),
        link: toLink(item.path, prefix),
      };
      const badge = tagToBadge(getMenuTag(item.path));

      if (badge) entry.badge = badge;

      return entry;
    });
}

// ---------------------------------------------------------------------------
// API sidebar
// ---------------------------------------------------------------------------

/**
 * Converts the VuePress API sidebar (which mixes plain strings and an object
 * with `children`) into Starlight format.
 *
 * @param {string} framework
 * @param {string} prefix
 */
function buildApiSidebar(framework, prefix) {
  const items = [];

  for (const entry of apiItems) {
    if (typeof entry === 'string') {
      const permalink = getPermalink(`api/${entry}`);
      // Strip a trailing slash from permalink before appending '/' to avoid double slashes.
      const link = permalink
        ? `/${prefix}${permalink.replace(/\/$/, '')}/`
        : `/${prefix}/api/${entry}/`;

      items.push({ label: getTitle(`api/${entry}`), link });
    } else if (entry.children) {
      // Plugin group
      items.push({
        label: entry.title ?? 'Plugins',
        collapsed: true,
        items: entry.children.map((name) => {
          const permalink = getPermalink(`api/${name}`);
          const link = permalink
            ? `/${prefix}${permalink.replace(/\/$/, '')}/`
            : `/${prefix}/api/${name}/`;

          return { label: getTitle(`api/${name}`), link };
        }),
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Recipes sidebar
// ---------------------------------------------------------------------------

/**
 * Builds the Starlight sidebar config for the Recipes section.
 *
 * Handles the mixed format of recipes/sidebar.js:
 *   - Plain strings (e.g. 'introduction') → a flat link entry.
 *   - Objects with `children` → a collapsed group, filtered by `onlyFor`.
 *
 * @param {string} framework - "javascript" | "react" | "angular"
 * @param {string} prefix - URL prefix e.g. "javascript-data-grid"
 */
function buildRecipesSidebar(framework, prefix) {
  const items = [];

  for (const entry of recipeItems) {
    if (typeof entry === 'string') {
      const fullPath = `recipes/${entry}`;

      items.push({ label: getTitle(fullPath), link: toLink(fullPath, prefix) });
    } else if (entry.children) {
      if (entry.onlyFor) {
        const allowed = Array.isArray(entry.onlyFor) ? entry.onlyFor : [entry.onlyFor];

        if (!allowed.includes(framework)) continue;
      }

      const children = [];

      // Add the group overview page as the first item if a path is defined.
      if (entry.path) {
        const overviewPath = `recipes/${entry.path}`;

        children.push({ label: 'Overview', link: toLink(overviewPath, prefix) });
      }

      for (const child of entry.children) {
        if (child.onlyFor) {
          const allowed = Array.isArray(child.onlyFor) ? child.onlyFor : [child.onlyFor];

          if (!allowed.includes(framework)) continue;
        }

        const fullPath = `recipes/${child.path}`;
        const item = { label: child.title || getTitle(fullPath), link: toLink(fullPath, prefix) };
        const badge = tagToBadge(getMenuTag(fullPath));

        if (badge) item.badge = badge;
        children.push(item);
      }

      if (children.length > 0) {
        items.push({ label: entry.title, collapsed: false, items: children });
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Changelog sidebar (Upgrade and migration pages)
// ---------------------------------------------------------------------------

/**
 * Builds the Starlight sidebar config for the Changelog section, organized
 * into three sub-groups: Changelog (per major version), Policy, and Migration guides.
 *
 * @param {string} framework - "javascript" | "react" | "angular"
 * @param {string} prefix - URL prefix e.g. "javascript-data-grid"
 */
function buildChangelogSidebar(framework, prefix) {
  const group = guides.find((g) => g.title === 'Upgrade and migration');

  if (!group) return [];

  const changelog = [];
  const policy = [];
  const migration = [];

  const POLICY_SLUGS = ['versioning-policy', 'deprecation-policy', 'long-term-support'];

  for (const item of group.children) {
    if (item.onlyFor) {
      const allowed = Array.isArray(item.onlyFor) ? item.onlyFor : [item.onlyFor];

      if (!allowed.includes(framework)) continue;
    }

    const slug = item.path.split('/').pop();

    if (slug.startsWith('changelog') || slug === 'changes-between-versions') {
      changelog.push(item);
    } else if (POLICY_SLUGS.includes(slug)) {
      policy.push(item);
    } else {
      migration.push(item);
    }
  }

  const toItems = (items) => toStarlightItems(items, framework, prefix);

  return [
    { label: 'Changelog', collapsed: true, items: toItems(changelog) },
    { label: 'Policy', collapsed: true, items: toItems(policy) },
    { label: 'Migration guides', collapsed: true, items: toItems(migration) },
  ];
}

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

/**
 * Builds the full Starlight sidebar config for a given framework.
 *
 * @param {string} framework - "javascript" | "react" | "angular"
 * @param {string} prefix - URL prefix e.g. "javascript-data-grid"
 * @returns {import('@astrojs/starlight').StarlightUserConfig['sidebar']}
 */
export function buildSidebar(framework = 'javascript', prefix = 'javascript-data-grid') {
  const guideSections = guides
    .filter((section) => section.title !== 'Upgrade and migration')
    .map((section) => ({
      label: section.title,
      collapsed: true,
      items: toStarlightItems(section.children, framework, prefix),
    }));

  return [
    ...guideSections,
    {
      label: 'API reference',
      collapsed: true,
      items: buildApiSidebar(framework, prefix),
    },
  ];
}

/**
 * Builds sidebar configs for all supported frameworks, including recipes.
 *
 * @returns {{ javascript: Array, react: Array, angular: Array, vue: Array,
 *             javascriptRecipes: Array, reactRecipes: Array, angularRecipes: Array, vueRecipes: Array,
 *             javascriptChangelog: Array, reactChangelog: Array, angularChangelog: Array, vueChangelog: Array }}
 */
export function buildAllSidebars() {
  const result = {};

  for (const [framework, prefix] of Object.entries(FRAMEWORK_PREFIXES)) {
    result[framework] = buildSidebar(framework, prefix);
    result[`${framework}Recipes`] = buildRecipesSidebar(framework, prefix);
    result[`${framework}Changelog`] = buildChangelogSidebar(framework, prefix);
  }

  return result;
}

/**
 * Recursively extracts all `link` values from a Starlight sidebar items array.
 *
 * @param {Array} items
 * @param {Set<string>} acc
 */
function flattenLinks(items, acc = new Set()) {
  for (const item of items) {
    if (item.link) acc.add(item.link);
    if (item.items) flattenLinks(item.items, acc);
  }

  return acc;
}

/**
 * Returns a map of framework key → Set of valid URL paths (without the /docs
 * base prefix) for all sidebar sections: guides, API, recipes, and changelog.
 *
 * Use this to decide whether a cross-framework link should navigate to the
 * equivalent page or fall back to the framework's root page.
 *
 * @returns {{ javascript: Set<string>, react: Set<string>, angular: Set<string>, vue: Set<string> }}
 */
export function buildAllValidUrls() {
  const result = {};

  for (const [framework, prefix] of Object.entries(FRAMEWORK_PREFIXES)) {
    const acc = new Set();

    flattenLinks(buildSidebar(framework, prefix), acc);
    flattenLinks(buildRecipesSidebar(framework, prefix), acc);
    flattenLinks(buildChangelogSidebar(framework, prefix), acc);
    result[framework] = acc;
  }

  return result;
}
