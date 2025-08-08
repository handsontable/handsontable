describe('Dialog - dialogFocusNextElement hook', () => {
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

  it('should run dialogFocusNextElement hook when Tab is pressed inside dialog', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');

    expect(dialogFocusNextElementSpy).toHaveBeenCalledTimes(1);
  });

  it('should not run dialogFocusNextElement hook when Tab is pressed outside dialog', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    hot.getCell(0, 0).focus();

    await keyDownUp('tab');

    expect(dialogFocusNextElementSpy).not.toHaveBeenCalled();
  });

  it('should not run dialogFocusNextElement hook when Shift+Tab is pressed', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp(['shift', 'tab']);

    expect(dialogFocusNextElementSpy).not.toHaveBeenCalled();
  });

  it('should run dialogFocusNextElement hook multiple times when Tab is pressed repeatedly', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput1" /><input type="text" id="testInput2" />',
    });

    const input1 = document.getElementById('testInput1');

    input1.focus();

    await keyDownUp('tab');
    await keyDownUp('tab');

    expect(dialogFocusNextElementSpy).toHaveBeenCalledTimes(2);
  });

  it('should run dialogFocusNextElement hook when dialog is visible and Tab is pressed', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');

    expect(dialogFocusNextElementSpy).toHaveBeenCalledTimes(1);
  });

  it('should not run dialogFocusNextElement hook when dialog is hidden', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
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

      await keyDownUp('tab');

      expect(dialogFocusNextElementSpy).not.toHaveBeenCalled();
    }
  });

  it('should run dialogFocusNextElement hook with correct context', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');

    expect(dialogFocusNextElementSpy).toHaveBeenCalledTimes(1);
    expect(dialogFocusNextElementSpy.calls.first().object).toBe(hot);
  });

  it('should allow custom handling in dialogFocusNextElement hook', async() => {
    let customHandled = false;
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement() {
        customHandled = true;
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');

    expect(customHandled).toBe(true);
  });
});
