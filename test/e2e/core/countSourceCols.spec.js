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

  it('should return properly index from ', () => {
    const hot = handsontable({
      data: [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']],
      columns(column) {
        return [1, 5, 9].indexOf(column) > -1 ? {} : null;
      }
    });

    expect(hot.countSourceCols()).toBe(15);
  });
});
