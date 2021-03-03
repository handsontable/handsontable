/* eslint max-len: ["error", { "code": 150 }] */
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';

function createColspanSettings(overwriteProps = {}) {
  return {
    label: '',
    colspan: 1,
    origColspan: 1,
    isHidden: false,
    isCollapsed: false,
    collapsible: false,
    isRoot: false,
    isPlaceholder: false,
    ...overwriteProps,
  };
}

function createPlaceholder() {
  return {
    label: '',
    isPlaceholder: true,
  };
}

describe('SourceSettings', () => {
  describe('constructor', () => {
    it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
          createColspanSettings({ label: 'B2' }),
          createColspanSettings({ label: '4' }),
        ],
        [
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
      ]);
    });
  });

  describe('setColumnsLimit', () => {
    it('should limit source settings', () => {
      const settings = new SourceSettings();

      settings.setColumnsLimit(1);
      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
        ],
        [
          createColspanSettings({ label: '' }),
        ],
      ]);
    });
  });

  describe('setData', () => {
    it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
          createColspanSettings({ label: 'B2' }),
          createColspanSettings({ label: '4' }),
        ],
        [
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
      ]);
    });
  });

  describe('getData', () => {
    it('should return normalized settings', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
          createColspanSettings({ label: 'B2' }),
          createColspanSettings({ label: '4' }),
        ],
        [
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
      ]);
    });
  });

  describe('mergeWith', () => {
    it('should merge additional settings (there is support only for positive header level values)', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      settings.mergeWith([
        { row: 0, col: 0, collapsible: true },
        { row: 1, col: 1, label: 'B2_mod' },
        { row: 2, col: 2 },
        { row: -2, col: 1, collapsible: true },
        { row: 3, col: 1, collapsible: true },
      ]);

      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1', collapsible: true }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
          createColspanSettings({ label: 'B2_mod' }),
          createColspanSettings({ label: '4' }),
        ],
        [
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
      ]);
    });

    it('should not merge properties which are not known or forbidden to set', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      settings.mergeWith([
        { row: 0, col: 0, test: 'test-a', isHidden: true, colspan: 99, isBlank: true },
        { row: 1, col: 1, test1: 'test-b', isHidden: true },
        { row: 2, col: 2, test2: 'test-c', test3: 'test-d' },
        { row: -2, col: 1, test4: 'test-e', isCollapsed: true },
        { row: 3, col: 1, test5: 'test-d', origColspan: 99 },
      ]);

      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
          createColspanSettings({ label: 'B2' }),
          createColspanSettings({ label: '4' }),
        ],
        [
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
      ]);
    });
  });

  describe('map', () => {
    it('should merge additional settings using callback', () => {
      const mapSpy = jasmine.createSpy();
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      mapSpy.and.callFake((headerSettings) => {
        if (headerSettings.label === 'A1') {
          return { collapsible: true };
        }
      });

      settings.map(mapSpy);

      expect(mapSpy).toHaveBeenCalledTimes(9);
      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1', collapsible: true }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
          createColspanSettings({ label: 'B2' }),
          createColspanSettings({ label: '4' }),
        ],
        [
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
      ]);
    });

    it('should not merge properties which are not known or forbidden to set', () => {
      const mapSpy = jasmine.createSpy();
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      mapSpy.and.callFake((headerSettings) => {
        if (headerSettings.label === 'A1') {
          return {
            colspan: 3,
            test: 'a',
            isCollapsed: true,
            origColspan: 99,
          };
        }
      });

      settings.map(mapSpy);

      expect(mapSpy).toHaveBeenCalledTimes(9);
      expect(settings.getData()).toEqual([
        [
          createColspanSettings({ label: 'A1' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
        [
          createColspanSettings({ label: 'true' }),
          createColspanSettings({ label: 'B2' }),
          createColspanSettings({ label: '4' }),
        ],
        [
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
          createColspanSettings({ label: '' }),
        ],
      ]);
    });
  });

  describe('getHeaderSettings', () => {
    it('should return null when user-defined settings are empty', () => {
      {
        const settings = new SourceSettings();

        expect(settings.getHeaderSettings(0, 0)).toBe(null);
      }
      {
        const settings = new SourceSettings([[]]);

        expect(settings.getHeaderSettings(0, 0)).toBe(null);
      }
    });

    it('should return null when passed header level exceeds the user-defined nested headers array settings', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.getHeaderSettings(3, 0)).toBe(null);
      expect(settings.getHeaderSettings(-1, 0)).toBe(null);
    });

    it('should return null when passed column index exceeds the user-defined nested headers array settings', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.getHeaderSettings(0, 3)).toBe(null);
    });

    it('should return column settings for specified coordinates', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(settings.getHeaderSettings(0, 0)).toEqual(createColspanSettings({ label: 'A' }));
      expect(settings.getHeaderSettings(0, 1)).toEqual(createColspanSettings({
        label: 'B',
        colspan: 8,
        origColspan: 8,
      }));
      expect(settings.getHeaderSettings(0, 2)).toEqual(createPlaceholder());
      expect(settings.getHeaderSettings(2, 5)).toEqual(createColspanSettings({
        label: 'K',
        colspan: 2,
        origColspan: 2,
      }));
      expect(settings.getHeaderSettings(2, 6)).toEqual(createPlaceholder());
    });
  });

  describe('getHeadersSettings', () => {
    it('should return an empty array when user-defined settings are empty', () => {
      {
        const settings = new SourceSettings();

        expect(settings.getHeadersSettings(0, 0).length).toBe(0);
      }
      {
        const settings = new SourceSettings();

        settings.setData([[]]);

        expect(settings.getHeadersSettings(0, 0).length).toBe(0);
      }
    });

    it('should return an empty array when passed header level exceeds the user-defined nested headers array settings', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.getHeadersSettings(3, 0)).toEqual([]);
      expect(settings.getHeadersSettings(-1, 0)).toEqual([]);
    });

    it('should return columns settings for specified header level', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(settings.getHeadersSettings(0, 0)).toEqual([
        createColspanSettings({ label: 'A' })
      ]);
      expect(settings.getHeadersSettings(1, 0)).toEqual([
        createColspanSettings({ label: 'D' })
      ]);
      expect(settings.getHeadersSettings(2, 0)).toEqual([
        createColspanSettings({ label: 'H' })
      ]);
      expect(settings.getHeadersSettings(3, 0)).toEqual([
        createColspanSettings({ label: 'N' })
      ]);
      expect(settings.getHeadersSettings(0, 1, 8)).toEqual([
        createColspanSettings({ label: 'B', colspan: 8, origColspan: 8 })
      ]);
      expect(settings.getHeadersSettings(0, 9)).toEqual([
        createColspanSettings({ label: 'C' })
      ]);
    });

    it('should return columns settings for specified header level and column length', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(settings.getHeadersSettings(0, 0, 9)).toEqual([
        createColspanSettings({ label: 'A' }),
        createColspanSettings({ label: 'B', colspan: 8, origColspan: 8 }),
      ]);
      expect(settings.getHeadersSettings(1, 1, 4)).toEqual([
        createColspanSettings({ label: 'E', colspan: 4, origColspan: 4 }),
      ]);
      expect(settings.getHeadersSettings(1, 1, 8)).toEqual([
        createColspanSettings({ label: 'E', colspan: 4, origColspan: 4 }),
        createColspanSettings({ label: 'F', colspan: 4, origColspan: 4 }),
      ]);
      expect(settings.getHeadersSettings(2, 5, 5)).toEqual([
        createColspanSettings({ label: 'K', colspan: 2, origColspan: 2 }),
        createColspanSettings({ label: 'L', colspan: 2, origColspan: 2 }),
        createColspanSettings({ label: 'M' })
      ]);
      expect(settings.getHeadersSettings(3, 5, 3)).toEqual([
        createColspanSettings({ label: 'S' }),
        createColspanSettings({ label: 'T' }),
        createColspanSettings({ label: 'U' }),
      ]);
    });

    it('should throw an exception when the first retrieved column settings overlaps the passed "columnIndex" argument', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(() => {
        settings.getHeadersSettings(0, 2);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(0, 8);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(1, 2);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(1, 3);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(2, 2);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(2, 4);
      }).toThrowError('The first column settings cannot overlap the other header layers');
    });

    it('should throw an exception when the last retrieved column settings overlaps the passed "columnIndex"+"columnsLength" arguments', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(() => {
        settings.getHeadersSettings(0, 1, 4);
      }).toThrowError('The last column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(1, 1, 1);
      }).toThrowError('The last column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(1, 5, 3);
      }).toThrowError('The last column settings cannot overlap the other header layers');
      expect(() => {
        settings.getHeadersSettings(2, 3, 1);
      }).toThrowError('The last column settings cannot overlap the other header layers');
    });
  });

  describe('getLayersCount', () => {
    it('should return proper layers count based on user-defined settings', () => {
      {
        const settings = new SourceSettings();

        expect(settings.getLayersCount()).toBe(0);
      }
      {
        const settings = new SourceSettings();

        settings.setData([]);

        expect(settings.getLayersCount()).toBe(0);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          ['A1', 'A2'],
          [],
          [],
        ]);

        expect(settings.getLayersCount()).toBe(3);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [{ label: 'A1' }, { label: 'A2', colspan: 1 }],
          [],
          [],
        ]);

        expect(settings.getLayersCount()).toBe(3);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [{ label: 'A1' }, { label: 'A2', colspan: 4 }],
          [],
          [],
        ]);

        expect(settings.getLayersCount()).toBe(3);
      }
    });
  });

  describe('getColumnsCount', () => {
    it('should return proper columns count based on user-defined settings', () => {
      {
        const settings = new SourceSettings();

        expect(settings.getColumnsCount()).toBe(0);
      }
      {
        const settings = new SourceSettings();

        settings.setData([]);

        expect(settings.getColumnsCount()).toBe(0);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(0);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          ['A1', 'A2'],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(2);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [{ label: 'A1' }, { label: 'A2', colspan: 1 }],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(2);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [{ label: 'A1' }, { label: 'A2', colspan: 4 }],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(5);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [],
          ['A1', 'A2', 'A3'],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(3);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [],
          [{ label: 'A1' }, { label: 'A2', colspan: 4 }, 'A3'],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(6);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [],
          [],
          ['A1', 'A2', 'A3', 'A4'],
        ]);

        expect(settings.getColumnsCount()).toBe(4);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [],
          [],
          [{ label: 'A1' }, { label: 'A2', colspan: 1 }, { label: 'A3', colspan: 1, foo: 'bar' }, 'A4'],
        ]);

        expect(settings.getColumnsCount()).toBe(4);
      }
      {
        const settings = new SourceSettings();

        settings.setData([
          [],
          [],
          [{ label: 'A1' }, { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2, foo: 'bar' }, 'A4'],
        ]);

        expect(settings.getColumnsCount()).toBe(8);
      }
    });
  });

  describe('clear', () => {
    it('should clear the data', () => {
      const settings = new SourceSettings();

      settings.setData([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);
      settings.clear();

      expect(settings.getData()).toEqual([]);
      expect(settings.getLayersCount()).toBe(0);
      expect(settings.getColumnsCount()).toBe(0);
    });
  });
});
