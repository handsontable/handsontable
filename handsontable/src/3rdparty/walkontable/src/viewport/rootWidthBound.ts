/**
 * How the grid's root element bounds the holder inside an ancestor that owns the horizontal axis,
 * when the host sized the grid as a plain block (`widthFollowsRoot`). Two widths are resolved here,
 * and they are kept apart on purpose.
 *
 * - The width the holder is USED at never passes the grid's own box: the holder carries
 *   `max-width: 100%` (`applyHolderWidthCap`), so `.ht_master` bounds it, and the columns follow
 *   through `boundWorkspaceWidth`. In a chain sized by its content, that percentage is cyclic, and
 *   the browser leaves it out of the chain's intrinsic width, so the cap never feeds back into the
 *   width it caps.
 * - The holder's PIXEL width is what the grid contributes to that intrinsic width. It decides how
 *   wide a chain sized by its content becomes, and whether a flex item or a grid track that does not
 *   shrink below its content is pushed past its share. `resolveHolderWidth` measures the room the
 *   element the root sits in has for it, instead of taking the owner's box.
 *
 * For a root instance, the element the root sits in is core's internal `.ht-grid-content`, and it
 * takes its width from the host's chain above `.ht-root-wrapper`. A chain "sized by its content"
 * below is that host chain: the grid mounted in an inline block, a float, or a flex item without
 * `flex-grow`.
 *
 * `MasterTable` sizes the holder with both, and `measureWorkspaceWidth` bounds the columns with the
 * first.
 */
import type { GeometryReader } from '../domMeasure/geometryReader';

/**
 * The style of the probe `measureAvailableWidths()` lays out in `.ht_master`: in the flow, so its
 * width counts, but with no height, so nothing below it moves, and with the font and wrapping pinned,
 * so a theme or a host rule cannot keep its words on one line.
 */
const PROBE_STYLE = [
  'display:block',
  'height:0',
  'margin:0',
  'padding:0',
  'border:0',
  'overflow:hidden',
  'visibility:hidden',
  'font:16px/1 sans-serif',
  'white-space:normal',
  'word-break:normal',
  'overflow-wrap:normal',
].join(';');

/**
 * The probe's text: short words, so its narrowest layout (a word per line) takes almost no width,
 * and many of them, so its widest layout (one line) is wider than any page.
 */
const PROBE_TEXT = 'x '.repeat(4096);

/**
 * One probe element per document, reused by every measurement.
 */
const probes = new WeakMap<Document, HTMLElement>();

/**
 * The room the probe finds for the grid.
 */
export interface AvailableWidths {
  /**
   * The content-box width of the element the grid's root sits in (`.ht-grid-content` for a root
   * instance).
   */
  container: number;
  /**
   * The owner's content-box width: what the grid may take inside the owner's padding.
   */
  ownerContent: number;
  /**
   * The owner's box, read like the holder width without a bound (the smaller of `offsetWidth` and
   * `scrollWidth`).
   */
  ownerBox: number;
}

/**
 * Returns the document's probe element, creating it on the first call.
 *
 * @param {Document} rootDocument The document the grid is rendered in.
 * @returns {HTMLElement}
 */
function getProbe(rootDocument: Document): HTMLElement {
  let probe = probes.get(rootDocument);

  if (!probe) {
    probe = rootDocument.createElement('div');
    probe.style.cssText = PROBE_STYLE;
    probe.textContent = PROBE_TEXT;
    probes.set(rootDocument, probe);
  }

  return probe;
}

/**
 * Reads an element's content-box width: its `clientWidth` without the inline padding.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} element The element to measure.
 * @returns {number}
 */
function contentBoxWidth(geometryReader: GeometryReader, element: HTMLElement): number {
  const style = geometryReader.getComputedStyle(element);
  const padding = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);

  return geometryReader.clientWidth(element) - padding;
}

/**
 * Sets or clears the cap that keeps the holder inside `.ht_master`. It is written only when it
 * changes, since the element and split modes ask on every full draw.
 *
 * @param {HTMLElement} holder The master holder.
 * @param {boolean} capped Whether the holder is capped at `.ht_master`'s width.
 */
export function applyHolderWidthCap(holder: HTMLElement, capped: boolean): void {
  const maxWidth = capped ? '100%' : '';

  if (holder.style.maxWidth !== maxWidth) {
    holder.style.maxWidth = maxWidth;
  }
}

/**
 * Bounds the workspace width the horizontal owner allows by the width the holder is used at, from
 * the layout around the grid alone, so the columns never wait for the holder of the draw before:
 *
 * - `.ht_master`'s width, which caps the holder (`applyHolderWidthCap`);
 * - the room inside the owner's padding, which `resolveHolderWidth` bounds the holder by, unless the
 *   root spills past the element it sits in on purpose (a `width` above 100%), where the holder may
 *   reach the owner's box.
 *
 * The owner's content box matters where the elements around the grid still hold the root wider than
 * that room: in a chain sized by its content, core's edge slots take the workspace width after each
 * render, so without it they would keep the root at the width the grid had before the owner shrank.
 * A width not laid out yet (a chain sized by its content before the grid's first draw) is no bound,
 * or the first frame would stretch the columns to nothing.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} wtRootElement The Walkontable root element (`.ht_master`).
 * @param {HTMLElement} owner The owner of the horizontal axis.
 * @param {HTMLElement} root The grid's root element (`resolveWidthBoundingRoot()`).
 * @param {number} width The workspace width the owner allows.
 * @returns {number}
 */
export function boundWorkspaceWidth(
  geometryReader: GeometryReader,
  wtRootElement: HTMLElement,
  owner: HTMLElement,
  root: HTMLElement,
  width: number,
): number {
  const gridWidth = geometryReader.clientWidth(wtRootElement);
  const container = root.parentElement;
  const spillsPastContainer = container !== null && gridWidth > contentBoxWidth(geometryReader, container);
  let bounded = width;

  if (!spillsPastContainer) {
    const ownerContent = contentBoxWidth(geometryReader, owner);

    if (ownerContent > 0) {
      bounded = Math.min(bounded, ownerContent);
    }
  }

  return gridWidth > 0 ? Math.min(bounded, gridWidth) : bounded;
}

/**
 * Measures how much room the element the grid's root sits in and the owner have for the grid. For
 * one read the holder takes no width, so the grid contributes nothing to the width of the elements
 * around it, and a probe that would take any width it gets takes its place in `.ht_master`: a long
 * run of short words, which can be as narrow as one word and as wide as all of them on one line.
 *
 * That element then shows the width the host's chain gives it, whatever sizes the chain. A chain
 * with a width of its own keeps it; a flex item or a grid track keeps its share, since the probe's
 * narrowest layout sits below any share; and a chain sized by its content (the grid mounted in an
 * inline block, a float, a flex item without `flex-grow`, a modal `<dialog>` with no width) grows to
 * the room around it, where it would otherwise stay at the width the grid gave it on the draw
 * before. That last case is why the probe exists: bounded by that element's current width, the grid
 * could shrink with the owner but never grow back. Core's edge slots, beside `.ht-grid` in the same
 * chain, still hold such a chain at their pixel width, which is why the owner is read under the
 * probe too, and bounds the answer.
 *
 * The probe grows or keeps the width of everything around the grid, so no scroll offset is clamped
 * while it lasts: the holder only loses its width, which widens its own scroll range, and nothing
 * changes height. Both styles are restored before anything else reads the layout, so no resize
 * observer sees the probe.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} wtRootElement The Walkontable root element (`.ht_master`).
 * @param {HTMLElement} holder The master holder.
 * @param {HTMLElement} owner The owner of the horizontal axis.
 * @param {HTMLElement} container The element the grid's root sits in (`.ht-grid-content` for a root
 * instance).
 * @returns {AvailableWidths}
 */
export function measureAvailableWidths(
  geometryReader: GeometryReader,
  wtRootElement: HTMLElement,
  holder: HTMLElement,
  owner: HTMLElement,
  container: HTMLElement,
): AvailableWidths {
  const probe = getProbe(wtRootElement.ownerDocument);
  const holderStyle = holder.style;
  const holderWidth = holderStyle.width;

  holderStyle.width = '0px';
  wtRootElement.appendChild(probe);

  try {
    return {
      container: contentBoxWidth(geometryReader, container),
      ownerContent: contentBoxWidth(geometryReader, owner),
      ownerBox: Math.min(geometryReader.offsetWidth(owner), geometryReader.scrollWidth(owner)),
    };

  } finally {
    probe.remove();
    holderStyle.width = holderWidth;
  }
}

/**
 * Resolves the holder's pixel width inside an owner of the horizontal axis that may be wider than
 * the grid: the room the element the root sits in has (`measureAvailableWidths`), no more than the
 * owner's content box. A root wider than that element (a `width` above 100%) spills over it on
 * purpose, so the holder then fills the root, as far as the owner's box reaches.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} wtRootElement The Walkontable root element (`.ht_master`).
 * @param {HTMLElement} holder The master holder.
 * @param {HTMLElement} owner The owner of the horizontal axis.
 * @param {HTMLElement} root The grid's root element (`resolveWidthBoundingRoot()`).
 * @returns {number | null} `null` for a root that sits in no element: the owner's box stands.
 */
export function resolveHolderWidth(
  geometryReader: GeometryReader,
  wtRootElement: HTMLElement,
  holder: HTMLElement,
  owner: HTMLElement,
  root: HTMLElement,
): number | null {
  const container = root.parentElement;

  if (container === null) {
    return null;
  }

  const rootWidth = geometryReader.clientWidth(root);
  const available = measureAvailableWidths(geometryReader, wtRootElement, holder, owner, container);

  if (rootWidth > available.container) {
    return Math.floor(Math.min(available.ownerBox, rootWidth));
  }

  return Math.floor(Math.min(available.ownerContent, available.container));
}
