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

  const arrayOfObjects = function() {
    return [
      { id: 1, name: 'Ted', lastName: 'Right' },
      { id: 2, name: 'Frank', lastName: 'Honest' },
      { id: 3, name: 'Joan', lastName: 'Well' },
      { id: 4, name: 'Sid', lastName: 'Strong' },
      { id: 5, name: 'Jane', lastName: 'Neat' },
      { id: 6, name: 'Chuck', lastName: 'Jackson' },
      { id: 7, name: 'Meg', lastName: 'Jansen' },
      { id: 8, name: 'Rob', lastName: 'Norris' },
      { id: 9, name: 'Sean', lastName: 'O\'Hara' },
      { id: 10, name: 'Eve', lastName: 'Branson' }
    ];
  };

  describe('beforeValidate', () => {
    it('should call beforeValidate', async() => {
      let fired = null;

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'id', type: 'numeric' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        beforeValidate() {
          fired = true;
        }
      });
      await setDataAtCell(2, 0, 'test');

      expect(fired).toEqual(true);
    });

    it('should call beforeValidate when columns is a function', async() => {
      let fired = null;

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
        beforeValidate() {
          fired = true;
        }
      });
      await setDataAtCell(2, 0, 'test');

      expect(fired).toBe(true);
    });

    it('beforeValidate can manipulate value', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      let result = null;

      onAfterValidate.and.callFake((valid, value) => {
        result = value;
      });

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'id', type: 'numeric' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        beforeValidate() {
          return 999;
        },
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0, 123);

      await sleep(100); // wait for async validation

      expect(result).toBe(999);
    });

    it('beforeValidate can manipulate value when columns is a function', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      let result = null;

      onAfterValidate.and.callFake((valid, value) => {
        result = value;
      });

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
        beforeValidate() {
          return 999;
        },
        afterValidate: onAfterValidate
      });

      await setDataAtCell(2, 0, 123);

      await sleep(100); // wait for async validation

      expect(result).toBe(999);
    });
  });
});
