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
      expect(hot.getPlugin('CopyPaste').focusableElement).toBeDefined();
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

  describe('focusable element', () => {
    it('should reuse focusable element by borrowing an element from cell editor', async() => {
      handsontable();
      selectCell(0, 0);

      await sleep(150);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
      expect($('.HandsontableCopyPaste').length).toBe(0);
    });

    it('should create focusable element when cell editor doesn\'t exist', () => {
      handsontable({
        editor: false,
      });
      selectCell(0, 0);

      expect($('.HandsontableCopyPaste').length).toEqual(1);
    });

    it('should keep focusable element if updateSettings occurred after the end of the selection', () => {
      handsontable();
      selectCell(0, 0, 2, 2);
      updateSettings({});

      expect(getPlugin('CopyPaste').focusableElement.mainElement).not.toBe(null);
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

      expect(hot1.getPlugin('CopyPaste').focusableElement).toBeDefined();
      expect(hot2.getPlugin('CopyPaste').focusableElement).toBeUndefined();
    });

    it('should not create HandsontableCopyPaste element until the table will be selected', () => {
      handsontable();
      spec().$container2.handsontable();

      expect($('.HandsontableCopyPaste').length).toBe(0);
    });

    it('should use focusable element from cell editor of the lastly selected table', async() => {
      const hot1 = handsontable();
      const hot2 = spec().$container2.handsontable().handsontable('getInstance');

      hot1.selectCell(0, 0);
      hot2.selectCell(1, 1);

      await sleep(100);

      expect($('.HandsontableCopyPaste').length).toBe(0);
      expect(document.activeElement).toBe(hot2.getActiveEditor().TEXTAREA);
    });

    it('should destroy HandsontableCopyPaste element as long as at least one table has copyPaste enabled', () => {
      const hot1 = handsontable({ editor: false });
      const hot2 = spec().$container2.handsontable({ editor: false }).handsontable('getInstance');

      hot1.selectCell(0, 0);
      hot2.selectCell(0, 0);

      expect($('.HandsontableCopyPaste').length).toBe(1);

      hot1.updateSettings({ copyPaste: false });

      expect($('.HandsontableCopyPaste').length).toBe(1);

      hot2.updateSettings({ copyPaste: false });

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
