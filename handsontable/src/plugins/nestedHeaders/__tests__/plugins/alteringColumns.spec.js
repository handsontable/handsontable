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

      hot().alter('insert_col_start', 2, 1); // inside Group B / B-left
      await render();

      expect(hot().countCols()).toBe(7);
      expect(headerColspan(0, 'Group B')).toBe(5);
      expect(headerColspan(1, 'B-left')).toBe(3);
      expect(headerColspan(1, 'B-right')).toBe(2);
    });

    it('should add a standalone header when a column is inserted at a group boundary', async() => {
      makeGrid();

      hot().alter('insert_col_start', 1, 1); // A | Group B boundary
      await render();

      expect(hot().countCols()).toBe(7);
      // Group B keeps its width; the new column is a standalone header.
      expect(headerColspan(0, 'Group B')).toBe(4);
    });

    it('should shrink the spanning groups when a column is removed from inside a group', async() => {
      makeGrid();

      hot().alter('remove_col', 2, 1); // inside Group B / B-left
      await render();

      expect(hot().countCols()).toBe(5);
      expect(headerColspan(0, 'Group B')).toBe(3);
      expect(headerColspan(1, 'B-left')).toBe(1);
    });

    it('should re-anchor a group label when its anchor column is removed', async() => {
      makeGrid();

      hot().alter('remove_col', 1, 2); // remove both B-left columns
      await render();

      expect(hot().countCols()).toBe(4);
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

        hot().alter(c.action[0], c.action[1], c.action[2]);
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

        hot().alter('insert_col_start', 0, 1); // shifts Group B right
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

        hot().alter('remove_col', 0, 1); // removes A, shifts Group B left to column 0
        await render();

        const afterRemove = groupHeader('Group B');

        expect(afterRemove.collapsed).toBe(true);
        expect(afterRemove.colspan).toBe(2);
      });

      it('should still expand correctly after a column was inserted (clonedTree rebuilt)', async() => {
        makeCollapsibleGrid();

        getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 1 });
        await render();

        hot().alter('insert_col_start', 0, 1); // Group B moves to visual column 2
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
  });
});
