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
    using('configuration object', [
      { htmlDir: 'ltr', layoutDirection: 'inherit' },
      { htmlDir: 'rtl', layoutDirection: 'ltr' },
    ], ({ htmlDir, layoutDirection }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      it('should render the dropdown button on the right side of the header', () => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
          colHeaders: true,
          height: 100
        });

        const dropdownButton = $(getCell(-1, 2));

        expect(dropdownButton.find('.changeType').css('float')).toBe('right');
      });
    });

    it('should render dropdown menu trigger buttons with a proper type', () => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
      });

      expect(hot().rootElement.querySelectorAll('.ht_master table button.changeType[type=button]').length).toBe(5);
    });
  });
});
