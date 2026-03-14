describe('NumericRenderer with ContextMenu', () => {
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

  it('should change class name from default `htRight` to `htLeft` after set align in contextMenu', async() => {
    handsontable({
      startRows: 1,
      startCols: 1,
      contextMenu: ['alignment'],
      cells() {
        return {
          type: 'numeric',
          numericFormat: { pattern: '$0,0.00' }
        };
      },
      height: 100
    });

    await setDataAtCell(0, 0, '1000');
    await selectCell(0, 0);

    await contextMenu();

    const menu = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator');

    menu.simulate('mouseover');

    await sleep(304);

    const contextSubMenu = $(`.htContextMenuSub_${menu.text()}`).find('tbody td').eq(0);

    contextSubMenu.simulate('mousedown');
    contextSubMenu.simulate('mouseup');

    expect($('.handsontable.ht_master .htLeft:not(.htRight)').length).toBe(1);
  });
});
