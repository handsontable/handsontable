describe('dropdownValidator', () => {
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

  it('should validate negatively when value does not match to the source', async() => {
    const afterValidate = jasmine.createSpy('afterValidate');

    handsontable({
      data: [
        ['some', 'sample', 'data'],
      ],
      type: 'dropdown',
      source: ['some', 'sample', 'data'],
      afterValidate,
    });

    setDataAtCell(0, 0, 'Some');

    await sleep(10);

    expect(afterValidate).toHaveBeenCalledWith(false, 'Some', 0, 0);
  });

  it('should validate all cells after changing the editor type to custom one (#dev-470)', async() => {
    const afterValidate = jasmine.createSpy('afterValidate');

    handsontable({
      data: [
        ['some', 'sample', 'data'],
      ],
      type: 'dropdown',
      editor: class CustomEditor extends Handsontable.editors.DropdownEditor {},
      source: ['some', 'sample', 'data'],
      afterValidate,
    });

    setDataAtCell([
      [0, 0, 'test1'],
      [0, 1, 'test2'],
      [0, 2, 'test3'],
      [0, 3, 'data'],
      [1, 0, 'test5'],
    ]);

    await sleep(10);

    expect(afterValidate.calls.argsFor(0)).toEqual([false, 'test5', 1, 0]);
    expect(afterValidate.calls.argsFor(1)).toEqual([true, 'data', 0, 3]);
    expect(afterValidate.calls.argsFor(2)).toEqual([false, 'test3', 0, 2]);
    expect(afterValidate.calls.argsFor(3)).toEqual([false, 'test2', 0, 1]);
    expect(afterValidate.calls.argsFor(4)).toEqual([false, 'test1', 0, 0]);
  });

  describe('allowEmpty', () => {
    it('should validate empty cells positively (by default)', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        type: 'dropdown',
        source: ['some', 'sample', 'data'],
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
        type: 'dropdown',
        source: ['some', 'sample', 'data'],
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
        type: 'dropdown',
        source: ['some', 'sample', 'data'],
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
            type: 'dropdown',
            source: ['some', 'sample', 'data'],
          },
          {
            type: 'dropdown',
            source: ['some', 'sample', 'data'],
            allowEmpty: false
          },
          {
            type: 'dropdown',
            source: ['some', 'sample', 'data'],
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
            type: 'dropdown',
            source: ['some', 'sample', 'data'],
          },
          {
            type: 'dropdown',
            source: ['some', 'sample', 'data'],
          },
          {
            type: 'dropdown',
            source: ['some', 'sample', 'data'],
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
});
