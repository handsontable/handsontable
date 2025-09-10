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

  it('should run dialogFocusPreviousElement hook when Tab is pressed inside dialog', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    await selectCell(0, 0);

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" /><input type="text" id="testInput2" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp(['shift', 'tab']);
    await sleep(10);

    expect(dialogFocusPreviousElementSpy).toHaveBeenCalledTimes(1);
  });

  it('should not run dialogFocusPreviousElement hook when tab is pressed', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    await selectCell(0, 0);

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" /><input type="text" id="testInput2" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');
    await sleep(10);

    expect(dialogFocusPreviousElementSpy).not.toHaveBeenCalled();
  });

  it('should not run dialogFocusPreviousElement hook when Tab is pressed and isListening is false', async() => {
    const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
    });

    await selectCell(0, 0);

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await unlisten();

    await keyDownUp(['shift', 'tab']);
    await sleep(10);

    expect(dialogFocusPreviousElementSpy).not.toHaveBeenCalled();
  });

  // it('should not run dialogFocusPreviousElement hook when Tab is pressed focus is moved out of dialog', async() => {
  //   const dialogFocusPreviousElementSpy = jasmine.createSpy('dialogFocusPreviousElement');
  //   const input = document.createElement('input');

  //   document.body.prepend(input);

  //   handsontable({
  //     data: createSpreadsheetData(5, 5),
  //     dialog: true,
  //     dialogFocusPreviousElement: dialogFocusPreviousElementSpy,
  //   });

  //   await selectCell(0, 0);

  //   const dialogPlugin = getPlugin('dialog');

  //   dialogPlugin.show({
  //     content: 'test',
  //   });

  //   input.focus();

  //   await keyDownUp(['shift', 'tab']);
  //   await sleep(10);

  //   document.body.removeChild(input);

  //   expect(dialogFocusPreviousElementSpy).not.toHaveBeenCalled();
  // });
});
