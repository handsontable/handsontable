describe('HiddenColumns', () => {
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

  describe('headerClassName', () => {
    it('should keep the `headerClassName` settings after hiding and showing columns', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: ['Left', 'Right'],
        columns: [
          {
            className: 'blue htLeft',
            headerClassName: 'htLeft'
          }, {
            className: 'red htRight',
            headerClassName: 'htRight'
          }
        ],
        hiddenColumns: true
      });

      getPlugin('hiddenColumns').hideColumn(0);
      render();

      let firstHeaderDiv = document.querySelector('.handsontable.ht_clone_top thead tr th:nth-of-type(2) div');

      expect(firstHeaderDiv.className).toContain('htRight');
      expect(firstHeaderDiv.className).not.toContain('htLeft');

      getPlugin('hiddenColumns').showColumn(0);
      render();

      firstHeaderDiv = document.querySelector('.handsontable.ht_clone_top thead tr th:nth-of-type(2) div');
      const secondHeaderDiv = document.querySelector('.handsontable.ht_clone_top thead tr th:nth-of-type(3) div');

      expect(firstHeaderDiv.className).toContain('htLeft');
      expect(firstHeaderDiv.className).not.toContain('htRight');

      expect(secondHeaderDiv.className).toContain('htRight');
      expect(secondHeaderDiv.className).not.toContain('htLeft');
    });
  });
});
