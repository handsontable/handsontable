import metaSchemaFactory from '../metaSchema';

describe('metaSchema', () => {
  describe('isEmptyRow()', () => {
    function createHotMock({ data, dataSchema } = {}) {
      const rows = data || [];
      const colCount = rows[0] ? rows[0].length : 0;
      // getSchema() in the real implementation always returns non-null (falls back to duckSchema)
      const duckSchema = rows[0] ? rows[0].map(() => null) : [];

      return {
        getSettings: () => ({ dataSchema }),
        getSchema: () => dataSchema ?? duckSchema,
        countCols: () => colCount,
        getDataAtCell: (row, col) => (rows[row] ? rows[row][col] : null),
        colToProp: col => col,
      };
    }

    function createHotMockObjects({ data, dataSchema } = {}) {
      const rows = data || [];
      const schema = dataSchema;
      const propsSource = schema || rows[0];
      const props = propsSource ? Object.keys(propsSource) : [];
      // getSchema() in the real implementation always returns non-null (falls back to duckSchema)
      const duckSchema = rows[0] ? Object.fromEntries(props.map(p => [p, null])) : {};

      return {
        getSettings: () => ({ dataSchema: schema }),
        getSchema: () => schema ?? duckSchema,
        countCols: () => props.length,
        getDataAtCell: (row, col) => (rows[row] ? rows[row][props[col]] : null),
        colToProp: col => props[col],
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

    it('should return false when a cell contains an object value differing from the duck-schema default', () => {
      // The duck-schema for { meta: { type: 'a' } } has { meta: null }.
      // { type: 'a' } !== null so the row is non-empty.
      const defaults = metaSchemaFactory();
      const hot = createHotMockObjects({ data: [{ meta: { type: 'a' } }] });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(false);
    });

    it('should return true when all object cells match the duck-schema (spare row with null leaves)', () => {
      // Regression (DEV-345): nested object data without an explicit dataSchema.
      // Spare rows have the duck-schema shape with null leaves — they must be treated as empty
      // so that minSpareRows does not keep appending rows indefinitely.
      const defaults = metaSchemaFactory();
      // Duck schema derived from first row: { meta: null }. A spare row is also { meta: null }.
      const hot = createHotMockObjects({ data: [{ meta: null }] });

      expect(defaults.isEmptyRow.call(hot, 0)).toBe(true);
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

    it('should continue checking remaining columns after an object column matches the schema default', () => {
      // Regression: the original object branch did `return isObjectEqual(...)`, short-circuiting
      // the loop. A later column with a non-default value was never checked.
      const defaults = metaSchemaFactory();
      const schema = { meta: { type: 'a' }, value: 0 };

      function createHotMockMixed({ data }) {
        const rows = data;
        const props = Object.keys(schema);

        return {
          getSettings: () => ({ dataSchema: schema }),
          getSchema: () => schema,
          countCols: () => props.length,
          getDataAtCell: (row, col) => rows[row][props[col]],
          colToProp: col => props[col],
        };
      }

      // Row where the object column matches its default but a later primitive column does NOT
      const hotNotEmpty = createHotMockMixed({
        data: [{ meta: { type: 'a' }, value: 99 }],
      });

      expect(defaults.isEmptyRow.call(hotNotEmpty, 0)).toBe(false);

      // Row where both columns match their defaults
      const hotEmpty = createHotMockMixed({
        data: [{ meta: { type: 'a' }, value: 0 }],
      });

      expect(defaults.isEmptyRow.call(hotEmpty, 0)).toBe(true);
    });
  });

  describe('isEmptyCol()', () => {
    function createHotMockObjects({ data, dataSchema } = {}) {
      const rows = data || [];
      const schema = dataSchema;
      const propsSource = schema || rows[0];
      const props = propsSource ? Object.keys(propsSource) : [];
      // getSchema() in the real implementation always returns non-null (falls back to duckSchema)
      const duckSchema = rows[0] ? Object.fromEntries(props.map(p => [p, null])) : {};

      return {
        getSettings: () => ({ dataSchema: schema }),
        getSchema: () => schema ?? duckSchema,
        countRows: () => rows.length,
        getDataAtCell: (row, col) => (rows[row] ? rows[row][props[col]] : null),
        colToProp: col => props[col],
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

    it('should return true when all cells in a column contain an object matching the dataSchema default (GH #671)', () => {
      const defaults = metaSchemaFactory();
      const schema = { meta: { type: 'a' } };
      const hot = createHotMockObjects({
        data: [{ meta: { type: 'a' } }, { meta: { type: 'a' } }],
        dataSchema: schema,
      });

      expect(defaults.isEmptyCol.call(hot, 0)).toBe(true);
    });

    it('should return false when any cell in a column contains an object differing from the dataSchema default (GH #671)', () => {
      const defaults = metaSchemaFactory();
      const schema = { meta: { type: 'a' } };
      const hot = createHotMockObjects({
        data: [{ meta: { type: 'a' } }, { meta: { type: 'b' } }],
        dataSchema: schema,
      });

      expect(defaults.isEmptyCol.call(hot, 0)).toBe(false);
    });

    it('should return true when all cells in a column match the duck-schema (spare rows with null leaves)', () => {
      // Regression (DEV-345): without an explicit dataSchema, object-typed columns from duck-schema
      // spare rows have null leaves — these must be treated as empty.
      const defaults = metaSchemaFactory();
      const hot = createHotMockObjects({ data: [{ meta: null }, { meta: null }] });

      expect(defaults.isEmptyCol.call(hot, 0)).toBe(true);
    });
  });
});
