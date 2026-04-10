describe('settings', () => {
  describe('fixedRowsBottom', () => {
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

    describe('defined in constructor', () => {
      it('should show rows headers', async() => {
        handsontable({
          fixedRowsBottom: 3
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(3);
      });

      it('should show rows headers when headers are enabled', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('thead tr').length).toBe(0);
        expect(getBottomClone().find('tbody tr').length).toBe(2);
      });
    });

    describe('defined in updateSettings', () => {
      it('should increase fixed rows', async() => {
        handsontable({
          fixedRowsBottom: 2
        });

        await updateSettings({
          fixedRowsBottom: 4
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(4);
      });

      it('should decrease fixed rows', async() => {
        handsontable({
          fixedRowsBottom: 4
        });

        await updateSettings({
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(2);
      });

      it('should create fixed rows when they are disabled earlier', async() => {
        handsontable({
          fixedRowsBottom: 0
        });

        await updateSettings({
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(2);
      });

      it('should disable fixed rows', async() => {
        handsontable({
          fixedRowsBottom: 2
        });

        await updateSettings({
          fixedRowsBottom: 0
        });

        expect(getBottomClone().find('tbody tr').length).toBe(0);
        expect(getInlineStartClone().height()).toBe(0);
      });

      it('should not throw errors while scrolling vertically when fixed rows was set', async() => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };
        handsontable({
          data: createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
        });

        await updateSettings({
          fixedRowsBottom: 2
        });

        await waitForNextAnimationFrames(2);

        await scrollViewportTo({
          row: 30,
          col: 30,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        expect(spy.test.calls.count()).toBe(0);
        window.onerror = prevError;
      });
    });

    it('should synchronize scroll with master table', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 200,
        height: 200,
        rowHeaders: true,
        fixedRowsBottom: 2,
      });

      await scrollViewportHorizontally(100);

      expect(getBottomClone().find('.wtHolder').scrollLeft()).toBe(getMaster().find('.wtHolder').scrollLeft());
    });

    it('should overwrite td value in fixed bottom rows when fixedRowsBottom is equal to one', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        fixedRowsBottom: 1
      });

      expect(getBottomClone().find('tbody tr:eq(0) td:eq(0)').html()).toEqual('A20');

      const td = getCell(19, 0, true);

      td.innerHTML = 'test';

      expect(getBottomClone().find('tbody tr:eq(0) td:eq(0)').html()).toEqual('test');
    });

    it('should limit fixed rows to dataset rows length', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        fixedRowsBottom: 3
      });

      expect(getBottomClone().find('tbody tr').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(2, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(1, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(0, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(0);

      await updateSettings({
        data: createSpreadsheetData(1, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(2, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(3, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(4, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(3);
    });

    it('should not render column header with doubled border after inserting a new row (#7065)', async() => {
      const layout = getThemeLayout();

      handsontable({
        data: createSpreadsheetData(0, 0),
        colHeaders: true,
        rowHeaders: true,
        fixedRowsBottom: 3,
      });

      await alter('insert_row_above', 0);

      // header + 1 data row
      expect(getMaster().height()).toBe(layout.overlayHeight({ rows: 2 }));
      // header only (with data present, no first-row compensation)
      expect(getTopClone().height()).toBe(layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false }));
      expect(getTopInlineStartClone().height()).toBe(
        layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false })
      );
      expect(getInlineStartClone().height()).toBe(layout.overlayHeight({ rows: 2 }));
      // bottom clone: 1 row
      expect(getBottomClone().height()).toBe(layout.overlayHeight({ rows: 1 }));
      expect(getBottomInlineStartClone().height()).toBe(layout.overlayHeight({ rows: 1 }));

      await alter('insert_row_above', 0);

      // header + 2 data rows
      expect(getMaster().height()).toBe(layout.overlayHeight({ rows: 3 }));
      expect(getTopClone().height()).toBe(layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false }));
      expect(getTopInlineStartClone().height()).toBe(
        layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false })
      );
      expect(getInlineStartClone().height()).toBe(layout.overlayHeight({ rows: 3 }));
      // bottom clone: 2 rows
      expect(getBottomClone().height()).toBe(layout.overlayHeight({ rows: 2 }));
      expect(getBottomInlineStartClone().height()).toBe(layout.overlayHeight({ rows: 2 }));
    });

    it('should not display double border when `window` is a scrollable container', async() => {
      const layout = getThemeLayout();

      handsontable({
        startRows: 200,
        colHeaders: true,
        fixedRowsBottom: 1,
        columns: [{}]
      });

      expect(getTopClone().height()).toBe(layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false }));

      await updateSettings({ fixedRowsBottom: 0 });

      expect(getTopClone().height()).toBe(layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false }));

      await updateSettings({ fixedRowsBottom: 1 });

      expect(getTopClone().height()).toBe(layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false }));

      await updateSettings({ data: [] });

      // The only header (when there is no cells - even when the `fixedRowsBottom` isn't defined) has such height.
      expect(getTopClone().height()).toBe(layout.firstRenderedRowDefaultHeight);
    });

    it('should not throw an error when the row is removed from the bottom overlay (#dev-2351)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        fixedRowsBottom: 1,
        rowHeaders: true,
        colHeaders: true,
      });

      await selectRows(1);

      expect(() => {
        // eslint-disable-next-line handsontable/require-await
        alter('remove_row', 1);
      }).not.toThrow();
    });
  });
});
