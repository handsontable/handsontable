import GlobalMeta from 'handsontable/dataMap/metaManager/metaLayers/globalMeta';

describe('GlobalMeta', () => {
  it('should construct class with prepared meta object', () => {
    const meta = new GlobalMeta();

    expect(meta.metaCtor).toBeFunction();
    // Check if the meta object has one of many props from meta schema
    expect(meta.meta).toHaveProperty('activeHeaderClassName', 'ht__active_highlight');
    // Check if the meta object is a prototype
    expect(meta.meta).toHaveProperty('constructor', meta.metaCtor);
  });

  describe('getMetaConstructor()', () => {
    it('should returns meta constructor', () => {
      const meta = new GlobalMeta();

      expect(meta.getMetaConstructor()).toBe(meta.metaCtor);
    });
  });

  describe('getMeta()', () => {
    it('should returns meta object (prototype object)', () => {
      const meta = new GlobalMeta();

      expect(meta.getMeta()).toBe(meta.meta);
    });
  });

  describe('updateMeta()', () => {
    it('should update meta with custom settings', () => {
      const meta = new GlobalMeta();
      const settings = {
        activeHeaderClassName: 'foo',
        hiddenColumns: true,
        nestedHeaders: { row: 1, col: 2 },
        _myCustomKey: 'bar',
      };

      expect(meta.getMeta()).toHaveProperty('outsideClickDeselects', true);

      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('activeHeaderClassName', 'foo');
      expect(meta.getMeta()).toHaveProperty('hiddenColumns', true);
      expect(meta.getMeta()).toHaveProperty('nestedHeaders', settings.nestedHeaders);
      expect(meta.getMeta()).toHaveProperty('_myCustomKey', 'bar');
      expect(meta.getMeta()).toHaveProperty('outsideClickDeselects', true);
    });

    it('should expand "type" property to "editor", "renderer" and "validator" keys', () => {
      const meta = new GlobalMeta();
      const settings = {
        type: {
          _customKey: true,
          copyable: true,
          editor: 'foo',
          renderer: 'bar',
          validator: 'baz',
        }
      };

      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('type', settings.type);
      expect(meta.getMeta()).toHaveProperty('_customKey', true);
      expect(meta.getMeta()).toHaveProperty('copyable', true);
      expect(meta.getMeta()).toHaveProperty('editor', 'foo');
      expect(meta.getMeta()).toHaveProperty('renderer', 'bar');
      expect(meta.getMeta()).toHaveProperty('validator', 'baz');
    });

    it('should expand "type" property to "editor", "renderer" and "validator"', () => {
      const meta = new GlobalMeta();
      const settings = {
        type: 'text',
      };

      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('type', 'text');
      expect(meta.getMeta().editor).toBeFunction();
      expect(meta.getMeta().renderer).toBeFunction();
    });
  });
});
