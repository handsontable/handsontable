/**
 * @typedef {'top'|'bottom'|'inline_start'|'top_inline_start_corner'|'bottom_inline_start_corner'} CLONE_TYPES_ENUM
 */
export const CLONE_TOP = 'top';
export const CLONE_BOTTOM = 'bottom';
export const CLONE_INLINE_START = 'inline_start';
export const CLONE_TOP_INLINE_START_CORNER = 'top_inline_start_corner';
export const CLONE_BOTTOM_INLINE_START_CORNER = 'bottom_inline_start_corner';
export const CLONE_TYPES = [
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_INLINE_START,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
];

/**
 * Strip, in CSS pixels, kept clear along the bottom edge so an overlay ("floating") horizontal
 * scrollbar stays visible and grabbable instead of being covered by the frozen-column overlay
 * (#10370). Such a scrollbar takes no layout space, so it measures 0 and its real thickness cannot be
 * read from the DOM.
 *
 * This is a clearance, not a measured thickness, and it degrades gracefully both ways: where the
 * scrollbar is thicker its top few pixels stay covered while this strip remains grabbable; where it is
 * thinner the extra clearance only costs the strip itself.
 *
 * 12 is Gecko's own `kDefaultWinOverlayScrollbarSize` (`widget/ScrollbarDrawingWin11.cpp`). Measured
 * grabbable thickness elsewhere: 16 on macOS, 13 at 1.25x zoom. GTK takes its size from the active
 * theme, so no single value can be exact everywhere.
 */
export const OVERLAY_SCROLLBAR_CLEARANCE = 12;

export const CLONE_CLASS_NAMES = new Map([
  [CLONE_TOP, `ht_clone_${CLONE_TOP}`],
  [CLONE_BOTTOM, `ht_clone_${CLONE_BOTTOM}`],
  [CLONE_INLINE_START, `ht_clone_${CLONE_INLINE_START} ht_clone_left`],
  [CLONE_TOP_INLINE_START_CORNER, `ht_clone_${CLONE_TOP_INLINE_START_CORNER} ht_clone_top_left_corner`],
  [CLONE_BOTTOM_INLINE_START_CORNER, `ht_clone_${CLONE_BOTTOM_INLINE_START_CORNER} ht_clone_bottom_left_corner`],
]);
