describe('Selection extending', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Shift + PageDown"', () => {
    it('should extend the cell selection down by the height of the table viewport', async() => {
      if (getLoadedTheme() !== 'main') {
        pending();

        return;
      }

      const layout = getThemeLayout();
      const height = 120;

      handsontable({
        width: 180,
        height,
        startRows: 15,
        startCols: 3,
        viewportRowRenderingOffset: 10,
        viewportColumnRenderingOffset: 10,
      });

      if (layout.densityLevel === 'compact') {
        await selectCell(1, 1);
        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 4,1']);

        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 7,1']);

        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 10,1']);

        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 13,1']);

        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 14,1']);
      } else {
        await selectCell(1, 1);
        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 5,1']);

        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 9,1']);

        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 13,1']);

        await keyDownUp(['shift', 'pagedown']);

        expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
      `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 14,1']);
      }
    });

    it('should extend the cell selection down only for active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 8,
      });

      await selectCells([[0, 0, 0, 1], [1, 3, 1, 4], [2, 6, 2, 7]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'pagedown']);

      expect(`
        | 0 : 0 :   :   :   :   :   :   |
        |   :   :   : 0 : A :   :   :   |
        |   :   :   : 0 : 0 :   : 0 : 0 |
        |   :   :   : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,1',
        'highlight: 1,4 from: 1,3 to: 4,4',
        'highlight: 2,6 from: 2,6 to: 2,7',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'pagedown']);

      expect(`
        | 0 : A :   :   :   :   :   :   |
        | 0 : 0 :   : 0 : 0 :   :   :   |
        | 0 : 0 :   : 0 : 0 :   : 0 : 0 |
        | 0 : 0 :   : 0 : 0 :   :   :   |
        | 0 : 0 :   : 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: 0,0 to: 4,1',
        'highlight: 1,3 from: 1,3 to: 4,4',
        'highlight: 2,6 from: 2,6 to: 2,7',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'pagedown']);

      expect(`
        | 0 : 0 :   :   :   :   :   :   |
        | 0 : 0 :   : 0 : 0 :   :   :   |
        | 0 : 0 :   : 0 : 0 :   : 0 : A |
        | 0 : 0 :   : 0 : 0 :   : 0 : 0 |
        | 0 : 0 :   : 0 : 0 :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 4,1',
        'highlight: 1,3 from: 1,3 to: 4,4',
        'highlight: 2,7 from: 2,6 to: 4,7',
      ]);
    });

    it('should scroll the viewport repeatedly by the same number of pixels with keeping the initial ' +
       'selection viewport offset', async() => {
      handsontable({
        width: 180,
        height: 200,
        startRows: 100,
        startCols: 3
      });

      // select and scroll the viewport in that way the cell highlight is in the middle of the table viewport
      await selectCell(4, 1);

      await waitForNextAnimationFrames(2);

      await keyDownUp(['shift', 'pagedown']);

      await waitForNextAnimationFrames(2);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 4);

      await waitForNextAnimationFrames(2);

      await keyDownUp(['shift', 'pagedown']);

      await waitForNextAnimationFrames(2);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 4);

      await keyDownUp(['shift', 'pagedown']);

      await waitForNextAnimationFrames(2);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 4);
    });
  });
});
