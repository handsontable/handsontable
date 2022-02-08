describe('DropdownMenu', () => {
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

  describe('UI', () => {
    it('should render the dropdown button on the right side of the header', () => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      const dropdownButton = $(getCell(-1, 2));

      expect(dropdownButton.find('.changeType').css('float')).toBe('right');
    });
  });
});
