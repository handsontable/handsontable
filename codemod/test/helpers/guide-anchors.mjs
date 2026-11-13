import assert from 'node:assert/strict';

/**
 * The text of a heading as the page shows it, which is what the site slugs: the list number is dropped, an inline
 * tag (`<kbd>`) is dropped and its text stays, and a double hyphen outside a code span becomes the dash that the site's
 * typography makes of it. A code span keeps its text as it is, tags and hyphens included.
 *
 * @param {string} text Heading text without the leading `#` marks.
 * @returns {string} The text without inline markup.
 */
export function headingTextOf(text) {
  return text
    .replace(/^\d+\.\s+/, '')
    .split(/(`[^`]*`)/)
    .map(part => (part.startsWith('`') && part.endsWith('`') && part.length > 1 ? part.slice(1, -1)
      : part.replace(/<\/?[A-Za-z][^>]*>/g, '').replace(/-{2,3}/g, '~')))
    .join('');
}

/**
 * Slug of a heading text the way the docs site builds an anchor: the text of the heading with its inline markup
 * removed (`headingTextOf()`) is lower-cased, every character that is not a letter, a digit, a space, a hyphen, or an
 * underscore is removed, and each space becomes a hyphen. So `Replace \`handsontable/common\` imports` is
 * `replace-handsontablecommon-imports`, `Numbro.js` is `numbrojs`, and `<kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click`
 * is `cmdctrl--click`. The test `guide-anchors.test.mjs` pins this function to the ids of the built site.
 *
 * @param {string} text Heading text without the leading `#` marks.
 * @returns {string} The slug, before the `-1`, `-2` suffix that repeated headings get.
 */
export function slugOf(text) {
  return headingTextOf(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

/**
 * The rules of a manifest whose `guide` anchor is not a heading of the guide page.
 *
 * @param {{rules: Array<{id: string, guide?: string}>}} manifest A loaded manifest.
 * @param {string} markdown Text of the guide page.
 * @returns {Array<{id: string, guide: string}>} One entry per rule with a missing anchor.
 */
export function missingAnchors(manifest, markdown) {
  const anchors = anchorsOf(markdown);
  const sections = [
    ...manifest.rules.map(rule => ({ id: rule.id, guide: rule.guide })),
    ...(manifest.notAutomated ?? []).map(item => ({
      id: `notAutomated ${item.guide ?? item.title ?? ''}`.trim(),
      guide: item.guide,
    })),
  ];

  return sections.filter(section => section.guide && !anchors.has(section.guide));
}

/**
 * Check the rule anchors of a manifest against its guide. A missing anchor fails for a `released` manifest, whose
 * guide is final. It is only reported as a test diagnostic for a `draft` one, because the guide of a draft is still
 * edited and a renamed heading there must not fail this package's tests.
 *
 * @param {object} manifest A loaded manifest with `version`, `status`, `rules`, and `guide.source`.
 * @param {string} markdown Text of the guide page.
 * @param {{diagnostic: (message: string) => void}} context The `node:test` context of the test.
 * @returns {Array<{id: string, guide: string}>} The rules with a missing anchor.
 */
export function checkAnchors(manifest, markdown, context) {
  const missing = missingAnchors(manifest, markdown);

  if (manifest.status === 'draft') {
    missing.forEach(({ id, guide }) => context.diagnostic(
      `draft ${manifest.version}: ${id} anchor "${guide}" is not a heading of ${manifest.guide.source}`
    ));

    return missing;
  }

  assert.deepEqual(missing, [], `${manifest.version}: rule anchors that are not headings of ${manifest.guide.source}`);

  return missing;
}

/**
 * Every anchor a Markdown page offers, in document order: the slug of each `##` to `######` heading outside a code
 * fence, with the numeric suffix that the site gives a heading whose slug was seen before.
 *
 * @param {string} markdown Page text.
 * @returns {string[]} The anchors, one per heading.
 */
export function anchorListOf(markdown) {
  const anchors = [];
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
      anchors.push(count === 0 ? slug : `${slug}-${count}`);
    }
  }

  return anchors;
}

/**
 * Every anchor a Markdown page offers.
 *
 * @param {string} markdown Page text.
 * @returns {Set<string>} The anchors.
 */
export function anchorsOf(markdown) {
  return new Set(anchorListOf(markdown));
}
