/**
 * Vite plugin that preprocesses VuePress-specific markdown syntax before Astro
 * parses it. Runs with enforce:'pre' so it fires before Astro's own markdown
 * transformation.
 *
 * Handles:
 * - :::: only-for [framework] ... :::: (conditional content blocks)
 * - [[ toc ]] (VuePress TOC macro — Starlight generates ToC automatically)
 * - ::: tip / ::: warning / ::: danger  → :::tip / :::caution / :::danger
 *     (aside bodies: inline `` `code` ``, **bold**, [text](url) via aside-inline-markdown)
 * - ::: example / ::: example-without-tabs  (strip markers, keep code blocks)
 * - ::: source-code-link URL  (convert to <a> tag)
 * - $withBase('/path') → /path
 * - {{$currentVersion}} → resolved Handsontable version string (full semver, e.g. "17.1.0")
 * - {{$currentMinorVersion}} → GitHub branch path for source-code links (e.g. "prod-docs/17.1" or "develop")
 * - @/framework/path links  → /path (cross-framework alias)
 * - <div class="boxes-list"> ... </div>  → Starlight-styled card grid HTML
 */

import { CURRENT_DOCS_VERSION, CURRENT_DOCS_MINOR_VERSION } from './docs-version.mjs';
import { convertAsideInlineMarkdown } from './aside-inline-markdown.mjs';

/**
 * @param {{ framework?: string }} options
 * @returns {import('vite').Plugin}
 */
export function vuepressPreprocessor({ framework = 'javascript' } = {}) {
  return {
    name: 'vuepress-preprocessor',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.md')) return null;
      return { code: preprocessMarkdown(code, framework), map: null };
    },
  };
}

function preprocessMarkdown(content, framework) {
  let result = content;

  // 1. Filter :::: only-for [framework] blocks — must run first
  result = filterOnlyForBlocks(result, framework);

  // 2. Remove [[toc]] (Starlight renders a ToC automatically)
  result = result.replace(/^\s*\[\[\s*toc\s*\]\]\s*$/gm, '');

  // 3. Convert VuePress tip/warning/danger containers to Starlight aside syntax
  //    VuePress: "::: tip Title" / Starlight: ":::tip[Title]"
  result = result.replace(/^::: tip(?:\s+(.+))?$/gm, (_, label) =>
    label ? `:::tip[${label}]` : ':::tip'
  );
  result = result.replace(/^::: warning(?:\s+(.+))?$/gm, (_, label) =>
    label ? `:::caution[${label}]` : ':::caution'
  );
  result = result.replace(/^::: danger(?:\s+(.+))?$/gm, (_, label) =>
    label ? `:::danger[${label}]` : ':::danger'
  );
  result = result.replace(/^::: note(?:\s+(.+))?$/gm, (_, label) =>
    label ? `:::note[${label}]` : ':::note'
  );
  // Closing ::: (3 colons) stays unchanged — Starlight uses the same syntax

  // 3b. Convert inline Markdown inside aside blocks (`:::tip`, `:::caution`, etc.).
  //     Starlight/remark-directive does not process aside body text; we emit HTML for
  //     `` `code` ``, **bold**, and [label](href) (see aside-inline-markdown.mjs).
  result = convertInlineMarkdownInAsides(result);

  // 3c. Convert ::: details Title → <details><summary>Title</summary>…</details>
  result = convertDetailsContainers(result);

  // 4. Strip :::example / :::example-without-tabs container markers.
  //    Keep the code blocks inside so they render as plain fenced code.
  result = stripExampleContainers(result);

  // 5. Convert ::: ask-about-api name|memberof to a button element
  result = convertAskAboutApiButtons(result);

  // 5b. Convert ::: source-code-link URL to an HTML anchor
  result = convertSourceCodeLinks(result);

  // 6. Fix $withBase('/path') → /path in image srcs and link hrefs
  result = result.replace(/\$withBase\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, '$1');

  // 6b. Fix {{$basePath}} → '' (VuePress versioned-base template variable)
  //     In Astro, public assets are resolved relative to the site root so the
  //     base prefix is added automatically; dropping the placeholder preserves
  //     the correct root-relative path (e.g. /img/pages/... or /cert.pdf).
  result = result.replace(/\{\{\s*\$basePath\s*\}\}/g, '');

  // 6c. Fix {{$currentVersion}} → resolved Handsontable version string.
  //     Production builds use the package.json version (e.g. "17.0.1").
  //     Staging/dev builds use "0.0.0-next-{shortSHA}-{YYYYMMDD}" so that
  //     CodeSandbox links resolve to the correct in-progress build artifact.
  result = result.replace(/\{\{\s*\$currentVersion\s*\}\}/g, CURRENT_DOCS_VERSION);

  // 6d. Fix {{$currentMinorVersion}} → GitHub branch path for source-code links.
  //     Production builds produce "prod-docs/X.Y" (e.g. "prod-docs/17.1").
  //     Staging/dev builds resolve to "develop" (no prod-docs/ prefix, since
  //     the prod-docs/develop branch does not exist).
  result = result.replace(/\{\{\s*\$currentMinorVersion\s*\}\}/g, CURRENT_DOCS_MINOR_VERSION);

  // 7. Transform @/framework/... cross-framework alias links to absolute paths.
  //    e.g. @/react/guides/foo/foo.md → /guides/foo/foo
  result = result.replace(/@\/[a-z0-9-]+\//g, '/');

  // 8. Transform <div class="boxes-list"> into Starlight-styled card grid HTML.
  result = convertBoxesListToCardGrid(result);

  return result;
}

/**
 * Filters :::: only-for [framework1 framework2] ... :::: blocks.
 * Blocks for the current framework are kept (markers stripped).
 * Blocks for other frameworks are removed entirely.
 */
function filterOnlyForBlocks(content, framework) {
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
      // Never emit the opening marker line
      continue;
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
 * Removes :::example and :::example-without-tabs opening markers and their
 * corresponding closing ::: lines. The code blocks inside are left intact so
 * they render as plain fenced code blocks in Phase 1.
 *
 * Phase 2: replace this with a full LiveExample MDX component.
 */
function stripExampleContainers(content) {
  const lines = content.split('\n');
  const result = [];
  // Depth counter: incremented on :::example open, decremented on ::: close
  let exampleDepth = 0;

  for (const line of lines) {
    if (/^:::\s*(example|example-without-tabs)(\s|$)/.test(line)) {
      exampleDepth++;
      // Drop the opening marker line
      continue;
    }

    if (exampleDepth > 0 && /^:::\s*$/.test(line)) {
      exampleDepth--;
      // Drop the closing marker line
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Transforms `<div class="boxes-list">` blocks with markdown lists into
 * Starlight-styled card grid HTML.
 *
 * Input:
 *   <div class="boxes-list gray">
 *
 *   - [Link Text](url)
 *   - <i class="ico i-react"></i>
 *   [React](url)
 *
 *   </div>
 *
 * Output:
 *   <div class="ht-card-grid">
 *   <div class="ht-link-card"><a href="url"><span class="title">Link Text</span></a><span class="arrow" aria-hidden="true">→</span></div>
 *   </div>
 */
function convertBoxesListToCardGrid(content) {
  return content.replace(
    /<div\s+class="boxes-list[^"]*">\s*\n([\s\S]*?)\n\s*<\/div>/g,
    (_, inner) => {
      // Parse markdown list items: `- [text](url)` or `- <i ...></i>\n[text](url)`
      const cards = [];
      const lines = inner.split('\n');

      let i = 0;

      while (i < lines.length) {
        const line = lines[i].trim();

        // Match a list item that contains a markdown link directly.
        const directLink = line.match(/^-\s+(?:<[^>]+>\s*)*\[([^\]]+)\]\(([^)]+)\)/);

        if (directLink) {
          cards.push({ title: directLink[1], href: directLink[2] });
          i++;
          continue;
        }

        // Match a list item with icon on one line and link on the next.
        const iconLine = line.match(/^-\s+<[^>]+>/);

        if (iconLine) {
          // Check next non-empty line for the link.
          let j = i + 1;

          while (j < lines.length && lines[j].trim() === '') j++;

          if (j < lines.length) {
            const nextLink = lines[j].trim().match(/^\[([^\]]+)\]\(([^)]+)\)/);

            if (nextLink) {
              cards.push({ title: nextLink[1], href: nextLink[2] });
              i = j + 1;
              continue;
            }
          }
        }

        i++;
      }

      if (cards.length === 0) return '';

      const cardHtml = cards.map(({ title, href }) => {
        // Convert backtick-wrapped text to <code> tags
        const processed = title.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Split "Prefix: `code`" into code as title + prefix as subtitle
        const prefixMatch = processed.match(/^([^<]+?):\s*(<code>[^<]+<\/code>)$/);
        // Split "Label (version)" into main title + subtitle
        const parenMatch = !prefixMatch && processed.match(/^(.+?)\s*\(([^)]+)\)$/);
        let titleHtml;

        if (prefixMatch) {
          titleHtml = `<span class="title">${prefixMatch[2]}</span><span class="subtitle">${prefixMatch[1]}</span>`;
        } else if (parenMatch) {
          titleHtml = `<span class="title">${parenMatch[1]}</span><span class="subtitle">${parenMatch[2]}</span>`;
        } else {
          titleHtml = `<span class="title">${processed}</span>`;
        }

        return `<div class="ht-link-card"><a href="${href}">${titleHtml}</a><span class="arrow" aria-hidden="true">\u2192</span></div>`;
      }).join('\n');

      return `<div class="ht-card-grid">\n${cardHtml}\n</div>`;
    }
  );
}

/**
 * Converts ::: source-code-link URL ::: blocks to plain HTML anchor tags.
 */
/**
 * Converts ::: details Title → <details><summary>Title</summary>…</details>.
 * Content between the markers is kept as-is (markdown will process it).
 */
function convertDetailsContainers(content) {
  const lines = content.split('\n');
  const result = [];
  let depth = 0;

  for (const line of lines) {
    const openMatch = line.match(/^:{3,}\s+details\s+(.+)$/);

    if (openMatch) {
      depth++;
      result.push(`<details>`);
      result.push(`<summary>${openMatch[1].trim()}</summary>`);
      result.push('');
      continue;
    }

    if (depth > 0 && /^:{3,}\s*$/.test(line)) {
      depth--;
      result.push('');
      result.push('</details>');
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Converts inline Markdown inside Starlight aside blocks (:::tip, :::caution,
 * :::danger, :::note) to HTML. Starlight/remark-directive treats aside bodies as
 * plain text; see `./aside-inline-markdown.mjs` for supported syntax.
 */
function convertInlineMarkdownInAsides(content) {
  const lines = content.split('\n');
  const result = [];
  let insideAside = false;
  let asideDepth = 0;

  for (const line of lines) {
    if (/^:::(tip|caution|danger|note)/.test(line)) {
      insideAside = true;
      asideDepth = 1;
      result.push(line);
      continue;
    }

    if (insideAside) {
      if (/^:{3,}\s+\S/.test(line)) {
        asideDepth++;
        result.push(line);
        continue;
      }

      if (/^:{3,}\s*$/.test(line)) {
        asideDepth--;

        if (asideDepth <= 0) {
          insideAside = false;
        }

        result.push(line);
        continue;
      }

      result.push(convertAsideInlineMarkdown(line));
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Converts ::: ask-about-api name|memberof ::: blocks to Ask AI button elements.
 *
 * @param {string} content
 * @returns {string}
 */
function convertAskAboutApiButtons(content) {
  const lines = content.split('\n');
  const result = [];
  let inBlock = false;
  let optionData = '';

  for (const line of lines) {
    const openMatch = line.match(/^:::\s+ask-about-api\s+(\S+)\s*$/);

    if (openMatch) {
      inBlock = true;
      optionData = openMatch[1];
      continue;
    }

    if (inBlock && /^:::\s*$/.test(line)) {
      inBlock = false;
      const pipeIdx = optionData.indexOf('|');
      const optionName = pipeIdx >= 0 ? optionData.slice(0, pipeIdx) : optionData;
      // Strip namespace prefix (e.g. "module:Core" -> "Core")
      const rawPlugin = pipeIdx >= 0 ? optionData.slice(pipeIdx + 1) : '';
      const pluginName = rawPlugin.split(':').pop()?.split('~')[0]?.split('#')[0] || 'Handsontable';

      if (optionName) {
        result.push(
          `<button type="button" class="ask-about-api-btn" data-option="${optionName}" data-plugin="${pluginName}" aria-label="Ask AI about ${optionName}">Ask AI</button>`
        );
      }
      optionData = '';
      continue;
    }

    if (!inBlock) {
      result.push(line);
    }
  }

  return result.join('\n');
}

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
