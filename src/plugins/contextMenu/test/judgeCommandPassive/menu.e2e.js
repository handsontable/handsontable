describe('ContextMenu', () => {
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

  it('row_above could be control by commandFunc', async() => {
    let flag = true;
    const commandFunc = function (){
      return flag;
    }
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: {
        items: {
          row_above: {
            isCommand: commandFunc, //  onCommand
          }
        }
      }
    });

    const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

    addHook('afterCreateRow', afterCreateRowCallback);

    expect(countRows()).toEqual(4);

    selectCell(3, 0, 1, 0);
    contextMenu();
    $('.htContextMenu .ht_master .htCore')
      .find('tbody td')
      .not('.htSeparator')
      .eq(0)
      .simulate('mousedown')
      .simulate('mouseup'); // Insert row above

    expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.rowAbove', void 0, void 0, void 0);
    expect(afterCreateRowCallback).toHaveBeenCalledTimes(1)
    expect(countRows()).toEqual(5);
    expect($('.htContextMenu').is(':visible')).toBe(false);

    flag = !flag;
    selectCell(3, 0, 1, 0);
    contextMenu();
    $('.htContextMenu .ht_master .htCore')
      .find('tbody td')
      .not('.htSeparator')
      .eq(0)
      .simulate('mousedown')
      .simulate('mouseup'); // never Insert row above

    expect(afterCreateRowCallback).toHaveBeenCalledTimes(1); //still one time
    expect(countRows()).toEqual(5);
    expect($('.htContextMenu').is(':visible')).toBe(true);
    
    flag = !flag;
    selectCell(3, 0, 1, 0);
    contextMenu();
    $('.htContextMenu .ht_master .htCore')
      .find('tbody td')
      .not('.htSeparator')
      .eq(0)
      .simulate('mousedown')
      .simulate('mouseup'); // Insert row above again

    expect(afterCreateRowCallback).toHaveBeenCalledTimes(2);
    expect(countRows()).toEqual(6);
    expect($('.htContextMenu').is(':visible')).toBe(false);
  });

});
