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

    await selectCell(0, 0);

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" /><input type="text" id="testInput2" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp('tab');

    await sleep(10);

    expect(dialogFocusNextElementSpy).toHaveBeenCalledTimes(1);
  });

  it('should not run dialogFocusNextElement hook when shift+tab is pressed', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    await selectCell(0, 0);

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" /><input type="text" id="testInput2" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    await keyDownUp(['shift', 'tab']);

    await sleep(10);

    expect(dialogFocusNextElementSpy).not.toHaveBeenCalled();
  });

  it('should not run dialogFocusNextElement hook when Tab is pressed and isListening is false', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    await selectCell(0, 0);

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<input type="text" id="testInput" />',
    });

    const input = document.getElementById('testInput');

    input.focus();

    hot.unlisten();

    await keyDownUp('tab');

    await sleep(10);

    expect(dialogFocusNextElementSpy).not.toHaveBeenCalled();
  });

  it('should not run dialogFocusNextElement hook when Tab is pressed focus is moved out of dialog', async() => {
    const dialogFocusNextElementSpy = jasmine.createSpy('dialogFocusNextElement');
    const input = document.createElement('input');

    document.body.appendChild(input);

    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      dialogFocusNextElement: dialogFocusNextElementSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'test',
    });

    input.focus();

    await keyDownUp('tab');

    await sleep(10);

    document.body.removeChild(input);

    expect(dialogFocusNextElementSpy).not.toHaveBeenCalled();
  });
});
