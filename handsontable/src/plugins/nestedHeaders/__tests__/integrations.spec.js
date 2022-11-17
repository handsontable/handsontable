describe('Integration with other plugins', () => {
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

  describe('Core `getColHeader` method', () => {
    it('should return column header values based on the nested headers configuration', () => {
      handsontable({
        data: [['1', '2', '3', '4', '5', '6']],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3'],
        ],
      });

      expect(getColHeader(0)).toBe('A3');
      expect(getColHeader(1)).toBe('B3');
      expect(getColHeader(2)).toBe('C3');
      expect(getColHeader(3)).toBe('C3');
      expect(getColHeader(4)).toBe('E3');
      expect(getColHeader(5)).toBe('F3');
      expect(getColHeader(6)).toBe('');

      expect(getColHeader(1, -1)).toBe('B3');
      expect(getColHeader(1, -2)).toBe('B2');
      expect(getColHeader(1, -3)).toBe('B1');
      expect(getColHeader(1, -4)).toBe(null);

      expect(getColHeader(1, 0)).toBe('B1');
      expect(getColHeader(1, 1)).toBe('B2');
      expect(getColHeader(1, 2)).toBe('B3');
      expect(getColHeader(1, 3)).toBe(null);
    });
  });

  describe('DropdownMenu', () => {
    it('should not block the opening of the dropdown menu after clicking on its header button, when all the rows are' +
      ' trimmed', () => {
      const afterDropdownMenuShow = jasmine.createSpy('afterDropdownMenuShow');

      handsontable({
        data: [[null, null]],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        trimRows: [0],
        nestedHeaders: [
          ['A', 'B']
        ],
        afterDropdownMenuShow,
      });

      getTopClone().find('thead tr th:eq(2) button')
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(afterDropdownMenuShow).toHaveBeenCalledTimes(1);
    });
  });
});
