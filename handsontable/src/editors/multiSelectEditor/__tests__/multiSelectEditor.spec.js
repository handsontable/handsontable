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

    describe('`maxSelections` option', () => {
      it('should disable unchecked checkboxes after reaching the maxSelections limit', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              maxSelections: 2,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.htMultiSelectEditor');
        const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        const $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');

        await simulateClick($yellowCheckbox);
        await simulateClick($redCheckbox);
        await sleep(10);

        expect($dropdown.find('input[type="checkbox"]:checked').length).toBe(2);

        const $uncheckedCheckboxes = $dropdown.find('input[type="checkbox"]:not(:checked)');

        expect($uncheckedCheckboxes.length).toBe(choices.length - 2);

        $uncheckedCheckboxes.each(function() {
          expect($(this).prop('disabled')).toBe(true);
        });

        await simulateClick($orangeCheckbox);
        await sleep(10);

        expect($orangeCheckbox.prop('checked')).toBe(false);
      });

      it('should re-enable unchecked checkboxes after deselecting below maxSelections', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              maxSelections: 2,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.htMultiSelectEditor');
        const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        const $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');

        await simulateClick($yellowCheckbox);
        await simulateClick($redCheckbox);
        await sleep(10);

        $dropdown.find('input[type="checkbox"]:not(:checked)').each(function() {
          expect($(this).prop('disabled')).toBe(true);
        });

        await simulateClick($yellowCheckbox);
        await sleep(10);

        expect($yellowCheckbox.prop('checked')).toBe(false);

        $dropdown.find('input[type="checkbox"]').each(function() {
          expect($(this).prop('disabled')).toBe(false);
        });

        await simulateClick($orangeCheckbox);
        await sleep(10);

        expect($orangeCheckbox.prop('checked')).toBe(true);
        expect($dropdown.find('input[type="checkbox"]:checked').length).toBe(2);
      });

      it('should keep unchecked entries disabled after filtering until selections are reduced, then enable them',
        async() => {
          handsontable({
            data: [
              [[]],
            ],
            columns: [
              {
                type: 'multiSelect',
                source: choices,
                maxSelections: 2,
              },
            ],
          });

          await selectCell(0, 0);
          await keyDownUp('enter');
          await sleep(10);

          const editor = getActiveEditor();
          const $dropdown = $('.htMultiSelectEditor');
          const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
          let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');

          await simulateClick($yellowCheckbox);
          await simulateClick($redCheckbox);
          await sleep(10);

          expect($dropdown.find('input[type="checkbox"]:checked').length).toBe(2);

          editor.TEXTAREA.value = 'a';
          editor.TEXTAREA.focus();
          await keyDownUp('a');
          await sleep(10);

          const $filteredDropdown = $('.htMultiSelectEditor');
          const $visibleCheckboxes = $filteredDropdown.find('input[type="checkbox"]');

          $visibleCheckboxes.each(function() {
            if (!$(this).prop('checked')) {
              expect($(this).prop('disabled')).toBe(true);
            }
          });

          const $orangeCheckbox = $filteredDropdown.find('input[type="checkbox"][data-value="orange"]');

          await simulateClick($orangeCheckbox);
          await sleep(10);

          expect($orangeCheckbox.prop('checked')).toBe(false);
          expect($orangeCheckbox.prop('disabled')).toBe(true);

          $filteredDropdown.find('input[type="checkbox"]:not(:checked)').each(function() {
            expect($(this).prop('disabled')).toBe(true);
          });

          $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
          await simulateClick($yellowCheckbox);
          await sleep(10);

          expect($yellowCheckbox.prop('checked')).toBe(false);
          expect($yellowCheckbox.prop('disabled')).toBe(false);

          await simulateClick($orangeCheckbox);
          await sleep(10);

          expect($orangeCheckbox.prop('checked')).toBe(true);
          expect($orangeCheckbox.prop('disabled')).toBe(false);

          $filteredDropdown.find('input[type="checkbox"]:not(:checked)').each(function() {
            expect($(this).prop('disabled')).toBe(true);
          });
        });

      it('should respect `maxSelections` when committing values using the TEXTAREA and comma key', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              maxSelections: 2,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();
        let $dropdown = $('.htMultiSelectEditor');

        editor.TEXTAREA.value = 'yellow,';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        $dropdown = $('.htMultiSelectEditor');
        let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        let $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        let $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(false);
        expect($greenCheckbox.prop('checked')).toBe(false);
        expect(editor.TEXTAREA.value).toBe('yellow,');

        editor.TEXTAREA.value = 'yellow, red,';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        $dropdown = $('.htMultiSelectEditor');
        $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(true);
        expect($greenCheckbox.prop('checked')).toBe(false);
        expect(editor.TEXTAREA.value).toBe('yellow, red,');

        editor.TEXTAREA.value = 'yellow, red, green,';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        $dropdown = $('.htMultiSelectEditor');
        $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(true);
        expect($greenCheckbox.prop('checked')).toBe(false);
        expect(editor.TEXTAREA.value).toBe('yellow, red, green,');

        await keyDownUp('enter');
        await sleep(10);

        expect(getSourceDataAtCell(0, 0)).toEqual(choices.filter(
          choice => ['yellow', 'red'].includes(choice.value ?? choice)
        ));
        expect(getDataAtCell(0, 0)).toEqual('yellow, red');

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        editor.TEXTAREA.value = 'red, green,';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        $dropdown = $('.htMultiSelectEditor');
        $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(false);
        expect($redCheckbox.prop('checked')).toBe(true);
        expect($greenCheckbox.prop('checked')).toBe(true);
        expect(editor.TEXTAREA.value).toBe('red, green,');
      });
    });

    describe('`filteringCaseSensitive` option', () => {
      it('should filter case-insensitively when the option is disabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              filteringCaseSensitive: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();
        const $htContainer = $('.htMultiSelectEditor');

        expect($htContainer.find('li').length).toBe(choices.length);

        editor.TEXTAREA.value = 'Y';
        editor.TEXTAREA.focus();
        await keyDownUp('Y');
        await sleep(10);

        const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

        expect(items).toEqual(
          choices
            .map(choice => choice?.value || choice)
            .filter(value => value.toLowerCase().includes('y'))
        );
      });

      it('should filter case-sensitively when the option is enabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              filteringCaseSensitive: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();
        const $htContainer = $('.htMultiSelectEditor');

        expect($htContainer.find('li').length).toBe(choices.length);

        editor.TEXTAREA.value = 'Y';
        editor.TEXTAREA.focus();
        await keyDownUp('Y');
        await sleep(10);

        const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

        expect(items).toEqual([]);
      });
    });

    describe('`sourceSortFunction` option', () => {
      it('should use provided function to sort dropdown options', async() => {
        const sourceSortFunction = (entries) => entries
          .slice()
          .sort((a, b) => {
            const valueA = a?.value ?? a;
            const valueB = b?.value ?? b;

            return valueA.localeCompare(valueB);
          })
          .reverse();

        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              sourceSortFunction,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.htMultiSelectEditor');
        const items = Array.from($dropdown.find('li label')).map(label => label.textContent);
        const expectedOrder = choices
          .slice()
          .sort((a, b) => {
            const valueA = a?.value ?? a;
            const valueB = b?.value ?? b;

            return valueA.localeCompare(valueB);
          })
          .reverse()
          .map(choice => choice?.value ?? choice);

        expect(items).toEqual(expectedOrder);
      });
    });
  });
});
