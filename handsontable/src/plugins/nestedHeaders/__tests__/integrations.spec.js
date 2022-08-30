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

  describe('DropdownMenu', () => {
    it('should not block the opening of the dropdown menu after clicking on its header button, when all the rows are' +
      ' trimmed', () => {
      const afterDropdownMenuShowSpy = jasmine.createSpy('afterDropdownMenuShowSpy');

      handsontable({
        data: [[null, null]],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        trimRows: [0],
        nestedHeaders: [
          ['A', 'B']
        ],
        afterDropdownMenuShow: afterDropdownMenuShowSpy
      });

      getTopClone().find('thead tr th:eq(2) button')
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(afterDropdownMenuShowSpy).toHaveBeenCalledTimes(1);
    });
  });
});
