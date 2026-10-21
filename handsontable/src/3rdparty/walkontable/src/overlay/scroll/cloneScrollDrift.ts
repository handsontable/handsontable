import { clamp } from '../../../../../helpers/number';

/**
 * The scroll offset the engine last wrote to a clone holder, per axis.
 */
export interface CloneScrollTarget {
  top: number;
  left: number;
}

/**
 * A clone holder's current scroll offset, per axis.
 */
export interface ScrollOffset {
  top: number;
  left: number;
}

/**
 * How far a clone holder can scroll on each axis right now (`scrollHeight - clientHeight` and the
 * horizontal counterpart), never negative.
 */
export interface ScrollRange {
  maxTop: number;
  maxLeft: number;
}

/**
 * The outcome of `measureCloneScrollDrift`: the offset the holder should hold, and how far it is
 * from it. A drift of `0` on both axes means the holder sits where the engine left it.
 */
export interface CloneScrollDrift {
  expectedTop: number;
  expectedLeft: number;
  driftTop: number;
  driftLeft: number;
}

/**
 * Treats a difference under one pixel as none: a zoomed page stores a fractional offset for an
 * integer write, and that rounding is not a scroll.
 *
 * @param {number} difference The difference between two scroll offsets.
 * @returns {number}
 */
function dropSubpixelDifference(difference: number): number {
  return Math.abs(difference) < 1 ? 0 : difference;
}

/**
 * Whether a holder sits where the engine left it, by the same sub-pixel rule the drift measure uses.
 *
 * The listener asks this before it measures the holder's scroll range, so the engine's own writes -
 * three per scroll frame - cost no layout read. It compares against the ledger and never against the
 * previous offset, so a run of sub-pixel user scrolls cannot creep past the tolerance one step at a
 * time.
 *
 * @param {ScrollOffset} current The holder's current `scrollTop`/`scrollLeft`.
 * @param {CloneScrollTarget} target The offset the engine last wrote to the holder.
 * @returns {boolean}
 */
export function matchesCloneScrollTarget(current: ScrollOffset, target: CloneScrollTarget): boolean {
  return dropSubpixelDifference(current.top - target.top) === 0 &&
    dropSubpixelDifference(current.left - target.left) === 0;
}

/**
 * Measures how far a clone holder sits from the offset the engine last wrote to it.
 *
 * The frozen overlays' clone holders are composited scroll containers (see the clone-holder rule in
 * `src/styles/base/_base.scss`), so a user can scroll one directly - a touch pan over a frozen
 * header, a wheel the engine did not cancel - and the browser moves it on the compositor before any
 * script runs. The engine's own writes are the reference. The target is clamped to the range the
 * holder has NOW, because the browser clamped the write the same way (an offset past the range lands
 * on its end), so a clamped write reads as no drift. The horizontal range is taken symmetric around
 * zero: an RTL holder scrolls into negative `scrollLeft`.
 *
 * @param {ScrollOffset} current The holder's current `scrollTop`/`scrollLeft`.
 * @param {ScrollRange} range The holder's current scroll range per axis.
 * @param {CloneScrollTarget} target The offset the engine last wrote to the holder.
 * @returns {CloneScrollDrift}
 */
export function measureCloneScrollDrift(
  current: ScrollOffset,
  range: ScrollRange,
  target: CloneScrollTarget,
): CloneScrollDrift {
  const maxTop = Math.max(0, range.maxTop);
  const maxLeft = Math.max(0, range.maxLeft);
  const expectedTop = clamp(target.top, 0, maxTop);
  const expectedLeft = clamp(target.left, -maxLeft, maxLeft);

  return {
    expectedTop,
    expectedLeft,
    driftTop: dropSubpixelDifference(current.top - expectedTop),
    driftLeft: dropSubpixelDifference(current.left - expectedLeft),
  };
}
