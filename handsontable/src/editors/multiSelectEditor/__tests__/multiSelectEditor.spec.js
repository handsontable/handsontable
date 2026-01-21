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
        $(`<div id="${id}" style="width: 300px; height: 600px; overflow: auto"></div>`).appendTo('body');
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

        const $dropdown = $('.ht-multi-select-editor');
        const $checkboxes = $dropdown.find('input[type="checkbox"]');

        expect($checkboxes.length).toBe(choices.length);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

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

        const $dropdown = $('.ht-multi-select-editor');

        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(2);

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

        const $dropdown = $('.ht-multi-select-editor');
        const $checkboxes = $dropdown.find('input[type="checkbox"]');

        expect($checkboxes.length).toBe(choices.length);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

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

        const $dropdown = $('.ht-multi-select-editor');

        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(2);

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
          expect($('.ht-multi-select-editor').offset().top)
            .toBeGreaterThan($(getCell(0, 0)).offset().top);
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
          expect($('.ht-multi-select-editor').offset().top)
            .toBeLessThan(await $(getCell(10, 0)).offset().top);
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

        const $dropdown = $('.ht-multi-select-editor');
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

        const $dropdown = $('.ht-multi-select-editor');
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
          const $dropdown = $('.ht-multi-select-editor');
          const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
          let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');

          await simulateClick($yellowCheckbox);
          await simulateClick($redCheckbox);
          await sleep(10);

          expect($dropdown.find('input[type="checkbox"]:checked').length).toBe(2);

          const input = editor.getInputElement();

          input.value = 'a';
          input.focus();
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await sleep(10);

          const $filteredDropdown = $('.ht-multi-select-editor');
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
        const $htContainer = $('.ht-multi-select-editor');

        expect($htContainer.find('li').length).toBe(choices.length);

        const input = editor.getInputElement();

        input.value = 'Y';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
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
        const $htContainer = $('.ht-multi-select-editor');

        expect($htContainer.find('li').length).toBe(choices.length);

        const input = editor.getInputElement();

        input.value = 'Y';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(10);

        const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

        expect(items).toEqual([]);
      });
    });

    describe('`sourceSortFunction` option', () => {
      it('should use provided function to sort dropdown options', async() => {
        const sourceSortFunction = entries => entries
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

        const $dropdown = $('.ht-multi-select-editor');
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

    describe('clicking on dropdown items', () => {
      it('should toggle selection when clicking on the checkbox', async() => {
        handsontable({
          data: [
            [[]],
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

        const $dropdown = $('.ht-multi-select-editor');
        const $checkbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        await simulateClick($checkbox);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(1);

        await simulateClick($checkbox);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);
      });

      it('should toggle selection when clicking on the label', async() => {
        handsontable({
          data: [
            [[]],
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

        const $dropdown = $('.ht-multi-select-editor');
        const $checkbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $label = $dropdown.find('label[for="ht-multi-select-editor-item-0"]');

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        await simulateClick($label);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(1);

        await simulateClick($label);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);
      });

      it('should toggle selection when clicking on the list item element', async() => {
        handsontable({
          data: [
            [[]],
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

        const $dropdown = $('.ht-multi-select-editor');
        const $checkbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $listItem = $checkbox.closest('li');

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        await simulateClick($listItem);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(1);

        await simulateClick($listItem);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);
      });
    });

    describe('dropdown width', () => {
      it('should have a minimum width of 120px when source entries are short', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: ['a', 'b', 'c'],
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        expect($('.ht-multi-select-editor').width()).toEqual(120);
      });

      it('should size to content width when source entries are longer than min-width', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: ['This is a very long option text'],
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const dropdownWidth = $dropdown.width();

        expect(dropdownWidth).toEqual(
          $dropdown.find('li:first-child label').width() +
          $dropdown.find('li:first-child input').width() +
          hot().stylesHandler.getCSSVariableValue('gap-size') +
          (hot().stylesHandler.getCSSVariableValue('cell-horizontal-padding') * 2)
        );
      });
    });

    describe('removing a chip', () => {
      it('the dropdown selections should reflect the cells state after removing a chip ' +
        'by clicking on the chip\'s remove button', async() => {
        handsontable({
          data: [[choices.filter(
            choice => ['yellow', 'red', 'orange'].includes(choice.value ?? choice)
          )]],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              width: 250,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        let $dropdown = $('.ht-multi-select-editor');
        let $checkedCheckboxes = $dropdown.find('input[type="checkbox"]:checked');

        expect($checkedCheckboxes.length).toEqual(3);
        expect($checkedCheckboxes.eq(0).data('value')).toBe('yellow');
        expect($checkedCheckboxes.eq(1).data('value')).toBe('red');
        expect($checkedCheckboxes.eq(2).data('value')).toBe('orange');

        const chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        const renderedChips = chipsContainer.find('.ht-multi-select-chip');
        const visibleChips = renderedChips.filter(':visible');

        const removeButton = visibleChips.eq(0).find('.ht-multi-select-chip-remove');

        removeButton.click();
        await sleep(10);

        $dropdown = $('.ht-multi-select-editor');
        $checkedCheckboxes = $dropdown.find('input[type="checkbox"]:checked');

        expect($checkedCheckboxes.length).toEqual(2);
        expect($checkedCheckboxes.eq(0).data('value')).toBe('red');
        expect($checkedCheckboxes.eq(1).data('value')).toBe('orange');

      });
    });

    // TODO: Consider if this option is still needed after implementing the chips renderer.
    xdescribe('`validateOnCommit` option', () => {
      it('should keep only values present in the source when enabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              validateOnCommit: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();

        editor.TEXTAREA.value = 'yellow, not-in-list, green,';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        await keyDownUp('enter');
        await sleep(10);

        const sourceData = getSourceDataAtCell(0, 0);
        const visualData = getDataAtCell(0, 0);

        const expectedSourceData = choices.filter(
          choice => ['yellow', 'green'].includes(choice.value ?? choice)
        );

        expect(sourceData).toEqual(expectedSourceData);
        expect(visualData).toEqual('yellow, green');
      });

      it('should keep only values present in the source when not defined (default behavior)', async() => {
        handsontable({
          data: [
            [[]],
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

        const editor = getActiveEditor();

        editor.TEXTAREA.value = 'yellow, not-in-list, green,';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        await keyDownUp('enter');
        await sleep(10);

        const sourceData = getSourceDataAtCell(0, 0);
        const visualData = getDataAtCell(0, 0);

        const expectedSourceData = choices.filter(
          choice => ['yellow', 'green'].includes(choice.value ?? choice)
        );

        expect(sourceData).toEqual(expectedSourceData);
        expect(visualData).toEqual('yellow, green');
      });

      it('should allow any committed values when disabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
              validateOnCommit: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();

        editor.TEXTAREA.value = 'yellow, not-in-list, green,';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        await keyDownUp('enter');
        await sleep(10);

        const sourceData = getSourceDataAtCell(0, 0);
        const visualData = getDataAtCell(0, 0);

        expect(sourceData).toEqual(['yellow', 'not-in-list', 'green']);
        expect(visualData).toEqual('yellow, not-in-list, green');
      });
    });
  });
});
