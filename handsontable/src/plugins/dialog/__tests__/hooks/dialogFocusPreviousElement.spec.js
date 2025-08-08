describe('Dialog - dialogFocusPreviousElement hook', () => {
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

  it('should run dialogFocusPreviousElement hook when Shift+Tab is pressed inside dialog', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp(['shift', 'tab']);

    expect(dialogFocusPreviousElementSpy).toHaveBeenCalledTimes(1);
  });

  it('should not run dialogFocusPreviousElement hook when Shift+Tab is pressed outside dialog', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    hot.getCell(0, 0).focus();

    await keyDownUp(['shift', 'tab']);

    expect(dialogFocusPreviousElementSpy).not.toHaveBeenCalled();
  });

  it('should not run dialogFocusPreviousElement hook when Tab is pressed', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');

    expect(dialogFocusPreviousElementSpy).not.toHaveBeenCalled();
  });

  it('should run dialogFocusPreviousElement hook multiple times when Shift+Tab is pressed repeatedly', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput1" /><input type="text" id="testInput2" />',
    });

    const input2 = document.getElementById('testInput2');

    input2.focus();

    await keyDownUp(['shift', 'tab']);
    await keyDownUp(['shift', 'tab']);

    expect(dialogFocusPreviousElementSpy).toHaveBeenCalledTimes(2);
  });

  it('should run dialogFocusPreviousElement hook when dialog is visible and Shift+Tab is pressed', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp(['shift', 'tab']);

    expect(dialogFocusPreviousElementSpy).toHaveBeenCalledTimes(1);
  });

  it('should not run dialogFocusPreviousElement hook when dialog is hidden', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);

    const input = document.getElementById('testInput');

    if (input) {
      input.focus();

      await keyDownUp(['shift', 'tab']);

      expect(dialogFocusPreviousElementSpy).not.toHaveBeenCalled();
    }
  });

  it('should run dialogFocusPreviousElement hook with correct context', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp(['shift', 'tab']);

    expect(dialogFocusPreviousElementSpy).toHaveBeenCalledTimes(1);
    expect(dialogFocusPreviousElementSpy.calls.first().object).toBe(hot);
  });

  it('should allow custom handling in dialogFocusPreviousElement hook', async() => {
    let customHandled = false;
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusPreviousElement() {
        customHandled = true;
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp(['shift', 'tab']);

    expect(customHandled).toBe(true);
  });

  it('should distinguish between dialogFocusNextElement and dialogFocusPreviousElement hooks', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');
    expect(dialogFocusNextElementSpy).toHaveBeenCalledTimes(1);
    expect(dialogFocusPreviousElementSpy).not.toHaveBeenCalled();

    dialogFocusNextElementSpy.calls.reset();
    dialogFocusPreviousElementSpy.calls.reset();

    await keyDownUp(['shift', 'tab']);
    expect(dialogFocusPreviousElementSpy).toHaveBeenCalledTimes(1);
    expect(dialogFocusNextElementSpy).not.toHaveBeenCalled();
  });
});
