/**
 * Slug of a heading text the way the docs site builds an anchor: the list number (`6. `) and the Markdown code
 * ticks are dropped, the text is lower-cased, every character that is not a letter, a digit, a space, a hyphen, or
 * an underscore is removed, and each space becomes a hyphen. So `Replace \`handsontable/common\` imports` is
 * `replace-handsontablecommon-imports` and `Numbro.js` is `numbrojs`.
 *
 * @param {string} text Heading text without the leading `#` marks.
 * @returns {string} The slug, before the `-1`, `-2` suffix that repeated headings get.
 */
export function slugOf(text) {
  return text
    .replace(/^\d+\.\s+/, '')
    .replace(/`/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

/**
 * Every anchor a Markdown page offers: the slug of each `##` to `######` heading outside a code fence, with the
 * numeric suffix that the site gives a heading whose slug was seen before.
 *
 * @param {string} markdown Page text.
 * @returns {Set<string>} The anchors.
 */
export function anchorsOf(markdown) {
  const anchors = new Set();
  const seen = new Map();
  let fence = null;

  for (const line of markdown.split('\n')) {
    const marker = /^\s*(```+|~~~+)/.exec(line)?.[1];

    if (marker) {
      if (fence === null) {
        fence = marker[0];
      } else if (marker[0] === fence) {
        fence = null;
      }

      continue;
    }

    const heading = fence === null ? /^#{2,6}\s+(.+?)\s*$/.exec(line) : null;

    if (heading) {
      const slug = slugOf(heading[1]);
      const count = seen.get(slug) ?? 0;

      seen.set(slug, count + 1);
      anchors.add(count === 0 ? slug : `${slug}-${count}`);
    }
  }

  return anchors;
}
