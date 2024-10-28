describe('DropdownMenu (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('UI', () => {
      it('should render the dropdown button on the left side of the header', () => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
          colHeaders: true,
          height: 100
        });

        const dropdownButton = $(getCell(-1, 2));

        expect(dropdownButton.find('.changeType').css('float')).toBe('left');
      });
    });
  });
});
