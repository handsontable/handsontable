describe('DropdownEditor key/value source', () => {
  const airportKVChoices = [
    { key: 'LAX', value: 'Los Angeles International Airport' },
    { key: 'JFK', value: 'John F. Kennedy International Airport' },
    { key: 'ORD', value: 'Chicago O\'Hare International Airport' },
    { key: 'LHR', value: 'London Heathrow Airport' },
    { key: 'CDG', value: 'Charles de Gaulle Airport' },
    { key: 'DXB', value: 'Dubai International Airport' },
    { key: 'HND', value: 'Tokyo Haneda Airport' },
    { key: 'PEK', value: 'Beijing Capital International Airport' },
    { key: 'SIN', value: 'Singapore Changi Airport' },
    { key: 'AMS', value: 'Amsterdam Airport Schiphol' },
    { key: 'FRA', value: 'Frankfurt Airport' },
    { key: 'ICN', value: 'Seoul Incheon International Airport' },
    { key: 'YYZ', value: 'Toronto Pearson International Airport' },
    { key: 'MAD', value: 'Madrid-Barajas Airport' },
    { key: 'BKK', value: 'Bangkok Suvarnabhumi Airport' },
    { key: 'MUC', value: 'Munich International Airport' },
    { key: 'SYD', value: 'Sydney Kingsford Smith Airport' },
    { key: 'BCN', value: 'Barcelona-El Prat Airport' },
    { key: 'KUL', value: 'Kuala Lumpur International Airport' },
    { key: 'ZRH', value: 'Zurich Airport' },
  ];

  beforeEach(function() {
    this.$container =
      $('<div id="testContainer" style="width: 300px; height: 200px; overflow: auto"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Initialization', () => {
    it('should allow passing a key/value object as a source and display the values in the choices list', async() => {
      handsontable({
        data: airportKVChoices.map(item => [item]),
        columns: [{
          type: 'dropdown',
          source: airportKVChoices,
        }],
      });

      await setDataAtCell(0, 0, '');
      await sleep(10);
      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(10);

      expect(editor.htEditor.getData()).toEqual(airportKVChoices.map(item => [item.value]));
    });
  });

  describe('Displaying the choices list', () => {
    it('should highlight the entry on the choice list using the `value` prop of the dropdown\'s source object', async() => {
      handsontable({
        data: airportKVChoices.map(item => [item]),
        columns: [{
          type: 'dropdown',
          source: airportKVChoices,
        }],
      });

      await sleep(10);
      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(10);

      editor.TEXTAREA.value = 'du';
      editor.queryChoices(editor.TEXTAREA.value);

      const filteredChoices =
        airportKVChoices.filter(item => item.value.toLowerCase().includes('du'));

      expect(editor.htEditor.getCell(...editor.htEditor.getSelectedLast().slice(0, 2)).textContent)
        .toEqual(filteredChoices[0].value);
    });

    it('should display the `value` property from the source object as the visible cell value', async() => {
      handsontable({
        data: airportKVChoices.map(item => [item]),
        columns: [{
          type: 'dropdown',
          source: airportKVChoices,
        }],
      });

      expect(getDataAtCell(0, 0)).toEqual(airportKVChoices[0].value);
    });

    it('should display the `value` property from the source object in the editable field of the editor, ' +
      'when the data is an AoO with key/value props', async() => {
      handsontable({
        data: airportKVChoices.map(item => [item]),
        columns: [{
          type: 'dropdown',
          source: airportKVChoices,
        }],
      });

      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(10);

      expect(editor.TEXTAREA.value).toEqual(airportKVChoices[0].value);
    });

  });

  describe('Saving values', () => {
    it('should save entire entries from the source object when the data is an AoO with the `key/value` props', async() => {
      handsontable({
        data: airportKVChoices.map(item => [item]),
        columns: [{
          type: 'dropdown',
          source: airportKVChoices,
        }],
      });

      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(10);

      editor.TEXTAREA.value = '';
      editor.queryChoices(editor.TEXTAREA.value);

      await keyDownUp('ArrowDown');
      await keyDownUp('ArrowDown');

      await keyDownUp('enter');

      await sleep(10);

      expect(getSourceDataAtCell(0, 0)).toEqual(airportKVChoices[1]);
    });
  });
});
