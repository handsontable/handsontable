/**
 * Inline Markdown subsets for Starlight aside directive bodies (`:::tip`, etc.).
 * Starlight/remark-directive does not parse these; callers run this preprocessor.
 *
 * Transformation order:
 * 1. Inline `` `code` `` → placeholders (shared chunk table for nested/recursive passes).
 * 2. Markdown links `[label](href)` → placeholders (raw href preserved for one `escapeAttr` pass).
 * 3. Strong `**text**` → `<strong>` (`escapeHtml` on masked text only -- avoids double-encoding `&` in URLs).
 * 4. Expand link placeholders to `<a>`; labels are processed via recursive {@link convertAsideInlineMarkdown}
 *    so patterns like `[**bold**](url)` keep working.
 * 5. Restore code placeholders to `<code>`.
 *
 * @module aside-inline-markdown
 */

const MAX_RECURSION_DEPTH = 10;

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeAttr(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} line
 * @param {{ sharedCodeChunks?: string[], depth?: number }} [options]
 * @returns {string}
 */
export function convertAsideInlineMarkdown(line, options = {}) {
  const { sharedCodeChunks = null, depth = 0 } = options;

  if (depth > MAX_RECURSION_DEPTH) {
    return escapeHtml(line);
  }

  const codeChunks = sharedCodeChunks ?? [];

  let masked = line.replace(/`([^`]+)`/g, (_, code) => {
    const id = codeChunks.length;

    codeChunks.push(code);
    return `@@HT_ASIDE_CODE_${id}@@`;
  });

  const linkEntries = [];

  while (true) {
    const m = masked.match(/\[([^\]]*)\]\(([^)]*)\)/);

    if (!m) {
      break;
    }

    const full = m[0];
    const at = masked.indexOf(full);

    linkEntries.push({ label: m[1], href: m[2] });
    masked = `${masked.slice(0, at)}@@HT_ASIDE_LINK_${linkEntries.length - 1}@@${masked.slice(at + full.length)}`;
  }

  masked = masked.replace(/\*\*(.+?)\*\*/g, (_, inner) =>
    `<strong>${escapeHtml(inner)}</strong>`
  );

  for (let i = 0; i < linkEntries.length; i++) {
    const ph = `@@HT_ASIDE_LINK_${i}@@`;
    const { label, href } = linkEntries[i];
    const innerHtml = convertAsideInlineMarkdown(label, {
      sharedCodeChunks: codeChunks,
      depth: depth + 1,
    });
    const anchor = `<a href="${escapeAttr(href)}">${innerHtml}</a>`;

    masked = masked.split(ph).join(anchor);
  }

  return masked.replace(/@@HT_ASIDE_CODE_(\d+)@@/g, (_, id) => {
    const chunk = codeChunks[Number(id)];

    return `<code>${escapeHtml(chunk)}</code>`;
  });
}

/**
 * Applies {@link convertAsideInlineMarkdown} to each line of a block (aside bodies).
 *
 * @param {string} body
 * @returns {string}
 */
export function convertAsideBodyMarkdown(body) {
  return body.split('\n').map(line => convertAsideInlineMarkdown(line)).join('\n');
}
