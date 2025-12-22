describe('AutocompleteEditor key/value source', () => {
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
          type: 'autocomplete',
          source: airportKVChoices,
        }],
      });

      await setDataAtCell(0, 0, '');
      await sleep(10);
      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(10);

      expect(editor.htEditor.countRows()).toEqual(airportKVChoices.length);
      expect(editor.htEditor.getData()).toEqual(airportKVChoices.map(item => [item.value]));
    });
  });

  describe('Displaying the choices list', () => {
    it('should filter the choices list using the `value` prop of the autocomplete\'s source object', async() => {
      handsontable({
        data: airportKVChoices.map(item => [item]),
        columns: [{
          type: 'autocomplete',
          source: airportKVChoices,
        }],
      });

      await sleep(10);
      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(10);

      editor.TEXTAREA.value = 'lo';
      editor.queryChoices(editor.TEXTAREA.value);

      const filteredChoices =
        airportKVChoices.filter(item => item.value.toLowerCase().includes('lo'));

      expect(editor.htEditor.countRows()).toEqual(filteredChoices.length);
      expect(editor.htEditor.getData()).toEqual(filteredChoices.map(item => [item.value]));
    });

    it('should display the `value` property from the source object as the visible cell value', async() => {
      handsontable({
        data: airportKVChoices.map(item => [item]),
        columns: [{
          type: 'autocomplete',
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
          type: 'autocomplete',
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
          type: 'autocomplete',
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

  describe('Autofill', () => {
    it('should autofill on autocomplete-typed cells with key/value source and paste the source data', async() => {
      handsontable({
        data: [
          [airportKVChoices[0]],
          [null],
          [null],
        ],
        columns: [{
          type: 'autocomplete',
          source: airportKVChoices,
        }],
        fillHandle: true,
      });

      await selectCell(0, 0, 0, 0);

      spec().$container.find('.wtBorder.corner').simulate('mousedown');
      spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
      spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseup');

      await sleep(10);

      expect(getDataAtCell(0, 0)).toBe(airportKVChoices[0].value);
      expect(getDataAtCell(1, 0)).toBe(airportKVChoices[0].value);
      expect(getDataAtCell(2, 0)).toBe(airportKVChoices[0].value);

      expect(getSourceDataAtCell(0, 0)).toEqual(airportKVChoices[0]);
      expect(getSourceDataAtCell(1, 0)).toEqual(airportKVChoices[0]);
      expect(getSourceDataAtCell(2, 0)).toEqual(airportKVChoices[0]);
    });
  });
});
