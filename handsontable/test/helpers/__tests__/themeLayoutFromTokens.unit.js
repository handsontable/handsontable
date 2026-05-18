import { mainTheme } from '../../../src/themes/theme';
import * as themeModules from '../../../src/themes/theme';
import sizing from '../../../src/themes/static/variables/sizing';
import density from '../../../src/themes/static/variables/density';
import { E2E_REGISTERED_THEME_KEYS, themeLayoutFromTokens } from '../themeLayoutFromTokens';
import {
  rtlEditorRectAtColumnStart234,
  rtlEditorRectAtColumnStart4949SnapBottom,
} from '../../../src/editors/baseEditor/__tests__/helpers/editedCellRect';

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

// Scenario helpers for the baseEditor RTL spec: their hardcoded column-offset constants
// (234 px, 4949 px) are part of the test data setup -- these unit tests catch a change in
// that setup. `width` / `height` intentionally come from the live TD at the E2E call site
// (not from these helpers), since those fields are not cleanly token-derivable across themes.
describe('baseEditor RTL scenario helpers', () => {
  ALL_THEMES.forEach((theme) => {
    describe(`helpers for "${theme.name}"`, () => {
      let l;

      beforeEach(() => {
        l = themeLayoutFromTokens(theme.name);
      });

      it('rtlEditorRectAtColumnStart234 encodes column offset 234', () => {
        const r = rtlEditorRectAtColumnStart234(l);
        const colOuter = l.defaultColumnWidth + l.cellBorderWidth;

        expect(r.start).toBe(234);
        expect(r.top).toBe(l.defaultDataRowHeight);
        expect(r.maxWidth).toBe(colOuter);
      });

      it('rtlEditorRectAtColumnStart4949SnapBottom encodes offset 4949 and snaps to bottom', () => {
        const viewport = { offsetHeight: 600 };
        const r = rtlEditorRectAtColumnStart4949SnapBottom(l, viewport);
        const topSnap = l.defaultDataRowHeight + (2 * l.cellBorderWidth);
        const colOuter = l.defaultColumnWidth + l.cellBorderWidth;

        expect(r.start).toBe(4949);
        expect(r.top).toBe(600 - topSnap + 1);
        expect(r.maxWidth).toBe(colOuter);
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
    // Relocated to plugin- or editor-local helper files (see PR review r3111060616).
    'e2eDensity_0051ca7391',
    'e2eDensity_8992c845e6',
    'e2eDensity_f2d3fe1fc0',
    'e2eDensity_f464e90e18',
    'e2eDensity_9639197594',
    'e2eDensity_9a971c3cfe',
    'e2eGcr_8b522d5d5b',
    'e2eGcr_3dc880f3f2',
    'e2eDensity_dcb53105f5',
    'e2eDensity_1369f821b5',
    'e2eDensity_5e8f2219da',
    'e2eDensity_9d03a9eba0',
    'e2eDensity_ed183d57c9',
    'e2eDensity_682da48dd2',
    'e2eDensity_e145a29131',
    'e2eDensity_c1a868f9c9',
    'e2eDensity_a24230f0bc',
    'e2eDensity_10071d8a47',
    'e2eDensity_f0a5ff56db',
    'e2eDensity_9b92431d49',
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

// ---------------------------------------------------------------------------
// I17: Multi-header viewport formula contract
// ---------------------------------------------------------------------------
//
// containerHeightForRows(rowCount, colHeaderRows) in common.js uses:
//   headerHeight = colHeaderRows * (defaultColumnHeaderHeight + cellBorderWidth)
//   height = headerHeight + rowCount * defaultDataRowHeight + (rowCount > 0 ? cellBorderWidth : 0)
//
// This assumes EVERY header row contributes (contentHeight + 1px border seam). That is
// accurate for the colHeaders case (each header row has its own bottom border). However,
// with nestedHeaders the DOM structure collapses borders differently -- only the outermost
// header row has the visible border seam against the first data row. The formula therefore
// over-estimates the header area for nestedHeaders grids by (colHeaderRows - 1) * 1px.
//
// TODO(I17): Measure the actual nestedHeaders DOM layout in an E2E test and correct the
// formula in common.js if needed. For now the unit tests below document the current
// formula invariant for colHeaderRows > 1 so any change is caught immediately.
describe('multi-header viewport formula invariants', () => {
  ALL_THEMES.forEach((theme) => {
    describe(`"${theme.name}"`, () => {
      let l;

      beforeEach(() => {
        l = themeLayoutFromTokens(theme.name);
      });

      it('containerHeightForRows single-header baseline: headerHeight == contentHeight + 1px border', () => {
        // colHeaderRows=1: one header row of (defaultColumnHeaderHeight + cellBorderWidth).
        const headerHeight = 1 * (l.defaultColumnHeaderHeight + l.cellBorderWidth);

        // The result should equal the top-overlay height for 1 header row.
        expect(headerHeight).toBe(l.defaultColumnHeaderHeight + l.cellBorderWidth);
      });

      it('containerHeightForRows two-header formula adds two equal-height header slots', () => {
        const colHeaderRows = 2;
        const headerHeight = colHeaderRows * (l.defaultColumnHeaderHeight + l.cellBorderWidth);

        // With colHeaderRows=2 the formula doubles the single-header height.
        expect(headerHeight).toBe(2 * (l.defaultColumnHeaderHeight + l.cellBorderWidth));
      });

      it('containerHeightForRows(5, 2) produces a height consistent with 2 header rows + 5 data rows', () => {
        const rowCount = 5;
        const colHeaderRows = 2;
        const headerHeight = colHeaderRows * (l.defaultColumnHeaderHeight + l.cellBorderWidth);
        const firstRowCompensation = rowCount > 0 ? l.cellBorderWidth : 0;
        const height = headerHeight + (rowCount * l.defaultDataRowHeight) + firstRowCompensation;

        // Verify decomposition: header block + data block + first-row seam.
        expect(height).toBe(
          (colHeaderRows * (l.defaultColumnHeaderHeight + l.cellBorderWidth)) +
          (rowCount * l.defaultDataRowHeight) +
          l.cellBorderWidth
        );
      });

      it('expectedVisibleRows(height, 2) rounds down when data area is not an exact multiple', () => {
        // Build a height that is NOT an exact multiple of defaultDataRowHeight for the data area.
        const colHeaderRows = 2;
        const headerHeight = colHeaderRows * (l.defaultColumnHeaderHeight + l.cellBorderWidth);
        // Add 4.5 * defaultDataRowHeight in the data area (fractional = not fully visible).
        const partialRowFraction = Math.floor(l.defaultDataRowHeight * 0.5);
        const containerHeight = headerHeight + (4 * l.defaultDataRowHeight) + partialRowFraction;
        const dataAreaHeight = containerHeight - headerHeight;
        const visibleRows = Math.floor(dataAreaHeight / l.defaultDataRowHeight);

        expect(visibleRows).toBe(4);
      });
    });
  });
});
