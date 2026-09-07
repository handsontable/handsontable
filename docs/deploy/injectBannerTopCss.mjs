// Moves the "newer version available" banner to the top of the page on
// previously-built, frozen VuePress docs versions (PRO-1303).
//
// Mid-14.x through 17.0 VuePress builds render the banner (`.page-top`)
// at the bottom of `<main class="page">`, after the content, where readers
// miss it. Those builds are extracted verbatim from per-version Docker
// images on every deploy and are never rebuilt, so the fix has to happen
// here, at assembly time.
//
// The pages are server-rendered Vue apps (VuePress SPA). Relocating the
// banner node in the static HTML would not stick: hydration re-renders
// `main.page` from the theme's component template, and any client-side
// navigation builds the next page's DOM purely from that template. A CSS
// override survives both, so this script injects a flex-order rule into
// each page's <head> instead of touching the markup.
//
// Only files with the broken layout are touched -- the banner markup
// (`class="page-top"`) appearing after the content div
// (`theme-default-content`). Older themes (<= 14.0) that already render
// the banner on top, pages without the banner, and Astro builds (>= 17.1)
// are left byte-identical. The `.page-top` element itself (including its
// inline `display:none` and the frozen client JS that toggles it) is not
// modified, so the show-only-when-outdated behavior is unchanged.
//
// Usage: node injectBannerTopCss.mjs <dir>

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const STYLE_ID = 'hot-banner-top';

// Reorders main.page's direct children (breadcrumbs, content, .page-top,
// footer -- verified consistent across the affected 14.6-17.0 builds) so the
// banner lands between the breadcrumbs and the content, matching where the
// Astro (>= 17.1) builds render it.
const STYLE_TAG =
  `<style id="${STYLE_ID}">` +
  'main.page{display:flex;flex-direction:column}' +
  'main.page>.breadcrumbs{order:-2}' +
  'main.page>.page-top{order:-1}' +
  '</style>';

/**
 * Injects the banner-repositioning CSS into every `.html` file under `dir`
 * whose banner markup renders after the content (the broken bottom layout).
 * Files already carrying the style tag are skipped (idempotent).
 *
 * @param {string} dir - Directory containing one version's built docs.
 * @returns {Promise<number>} Number of files that were changed.
 */
export async function injectBannerTopCss(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && extname(entry.name) === '.html')
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name));

  let changedCount = 0;

  for (const file of htmlFiles) {
    const original = await readFile(file, 'utf-8');

    if (original.includes(STYLE_ID)) {
      continue;
    }

    const bannerIndex = original.indexOf('class="page-top"');
    const contentIndex = original.indexOf('theme-default-content');
    const headEndIndex = original.indexOf('</head>');

    const hasBottomBanner = bannerIndex !== -1
      && contentIndex !== -1
      && bannerIndex > contentIndex;

    if (!hasBottomBanner || headEndIndex === -1) {
      continue;
    }

    const rewritten = `${original.slice(0, headEndIndex)}${STYLE_TAG}${original.slice(headEndIndex)}`;

    await writeFile(file, rewritten, 'utf-8');
    changedCount += 1;
  }

  return changedCount;
}

// process.argv[1] is not resolved to an absolute path when the script is
// invoked with a relative one (e.g. `node injectBannerTopCss.mjs ...`, as
// build_current_version.sh does), so comparing it to import.meta.url as a
// plain string would never match. pathToFileURL() resolves it the same way
// Node resolves import.meta.url, relative to the current working directory,
// so the comparison works regardless of how the script is invoked.
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const [dir] = process.argv.slice(2);

  if (!dir) {
    console.error('Usage: node injectBannerTopCss.mjs <dir>');
    process.exitCode = 1;
  } else {
    const changedCount = await injectBannerTopCss(dir);

    console.log(`Injected banner-top CSS into ${changedCount} file(s) under ${dir}.`);
  }
}
