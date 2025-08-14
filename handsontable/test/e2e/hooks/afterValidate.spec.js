describe('Hook', () => {
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

  describe('afterValidate', () => {
    it('should call afterValidate', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'id', type: 'numeric' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0, 'test');

      await sleep(100); // wait for async validation

      expect(onAfterValidate.calls.count()).toBe(1);
    });

    it('should call afterValidate when columns is a function', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns(column) {
          let colMeta = {};

          if (column === 0) {
            colMeta.data = 'id';
            colMeta.type = 'numeric';

          } else if (column === 1) {
            colMeta.data = 'name';

          } else if (column === 2) {
            colMeta.data = 'lastName';

          } else {
            colMeta = null;
          }

          return colMeta;
        },
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0, 'test');

      await sleep(100); // wait for async validation

      expect(onAfterValidate.calls.count()).toBe(1);
    });
  });
});
