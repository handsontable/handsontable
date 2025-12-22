describe('MultiSelectEditor copy & paste', () => {
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

    it('should keep correct items checked after copy & paste without opening the editor', async() => {
      handsontable({
        data: [
          [[choices[0], choices[3]], []],
          [[], []],
        ],
        columns: [
          {
            type: 'multiSelect',
            source: choices,
          },
          {
            type: 'multiSelect',
            source: choices,
          },
        ],
      });

      const copyPastePlugin = getPlugin('CopyPaste');

      await selectCell(0, 0);

      const copyEvent = getClipboardEvent('copy');

      copyPastePlugin.setCopyableText();
      copyPastePlugin.onCopy(copyEvent);

      await selectCell(1, 1);

      copyPastePlugin.onPaste(copyEvent);

      await selectCell(1, 1);
      await keyDownUp('enter');
      await sleep(10);

      const $dropdown = $('.htMultiSelectEditor');

      expect($dropdown.find('li.htItemSelected').length).toBe(2);

      const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
      const $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
      const $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(true);
      expect($greenCheckbox.prop('checked')).toBe(true);
      expect($redCheckbox.prop('checked')).toBe(false);
      expect($orangeCheckbox.prop('checked')).toBe(false);

      expect(getDataAtCell(1, 1)).toEqual('yellow, green');
      expect(getSourceDataAtCell(1, 1)).toEqual([choices[0], choices[3]]);
    });
  });
});
