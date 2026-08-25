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
 * Band, in CSS pixels, kept clear along an edge so an overlay ("floating") scrollbar stays visible and
 * grabbable instead of being covered by a frozen overlay (#10370). Such a scrollbar takes no layout
 * space, so it measures 0 and its real thickness cannot be read from the DOM - this has to be a
 * constant, and it is sized for the widest state the scrollbar can reach.
 *
 * It is deliberately generous, because the two directions are not symmetrical: too small and the
 * scrollbar is partly covered again, which is the whole defect; too large only costs a slightly taller
 * band. Measured on macOS with the pointer on the scrollbar, which is its widest state: the painted
 * widget is 7px idle and 11px hovered in both Chrome and Firefox, while the *interactive* reach probed
 * by dragging is 16px. 16 therefore covers every state measured.
 *
 * One published number, for reference only: Gecko's Windows 11 default
 * (`kDefaultWinOverlayScrollbarSize`, `widget/ScrollbarDrawingWin11.cpp`) is 12. It is quoted because
 * it is written down, not because this is a Gecko concern - every engine that floats its scrollbars
 * needs the same clearance, each with its own thickness, and GTK takes its size from the active theme.
 * No single value is exact everywhere, so over-reserving is the safe direction.
 */
export const OVERLAY_SCROLLBAR_CLEARANCE = 16;

/**
 * How close, in CSS pixels, the pointer has to come to the scrollport's edge before the clearance strip
 * opens. Roughly the reach at which a browser brings its own overlay scrollbar back on screen, plus
 * enough margin that the strip is already open by the time the pointer arrives at the thumb.
 */
export const OVERLAY_SCROLLBAR_PROXIMITY = 26;

/**
 * How long a band stays open, in milliseconds, after the last scroll - with the pointer away from the
 * scrollbar, which is the only case this timer governs (a pointer near the scrollbar pins the band open
 * for as long as it stays there, the same as the browser keeps the thumb up).
 *
 * Sized to *outlast* the thumb it belongs to, with room to spare. Measured in the grid with the pointer
 * parked away, the thumb was gone somewhere between ~650ms and ~960ms across runs - the spread is the
 * measurement's own latency, so the number here covers the whole range rather than the middle of it.
 * Undershooting is the visible defect: the track is pulled out from under a scrollbar still on screen.
 * Overshooting only leaves the track up a little longer than the thumb, which reads as ordinary.
 */
export const OVERLAY_SCROLLBAR_FADE_DELAY = 1000;

/**
 * Marks an overlay root as leaving a scrollbar clearance strip (#10370).
 */
export const OVERLAY_SCROLLBAR_CLEARANCE_CLASS = 'htOverlayScrollbarClearance';

/**
 * Sticky, zero-size box holding the clearance fillers. It must be the master holder's **first** child:
 * a sticky box only shifts toward its own edge, so one placed after the table cannot be pulled back up
 * into the scrollport and would trail below it (measured).
 */
export const OVERLAY_SCROLLBAR_FILLER_HOST_CLASS = 'htScrollbarClearanceFillers';

/**
 * One opaque patch covering the strip an overlay vacated, so the master's scrolled cells cannot show
 * through it. Lives inside the master holder, because a browser paints a scroll container's own
 * scrollbar above that container's contents - measured in Chrome and Firefox alike - so a patch placed
 * above the holder instead would hide the scrollbar thumb (measured: 0 thumb pixels).
 */
export const OVERLAY_SCROLLBAR_FILLER_CLASS = 'htScrollbarClearanceFiller';

/**
 * Stamped on the band host while the scrollbar is on screen. Kept separate from the sizing, so the
 * bands can be positioned before anything is shown. Deliberately not a transition - see the stylesheet:
 * the band is drawn under the clones, so any partial opacity is a visible defect at one end or the
 * other.
 */
export const OVERLAY_SCROLLBAR_FILLER_OPEN_CLASS = 'htScrollbarClearanceFillersOpen';

export const CLONE_CLASS_NAMES = new Map([
  [CLONE_TOP, `ht_clone_${CLONE_TOP}`],
  [CLONE_BOTTOM, `ht_clone_${CLONE_BOTTOM}`],
  [CLONE_INLINE_START, `ht_clone_${CLONE_INLINE_START} ht_clone_left`],
  [CLONE_TOP_INLINE_START_CORNER, `ht_clone_${CLONE_TOP_INLINE_START_CORNER} ht_clone_top_left_corner`],
  [CLONE_BOTTOM_INLINE_START_CORNER, `ht_clone_${CLONE_BOTTOM_INLINE_START_CORNER} ht_clone_bottom_left_corner`],
]);
