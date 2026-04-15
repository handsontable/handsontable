# Theme Layout E2E Helper Audit

Produced by Task 3a of the theme-layout-token-driven-rewrite plan.
Every helper in `handsontable/test/helpers/themeLayoutE2eHelpers.js` classified as:
- A: already a pure formula in token primitives (no `pickByDensity` with numeric literals, no `isDensity(...)` branches)
- B: recoverable formula (proven against all three themes)
- C: not tokenizable -- helper will be removed; consuming specs rewritten in Task 5

Primitives reference (classic/compact, main/default, horizon/comfortable):

| primitive | compact | default | comfortable |
|---|---|---|---|
| `lineHeight` | 21 | 20 | 20 |
| `cellVerticalPadding` | 2 | 4 | 8 |
| `cellHorizontalPadding` | 6 | 8 | 12 |
| `cellBorderWidth` | 1 | 1 | 1 |
| `cellContentHeight` | 25 | 28 | 36 |
| `defaultDataRowHeight` | 26 | 29 | 37 |
| `defaultColumnHeaderHeight` | 25 | 28 | 36 |
| `firstRenderedRowDefaultHeight` | 27 | 30 | 38 |
| `defaultColumnWidth` | 50 | 50 | 50 |
| `defaultRowHeaderWidth` | 50 | 50 | 50 |

Derived: `overlayHeight({rows: N}) = firstRenderedRowDefaultHeight + (N-1) * defaultDataRowHeight`

## Classification table

| Helper | Bucket | Formula | Current values (compact / default / comfortable) | Notes |
|---|---|---|---|---|
| `e2eGcrEditedCellOuterHeight` | A | `cellContentHeight + 2 * cellBorderWidth` | 27 / 30 / 38 | Pure formula in code |
| `e2eGcrDefaultMasterColumnClientWidth` | C | -- | 50 / 50 / 51 | Uses `isDensity('comfortable') ? 1 : 0` offset; not a single formula in primitives |
| `e2eGcrDefaultDataColumnOuterWidth` | C | -- | 51 / 51 / 52 | `defaultColumnWidth + cellBorderWidth + (comfortable ? 1 : 0)` -- rendering quirk |
| `e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst` | C | -- | 226 / 250 / 314 | Uses fudge constant 4/3 per density; TODO in code |
| `e2ePasswordEditorAutoresizeWidthTrimPx` | C | -- | 5 / 1 / 9 | Three distinct density-branch formulas; no single formula fits |
| `e2ePickForDensity` | A | `pickByDensity(values)` | (passthrough) | Utility passthrough; no numeric values |
| `e2eCommentsShortcutVerticalScrollSubtract` | C | -- | 231 / 225 / 209 | Three distinct formulas per density with TODO fudge constants |
| `e2eWindowScrollYContextMenuFirstSelectableItem` | C | -- | 9 / 9 / 13 | Density-branched extra padding with inconsistent multipliers |
| `e2eWindowScrollYDropdownMenuFirstSelectableItem` | C | -- | 31 / 35 / 43 | Density-branched subtraction with fudge constants +2/+10 (TODO in code) |
| `e2eFiltersConditionalSubmenuDocumentYSubtract` | C | -- | 419 / 486 / 584 | Three distinct formulas; compact uses `3*cbw`, default `+22`, comfortable `-8` |
| `e2eNoncontiguousBottomEdgeScrollTop` | C | -- | f(arg) | Delegates to density-branched scroll helper minus density-branched stride |
| `e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom` | C | -- | f(arg) | Three distinct formulas per density |
| `e2eViewportScrollAfterRectangularAdjacentDataRows` | C | -- | f(arg) | Three distinct formulas per density |
| `e2ePaginationScrollTopAfterScrollViewportToRow10Col10` | C | -- | 101 / 134 / 222 | Viewport-specific scroll position; no formula in primitives |
| `e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10` | C | -- | 65 / 65 / 79 | Viewport-specific scroll position |
| `e2eStretchColumnsIndexOrderStretchedWidth` | C | -- | 79 / 79 / 74 | Rendering-dependent stretched column width |
| `e2eManualRowResizerPositionFixedTopMasterFourthRow` | A | `{ top: defaultColumnHeaderHeight + 4 * cellContentHeight, left: 0 }` | {125,0} / {140,0} / {180,0} | Pure formula; `top = 5 * cellContentHeight` |
| `e2eManualRowResizerPositionFixedTopOverlaySecondRow` | B | `{ top: 3 * defaultDataRowHeight - 5, left: 0 }` | {73,0} / {82,0} / {106,0} | Constant offset -5 from resizer handle |
| `e2eManualRowResizerPositionFixedBottomOverlayFirstRow` | A | `{ top: defaultDataRowHeight - 5, left: 0 }` | {21,0} / {24,0} / {32,0} | Pure formula already in code |
| `e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize` | B | `lineHeight + cellContentHeight` | 46 / 48 / 56 | Proven: 21+25=46, 20+28=48, 20+36=56 |
| `e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300` | C | -- | 23 / 29 / 37 | Compact returns `cellContentHeight - 2`; others return `defaultDataRowHeight`; no single formula |
| `e2eStretchColumnsAlter320InsertEnd1` | C | -- | 90 / 90 / 85 | Rendering-dependent stretched column width |
| `e2eStretchColumnsAlter320InsertStartVisible` | C | -- | 68 / 68 / 64 | Rendering-dependent stretched column width |
| `e2eStretchColumnsAlter320InsertStartTrailing` | C | -- | 66 / 66 / 63 | Rendering-dependent stretched column width |
| `e2eStretchColumnsAlter320SixColsStretched` | C | -- | 54 / 54 / 51 | Rendering-dependent stretched column width |
| `e2eStretchColumnsWidth200StretchAllFirstTwo` | C | -- | 67 / 67 / 62 | Rendering-dependent stretched column width |
| `e2eStretchColumnsWidth200StretchAllLast` | C | -- | 66 / 66 / 61 | Rendering-dependent stretched column width |
| `e2eStretchColumnsWidth200StretchLast` | C | -- | 100 / 100 / 85 | Rendering-dependent stretched column width |
| `e2eStretchColumnsWidth500ThreeCols` | C | -- | 150 / 150 / 145 | Rendering-dependent stretched column width |
| `e2eStretchColumnsMultilineWidth500Col0` | C | -- | 412 / 418 / 420 | Text-metric-dependent column width |
| `e2eStretchColumnsMultilineWidth500Col1` | C | -- | 88 / 82 / 80 | Text-metric-dependent column width |
| `e2eStretchColumnsLongTextWidth400Col4` | C | -- | 286 / 311 / 319 | Text-metric-dependent column width |
| `e2eNestedHeadersSelectionInlineScroll50` | C | -- | 50 / 50 / 51 | Rendering-dependent scroll position |
| `e2eNestedHeadersSelectionInlineScroll265` | C | -- | 265 / 265 / 278 | Rendering-dependent scroll position |
| `e2eNestedHeadersSelectionInlineScroll65` | C | -- | 65 / 65 / 72 | Rendering-dependent scroll position |
| `e2eNestedHeadersSelectionInlineScroll250` | C | -- | 250 / 250 / 257 | Rendering-dependent scroll position |
| `e2eNestedHeadersNavInlineScrollAfterD` | C | -- | 66 / 66 / 74 | Rendering-dependent scroll position |
| `e2eNestedHeadersNavInlineScrollAfterE` | C | -- | 266 / 266 / 279 | Rendering-dependent scroll position |
| `e2eNestedHeadersNavInlineScrollAfterF` | C | -- | 516 / 516 / 539 | Rendering-dependent scroll position |
| `e2eNestedHeadersNavInlineScrollAfterG` | C | -- | 866 / 866 / 900 | Rendering-dependent scroll position |
| `e2eNestedHeadersNavInlineScrollAfterH` | C | -- | 1266 / 1280 / 1354 | Rendering-dependent scroll position |
| `e2eNestedHeadersNavInlineScrollAfterI` | C | -- | 1316 / 1333 / 1415 | Rendering-dependent scroll position |
| `e2eNestedHeadersManualColumnResizeCol1AfterDrag50` | C | -- | 27 / 36 / 44 | Text-metric-dependent column resize width |
| `e2eManualColumnResizeResizerPositionTopCloneLeft194` | C | -- | {0,194} / {0,194} / {0,198} | Rendering-dependent resizer position |
| `e2eManualColumnResizeResizerPositionTopCloneLeft94` | C | -- | {0,94} / {0,94} / {0,95} | Rendering-dependent resizer position |
| `e2eManualColumnResizeWidth155155156` | C | -- | 155 / 155 / 156 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth222735` | C | -- | 22 / 27 / 35 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth220218216` | C | -- | 220 / 218 / 216 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth220219217` | C | -- | 220 / 219 / 217 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth221220218` | C | -- | 221 / 220 / 218 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth293543` | C | -- | 29 / 35 / 43 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth293544` | C | -- | 29 / 35 / 44 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth303644` | C | -- | 30 / 36 / 44 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth313644` | C | -- | 31 / 36 / 44 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth343435` | C | -- | 34 / 34 / 35 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth505051` | C | -- | 50 / 50 / 51 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth505052` | C | -- | 50 / 50 / 52 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth505053` | C | -- | 50 / 50 / 53 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth736730723` | C | -- | 736 / 730 / 723 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth788795` | C | -- | 78 / 87 / 95 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth797981` | C | -- | 79 / 79 / 81 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth808081` | C | -- | 80 / 80 / 81 | Rendering-dependent column width |
| `e2eManualColumnResizeWidth808082` | C | -- | 80 / 80 / 82 | Rendering-dependent column width |
| `e2eManualColumnResizeRtlStretchedHeaderOuterWidth` | C | -- | 196 / 196 / 198 | Rendering-dependent header width |
| `e2eAutoColumnSize_104_115_123` | C | -- | 104 / 115 / 123 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_123_135_143` | C | -- | 123 / 135 / 143 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_127_139_147` | C | -- | 127 / 139 / 147 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_129_138_146` | C | -- | 129 / 138 / 146 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_133_146_154` | C | -- | 133 / 146 / 154 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_133_151_161` | C | -- | 133 / 151 / 161 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_143_157_165` | C | -- | 143 / 157 / 165 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_155_170_178` | C | -- | 155 / 170 / 178 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_162_177_185` | C | -- | 162 / 177 / 185 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_192_210_218` | C | -- | 192 / 210 / 218 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_198_216_224` | C | -- | 198 / 216 / 224 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_207_225_233` | C | -- | 207 / 225 / 233 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_2235_2322_2575` | C | -- | 2235 / 2322 / 2575 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_50_50_58` | C | -- | 50 / 50 / 58 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_50_52_60` | C | -- | 50 / 52 / 60 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_55_62_70` | C | -- | 55 / 62 / 70 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_58_65_73` | C | -- | 58 / 65 / 73 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_64_72_80` | C | -- | 64 / 72 / 80 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_65_67_75` | C | -- | 65 / 67 / 75 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_67_75_83` | C | -- | 67 / 75 / 83 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_82_91_99` | C | -- | 82 / 91 / 99 | Text-metric-dependent auto column size |
| `e2eAutoColumnSize_95_95_100` | C | -- | 95 / 95 / 100 | Text-metric-dependent auto column size |
| `e2eNestedHeadersGhostTable_100_110_117` | C | -- | 100 / 110 / 117 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_102_111_114` | C | -- | 102 / 111 / 114 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_135_150_158` | C | -- | 135 / 150 / 158 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_201_219_227` | C | -- | 201 / 219 / 227 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_21_26_33` | C | -- | 21 / 26 / 33 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_21_26_34` | C | -- | 21 / 26 / 34 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_22_26_34` | C | -- | 22 / 26 / 34 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_22_26_35` | C | -- | 22 / 26 / 35 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_22_27_35` | C | -- | 22 / 27 / 35 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_23_27_36` | C | -- | 23 / 27 / 36 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_23_28_36` | C | -- | 23 / 28 / 36 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_24_28_36` | C | -- | 24 / 28 / 36 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_25_30_38` | C | -- | 25 / 30 / 38 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_79_88_96` | C | -- | 79 / 88 / 96 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_98_108_112` | C | -- | 98 / 108 / 112 | Text-metric-dependent ghost table width |
| `e2eNestedHeadersGhostTable_99_110_118` | C | -- | 99 / 110 / 118 | Text-metric-dependent ghost table width |
| `e2eColumnHeaderMenuAnchorTop` | C | -- | trim: 2 / 1 / 5 | Density-branched trim; no single formula (TODO in code) |
| `e2eMenuTickItemInlineStartFromRootLeft` | C | -- | add: 1 / 1 / 0 | Density-branched offset; rendering quirk |
| `e2eTextEditorTextareaHeightSingleLinePx` | A | `firstRenderedRowDefaultHeight` (as `${...}px` string) | 27 / 30 / 38 | Pure formula |
| `e2eTextEditorTextareaParentTopPx` | A | `defaultDataRowHeight` (as `${...}px` string) | 26 / 29 / 37 | Pure formula |
| `e2eTextEditorTextareaHeightThreeLinesPx` | A | `3 * lineHeight + 2 * cellVerticalPadding + 2 * cellBorderWidth` (as string) | 69 / 70 / 78 | Pure formula |
| `e2eCheckboxRendererMergedLabelInnerWidth` | B | `cellOuterWidth - (2 * cellHorizontalPadding + cellBorderWidth)` | trim: 13 / 17 / 25 | Proven: 2*6+1=13, 2*8+1=17, 2*12+1=25 |
| `e2eMergeCellsBorderTopAfterScroll` | A | `topPositionBefore + defaultDataRowHeight` | f(arg) | Pure formula with argument |
| `e2eMergeCellsOpenEditorWideMergeTextareaParentOffset` | A | `{ top: 2 * defaultDataRowHeight, left: defaultRowHeaderWidth }` | {52,50} / {58,50} / {74,50} | Pure formula |
| `e2eMergeCellsOpenEditorTallMergeTextareaParentOffset` | C | -- | top: frrH; left: 99/100/108 | Top is pure but left uses density-branched value |
| `e2eCommentTextareaStyleWithSize` | A | `{ width: w + 2*chp + 2*cbw, height: h + 2*cvp + 2*cbw }` | f(w,h) | Pure formula with arguments |
| `e2eDensity_516fd776f5` | C | -- | 'A13' / 'A11' / 'A9' | String (cell address); viewport-dependent |
| `e2eDensity_e18c9a767b` | C | -- | 'A19' / 'A18' / 'A6' | String (cell address); viewport-dependent |
| `e2eDensity_05e899e868` | C | -- | 'A21' / 'A18' / 'A14' | String (cell address); viewport-dependent |
| `e2eDensity_763d67703a` | C | -- | 'A25' / 'A22' / 'A17' | String (cell address); viewport-dependent |
| `e2eDensity_6f54af4a25` | C | -- | 'A27' / 'A23' / 'A7' | String (cell address); viewport-dependent |
| `e2eDensity_d7aa2fd7d8` | C | -- | 'A5' / 'A4' / 'A3' | String (cell address); viewport-dependent |
| `e2eDensity_837d6451b8` | C | -- | 'A8' / 'A7' / 'A5' | String (cell address); viewport-dependent |
| `e2eDensity_d684162341` | C | -- | 'A9' / 'A8' / 'A6' | String (cell address); viewport-dependent |
| `e2eDensity_dcb53105f5` | B | `overlayHeight({rows: 3}) - 3 * defaultColumnWidth` | -71 / -62 / -38 | Proven: 79-150=-71, 88-150=-62, 112-150=-38 |
| `e2eDensity_7d7cc669b9` | C | -- | 100 / 100 / 170 | No formula in primitives fits |
| `e2eDensity_d97740ab8b` | C | -- | 10142 / 11345 / 14553 | Large scroll/position; viewport-dependent |
| `e2eDensity_21de631a3d` | C | -- | 104 / 94 / 61 | No formula in primitives fits |
| `e2eDensity_1369f821b5` | B | `defaultDataRowHeight + 4 * lineHeight` | 110 / 109 / 117 | Proven: 26+84=110, 29+80=109, 37+80=117 |
| `e2eDensity_0051ca7391` | A | `overlayHeight({rows: 3}) + 2 * lineHeight` | 121 / 128 / 152 | Pure formula already in code |
| `e2eDensity_d199d17b67` | C | -- | 130 / 130 / 160 | No formula in primitives fits |
| `e2eDensity_6fb44e9a25` | C | -- | 130 / 185 / 235 | No formula in primitives fits |
| `e2eDensity_5e8f2219da` | B | `defaultDataRowHeight + 5 * lineHeight` | 131 / 129 / 137 | Proven: 26+105=131, 29+100=129, 37+100=137 |
| `e2eDensity_8992c845e6` | A | `overlayHeight({rows: 5})` | 131 / 146 / 186 | Pure formula already in code |
| `e2eDensity_95d19e5e71` | C | -- | 134 / 170 / 260 | No formula in primitives fits |
| `e2eDensity_86a4cac668` | C | -- | 139 / 155 / 194 | No formula in primitives fits |
| `e2eDensity_73a19e226c` | C | -- | 140 / 185 / 240 | No formula in primitives fits |
| `e2eDensity_0bf6b512ac` | C | -- | 149 / 163 / 171 | No formula in primitives fits |
| `e2eDensity_e9b95cfc26` | C | -- | 150 / 150 / 155 | No formula in primitives fits |
| `e2eDensity_d347abe8d6` | C | -- | 1819 / 1961 / 2284 | Large scroll/position; no formula |
| `e2eDensity_dc11ccdb89` | C | -- | 192 / 210 / 218 | Text-metric-dependent; same pattern as autoColumnSize |
| `e2eDensity_3bcf74979c` | C | -- | 207 / 225 / 233 | Text-metric-dependent; same pattern as autoColumnSize |
| `e2eDensity_012c64941a` | C | -- | 215 / 216 / 264 | No formula in primitives fits |
| `e2eDensity_db9abac9c8` | C | -- | 217 / 217 / 215 | No formula in primitives fits |
| `e2eDensity_2d086a6135` | C | -- | 222 / 246 / 313 | No formula in primitives fits |
| `e2eDensity_9d03a9eba0` | B | `2 * lineHeight + 201` | 243 / 241 / 241 | Proven: 42+201=243, 40+201=241, 40+201=241 |
| `e2eDensity_0308b1f949` | C | -- | 246 / 268 / 276 | No formula in primitives fits |
| `e2eDensity_a57d724d44` | C | -- | 26 / 49 / 57 | No formula in primitives fits |
| `e2eDensity_f2d3fe1fc0` | A | `overlayHeight({rows: 5})` | 131 / 146 / 186 | Code uses literal form: `frrH + 4*ddrh` |
| `e2eDensity_9d8bccd1c7` | B | `2 * cellVerticalPadding + 26` | 30 / 34 / 42 | Proven: 4+26=30, 8+26=34, 16+26=42 |
| `e2eDensity_315eed5b06` | B | `2 * cellVerticalPadding + 27` | 31 / 35 / 43 | Proven: 4+27=31, 8+27=35, 16+27=43 |
| `e2eDensity_9ece902862` | C | -- | 35 / 35 / 36 | No formula in primitives fits |
| `e2eDensity_a4793c32d9` | C | -- | 367 / 356 / 352 | No formula in primitives fits |
| `e2eDensity_129ed1d57c` | C | -- | 38 / 43 / 51 | No formula in primitives fits |
| `e2eDensity_ed183d57c9` | B | `lineHeight + defaultDataRowHeight` | 47 / 49 / 57 | Proven: 21+26=47, 20+29=49, 20+37=57 |
| `e2eDensity_682da48dd2` | B | `lineHeight + firstRenderedRowDefaultHeight` | 48 / 50 / 58 | Proven: 21+27=48, 20+30=50, 20+38=58 |
| `e2eDensity_d35d5683ec` | C | -- | 50 / 50 / 51 | Same as `defaultColumnWidth + (comfortable ? 1 : 0)` rendering quirk |
| `e2eDensity_429cac7b61` | C | -- | 50 / 50 / 52 | Rendering-dependent width |
| `e2eDensity_a2f2c0beda` | C | -- | 50 / 50 / 85 | No formula in primitives fits |
| `e2eDensity_f464e90e18` | A | `2 * defaultDataRowHeight` | 52 / 58 / 74 | Pure formula already in code |
| `e2eDensity_9639197594` | A | `2 * defaultDataRowHeight + cellBorderWidth` | 53 / 59 / 75 | Pure formula already in code |
| `e2eDensity_7c3646ff31` | C | -- | 53 / 60 / 68 | No formula in primitives fits |
| `e2eDensity_e145a29131` | B | `2 * cellHorizontalPadding + 45` | 57 / 61 / 69 | Proven: 12+45=57, 16+45=61, 24+45=69 |
| `e2eDensity_cefdabf33b` | C | -- | 61 / 68 / 76 | No formula in primitives fits |
| `e2eDensity_c1a868f9c9` | B | `defaultDataRowHeight + 2 * lineHeight` | 68 / 69 / 77 | Proven: 26+42=68, 29+40=69, 37+40=77 |
| `e2eDensity_73e2af5849` | C | -- | 68 / 89 / 97 | No formula in primitives fits |
| `e2eDensity_9efbb642b5` | B | `3 * defaultDataRowHeight - 4 * cellVerticalPadding` | 70 / 71 / 79 | Proven: 78-8=70, 87-16=71, 111-32=79 |
| `e2eDensity_a24230f0bc` | B | `3 * defaultDataRowHeight - 2 * cellVerticalPadding` | 74 / 79 / 95 | Proven: 78-4=74, 87-8=79, 111-16=95 |
| `e2eDensity_a738aa613c` | C | -- | 75 / 84 / 92 | No formula in primitives fits |
| `e2eDensity_10071d8a47` | B | `2 * cellHorizontalPadding + 65` | 77 / 81 / 89 | Proven: 12+65=77, 16+65=81, 24+65=89 |
| `e2eDensity_f0a5ff56db` | B | `3 * defaultDataRowHeight` | 78 / 87 / 111 | Proven: 3*26=78, 3*29=87, 3*37=111 |
| `e2eDensity_9a971c3cfe` | A | `overlayHeight({rows: 3})` | 79 / 88 / 112 | Pure formula already in code |
| `e2eDensity_ff544a9b2b` | C | -- | 86 / 93 / 101 | No formula in primitives fits |
| `e2eDensity_25c4d95d1f` | B | `2 * cellVerticalPadding + 83` | 87 / 91 / 99 | Proven: 4+83=87, 8+83=91, 16+83=99 |
| `e2eDensity_9b92431d49` | B | `cellContentHeight + 3 * lineHeight` | 88 / 88 / 96 | Proven: 25+63=88, 28+60=88, 36+60=96 |
| `e2eDensity_5bbc262bb3` | C | -- | 90 / 99 / 107 | No formula in primitives fits |
| `e2eDensity_0077155d83` | C | -- | 984 / 1135 / 1543 | Large value; no formula in primitives fits |
| `e2eDensity_066cd3067e` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eDensity_14926c8296` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eDensity_55a74b203e` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eDensity_72a0e755a3` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eDensity_974019229c` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eDensity_51b5ff37ca` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eDensity_be99672953` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eDensity_eca9596399` | C | -- | (string arrays) | Pagination text; viewport-dependent row count |
| `e2eGcr_9fd0838eca` | C | -- | (object) | Uses `isDensity('comfortable') ? 1 : 0` for width; hardcoded maxWidth 285, maxHeight 185 |
| `e2eGcr_0c1f70547f` | C | -- | (object) | Comfortable width is hardcoded 59 (TODO); density-branched width formula |
| `e2eGcr_654f08c592` | C | -- | (object) | Hardcoded start 234; maxHeight uses density-branched constant |
| `e2eGcr_394b62538f` | C | -- | (object) | First-cell widths 55/62/70 not tokenized (TODO in code) |
| `e2eGcr_1812746652` | C | -- | (object) | Density-branched start and maxWidth; fixture-specific maxHeight |
| `e2eGcr_59a39f83a8` | C | -- | (object) | First-cell widths 49/50/58 and 51/52/60 not tokenized |
| `e2eGcr_63d4e50227` | C | -- | (object) | Density-branched top with fudge constant +10 (TODO in code) |
| `e2eGcr_f1418f56a2` | C | -- | (object) | Comfortable row-header/first-column widths 58/60 not tokenized (TODO in code) |
| `e2eGcr_e9a5ab9a7a` | C | -- | (object) | Fixture-specific tops 132/126/110; hardcoded maxWidth 285 |
| `e2eGcr_4ef37f8511` | C | -- | (object) | Density-branched width (50/51/59 with TODO); uses shared height pieces |
| `e2eGcr_5ac91379aa` | C | -- | (object) | Density-branched width (50/51/59 with TODO) |
| `e2eGcr_660b0bbbb1` | C | -- | (object) | Fixture-specific tops 132/126/110; hardcoded maxWidth 285 |
| `e2eGcr_578ee2338a` | C | -- | (object) | Density-branched width (50/51/59 with TODO) |
| `e2eGcr_be63e8af58` | C | -- | (object) | Density-branched top with fudge constant +10 (TODO in code) |
| `e2eGcr_1e686ee3a6` | C | -- | (object) | maxHeight 42/45/53 not mapped to tokens (TODO in code) |
| `e2eGcr_8b522d5d5b` | A | `{ start: 234, top: ddrh, width: dcw+cbw, maxWidth: dcw+cbw, height: gcrECOH }` | (object) | Pure formula (start 234 is a fixture constant, fields are pure) |
| `e2eGcr_e5142224f2` | C | -- | (object) | Duplicate of 394b62538f; first-cell widths not tokenized |
| `e2eGcr_d4ea38684b` | C | -- | (object) | Density-branched start; `comfortable ? drhw : drhw - cbw` |
| `e2eGcr_065fabb134` | C | -- | (object) | First-cell widths 49/50/58 and 51/52/60 not tokenized |
| `e2eGcr_b03e660972` | C | -- | (object) | Density-branched starts 49/49/50 and tops 158/155/147 |
| `e2eGcr_3acc8a5880` | C | -- | (object) | First-cell widths 49/50/58 and 51/52/60 not tokenized |
| `e2eGcr_62100eec40` | C | -- | (object) | Fixture-specific tops 132/126/110; hardcoded maxWidth 285 |
| `e2eGcr_a7dd654d16` | C | -- | (object) | Density-branched width (50/51/59 with TODO) |
| `e2eGcr_3866422adb` | C | -- | (object) | Fixture-specific tops 132/126/110 |
| `e2eGcr_901bb6925b` | C | -- | (object) | Density-branched width (50/51/59 with TODO) |
| `e2eGcr_69029d1636` | C | -- | (object) | Density-branched width (50/51/59 with TODO) |
| `e2eGcr_230de5a9f7` | C | -- | (object) | Density-branched top with fudge constant +10 (TODO in code) |
| `e2eGcr_3dc880f3f2` | A | `{ start: 4949, top: oH-topSnapPad, width: dcw+cbw, maxWidth: dcw+cbw, height: gcrECOH }` | (object) | Pure formula (start 4949 is fixture; all fields are pure expressions in primitives + args) |
| `e2eDensity_fe455d5781` | C | -- | 50 / 50 / 51 | Same `defaultColumnWidth + (comfortable ? 1 : 0)` quirk |
| `e2eDensity_8b9c83b3f3` | C | -- | 50 / 50 / 52 | Same `defaultColumnWidth + (comfortable ? 2 : 0)` quirk |

## Summary

- Bucket A: 18 helpers (kept as-is, pickByDensity wrapper removed if present)
- Bucket B: 19 helpers (rewritten as single formula)
- Bucket C: 174 helpers (removed; Task 5 rewrites callers)

### Bucket A helpers (18)

1. `e2eGcrEditedCellOuterHeight` -- `cellContentHeight + 2 * cellBorderWidth`
2. `e2ePickForDensity` -- passthrough utility
3. `e2eManualRowResizerPositionFixedTopMasterFourthRow` -- `{ top: 5 * cellContentHeight, left: 0 }`
4. `e2eManualRowResizerPositionFixedBottomOverlayFirstRow` -- `{ top: defaultDataRowHeight - 5, left: 0 }`
5. `e2eTextEditorTextareaHeightSingleLinePx` -- `firstRenderedRowDefaultHeight` (as px string)
6. `e2eTextEditorTextareaParentTopPx` -- `defaultDataRowHeight` (as px string)
7. `e2eTextEditorTextareaHeightThreeLinesPx` -- `3 * lineHeight + 2 * cellVerticalPadding + 2 * cellBorderWidth`
8. `e2eMergeCellsBorderTopAfterScroll` -- `topPositionBefore + defaultDataRowHeight`
9. `e2eMergeCellsOpenEditorWideMergeTextareaParentOffset` -- `{ top: 2 * ddrh, left: drhw }`
10. `e2eCommentTextareaStyleWithSize` -- `{ width: w + 2*chp + 2*cbw, height: h + 2*cvp + 2*cbw }`
11. `e2eDensity_0051ca7391` -- `overlayHeight({rows: 3}) + 2 * lineHeight`
12. `e2eDensity_8992c845e6` -- `overlayHeight({rows: 5})`
13. `e2eDensity_f2d3fe1fc0` -- `overlayHeight({rows: 5})`
14. `e2eDensity_f464e90e18` -- `2 * defaultDataRowHeight`
15. `e2eDensity_9639197594` -- `2 * defaultDataRowHeight + cellBorderWidth`
16. `e2eDensity_9a971c3cfe` -- `overlayHeight({rows: 3})`
17. `e2eGcr_8b522d5d5b` -- pure formula with fixture constants
18. `e2eGcr_3dc880f3f2` -- pure formula with fixture constants and args

### Bucket B helpers (19)

1. `e2eManualRowResizerPositionFixedTopOverlaySecondRow` -- `{ top: 3 * defaultDataRowHeight - 5, left: 0 }`
2. `e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize` -- `lineHeight + cellContentHeight`
3. `e2eCheckboxRendererMergedLabelInnerWidth` -- trim = `2 * cellHorizontalPadding + cellBorderWidth`
4. `e2eDensity_dcb53105f5` -- `overlayHeight({rows: 3}) - 3 * defaultColumnWidth`
5. `e2eDensity_1369f821b5` -- `defaultDataRowHeight + 4 * lineHeight`
6. `e2eDensity_5e8f2219da` -- `defaultDataRowHeight + 5 * lineHeight`
7. `e2eDensity_9d03a9eba0` -- `2 * lineHeight + 201`
8. `e2eDensity_9d8bccd1c7` -- `2 * cellVerticalPadding + 26`
9. `e2eDensity_315eed5b06` -- `2 * cellVerticalPadding + 27`
10. `e2eDensity_e145a29131` -- `2 * cellHorizontalPadding + 45`
11. `e2eDensity_ed183d57c9` -- `lineHeight + defaultDataRowHeight`
12. `e2eDensity_682da48dd2` -- `lineHeight + firstRenderedRowDefaultHeight`
13. `e2eDensity_c1a868f9c9` -- `defaultDataRowHeight + 2 * lineHeight`
14. `e2eDensity_9efbb642b5` -- `3 * defaultDataRowHeight - 4 * cellVerticalPadding`
15. `e2eDensity_a24230f0bc` -- `3 * defaultDataRowHeight - 2 * cellVerticalPadding`
16. `e2eDensity_f0a5ff56db` -- `3 * defaultDataRowHeight`
17. `e2eDensity_10071d8a47` -- `2 * cellHorizontalPadding + 65`
18. `e2eDensity_25c4d95d1f` -- `2 * cellVerticalPadding + 83`
19. `e2eDensity_9b92431d49` -- `cellContentHeight + 3 * lineHeight`

### Bucket C categories

The 174 bucket-C helpers fall into these groups:
- **Auto column size** (22 helpers): text-metric-dependent widths from `autoColumnSize.spec.js`
- **Manual column resize** (20 helpers): rendering-dependent column widths from `manualColumnResize.spec.js`
- **Stretch columns** (11 helpers): rendering-dependent stretched widths from `stretchColumns.spec.js`
- **Nested headers ghost table** (16 helpers): text-metric-dependent ghost table widths
- **Nested headers navigation/selection** (10 helpers): rendering-dependent scroll positions
- **GCR (getEditedCellRect)** (18 helpers): fixture-specific viewport rects with untokenized widths (TODOs in code)
- **Pagination text** (8 helpers): string arrays with viewport-dependent page counts
- **Cell address strings** (8 helpers): viewport-dependent cell reference strings
- **Scroll/viewport helpers** (12 helpers): density-branched scroll calculations with fudge constants
- **Miscellaneous** (50 helpers): various rendering-dependent or density-branched values

## Bucket C removal list

Caller specs for bucket-C helpers were identified via grep across the `handsontable/` package. Paths are relative to the repo root.

- **Auto column size helpers** (`e2eAutoColumnSize_*`, 22 helpers) -- caller spec: `handsontable/src/plugins/autoColumnSize/__tests__/autoColumnSize.spec.js`
- **Manual column resize helpers** (`e2eManualColumnResize*`, 20 helpers) -- caller specs: `handsontable/src/plugins/manualColumnResize/__tests__/manualColumnResize.spec.js`, `handsontable/src/plugins/manualColumnResize/__tests__/rtl/manualColumnResize.spec.js`
- **Stretch columns helpers** (`e2eStretchColumns*`, 11 helpers) -- caller specs: `handsontable/src/plugins/stretchColumns/__tests__/stretchColumns.spec.js`, `handsontable/src/plugins/stretchColumns/__tests__/methods/getColumnWidth.spec.js`, `handsontable/src/plugins/stretchColumns/__tests__/indexOrder.spec.js`, `handsontable/src/plugins/stretchColumns/__tests__/hiddenColumns.spec.js`, `handsontable/src/plugins/stretchColumns/__tests__/altering.spec.js`
- **Nested headers ghost table helpers** (`e2eNestedHeadersGhostTable_*`, 16 helpers) -- caller spec: `handsontable/src/plugins/nestedHeaders/__tests__/ghostTable.spec.js`
- **Nested headers navigation/selection helpers** (`e2eNestedHeadersNav*`, `e2eNestedHeadersSelection*`, 10 helpers) -- caller specs: `handsontable/src/plugins/nestedHeaders/__tests__/selection.spec.js`, `handsontable/src/plugins/nestedHeaders/__tests__/navigation.spec.js`
- **Nested headers manual column resize** (`e2eNestedHeadersManualColumnResizeCol1AfterDrag50`, 1 helper) -- caller spec: `handsontable/src/plugins/nestedHeaders/__tests__/resizingColumns.spec.js`
- **GCR helpers** (bucket-C `e2eGcr_*`, 16 helpers) -- caller specs: `handsontable/src/editors/baseEditor/__tests__/methods/getEditedCellRect.spec.js`, `handsontable/src/editors/baseEditor/__tests__/rtl/API.spec.js`
- **GCR master/data column width** (`e2eGcrDefaultMasterColumnClientWidth`, `e2eGcrDefaultDataColumnOuterWidth`, 2 helpers) -- no consumer spec found (defined but unused)
- **Pagination text helpers** (`e2eDensity_066cd3067e`, `e2eDensity_14926c8296`, `e2eDensity_55a74b203e`, `e2eDensity_72a0e755a3`, `e2eDensity_974019229c`, `e2eDensity_51b5ff37ca`, `e2eDensity_be99672953`, `e2eDensity_eca9596399`, 8 helpers) -- caller spec: `handsontable/src/plugins/pagination/__tests__/options/pageSize.spec.js`
- **Cell address string helpers** (`e2eDensity_516fd776f5`, `e2eDensity_e18c9a767b`, `e2eDensity_05e899e868`, `e2eDensity_763d67703a`, `e2eDensity_6f54af4a25`, `e2eDensity_d7aa2fd7d8`, `e2eDensity_837d6451b8`, `e2eDensity_d684162341`, 8 helpers) -- caller spec: `handsontable/src/plugins/pagination/__tests__/options/pageSize.spec.js`
- `e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst` -- caller spec: `handsontable/src/core/viewportScroll/__tests__/rowHeaderSelection.spec.js`
- `e2ePasswordEditorAutoresizeWidthTrimPx` -- caller spec: `handsontable/src/editors/passwordEditor/__tests__/passwordEditor.spec.js`
- `e2eCommentsShortcutVerticalScrollSubtract` -- caller spec: `handsontable/src/plugins/comments/__tests__/keyboardShortcuts.spec.js`
- `e2eWindowScrollYContextMenuFirstSelectableItem` -- caller specs: `handsontable/src/plugins/contextMenu/__tests__/keyboardShortcuts/pageUp.spec.js`, `handsontable/src/plugins/contextMenu/__tests__/keyboardShortcuts/metaArrowUpOrHome.spec.js`, `handsontable/src/plugins/contextMenu/__tests__/keyboardShortcuts/arrowDown.spec.js`
- `e2eWindowScrollYDropdownMenuFirstSelectableItem` -- caller specs: `handsontable/src/plugins/dropdownMenu/__tests__/keyboardShortcuts/pageUp.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/keyboardShortcuts/metaArrowUpOrHome.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/keyboardShortcuts/arrowDown.spec.js`
- `e2eFiltersConditionalSubmenuDocumentYSubtract` -- caller spec: `handsontable/src/plugins/filters/__tests__/component/conditional.spec.js`
- `e2eNoncontiguousBottomEdgeScrollTop` -- caller spec: `handsontable/src/core/viewportScroll/__tests__/noncontiguousSelection.spec.js`
- `e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom` -- caller spec: `handsontable/src/core/viewportScroll/__tests__/multipleSelection.spec.js`
- `e2eViewportScrollAfterRectangularAdjacentDataRows` -- caller specs: `handsontable/src/core/viewportScroll/__tests__/noncontiguousSelection.spec.js`, `handsontable/src/core/viewportScroll/__tests__/multipleSelection.spec.js`
- `e2ePaginationScrollTopAfterScrollViewportToRow10Col10` / `e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10` -- caller spec: `handsontable/src/plugins/pagination/__tests__/pagination.spec.js`
- `e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300` -- caller spec: `handsontable/src/plugins/manualRowResize/__tests__/manualRowResize.spec.js`
- `e2eColumnHeaderMenuAnchorTop` -- caller specs: `handsontable/src/plugins/dropdownMenu/__tests__/positioning.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/rtl/positioning.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/keyboardShortcuts/shiftOptionArrowDown.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/keyboardShortcuts/rtl/shiftOptionArrowDown.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/keyboardShortcuts/rtl/metaEnter.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/keyboardShortcuts/metaEnter.spec.js`, `handsontable/src/plugins/contextMenu/__tests__/rtl/positioning.spec.js`, `handsontable/src/plugins/contextMenu/__tests__/positioning.spec.js`
- `e2eMenuTickItemInlineStartFromRootLeft` -- caller specs: `handsontable/src/plugins/dropdownMenu/__tests__/positioning.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/rtl/positioning.spec.js`, `handsontable/src/plugins/contextMenu/__tests__/rtl/positioning.spec.js`, `handsontable/src/plugins/contextMenu/__tests__/positioning.spec.js`
- `e2eMergeCellsOpenEditorTallMergeTextareaParentOffset` -- caller spec: `handsontable/src/plugins/mergeCells/__tests__/openEditor.spec.js`
- **Miscellaneous density numeric helpers** (remaining bucket-C `e2eDensity_*`) -- caller specs across multiple feature spec files:
  - `e2eDensity_7d7cc669b9`, `e2eDensity_d199d17b67` -- `handsontable/src/plugins/manualRowMove/__tests__/scrolling.spec.js`
  - `e2eDensity_d97740ab8b`, `e2eDensity_0077155d83` -- `handsontable/src/plugins/pagination/__tests__/plugins/autoColumnSize.spec.js`
  - `e2eDensity_21de631a3d` -- `handsontable/src/editors/textEditor/__tests__/textEditor.spec.js`
  - `e2eDensity_6fb44e9a25`, `e2eDensity_73a19e226c` -- `handsontable/src/plugins/manualRowMove/__tests__/scrolling.spec.js`
  - `e2eDensity_95d19e5e71`, `e2eDensity_86a4cac668` -- `handsontable/src/plugins/dropdownMenu/__tests__/positioning.spec.js`, `handsontable/src/plugins/dropdownMenu/__tests__/rtl/positioning.spec.js`
  - `e2eDensity_e9b95cfc26` -- `handsontable/src/plugins/dragToScroll/__tests__/dragToScroll.spec.js`
  - `e2eDensity_0bf6b512ac` -- `handsontable/src/plugins/hiddenColumns/__tests__/plugins/manualColumnMove.spec.js`
  - `e2eDensity_d347abe8d6` -- `handsontable/src/plugins/autoRowSize/__tests__/autoRowSize.spec.js`
  - `e2eDensity_dc11ccdb89`, `e2eDensity_3bcf74979c` -- `handsontable/src/plugins/hiddenColumns/__tests__/plugins/autoColumnSize.spec.js`
  - `e2eDensity_012c64941a` -- `handsontable/src/plugins/pagination/__tests__/plugins/autoColumnSize.spec.js`
  - `e2eDensity_db9abac9c8` -- `handsontable/src/plugins/contextMenu/__tests__/contextMenu.spec.js`
  - `e2eDensity_2d086a6135` -- `handsontable/src/plugins/contextMenu/__tests__/keyboardShortcuts/shiftMetaBackslashOrShiftF10.spec.js`
  - `e2eDensity_0308b1f949` -- `handsontable/src/plugins/autoRowSize/__tests__/autoRowSize.spec.js`
  - `e2eDensity_a57d724d44` -- `handsontable/src/plugins/manualRowResize/__tests__/rtl/manualRowResize.spec.js`
  - `e2eDensity_9ece902862` -- `handsontable/src/plugins/contextMenu/__tests__/positioning.spec.js`
  - `e2eDensity_a4793c32d9` -- `handsontable/src/plugins/pagination/__tests__/ui.spec.js`
  - `e2eDensity_129ed1d57c` -- `handsontable/src/plugins/collapsibleColumns/__tests__/collapsibleColumns.spec.js`
  - `e2eDensity_d35d5683ec`, `e2eDensity_429cac7b61` -- `handsontable/src/editors/textEditor/__tests__/textEditor.spec.js`
  - `e2eDensity_a2f2c0beda` -- `handsontable/src/plugins/manualRowMove/__tests__/scrolling.spec.js`
  - `e2eDensity_7c3646ff31`, `e2eDensity_cefdabf33b` -- `handsontable/src/utils/__tests__/ghostTable.spec.js`
  - `e2eDensity_73e2af5849` -- `handsontable/src/plugins/manualRowMove/__tests__/scrolling.spec.js`
  - `e2eDensity_a738aa613c`, `e2eDensity_5bbc262bb3` -- `handsontable/src/plugins/hiddenColumns/__tests__/plugins/manualColumnResize.spec.js`
  - `e2eDensity_ff544a9b2b` -- `handsontable/src/plugins/autoRowSize/__tests__/autoRowSize.spec.js`
  - `e2eDensity_fe455d5781`, `e2eDensity_8b9c83b3f3` -- `handsontable/src/plugins/autoRowSize/__tests__/autoRowSize.spec.js`
