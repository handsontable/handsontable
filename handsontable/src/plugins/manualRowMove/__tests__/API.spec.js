describe('manualRowMove API', () => {
  const id = 'testContainer';
  const arrayOfObjects = [
    { id: 1, name: 'Ted', lastName: 'Right' },
    { id: 2, name: 'Frank', lastName: 'Honest' },
    { id: 3, name: 'Joan', lastName: 'Well' },
    { id: 4, name: 'Sid', lastName: 'Strong' },
    { id: 5, name: 'Jane', lastName: 'Neat' },
    { id: 6, name: 'Chuck', lastName: 'Jackson' },
    { id: 7, name: 'Meg', lastName: 'Jansen' },
    { id: 8, name: 'Rob', lastName: 'Norris' },
    { id: 9, name: 'Sean', lastName: 'O\'Hara' },
    { id: 10, name: 'Eve', lastName: 'Branson' }
  ];

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('moveRow()', () => {
    it('should move single row from the bottom to the top', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRow(2, 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    });

    it('should move single row from the top to the bottom', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRow(0, 2);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });

    it('should revert change by two moves', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRow(1, 0);
      await render();

      getPlugin('manualRowMove').moveRow(1, 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    });

    it('should not move and not trigger the `afterRowMove` hook after try of moving row, when `beforeRowMove` return false', async() => {
      const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        beforeRowMove() {
          return false;
        },
        afterRowMove: afterMoveRowCallback
      });

      const result = getPlugin('manualRowMove').moveRow(0, 1);

      expect(afterMoveRowCallback).not.toHaveBeenCalled();
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      expect(result).toBeFalsy();
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving row to final index, which is too high', async() => {
      const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove: afterMoveRowCallback
      });

      const result = getPlugin('manualRowMove').moveRow(0, 1000);

      expect(afterMoveRowCallback).toHaveBeenCalledWith([0], 1000, undefined, false, false);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      expect(result).toBeFalsy();
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving row to final index, which is too low', async() => {
      const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove: afterMoveRowCallback
      });

      const result = getPlugin('manualRowMove').moveRow(0, -1);

      expect(afterMoveRowCallback).toHaveBeenCalledWith([0], -1, undefined, false, false);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      expect(result).toBeFalsy();
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving too high row', async() => {
      const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove: afterMoveRowCallback
      });

      const result = getPlugin('manualRowMove').moveRow(1000, 1);

      expect(afterMoveRowCallback).toHaveBeenCalledWith([1000], 1, undefined, false, false);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      expect(result).toBeFalsy();
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving too low row', async() => {
      const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove: afterMoveRowCallback
      });

      const result = getPlugin('manualRowMove').moveRow(-1, 1);

      expect(afterMoveRowCallback).toHaveBeenCalledWith([-1], 1, undefined, false, false);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      expect(result).toBeFalsy();
    });
  });

  describe('moveRows()', () => {
    it('should move multiple rows from the bottom to the top #1', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([7, 9, 8], 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('8');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('10');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('9');
    });

    it('should move multiple rows from the bottom to the top #2', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([9, 7, 8], 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('10');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('8');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('9');
    });

    it('should move multiple rows with mixed indexes #1', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([0, 1, 4], 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('5');
    });

    it('should move multiple rows with mixed indexes #2', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([1, 4, 0, 5], 3);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('4');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('7');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
      expect(spec().$container.find('tbody tr:eq(5) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(6) td:eq(0)').text()).toEqual('6');
      expect(spec().$container.find('tbody tr:eq(7) td:eq(0)').text()).toEqual('8');
      expect(spec().$container.find('tbody tr:eq(8) td:eq(0)').text()).toEqual('9');
    });
  });

  describe('dragRow()', () => {
    it('should not change order when dragging single row from the position of first row to the top of second row', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').dragRow(0, 1);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    });

    it('should not change order when dragging single row from the position of first row to the top of first row', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').dragRow(0, 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    });

    it('should change order properly when dragging single row from the position of first row to the top of fourth row', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').dragRow(0, 3);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('4');
    });

    it('should change order properly when dragging single row from the position of fourth row to the top of first row', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').dragRow(3, 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('4');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
    });
  });

  describe('dragRows()', () => {
    it('should not change order when dragging multiple rows to the specific position', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').dragRows([0, 1, 2, 3], 2);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('4');
      expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
    });

    it('should change order properly when dragging multiple rows from the top to the bottom', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').dragRows([0, 1, 2], 4);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('4');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
    });

    it('should change order properly when dragging multiple rows from the bottom to the top', async() => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      getPlugin('manualRowMove').dragRows([4, 3, 2], 0);
      await render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('5');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('4');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('1');
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging rows to index, which is too high', async() => {
      let movePossible;
      let orderChanged;

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove(...args) {
          [, , , movePossible, orderChanged] = args;
        }
      });

      const result = getPlugin('manualRowMove').dragRows([1, 2, 3], 15);

      expect(movePossible).toBeFalsy();
      expect(orderChanged).toBeFalsy();
      expect(result).toBeFalsy();
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging rows to index, which is too low', async() => {
      let movePossible;
      let orderChanged;

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove(...args) {
          [, , , movePossible, orderChanged] = args;
        }
      });

      const result = getPlugin('manualRowMove').dragRows([1, 2, 3], -1);

      expect(movePossible).toBeFalsy();
      expect(orderChanged).toBeFalsy();
      expect(result).toBeFalsy();
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging too low rows to index, which is too high', async() => {
      let movePossible;
      let orderChanged;

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove(...args) {
          [, , , movePossible, orderChanged] = args;
        }
      });

      const result = getPlugin('manualRowMove').dragRows([-1, -2, -3, -4], 15);

      expect(movePossible).toBeFalsy();
      expect(orderChanged).toBeFalsy();
      expect(result).toBeFalsy();
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
    });

    it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging too low rows to index, which is too low', async() => {
      let movePossible;
      let orderChanged;

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        afterRowMove(...args) {
          [, , , movePossible, orderChanged] = args;
        }
      });

      const result = getPlugin('manualRowMove').dragRows([-2, -3, -4, -5], -1);

      expect(movePossible).toBeFalsy();
      expect(orderChanged).toBeFalsy();
      expect(result).toBeFalsy();
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
    });
  });
});
