/**
 * Asserts that the built docs pages establish Starlight's cascade-layer order.
 *
 * Starlight ships the order in `@astrojs/starlight/style/layers.css` as a
 * statement (`@layer starlight.base, starlight.reset, ...;`) and
 * `src/styles/custom.css` restates it, but no statement survives the build:
 * Astro's `astro:css-target-lowering` plugin runs every emitted stylesheet
 * through lightningcss, which resolves a layer statement by physically
 * reordering the layer blocks that follow it and then drops the now-redundant
 * statement. So the invariant that reaches the browser is the ORDER OF THE
 * BLOCKS, and that is what this check reads - per stylesheet, and across the
 * stylesheets a page links, since a layer's position is fixed by its first
 * appearance in the document.
 *
 * When the order breaks, `starlight.reset` (which carries `* { margin: 0 }`)
 * lands after `starlight.content` and beats it, because later layers win
 * regardless of specificity. Every gap between paragraphs, code blocks and
 * lists then collapses to zero on every docs page, while unlayered heading
 * margins keep working and hide the breakage (DEV-2742).
 */
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Starlight's declared order, from `@astrojs/starlight/style/layers.css`.
 */
export const STARLIGHT_LAYERS = [
  'starlight.base',
  'starlight.reset',
  'starlight.core',
  'starlight.content',
  'starlight.components',
  'starlight.utils',
];

/**
 * Pages whose stylesheets are checked: a guide page and an API reference page,
 * the two layouts that carry the layer-declaring stylesheets. A page that a
 * given build does not emit is skipped; the check only fails on a real order
 * violation, or when none of these pages exists at all.
 */
const PAGES = [
  'javascript-data-grid/batch-operations/index.html',
  'javascript-data-grid/api/core/index.html',
];

/**
 * Blanks out CSS comments, keeping byte offsets intact.
 *
 * @param {string} css The stylesheet source.
 * @returns {string} The source with comment bodies replaced by spaces.
 */
export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => ' '.repeat(comment.length));
}

/**
 * Lists the cascade layers a stylesheet declares, in order of first
 * appearance. Both forms count: a block (`@layer x { ... }`) and a statement
 * (`@layer x, y;`), which declares several at once.
 *
 * @param {string} css The stylesheet source.
 * @returns {string[]} The layer names, first appearance first, deduplicated.
 */
export function declaredLayers(css) {
  const seen = [];

  for (const match of stripComments(css).matchAll(/@layer\s+([^{;]+)[{;]/g)) {
    for (const name of match[1].split(',').map((layer) => layer.trim())) {
      if (name && !seen.includes(name)) {
        seen.push(name);
      }
    }
  }

  return seen;
}

/**
 * Checks a layer sequence against Starlight's order.
 *
 * @param {string[]} layers Layer names in order of first appearance.
 * @returns {string | null} A description of the first violation, or `null`
 * when the Starlight layers appear in their declared relative order.
 */
export function findOrderViolation(layers) {
  const ranks = layers
    .filter((layer) => STARLIGHT_LAYERS.includes(layer))
    .map((layer) => ({ layer, rank: STARLIGHT_LAYERS.indexOf(layer) }));

  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i].rank < ranks[i - 1].rank) {
      return `${ranks[i].layer} is declared after ${ranks[i - 1].layer}, but Starlight declares it before`;
    }
  }

  return null;
}

/**
 * Extracts every stylesheet a built page carries, in document order - both
 * `<link rel="stylesheet">` and inline `<style>` blocks. Astro's
 * `build.inlineStylesheets` defaults to `'auto'`, so a small stylesheet can
 * ship inline; document order across both forms is what fixes each layer's
 * first appearance.
 *
 * @param {string} html The page's HTML.
 * @returns {Array<{ href?: string, css?: string }>} One entry per stylesheet.
 */
export function pageStylesheets(html) {
  const sheets = [];

  for (const match of html.matchAll(/<link\b[^>]*>|<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    if (match[0].startsWith('<style')) {
      sheets.push({ css: match[1] });

      continue;
    }

    if (!/rel=["']?stylesheet/.test(match[0])) {
      continue;
    }

    const href = /href=["']([^"']+)["']/.exec(match[0]);

    if (href) {
      sheets.push({ href: href[1] });
    }
  }

  return sheets;
}

/**
 * Turns a stylesheet `href` from a built page into the candidate paths it could
 * have inside the build output, most specific first. The site is served under a
 * base path (`/docs`), so the href carries a prefix the output directory does
 * not; and a stylesheet is not always exactly one directory deep.
 *
 * @param {string} href The `href` attribute value.
 * @returns {string[]} Relative candidate paths, or an empty array for an href
 * that cannot name a local file (an external URL, or a data URI).
 */
export function assetPathCandidates(href) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) {
    return [];
  }

  const segments = href.split(/[?#]/)[0].split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  // Drop leading segments one at a time so both `/docs/_astro/x.css` (served
  // under the base path) and a deeper `_astro/chunks/x.css` resolve.
  return segments.map((_, index) => segments.slice(index).join('/'));
}

/**
 * Reads the first of a stylesheet's candidate paths that exists in the build
 * output.
 *
 * @param {string} distDir The build output directory.
 * @param {string[]} candidates Relative candidate paths, most specific first.
 * @returns {Promise<{ name: string, css: string } | null>} The resolved path
 * and its content, or `null` when none of the candidates exists. A stylesheet
 * that cannot be read is reported as skipped rather than failing the build:
 * this check exists to catch a layer-order deviation, and a moved asset is not
 * one.
 */
async function readStylesheetAt(distDir, candidates) {
  for (const candidate of candidates) {
    if (!candidate.endsWith('.css')) {
      continue;
    }

    try {
      return { name: candidate, css: await readFile(join(distDir, candidate), 'utf8') };
    } catch {
      // Try the next candidate; all-missing is handled by the caller.
    }
  }

  return null;
}

/**
 * Validates the layer order every checked page establishes.
 *
 * @param {string} distDir The build output directory.
 * @returns {Promise<{ errors: string[], checked: string[], skipped: string[] }>}
 * The problems found, the pages that were read, and the stylesheet hrefs that
 * could not be resolved in the output.
 */
export async function validateBuiltPages(distDir) {
  const errors = [];
  const checked = [];
  const skipped = [];
  const cache = new Map();
  const pages = [];

  for (const page of PAGES) {
    try {
      pages.push({ page, html: await readFile(join(distDir, page), 'utf8') });
    } catch {
      // A page can legitimately be absent from a partial or differently
      // configured build. Missing pages are only fatal when none is readable,
      // so a renamed guide never fails a deploy on its own.
    }
  }

  if (pages.length === 0) {
    errors.push(
      `none of the checked pages exist in ${distDir} (${PAGES.join(', ')}) - ` +
        'the build emitted no pages, or PAGES is stale.'
    );

    return { errors, checked, skipped };
  }

  for (const { page, html } of pages) {
    checked.push(page);

    const pageLayers = [];

    for (const sheet of pageStylesheets(html)) {
      let name = `${page} (inline <style>)`;

      if (sheet.href) {
        const candidates = assetPathCandidates(sheet.href);

        if (candidates.length === 0) {
          // An external or data URI names no file in the build output, so
          // there is nothing to check and nothing to warn about.
          continue;
        }

        if (!cache.has(sheet.href)) {
          const stylesheet = await readStylesheetAt(distDir, candidates);

          if (!stylesheet) {
            skipped.push(sheet.href);
          }

          cache.set(
            sheet.href,
            stylesheet ? { name: stylesheet.name, layers: declaredLayers(stylesheet.css) } : null
          );
        }

        const cached = cache.get(sheet.href);

        if (!cached) {
          continue;
        }

        name = cached.name;
      }

      const sheetLayers = sheet.href ? cache.get(sheet.href).layers : declaredLayers(sheet.css);
      const sheetViolation = findOrderViolation(sheetLayers);

      if (sheetViolation) {
        errors.push(`${name}: ${sheetViolation}.`);
      }

      pageLayers.push(...sheetLayers.filter((layer) => !pageLayers.includes(layer)));
    }

    const pageViolation = findOrderViolation(pageLayers);

    if (pageViolation) {
      errors.push(
        `${page}: across its stylesheets, ${pageViolation}. ` +
          'Declare the order first in src/styles/custom.css.'
      );
    }
  }

  return { errors: [...new Set(errors)], checked, skipped: [...new Set(skipped)] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const distDir = resolve(process.cwd(), 'dist');
  const { errors, checked, skipped } = await validateBuiltPages(distDir);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }

    process.exit(1);
  }

  // Named, not silent: a stylesheet nobody can read is a blind spot in this
  // check, even though it is not a reason to fail the build.
  for (const href of skipped) {
    console.warn(`Not checked (no such file in the build output): ${href}`);
  }

  console.log(`Cascade-layer order matches Starlight's on ${checked.length} built page(s).`);
}
