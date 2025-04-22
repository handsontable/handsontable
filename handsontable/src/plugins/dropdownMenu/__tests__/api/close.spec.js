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

  describe('`close()` method', () => {
    it('should close the dropdown menu', () => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
      });

      dropdownMenu(0);

      expect($(document.body).find('.htDropdownMenu:visible').length).toBe(1);

      getPlugin('dropdownMenu').close();

      expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
    });
  });
});
