describe('Hook', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" class="ht-theme-sth"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('afterSetTheme', () => {
    it('should be fired every time the theme is modified', async() => {
      const afterSetThemeSpy = jasmine.createSpy('afterSetTheme');

      handsontable({
        data: createSpreadsheetData(2, 2),
        afterSetTheme: afterSetThemeSpy,
      }, true);

      // Initial theme setup.
      expect(afterSetThemeSpy.calls.count()).toBe(1);
      expect(afterSetThemeSpy.calls.mostRecent().args).toEqual(['ht-theme-sth', true]);

      await useTheme('ht-theme-sth2');

      expect(afterSetThemeSpy.calls.count()).toBe(2);
      expect(afterSetThemeSpy.calls.mostRecent().args).toEqual(['ht-theme-sth2', false]);

      await useTheme();

      expect(afterSetThemeSpy.calls.count()).toBe(3);
      expect(afterSetThemeSpy.calls.mostRecent().args).toEqual(['ht-theme-sth2', false]);

      await updateSettings({
        themeName: 'ht-theme-sth3',
      });

      expect(afterSetThemeSpy.calls.count()).toBe(4);
      expect(afterSetThemeSpy.calls.mostRecent().args).toEqual(['ht-theme-sth3', false]);
    });
  });
});
