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
      it('should place the dropdown control after the header label in the DOM', async() => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
          colHeaders: true,
          height: 100
        });

        const relative = getCell(-1, 2).querySelector('.relative');

        expect(relative.children[0].classList.contains('colHeader')).toBe(true);
        expect(relative.children[1].classList.contains('changeType')).toBe(true);
      });
    });
  });
});
