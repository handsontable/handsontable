describe('autocompleteValidator', () => {
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

  describe('allowEmpty', () => {
    it('should validate empty cells positively (by default)', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        type: 'autocomplete',
        source: ['some', 'sample', 'data'],
        strict: true,
        afterValidate,
      });

      setDataAtCell(0, 0, '');

      await sleep(10);

      expect(afterValidate).toHaveBeenCalledWith(true, '', 0, 0);
    });

    it('should validate empty cells positively when allowEmpty is set to true', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        type: 'autocomplete',
        source: ['some', 'sample', 'data'],
        strict: true,
        allowEmpty: true,
        afterValidate,
      });

      setDataAtCell(0, 0, '');

      await sleep(10);

      expect(afterValidate).toHaveBeenCalledWith(true, '', 0, 0);
    });

    it('should validate empty cells negatively when allowEmpty is set to false', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        type: 'autocomplete',
        source: ['some', 'sample', 'data'],
        strict: true,
        allowEmpty: false,
        afterValidate,
      });

      setDataAtCell(0, 0, '');

      await sleep(10);

      expect(afterValidate).toHaveBeenCalledWith(false, '', 0, 0);
    });

    it('should respect the allowEmpty property for a single column', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['some', 'sample', 'data']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true,
            allowEmpty: false
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          }
        ],
        afterValidate,
      });

      setDataAtCell(0, 0, '');
      setDataAtCell(0, 1, '');
      setDataAtCell(0, 2, '');

      await sleep(10);

      expect(afterValidate.calls.argsFor(0)).toEqual([true, '', 0, 0]);
      expect(afterValidate.calls.argsFor(1)).toEqual([false, '', 0, 1]);
      expect(afterValidate.calls.argsFor(2)).toEqual([true, '', 0, 2]);
    });

    it('should work for null and undefined values in cells', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['some', 'sample', 'data']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true,
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          }
        ],
        allowEmpty: false,
        afterValidate,
      });

      setDataAtCell(0, 0, null);
      setDataAtCell(0, 1);
      setDataAtCell(0, 2, '');

      await sleep(10);

      expect(afterValidate.calls.argsFor(0)).toEqual([false, null, 0, 0]);
      expect(afterValidate.calls.argsFor(1)).toEqual([false, undefined, 0, 1]);
      expect(afterValidate.calls.argsFor(2)).toEqual([false, '', 0, 2]);
    });
  });

  describe('strict mode', () => {
    it('should validate negatively when chars have different size', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        type: 'autocomplete',
        source: ['some', 'sample', 'data'],
        strict: true,
        afterValidate,
      });

      setDataAtCell(0, 0, 'Some');

      await sleep(10);

      expect(afterValidate).toHaveBeenCalledWith(false, 'Some', 0, 0);
    });
  });
});
