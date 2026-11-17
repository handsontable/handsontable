/**
 * @typedef {'top'|'bottom'|'inline_start'|'inline_end'|'top_inline_start_corner'|'bottom_inline_start_corner'|
 * 'top_inline_end_corner'|'bottom_inline_end_corner'} CLONE_TYPES_ENUM
 */
export const CLONE_TOP = 'top';
export const CLONE_BOTTOM = 'bottom';
export const CLONE_INLINE_START = 'inline_start';
export const CLONE_INLINE_END = 'inline_end';
export const CLONE_TOP_INLINE_START_CORNER = 'top_inline_start_corner';
export const CLONE_BOTTOM_INLINE_START_CORNER = 'bottom_inline_start_corner';
export const CLONE_TOP_INLINE_END_CORNER = 'top_inline_end_corner';
export const CLONE_BOTTOM_INLINE_END_CORNER = 'bottom_inline_end_corner';
export const CLONE_TYPES = [
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_INLINE_START,
  CLONE_INLINE_END,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_END_CORNER,
];

/**
 * The clones that render the last columns of the grid (`fixedColumnsEnd`). They draw no row headers:
 * row headers belong to the inline-start clone only.
 */
export const INLINE_END_CLONE_TYPES = [
  CLONE_INLINE_END,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_END_CORNER,
];

/**
 * The clones that render the first rows of the grid (`fixedRowsTop`). Their rendered rows count comes from
 * the live `totalRows` and `fixedRowsTop` settings (`stickyRowsTop`), not from the last draw.
 */
export const TOP_CLONE_TYPES = [
  CLONE_TOP,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_TOP_INLINE_END_CORNER,
];

/**
 * The clones that render the last rows of the grid (`fixedRowsBottom`). Their rendered band comes from
 * the live `totalRows` and `fixedRowsBottom` settings, not from the last draw (`stickyRowsBottom`).
 */
export const BOTTOM_CLONE_TYPES = [
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_END_CORNER,
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
 * How close, in CSS pixels, the pointer has to rest to the scrollport's edge to hold an open band open.
 * It equals `OVERLAY_SCROLLBAR_CLEARANCE`, so only a pointer over the band holds it. On macOS, with
 * Chromium's Fluent overlay scrollbars and in Gecko that is where the browser keeps a hovered thumb up
 * (the 16px interactive reach measured for that constant). A plain literal, because the visual-tests
 * fixture mirrors it (`visual-tests/src/test-runner.ts`).
 *
 * A wider reach (it was 26) pinned the band from the part of the last column that is still visible
 * beside it. A pin has no timer, so the last 16px of a `fixedColumnsEnd` column – the cell text, the
 * selection's outer edge, and the fill handle – stayed cut for as long as the pointer rested on the
 * cell, with no thumb on screen (DEV-3975).
 *
 * Known limit: Chromium's other overlay scrollbars (ChromeOS, Linux with the overlay scrollbar flag) keep
 * the thumb up from further away. `cc/input/single_scrollbar_animation_controller_thinning.cc` expands
 * the thumb within 25px of it and fades it in within 30px of the scrollbar; both distances are 0 for
 * Fluent. A pointer resting 17 to 30px from the edge there keeps a thumb on screen after the band closed,
 * and a frozen overlay covers it again (#10370). That is the price of a whole last column. Read from the
 * Chromium source, not measured on such a device.
 */
export const OVERLAY_SCROLLBAR_PROXIMITY = 16;

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
 * An empty scroll container that shows the grid's classic scrollbar along the scrolling part of an edge
 * only - below the column headers and frozen top rows, after the row headers and frozen start columns.
 * It sits in the gutter the master holder reserves and covers the holder's own scrollbar there.
 */
export const SCROLLBAR_PROXY_CLASS = 'htScrollbarProxy';

/**
 * Covers the part of a gutter beside a frozen band (or the headers), where the scrollbar no longer runs.
 */
export const SCROLLBAR_PROXY_FILLER_CLASS = 'htScrollbarProxyFiller';

/**
 * The grid's frame, redrawn over the gutters of its classic scrollbars, which the browser paints above
 * the frame the holder draws itself.
 */
export const SCROLLBAR_FRAME_CLASS = 'htScrollbarFrame';

/**
 * The square where the two classic gutters meet, in the track color. Safari paints that corner itself,
 * in white, once `scrollbar-color` applies (it then ignores `::-webkit-scrollbar-corner`).
 */
export const SCROLLBAR_CORNER_CLASS = 'htScrollbarCorner';

/**
 * How many `ResizeObserver` deliveries in direct succession make the callback a self-sustaining loop
 * rather than a burst of real resizes. A parent sized in dynamic units (`dvh`) can be re-sized by the
 * very refresh the previous delivery triggered, and that cycle never ends on its own (#11021).
 *
 * The number is counted in DELIVERY CYCLES, not in wall-clock time. An observer delivers at most once
 * per rendering frame, so a self-sustaining loop occupies every frame whatever the machine is doing:
 * load changes how long 300 takes to arrive, never whether it arrives. The count it replaced was reset
 * after 100 ms of wall-clock quiet, which under CPU contention (frames stretched past 100 ms) reset
 * before the threshold on every single loop - the guard was disabled in exactly the machine state it
 * exists for (DEV-2740).
 *
 * 300 is kept from the shipped guard, where it was raised from 100 (#11612) because a legitimate
 * resize stream reached the lower value.
 */
export const RESIZE_LOOP_GUARD_THRESHOLD = 300;

/**
 * How long the loop guard leaves the observer disconnected before observing again, in milliseconds.
 *
 * The disconnect used to be permanent, which killed container-resize reactivity for the grid's whole
 * lifetime once the guard fired - and the guard can fire on a legitimate stream too, since a gap-free
 * multi-second drag of a splitter around the grid also occupies every frame. Reconnecting turns that
 * permanent kill into a duty cycle: a grid whose stream was legitimate resumes reacting, while a page
 * with a real loop is throttled instead of frozen.
 *
 * Two seconds, so a test that samples the callback count after the warning has a wide margin to read a
 * frozen count in. `setTimeout` under load fires late, never early, so load only widens that window.
 */
export const RESIZE_LOOP_GUARD_RECONNECT_DELAY = 2000;

/**
 * The ceiling for the reconnect delay, in milliseconds. Each trip that is not separated from the last
 * one by a quiet frame doubles the delay, so a page whose loop never goes away backs off toward one
 * burst per 30 seconds instead of running continuously. A single quiet frame returns the delay to
 * `RESIZE_LOOP_GUARD_RECONNECT_DELAY` - a grid that proved itself quiet must not inherit the backoff.
 */
export const RESIZE_LOOP_GUARD_RECONNECT_MAX_DELAY = 30000;

/**
 * The class name of the box that carries a clone the browser pins (`overlay/overlayRail.ts`).
 * Declared here, not in the rail module, so `helpers/dom/element.ts` can read it without an import
 * cycle – the rail imports its focus helpers from there.
 */
export const OVERLAY_RAIL_CLASS_NAME = 'htOverlayRail';

/**
 * The state class the three inline-end clone roots carry while the freeze line at their inline-start edge
 * is drawn by the row header (the end band covers every column). Without it the clone's own first cell
 * draws the line. See `Overlays#syncInlineEndFreezeLine`.
 */
export const INLINE_END_FREEZE_LINE_SHARED_CLASS = 'htFreezeLineShared';

export const CLONE_CLASS_NAMES = new Map([
  [CLONE_TOP, `ht_clone_${CLONE_TOP}`],
  [CLONE_BOTTOM, `ht_clone_${CLONE_BOTTOM}`],
  [CLONE_INLINE_START, `ht_clone_${CLONE_INLINE_START} ht_clone_left`],
  [CLONE_TOP_INLINE_START_CORNER, `ht_clone_${CLONE_TOP_INLINE_START_CORNER} ht_clone_top_left_corner`],
  [CLONE_BOTTOM_INLINE_START_CORNER, `ht_clone_${CLONE_BOTTOM_INLINE_START_CORNER} ht_clone_bottom_left_corner`],
  [CLONE_INLINE_END, `ht_clone_${CLONE_INLINE_END}`],
  [CLONE_TOP_INLINE_END_CORNER, `ht_clone_${CLONE_TOP_INLINE_END_CORNER}`],
  [CLONE_BOTTOM_INLINE_END_CORNER, `ht_clone_${CLONE_BOTTOM_INLINE_END_CORNER}`],
]);
