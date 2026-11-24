/**
 * Accessible names for the scrolling blocks of a docs page: code blocks and Markdown tables.
 *
 * A block that overflows becomes a focusable region (`src/scripts/scrollable-blocks.ts`), and a page
 * can hold many of them, so each needs a name that no other region of the page shares. The name is
 * the kind of the block and the text of the nearest heading before it: `Code: Configure sorting`.
 * Blocks that share that base name are numbered in document order across the whole page
 * (`Code 2: How to migrate`), so a heading text repeated in several sections still gives unique
 * names. Every block is counted, also one that fits and gets no name applied, so a name does not
 * change when the viewport changes which blocks overflow.
 */

const KIND_LABELS = {
  code: 'Code',
  table: 'Table',
};

/**
 * Collapses whitespace in a heading text.
 *
 * @param {string | undefined | null} text The heading text.
 * @returns {string}
 */
function normalizeHeadingText(text) {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Builds the name of one block.
 *
 * @param {string} kindLabel The label of the block kind.
 * @param {string} headingText The text of the nearest heading before the block, or an empty string.
 * @param {number} ordinal The position of the block among the blocks with the same kind and heading text.
 * @returns {string}
 */
function formatName(kindLabel, headingText, ordinal) {
  const prefix = ordinal > 1 ? `${kindLabel} ${ordinal}` : kindLabel;

  return headingText ? `${prefix}: ${headingText}` : prefix;
}

/**
 * Names the blocks of a page.
 *
 * @param {Array<{ type: 'heading', text: string } | { type: 'block', kind: 'code' | 'table' }>} items
 * The headings and the blocks of the page content, in document order.
 * @returns {string[]} One name per block, in the order of the blocks.
 */
export function scrollableBlockNames(items) {
  const counters = new Map();
  const names = [];
  let headingText = '';

  for (const item of items) {
    if (item.type === 'heading') {
      headingText = normalizeHeadingText(item.text);

    } else {
      const kindLabel = KIND_LABELS[item.kind];

      if (!kindLabel) {
        throw new Error(`Unknown scrollable block kind: ${item.kind}`);
      }

      const baseName = formatName(kindLabel, headingText, 1);
      const ordinal = (counters.get(baseName) ?? 0) + 1;

      counters.set(baseName, ordinal);
      names.push(formatName(kindLabel, headingText, ordinal));
    }
  }

  return names;
}
