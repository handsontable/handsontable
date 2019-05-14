describe('NestedRows', () => {
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

  describe('Displaying a nested structure', () => {
    it('should display as many rows as there are overall elements in a nested structure', () => {
      const hot = handsontable({
        data: getDataForNestedRows(),
        nestedRows: true
      });

      expect(hot.countRows()).toEqual(12);
    });

    it('should display all nested structure elements in correct order (parent, its children, its children children, next parent etc)', () => {
      const hot = handsontable({
        data: getDataForNestedRows(),
        nestedRows: true
      });

      const dataInOrder = [
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a1-a0', 'b0-b1-b0'],
        ['a0-a1-a0-a0', 'b0-b1-b0-b0'],
        ['a0-a2', 'b0-b2'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1']
      ];

      expect(hot.getData()).toEqual(dataInOrder);
    });

    it('should display the right amount of entries with the `manualRowMove` plugin enabled', () => {
      const hot = handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true
      });

      expect(hot.getData().length).toEqual(12);

    });

    it('should display the right amount of entries when calling loadData after being initialized with empty data', (done) => {
      const hot = handsontable({
        data: [],
        nestedRows: true
      });

      setTimeout(() => {
        hot.loadData(getDataForNestedRows());
        expect(hot.countRows()).toEqual(12);
        done();
      }, 100);
    });

    it('should display the right amount of entries when calling loadData with another set of data', (done) => {
      const hot = handsontable({
        data: getDataForNestedRows(),
        nestedRows: true
      });

      setTimeout(() => {
        hot.loadData(getDataForNestedRows().slice(0, 1));
        expect(hot.countRows()).toEqual(6);
        done();
      }, 100);
    });

  });
});
