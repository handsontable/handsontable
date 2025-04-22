describe('settings', () => {
  describe('layoutDirection', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');
      this.$container.attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should set dir="rtl" attribute to the root element no matter in what document direction the table is initialized', () => {
      handsontable({
        layoutDirection: 'rtl'
      });

      expect(hot().rootElement.getAttribute('dir')).toBe('rtl');
      expect(hot().isRtl()).toBe(true);
    });

    it('should set dir="ltr" attribute to the root element no matter in what document direction the table is initialized', () => {
      $('html').attr('dir', 'rtl');
      handsontable({
        layoutDirection: 'ltr'
      });

      expect(hot().rootElement.getAttribute('dir')).toBe('ltr');
      expect(hot().isRtl()).toBe(false);
    });

    it('should set a proper "dir" attribute to the root element based on the detected document direction ' +
       '("dir" defined in the HTML element)', () => {
      $('html').attr('dir', 'rtl');
      handsontable({
        layoutDirection: 'inherit'
      });

      expect(hot().rootElement.getAttribute('dir')).toBe('rtl');
      expect(hot().isRtl()).toBe(true);
    });

    it('should set a proper "dir" attribute to the root element based on the detected document direction ' +
       '("dir" defined in the nearest component\'s parent element)', () => {
      spec().$container.attr('dir', 'rtl');
      handsontable({
        layoutDirection: 'inherit'
      });

      expect(hot().rootElement.getAttribute('dir')).toBe('rtl');
      expect(hot().isRtl()).toBe(true);
    });

    it('should not be possible to change the layout direction after the table is initialized', () => {
      spec().$container.attr('dir', 'rtl');
      handsontable({
        layoutDirection: 'ltr'
      });

      expect(() => {
        updateSettings({
          layoutDirection: 'rtl'
        });
      }).toThrowError();

      expect(hot().rootElement.getAttribute('dir')).toBe('ltr');
      expect(hot().isRtl()).toBe(false);
    });
  });
});
