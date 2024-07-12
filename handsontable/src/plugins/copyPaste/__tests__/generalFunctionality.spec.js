describe('CopyPaste', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    // Installing spy stabilizes the tests. Without that on CI and real browser there are some
    // differences in results.
    spyOn(document, 'execCommand');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('enabling/disabling plugin', () => {
    it('should copyPaste be set enabled as default', () => {
      const hot = handsontable();

      expect(hot.getSettings().copyPaste).toBeTruthy();
    });

    it('should do not create textarea element if copyPaste is disabled on initialization', () => {
      handsontable({
        copyPaste: false
      });

      expect($('.HandsontableCopyPaste').length).toEqual(0);
    });

    it('should do not create textarea element if copyPaste is disabled on initialization', () => {
      handsontable({
        copyPaste: false
      });

      expect($('.HandsontableCopyPaste').length).toEqual(0);
    });
  });

  describe('working with multiple tables', () => {
    beforeEach(function() {
      this.$container2 = $(`<div id="${id}2"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container2) {
        this.$container2.handsontable('destroy');
        this.$container2.remove();
      }
    });

    it('should disable copyPaste only in particular table', () => {
      const hot1 = handsontable();
      const hot2 = spec().$container2.handsontable({ copyPaste: false }).handsontable('getInstance');

      expect(hot1.getPlugin('CopyPaste').isEnabled()).toBe(true);
      expect(hot2.getPlugin('CopyPaste').isEnabled()).toBe(false);
    });

    it('should not create HandsontableCopyPaste element until the table will be selected', () => {
      handsontable();
      spec().$container2.handsontable();

      expect($('.HandsontableCopyPaste').length).toBe(0);
    });

    it('should not touch focusable element borrowed from cell editors', () => {
      const hot1 = handsontable();
      const hot2 = spec().$container2.handsontable().handsontable('getInstance');

      hot1.selectCell(0, 0);
      hot2.selectCell(0, 0);

      expect($('.handsontableInput').length).toBe(2);

      hot1.updateSettings({ copyPaste: false });

      expect($('.handsontableInput').length).toBe(2);

      hot2.updateSettings({ copyPaste: false });

      expect($('.handsontableInput').length).toBe(2);
    });
  });
});
