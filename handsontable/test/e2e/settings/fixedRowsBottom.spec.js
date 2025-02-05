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
      it('should show rows headers', () => {
        handsontable({
          fixedRowsBottom: 3
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(3);
      });

      it('should show rows headers when headers are enabled', () => {
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
      it('should increase fixed rows', () => {
        handsontable({
          fixedRowsBottom: 2
        });

        updateSettings({
          fixedRowsBottom: 4
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(4);
      });

      it('should decrease fixed rows', () => {
        handsontable({
          fixedRowsBottom: 4
        });

        updateSettings({
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(2);
      });

      it('should create fixed rows when they are disabled earlier', () => {
        handsontable({
          fixedRowsBottom: 0
        });

        updateSettings({
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(2);
      });

      it('should disable fixed rows', () => {
        handsontable({
          fixedRowsBottom: 2
        });

        updateSettings({
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
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
        });

        updateSettings({
          fixedRowsBottom: 2
        });

        await sleep(100);

        scrollViewportTo({
          row: 30,
          col: 30,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        await sleep(100);

        expect(spy.test.calls.count()).toBe(0);
        window.onerror = prevError;
      });
    });

    it('should synchronize scroll with master table', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 50),
        width: 200,
        height: 200,
        rowHeaders: true,
        fixedRowsBottom: 2,
      });

      getMaster().find('.wtHolder').scrollLeft(100);

      await sleep(10);

      expect(getBottomClone().find('.wtHolder').scrollLeft()).toBe(getMaster().find('.wtHolder').scrollLeft());
    });

    it('should overwrite td value in fixed bottom rows when fixedRowsBottom is equal to one', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 10),
        fixedRowsBottom: 1
      });

      expect(getBottomClone().find('tbody tr:eq(0) td:eq(0)').html()).toEqual('A20');

      const td = hot.getCell(19, 0, true);

      td.innerHTML = 'test';

      expect(getBottomClone().find('tbody tr:eq(0) td:eq(0)').html()).toEqual('test');
    });

    it('should limit fixed rows to dataset rows length', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        fixedRowsBottom: 3
      });

      expect(getBottomClone().find('tbody tr').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(2, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(0, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(0);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(2, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(4, 3),
      });

      expect(getBottomClone().find('tbody tr').length).toBe(3);
    });

    it('should not render column header with doubled border after inserting a new row (#7065)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(0, 0),
        colHeaders: true,
        rowHeaders: true,
        fixedRowsBottom: 3,
      });

      alter('insert_row_above', 0);

      expect(getMaster().height()).forThemes(({ classic, main }) => {
        classic.toBe(50); // 25px corner + 25px added row
        main.toBe(59);
      });
      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(26); // 26px as rowHeaders is enabled
        main.toBe(29);
      });
      expect(getTopInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(26); // 26px as rowHeaders is enabled
        main.toBe(29);
      });
      expect(getInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(50);
        main.toBe(59);
      });
      expect(getBottomClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(24);
        main.toBe(30);
      });
      expect(getBottomInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(24);
        main.toBe(30);
      });

      alter('insert_row_above', 0);

      expect(getMaster().height()).forThemes(({ classic, main }) => {
        classic.toBe(73);
        main.toBe(88);
      });
      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(26);
        main.toBe(29);
      });
      expect(getTopInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(26);
        main.toBe(29);
      });
      expect(getInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(73);
        main.toBe(88);
      });
      expect(getBottomClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(47);
        main.toBe(59);
      });
      expect(getBottomInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(47);
        main.toBe(59);
      });
    });

    it('should not display double border when `window` is a scrollable container', () => {
      handsontable({
        startRows: 200,
        colHeaders: true,
        fixedRowsBottom: 1,
        columns: [{}]
      });

      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(26);
        main.toBe(29);
      });

      updateSettings({ fixedRowsBottom: 0 });

      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(26);
        main.toBe(29);
      });

      updateSettings({ fixedRowsBottom: 1 });

      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(26);
        main.toBe(29);
      });

      updateSettings({ data: [] });

      // The only header (when there is no cells - even when the `fixedRowsBottom` isn't defined) has such height.
      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(27);
        main.toBe(30);
      });
    });
  });
});
