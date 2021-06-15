import HyperFormula from 'hyperformula';

describe('Row/column moving with the Formulas plugin enabled.', () => {
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

  describe('Moving rows', () => {
    describe('from the API', () => {
      it('should support the `moveRow`/`moveRows` methods', () => {
        const hot = handsontable({
          data: [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]],
          formulas: { engine: HyperFormula },
          manualRowMove: true
        });

        selectCell(0, 0);

        const movePlugin = hot.getPlugin('manualRowMove');

        movePlugin.moveRow(2, 0); // 2, 0, 1, 3, 4, (...)
        movePlugin.moveRow(3, 2); // 2, 0, 3, 1, 4, (...)
        movePlugin.moveRow(3, 1); // 2, 1, 0, 3, 4, (...)

        expect(hot.getData()).toEqual([
          [2], [1], [0], [3], [4], [5], [6], [7], [8], [9]
        ]);

        movePlugin.moveRows([1, 7, 4, 5], 1);

        expect(hot.getData()).toEqual([
          [2], [1], [7], [4], [5], [0], [3], [6], [8], [9]
        ]);

        movePlugin.moveRows([1, 7, 4, 5], 3);

        expect(hot.getData()).toEqual([
          [2], [7], [4], [1], [6], [5], [0], [3], [8], [9]
        ]);

        movePlugin.moveRows([0], 1);

        expect(hot.getData()).toEqual([
          [7], [2], [4], [1], [6], [5], [0], [3], [8], [9]
        ]);

        render();

        // Selection should not change when using the API methods.
        expect(getSelected()[0]).toEqual([0, 0, 0, 0]);
      });

      it('should support the `dragRow`/`dragRows` methods', () => {
        const hot = handsontable({
          data: [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]],
          formulas: { engine: HyperFormula },
          manualRowMove: true
        });

        selectCell(0, 0);

        const movePlugin = hot.getPlugin('manualRowMove');

        movePlugin.dragRow(2, 0); // 2, 0, 1, 3, 4, (...)
        movePlugin.dragRow(3, 2); // 2, 0, 3, 1, 4, (...)
        movePlugin.dragRow(3, 1); // 2, 1, 0, 3, 4, (...)

        expect(hot.getData()).toEqual([
          [2], [1], [0], [3], [4], [5], [6], [7], [8], [9]
        ]);

        movePlugin.dragRows([1, 7, 4, 5], 1);

        expect(hot.getData()).toEqual([
          [2], [1], [7], [4], [5], [0], [3], [6], [8], [9]
        ]);

        movePlugin.dragRows([1, 7, 4, 5], 3);

        expect(hot.getData()).toEqual([
          [2], [7], [1], [6], [5], [0], [4], [3], [8], [9]
        ]);

        movePlugin.dragRows([0], 2);

        expect(hot.getData()).toEqual([
          [7], [2], [1], [6], [5], [0], [4], [3], [8], [9]
        ]);

        render();

        // Selection should not change when using the API methods.
        expect(getSelected()[0]).toEqual([0, 0, 0, 0]);
      });
    });

    describe('from the UI', () => {
      it('should perform the dragging action after it\'s done in the UI', () => {
        const hot = handsontable({
          data: [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]],
          formulas: { engine: HyperFormula },
          rowHeaders: true,
          colHeaders: true,
          manualRowMove: true
        });

        let $fistHeader = spec().$container.find('tbody tr:eq(3) th:eq(0)');
        let $secondHeader = spec().$container.find('tbody tr:eq(5) th:eq(0)');

        $fistHeader.simulate('mousedown');
        $fistHeader.simulate('mouseup');
        $fistHeader.simulate('mousedown');

        $secondHeader.simulate('mouseover');

        $secondHeader.simulate('mousemove', {
          clientX: $secondHeader.offset().left - $secondHeader.width() - 50
        });

        $secondHeader.simulate('mouseup');

        expect(hot.getData()).toEqual([
          [0], [1], [2], [4], [3], [5], [6], [7], [8], [9]
        ]);

        $fistHeader = spec().$container.find('tbody tr:eq(5) th:eq(0)');
        $secondHeader = spec().$container.find('tbody tr:eq(0) th:eq(0)');

        selectRows(5, 8);

        $fistHeader.simulate('mousedown');
        $fistHeader.simulate('mouseup');
        $fistHeader.simulate('mousedown');

        $secondHeader.simulate('mouseover');

        $secondHeader.simulate('mousemove', {
          clientX: $secondHeader.offset().left - $secondHeader.width() - 50
        });

        $secondHeader.simulate('mouseup');

        expect(hot.getData()).toEqual([
          [5], [6], [7], [8], [0], [1], [2], [4], [3], [9]
        ]);

        // Selection should follow the moved elements.
        expect(getSelected()[0]).toEqual([0, -1, 3, 0]);
      });
    });
  });

  describe('Moving columns', () => {
    describe('from the API', () => {
      it('should support the `moveRow`/`moveRows` methods', () => {
        const hot = handsontable({
          data: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
          formulas: { engine: HyperFormula },
          manualColumnMove: true
        });

        selectCell(0, 0);

        const movePlugin = hot.getPlugin('manualColumnMove');

        movePlugin.moveColumn(2, 0); // 2, 0, 1, 3, 4, (...)
        movePlugin.moveColumn(3, 2); // 2, 0, 3, 1, 4, (...)
        movePlugin.moveColumn(3, 1); // 2, 1, 0, 3, 4, (...)

        expect(hot.getData()).toEqual([
          [2, 1, 0, 3, 4, 5, 6, 7, 8, 9]
        ]);

        movePlugin.moveColumns([1, 7, 4, 5], 1);

        expect(hot.getData()).toEqual([
          [2, 1, 7, 4, 5, 0, 3, 6, 8, 9]
        ]);

        movePlugin.moveColumns([1, 7, 4, 5], 3);

        expect(hot.getData()).toEqual([
          [2, 7, 4, 1, 6, 5, 0, 3, 8, 9]
        ]);

        movePlugin.moveColumns([0], 1);

        expect(hot.getData()).toEqual([
          [7, 2, 4, 1, 6, 5, 0, 3, 8, 9]
        ]);

        render();

        // Selection should not change when using the API methods.
        expect(getSelected()[0]).toEqual([0, 0, 0, 0]);
      });

      it('should support the `dragRow`/`dragRows` methods', () => {
        const hot = handsontable({
          data: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
          formulas: { engine: HyperFormula },
          manualColumnMove: true
        });

        selectCell(0, 0);

        const movePlugin = hot.getPlugin('manualColumnMove');

        movePlugin.dragColumn(2, 0); // 2, 0, 1, 3, 4, (...)
        movePlugin.dragColumn(3, 2); // 2, 0, 3, 1, 4, (...)
        movePlugin.dragColumn(3, 1); // 2, 1, 0, 3, 4, (...)

        expect(hot.getData()).toEqual([
          [2, 1, 0, 3, 4, 5, 6, 7, 8, 9]
        ]);

        movePlugin.dragColumns([1, 7, 4, 5], 1);

        expect(hot.getData()).toEqual([
          [2, 1, 7, 4, 5, 0, 3, 6, 8, 9]
        ]);

        movePlugin.dragColumns([1, 7, 4, 5], 3);

        expect(hot.getData()).toEqual([
          [2, 7, 1, 6, 5, 0, 4, 3, 8, 9]
        ]);

        movePlugin.dragColumns([0], 2);

        expect(hot.getData()).toEqual([
          [7, 2, 1, 6, 5, 0, 4, 3, 8, 9]
        ]);

        render();

        // Selection should not change when using the API methods.
        expect(getSelected()[0]).toEqual([0, 0, 0, 0]);
      });

      it('should sync the data from the moved rows properly', () => {
        handsontable({
          data: [
            [1], ['test'], ['=A1 + 55'], ['=$A3']
          ],
          colHeaders: true,
          manualRowMove: [2, 3, 1, 0],
          formulas: { engine: HyperFormula }
        });

        expect(getSourceDataAtCell(0, 0)).toEqual('=A4 + 55');
        expect(getSourceDataAtCell(1, 0)).toEqual('=$A1');
        expect(getSourceDataAtCell(2, 0)).toEqual('test');
        expect(getSourceDataAtCell(3, 0)).toEqual(1);
      });
    });

    describe('from the UI', () => {
      it('should perform the dragging action after it\'s done in the UI', () => {
        const hot = handsontable({
          data: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
          formulas: { engine: HyperFormula },
          rowHeaders: true,
          colHeaders: true,
          manualColumnMove: true
        });

        let $fistHeader = spec().$container.find('thead tr:eq(0) th:eq(4)');
        let $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(6)');

        $fistHeader.simulate('mousedown');
        $fistHeader.simulate('mouseup');
        $fistHeader.simulate('mousedown');

        $secondHeader.simulate('mouseover');

        $secondHeader.simulate('mousemove', {
          clientX: $secondHeader.offset().left - $secondHeader.width() - 50
        });

        $secondHeader.simulate('mouseup');

        expect(hot.getData()).toEqual([
          [0, 1, 2, 4, 3, 5, 6, 7, 8, 9]
        ]);

        $fistHeader = spec().$container.find('thead tr:eq(0) th:eq(6)');
        $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(0)');

        selectColumns(5, 8);

        $fistHeader.simulate('mousedown');
        $fistHeader.simulate('mouseup');
        $fistHeader.simulate('mousedown');

        $secondHeader.simulate('mouseover');

        $secondHeader.simulate('mousemove', {
          clientX: $secondHeader.offset().left - $secondHeader.width() - 50
        });

        $secondHeader.simulate('mouseup');

        expect(hot.getData()).toEqual([
          [5, 6, 7, 8, 0, 1, 2, 4, 3, 9]
        ]);

        // Selection should follow the moved elements.
        expect(getSelected()[0]).toEqual([-1, 0, 0, 3]);
      });
    });

    it('should sync the data from the moved columns properly', () => {
      handsontable({
        data: [
          [1, 'test', '=A1 + 55', '=$C1']
        ],
        colHeaders: true,
        manualColumnMove: [2, 3, 1, 0],
        formulas: { engine: HyperFormula }
      });

      expect(getSourceDataAtCell(0, 0)).toEqual('=D1 + 55');
      expect(getSourceDataAtCell(0, 1)).toEqual('=$A1');
      expect(getSourceDataAtCell(0, 2)).toEqual('test');
      expect(getSourceDataAtCell(0, 3)).toEqual(1);
    });
  });
});
