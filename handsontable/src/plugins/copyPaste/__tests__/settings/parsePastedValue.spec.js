describe('CopyPaste', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    // Installing spy stabilizes the tests. Without that on CI and real browser there are some
    // differences in results.
    spyOn(document, 'execCommand');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`parsePastedValue` setting', () => {
    it('should not change the value of the cell when the source and pasted value do not match their schema (default behavior)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }],
          [{ id: 2, value: 'A2' }],
        ],
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 0);
      plugin.onPaste(event);

      // pasted value will be stringified (not parsed) to '[object Object]' no match with { id, value } schema
      expect(getDataAtCell(1, 0)).toEqual({ id: 2, value: 'A2' });
    });

    it('should change the value of the cell when the source and pasted value do match their schema - both values are stringified (default behavior)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }],
          ['test'],
        ],
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 0);
      plugin.onPaste(event);

      // pasted value will be stringified (not parsed) to '[object Object]' match with string ('test') schema
      expect(getDataAtCell(1, 0)).toBe('[object Object]');
    });

    it('should change the value of the cell when the source value is `null` (`parsePastedValue` is disabled)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }],
          [null],
        ],
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 0);
      plugin.onPaste(event);

      // pasted value will be stringified (not parsed) to '[object Object]' match with null schema
      expect(getDataAtCell(1, 0)).toBe('[object Object]');
    });

    it('should change the value of the cell (`parsePastedValue` is enabled)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }],
          [{ id: 2, value: 'A2' }],
          ['test'],
          [null],
        ],
        parsePastedValue: true,
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 0);
      plugin.onPaste(event);

      // pasted value will be parsed to `{ id: 1, value: 'A1' }` match with { id, value } schema
      expect(getDataAtCell(1, 0)).toEqual({ id: 1, value: 'A1' });

      await selectCell(2, 0);
      plugin.onPaste(event);

      // Pasted value parses to `{ id: 1, value: 'A1' }` match with string ('test') schema (relaxes the schema check)
      expect(getDataAtCell(2, 0)).toEqual({ id: 1, value: 'A1' });

      await selectCell(3, 0);
      plugin.onPaste(event);

      // Pasted value parses to `{ id: 1, value: 'A1' }` match with null schema (relaxes the schema check)
      expect(getDataAtCell(3, 0)).toEqual({ id: 1, value: 'A1' });
    });

    it('should paste the object-based cells as their displayed value, when the target cell is not object-based (`parsePastedValue` is disabled)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, 'test', null],
          [{ id: 2, value: 'A2' }, 'test2', null],
        ],
        columns: [
          {
            valueGetter: value => value?.value,
          },
          {},
          {},
        ],
        parsePastedValue: false,
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 1);
      plugin.onPaste(event);

      expect(getDataAtCell(1, 1)).toEqual('A1');

      await selectCell(1, 2);
      plugin.onPaste(event);

      expect(getDataAtCell(1, 2)).toEqual('A1');
    });

    it('should paste the object-based cells as their displayed value, when the target cell is not object-based (`parsePastedValue` is enabled)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, 'test'],
          [{ id: 2, value: 'A2' }, 'test2'],
        ],
        columns: [
          {
            valueGetter: value => value?.value,
          },
          {},
          {},
        ],
        parsePastedValue: false,
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 1);
      plugin.onPaste(event);

      // Pasted value parses to string ('A1') match with string ('test') schema
      expect(getDataAtCell(1, 1)).toEqual('A1');
    });

    it('should paste the object-based cells as source, when the target cell is `null` (`parsePastedValue` is enabled)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, null],
          [{ id: 2, value: 'A2' }, null],
        ],
        columns: [
          {
            valueGetter: value => value?.value,
          },
          {},
          {},
        ],
        parsePastedValue: true,
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 1);
      plugin.onPaste(event);

      // Pasted value parses to `{ id: 1, value: 'A1' }` match with null schema (relaxes the schema check)
      expect(getDataAtCell(1, 1)).toEqual({ id: 1, value: 'A1' });
    });

    it('should not paste the object-based cells, when the target cell is object-based, but it\'s data schema doesn\'t match the pasted content (`parsePastedValue` is disabled)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, { sth: 0, label: 'test' }],
          [{ id: 2, value: 'A2' }, { sth: 1, label: 'test2' }],
        ],
        valueGetter: value => value?.value ?? value?.label,
        parsePastedValue: false,
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 1);
      plugin.onPaste(event);

      expect(getDataAtCell(1, 1)).toEqual('test2');
      expect(getCopyableSourceData(1, 1)).toEqual({ sth: 1, label: 'test2' });
    });

    it('should not paste the object-based cells, when the target cell is object-based, but it\'s data schema doesn\'t match the pasted content (`parsePastedValue` is disabled)', async() => {
      handsontable({
        data: [
          [{ id: 1, value: 'A1' }, { sth: 0, label: 'test' }],
          [{ id: 2, value: 'A2' }, { sth: 1, label: 'test2' }],
        ],
        valueGetter: value => value?.value ?? value?.label,
        parsePastedValue: true,
      });

      const plugin = getPlugin('CopyPaste');
      const event = getClipboardEvent();

      await selectCell(0, 0);
      plugin.onCopy(event);

      await selectCell(1, 1);
      plugin.onPaste(event);

      expect(getDataAtCell(1, 1)).toEqual('test2');
      expect(getCopyableSourceData(1, 1)).toEqual({ sth: 1, label: 'test2' });
    });
  });
});
