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
 * Converts a VuePress sidebar path to a Starlight link.
 * VuePress path: "guides/getting-started/introduction/introduction"
 * Starlight link: "/guides/getting-started/introduction/introduction/"
 */
function toLink(path) {
  return `/${path}/`;
}

/**
 * Converts a VuePress sidebar items array to Starlight sidebar items,
 * filtering out entries restricted to other frameworks.
 *
 * @param {Array<{ path: string, onlyFor?: string[] }>} items
 * @param {string} framework
 */
function toStarlightItems(items, framework) {
  return items
    .filter((item) => {
      if (!item.onlyFor) return true;

      const allowed = Array.isArray(item.onlyFor) ? item.onlyFor : [item.onlyFor];

      return allowed.includes(framework);
    })
    .map((item) => ({
      label: getTitle(item.path),
      link: toLink(item.path),
    }));
}

// ---------------------------------------------------------------------------
// API sidebar
// ---------------------------------------------------------------------------

/**
 * Converts the VuePress API sidebar (which mixes plain strings and an object
 * with `children`) into Starlight format.
 */
function buildApiSidebar(framework) {
  const items = [];

  for (const entry of apiItems) {
    if (typeof entry === 'string') {
      items.push({
        label: getTitle(`api/${entry}`),
        link: `/api/${entry}/`,
      });
    } else if (entry.children) {
      // Plugin group
      items.push({
        label: entry.title ?? 'Plugins',
        collapsed: true,
        items: entry.children.map((name) => ({
          label: getTitle(`api/${name}`),
          link: `/api/${name}/`,
        })),
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Builds the full Starlight sidebar config for a given framework.
 *
 * @param {string} framework - "javascript" | "react" | "angular" | "vue3"
 * @returns {import('@astrojs/starlight').StarlightUserConfig['sidebar']}
 */
export function buildSidebar(framework = 'javascript') {
  const guideSections = guides.map((section) => ({
    label: section.title,
    collapsed: false,
    items: toStarlightItems(section.children, framework),
  }));

  return [
    ...guideSections,
    {
      label: 'API reference',
      collapsed: true,
      items: buildApiSidebar(framework),
    },
  ];
}
