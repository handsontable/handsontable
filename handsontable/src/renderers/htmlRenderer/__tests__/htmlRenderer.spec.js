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

  it('should allow render the html without sanitizing the content', async() => {
    handsontable({
      // target="_blank" - can cause vulnerabilities in access to the window object (filtered by DOMPurify)
      data: [
        [
          '<b>foo <span>zip</span></b>',
          '<i>bar</i><img src onerror="">',
          '<a href="#" target="_blank">baz</a>'
        ]
      ],
      colHeaders: true,
      rowHeaders: true,
      renderer: 'html'
    });

    await sleep(100);

    expect(getMaster().find('table tr:last-child td:eq(0)').html())
      .toBe('<b>foo <span>zip</span></b>');
    expect(getMaster().find('table tr:last-child td:eq(1)').html())
      .toBe('<i>bar</i><img src="" onerror="">');
    expect(getMaster().find('table tr:last-child td:eq(2)').html())
      .toBe('<a href="#" target="_blank">baz</a>');
  });
});
