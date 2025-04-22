describe('manualColumnMove', () => {
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

  describe('selection', () => {
    it('should be shown properly when moving multiple columns from the left to the right', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      const $columnHeader = spec().$container.find('thead tr:eq(0) th:eq(4)');

      selectColumns(0, 2);

      spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseup');
      spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');

      $columnHeader.simulate('mouseover');
      $columnHeader.simulate('mousemove', {
        clientX: $columnHeader.offset().right - $columnHeader.width()
      });
      $columnHeader.simulate('mouseup');

      expect(getSelected()).toEqual([[-1, 1, 9, 3]]);
    });

    it('should be shown properly when moving multiple columns from the right to the left', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      const $columnHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');

      selectColumns(3, 5);

      spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseup');
      spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousedown');

      $columnHeader.simulate('mouseover');
      $columnHeader.simulate('mousemove', {
        clientX: $columnHeader.offset().left
      });
      $columnHeader.simulate('mouseup');

      expect(getSelected()).toEqual([[-1, 1, 9, 3]]);
    });

    describe('should be shown properly after undo action', () => {
      it('when moving multiple columns from the left to the right', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $columnHeader = spec().$container.find('thead tr:eq(0) th:eq(4)');

        selectColumns(0, 2);

        spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');
        spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseup');
        spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');

        $columnHeader.simulate('mouseover');
        $columnHeader.simulate('mousemove', {
          clientX: $columnHeader.offset().right - $columnHeader.width()
        });
        $columnHeader.simulate('mouseup');

        getPlugin('undoRedo').undo();

        expect(getSelected()).toEqual([[-1, 0, 9, 2]]);
      });

      it('when moving multiple columns from the right to the left', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $columnHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');

        selectColumns(3, 5);

        spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousedown');
        spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseup');
        spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousedown');

        $columnHeader.simulate('mouseover');
        $columnHeader.simulate('mousemove', {
          clientX: $columnHeader.offset().left
        });
        $columnHeader.simulate('mouseup');

        getPlugin('undoRedo').undo();

        expect(getSelected()).toEqual([[-1, 3, 9, 5]]);
      });
    });

    describe('should be shown properly after redo action', () => {
      it('when moving multiple columns from the left to the right', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $columnHeader = spec().$container.find('thead tr:eq(0) th:eq(4)');

        selectColumns(0, 2);

        spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');
        spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseup');
        spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');

        $columnHeader.simulate('mouseover');
        $columnHeader.simulate('mousemove', {
          clientX: $columnHeader.offset().right - $columnHeader.width()
        });
        $columnHeader.simulate('mouseup');

        getPlugin('undoRedo').undo();
        hot.getPlugin('undoRedo').redo();

        expect(getSelected()).toEqual([[-1, 1, 9, 3]]);
      });

      it('when moving multiple columns from the right to the left', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $columnHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');

        selectColumns(3, 5);

        spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousedown');
        spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseup');
        spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousedown');

        $columnHeader.simulate('mouseover');
        $columnHeader.simulate('mousemove', {
          clientX: $columnHeader.offset().left
        });
        $columnHeader.simulate('mouseup');

        getPlugin('undoRedo').undo();
        hot.getPlugin('undoRedo').redo();

        expect(getSelected()).toEqual([[-1, 1, 9, 3]]);
      });
    });
  });
});
