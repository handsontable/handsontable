describe('MultiSelectEditor', () => {
  const id = 'testContainer';

  using('configuration object', [
    {
      choices: ['yellow', 'red', 'orange', 'green'],
      longChoices: [
        'yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white', 'purple', 'lime',
        'olive', 'cyan', 'pink', 'brown', 'silver', 'gold', 'maroon', 'navy', 'teal', 'indigo',
        'violet', 'magenta', 'coral', 'crimson',
      ],
    },
    {
      choices: [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }],
      longChoices: [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' },
        { key: 'blu', value: 'blue' },
        { key: 'gry', value: 'gray' },
        { key: 'blk', value: 'black' },
        { key: 'wht', value: 'white' },
        { key: 'pur', value: 'purple' },
        { key: 'lim', value: 'lime' },
        { key: 'olv', value: 'olive' },
        { key: 'cyn', value: 'cyan' },
        { key: 'pnk', value: 'pink' },
        { key: 'brn', value: 'brown' },
        { key: 'siv', value: 'silver' },
        { key: 'gld', value: 'gold' },
        { key: 'mro', value: 'maroon' },
        { key: 'nvy', value: 'navy' },
        { key: 'tla', value: 'teal' },
        { key: 'ind', value: 'indigo' },
        { key: 'vlt', value: 'violet' },
        { key: 'mgt', value: 'magenta' },
        { key: 'crr', value: 'coral' },
        { key: 'crm', value: 'crimson' },
      ],
    },
  ], ({ choices, longChoices }) => {
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

    describe('opening the editor', () => {
      it('should open empty editor with no items checked when cell value is empty', async() => {
        handsontable({
          columns: [
            {
              type: 'multiSelect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.htMultiSelectEditor');
        const $checkboxes = $dropdown.find('input[type="checkbox"]');

        expect($checkboxes.length).toBe(choices.length);
        expect($dropdown.find('li.htItemSelected').length).toBe(0);

        $checkboxes.each(function() {
          expect(this.checked).toBe(false);
        });
      });

      it('should open editor with items checked according to the cell value', async() => {
        handsontable({
          data: [
            [[choices[0], choices[3]]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
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
      });

      it('should open editor with no items checked when cell value is not in the dropdown', async() => {
        handsontable({
          data: [
            [['not-in-list']],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.htMultiSelectEditor');
        const $checkboxes = $dropdown.find('input[type="checkbox"]');

        expect($checkboxes.length).toBe(choices.length);
        expect($dropdown.find('li.htItemSelected').length).toBe(0);

        $checkboxes.each(function() {
          expect(this.checked).toBe(false);
        });
      });

      it('should open editor with only the existing dropdown items checked when cell value ' +
        'contains mixed values', async() => {
        handsontable({
          data: [
            [[choices[0], 'not-in-list', choices[3]]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
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
      });

      it('should open the editor downwards when there\'s enough space below the edited cell',
        async() => {
          spec().$container.css('height', '400px').css('overflow', 'auto');

          const data = [];

          for (let i = 0; i < 30; i++) {
            data[i] = [];

            for (let j = 0; j < 30; j++) {
              data[i].push([longChoices[j % longChoices.length]]);
            }
          }

          handsontable({
            data,
            type: 'multiSelect',
            source: longChoices,
          });

          await selectCell(0, 0);
          await keyDownUp('enter');
          await sleep(10);

          expect(getActiveEditor().dropdownController.isFlippedVertically()).toBe(false);
          expect($('.htMultiSelectEditor').offset().top)
            .toBeGreaterThan($('.handsontableInputHolder textarea').offset().top);
        });

      it('should open the editor upwards when there\'s more space above than below the edited cell',
        async() => {
          spec().$container.css('height', '400px').css('overflow', 'auto');

          const data = [];

          for (let i = 0; i < 30; i++) {
            data[i] = [];

            for (let j = 0; j < 30; j++) {
              data[i].push([longChoices[j % longChoices.length]]);
            }
          }

          handsontable({
            data,
            type: 'multiSelect',
            source: longChoices,
          });

          await selectCell(10, 0);
          await keyDownUp('enter');
          await sleep(10);

          expect(getActiveEditor().dropdownController.isFlippedVertically()).toBe(true);
          expect($('.htMultiSelectEditor').offset().top)
            .toBeLessThan($('.handsontableInputHolder textarea').offset().top);
        });
    });
  });
});
