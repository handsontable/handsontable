describe('MultiSelectEditor autofill', () => {
  const id = 'testContainer';

  using('configuration object', [
    { choices: ['yellow', 'red', 'orange', 'green'] },
    {
      choices: [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }],
    },
  ], ({ choices }) => {

    beforeEach(function() {
      this.$container =
        $(`<div id="${id}" style="width: 300px; height: 200px; overflow: auto"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should autofill over different-typed cells', async() => {
      handsontable({
        data: [
          [[choices[0], choices[3]], []],
          [null, []],
          [null, []],
        ],
        columns: [
          {
            type: 'text',
          },
          {
            type: 'multiSelect',
            source: choices,
          },
        ],
        fillHandle: true,
      });

      setCellMeta(0, 0, 'type', 'multiSelect');
      setCellMeta(0, 0, 'source', choices);

      await selectCell(0, 0, 0, 0);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(0) td:eq(1)').simulate('mouseover');
      spec().$container.find('tr:eq(0) td:eq(1)').simulate('mouseup');

      await sleep(10);

      expect(getDataAtCell(0, 1)).toBe('yellow, green');
      expect(getSourceDataAtCell(0, 1)).toEqual([choices[0], choices[3]]);

      await selectCell(0, 0, 0, 1);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(2) td:eq(1)').simulate('mouseover');
      spec().$container.find('tr:eq(2) td:eq(1)').simulate('mouseup');

      await sleep(10);

      // Non-multiselect-typed cells:
      expect(getDataAtCell(1, 0)).toBe('yellow, green');
      expect(getSourceDataAtCell(1, 0)).toEqual('yellow, green');

      expect(getDataAtCell(2, 0)).toBe('yellow, green');
      expect(getSourceDataAtCell(2, 0)).toEqual('yellow, green');

      // Multiselect-typed cells:
      expect(getDataAtCell(1, 1)).toBe('yellow, green');
      expect(getSourceDataAtCell(1, 1)).toEqual([choices[0], choices[3]]);

      expect(getDataAtCell(2, 1)).toBe('yellow, green');
      expect(getSourceDataAtCell(2, 1)).toEqual([choices[0], choices[3]]);
    });

    it('should autofill on multiselect-typed cells and paste the source data', async() => {
      handsontable({
        data: [
          [[choices[0], choices[3]]],
          [null],
          [null],
        ],
        columns: [
          {
            type: 'multiSelect',
            source: choices,
          },
        ],
        fillHandle: true,
      });

      await selectCell(0, 0, 0, 0);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
      spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseup');

      await sleep(10);

      // All multiselect-typed cells should have the same source data array copied by autofill.
      expect(getDataAtCell(0, 0)).toBe('yellow, green');
      expect(getSourceDataAtCell(0, 0)).toEqual([choices[0], choices[3]]);

      expect(getDataAtCell(1, 0)).toBe('yellow, green');
      expect(getSourceDataAtCell(1, 0)).toEqual([choices[0], choices[3]]);

      expect(getDataAtCell(2, 0)).toBe('yellow, green');
      expect(getSourceDataAtCell(2, 0)).toEqual([choices[0], choices[3]]);
    });
  });
});
