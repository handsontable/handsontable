describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('inserting and removing columns', () => {
    function makeGrid(hiddenColumns) {
      handsontable({
        data: createSpreadsheetData(5, 6),
        colHeaders: true,
        width: 800,
        height: 250,
        nestedHeaders: [
          ['A', { label: 'Group B', colspan: 4 }, 'C'],
          ['A', { label: 'B-left', colspan: 2 }, { label: 'B-right', colspan: 2 }, 'C'],
          ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
        ],
        hiddenColumns: hiddenColumns ? { columns: hiddenColumns, indicators: true } : true,
      });
    }

    // Rendered colspan of the first header TH (in the given thead row) whose label matches.
    function headerColspan(rowIndex, label) {
      const tr = getTopClone().find('thead tr')[rowIndex];
      const th = Array.from(tr.querySelectorAll('th')).find((cell) => {
        const header = cell.querySelector('.colHeader');

        return header && header.innerText === label;
      });

      return th ? (parseInt(th.getAttribute('colspan'), 10) || 1) : null;
    }

    function widthOf(el) {
      return Math.round(el.getBoundingClientRect().width);
    }

    function headerBodyWidths() {
      const bodyTotal = Array.from(getMaster().find('tbody tr:eq(0) td'))
        .reduce((sum, td) => sum + widthOf(td), 0);
      const headerTotal = Array.from(getMaster().find('thead tr')[0].querySelectorAll('th'))
        .reduce((sum, th) => sum + widthOf(th), 0);

      return { bodyTotal, headerTotal };
    }

    it('should extend the spanning groups when a column is inserted inside a group', async() => {
      makeGrid();

      await alter('insert_col_start', 2, 1); // inside Group B / B-left
      await render();

      expect(countCols()).toBe(7);
      expect(headerColspan(0, 'Group B')).toBe(5);
      expect(headerColspan(1, 'B-left')).toBe(3);
      expect(headerColspan(1, 'B-right')).toBe(2);
    });

    it('should add a standalone header when a column is inserted at a group boundary', async() => {
      makeGrid();

      await alter('insert_col_start', 1, 1); // A | Group B boundary
      await render();

      expect(countCols()).toBe(7);
      // Group B keeps its width; the new column is a standalone header.
      expect(headerColspan(0, 'Group B')).toBe(4);
    });

    it('should shrink the spanning groups when a column is removed from inside a group', async() => {
      makeGrid();

      await alter('remove_col', 2, 1); // inside Group B / B-left
      await render();

      expect(countCols()).toBe(5);
      expect(headerColspan(0, 'Group B')).toBe(3);
      expect(headerColspan(1, 'B-left')).toBe(1);
    });

    it('should re-anchor a group label when its anchor column is removed', async() => {
      makeGrid();

      await alter('remove_col', 1, 2); // remove both B-left columns
      await render();

      expect(countCols()).toBe(4);
      // Group B survives shrunk; B-right becomes the first child.
      expect(headerColspan(0, 'Group B')).toBe(2);
      expect(headerColspan(1, 'B-right')).toBe(2);
    });

    it('should keep the header aligned with the body across insert/remove positions and hidden columns', async() => {
      const cases = [
        { hidden: undefined, action: ['insert_col_start', 0, 1] },
        { hidden: undefined, action: ['insert_col_start', 1, 1] },
        { hidden: undefined, action: ['insert_col_start', 2, 1] },
        { hidden: undefined, action: ['insert_col_start', 3, 1] },
        { hidden: undefined, action: ['insert_col_start', 5, 1] },
        { hidden: undefined, action: ['insert_col_end', 5, 1] },
        { hidden: undefined, action: ['insert_col_start', 2, 3] },
        { hidden: undefined, action: ['remove_col', 0, 1] },
        { hidden: undefined, action: ['remove_col', 2, 1] },
        { hidden: undefined, action: ['remove_col', 5, 1] },
        { hidden: undefined, action: ['remove_col', 1, 2] },
        { hidden: [4], action: ['insert_col_start', 2, 1] },
        { hidden: [4], action: ['remove_col', 2, 1] },
        { hidden: [1, 3], action: ['insert_col_start', 2, 1] },
      ];

      for (let i = 0; i < cases.length; i++) {
        const c = cases[i];

        if (i > 0) {
          destroy();
        }

        makeGrid(c.hidden);

        await alter(c.action[0], c.action[1], c.action[2]);
        await render(); // eslint-disable-line no-await-in-loop

        const { bodyTotal, headerTotal } = headerBodyWidths();
        const bodyCells = getMaster().find('tbody tr:eq(0) td').length;
        const bottomHeaderCells = Array.from(getMaster().find('thead tr').last()[0].querySelectorAll('th'))
          .filter(th => !th.classList.contains('hiddenHeader')).length;

        expect(headerTotal)
          .withContext(`case #${i} [${c.action.join(',')}] hidden=${c.hidden} header/body width`)
          .toBe(bodyTotal);
        expect(bottomHeaderCells)
          .withContext(`case #${i} [${c.action.join(',')}] bottom header cells vs body`)
          .toBe(bodyCells);
      }
    });

    describe('preserving collapsed state', () => {
      function makeCollapsibleGrid() {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          width: 800,
          height: 250,
          nestedHeaders: [
            ['A', { label: 'Group B', colspan: 4 }, 'C'],
            ['A', { label: 'B-left', colspan: 2 }, { label: 'B-right', colspan: 2 }, 'C'],
            ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
          ],
          collapsibleColumns: true,
          hiddenColumns: { columns: [], indicators: true },
        });
      }

      // Returns the rendered colspan + collapse state of the first header TH matching the label.
      function groupHeader(label) {
        const th = Array.from(getTopClone().find('thead th')).find((cell) => {
          const header = cell.querySelector('.colHeader');

          return header && header.innerText === label;
        });

        if (!th) {
          return null;
        }

        return {
          colspan: parseInt(th.getAttribute('colspan'), 10) || 1,
          collapsed: !!th.querySelector('.collapsibleIndicator.collapsed'),
          expanded: !!th.querySelector('.collapsibleIndicator.expanded'),
        };
      }

      it('should keep the collapsed indicator after inserting a column before the group', async() => {
        makeCollapsibleGrid();

        getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 1 });
        await render();

        expect(groupHeader('Group B').collapsed).toBe(true);

        await alter('insert_col_start', 0, 1); // shifts Group B right
        await render();

        // The indicator must still read "collapsed", and the group must stay narrow.
        const afterInsert = groupHeader('Group B');

        expect(afterInsert.collapsed).toBe(true);
        expect(afterInsert.colspan).toBe(2);
      });

      it('should keep the collapsed indicator after removing a column before the group', async() => {
        makeCollapsibleGrid();

        getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 1 });
        await render();

        await alter('remove_col', 0, 1); // removes A, shifts Group B left to column 0
        await render();

        const afterRemove = groupHeader('Group B');

        expect(afterRemove.collapsed).toBe(true);
        expect(afterRemove.colspan).toBe(2);
      });

      it('should still expand correctly after a column was inserted (clonedTree rebuilt)', async() => {
        makeCollapsibleGrid();

        getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 1 });
        await render();

        await alter('insert_col_start', 0, 1); // Group B moves to visual column 2
        await render();

        getPlugin('collapsibleColumns').expandSection({ row: -3, col: 2 });
        await render();

        // Expanding must restore the full group (all four B columns visible again).
        const afterExpand = groupHeader('Group B');

        expect(afterExpand.expanded).toBe(true);
        expect(afterExpand.colspan).toBe(4);
        expect(getMaster().find('tbody tr:eq(0) td').length).toBe(7); // new col + A + B1..B4 + C
      });
    });

    describe('around a collapsed group', () => {
      // Builds the standard grid and collapses the B-left sub-group, so B2 (visual col 2) is
      // collapse-hidden and the visible columns are A, B1, B3, B4, C.
      async function makeCollapsedGrid() {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          width: 800,
          height: 250,
          nestedHeaders: [
            ['A', { label: 'Group B', colspan: 4 }, 'C'],
            ['A', { label: 'B-left', colspan: 2 }, { label: 'B-right', colspan: 2 }, 'C'],
            ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
          ],
          collapsibleColumns: true,
          hiddenColumns: { columns: [], indicators: true },
        });

        getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
        await render();
      }

      // Rendered colspan + collapse state of the first header TH matching the label.
      function groupState(label) {
        const th = Array.from(getTopClone().find('thead th')).find((cell) => {
          const header = cell.querySelector('.colHeader');

          return header && header.innerText === label;
        });

        if (!th) {
          return null;
        }

        return {
          colspan: parseInt(th.getAttribute('colspan'), 10) || 1,
          collapsed: !!th.querySelector('.collapsibleIndicator.collapsed'),
          expanded: !!th.querySelector('.collapsibleIndicator.expanded'),
        };
      }

      function bodyCellCount() {
        return getMaster().find('tbody tr:eq(0) td').length;
      }

      describe('inserting columns', () => {
        it('should keep the collapsed group intact when inserting a column to its left (outside)', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 1); // B1 - the visible representative of the collapsed B-left

          await alter('insert_col_start', 0, 1); // new column before everything
          await render();

          expect(countCols()).toBe(7);
          // Group B is untouched; B-left stays collapsed.
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 3 }));
          expect(groupState('B-left').collapsed).toBe(true);
          expect(groupState('B-right')).toEqual(jasmine.objectContaining({ colspan: 2 }));

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(6);
          // The selection follows its cell, shifted one column to the right.
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
        });

        it('should keep the collapsed group intact when inserting a column to its right (outside)', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 5); // C, to the right of Group B

          await alter('insert_col_start', 5, 1); // standalone column between Group B and C
          await render();

          expect(countCols()).toBe(7);
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 3 }));
          expect(groupState('B-left').collapsed).toBe(true);

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(6);
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 0,6']);
        });

        it('should extend the collapsed group when inserting a column inside it (at the visible part)', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 3); // B3, the first visible column of B-right

          await alter('insert_col_start', 3, 1); // inside Group B, at B-right's boundary
          await render();

          expect(countCols()).toBe(7);
          // Group B grows by one; the new column is a standalone child, B-right keeps its span.
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 4 }));
          expect(groupState('B-left').collapsed).toBe(true);
          expect(groupState('B-right')).toEqual(jasmine.objectContaining({ colspan: 2 }));

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(6);
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
        });

        // Inserting into the collapse-hidden span of B-left: the grid stays aligned and B-left
        // stays collapsed. The newly inserted column renders inside the (still collapsed) B-left,
        // so B-left shows colspan 2 while B2 remains collapse-hidden.
        it('should stay aligned and collapsed when inserting a column into the hidden span', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 1); // B1

          await alter('insert_col_start', 2, 1); // at visual col 2 (the collapse-hidden B2)
          await render();

          expect(countCols()).toBe(7);
          expect(groupState('B-left').collapsed).toBe(true);
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 4 }));

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(6);
          // B1 is to the left of the insertion point, so the selection does not move.
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
        });
      });

      describe('removing columns', () => {
        it('should keep the collapsed group intact when removing a column to its left (outside)', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 1); // B1

          await alter('remove_col', 0, 1); // remove A
          await render();

          expect(countCols()).toBe(5);
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 3 }));
          expect(groupState('B-left').collapsed).toBe(true);

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(4);
          expect(getDataAtCell(0, 0)).toBe('B1'); // B1's data is now the first column
          // The selection follows its cell one column to the left.
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
        });

        it('should keep the collapsed group intact when removing a column to its right (outside)', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 5); // C

          await alter('remove_col', 5, 1); // remove C (the selected column)
          await render();

          expect(countCols()).toBe(5);
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 3 }));
          expect(groupState('B-left').collapsed).toBe(true);

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(4);
          // The removed column was the last one, so the selection clamps to the new last column.
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
        });

        it('should shrink the collapsed group when removing a column inside it', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 3); // B3, the first visible column of B-right

          await alter('remove_col', 3, 1); // remove B3
          await render();

          expect(countCols()).toBe(5);
          // Group B loses a column; B-right re-anchors to B4 and becomes a single, non-collapsible column.
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 2 }));
          expect(groupState('B-left').collapsed).toBe(true);
          // B-right re-anchors to B4 and becomes a single, non-collapsible column.
          expect(groupState('B-right')).toEqual(
            jasmine.objectContaining({ colspan: 1, collapsed: false, expanded: false })
          );

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(4);
          // Removing the focused in-group column shifts the selection back; core's shiftColumns()
          // snaps it off the collapse-hidden B2 (visual col 2) to the nearest visible column
          // (B4, now visual col 3), so the highlight never rests on a hidden column.
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
          expect(columnIndexMapper().isHidden(3)).toBe(false);
        });

        it('should land selection on a visible column when removing via the context menu source', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 3); // B3

          // The context-menu removal path keeps the selection coordinates (which now point at the
          // next, visible column), so the highlight does not rest on the collapse-hidden B2.
          await alter('remove_col', 3, 1, 'ContextMenu.removeColumn');
          await render();

          const { col } = getSelectedRange()[0].highlight;

          expect(columnIndexMapper().isHidden(col)).toBe(false);
        });

        it('should drop the collapse when removing the collapse-hidden column itself', async() => {
          await makeCollapsedGrid();
          await selectCell(0, 1); // B1

          await alter('remove_col', 2, 1); // remove B2, the collapse-hidden column
          await render();

          expect(countCols()).toBe(5);
          // B-left now has a single column (B1), so it is no longer collapsible - the indicator is gone.
          expect(groupState('Group B')).toEqual(jasmine.objectContaining({ colspan: 3 }));
          expect(groupState('B-left')).toEqual(
            jasmine.objectContaining({ colspan: 1, collapsed: false, expanded: false })
          );

          const { headerTotal, bodyTotal } = headerBodyWidths();

          expect(headerTotal).toBe(bodyTotal);
          expect(bodyCellCount()).toBe(5); // B2 gone, nothing collapse-hidden anymore
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
        });
      });
    });
  });
});
