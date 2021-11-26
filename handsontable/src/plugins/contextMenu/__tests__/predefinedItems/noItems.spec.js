describe('ContextMenuReadOnly', () => {
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

  it('should render noItems item only if contextmenu has no available options', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      contextMenu: [],
    });

    contextMenu();

    const item = $('.htItemWrapper').filter(function() {
      return $(this).text() === 'No available options';
    });

    expect(item.length).toBe(1);
  });

  it('should not render noItems item if contextmenu has available options', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
    });

    contextMenu();

    const item = $('.htItemWrapper').filter(function() {
      return $(this).text() === 'No available options';
    });

    expect(item.length).toBe(0);
  });

  it('should be possible to overwrite noItems\' name', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      contextMenu: {
        items: {
          no_items: {
            name: 'No options'
          }
        }
      },
    });

    contextMenu();

    const item = $('.htDisabled .htItemWrapper').filter(function() {
      return $(this).text() === 'No options';
    });

    expect(item.length).toBe(1);
  });

  it('should be possible to no render context menu completely', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      contextMenu: {
        items: {
          no_items: {
            hidden: () => true
          }
        }
      },
    });

    contextMenu();
    const items = $('.htItemWrapper');

    expect(getPlugin('contextMenu').menu.isOpened()).toBe(false);
    expect(items.length).toBe(0);
  });
});
