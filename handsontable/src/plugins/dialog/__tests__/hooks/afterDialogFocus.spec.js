describe('Dialog - afterDialogFocus hook', () => {
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

  it('should run afterDialogFocus hook with "show" parameter when dialog is displayed', async() => {
    const afterDialogFocusSpy = jasmine.createSpy('afterDialogFocus');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      afterDialogFocus: afterDialogFocusSpy,
    });

    await selectCell(0, 0);

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(afterDialogFocusSpy).toHaveBeenCalledTimes(1);
    expect(afterDialogFocusSpy).toHaveBeenCalledWith('show');
  });

  it('should run afterDialogFocus hook with "tab_from_above" parameter when Tab is pressed from above', async() => {
    const afterDialogFocusSpy = jasmine.createSpy('afterDialogFocus');
    const input = document.createElement('input');

    document.body.prepend(input);

    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      afterDialogFocus: afterDialogFocusSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    await selectCell(0, 0);

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(afterDialogFocusSpy).toHaveBeenCalledWith('show');

    input.focus();
    triggerTabNavigationFromTop();

    document.body.removeChild(input);

    expect(afterDialogFocusSpy).toHaveBeenCalledTimes(1);
    expect(afterDialogFocusSpy).toHaveBeenCalledWith('tab_from_above');
  });

  it('should run afterDialogFocus hook with "tab_from_below" parameter when Tab is pressed from below', async() => {
    const afterDialogFocusSpy = jasmine.createSpy('afterDialogFocus');
    const input = document.createElement('input');

    document.body.appendChild(input);

    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      width: 300,
      height: 300,
      dialog: true,
      afterDialogFocus: afterDialogFocusSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    await selectCell(0, 0);

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(afterDialogFocusSpy).toHaveBeenCalledWith('show');

    input.focus();
    triggerTabNavigationFromBottom();

    document.body.removeChild(input);

    expect(afterDialogFocusSpy).toHaveBeenCalledTimes(1);
    expect(afterDialogFocusSpy).toHaveBeenCalledWith('tab_from_below');
  });

  it('should run afterDialogFocus hook with "click" parameter when dialog is clicked', async() => {
    const afterDialogFocusSpy = jasmine.createSpy('afterDialogFocus');

    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      afterDialogFocus: afterDialogFocusSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<button id="clickableContent">Click me</button>',
    });

    await simulateClick(document.body);
    await simulateClick($('#clickableContent'));

    expect(afterDialogFocusSpy).toHaveBeenCalledWith('click');
  });

  it('should not run afterDialogFocus hook with "show" parameter when dialog is displayed and active element is outside of the rootWrapperElement', async() => {
    const afterDialogFocusSpy = jasmine.createSpy('afterDialogFocus');
    const input = document.createElement('input');

    document.body.appendChild(input);

    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      afterDialogFocus: afterDialogFocusSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    input.focus();

    dialogPlugin.show({
      content: 'Test content',
    });

    document.body.removeChild(input);

    expect(afterDialogFocusSpy).not.toHaveBeenCalled();
  });
});
