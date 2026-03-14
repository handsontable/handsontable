describe('multiSelectRenderer', () => {
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

    describe('rendering the chips', () => {
      it('should render all the items stored in the cell array as chips, ' +
        'if the column width is large enough', async() => {
        handsontable({
          data: [
            [choices],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              width: 500,
            },
          ],
        });

        const sourceDataAtCell = getSourceDataAtCell(0, 0);

        expect(sourceDataAtCell).toEqual(choices);

        const chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');

        expect(chipsContainer.find('.ht-multi-select-chip').length).toEqual(4);

        expect(chipsContainer.find('.ht-multi-select-chip').eq(0).text()).toEqual('yellow');
        expect(chipsContainer.find('.ht-multi-select-chip').eq(1).text()).toEqual('red');
        expect(chipsContainer.find('.ht-multi-select-chip').eq(2).text()).toEqual('orange');
        expect(chipsContainer.find('.ht-multi-select-chip').eq(3).text()).toEqual('green');
      });

      it('should display only as many chips as fit in the column width and add an overflow indicator', async() => {
        const longChoicesLongOptions = longChoices.map(choice =>
          (
            choice.value ?
              { key: choice.key, value: `${choice.value} very long option text` } :
              `${choice} very long option text`
          )
        );

        handsontable({
          data: [
            [longChoicesLongOptions],
          ],
          columns: [
            {
              type: 'multiselect',
              source: longChoicesLongOptions,
            },
          ],
        });

        let chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        let renderedChips = chipsContainer.find('.ht-multi-select-chip');
        let visibleChips = renderedChips.filter(':visible');

        hot().updateSettings({
          colWidths: [
            (hot().stylesHandler.getCSSVariableValue('cell-horizontal-padding') * 2) +
            // TODO: replace `8` with the theme variable for the chips horizontal padding.
            ((visibleChips.eq(0).outerWidth() + 8) * 3) + 50
          ],
        });

        chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        renderedChips = chipsContainer.find('.ht-multi-select-chip');
        visibleChips = renderedChips.filter(':visible');

        expect(visibleChips.length).toEqual(3);

        expect(visibleChips.eq(0).text()).toEqual('yellow very long option text');
        expect(visibleChips.eq(1).text()).toEqual('red very long option text');
        expect(visibleChips.eq(2).text()).toEqual('orange very long option text');

        expect(chipsContainer.find('.ht-multi-select-overflow').length).toEqual(1);
        expect(chipsContainer.find('.ht-multi-select-overflow').text()).toEqual('+21');

        await updateSettings({
          columns: [
            {
              type: 'multiselect',
              source: longChoicesLongOptions,
              width: (hot().stylesHandler.getCSSVariableValue('cell-horizontal-padding') * 2) +
              // TODO: replace `8` with the theme variable for the chips horizontal padding.
                ((visibleChips.eq(0).outerWidth() + 8) * 6) + 50,
            },
          ],
        });

        await waitForNextAnimationFrames(1);

        chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        renderedChips = chipsContainer.find('.ht-multi-select-chip');
        visibleChips = renderedChips.filter(':visible');

        expect(visibleChips.length).toEqual(6);
        expect(visibleChips.eq(0).text()).toEqual('yellow very long option text');
        expect(visibleChips.eq(1).text()).toEqual('red very long option text');
        expect(visibleChips.eq(2).text()).toEqual('orange very long option text');
        expect(visibleChips.eq(3).text()).toEqual('green very long option text');
        expect(visibleChips.eq(4).text()).toEqual('blue very long option text');
        expect(visibleChips.eq(5).text()).toEqual('gray very long option text');

        expect(chipsContainer.find('.ht-multi-select-overflow').length).toEqual(1);
        expect(chipsContainer.find('.ht-multi-select-overflow').text()).toEqual('+18');
      });

      it('should render chips reflecting the underlying cell data when the column is sorted', async() => {
        handsontable({
          data: [
            [choices.slice(0, 2)],
            [choices.slice(2, 4)],
            [choices.slice(0, 3)],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              width: 500,
            },
          ],
          columnSorting: true,
        });

        getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

        for (let visualRow = 0; visualRow < 3; visualRow++) {
          const physicalRow = hot().toPhysicalRow(visualRow);
          const sourceData = getSourceDataAtCell(physicalRow, 0);
          const chipsContainer =
            $(`table.htCore tr:eq(${visualRow}) td:eq(0) .ht-multi-select-chips-container`);
          const renderedChips = chipsContainer.find('.ht-multi-select-chip');

          expect(renderedChips.length).toEqual(sourceData.length);

          for (let i = 0; i < sourceData.length; i++) {
            const expectedText = sourceData[i].value || sourceData[i];

            expect(renderedChips.eq(i).text()).toEqual(expectedText);
          }
        }
      });
    });

    describe('removing a chip', () => {
      it('should remove the chip from the cell data when clicking the remove button', async() => {
        const choicesLongOptions = choices.map(choice => (choice.value ?
          { key: choice.key, value: `${choice.value} very long option text` } :
          `${choice} very long option text`
        ));

        handsontable({
          data: [[choicesLongOptions]],
          columns: [
            {
              type: 'multiselect',
              source: choicesLongOptions,
              width: 600,
            },
          ],
        });

        let chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        let renderedChips = chipsContainer.find('.ht-multi-select-chip');
        let visibleChips = renderedChips.filter(':visible');

        hot().updateSettings({
          columns: [
            {
              type: 'multiselect',
              source: choicesLongOptions,
              width: (hot().stylesHandler.getCSSVariableValue('cell-horizontal-padding') * 2) +
              // TODO: replace `8` with the theme variable for the chips horizontal padding.
              ((visibleChips.eq(0).outerWidth() + 8) * 3) + 50,
            },
          ],
        });

        chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        renderedChips = chipsContainer.find('.ht-multi-select-chip');
        visibleChips = renderedChips.filter(':visible');

        expect(getSourceDataAtCell(0, 0)).toEqual(choicesLongOptions);

        expect(visibleChips.length).toEqual(3);
        expect(visibleChips.eq(0).text()).toEqual('yellow very long option text');
        expect(visibleChips.eq(1).text()).toEqual('red very long option text');
        expect(visibleChips.eq(2).text()).toEqual('orange very long option text');

        expect(chipsContainer.find('.ht-multi-select-overflow').length).toEqual(1);
        expect(chipsContainer.find('.ht-multi-select-overflow:visible').size()).toEqual(1);
        expect(chipsContainer.find('.ht-multi-select-overflow').text()).toEqual('+1');

        const removeButton = visibleChips.eq(0).find('.ht-multi-select-chip-remove');

        removeButton.click();

        chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        renderedChips = chipsContainer.find('.ht-multi-select-chip');
        visibleChips = renderedChips.filter(':visible');

        const expectedSourceData = choicesLongOptions.filter(
          choice => choice.value !== 'yellow very long option text' && choice !== 'yellow very long option text'
        );

        expect(getSourceDataAtCell(0, 0)).toEqual(expectedSourceData);

        expect(chipsContainer.find('.ht-multi-select-chip').length).toEqual(3);
        expect(chipsContainer.find('.ht-multi-select-chip').eq(0).text()).toEqual('red very long option text');
        expect(chipsContainer.find('.ht-multi-select-chip').eq(1).text()).toEqual('orange very long option text');
        expect(chipsContainer.find('.ht-multi-select-chip').eq(2).text()).toEqual('green very long option text');

        expect(chipsContainer.find('.ht-multi-select-overflow').length).toEqual(1);
        expect(chipsContainer.find('.ht-multi-select-overflow:visible').size()).toEqual(0);
      });

      it('should remove the correct entry from the underlying cell data when the column is sorted', async() => {
        const firstRowChoices = choices.slice(0, 2);
        const secondRowChoices = choices.slice(1, 4);

        handsontable({
          data: [
            [firstRowChoices],
            [secondRowChoices],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              width: 500,
            },
          ],
          columnSorting: true,
        });

        getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

        const physicalRow = hot().toPhysicalRow(0);
        const sourceDataBefore = getSourceDataAtCell(physicalRow, 0);

        let chipsContainer =
          $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        let renderedChips = chipsContainer.find('.ht-multi-select-chip');

        expect(renderedChips.length).toEqual(sourceDataBefore.length);

        const removeButton = renderedChips.eq(0).find('.ht-multi-select-chip-remove');
        const removedChipText = renderedChips.eq(0).text();

        removeButton.click();

        const sourceDataAfter = getSourceDataAtCell(physicalRow, 0);
        const expectedSourceData = sourceDataBefore.filter(
          choice => (choice.value || choice) !== removedChipText
        );

        expect(sourceDataAfter).toEqual(expectedSourceData);

        chipsContainer =
          $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        renderedChips = chipsContainer.find('.ht-multi-select-chip');

        expect(renderedChips.length).toEqual(expectedSourceData.length);

        for (let i = 0; i < expectedSourceData.length; i++) {
          const expectedText = expectedSourceData[i].value || expectedSourceData[i];

          expect(renderedChips.eq(i).text()).toEqual(expectedText);
        }
      });

      it('should be possible to remove chips using the chip removal button, when the table was initialized ' +
        'with an AoO (array of objects) type dataset', async() => {
        handsontable({
          data: [
            { color: choices },
          ],
          columns: [
            {
              data: 'color',
              type: 'multiselect',
              source: choices,
              width: 500,
            },
          ],
        });

        expect(getSourceDataAtCell(0, 0)).toEqual(choices);

        const chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        const renderedChips = chipsContainer.find('.ht-multi-select-chip');

        expect(renderedChips.length).toEqual(4);

        const removeButton = renderedChips.eq(0).find('.ht-multi-select-chip-remove');
        const removedChipText = renderedChips.eq(0).text();

        removeButton.click();

        const expectedSourceData = choices.filter(
          choice => (choice.value || choice) !== removedChipText
        );

        expect(getSourceDataAtCell(0, 0)).toEqual(expectedSourceData);

        const chipsContainerAfter = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        const renderedChipsAfter = chipsContainerAfter.find('.ht-multi-select-chip');

        expect(renderedChipsAfter.length).toEqual(3);
        expect(renderedChipsAfter.eq(0).text()).toEqual(choices[1].value || choices[1]);
        expect(renderedChipsAfter.eq(1).text()).toEqual(choices[2].value || choices[2]);
        expect(renderedChipsAfter.eq(2).text()).toEqual(choices[3].value || choices[3]);
      });
    });
  });
});
