/**
 * Custom Astro content loader that reads all .md files from docs/content/,
 * creates 3 entries per file (one per framework), applies per-framework
 * only-for content filtering, and applies all other VuePress preprocessing.
 *
 * Entry ID format: {prefix}/{slug}
 * e.g. react-data-grid/guides/getting-started/introduction
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// Read the current handsontable library version for StackBlitz package.json.
const _require = createRequire(import.meta.url);
const _loaderDir = dirname(fileURLToPath(import.meta.url));
let HOT_VERSION = 'latest';

try {
  const pkg = _require(join(_loaderDir, '../../..', 'handsontable', 'package.json'));

  HOT_VERSION = pkg.version ?? 'latest';
} catch {
  // Monorepo root not found — use 'latest' as fallback.
}

// Packages that are already provided by the framework project scaffolding
// in example-tabs.js — do NOT add these to extraDeps.
const BUILTIN_PKGS = new Set([
  'handsontable',
  '@handsontable/react-wrapper',
  '@handsontable/vue3',
  '@handsontable/angular-wrapper',
  'vue',
  'react',
  'react-dom',
  '@angular/core',
  '@angular/common',
  '@angular/compiler',
  '@angular/platform-browser',
  '@angular/platform-browser-dynamic',
  '@angular/forms',
  '@angular/animations',
  '@angular/router',
  'zone.js',
  'rxjs',
]);

// docs/package.json dependency versions — used to pin extra deps to the same
// version already installed in the docs dev environment.
let DOCS_DEPS = {};

try {
  const docsPkg = _require(join(_loaderDir, '..', '..', 'package.json'));

  DOCS_DEPS = { ...(docsPkg.dependencies ?? {}), ...(docsPkg.devDependencies ?? {}) };
} catch {
  // Ignore — fall back to 'latest' for unknown packages.
}

// ---------------------------------------------------------------------------
// Example block processing
// ---------------------------------------------------------------------------

const EXT_TO_LANG = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  html: 'html',
  css: 'css',
  vue: 'vue',
};

const EXT_TO_LABEL = {
  js: 'JavaScript',
  ts: 'TypeScript',
  jsx: 'JavaScript',
  tsx: 'TypeScript',
  html: 'HTML',
  css: 'CSS',
  vue: 'Vue',
};

/**
 * Escapes HTML special characters.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates the HTML for a single example block.
 *
 * The output contains:
 * 1. A live preview container with a loading shimmer shown until the example JS
 *    mounts the Handsontable instance.
 * 2. A toolbar with a "Source code" toggle, an "Edit on StackBlitz" button, and
 *    a "See on GitHub" link.
 * 3. Shiki-highlighted code tabs (hidden by default, revealed via the toggle).
 *
 * @param {string} id - Example ID, e.g. 'example1'
 * @param {string} directive - 'example' or 'example-without-tabs'
 * @param {string[]} fileRefs - Paths relative to contentDir (after stripping '@/content/')
 * @param {string} contentDir - Absolute path to docs/content/
 * @param {Object<string, string>} [fileMeta] - Optional EC meta attributes keyed by file path
 * @returns {string} HTML + markdown fences string
 */
function buildExampleHtml(id, directive, fileRefs, contentDir, fileMeta = {}) {
  const hideTabs = directive === 'example-without-tabs';

  // Detect framework from the directory path first. JS examples also ship a
  // TypeScript variant (.ts), so extension-based detection alone would
  // misidentify them as Angular examples.
  const isAngularDir = fileRefs.some(r => /\/angular\//i.test(r));
  const isReactDir   = fileRefs.some(r => /\/react\//i.test(r));
  const isVueDir     = fileRefs.some(r => /\/vue(?:3)?\//i.test(r));

  // Find the primary executable file for live rendering.
  const jsRef  = (!isAngularDir && !isReactDir) ? fileRefs.find(r => r.endsWith('.js')) : null;
  const jsxRef = isReactDir ? fileRefs.find(r => r.endsWith('.jsx') || r.endsWith('.tsx')) : null;
  const tsRef  = isAngularDir ? fileRefs.find(r => r.endsWith('.ts')) : null;

  const files = fileRefs.map((ref) => {
    const absPath = join(contentDir, ref);
    let code = '';

    try {
      code = readFileSync(absPath, 'utf-8').trimEnd();
    } catch {
      code = `// File not found: ${ref}`;
    }

    const ext = ref.split('.').pop().toLowerCase();
    const lang = EXT_TO_LANG[ext] || 'text';
    const label = EXT_TO_LABEL[ext] || ext.toUpperCase();

    return { ref, ext, lang, label, code };
  });

  if (files.length === 0) {
    return `<div class="hot-example hot-example--empty" id="hot-example-${escapeHtml(id)}"><p><em>Example source not found.</em></p></div>`;
  }

  // data-example-* attributes are read by the client-side runner.
  let exampleAttr = '';

  if (jsRef) {
    exampleAttr = ` data-example-js="/content/${escapeHtml(jsRef)}"`;
  } else if (jsxRef) {
    exampleAttr = ` data-example-jsx="/content/${escapeHtml(jsxRef)}" data-example-id="${escapeHtml(id)}"`;
  } else if (tsRef) {
    const htmlRef = fileRefs.find((ref) => ref.endsWith('.html'));

    exampleAttr = ` data-example-angular="/content/${escapeHtml(tsRef)}" data-example-id="${escapeHtml(id)}"`;
    if (htmlRef) {
      exampleAttr += ` data-example-html="/content/${escapeHtml(htmlRef)}"`;
    }
  }

  // ── HTML preview content for JS examples ───────────────────────────────────
  // Some JS examples ship an .html file with extra DOM elements the script
  // depends on (event log panels, checkbox lists, etc.).  When present, inject
  // its content into the preview area instead of a bare <div id="…"></div>.
  let htmlPreviewContent = '';

  if (jsRef) {
    const htmlFile = files.find(f => f.ext === 'html');

    if (htmlFile) {
      htmlPreviewContent = htmlFile.code;
    }
  }

  // ── GitHub link ────────────────────────────────────────────────────────────
  const primaryRef = jsRef || jsxRef || tsRef || fileRefs[0];
  const exampleDir = primaryRef ? primaryRef.split('/').slice(0, -1).join('/') : '';
  const githubUrl = `https://github.com/handsontable/handsontable/tree/develop/docs/content/${escapeHtml(exampleDir)}`;

  // ── StackBlitz data (embedded as JSON for the client-side handler) ─────────

  const framework = isReactDir ? 'react' : isAngularDir ? 'angular' : isVueDir ? 'vue' : 'javascript';

  const sbFiles = {};

  for (const f of files) {
    sbFiles[f.ref.split('/').pop()] = f.code;
  }

  // Collect extra third-party imports not covered by the base project scaffold.
  // Only top-level package names are extracted (scoped: @scope/pkg, plain: pkg).
  const extraDeps = {};

  for (const f of files) {
    for (const [, imp] of f.code.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      if (imp.startsWith('.') || imp.startsWith('/')) continue;

      const pkgName = imp.startsWith('@')
        ? imp.split('/').slice(0, 2).join('/')
        : imp.split('/')[0];

      if (!BUILTIN_PKGS.has(pkgName) && !pkgName.startsWith('handsontable/')) {
        extraDeps[pkgName] = DOCS_DEPS[pkgName] ?? 'latest';
      }
    }
  }

  // Escape </script> sequences so the JSON block can't break the page.
  const sbDataJson = JSON.stringify({
    title: `Handsontable – ${id}`,
    hotVersion: HOT_VERSION,
    framework,
    exampleId: id,
    files: sbFiles,
    extraDeps,
  }).replace(/<\/script>/gi, '<\\/script>');

  // ── Code fences (rendered by Expressive Code at build time) ────────────────
  const showTabs = !hideTabs && files.length > 1;
  const tabLabels = showTabs ? files.map(f => f.label).join(',') : '';

  const fences = files.map((f) => {
    const meta = fileMeta[f.ref] || '';

    return `\`\`\`\`${f.lang} title="${f.label}"${meta ? ` ${meta}` : ''}\n${f.code}\n\`\`\`\``;
  }).join('\n\n');

  // ── SVG icons (inlined to keep no external dependencies) ──────────────────
  const iconCode = `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
  const iconChevron = `<svg class="hot-example-source-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"/></svg>`;
  const iconStackBlitz = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 28 28" fill="currentColor"><path d="M15.245 0L0 15.556h10.976L7.757 28 28 12.444H17.024L15.245 0z"/></svg>`;
  const iconGitHub = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;

  return `<div class="hot-example not-content"${exampleAttr} id="hot-example-${escapeHtml(id)}">
<div class="hot-example-preview hot-example-preview--loading not-content">
  <div class="hot-example-loader" aria-hidden="true">
    <div class="hot-example-loader__row hot-example-loader__row--header"></div>
    <div class="hot-example-loader__row"></div>
    <div class="hot-example-loader__row"></div>
    <div class="hot-example-loader__row"></div>
    <div class="hot-example-loader__row"></div>
  </div>
  ${htmlPreviewContent || `<div id="${escapeHtml(id)}"></div>`}
</div>
<div class="hot-example-toolbar">
  <button class="hot-example-source-btn" type="button" aria-expanded="false" aria-controls="hot-code-${escapeHtml(id)}">
    ${iconCode} Source code ${iconChevron}
  </button>
  <div class="hot-example-actions">
    <button class="hot-example-stackblitz-btn" type="button" title="Edit on StackBlitz" aria-label="Edit on StackBlitz">
      ${iconStackBlitz}
    </button>
    <a class="hot-example-github-btn" href="${githubUrl}" target="_blank" rel="noopener noreferrer" title="See on GitHub" aria-label="See on GitHub">
      ${iconGitHub}
    </a>
  </div>
</div>
<script type="application/json" class="hot-example-sb-data">${sbDataJson}</script>
</div>

<div class="hot-example-code-start" data-example="${escapeHtml(id)}" data-tabs="${escapeHtml(tabLabels)}"></div>

${fences}

<div class="hot-example-code-end"></div>`;
}

/**
 * Processes ::: example and ::: example-without-tabs blocks in the markdown body.
 * Replaces them with HTML + markdown code fences (rendered by Expressive Code).
 * Must be called AFTER filterOnlyFor so only the current framework's blocks remain.
 *
 * @param {string} content - Filtered markdown body
 * @param {string} contentDir - Absolute path to docs/content/
 * @returns {string} Modified markdown body
 */
function processExampleBlocks(content, contentDir) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Matches "::: example" and ":::example" and ":::example-without-tabs"
    const openMatch = line.match(/^:::\s*(example(?:-without-tabs)?)\s*(.*)/);

    if (openMatch) {
      const directive = openMatch[1];
      const header = openMatch[2].trim();

      // Extract the example ID from the header (e.g. '#example1')
      const idMatch = header.match(/#(\S+)/);
      const id = idMatch ? idMatch[1] : 'unknown';

      // Collect all lines inside this block until the matching closing :::
      const blockLines = [];
      let depth = 1;
      i++;

      while (i < lines.length && depth > 0) {
        const l = lines[i];

        if (/^:::\s+\S/.test(l)) {
          depth++;
          blockLines.push(l);
        } else if (/^:::\s*$/.test(l)) {
          depth--;
          if (depth > 0) blockLines.push(l);
        } else {
          blockLines.push(l);
        }

        i++;
      }

      // Extract @[code](@/content/...) file references with optional meta
      // e.g. @[code collapse={9-108}](@/content/path/to/file.js)
      const fileRefs = [];
      const fileMeta = {};

      for (const bl of blockLines) {
        const m = bl.match(/@\[code(?:\s+([^\]]*))?\]\(@\/content\/(.+)\)/);

        if (m) {
          const path = m[2].trim();

          fileRefs.push(path);

          if (m[1]) {
            fileMeta[path] = m[1].trim();
          }
        }
      }

      result.push(buildExampleHtml(id, directive, fileRefs, contentDir, fileMeta));
      // i is already incremented past the closing ::: by the inner loop
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

const FRAMEWORKS = ['javascript', 'react', 'angular'];

const PREFIXES = {
  javascript: 'javascript-data-grid',
  react: 'react-data-grid',
  angular: 'angular-data-grid',
};

// Bump this when the loader logic changes to force Astro's data store to
// re-process all entries (the store skips entries whose digest hasn't changed).
const LOADER_VERSION = 'v16';

// ---------------------------------------------------------------------------
// File listing (recursive, no external glob)
// ---------------------------------------------------------------------------

/**
 * Recursively lists all .md files under a directory.
 *
 * @param {string} dir - Absolute path to directory.
 * @returns {string[]} Absolute file paths.
 */
function listMdFiles(dir) {
  const results = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...listMdFiles(join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(join(dir, entry.name));
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

/**
 * Derives a slug from a file path relative to the content directory.
 * Strips the .md extension and removes a duplicate terminal segment that
 * arises from VuePress naming convention (foo/bar/bar.md → foo/bar).
 *
 * @param {string} relPath - Relative path like "guides/foo/foo.md"
 * @returns {string} Slug like "guides/foo"
 */
function slugFromRelPath(relPath) {
  const withoutExt = relPath.replace(/\.(md|mdx)$/, '');
  const parts = withoutExt.split('/');

  // Remove duplicate terminal segment: foo/bar/bar → foo/bar
  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    parts.pop();
  }

  return parts.join('/');
}

// ---------------------------------------------------------------------------
// VuePress preprocessing (mirrored from vuepress-preprocessor.mjs)
// ---------------------------------------------------------------------------

/**
 * Filters :::: only-for [framework1 framework2] ... :::: blocks.
 * Blocks matching the current framework are kept (markers stripped).
 * Blocks for other frameworks are removed entirely.
 *
 * @param {string} content
 * @param {string} framework
 * @returns {string}
 */
function filterOnlyFor(content, framework) {
  const lines = content.split('\n');
  const result = [];
  // Stack of { keep: boolean, innerDepth: number } — one entry per open only-for block.
  // innerDepth tracks how many non-only-for ::: blocks are open inside this frame.
  const stack = [];

  for (const line of lines) {
    const openMatch = line.match(/^:{3,}\s+only-for\s+(.+)$/);

    if (openMatch) {
      const frameworks = openMatch[1].trim().split(/\s+/);
      const keep = frameworks.includes(framework);
      stack.push({ keep, innerDepth: 0 });
      continue; // never emit the only-for marker line
    }

    if (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const emitting = stack.every(f => f.keep);

      // Any ::: opener that is not an only-for block (e.g. ::: example, ::: tip)
      if (/^:{3,}\s+\S/.test(line)) {
        frame.innerDepth++;
        if (emitting) result.push(line);
        continue;
      }

      // Bare ::: closer
      if (/^:{3,}\s*$/.test(line)) {
        if (frame.innerDepth > 0) {
          // Closes an inner block, not the only-for frame
          frame.innerDepth--;
          if (emitting) result.push(line);
        } else {
          // Closes the only-for block itself — never emit
          stack.pop();
        }
        continue;
      }

      // Regular content inside block
      if (emitting) result.push(line);
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Removes :::example and :::example-without-tabs opening/closing markers.
 * The code blocks inside are left intact.
 *
 * @param {string} content
 * @returns {string}
 */
function stripExampleContainers(content) {
  const lines = content.split('\n');
  const result = [];
  let exampleDepth = 0;

  for (const line of lines) {
    if (/^:::\s*(example|example-without-tabs)(\s|$)/.test(line)) {
      exampleDepth++;
      continue;
    }

    if (exampleDepth > 0 && /^:::\s*$/.test(line)) {
      exampleDepth--;
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Converts ::: source-code-link URL ::: blocks to plain HTML anchor tags.
 *
 * @param {string} content
 * @returns {string}
 */
function convertSourceCodeLinks(content) {
  const lines = content.split('\n');
  const result = [];
  let inSourceLink = false;
  let linkUrl = '';

  for (const line of lines) {
    const openMatch = line.match(/^:::\s+source-code-link\s+(\S+)\s*$/);

    if (openMatch) {
      inSourceLink = true;
      linkUrl = openMatch[1];
      continue;
    }

    if (inSourceLink && /^:::\s*$/.test(line)) {
      inSourceLink = false;
      result.push(
        `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="source-code-link">Source code</a>`
      );
      linkUrl = '';
      continue;
    }

    if (!inSourceLink) {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Replaces emoji check/cross characters with inline SVG icons in rendered HTML.
 * Mutates the `rendered` object returned by `renderMarkdown()`.
 *
 * @param {{ html: string }} rendered
 */
function postProcessRenderedHtml(rendered) {
  if (!rendered?.html) return;

  const checkSvg = '<svg style="display:inline;vertical-align:middle" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#1565c0"/><path d="M6 10l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const crossSvg = '<svg style="display:inline;vertical-align:middle" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#9ca3af"/><path d="M7 7l6 6M13 7l-6 6" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>';

  rendered.html = rendered.html
    .replace(/\u2705/g, checkSvg)   // ✅
    .replace(/\u274C/g, crossSvg);  // ❌
}

/**
 * Transforms `<div class="boxes-list">` blocks with markdown lists into
 * Starlight-styled card grid HTML.
 *
 * @param {string} content
 * @returns {string}
 */
function convertAsideBlocks(content) {
  const typeMap = { tip: 'tip', warning: 'caution', danger: 'danger', note: 'note' };
  const defaultTitles = { tip: 'Tip', caution: 'Caution', danger: 'Danger', note: 'Note' };

  const lines = content.split('\n');
  const result = [];
  let asideType = null;
  let asideTitle = null;
  let asideBody = [];

  for (const line of lines) {
    if (!asideType) {
      const m = line.match(/^:::\s+(tip|warning|danger|note)(?:\s+(.+))?$/);

      if (m) {
        asideType = typeMap[m[1]];
        asideTitle = m[2] || defaultTitles[asideType];
        asideBody = [];
        continue;
      }
      result.push(line);
    } else if (/^:::\s*$/.test(line)) {
      // Convert markdown links [text](url) to <a> tags since the body is
      // injected as raw HTML and won't be processed by remark.
      const body = asideBody.join('\n').trim()
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

      result.push(`<aside class="starlight-aside starlight-aside--${asideType}" aria-label="${asideTitle}">`);
      result.push(`<p class="starlight-aside__title" aria-hidden="true">${asideTitle}</p>`);
      result.push(`<div class="starlight-aside__content"><p>${body}</p></div>`);
      result.push('</aside>');
      asideType = null;
      asideTitle = null;
      asideBody = [];
    } else {
      asideBody.push(line);
    }
  }

  return result.join('\n');
}

/**
 * @param {string} content
 * @returns {string}
 */
function convertBoxesListToCardGrid(content) {
  return content.replace(
    /<div\s+class="boxes-list[^"]*">\s*\n([\s\S]*?)\n\s*<\/div>/g,
    (_, inner) => {
      const cards = [];
      const lines = inner.split('\n');
      let i = 0;

      while (i < lines.length) {
        const line = lines[i].trim();

        // Match a list item that contains a markdown link (optionally preceded by an icon tag).
        const directLink = line.match(/^-\s+(?:<i\s+class="([^"]*)">\s*<\/i>\s*)?(?:<[^>]+>\s*)*\[([^\]]+)\]\(([^)]+)\)/);

        if (directLink) {
          cards.push({ icon: directLink[1] || null, title: directLink[2], href: directLink[3] });
          i++;
          continue;
        }

        // Match a list item with icon on one line and link on the next.
        const iconLine = line.match(/^-\s+<i\s+class="([^"]*)">\s*<\/i>/);

        if (iconLine) {
          let j = i + 1;

          while (j < lines.length && lines[j].trim() === '') j++;

          if (j < lines.length) {
            const nextLink = lines[j].trim().match(/^\[([^\]]+)\]\(([^)]+)\)/);

            if (nextLink) {
              cards.push({ icon: iconLine[1], title: nextLink[1], href: nextLink[2] });
              i = j + 1;
              continue;
            }
          }
        }

        // List item without icon
        const plainLink = line.match(/^-\s+<[^>]+>/);

        if (plainLink) {
          let j = i + 1;

          while (j < lines.length && lines[j].trim() === '') j++;

          if (j < lines.length) {
            const nextLink = lines[j].trim().match(/^\[([^\]]+)\]\(([^)]+)\)/);

            if (nextLink) {
              cards.push({ icon: null, title: nextLink[1], href: nextLink[2] });
              i = j + 1;
              continue;
            }
          }
        }

        i++;
      }

      if (cards.length === 0) return '';

      const cardHtml = cards.map(({ icon, title, href }) => {
        // Split "Label (version)" into main title + subtitle
        const parenMatch = title.match(/^(.+?)\s*\(([^)]+)\)$/);
        const titleHtml = parenMatch
          ? `<span class="title">${parenMatch[1]}</span><span class="subtitle">${parenMatch[2]}</span>`
          : `<span class="title">${title}</span>`;
        const iconHtml = icon ? `<i class="${icon}"></i>` : '';

        const isExternal = /^https?:\/\//.test(href);
        const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

        return `<div class="ht-link-card"><a href="${href}"${targetAttr}>${iconHtml}${titleHtml}</a><span class="arrow" aria-hidden="true">\u2192</span></div>`;
      }).join('\n');

      return `<div class="ht-card-grid">\n${cardHtml}\n</div>`;
    }
  );
}

const FRAMEWORK_PREFIX_MAP = {
  javascript: 'javascript-data-grid',
  react: 'react-data-grid',
  angular: 'angular-data-grid',
};

/**
 * Resolves a VuePress @/framework/path.md link to an absolute Starlight URL.
 *
 * Handles two patterns:
 *   @/react/guides/foo/foo.md     → /docs/react-data-grid/permalink/
 *   @/guides/foo/foo.md           → /docs/{currentPrefix}/permalink/
 *
 * Falls back to a path-based URL if the file or its permalink cannot be found.
 *
 * @param {string} rawLink - The part after @/, e.g. "react/guides/foo/foo.md"
 * @param {string} prefix - Current framework URL prefix, e.g. "javascript-data-grid"
 * @param {string} contentDir - Absolute path to docs/content/
 * @returns {string} Resolved absolute URL
 */
function resolveAtLink(rawLink, prefix, contentDir) {
  let targetPrefix = prefix;
  let filePath = rawLink;

  const frameworkMatch = rawLink.match(/^(javascript|react|angular)\/(.+)/);

  if (frameworkMatch) {
    targetPrefix = FRAMEWORK_PREFIX_MAP[frameworkMatch[1]];
    filePath = frameworkMatch[2];
  }

  // Strip .md extension
  const pathWithoutExt = filePath.replace(/\.md$/, '');

  // Look up permalink from target file's frontmatter
  const absPath = join(contentDir, `${pathWithoutExt}.md`);

  if (existsSync(absPath)) {
    try {
      const { data } = matter(readFileSync(absPath, 'utf-8'));

      if (data.permalink) {
        const perm = data.permalink.replace(/\/$/, '');

        return perm === '' ? `/docs/${targetPrefix}/` : `/docs/${targetPrefix}${perm}/`;
      }
    } catch {
      // Fall through to path-based fallback
    }
  }

  // Fallback: strip duplicate trailing segment (VuePress naming convention)
  const parts = pathWithoutExt.split('/');

  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    parts.pop();
  }

  return `/docs/${targetPrefix}/${parts.join('/')}/`;
}

/**
 * Converts VuePress `<code-group>/<code-block>` patterns into titled code
 * fences wrapped with marker elements. At runtime, client-side JS finds the
 * markers and groups the Expressive Code blocks into a tabbed interface.
 *
 * Output structure (in markdown):
 *   <div class="code-group-start" data-tabs="npm,Yarn,pnpm"></div>
 *
 *   ```bash title="npm"
 *   npm install handsontable
 *   ```
 *
 *   ```bash title="Yarn"
 *   yarn add handsontable
 *   ```
 *
 *   <div class="code-group-end"></div>
 *
 * The blank line after the marker div ends the HTML block mode so the code
 * fences are processed normally by Expressive Code.
 *
 * @param {string} content - Markdown body
 * @returns {string}
 */
function convertCodeGroupToTabs(content) {
  return content.replace(
    /<code-group>\s*([\s\S]*?)\s*<\/code-group>/g,
    (_, inner) => {
      const blocks = [];
      const blockRegex = /<code-block\s+title="([^"]+)"(?:\s+active)?>\s*([\s\S]*?)\s*<\/code-block>/g;
      let match;

      while ((match = blockRegex.exec(inner)) !== null) {
        blocks.push({ title: match[1], code: match[2].trim() });
      }

      if (blocks.length === 0) return inner;

      const titles = blocks.map((b) => b.title).join(',');
      const fences = blocks.map((b) => {
        const fenceMatch = b.code.match(/^```(\w*)\s*\n([\s\S]*?)\n\s*```$/);

        if (fenceMatch) {
          const lang = fenceMatch[1] || '';
          const code = fenceMatch[2].trim();

          return `\`\`\`${lang} title="${b.title}"\n${code}\n\`\`\``;
        }

        return b.code;
      }).join('\n\n');

      return `<div class="code-group-start" data-tabs="${escapeHtml(titles)}"></div>\n\n${fences}\n\n<div class="code-group-end"></div>`;
    }
  );
}

/**
 * Applies all VuePress preprocessing steps EXCEPT only-for filtering
 * (which is done per-framework before calling this).
 *
 * @param {string} content
 * @param {string} [prefix] - Framework URL prefix, e.g. "javascript-data-grid"
 * @param {string} [contentDir] - Absolute path to docs/content/
 * @returns {string}
 */
function applyVuepressPreprocessing(content, prefix, contentDir) {
  let result = content;

  // Remove [[toc]] (Starlight renders ToC automatically)
  result = result.replace(/^\s*\[\[\s*toc\s*\]\]\s*$/gm, '');

  // Convert VuePress tip/warning/danger/note containers to HTML asides.
  // renderMarkdown() lacks Starlight's remark-directive plugin, so we emit
  // raw HTML that matches the Starlight aside structure.
  result = convertAsideBlocks(result);

  // Convert <code-group>/<code-block> VuePress tabs to HTML tabs
  result = convertCodeGroupToTabs(result);

  // Strip :::example / :::example-without-tabs container markers
  result = stripExampleContainers(result);

  // Convert ::: source-code-link URL to an HTML anchor
  result = convertSourceCodeLinks(result);

  // Fix $withBase('/path') → /path
  result = result.replace(/\$withBase\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, '$1');

  // Fix {{$basePath}} → '' (VuePress versioned-base template variable)
  result = result.replace(/\{\{\s*\$basePath\s*\}\}/g, '');

  // Transform @/framework/path.md links to absolute Starlight URLs using permalinks.
  // When prefix/contentDir are available (framework pages), do full permalink resolution.
  // The simple regex fallback handles any remaining @/framework/ patterns (e.g. images).
  if (prefix && contentDir) {
    result = result.replace(/@\/([^\s)'"]+\.md)/g, (_, rawLink) =>
      resolveAtLink(rawLink, prefix, contentDir)
    );
  }

  // Strip any remaining @/framework/ prefixes (non-.md links such as images)
  result = result.replace(/@\/[a-z0-9-]+\//g, '/');

  // Transform <div class="boxes-list"> into Starlight-styled card grid HTML
  result = convertBoxesListToCardGrid(result);

  // Prepend /docs base path to markdown image srcs starting with /img/
  // (renderMarkdown does not apply Astro's base-path rewriting)
  result = result.replace(/!\[([^\]]*)\]\((\/img\/)/g, '![$1](/docs$2');

  // Also fix raw HTML <img src="/img/..."> inside markdown
  result = result.replace(/(<img\s[^>]*src=["'])(\/img\/)/g, '$1/docs$2');

  return result;
}

// ---------------------------------------------------------------------------
// Loader factory
// ---------------------------------------------------------------------------

/**
 * Creates a custom Astro content loader that generates 3 framework-specific
 * entries for every .md file in the content directory.
 *
 * @param {{ contentDir: string }} options
 * @returns {import('astro').Loader}
 */
export function frameworkLoader({ contentDir }) {
  return {
    name: 'framework-loader',

    async load({ store, parseData, generateDigest, renderMarkdown, logger }) {
      // Site root is the parent of contentDir (docs/content/ → docs/).
      // Used to compute filePaths relative to site root, as required by Astro.
      const siteRoot = dirname(contentDir.replace(/[/\\]$/, ''));
      const allFiles = listMdFiles(contentDir);

      for (const absPath of allFiles) {
        const filename = absPath.split('/').pop();

        // Skip sidebars.js (not a content file)
        if (filename === 'sidebars.js') continue;

        // Skip files starting with _
        if (filename.startsWith('_')) continue;

        let raw;

        try {
          raw = readFileSync(absPath, 'utf-8');
        } catch (err) {
          logger.warn(`framework-loader: could not read ${absPath}: ${err.message}`);
          continue;
        }

        const { data: frontmatter, content: body } = matter(raw);

        // Skip files without a title (they are not standalone pages)
        if (!frontmatter.title) continue;

        const relPath = relative(contentDir, absPath);

        // Root content/index.md: framework-agnostic splash — emit once as bare "index".
        if (relPath === 'index.md') {
          const exampleProcessedBody = await processExampleBlocks(body, contentDir);
          const processedBody = applyVuepressPreprocessing(exampleProcessedBody);
          const digest = generateDigest(raw + LOADER_VERSION);
          let data;

          try {
            data = await parseData({ id: 'index', data: frontmatter });
          } catch (err) {
            // Astro 6 / Zod 4 schema validation may fail during migration;
            // fall back to raw frontmatter with Starlight-required defaults.
            data = {
              ...frontmatter,
              head: frontmatter.head || [],
              sidebar: frontmatter.sidebar || { hidden: false, attrs: {} },
              template: frontmatter.template || 'doc',
              editUrl: frontmatter.editUrl ?? true,
              pagefind: frontmatter.pagefind ?? true,
              draft: frontmatter.draft ?? false,
            };
          }

          const rendered = await renderMarkdown(processedBody);
          postProcessRenderedHtml(rendered);

          store.set({
            id: 'index',
            data,
            body: processedBody,
            rendered,
            filePath: relative(siteRoot, absPath),
            digest,
          });

          continue;
        }

        // All other pages: URL is derived from the `permalink` frontmatter field,
        // which VuePress used to define flat, canonical URLs (e.g. /installation).
        // Pages without a permalink are not standalone routable pages — skip them.
        const permalink = frontmatter.permalink;

        if (!permalink) continue;

        // Convert permalink to slug: '/' → 'index', '/installation' → 'installation',
        // '/api/' → 'api', '/api/hidden-columns' → 'api/hidden-columns'.
        // Trailing slashes are stripped so Astro generates the correct /path/ URL
        // rather than a malformed /path// double-slash route.
        const permalinkSlug = permalink === '/'
          ? 'index'
          : permalink.replace(/^\//, '').replace(/\/$/, '') || 'index';

        for (const framework of FRAMEWORKS) {
          const prefix = PREFIXES[framework];
          const id = `${prefix}/${permalinkSlug}`;

          // 1. Apply only-for filtering for this framework
          const filteredBody = filterOnlyFor(body, framework);

          // 2. Process ::: example blocks into Shiki-highlighted HTML tabs
          const exampleProcessedBody = await processExampleBlocks(filteredBody, contentDir);

          // 3. Apply remaining VuePress preprocessing
          const processedBody = applyVuepressPreprocessing(exampleProcessedBody, prefix, contentDir);

          // Make each framework entry unique; include LOADER_VERSION to bust
          // Astro's data store cache when the loader logic changes.
          const digest = generateDigest(raw + framework + LOADER_VERSION);

          let data;

          try {
            data = await parseData({ id, data: frontmatter });
          } catch (err) {
            // Astro 6 / Zod 4 schema validation may fail during migration;
            // fall back to raw frontmatter with Starlight-required defaults.
            data = {
              ...frontmatter,
              head: frontmatter.head || [],
              sidebar: frontmatter.sidebar || { hidden: false, attrs: {} },
              template: frontmatter.template || 'doc',
              editUrl: frontmatter.editUrl ?? true,
              pagefind: frontmatter.pagefind ?? true,
              draft: frontmatter.draft ?? false,
            };
          }

          // Astro 5 content layer reads from entry.rendered.html, not entry.body.
          // Pre-render the processed markdown here so Starlight's page template
          // gets actual HTML content.
          const rendered = await renderMarkdown(processedBody);
          postProcessRenderedHtml(rendered);

          store.set({
            id,
            data,
            body: processedBody,
            rendered,
            filePath: relative(siteRoot, absPath),
            digest,
          });
        }
      }
    },
  };
}
