describe('multiSelectValidator', () => {
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
          [['yellow', 'red']],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        afterValidate,
      });

      await setDataAtCell(0, 0, '');

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(true, '', 0, 0);
    });

    it('should validate empty cells positively when allowEmpty is set to true', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [['yellow', 'red']],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        allowEmpty: true,
        afterValidate,
      });

      await setDataAtCell(0, 0, '');

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(true, '', 0, 0);
    });

    it('should validate empty cells negatively when allowEmpty is set to false', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [['yellow', 'red']],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        allowEmpty: false,
        afterValidate,
      });

      await setDataAtCell(0, 0, '');

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(false, '', 0, 0);
    });

    it('should respect the allowEmpty property for a single column', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [['yellow', 'red'], ['orange'], ['green']]
        ],
        columns: [
          {
            type: 'multiselect',
            source: ['yellow', 'red', 'orange', 'green'],
          },
          {
            type: 'multiselect',
            source: ['yellow', 'red', 'orange', 'green'],
            allowEmpty: false
          },
          {
            type: 'multiselect',
            source: ['yellow', 'red', 'orange', 'green'],
          }
        ],
        afterValidate,
      });

      await setDataAtCell(0, 0, '');
      await setDataAtCell(0, 1, '');
      await setDataAtCell(0, 2, '');

      await waitForNextAnimationFrames(2);

      expect(afterValidate.calls.argsFor(0)).toEqual([true, '', 0, 0]);
      expect(afterValidate.calls.argsFor(1)).toEqual([false, '', 0, 1]);
      expect(afterValidate.calls.argsFor(2)).toEqual([true, '', 0, 2]);
    });

    it('should work for null and undefined values in cells', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [['yellow', 'red'], ['orange'], ['green']]
        ],
        columns: [
          {
            type: 'multiselect',
            source: ['yellow', 'red', 'orange', 'green'],
          },
          {
            type: 'multiselect',
            source: ['yellow', 'red', 'orange', 'green'],
          },
          {
            type: 'multiselect',
            source: ['yellow', 'red', 'orange', 'green'],
          }
        ],
        allowEmpty: false,
        afterValidate,
      });

      await setDataAtCell(0, 0, null);
      await setDataAtCell(0, 1);
      await setDataAtCell(0, 2, '');

      await waitForNextAnimationFrames(2);

      expect(afterValidate.calls.argsFor(0)).toEqual([false, null, 0, 0]);
      expect(afterValidate.calls.argsFor(1)).toEqual([false, undefined, 0, 1]);
      expect(afterValidate.calls.argsFor(2)).toEqual([false, '', 0, 2]);
    });
  });

  describe('subset validation', () => {
    it('should validate positively when data is a subset of the source (array of strings)', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        afterValidate,
      });

      await setDataAtCell(0, 0, ['yellow', 'red']);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(true, ['yellow', 'red'], 0, 0);
    });

    it('should validate positively when data is a subset of the source (array of key/value objects)', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');
      const source = [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }
      ];

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source,
        afterValidate,
      });

      await setDataAtCell(0, 0, [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' }
      ]);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(true, [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' }
      ], 0, 0);
    });

    it('should validate positively when data is an empty array', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [['yellow', 'red']],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        afterValidate,
      });

      await setDataAtCell(0, 0, []);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(true, [], 0, 0);
    });

    it('should validate negatively when data is not a subset of the source (array of strings)', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        afterValidate,
      });

      await setDataAtCell(0, 0, ['yellow', 'blue']);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(false, ['yellow', 'blue'], 0, 0);
    });

    it('should validate negatively when data is not a subset of the source (array of key/value objects)', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');
      const source = [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }
      ];

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source,
        afterValidate,
      });

      await setDataAtCell(0, 0, [
        { key: 'yel', value: 'yellow' },
        { key: 'blu', value: 'blue' }
      ]);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(false, [
        { key: 'yel', value: 'yellow' },
        { key: 'blu', value: 'blue' }
      ], 0, 0);
    });
  });

  describe('type mismatch validation', () => {
    it('should validate negatively when data is a string instead of an array', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        afterValidate,
      });

      await setDataAtCell(0, 0, 'yellow');

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(false, 'yellow', 0, 0);
    });

    it('should validate negatively when data is an array of strings but source is an array of key/value objects', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');
      const source = [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }
      ];

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source,
        afterValidate,
      });

      await setDataAtCell(0, 0, ['yellow', 'red']);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(false, ['yellow', 'red'], 0, 0);
    });

    it('should validate negatively when data is an array of key/value objects but source is an array of strings', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source: ['yellow', 'red', 'orange', 'green'],
        afterValidate,
      });

      await setDataAtCell(0, 0, [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' }
      ]);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(false, [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' }
      ], 0, 0);
    });

    it('should validate negatively when data contains mixed types (strings and key/value objects)', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');
      const source = [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }
      ];

      handsontable({
        data: [
          [[]],
        ],
        type: 'multiselect',
        source,
        afterValidate,
      });

      await setDataAtCell(0, 0, [
        { key: 'yel', value: 'yellow' },
        'red'
      ]);

      await waitForNextAnimationFrames(2);

      expect(afterValidate).toHaveBeenCalledWith(false, [
        { key: 'yel', value: 'yellow' },
        'red'
      ], 0, 0);
    });
  });
});
