/**
 * Keyboard access to the scrolling blocks of a docs page.
 *
 * A code block or a Markdown table wider than the content column scrolls sideways. A keyboard user
 * can scroll it only when it takes the focus, and a focusable block needs a role and a name for a
 * screen reader. So a block that overflows gets `tabindex="0"`, `role="region"` and an `aria-label`,
 * and a block that fits gets none of them: a fitting block is no Tab stop, and `aria-label` is not
 * allowed on an element with no role. The three attributes always go on and off together.
 *
 * Expressive Code ships a script that sets `tabindex` and `role` on an overflowing `pre` and removes
 * them when it fits. This module makes the same decision from the same measurement and adds the name,
 * so the two never disagree, in either order.
 *
 * The names come from `src/lib/scrollable-block-names.mjs`.
 */
import { scrollableBlockNames } from '../lib/scrollable-block-names.mjs';

type BlockKind = 'code' | 'table';

const CONTENT_SELECTOR = 'main';
const EXAMPLE_SELECTOR = '.hot-example';
const HEADING_SELECTOR = 'h2, h3, h4, h5, h6';
const CODE_BLOCK_SELECTOR = '.expressive-code pre';
const TABLE_WRAPPER_SELECTOR = 'div.table-container';
const HEADING_CONTROLS_SELECTOR = '.api-member-actions, .source-code-link, .ask-about-api-btn, .sl-anchor-link';

const blockNames = new WeakMap<Element, string>();
const blockOfObserved = new WeakMap<Element, HTMLElement>();

/**
 * Reads the title of a heading, without the controls the docs add inside it.
 *
 * @param heading The heading element.
 * @returns The title text.
 */
function headingTitle(heading: Element): string {
  return [...heading.childNodes]
    .filter(node => !(node instanceof Element && node.matches(HEADING_CONTROLS_SELECTOR)))
    .map(node => node.textContent ?? '')
    .join('');
}

/**
 * Tells what kind of scrolling block an element is.
 *
 * @param element An element of the page content.
 * @returns The kind, or `null` when the element is not a block this module names.
 */
function blockKind(element: Element): BlockKind | null {
  if (element.matches(CODE_BLOCK_SELECTOR)) {
    return element.querySelector(':scope > code') ? 'code' : null;
  }

  if (element.matches(TABLE_WRAPPER_SELECTOR)) {
    return element.closest(EXAMPLE_SELECTOR) ? null : 'table';
  }

  return null;
}

/**
 * Makes an overflowing block a named Tab stop, and takes that away from a block that fits.
 *
 * @param block A code block or a table wrapper.
 */
function syncBlock(block: HTMLElement) {
  const name = blockNames.get(block);

  if (!name) {
    return;
  }

  if (block.scrollWidth > block.clientWidth) {
    if (block.getAttribute('tabindex') !== '0') {
      block.setAttribute('tabindex', '0');
    }
    if (block.getAttribute('role') !== 'region') {
      block.setAttribute('role', 'region');
    }
    if (block.getAttribute('aria-label') !== name) {
      block.setAttribute('aria-label', name);
    }

  } else {
    block.removeAttribute('tabindex');
    block.removeAttribute('role');
    block.removeAttribute('aria-label');
  }
}

/**
 * Names every scrolling block of the page and keeps each one in step with its overflow.
 */
function initScrollableBlocks() {
  const content = document.querySelector(CONTENT_SELECTOR);

  if (!content || typeof ResizeObserver === 'undefined') {
    return;
  }

  const blocks: HTMLElement[] = [];
  const items: Array<{ type: 'heading', text: string } | { type: 'block', kind: BlockKind }> = [];
  const candidates = content.querySelectorAll<HTMLElement>(
    `${HEADING_SELECTOR}, ${CODE_BLOCK_SELECTOR}, ${TABLE_WRAPPER_SELECTOR}`
  );

  candidates.forEach((element) => {
    if (element.matches(HEADING_SELECTOR)) {
      if (!element.closest(EXAMPLE_SELECTOR)) {
        items.push({ type: 'heading', text: headingTitle(element) });
      }

      return;
    }

    const kind = blockKind(element);

    if (kind) {
      items.push({ type: 'block', kind });
      blocks.push(element);
    }
  });

  const names = scrollableBlockNames(items);
  const observer = new ResizeObserver((entries) => {
    new Set(entries.map(entry => blockOfObserved.get(entry.target))).forEach((block) => {
      if (block) {
        syncBlock(block);
      }
    });
  });

  blocks.forEach((block, index) => {
    blockNames.set(block, names[index]);
    blockOfObserved.set(block, block);
    observer.observe(block);

    const scrolledContent = block.firstElementChild;

    if (scrolledContent) {
      blockOfObserved.set(scrolledContent, block);
      observer.observe(scrolledContent);
    }
  });
}

initScrollableBlocks();
