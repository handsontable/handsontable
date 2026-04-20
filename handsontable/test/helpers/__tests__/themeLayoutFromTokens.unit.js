import { mainTheme } from '../../../src/themes/theme';
import * as themeModules from '../../../src/themes/theme';
import sizing from '../../../src/themes/static/variables/sizing';
import density from '../../../src/themes/static/variables/density';
import { E2E_REGISTERED_THEME_KEYS } from '../themeLayoutCore';
import { themeLayoutFromTokens } from '../themeLayoutFromTokens';

const ALL_THEMES = Object.values(themeModules).filter(m => m && m.name);

describe('themeLayoutFromTokens reads from src/themes/theme modules', () => {
  it('E2E_REGISTERED_THEME_KEYS contains all theme modules from src/themes/theme/index.js', () => {
    const expected = ALL_THEMES.map(m => m.name);

    expect(E2E_REGISTERED_THEME_KEYS).toEqual(expect.arrayContaining(expected));
    expect(E2E_REGISTERED_THEME_KEYS.length).toBeGreaterThanOrEqual(expected.length);
  });

  ALL_THEMES.forEach((theme) => {
    describe(`theme "${theme.name}" (density: ${theme.density})`, () => {
      let layout;

      beforeEach(() => {
        layout = themeLayoutFromTokens(theme.name);
      });

      it('densityLevel is read from the theme module', () => {
        expect(layout.densityLevel).toBe(theme.density);
      });

      it('lineHeight is parsed from the theme module tokens', () => {
        expect(layout.lineHeight).toBe(parseInt(theme.tokens.lineHeight, 10));
      });

      it('cellVerticalPadding is resolved from density[theme.density].cellVertical', () => {
        const key = density[theme.density].cellVertical.replace('sizing.', '');

        expect(layout.cellVerticalPadding).toBe(parseInt(sizing[key], 10));
      });

      it('cellHorizontalPadding is resolved from density[theme.density].cellHorizontal', () => {
        const key = density[theme.density].cellHorizontal.replace('sizing.', '');

        expect(layout.cellHorizontalPadding).toBe(parseInt(sizing[key], 10));
      });

      it('cellContentHeight == lineHeight + 2 * cellVerticalPadding', () => {
        expect(layout.cellContentHeight)
          .toBe(layout.lineHeight + (2 * layout.cellVerticalPadding));
      });

      it('defaultDataRowHeight == cellContentHeight + cellBorderWidth', () => {
        expect(layout.defaultDataRowHeight)
          .toBe(layout.cellContentHeight + layout.cellBorderWidth);
      });

      it('defaultColumnHeaderHeight == cellContentHeight', () => {
        expect(layout.defaultColumnHeaderHeight).toBe(layout.cellContentHeight);
      });

      it('firstRenderedRowDefaultHeight == defaultDataRowHeight + cellBorderWidth', () => {
        expect(layout.firstRenderedRowDefaultHeight)
          .toBe(layout.defaultDataRowHeight + layout.cellBorderWidth);
      });

      it('overlayHeight({ rows: 0 }) == 0', () => {
        // Edge case: special-cased in the implementation (not a formula result).
        expect(layout.overlayHeight({ rows: 0 })).toBe(0);
      });

      it('defaultColumnWidth is the Walkontable constant 50', () => {
        expect(layout.defaultColumnWidth).toBe(50);
      });

      it('defaultRowHeaderWidth is the Walkontable constant 50', () => {
        expect(layout.defaultRowHeaderWidth).toBe(50);
      });
    });
  });
});

describe('themeLayoutFromTokens E2E helpers are token-derived', () => {
  ALL_THEMES.forEach((theme) => {
    describe(`helpers for "${theme.name}"`, () => {
      let l;

      beforeEach(() => {
        l = themeLayoutFromTokens(theme.name);
      });

      it('e2eGcrEditedCellOuterHeight == cellContentHeight + 2 * cellBorderWidth', () => {
        expect(l.e2eGcrEditedCellOuterHeight())
          .toBe(l.cellContentHeight + (2 * l.cellBorderWidth));
      });

      it('e2eManualRowResizerPositionFixedTopMasterFourthRow matches formula', () => {
        expect(l.e2eManualRowResizerPositionFixedTopMasterFourthRow())
          .toEqual({ top: l.defaultColumnHeaderHeight + (4 * l.cellContentHeight), left: 0 });
      });

      it('e2eManualRowResizerPositionFixedBottomOverlayFirstRow matches formula', () => {
        expect(l.e2eManualRowResizerPositionFixedBottomOverlayFirstRow())
          .toEqual({ top: l.defaultDataRowHeight - 5, left: 0 });
      });

      it('e2eTextEditorTextareaHeightSingleLinePx matches formula', () => {
        expect(l.e2eTextEditorTextareaHeightSingleLinePx())
          .toBe(`${l.firstRenderedRowDefaultHeight}px`);
      });

      it('e2eTextEditorTextareaParentTopPx matches formula', () => {
        expect(l.e2eTextEditorTextareaParentTopPx())
          .toBe(`${l.defaultDataRowHeight}px`);
      });

      it('e2eTextEditorTextareaHeightThreeLinesPx matches formula', () => {
        expect(l.e2eTextEditorTextareaHeightThreeLinesPx())
          .toBe(`${(3 * l.lineHeight) + (2 * l.cellVerticalPadding) + (2 * l.cellBorderWidth)}px`);
      });

      it('e2eMergeCellsBorderTopAfterScroll(x) == x + defaultDataRowHeight', () => {
        expect(l.e2eMergeCellsBorderTopAfterScroll(100))
          .toBe(100 + l.defaultDataRowHeight);
      });

      it('e2eMergeCellsOpenEditorWideMergeTextareaParentOffset matches formula', () => {
        expect(l.e2eMergeCellsOpenEditorWideMergeTextareaParentOffset())
          .toEqual({ top: 2 * l.defaultDataRowHeight, left: l.defaultRowHeaderWidth });
      });

      it('e2eCommentTextareaStyleWithSize(w,h) matches formula', () => {
        const r = l.e2eCommentTextareaStyleWithSize(100, 50);

        expect(r.width).toBe(100 + (2 * l.cellHorizontalPadding) + (2 * l.cellBorderWidth));
        expect(r.height).toBe(50 + (2 * l.cellVerticalPadding) + (2 * l.cellBorderWidth));
      });

      // Density helpers (bucket A)
      it('e2eDensity_0051ca7391 == overlayHeight({rows:3}) + 2 * lineHeight', () => {
        expect(l.e2eDensity_0051ca7391())
          .toBe(l.overlayHeight({ rows: 3 }) + (2 * l.lineHeight));
      });

      it('e2eDensity_8992c845e6 == overlayHeight({rows:5})', () => {
        expect(l.e2eDensity_8992c845e6()).toBe(l.overlayHeight({ rows: 5 }));
      });

      it('e2eDensity_f2d3fe1fc0 == firstRenderedRowDefaultHeight + 4 * defaultDataRowHeight', () => {
        expect(l.e2eDensity_f2d3fe1fc0())
          .toBe(l.firstRenderedRowDefaultHeight + (4 * l.defaultDataRowHeight));
      });

      it('e2eDensity_f464e90e18 == 2 * defaultDataRowHeight', () => {
        expect(l.e2eDensity_f464e90e18()).toBe(2 * l.defaultDataRowHeight);
      });

      it('e2eDensity_9639197594 == 2 * defaultDataRowHeight + cellBorderWidth', () => {
        expect(l.e2eDensity_9639197594()).toBe((2 * l.defaultDataRowHeight) + l.cellBorderWidth);
      });

      it('e2eDensity_9a971c3cfe == overlayHeight({rows:3})', () => {
        expect(l.e2eDensity_9a971c3cfe()).toBe(l.overlayHeight({ rows: 3 }));
      });

      // GCR helpers
      it('e2eGcr_8b522d5d5b returns pure primitive formula', () => {
        const r = l.e2eGcr_8b522d5d5b();
        const colOuter = l.defaultColumnWidth + l.cellBorderWidth;

        expect(r.start).toBe(234);
        expect(r.top).toBe(l.defaultDataRowHeight);
        expect(r.width).toBe(colOuter);
        expect(r.maxWidth).toBe(colOuter);
        expect(r.height).toBe(l.cellContentHeight + (2 * l.cellBorderWidth));
      });

      it('e2eGcr_3dc880f3f2 returns pure primitive formula', () => {
        const viewport = { offsetHeight: 600 };
        const r = l.e2eGcr_3dc880f3f2(viewport);
        const topSnap = l.defaultDataRowHeight + (2 * l.cellBorderWidth);
        const colOuter = l.defaultColumnWidth + l.cellBorderWidth;

        expect(r.start).toBe(4949);
        expect(r.top).toBe(600 - topSnap);
        expect(r.width).toBe(colOuter);
        expect(r.maxWidth).toBe(colOuter);
        expect(r.height).toBe(l.cellContentHeight + (2 * l.cellBorderWidth));
      });

      // Bucket B helpers
      it('e2eManualRowResizerPositionFixedTopOverlaySecondRow matches formula', () => {
        expect(l.e2eManualRowResizerPositionFixedTopOverlaySecondRow())
          .toEqual({ top: (3 * l.defaultDataRowHeight) - 5, left: 0 });
      });

      it('e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize == lineHeight + cellContentHeight', () => {
        expect(l.e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize())
          .toBe(l.lineHeight + l.cellContentHeight);
      });

      it('e2eCheckboxRendererMergedLabelInnerWidth(w) == w - (2*chp + cbw)', () => {
        expect(l.e2eCheckboxRendererMergedLabelInnerWidth(100))
          .toBe(100 - ((2 * l.cellHorizontalPadding) + l.cellBorderWidth));
      });

      it('e2eDensity_dcb53105f5 == overlayHeight({rows:3}) - 3 * defaultColumnWidth', () => {
        expect(l.e2eDensity_dcb53105f5())
          .toBe(l.overlayHeight({ rows: 3 }) - (3 * l.defaultColumnWidth));
      });

      it('e2eDensity_1369f821b5 == defaultDataRowHeight + 4 * lineHeight', () => {
        expect(l.e2eDensity_1369f821b5()).toBe(l.defaultDataRowHeight + (4 * l.lineHeight));
      });

      it('e2eDensity_5e8f2219da == defaultDataRowHeight + 5 * lineHeight', () => {
        expect(l.e2eDensity_5e8f2219da()).toBe(l.defaultDataRowHeight + (5 * l.lineHeight));
      });

      it('e2eDensity_9d03a9eba0 == 2 * lineHeight + 201', () => {
        expect(l.e2eDensity_9d03a9eba0()).toBe((2 * l.lineHeight) + 201);
      });

      it('e2eDensity_ed183d57c9 == lineHeight + defaultDataRowHeight', () => {
        expect(l.e2eDensity_ed183d57c9()).toBe(l.lineHeight + l.defaultDataRowHeight);
      });

      it('e2eDensity_682da48dd2 == lineHeight + firstRenderedRowDefaultHeight', () => {
        expect(l.e2eDensity_682da48dd2()).toBe(l.lineHeight + l.firstRenderedRowDefaultHeight);
      });

      it('e2eDensity_e145a29131 == 2 * cellHorizontalPadding + 45', () => {
        expect(l.e2eDensity_e145a29131()).toBe((2 * l.cellHorizontalPadding) + 45);
      });

      it('e2eDensity_c1a868f9c9 == defaultDataRowHeight + 2 * lineHeight', () => {
        expect(l.e2eDensity_c1a868f9c9()).toBe(l.defaultDataRowHeight + (2 * l.lineHeight));
      });

      it('e2eDensity_a24230f0bc == 3 * defaultDataRowHeight - 2 * cellVerticalPadding', () => {
        expect(l.e2eDensity_a24230f0bc())
          .toBe((3 * l.defaultDataRowHeight) - (2 * l.cellVerticalPadding));
      });

      it('e2eDensity_10071d8a47 == 2 * cellHorizontalPadding + 65', () => {
        expect(l.e2eDensity_10071d8a47()).toBe((2 * l.cellHorizontalPadding) + 65);
      });

      it('e2eDensity_f0a5ff56db == 3 * defaultDataRowHeight', () => {
        expect(l.e2eDensity_f0a5ff56db()).toBe(3 * l.defaultDataRowHeight);
      });

      it('e2eDensity_9b92431d49 == cellContentHeight + 3 * lineHeight', () => {
        expect(l.e2eDensity_9b92431d49()).toBe(l.cellContentHeight + (3 * l.lineHeight));
      });
    });
  });
});

describe('removed helpers are no longer on the API surface', () => {
  const REMOVED_HELPERS = [
    'e2ePasswordEditorAutoresizeWidthTrimPx',
    'e2eCommentsShortcutVerticalScrollSubtract',
    'e2eWindowScrollYContextMenuFirstSelectableItem',
    'e2eWindowScrollYDropdownMenuFirstSelectableItem',
    'e2eFiltersConditionalSubmenuDocumentYSubtract',
    'e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst',
    'e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300',
    'e2eStretchColumnsIndexOrderStretchedWidth',
    'e2eAutoColumnSize_104_115_123',
    'e2eNestedHeadersGhostTable_100_110_117',
    'e2eManualColumnResizeWidth155155156',
    'e2eManualColumnResizeResizerPositionTopCloneLeft194',
    'e2eManualColumnResizeResizerPositionTopCloneLeft94',
    'e2ePaginationScrollTopAfterScrollViewportToRow10Col10',
    'e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10',
    'e2eNoncontiguousBottomEdgeScrollTop',
    'e2eViewportScrollAfterRectangularAdjacentDataRows',
    'e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom',
    'e2eGcr_e9a5ab9a7a',
    'e2eGcr_660b0bbbb1',
    'e2eGcr_4ef37f8511',
    'e2eGcr_5ac91379aa',
  ];

  it('removed helpers are not on the API surface', () => {
    const layout = themeLayoutFromTokens(mainTheme.name);

    REMOVED_HELPERS.forEach((name) => {
      expect(layout[name]).toBeUndefined();
    });
  });
});

describe('error handling', () => {
  it('throws for unknown theme name', () => {
    expect(() => themeLayoutFromTokens('nonexistent')).toThrow();
  });

  it('defaults to main when theme name is falsy', () => {
    const layout = themeLayoutFromTokens('');

    expect(layout.themeName).toBe(mainTheme.name);
  });
});
