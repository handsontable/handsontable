/**
 * Builders for the /docs/llms.txt and /docs/llms-full.txt agent-discovery
 * files. The markdown-routes integration in astro.config.mjs feeds them the
 * sidebar config (from sidebar.mjs) and the Markdown route map; everything
 * here is pure so the docs:test:plugins suite can pin the output shape
 * against fixtures (src/scripts/__tests__/llms.test.mjs).
 *
 * The published files are coupled to the sidebar's own information
 * architecture: section labels become llms.txt headings, and the
 * 'API reference', 'Policy', and 'Migration guides' labels are matched by
 * name in buildLlmsSections(). Renaming one in sidebar.mjs changes these
 * crawler-facing artifacts — the tests pin each label.
 */

import { FRAMEWORK_PREFIXES } from './sidebar.mjs';

// The site origin; astro.config.mjs derives its `site:` value from this
// constant. (Some Astro components still inline the origin because they
// cannot import this module -- see the prerender-bundle note in
// astro.config.mjs.)
export const SITE_URL = 'https://handsontable.com';

export const CANONICAL_PREFIX = FRAMEWORK_PREFIXES.javascript;

/**
 * Returns the public URL of a page. The Introduction page lives at the
 * framework root (permalink `/`, slug `index`), so it gets no slug segment.
 *
 * @param {string} prefix Framework URL prefix, e.g. "javascript-data-grid".
 * @param {string} slug Bare page slug, e.g. "installation" or "index".
 * @returns {string}
 */
function pageUrl(prefix, slug) {
  return slug === 'index' ? `${SITE_URL}/docs/${prefix}/` : `${SITE_URL}/docs/${prefix}/${slug}/`;
}

/**
 * Flattens a Starlight sidebar section into [{label, slug, prefix}] entries,
 * where slug is the bare page slug (framework prefix and slashes stripped;
 * the framework root page becomes `index`). Nested groups are walked;
 * external links and links under other prefixes are skipped.
 *
 * @param {Array} items Starlight sidebar items.
 * @param {string} prefix Framework URL prefix the links are expected under.
 * @param {Array} [acc]
 * @returns {Array<{label: string, slug: string, prefix: string}>}
 */
export function flattenSectionItems(items, prefix, acc = []) {
  for (const item of items || []) {
    if (item.items) {
      flattenSectionItems(item.items, prefix, acc);
      continue;
    }

    if (typeof item.link !== 'string' || !item.link.startsWith(`/${prefix}/`)) continue;

    const slug = item.link.slice(`/${prefix}/`.length).replace(/\/$/, '') || 'index';

    acc.push({ label: item.label, slug, prefix });
  }

  return acc;
}

/**
 * The llms.txt sections built from the site's own information architecture:
 * the guide sidebar sections, the recipes, and the changelog's Policy and
 * Migration guides groups. All four framework sidebars are walked and merged
 * by slug — JavaScript first, so shared pages get the canonical JavaScript
 * URL while framework-specific pages (React methods, Pinia, Nuxt, ...) keep
 * their own framework prefix.
 *
 * Deliberate exclusions:
 * - API pages are summarized as one hand-written section in buildLlmsIndex()
 *   rather than listed per page — the sitemap and the `.md` URL pattern
 *   already enumerate them, and ~200 entries would drown the index.
 * - The changelog's version pages (changelog, changes-between-versions) are
 *   release-note archives, not guidance.
 *
 * @param {object} allSidebars The buildAllSidebars() result from sidebar.mjs.
 * @returns {Array<{label: string, items: Array}>}
 */
export function buildLlmsSections(allSidebars) {
  // Section order follows insertion order: the JavaScript sidebar first, so
  // shared pages resolve to the canonical prefix and later frameworks only
  // append their framework-specific pages.
  const sectionByLabel = new Map();

  const add = (label, items) => {
    if (!items.length) return;

    let section = sectionByLabel.get(label);

    if (!section) {
      section = { label, bySlug: new Map() };
      sectionByLabel.set(label, section);
    }

    for (const item of items) {
      if (!section.bySlug.has(item.slug)) section.bySlug.set(item.slug, item);
    }
  };

  for (const [framework, prefix] of Object.entries(FRAMEWORK_PREFIXES)) {
    for (const section of allSidebars[framework] || []) {
      if (section.label === 'API reference') continue;

      add(section.label, flattenSectionItems(section.items, prefix));
    }

    add('Recipes', flattenSectionItems(allSidebars[`${framework}Recipes`] || [], prefix));

    for (const group of allSidebars[`${framework}Changelog`] || []) {
      if (group.label !== 'Policy' && group.label !== 'Migration guides') continue;

      add(group.label, flattenSectionItems(group.items, prefix));
    }
  }

  return [...sectionByLabel.values()]
    .map((section) => ({ label: section.label, items: [...section.bySlug.values()] }));
}

/**
 * Builds /docs/llms.txt — the discovery index for AI agents, following the
 * shape HyperFormula already ships (H1, `>` summary, sectioned link lists).
 *
 * @param {Map<string, {title: string, description: string}>} pageMeta
 *   Per-page frontmatter keyed by bare slug.
 * @param {Array<{label: string, items: Array}>} sections
 *   The buildLlmsSections() result.
 * @returns {string}
 */
export function buildLlmsIndex(pageMeta, sections) {
  const lines = [
    '# Handsontable',
    '',
    '> Handsontable is a JavaScript data grid component with spreadsheet-like UX, available for React, Angular, Vue, and vanilla JavaScript. It ships editing, sorting, filtering, validation, and Excel-compatible formulas (via HyperFormula) as one embeddable component.',
    '',
    'Handsontable is developed by Handsoncode. The documentation below covers the JavaScript data grid and its framework wrappers. Guides exist in a JavaScript, React, Angular, and Vue variant at the same slug; to switch, swap the framework segment of a URL. Framework-specific guides are listed under their own framework prefix.',
    '',
    '## Site',
    '',
    `- [Landing page](${SITE_URL}/): Product overview and pricing`,
    `- [Documentation home](${SITE_URL}/docs/): Guides, API reference, and examples`,
    `- [Sitemap](${SITE_URL}/docs/sitemap-index.xml): XML sitemap of all docs URLs`,
    `- [robots.txt](${SITE_URL}/robots.txt): Crawl policy`,
    '',
    '## Documentation for agents',
    '',
    `- [Full guides corpus (Markdown)](${SITE_URL}/docs/llms-full.txt): Every guide page concatenated into one plain-text file`,
    `- [Docs pages as Markdown](${SITE_URL}/docs/_md/${CANONICAL_PREFIX}/installation.md): Every docs page, guides and API alike, has a Markdown twin at /docs/_md/{framework}/{slug}.md`,
    `- [Skills for Claude Code](${SITE_URL}/docs/${CANONICAL_PREFIX}/skills-for-claude-code/): Versioned skills for Handsontable and HyperFormula (repo: https://github.com/handsontable/handsontable-skills)`,
    '',
    '## API reference',
    '',
    `- [API introduction](${SITE_URL}/docs/${CANONICAL_PREFIX}/api/): Entry point to the API reference`,
    `- [Configuration options](${SITE_URL}/docs/${CANONICAL_PREFIX}/api/options/): Every grid option`,
    `- [Core methods](${SITE_URL}/docs/${CANONICAL_PREFIX}/api/core/): Instance methods`,
    `- [Hooks](${SITE_URL}/docs/${CANONICAL_PREFIX}/api/hooks/): Lifecycle and event hooks`,
  ];

  for (const section of sections) {
    lines.push('', `## ${section.label}`, '');

    for (const { label, slug, prefix } of section.items) {
      const meta = pageMeta.get(slug);
      // Prefer the page's own title: sidebar labels lean on their group for
      // context (every recipe group's overview page is labelled 'Overview'),
      // which a flat index does not have.
      const desc = meta?.description ? `: ${meta.description}` : '';

      lines.push(`- [${meta?.title || label}](${pageUrl(prefix, slug)})${desc}`);
    }
  }

  lines.push(
    '',
    '## Source',
    '',
    '- [GitHub repository](https://github.com/handsontable/handsontable): Source code, issues, releases',
    '- [npm package](https://www.npmjs.com/package/handsontable): Published package',
    '',
    '## Licensing',
    '',
    `- [License key guide](${SITE_URL}/docs/${CANONICAL_PREFIX}/license-key/): How to apply a commercial or non-commercial key`,
    `- [Pricing](${SITE_URL}/pricing): Commercial plans`,
    `- [Contact sales](${SITE_URL}/get-a-quote): Get a quote for commercial use`,
    '',
    '---',
    '',
    // Required by the trademark policy (AGENTS.md 2.8) whenever Excel and
    // Google Sheets are both mentioned, as the summary and the page
    // descriptions above do.
    'Microsoft and Excel are registered trademarks of Microsoft Corporation. Google Sheets is a trademark of Google LLC.',
    ''
  );

  return lines.join('\n');
}

/**
 * Builds /docs/llms-full.txt — the guide pages concatenated in sidebar
 * order. Each page starts at its own H1 title (the first line every
 * routeMap entry already carries) followed by a `URL:` line that uniquely
 * identifies the page, and the body's H2+ headings stay nested inside their
 * page. A Markdown-aware consumer chunking by H1 gets page boundaries; the
 * `URL:` line is the reliable page identifier, since titles can repeat and
 * code fences may contain `#`-prefixed lines.
 *
 * @param {Map<string, string>} routeMap Markdown twins keyed by
 *   "{prefix}/{slug}.md".
 * @param {Array<{label: string, items: Array}>} sections
 *   The buildLlmsSections() result.
 * @returns {string}
 */
export function buildLlmsFull(routeMap, sections) {
  const parts = [
    '# Handsontable Documentation',
    '',
    '> Full guides corpus for LLM consumption. One canonical copy per page (JavaScript',
    '> variant, or the page\'s own framework for framework-specific guides); the other',
    '> variants exist at the same slug under their own framework prefix. Each page is',
    '> also served individually at /docs/_md/{framework}/{slug}.md.',
    '',
  ];

  for (const section of sections) {
    for (const { slug, prefix } of section.items) {
      const md = routeMap.get(`${prefix}/${slug}.md`);

      if (!md) {
        // A sidebar page with no Markdown twin means its sidebar-derived slug
        // and its permalink diverged; fail the build rather than silently
        // shipping a corpus with the page missing.
        throw new Error(
          `llms-full.txt: no Markdown twin for sidebar page "${prefix}/${slug}". ` +
          'The usual cause: the page is registered in the sidebar but its .md file ' +
          'is missing `permalink` or `title` frontmatter, so buildRouteMap() skipped it.'
        );
      }

      // Every routeMap entry starts with "# {title}\n" (see buildMarkdown in
      // astro.config.mjs); the URL line is inserted right after it.
      const newline = md.indexOf('\n');
      const title = newline === -1 ? md : md.slice(0, newline);
      const body = newline === -1 ? '' : md.slice(newline + 1).trim();

      parts.push('---', '', title, '', `URL: ${pageUrl(prefix, slug)}`, '', body, '');
    }
  }

  return parts.join('\n');
}
