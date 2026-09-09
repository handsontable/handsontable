/**
 * Class every anchor the grid itself renders into a data cell carries. It is the opt-in marker for
 * the link styles (the base stylesheet deliberately leaves user-rendered anchors alone, #4363), the
 * selector the Alt+Enter command reads, and the selector that lets one feature clear another
 * feature's anchor before wrapping the same cell.
 */
export const LINK_CLASS_NAME = 'ht-link';

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
  let link = root.querySelector(selector);

  while (link !== null) {
    const parent = unwrapLink(link);

    if (parent !== null) {
      touchedParents.add(parent);
    }

    removed += 1;
    link = root.querySelector(selector);
  }

  touchedParents.forEach(parent => parent.normalize());

  return removed;
}
