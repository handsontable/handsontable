import metaSchemaFactory from '../metaSchema';

describe('metaSchema', () => {
  describe('isEmptyRow()', () => {
    function createHotMock({ data, dataSchema } = {}) {
      const rows = data || [];
      const colCount = rows[0] ? rows[0].length : 0;

      return {
        getSettings: () => ({ dataSchema }),
        getSchema: () => dataSchema,
        countCols: () => colCount,
        getDataAtCell: (row, col) => rows[row] ? rows[row][col] : null,
        getCellMeta: (row, col) => ({ prop: col }),
      };
    }

    function createHotMockObjects({ data, dataSchema } = {}) {
      const rows = data || [];
      const schema = dataSchema;
      const props = schema ? Object.keys(schema) : (rows[0] ? Object.keys(rows[0]) : []);

      return {
        getSettings: () => ({ dataSchema: schema }),
        getSchema: () => schema,
        countCols: () => props.length,
        getDataAtCell: (row, col) => rows[row] ? rows[row][props[col]] : null,
        getCellMeta: (row, col) => ({ prop: props[col] }),
      };
    }

    it('should return true for a row where all cells are null (no dataSchema)', () => {
      const defaults = metaSchemaFactory();
      const hot = createHotMock({ data: [[null, null]] });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(true);
    });

    it('should return false for a row where a cell has a non-null value (no dataSchema)', () => {
      const defaults = metaSchemaFactory();
      const hot = createHotMock({ data: [['hello', null]] });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(false);
    });

    it('should return false for a non-null, non-empty-string value when no dataSchema is set (GH #671)', () => {
      // Without an explicit dataSchema, false is NOT treated as "empty"
      const defaults = metaSchemaFactory();
      const hot = createHotMock({ data: [[false, null]] });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(false);
    });

    it('should return true when all cells match their dataSchema default values (GH #671, GH #2409)', () => {
      const defaults = metaSchemaFactory();
      const schema = [false, null];
      const hot = createHotMock({ data: [[false, null]], dataSchema: schema });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(true);
    });

    it('should return false when a cell has a value different from its dataSchema default (GH #671)', () => {
      const defaults = metaSchemaFactory();
      const schema = [false, null];
      const hot = createHotMock({ data: [[true, null]], dataSchema: schema });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(false);
    });

    it('should return true when all object cells match their dataSchema default values (GH #671, GH #2409)', () => {
      const defaults = metaSchemaFactory();
      const schema = { active: false, name: null };
      const hot = createHotMockObjects({
        data: [{ active: false, name: null }],
        dataSchema: schema,
      });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(true);
    });

    it('should return false when an object cell differs from its dataSchema default (GH #671)', () => {
      const defaults = metaSchemaFactory();
      const schema = { active: false, name: null };
      const hot = createHotMockObjects({
        data: [{ active: true, name: null }],
        dataSchema: schema,
      });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(false);
    });

    it('should return true when numeric 0 cells match the dataSchema default of 0 (GH #671)', () => {
      const defaults = metaSchemaFactory();
      const schema = { value: 0 };
      const hot = createHotMockObjects({
        data: [{ value: 0 }],
        dataSchema: schema,
      });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(true);
    });
  });

  describe('isEmptyCol()', () => {
    function createHotMockObjects({ data, dataSchema } = {}) {
      const rows = data || [];
      const schema = dataSchema;
      const props = schema ? Object.keys(schema) : (rows[0] ? Object.keys(rows[0]) : []);

      return {
        getSettings: () => ({ dataSchema: schema }),
        getSchema: () => schema,
        countRows: () => rows.length,
        getDataAtCell: (row, col) => rows[row] ? rows[row][props[col]] : null,
        getCellMeta: (row, col) => ({ prop: props[col] }),
      };
    }

    it('should return true when all cells in a column are null (no dataSchema)', () => {
      const defaults = metaSchemaFactory();
      const hot = createHotMockObjects({ data: [{ active: null }, { active: null }] });

      expect(defaults.isEmptyCol.call(hot, 0)).toBe(true);
    });

    it('should return false when any cell in a column has a non-null value (no dataSchema)', () => {
      const defaults = metaSchemaFactory();
      const hot = createHotMockObjects({ data: [{ active: null }, { active: 'yes' }] });

      expect(defaults.isEmptyCol.call(hot, 0)).toBe(false);
    });

    it('should return true when all cells in a column contain the dataSchema default (GH #671)', () => {
      const defaults = metaSchemaFactory();
      const schema = { active: false };
      const hot = createHotMockObjects({
        data: [{ active: false }, { active: false }],
        dataSchema: schema,
      });

      expect(defaults.isEmptyCol.call(hot, 0)).toBe(true);
    });

    it('should return false when any cell in a column differs from the dataSchema default (GH #671)', () => {
      const defaults = metaSchemaFactory();
      const schema = { active: false };
      const hot = createHotMockObjects({
        data: [{ active: false }, { active: true }],
        dataSchema: schema,
      });

      expect(defaults.isEmptyCol.call(hot, 0)).toBe(false);
    });
  });
});
