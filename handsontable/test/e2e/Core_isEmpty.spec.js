describe('Core.isEmpty*', () => {
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

  describe('isEmptyRow', () => {
    it('should be empty row', async() => {
      handsontable();
      const hot = getInstance();

      expect(hot.isEmptyRow(0)).toEqual(true);
    });

    it('should not be empty row', async() => {
      handsontable();
      await setDataAtCell(0, 0, 'test');
      const hot = getInstance();

      expect(hot.isEmptyRow(0)).toEqual(false);
    });

    it('should bind this to instance', async() => {
      handsontable();
      const hot = getInstance();
      const check = hot.isEmptyRow;

      expect(check(0)).toEqual(true); // this may be change in future when we switch to define isEmptyCol in prototype
    });

    it('should return true when all cells contain the dataSchema default primitive values (GH #671, GH #2409)', async() => {
      handsontable({
        data: [{ active: false, name: null }],
        dataSchema: { active: false, name: null },
        columns: [
          { data: 'active', type: 'checkbox' },
          { data: 'name' },
        ],
      });
      const hot = getInstance();

      expect(hot.isEmptyRow(0)).toEqual(true);
    });

    it('should return false when a cell has a value different from the dataSchema default primitive value (GH #671)', async() => {
      handsontable({
        data: [{ active: true, name: null }],
        dataSchema: { active: false, name: null },
        columns: [
          { data: 'active', type: 'checkbox' },
          { data: 'name' },
        ],
      });
      const hot = getInstance();

      expect(hot.isEmptyRow(0)).toEqual(false);
    });

    it('should treat a row with only dataSchema default object values as empty', async() => {
      handsontable({
        data: [{ meta: { checked: false }, name: null }],
        dataSchema: { meta: { checked: false }, name: null },
        columns: [
          { data: 'meta' },
          { data: 'name' },
        ],
      });
      const hot = getInstance();

      expect(hot.isEmptyRow(0)).toEqual(true);
    });

    it('should return true when all array cells contain the dataSchema default values', async() => {
      handsontable({
        data: [[false, null]],
        dataSchema: [false, null],
      });
      const hot = getInstance();

      expect(hot.isEmptyRow(0)).toEqual(true);
    });

    it('should return false for a non-null value when no dataSchema is explicitly defined', async() => {
      handsontable({
        data: [[false, null]],
      });
      const hot = getInstance();

      expect(hot.isEmptyRow(0)).toEqual(false);
    });
  });

  describe('isEmptyCol', () => {
    it('should be empty row', async() => {
      handsontable();
      const hot = getInstance();

      expect(hot.isEmptyCol(0)).toEqual(true);
    });

    it('should not be empty row', async() => {
      handsontable();
      await setDataAtCell(0, 0, 'test');
      const hot = getInstance();

      expect(hot.isEmptyCol(0)).toEqual(false);
    });

    it('should bind this to instance', async() => {
      handsontable();
      const hot = getInstance();
      const check = hot.isEmptyCol;

      expect(check(0)).toEqual(true); // this may be change in future when we switch to define isEmptyCol in prototype
    });

    it('should return true when all cells in a column contain the dataSchema default value (GH #671)', async() => {
      handsontable({
        data: [{ active: false }, { active: false }],
        dataSchema: { active: false },
        columns: [
          { data: 'active', type: 'checkbox' },
        ],
      });
      const hot = getInstance();

      expect(hot.isEmptyCol(0)).toEqual(true);
    });

    it('should return false when any cell in a column differs from the dataSchema default', async() => {
      handsontable({
        data: [{ active: false }, { active: true }],
        dataSchema: { active: false },
        columns: [
          { data: 'active', type: 'checkbox' },
        ],
      });
      const hot = getInstance();

      expect(hot.isEmptyCol(0)).toEqual(false);
    });
  });
});
