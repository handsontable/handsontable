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

    it('should render dropdown menu trigger buttons with a proper type', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
      });

      expect(hot().rootElement.querySelectorAll('.ht_master table button.changeType[type=button]').length).toBe(5);
    });
  });
});
