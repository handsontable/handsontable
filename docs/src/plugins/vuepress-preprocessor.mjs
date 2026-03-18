/**
 * Vite plugin that preprocesses VuePress-specific markdown syntax before Astro
 * parses it. Runs with enforce:'pre' so it fires before Astro's own markdown
 * transformation.
 *
 * Handles:
 * - :::: only-for [framework] ... :::: (conditional content blocks)
 * - [[ toc ]] (VuePress TOC macro — Starlight generates ToC automatically)
 * - ::: tip / ::: warning / ::: danger  → :::tip / :::caution / :::danger
 * - ::: example / ::: example-without-tabs  (strip markers, keep code blocks)
 * - ::: source-code-link URL  (convert to <a> tag)
 * - $withBase('/path') → /path
 * - @/framework/path links  → /path (cross-framework alias)
 */

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

  // 4. Strip :::example / :::example-without-tabs container markers.
  //    Keep the code blocks inside so they render as plain fenced code.
  result = stripExampleContainers(result);

  // 5. Convert ::: source-code-link URL to an HTML anchor
  result = convertSourceCodeLinks(result);

  // 6. Fix $withBase('/path') → /path in image srcs and link hrefs
  result = result.replace(/\$withBase\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, '$1');

  // 7. Transform @/framework/... cross-framework alias links to absolute paths.
  //    e.g. @/react/guides/foo/foo.md → /guides/foo/foo
  result = result.replace(/@\/[a-z0-9-]+\//g, '/');

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
  // Stack to handle nested only-for blocks
  const stack = [];

  for (const line of lines) {
    const openMatch = line.match(/^:{4,}\s+only-for\s+(.+)$/);

    if (openMatch) {
      const frameworks = openMatch[1].trim().split(/\s+/);
      const keep = frameworks.includes(framework);
      stack.push(keep);
      // Never emit the opening marker line
      continue;
    }

    if (stack.length > 0 && /^:{4,}\s*$/.test(line)) {
      stack.pop();
      // Never emit the closing marker line
      continue;
    }

    // Inside an only-for block: emit only if ALL ancestor blocks say keep
    if (stack.length > 0) {
      if (stack.every(Boolean)) {
        result.push(line);
      }
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
 * Converts ::: source-code-link URL ::: blocks to plain HTML anchor tags.
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
