/**
 * The pure layout solver.
 *
 * `resolveLayout` turns a `LayoutInput` (plain numbers) into a frozen `LayoutSnapshot`. Its only real
 * work is the two-variable scrollbar fix-point: a vertical scrollbar consumes width, which can make a
 * horizontal one necessary, which consumes height, which can make the vertical one necessary. The
 * solve is monotone — a scrollbar only ever shrinks the box, never grows it — so a single corrective
 * pass after the first guess always converges. There is no loop and no DOM.
 */
import type { LayoutInput, LayoutSnapshot } from './layoutSnapshot';

/**
 * Decides the two scrollbars for a table that scrolls inside its own element.
 *
 * @param {LayoutInput} input The layout input.
 * @returns {{ hasVerticalScroll: boolean, hasHorizontalScroll: boolean }}
 */
function solveElementScrollbars(input: LayoutInput): {
  hasVerticalScroll: boolean;
  hasHorizontalScroll: boolean;
} {
  const {
    totalContentWidth: contentWidth,
    totalContentHeight: contentHeight,
    workspaceWidth,
    workspaceHeight,
    scrollbarSize,
  } = input;
  const forcedVertical = input.overflowY === 'scroll';
  const forcedHorizontal = input.overflowX === 'scroll';
  const suppressVertical = input.overflowY === 'hidden';
  const suppressHorizontal = input.overflowX === 'hidden';

  // First guess: does the content overflow the raw box on each axis?
  let hasVerticalScroll = forcedVertical || (!suppressVertical && contentHeight > workspaceHeight);
  const hasHorizontalScroll = forcedHorizontal || (!suppressHorizontal &&
    contentWidth > workspaceWidth - (hasVerticalScroll ? scrollbarSize : 0));

  // Corrective pass: a horizontal scrollbar we just decided on consumes height, which may now push
  // the content past the vertical box. This can only turn the vertical scrollbar on, never off (the
  // box only shrinks), so one pass is enough.
  if (hasHorizontalScroll && !hasVerticalScroll && !suppressVertical) {
    hasVerticalScroll = contentHeight > workspaceHeight - scrollbarSize;
  }

  return { hasVerticalScroll, hasHorizontalScroll };
}

/**
 * Decides the two scrollbars for a table that scrolls with the window. The scrollbars belong to the
 * document, so the solver predicts the document's post-render scroll size by swapping the table's
 * current hider extent for the extent it is about to take.
 *
 * @param {LayoutInput} input The layout input (must carry `windowContext`).
 * @returns {{ hasVerticalScroll: boolean, hasHorizontalScroll: boolean }}
 */
function solveWindowScrollbars(input: LayoutInput): {
  hasVerticalScroll: boolean;
  hasHorizontalScroll: boolean;
} {
  const context = input.windowContext;

  if (!context) {
    // No window metrics supplied — treat as no document scroll. This keeps the solver total; callers
    // in window mode always supply the context.
    return { hasVerticalScroll: false, hasHorizontalScroll: false };
  }

  const predictedScrollHeight = context.documentScrollHeight - context.currentHiderHeight +
    input.totalContentHeight;
  const predictedScrollWidth = context.documentScrollWidth - context.currentHiderWidth +
    input.totalContentWidth;

  const hasVerticalScroll = input.overflowY === 'scroll' ||
    (input.overflowY !== 'hidden' && predictedScrollHeight > context.documentClientHeight);
  const hasHorizontalScroll = input.overflowX === 'scroll' ||
    (input.overflowX !== 'hidden' && predictedScrollWidth > context.documentClientWidth);

  return { hasVerticalScroll, hasHorizontalScroll };
}

/**
 * Resolves a layout input into an immutable snapshot. Pure: same input, same output, no side effects.
 *
 * @param {LayoutInput} input The layout input.
 * @returns {LayoutSnapshot}
 */
export function resolveLayout(input: LayoutInput): LayoutSnapshot {
  const { hasVerticalScroll, hasHorizontalScroll } = input.scrollMode === 'window'
    ? solveWindowScrollbars(input)
    : solveElementScrollbars(input);

  const { workspaceWidth, workspaceHeight, scrollbarSize } = input;
  const innerWidth = workspaceWidth - (hasVerticalScroll ? scrollbarSize : 0);
  const innerHeight = workspaceHeight - (hasHorizontalScroll ? scrollbarSize : 0);
  // Render band = scrollbar-unaware (workspace − header, no scrollbar); visible band = scrollbar-aware
  // (inner − header). The two differ by exactly one scrollbar on the axis the opposite scrollbar eats.
  const renderViewportWidth = workspaceWidth - input.rowHeaderWidth;
  const renderViewportHeight = workspaceHeight - input.columnHeaderHeight;
  const visibleViewportWidth = innerWidth - input.rowHeaderWidth;
  const visibleViewportHeight = innerHeight - input.columnHeaderHeight;

  return Object.freeze({
    scrollMode: input.scrollMode,
    hasVerticalScroll,
    hasHorizontalScroll,
    workspaceWidth,
    workspaceHeight,
    innerWidth,
    innerHeight,
    viewportWidth: visibleViewportWidth,
    viewportHeight: visibleViewportHeight,
    renderViewportWidth,
    renderViewportHeight,
    visibleViewportWidth,
    visibleViewportHeight,
    rowHeaderWidth: input.rowHeaderWidth,
    columnHeaderHeight: input.columnHeaderHeight,
    totalContentWidth: input.totalContentWidth,
    totalContentHeight: input.totalContentHeight,
    hiderWidth: input.totalContentWidth,
    hiderHeight: input.totalContentHeight,
    scrollbarSize,
    isRtl: input.isRtl,
  });
}
