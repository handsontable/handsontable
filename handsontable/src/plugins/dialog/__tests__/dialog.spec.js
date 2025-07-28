describe('Dialog', () => {
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

  describe('Plugin initialization', () => {
    it('should be disabled by default', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
      });

      const dialogPlugin = hot.getPlugin('dialog');

      expect(dialogPlugin.isEnabled()).toBe(false);
    });

    it('should be enabled when dialog option is set to true', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      expect(dialogPlugin.isEnabled()).toBe(true);
    });

    it('should be enabled when dialog option is set to object', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          content: 'Test dialog',
        },
      });

      const dialogPlugin = hot.getPlugin('dialog');

      expect(dialogPlugin.isEnabled()).toBe(true);
    });

    it('should not be visible by default', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      expect(dialogPlugin.isVisible()).toBe(false);
    });
  });

  describe('Dialog display', () => {
    it('should show dialog with default configuration', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').length).toBe(1);
      expect(dialogPlugin.currentConfig).toEqual({
        content: '',
        customClassName: '',
        background: 'solid',
        contentBackground: false,
        contentDirections: 'row',
        animation: true,
        closable: false,
      });
    });

    it('should show dialog with custom content', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Custom dialog content',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').text()).toEqual('Custom dialog content');
    });

    it('should show dialog with updated configuration', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          content: 'Custom dialog content',
          customClassName: 'custom-dialog-class',
        },
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Custom dialog content 2',
        customClassName: 'custom-dialog-class-2',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').text()).toEqual('Custom dialog content 2');
      expect($('.ht-dialog').hasClass('custom-dialog-class-2')).toBe(true);
    });

    it('should show dialog with HTML content', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: '<h2>Title</h2><p>Paragraph</p>',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog h2').text()).toBe('Title');
      expect($('.ht-dialog p').text()).toBe('Paragraph');
    });

    it('should hide dialog', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          closable: true,
        },
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      expect(dialogPlugin.isVisible()).toBe(true);

      dialogPlugin.hide();
      expect(dialogPlugin.isVisible()).toBe(false);
      expect($('.ht-dialog').length).toBe(1);
    });

    it('should not hide dialog when "closable" is false', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          closable: false,
        },
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      expect(dialogPlugin.isVisible()).toBe(true);

      dialogPlugin.hide();
      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);
    });

    it('should not show dialog when plugin is disabled', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: false,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
      });

      expect(dialogPlugin.isVisible()).toBe(false);
      expect($('.ht-dialog').length).toBe(0);
    });

    it('should contain "ht-dialog--show" class name when dialog is visible', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          closable: true,
        },
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();

      expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);
    });

    it('should not contain "ht-dialog--show" class name when dialog is hidden', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          closable: true,
        },
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      dialogPlugin.hide();

      expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(false);
    });

    it('should contain "ht-dialog--show" class name after update when dialog is visible', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      dialogPlugin.update({
        content: 'Test content',
      });

      expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);
    });

    it('should contain "ht-dialog--animation" class name after update when dialog is visible and animation is enabled', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      dialogPlugin.update({
        content: 'Test content',
      });

      expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(true);
    });

    it('should not contain "ht-dialog--animation" class name after update when dialog is visible and animation is disabled', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      dialogPlugin.update({
        content: 'Test content',
        animation: false,
      });

      expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(false);
      expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);
    });
  });

  describe('Dialog configuration', () => {
    it('should show dialog with custom class name', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        customClassName: 'custom-dialog-class',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').hasClass('custom-dialog-class')).toBe(true);
    });

    it('should show dialog with solid background', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        background: 'solid',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').hasClass('ht-dialog--background-solid')).toBe(true);
    });

    it('should show dialog with semi-transparent background', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        background: 'semi-transparent',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').hasClass('ht-dialog--background-semi-transparent')).toBe(true);
    });

    it('should show dialog with content background', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        contentBackground: true,
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);
    });

    it('should show dialog with row content direction', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        contentDirections: 'row',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(true);
    });

    it('should show dialog with column content direction', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        contentDirections: 'column',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);
    });

    it('should show dialog with row-reverse content direction', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        contentDirections: 'row-reverse',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row-reverse')).toBe(true);
    });

    it('should show dialog with column-reverse content direction', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        contentDirections: 'column-reverse',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column-reverse')).toBe(true);
    });

    it('should show dialog without animation', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        animation: false,
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(false);
    });
  });

  describe('Dialog updates', () => {
    it('should update dialog content', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Initial content',
      });

      expect($('.ht-dialog').text()).toEqual('Initial content');

      dialogPlugin.update({
        content: 'Updated content',
      });

      expect($('.ht-dialog').text()).toEqual('Updated content');
    });

    it('should update dialog custom class name', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        customClassName: 'initial-class',
      });

      expect($('.ht-dialog').hasClass('initial-class')).toBe(true);

      dialogPlugin.update({
        customClassName: 'updated-class',
      });

      expect($('.ht-dialog').hasClass('initial-class')).toBe(false);
      expect($('.ht-dialog').hasClass('updated-class')).toBe(true);
    });

    it('should update dialog background', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        background: 'solid',
      });

      expect($('.ht-dialog').hasClass('ht-dialog--background-solid')).toBe(true);

      dialogPlugin.update({
        background: 'semi-transparent',
      });

      expect($('.ht-dialog').hasClass('ht-dialog--background-solid')).toBe(false);
      expect($('.ht-dialog').hasClass('ht-dialog--background-semi-transparent')).toBe(true);
    });

    it('should not update dialog when plugin is disabled', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: false,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.update({
        content: 'Updated content',
      });

      expect(dialogPlugin.isVisible()).toBe(false);
    });
  });

  describe('User interactions', () => {
    it('should close dialog when pressing Escape key', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
        closable: true,
      });

      expect(dialogPlugin.isVisible()).toBe(true);

      $('html').simulate('keydown', { keyCode: 27, key: 'Escape' });

      expect(dialogPlugin.isVisible()).toBe(false);
    });
  });

  describe('Hooks', () => {
    it('should run beforeDialogShow hook', async() => {
      const beforeDialogShowSpy = jasmine.createSpy('beforeDialogShow');
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
        beforeDialogShow: beforeDialogShowSpy,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
      });

      expect(beforeDialogShowSpy).toHaveBeenCalledWith({
        content: 'Test content',
        customClassName: '',
        background: 'solid',
        contentBackground: false,
        contentDirections: 'row',
        animation: true,
        closable: false,
      });
    });

    it('should run afterDialogShow hook', async() => {
      const afterDialogShowSpy = jasmine.createSpy('afterDialogShow');
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
        afterDialogShow: afterDialogShowSpy,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
      });

      expect(afterDialogShowSpy).toHaveBeenCalledWith({
        content: 'Test content',
        customClassName: '',
        background: 'solid',
        contentBackground: false,
        contentDirections: 'row',
        animation: true,
        closable: false,
      });
    });

    it('should run beforeDialogHide hook', async() => {
      const beforeDialogHideSpy = jasmine.createSpy('beforeDialogHide');
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          closable: true,
        },
        beforeDialogHide: beforeDialogHideSpy,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      dialogPlugin.hide();

      expect(beforeDialogHideSpy).toHaveBeenCalled();
    });

    it('should run afterDialogHide hook', async() => {
      const afterDialogHideSpy = jasmine.createSpy('afterDialogHide');
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: {
          closable: true,
        },
        afterDialogHide: afterDialogHideSpy,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show();
      dialogPlugin.hide();

      expect(afterDialogHideSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should destroy dialog elements when plugin is destroyed', async() => {
      const hot = handsontable({
        data: [['A1', 'B1'], ['A2', 'B2']],
        dialog: true,
      });

      const dialogPlugin = hot.getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test content',
      });

      expect($('.ht-dialog').length).toBe(1);

      destroy();

      expect($('.ht-dialog').length).toBe(0);
    });
  });
});
