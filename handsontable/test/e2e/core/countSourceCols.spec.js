describe('Core.countSourceCols', () => {
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

  it('should return properly index from ', async() => {
    handsontable({
      data: [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']],
      columns(column) {
        return [1, 5, 9].indexOf(column) > -1 ? {} : null;
      }
    });

    expect(countSourceCols()).toBe(15);
  });

  it('should return the number of columns in the provided dataset, regardless of the `columns` settings (when the dataset is an array of arrays).', async() => {
    handsontable({
      data: [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']],
      columns: [{}]
    });

    expect(countSourceCols()).toBe(15);
  });

  it('should return the number of columns in the provided dataset, regardless of the `columns` settings (when the dataset is an array of objects).', async() => {
    handsontable({
      data: [{ a: 0, b: 1, c: 2 }],
      columns: [{ data: 'a' }]
    });

    expect(countSourceCols()).toBe(3);
  });
});
