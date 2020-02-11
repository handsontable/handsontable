describe('HTMLRenderer', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px;"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not fill empty rows with null values', () => {
    handsontable({
      data: [['a', 'b', 'c', 'd', 'e', 'f']],
      colHeaders: true,
      rowHeaders: true,
      minSpareRows: 5,
      renderer: 'html'
    });

    expect($('.handsontable table tr:last-child td:eq(0)').html()).toEqual('');
    expect($('.handsontable table tr:last-child td:eq(1)').html()).toEqual('');
    expect($('.handsontable table tr:last-child td:eq(2)').html()).toEqual('');
    expect($('.handsontable table tr:last-child td:eq(3)').html()).toEqual('');
    expect($('.handsontable table tr:last-child td:eq(4)').html()).toEqual('');
    expect($('.handsontable table tr:last-child td:eq(5)').html()).toEqual('');
  });
});
