describe('settings', () => {
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

  describe('dataDotNotation', () => {
    it('should be `true` by default', () => {
      handsontable({
        data: createSpreadsheetData(5, 5)
      });

      expect(getSettings().dataDotNotation).toBe(true);
    });

    it('should be possible to access the nested objects by using dots in the columns\' names', () => {
      handsontable({
        data: [
          { name: { first: 'Ted', last: 'Williams' }, city: 'Boston' },
          { name: { first: 'John', last: 'Smith' }, city: 'New York' },
        ],
        columns: [
          { data: 'name.last' },
          { data: 'city' },
          { data: 'name.first' },
        ],
        dataDotNotation: true,
      });

      expect(getData()).toEqual([
        ['Williams', 'Boston', 'Ted'],
        ['Smith', 'New York', 'John'],
      ]);
      expect(getDataAtRowProp(0, 'name.last')).toBe('Williams');
      expect(getDataAtRowProp(0, 'city')).toBe('Boston');
      expect(getDataAtRowProp(0, 'name.first')).toBe('Ted');
      expect(getSourceDataAtCell(0, 'name.last')).toBe('Williams');
      expect(getSourceDataAtCell(0, 'city')).toBe('Boston');
      expect(getSourceDataAtCell(0, 'name.first')).toBe('Ted');
    });

    it('should be possible to disable dot notation for columns\' names', () => {
      handsontable({
        data: [
          { name: { first: 'Ted' }, lastName: 'Williams', 'user.city': 'Boston' },
          { name: { first: 'John' }, lastName: 'Smith', 'user.city': 'New York' },
        ],
        columns: [
          { data: 'lastName' },
          { data: 'user.city' },
          { data: 'name.first' },
        ],
        dataDotNotation: false,
      });

      expect(getData()).toEqual([
        ['Williams', 'Boston', null],
        ['Smith', 'New York', null],
      ]);
      expect(getDataAtRowProp(0, 'lastName')).toBe('Williams');
      expect(getDataAtRowProp(0, 'user.city')).toBe('Boston');
      expect(getDataAtRowProp(0, 'name.first')).toBe(null);
      expect(getSourceDataAtCell(0, 'lastName')).toBe('Williams');
      expect(getSourceDataAtCell(0, 'user.city')).toBe('Boston');
      expect(getSourceDataAtCell(0, 'name.first')).toBe(undefined);
    });

    it('should be possible to disable dot notation using `updateSettings`', () => {
      handsontable({
        data: [
          { name: { first: 'Ted' }, lastName: 'Williams', 'user.city': 'Boston' },
        ],
        columns: [
          { data: 'lastName' },
          { data: 'user.city' },
          { data: 'name.first' },
        ],
        dataDotNotation: true,
      });

      updateSettings({
        dataDotNotation: false,
      });

      expect(getData()).toEqual([['Williams', 'Boston', null]]);
    });

    it('should be possible to enable dot notation using `updateSettings`', () => {
      handsontable({
        data: [
          { name: { first: 'Ted', last: 'Williams' }, city: 'Boston' },
        ],
        columns: [
          { data: 'name.last' },
          { data: 'city' },
          { data: 'name.first' },
        ],
        dataDotNotation: false,
      });

      updateSettings({
        dataDotNotation: true,
      });

      expect(getData()).toEqual([['Williams', 'Boston', 'Ted']]);
    });
  });
});
