import { getCellContentRoot } from '../../helpers/dom/element';

/**
 * Class every anchor the grid itself renders into a data cell carries. It is the opt-in marker for
 * the link styles (the base stylesheet deliberately leaves user-rendered anchors alone, #4363), the
 * selector the Alt+Enter command reads, and the selector that lets one feature clear another
 * feature's anchor before wrapping the same cell.
 */
export const LINK_CLASS_NAME = 'ht-link';

/**
 * Class the wrapper of a hidden `mailto:`/`tel:` scheme prefix carries. The stylesheet hides any
 * element with this class; `hideSchemePrefix` is the only place that creates one.
 */
export const LINK_SCHEME_CLASS_NAME = 'ht-link-scheme';

// Matched against the anchor's own rendered text, case-insensitively: the scheme itself is decided
// by `link.protocol`, so these only confirm the visible text actually starts with it.
const MAILTO_PREFIX_PATTERN = /^mailto:/i;
const TEL_PREFIX_PATTERN = /^tel:/i;

/**
 * Where a cell link opens.
 */
export type LinkTarget = '_blank' | '_self';

/**
 * Options for `createLinkElement`.
 */
export interface LinkElementOptions {
  /**
   * The resolved absolute URL. Callers pass the output of `resolveLinkUrl`, never raw cell text.
   */
  href: string;
  /**
   * Where the link opens.
   */
  target: LinkTarget;
  /**
   * Extra class names, appended after `ht-link`.
   */
  classNames?: readonly string[];
}

/**
 * Builds an empty cell-link anchor. `rel` and `tabIndex` are fixed: the anchor must never leak the
 * opener, and cell content stays out of the grid's tab order (Alt+Enter is the keyboard path).
 *
 * @param {Document} doc The document that owns the grid.
 * @param {LinkElementOptions} options The link options.
 * @returns {HTMLAnchorElement} The anchor, with no children yet.
 */
export function createLinkElement(
  doc: Document,
  { href, target, classNames = [] }: LinkElementOptions
): HTMLAnchorElement {
  const link = doc.createElement('a');

  link.className = [LINK_CLASS_NAME, ...classNames.map(name => name.trim()).filter(name => name !== '')].join(' ');
  link.href = href;
  link.target = target;
  link.rel = 'noopener noreferrer';
  link.tabIndex = -1;

  return link;
}

/**
 * Moves a cell's whole rendered content into an anchor, then appends the anchor as the sole child of
 * the cell's content root: the engine's `.htCellClip` wrapper when the row has an exact height,
 * otherwise `TD` itself (`getCellContentRoot`). Two call sites share this - `linkifyCell`'s
 * whole-cell mode and the Formulas plugin's `HYPERLINK` wrap - because wrapping `TD` directly would
 * rebuild an exact-height row's clipping wrapper on every render pass, and any node left outside it
 * would grow the row back to its content height.
 *
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {HTMLAnchorElement} link The anchor to wrap the content in. Not yet attached anywhere.
 */
export function wrapCellContent(TD: HTMLTableCellElement, link: HTMLAnchorElement): void {
  const contentRoot = getCellContentRoot(TD);

  // The nodes are moved, never re-serialized, so a renderer's elements survive inside the anchor.
  while (contentRoot.firstChild) {
    link.appendChild(contentRoot.firstChild);
  }

  contentRoot.appendChild(link);
}

/**
 * Hides the `mailto:`/`tel:` scheme prefix of an anchor's rendered text, wrapping it in a
 * `span.ht-link-scheme` that the stylesheet hides. The prefix stays in the DOM instead of being
 * removed: the caller re-tokenizes `TD.textContent` on every render pass, and a text that lost
 * `mailto:` or `tel:` would no longer look like a linkable scheme on the next pass. `href` and
 * `textContent` never change - only DOM nodes move.
 *
 * @param {HTMLAnchorElement} link The anchor to hide the scheme prefix of.
 * @returns {boolean} `true` when the prefix was wrapped; `false` when the anchor's `href` is not a
 * `mailto:`/`tel:` link, or its leading text does not carry that scheme.
 */
export function hideSchemePrefix(link: HTMLAnchorElement): boolean {
  let pattern: RegExp;

  if (link.protocol === 'mailto:') {
    pattern = MAILTO_PREFIX_PATTERN;
  } else if (link.protocol === 'tel:') {
    pattern = TEL_PREFIX_PATTERN;
  } else {
    return false;
  }

  const doc = link.ownerDocument;
  const walker = doc.createTreeWalker(link, NodeFilter.SHOW_TEXT);
  let textNode: Text | null = null;
  let node = walker.nextNode();

  while (node !== null) {
    if (/\S/.test((node as Text).data)) {
      textNode = node as Text;
      break;
    }

    node = walker.nextNode();
  }

  if (textNode === null || !pattern.test(textNode.data.trimStart())) {
    return false;
  }

  const lead = textNode.data.length - textNode.data.trimStart().length;
  const schemeNode = lead > 0 ? textNode.splitText(lead) : textNode;

  schemeNode.splitText(link.protocol.length);

  const scheme = doc.createElement('span');

  scheme.className = LINK_SCHEME_CLASS_NAME;

  schemeNode.parentNode?.insertBefore(scheme, schemeNode);
  scheme.appendChild(schemeNode);

  return true;
}

/**
 * Moves an anchor's content up into the anchor's own parent and drops the anchor.
 *
 * The insertion goes through `link.parentNode` rather than the cell: a renderer that leaves the
 * previous DOM in place can wrap an existing anchor, leaving it as `TD > div > a` instead of a direct
 * child. Inserting relative to the cell would then throw `NotFoundError` and, because this runs
 * inside `afterRenderer`, take the whole draw down with it.
 *
 * @param {Element} link The anchor to unwrap.
 * @returns {ParentNode|null} The parent that received the content.
 */
function unwrapLink(link: Element): ParentNode | null {
  const { parentNode } = link;

  while (link.firstChild) {
    parentNode?.insertBefore(link.firstChild, link);
  }

  link.remove();

  return parentNode;
}

/**
 * Unwraps every anchor under `root` that matches `selector`, including anchors nested in each other
 * by an older render pass, and merges the text nodes each unwrap leaves behind. Merging matters: the
 * next decoration pass tokenizes text node by text node, so a URL split across two nodes would be
 * missed.
 *
 * The matching anchors are collected in one `querySelectorAll` pass instead of being re-queried from
 * `root` after every removal, which made the whole call quadratic in the number of matches. A single
 * snapshot still handles anchors nested inside each other correctly: `querySelectorAll` returns
 * document order, so an outer anchor is unwrapped before the inner one it contained, and the inner
 * one - still connected, just reparented - is already in the list to be unwrapped in its own turn.
 *
 * @param {Element} root The element to clean, usually a TD or the grid's root element.
 * @param {string} selector The anchor selector, e.g. `a.ht-link`.
 * @returns {number} The number of anchors removed.
 */
export function unwrapLinks(root: Element, selector: string): number {
  // A cell rendered as plain text has no element children at all, which is the overwhelmingly
  // common case and the one that must not pay for a selector query on every render pass.
  if (root.firstElementChild === null) {
    return 0;
  }

  const touchedParents = new Set<ParentNode>();
  let removed = 0;

  for (const link of Array.from(root.querySelectorAll(selector))) {
    // Defensive only: every anchor in the snapshot is expected to still be inside `root`, since an
    // unwrap only ever reparents a node, never detaches it. `root.contains()` rather than the DOM's
    // own `isConnected` - the latter answers "attached to a Document", which is false for a detached
    // `TD` under test and would make this branch true for anchors this function is meant to reach.
    // Guards against a future change to `unwrapLink` (or a selector matching something outside
    // `root`'s own subtree) silently operating on a node that has left `root`'s tree.
    if (!root.contains(link)) {
      continue;
    }

    const parent = unwrapLink(link);

    if (parent !== null) {
      touchedParents.add(parent);
    }

    removed += 1;
  }

  touchedParents.forEach(parent => parent.normalize());

  return removed;
}
