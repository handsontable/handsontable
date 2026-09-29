/**
 * How the grid's root element bounds the holder width inside an ancestor that owns the horizontal
 * axis. `MasterTable` bounds the holder with it and `measureWorkspaceWidth` the columns, so the two
 * resolve the same answer from the same reads.
 */
import type { GeometryReader } from '../domMeasure/geometryReader';

/**
 * How far past its container's box the probe in `containerFollowsContent()` pushes `.ht_master`.
 * Any amount above a pixel would do; a few more keep the answer clear of rounded fractional widths.
 */
const CONTAINER_PROBE_PX = 16;

/**
 * The answer `containerFollowsContent()` gave for a grid root, and the widths it was taken at. The
 * probe writes a style, so it is not repeated while those widths stay the same.
 */
interface ContainerProbeRecord {
  /**
   * The root's `clientWidth` when the probe ran.
   */
  rootWidth: number;
  /**
   * The container's `clientWidth` when the probe ran.
   */
  containerWidth: number;
  /**
   * The holder's inline pixel width when the probe ran.
   */
  holderWidth: number;
  /**
   * Whether the container grew with the probe, so its width follows the grid's content.
   */
  followsContent: boolean;
}

/**
 * The last probe record per grid root element.
 */
const containerProbeRecords = new WeakMap<HTMLElement, ContainerProbeRecord>();

/**
 * The widths the grid's root element allows the holder, resolved by `resolveRootWidthBound()`.
 */
export interface RootWidthBound {
  /**
   * The `clientWidth` of the element the root sits in. It always bounds the holder.
   */
  containerWidth: number;
  /**
   * Whether the root's own width bounds the holder as well: the root is narrower than its container,
   * and the container does not follow the grid's content.
   */
  boundedByRoot: boolean;
}

/**
 * Reads the pixel width the engine last wrote on the holder, or `null` while it has none.
 *
 * @param {HTMLElement} holder The master holder.
 * @returns {number | null}
 */
function readHolderPixelWidth(holder: HTMLElement): number | null {
  const { width } = holder.style;

  return width.endsWith('px') ? Number.parseFloat(width) : null;
}

/**
 * Tells whether the element the grid root sits in follows the grid's content: an inline block, a
 * float, a flex item without `flex-grow`, a fit-content box. `.ht_master` is pushed past the
 * container's box for one read. A container whose width is its own keeps it, and a content-sized one
 * grows. A container with a content-based minimum width (a `flex: 1` item without `min-width: 0`, a
 * `1fr` grid track, an auto table cell) grows too, so the answer is conservative for it; the caller
 * only asks when the container is exactly as wide as the grid itself.
 *
 * Growing it is the only probe that can tell: core writes the workspace width onto the edge slots in
 * pixels after every render, and those in-flow siblings hold a content-sized container at its old
 * width, so collapsing `.ht_master` instead reads "unchanged" either way. The push resizes neither
 * the holder nor anything inside it, so no height changes inside the grid and no scroll offset moves
 * (the ranges of the ancestors only grow while it lasts), and the style is restored before anything
 * else reads the layout.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} wtRootElement The Walkontable root element (`.ht_master`).
 * @param {HTMLElement} root The grid's root element.
 * @param {HTMLElement} container The element the root sits in.
 * @param {ContainerProbeRecord} widths The root, container and holder widths the answer is for.
 * @returns {boolean}
 */
function containerFollowsContent(
  geometryReader: GeometryReader,
  wtRootElement: HTMLElement,
  root: HTMLElement,
  container: HTMLElement,
  widths: Omit<ContainerProbeRecord, 'followsContent'>,
): boolean {
  const record = containerProbeRecords.get(root);

  if (
    record &&
    record.rootWidth === widths.rootWidth &&
    record.containerWidth === widths.containerWidth &&
    record.holderWidth === widths.holderWidth
  ) {
    return record.followsContent;
  }

  const masterStyle = wtRootElement.style;
  const inlineMinWidth = masterStyle.minWidth;

  masterStyle.minWidth = `${widths.containerWidth + CONTAINER_PROBE_PX}px`;

  const followsContent = geometryReader.clientWidth(container) !== widths.containerWidth;

  masterStyle.minWidth = inlineMinWidth;
  containerProbeRecords.set(root, { ...widths, followsContent });

  return followsContent;
}

/**
 * Resolves how the grid's root element bounds the holder width inside an ancestor that owns the
 * horizontal axis (the root comes from `resolveWidthBoundingRoot()`).
 *
 * The element the root sits in always bounds the holder, and it is a safe bound: when that element
 * is sized by its content, it is as wide as the holder or the host's bars, so bounding by it can keep
 * a width but never shrink one. The root's own width is a bound too when it is narrower than its
 * container (a relative `width` under 100%, a margin), but not while the container follows the grid's
 * content. In a content-sized chain a relative width is a fraction of the grid's own width, so
 * bounding the holder by it shrinks the container, which shrinks the root again, on every draw: a
 * `'90%'` grid decayed to a few pixels, and a `'calc(100% - 20px)'` one redrew forever.
 *
 * Only the grid can hold a container that follows it down, through its holder or through the host's
 * edge slots, which take the workspace width, and such a container is then exactly as wide as the
 * holder. A container of any other width is held by something that does not follow the grid (a flex
 * share, a grid track, a table), so the root bounds the holder without a probe. A container as wide
 * as the holder is probed by `containerFollowsContent()`.
 *
 * A container with no width yet (a chain sized by its content, before the first draw) is no bound:
 * the owner's width stands, and the chain follows the holder from there.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} wtRootElement The Walkontable root element (`.ht_master`).
 * @param {HTMLElement} holder The master holder, whose last pixel width tells whether the grid may be
 * holding its root's container.
 * @param {HTMLElement} root The grid's root element.
 * @returns {RootWidthBound | null} `null` when the root has no container, or the container no width.
 */
export function resolveRootWidthBound(
  geometryReader: GeometryReader,
  wtRootElement: HTMLElement,
  holder: HTMLElement,
  root: HTMLElement,
): RootWidthBound | null {
  const container = root.parentElement;
  const containerWidth = container ? geometryReader.clientWidth(container) : 0;

  if (container === null || containerWidth <= 0) {
    return null;
  }

  const rootWidth = geometryReader.clientWidth(root);

  if (rootWidth >= containerWidth) {
    return { containerWidth, boundedByRoot: false };
  }

  const holderWidth = readHolderPixelWidth(holder);

  if (holderWidth === null || Math.abs(containerWidth - holderWidth) > 1) {
    return { containerWidth, boundedByRoot: true };
  }

  return {
    containerWidth,
    boundedByRoot: !containerFollowsContent(geometryReader, wtRootElement, root, container, {
      rootWidth,
      containerWidth,
      holderWidth,
    }),
  };
}
