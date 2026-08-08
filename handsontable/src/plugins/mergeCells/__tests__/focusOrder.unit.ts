import { FocusOrder } from '../focusOrder';

describe('MergeCells', () => {
  describe('FocusOrder', () => {
    const GRID_SIZE = 30;

    /**
     * Creates a minimal IndexMapper mock backed by a set of hidden indexes.
     */
    function createMapperMock(hiddenIndexes) {
      const hidden = new Set(hiddenIndexes);

      return {
        isHidden: index => hidden.has(index),
        getNearestNotHiddenIndex: (fromIndex, direction) => {
          for (let i = fromIndex; i >= 0 && i < GRID_SIZE; i += direction) {
            if (!hidden.has(i)) {
              return i;
            }
          }

          return null;
        },
      };
    }

    /**
     * Creates a minimal CellRange mock exposing only what FocusOrder consumes.
     */
    function createRangeMock(rowFrom, colFrom, rowTo, colTo, highlightRow, highlightCol) {
      return {
        getTopStartCorner: () => ({ row: rowFrom, col: colFrom }),
        getBottomEndCorner: () => ({ row: rowTo, col: colTo }),
        highlight: {
          clone: () => ({
            normalize: () => ({ row: highlightRow, col: highlightCol }),
          }),
        },
      };
    }

    /**
     * Builds a merged-cells getter from a list of merge rectangles.
     */
    function createMergedCellsGetter(merges) {
      const matrix = new Map();

      merges.forEach((merge) => {
        for (let r = merge.row; r < merge.row + merge.rowspan; r++) {
          if (!matrix.has(r)) {
            matrix.set(r, new Map());
          }

          for (let c = merge.col; c < merge.col + merge.colspan; c++) {
            matrix.get(r).set(c, merge);
          }
        }
      });

      return (row, column) => matrix.get(row)?.get(column) ?? false;
    }

    /**
     * The pre-optimization algorithm: visits every cell of every selected range and materializes
     * one node per visible non-merged cell plus one node per fully-contained merged cell. Kept
     * here as the source of truth the lazy implementation must agree with.
     */
    function buildReferenceOrder(ranges, mergedCellsGetter, rowMapper, colMapper, orientation) {
      const list = [];
      let currentIndex = null;

      ranges.forEach((range, selectionLayer) => {
        const visited = new Set();
        const topStart = range.getTopStartCorner();
        const bottomEnd = range.getBottomEndCorner();
        const highlight = range.highlight.clone().normalize();
        const outerFrom = orientation === 'horizontal' ? topStart.row : topStart.col;
        const outerTo = orientation === 'horizontal' ? bottomEnd.row : bottomEnd.col;
        const innerFrom = orientation === 'horizontal' ? topStart.col : topStart.row;
        const innerTo = orientation === 'horizontal' ? bottomEnd.col : bottomEnd.row;

        for (let outer = outerFrom; outer <= outerTo; outer++) {
          const outerMapper = orientation === 'horizontal' ? rowMapper : colMapper;

          if (outerMapper.isHidden(outer)) {
            continue; // eslint-disable-line no-continue
          }

          for (let inner = innerFrom; inner <= innerTo; inner++) {
            const innerMapper = orientation === 'horizontal' ? colMapper : rowMapper;

            if (innerMapper.isHidden(inner)) {
              continue; // eslint-disable-line no-continue
            }

            const row = orientation === 'horizontal' ? outer : inner;
            const column = orientation === 'horizontal' ? inner : outer;
            const mergeParent = mergedCellsGetter(row, column);

            if (mergeParent && visited.has(mergeParent)) {
              continue; // eslint-disable-line no-continue
            }

            let node = { selectionLayer, colStart: column, colEnd: column, rowStart: row, rowEnd: row };

            if (mergeParent) {
              visited.add(mergeParent);

              if (
                mergeParent.row < topStart.row ||
                mergeParent.row + mergeParent.rowspan - 1 > bottomEnd.row ||
                mergeParent.col < topStart.col ||
                mergeParent.col + mergeParent.colspan - 1 > bottomEnd.col
              ) {
                continue; // eslint-disable-line no-continue
              }

              node = {
                selectionLayer,
                colStart: mergeParent.col,
                colEnd: mergeParent.col + mergeParent.colspan - 1,
                rowStart: mergeParent.row,
                rowEnd: mergeParent.row + mergeParent.rowspan - 1,
              };
            }

            list.push(node);

            if (
              (row === highlight.row && column === highlight.col) ||
              (mergeParent &&
                highlight.row >= mergeParent.row &&
                highlight.row <= mergeParent.row + mergeParent.rowspan - 1 &&
                highlight.col >= mergeParent.col &&
                highlight.col <= mergeParent.col + mergeParent.colspan - 1)
            ) {
              currentIndex = list.length - 1;
            }
          }
        }
      });

      return { list, currentIndex };
    }

    /**
     * Replays the pre-optimization `setActiveNode`: first node in list order that matches the
     * layer and contains the point.
     */
    function referenceFindIndex(list, row, column, selectionLayerIndex) {
      for (let i = 0; i < list.length; i++) {
        const node = list[i];

        if (
          node.selectionLayer === selectionLayerIndex &&
          row >= node.rowStart && row <= node.rowEnd &&
          column >= node.colStart && column <= node.colEnd
        ) {
          return i;
        }
      }

      return null;
    }

    /**
     * Deterministic pseudo-random generator (Park-Miller), so failures are reproducible.
     */
    function createRandom(seed) {
      let state = (seed % 2147483647) || 1;

      return () => {
        state = (state * 16807) % 2147483647;

        return (state - 1) / 2147483646;
      };
    }

    it('should walk a plain selection cell by cell in both orders', () => {
      const rowMapper = createMapperMock([]);
      const colMapper = createMapperMock([]);
      const focusOrder = new FocusOrder({
        mergedCellsGetter: createMergedCellsGetter([]),
        rowIndexMapper: rowMapper,
        columnIndexMapper: colMapper,
      });

      focusOrder.buildFocusOrder([createRangeMock(1, 1, 2, 2, 1, 1)]);

      expect(focusOrder.getCurrentHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 1, rowEnd: 1, colStart: 1, colEnd: 1 });
      expect(focusOrder.getNextHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 1, rowEnd: 1, colStart: 2, colEnd: 2 });
      expect(focusOrder.getNextVerticalNode())
        .toEqual({ selectionLayer: 0, rowStart: 2, rowEnd: 2, colStart: 1, colEnd: 1 });
      expect(focusOrder.getPrevHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 2, rowEnd: 2, colStart: 2, colEnd: 2 });
      expect(focusOrder.getFirstHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 1, rowEnd: 1, colStart: 1, colEnd: 1 });
    });

    it('should merge a fully-contained merged cell into a single focus stop', () => {
      const merge = { row: 1, col: 1, rowspan: 2, colspan: 2 };
      const focusOrder = new FocusOrder({
        mergedCellsGetter: createMergedCellsGetter([merge]),
        rowIndexMapper: createMapperMock([]),
        columnIndexMapper: createMapperMock([]),
      });

      focusOrder.buildFocusOrder([createRangeMock(0, 0, 3, 3, 0, 0)]);

      // walk the first row: (0,0) -> (0,1) -> (0,2) -> (0,3) -> merge (anchored at 1,1 after 1,0)
      focusOrder.setNextNodeAsActive(); // -> (0,1) horizontally
      expect(focusOrder.getCurrentHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 0, rowEnd: 0, colStart: 1, colEnd: 1 });

      focusOrder.setActiveNode(1, 0, 0);
      expect(focusOrder.getNextHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 });

      // the merged cell occupies one stop; the next one after it is (1,3)
      focusOrder.setNextNodeAsActive();
      expect(focusOrder.getNextHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 1, rowEnd: 1, colStart: 3, colEnd: 3 });
    });

    it('should produce no focus stop for a merged cell that sticks out of the selection', () => {
      const merge = { row: 0, col: 0, rowspan: 3, colspan: 3 };
      const focusOrder = new FocusOrder({
        mergedCellsGetter: createMergedCellsGetter([merge]),
        rowIndexMapper: createMapperMock([]),
        columnIndexMapper: createMapperMock([]),
      });

      // the selection covers only part of the merge
      focusOrder.buildFocusOrder([createRangeMock(1, 1, 3, 3, 3, 3)]);

      // walking backward from (3,3) skips all cells of the partially-contained merge
      expect(focusOrder.getPrevHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 3, rowEnd: 3, colStart: 2, colEnd: 2 });

      focusOrder.setActiveNode(3, 1, 0);
      // previous in horizontal order: skips (2,2), (2,1) (merge body) and lands on (2,3)
      expect(focusOrder.getPrevHorizontalNode())
        .toEqual({ selectionLayer: 0, rowStart: 2, rowEnd: 2, colStart: 3, colEnd: 3 });
    });

    it('should agree with the reference implementation on randomized layouts', () => {
      const random = createRandom(1984);
      const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1));

      for (let round = 0; round < 40; round++) {
        // non-overlapping placement: one optional merge per 5x5 block of the 30x30 grid
        const merges = [];

        for (let blockRow = 0; blockRow < 6; blockRow++) {
          for (let blockColumn = 0; blockColumn < 6; blockColumn++) {
            if (random() < 0.4) {
              const rowspan = randomInt(1, 5);
              const colspan = randomInt(1, 5);

              if (rowspan === 1 && colspan === 1) {
                continue; // eslint-disable-line no-continue
              }

              merges.push({
                row: (blockRow * 5) + randomInt(0, 5 - rowspan),
                col: (blockColumn * 5) + randomInt(0, 5 - colspan),
                rowspan,
                colspan,
              });
            }
          }
        }

        const hiddenRows = new Set();
        const hiddenColumns = new Set();

        for (let i = randomInt(0, 3); i > 0; i--) {
          hiddenRows.add(randomInt(0, GRID_SIZE - 1));
        }
        for (let i = randomInt(0, 3); i > 0; i--) {
          hiddenColumns.add(randomInt(0, GRID_SIZE - 1));
        }

        const ranges = [];

        for (let i = randomInt(1, 3); i > 0; i--) {
          const rowA = randomInt(0, GRID_SIZE - 1);
          const rowB = randomInt(0, GRID_SIZE - 1);
          const colA = randomInt(0, GRID_SIZE - 1);
          const colB = randomInt(0, GRID_SIZE - 1);
          const rowFrom = Math.min(rowA, rowB);
          const rowTo = Math.max(rowA, rowB);
          const colFrom = Math.min(colA, colB);
          const colTo = Math.max(colA, colB);

          ranges.push(createRangeMock(
            rowFrom, colFrom, rowTo, colTo,
            randomInt(rowFrom, rowTo), randomInt(colFrom, colTo)
          ));
        }

        const rowMapper = createMapperMock(hiddenRows);
        const colMapper = createMapperMock(hiddenColumns);
        const mergedCellsGetter = createMergedCellsGetter(merges);
        const focusOrder = new FocusOrder({
          mergedCellsGetter,
          rowIndexMapper: rowMapper,
          columnIndexMapper: colMapper,
        });

        focusOrder.buildFocusOrder(ranges);

        const refH = buildReferenceOrder(ranges, mergedCellsGetter, rowMapper, colMapper, 'horizontal');
        const refV = buildReferenceOrder(ranges, mergedCellsGetter, rowMapper, colMapper, 'vertical');
        const context = `round ${round}`;

        expect({ context, value: focusOrder.getFirstHorizontalNode() })
          .toEqual({ context, value: refH.list[0] });
        expect({ context, value: focusOrder.getFirstVerticalNode() })
          .toEqual({ context, value: refV.list[0] });
        expect({ context, value: focusOrder.getCurrentHorizontalNode() })
          .toEqual({ context, value: refH.currentIndex === null ? undefined : refH.list[refH.currentIndex] });
        expect({ context, value: focusOrder.getCurrentVerticalNode() })
          .toEqual({ context, value: refV.currentIndex === null ? undefined : refV.list[refV.currentIndex] });

        if (refH.currentIndex === null || refV.currentIndex === null) {
          continue; // eslint-disable-line no-continue
        }

        // walk forward through the whole circular order and one step beyond
        let hIndex = refH.currentIndex;
        let vIndex = refV.currentIndex;
        const steps = Math.min(refH.list.length + 2, 40);

        for (let step = 0; step < steps; step++) {
          const stepContext = `${context}, forward step ${step}`;

          expect({ context: stepContext, value: focusOrder.getNextHorizontalNode() })
            .toEqual({ context: stepContext, value: refH.list[(hIndex + 1) % refH.list.length] });
          expect({ context: stepContext, value: focusOrder.getPrevHorizontalNode() })
            .toEqual({
              context: stepContext,
              value: refH.list[(hIndex - 1 + refH.list.length) % refH.list.length],
            });
          expect({ context: stepContext, value: focusOrder.getNextVerticalNode() })
            .toEqual({ context: stepContext, value: refV.list[(vIndex + 1) % refV.list.length] });
          expect({ context: stepContext, value: focusOrder.getPrevVerticalNode() })
            .toEqual({
              context: stepContext,
              value: refV.list[(vIndex - 1 + refV.list.length) % refV.list.length],
            });

          if (random() < 0.5) {
            focusOrder.setNextNodeAsActive();
            hIndex = (hIndex + 1) % refH.list.length;
            vIndex = (vIndex + 1) % refV.list.length;
          } else {
            focusOrder.setPrevNodeAsActive();
            hIndex = (hIndex - 1 + refH.list.length) % refH.list.length;
            vIndex = (vIndex - 1 + refV.list.length) % refV.list.length;
          }

          expect({ context: stepContext, value: focusOrder.getCurrentHorizontalNode() })
            .toEqual({ context: stepContext, value: refH.list[hIndex] });
          expect({ context: stepContext, value: focusOrder.getCurrentVerticalNode() })
            .toEqual({ context: stepContext, value: refV.list[vIndex] });
        }

        // randomized setActiveNode round-trips
        for (let check = 0; check < 10; check++) {
          const row = randomInt(0, GRID_SIZE - 1);
          const column = randomInt(0, GRID_SIZE - 1);
          const layer = randomInt(0, ranges.length - 1);
          const foundH = referenceFindIndex(refH.list, row, column, layer);
          const foundV = referenceFindIndex(refV.list, row, column, layer);
          const checkContext = `${context}, setActiveNode(${row}, ${column}, ${layer})`;

          focusOrder.setActiveNode(row, column, layer);

          if (foundH !== null) {
            hIndex = foundH;
          }
          if (foundV !== null) {
            vIndex = foundV;
          }

          expect({ context: checkContext, value: focusOrder.getCurrentHorizontalNode() })
            .toEqual({ context: checkContext, value: refH.list[hIndex] });
          expect({ context: checkContext, value: focusOrder.getCurrentVerticalNode() })
            .toEqual({ context: checkContext, value: refV.list[vIndex] });
        }
      }
    });
  });
});
