describe('DropdownMenu', () => {
  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
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
  });
});
