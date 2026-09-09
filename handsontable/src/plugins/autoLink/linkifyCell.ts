import {
  createLinkElement,
  findLinkTokens,
  unwrapLinks,
  type LinkScheme,
  type LinkTarget,
} from '../../utils/cellLinks';

/**
 * Class every `autoLink` anchor carries next to the shared `ht-link`. It is the selector the plugin
 * uses to find and unwrap its own anchors, so another feature's anchors are never touched.
 */
export const AUTO_LINK_CLASS_NAME = 'ht-auto-link';

/**
 * Options for one `linkifyCell` pass, resolved from the plugin and cell settings.
 */
export interface LinkifyOptions {
  /**
   * The document URL that URLs are resolved against.
   */
  baseUrl: string;
  /**
   * Where the links open.
   */
  target: LinkTarget;
  /**
   * The allowed URL schemes.
   */
  schemes: readonly LinkScheme[];
  /**
   * `true` links URLs inside longer text; `false` links only a cell whose whole text is one URL.
   */
  inline: boolean;
  /**
   * Extra class names for every anchor.
   */
  classNames: readonly string[];
}

// Text inside these elements is never linked: an anchor inside an anchor is invalid HTML, and a
// link inside a form control or button would hijack the control.
const SKIPPED_ANCESTORS = 'a, button, input, select, textarea';
const OWN_LINK_SELECTOR = `a.${AUTO_LINK_CLASS_NAME}`;

/**
 * Unwraps every `autoLink` anchor under `root`.
 *
 * @param {Element} root A cell, or the grid's root element.
 * @returns {number} The number of anchors removed.
 */
export function unlinkifyCell(root: Element): number {
  return unwrapLinks(root, OWN_LINK_SELECTOR);
}

/**
 * Collects the text nodes under a cell that may be linked, skipping text inside interactive
 * elements. Collecting first and mutating afterwards keeps the walk stable.
 *
 * @param {HTMLTableCellElement} TD The cell.
 * @returns {Text[]} The candidate text nodes, in document order.
 */
function collectTextNodes(TD: HTMLTableCellElement): Text[] {
  const doc = TD.ownerDocument;
  const walker = doc.createTreeWalker(TD, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();

  while (node !== null) {
    const parent = node.parentElement;
    const blocker = parent?.closest(SKIPPED_ANCESTORS) ?? null;

    if (blocker === null || !TD.contains(blocker)) {
      nodes.push(node as Text);
    }

    node = walker.nextNode();
  }

  return nodes;
}

/**
 * Wraps every URL inside one text node in its own anchor. Tokens are applied last to first so the
 * offsets of the earlier ones stay valid while the node is split.
 *
 * @param {Text} textNode The text node.
 * @param {LinkifyOptions} options The pass options.
 */
function linkifyTextNode(textNode: Text, options: LinkifyOptions): void {
  const tokens = findLinkTokens(textNode.data, options.baseUrl, options.schemes);
  const doc = textNode.ownerDocument;

  for (let index = tokens.length - 1; index >= 0; index--) {
    const { start, end, href } = tokens[index];

    // `splitText(end)` leaves the tail in a new node; `splitText(start)` then isolates the URL.
    textNode.splitText(end);

    const urlNode = textNode.splitText(start);
    const link = createLinkElement(doc, {
      href,
      target: options.target,
      classNames: [AUTO_LINK_CLASS_NAME, ...options.classNames],
    });

    urlNode.parentNode?.insertBefore(link, urlNode);
    link.appendChild(urlNode);
  }
}

/**
 * Wraps the whole cell content in one anchor when the trimmed rendered text is exactly one URL.
 *
 * @param {HTMLTableCellElement} TD The cell.
 * @param {string} text The cell's rendered text.
 * @param {LinkifyOptions} options The pass options.
 */
function linkifyWholeCell(TD: HTMLTableCellElement, text: string, options: LinkifyOptions): void {
  const trimmed = text.trim();
  const tokens = findLinkTokens(trimmed, options.baseUrl, options.schemes);

  if (tokens.length !== 1 || tokens[0].start !== 0 || tokens[0].end !== trimmed.length) {
    return;
  }

  // A checkbox whose label is the URL is the case this guards: the trimmed text is exactly one URL,
  // but wrapping the whole cell would move the interactive element inside the anchor and hijack it.
  if (TD.querySelector(SKIPPED_ANCESTORS) !== null) {
    return;
  }

  const link = createLinkElement(TD.ownerDocument, {
    href: tokens[0].href,
    target: options.target,
    classNames: [AUTO_LINK_CLASS_NAME, ...options.classNames],
  });

  // The nodes are moved, never re-serialized, so a renderer's elements survive inside the anchor.
  while (TD.firstChild) {
    link.appendChild(TD.firstChild);
  }

  TD.appendChild(link);
}

/**
 * Decorates a rendered cell: removes this feature's anchors from the previous pass, then links the
 * URLs found in the current rendered text. A cell that already holds any other anchor (a `HYPERLINK`
 * cell, an `html` cell with a user link, a custom renderer's link) is left alone.
 *
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {LinkifyOptions} options The pass options.
 */
export function linkifyCell(TD: HTMLTableCellElement, options: LinkifyOptions): void {
  // Walkontable recycles TD elements and a renderer may keep its previous DOM, so the pass starts
  // from a clean cell and rebuilds every anchor from the text that is actually rendered now.
  unlinkifyCell(TD);

  const text = TD.textContent ?? '';

  // Every allowed scheme contains a colon; this keeps the regex off the ordinary cell.
  if (text.indexOf(':') === -1) {
    return;
  }

  if (TD.querySelector('a') !== null) {
    return;
  }

  if (options.inline) {
    collectTextNodes(TD).forEach(textNode => linkifyTextNode(textNode, options));
  } else {
    linkifyWholeCell(TD, text, options);
  }
}
