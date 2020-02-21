import SourceSettings from 'handsontable/plugins/nestedHeaders/columnStatesManager/sourceSettings';

describe('settingsNormalizer', () => {
  describe('constructor', () => {
    it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
      const settings = new SourceSettings([
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]);

      expect(settings.data).toEqual([
        [
          { label: 'A1', colspan: 1, hidden: false },
          { label: '', colspan: 1, hidden: false },
          { label: '', colspan: 1, hidden: false },
        ],
        [
          { label: 'true', colspan: 1, hidden: false },
          { label: 'B2', colspan: 1, hidden: false },
          { label: '4', colspan: 1, hidden: false },
        ],
        [
          { label: '', colspan: 1, hidden: false },
          { label: '', colspan: 1, hidden: false },
          { label: '', colspan: 1, hidden: false },
        ],
      ]);
    });
  });

  describe('getColumnSettings', () => {
    it('should return null when user-defined settings are empty', () => {
      {
        const settings = new SourceSettings();

        expect(settings.getColumnSettings(0, 0)).toBe(null);
      }
      {
        const settings = new SourceSettings([[]]);

        expect(settings.getColumnSettings(0, 0)).toBe(null);
      }
    });

    it('should return null when passed header level exceeds the user-defined nested headers array settings', () => {
      const settings = new SourceSettings([[
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]]);

      expect(settings.getColumnSettings(3, 0)).toBe(null);
    });

    it('should return null when passed column index exceeds the user-defined nested headers array settings', () => {
      const settings = new SourceSettings([[
        ['A1'],
        [{ label: true }, 'B2', 4],
        [],
      ]]);

      expect(settings.getColumnSettings(0, 3)).toBe(null);
    });

    it('should return column settings for specified coordinates', () => {
      const settings = new SourceSettings([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(settings.getColumnSettings(0, 0)).toEqual({ label: 'A', colspan: 1, hidden: false });
      expect(settings.getColumnSettings(0, 1)).toEqual({ label: 'B', colspan: 8, hidden: false });
      expect(settings.getColumnSettings(0, 2)).toEqual({ label: '', colspan: 1, hidden: true });
      expect(settings.getColumnSettings(2, 5)).toEqual({ label: 'K', colspan: 2, hidden: false });
      expect(settings.getColumnSettings(2, 6)).toEqual({ label: '', colspan: 1, hidden: true });
    });
  });

  describe('getColumnsSettings', () => {
    it('should return an empty array when user-defined settings are empty', () => {
      {
        const settings = new SourceSettings();

        expect(settings.getColumnsSettings(0, 0).length).toBe(0);
      }
      {
        const settings = new SourceSettings([[]]);

        expect(settings.getColumnsSettings(0, 0).length).toBe(0);
      }
    });

    it('should return columns settings for specified header level', () => {
      const settings = new SourceSettings([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(settings.getColumnsSettings(0, 0)).toEqual([
        { label: 'A', colspan: 1, hidden: false },
      ]);
      expect(settings.getColumnsSettings(1, 0)).toEqual([
        { label: 'D', colspan: 1, hidden: false },
      ]);
      expect(settings.getColumnsSettings(2, 0)).toEqual([
        { label: 'H', colspan: 1, hidden: false },
      ]);
      expect(settings.getColumnsSettings(3, 0)).toEqual([
        { label: 'N', colspan: 1, hidden: false },
      ]);
      expect(settings.getColumnsSettings(0, 1, 8)).toEqual([
        { label: 'B', colspan: 8, hidden: false },
      ]);
      expect(settings.getColumnsSettings(0, 9)).toEqual([
        { label: 'C', colspan: 1, hidden: false },
      ]);
    });

    it('should return columns settings for specified header level and column length', () => {
      const settings = new SourceSettings([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(settings.getColumnsSettings(0, 0, 9)).toEqual([
        { label: 'A', colspan: 1, hidden: false },
        { label: 'B', colspan: 8, hidden: false },
      ]);
      expect(settings.getColumnsSettings(1, 1, 4)).toEqual([
        { label: 'E', colspan: 4, hidden: false },
      ]);
      expect(settings.getColumnsSettings(1, 1, 8)).toEqual([
        { label: 'E', colspan: 4, hidden: false },
        { label: 'F', colspan: 4, hidden: false },
      ]);
      expect(settings.getColumnsSettings(2, 5, 5)).toEqual([
        { label: 'K', colspan: 2, hidden: false },
        { label: 'L', colspan: 2, hidden: false },
        { label: 'M', colspan: 1, hidden: false },
      ]);
      expect(settings.getColumnsSettings(3, 5, 3)).toEqual([
        { label: 'S', colspan: 1, hidden: false },
        { label: 'T', colspan: 1, hidden: false },
        { label: 'U', colspan: 1, hidden: false },
      ]);
    });

    it('should throw an exception when the first retrieved column settings overlaps the passed "columnIndex" argument', () => {
      const settings = new SourceSettings([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(() => {
        settings.getColumnsSettings(0, 2);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(0, 8);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(1, 2);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(1, 3);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(2, 2);
      }).toThrowError('The first column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(2, 4);
      }).toThrowError('The first column settings cannot overlap the other header layers');
    });

    it('should throw an exception when the last retrieved column settings overlaps the passed "columnIndex"+"columnsLength" arguments', () => {
      const settings = new SourceSettings([
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]);

      expect(() => {
        settings.getColumnsSettings(0, 1, 4);
      }).toThrowError('The last column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(1, 1, 1);
      }).toThrowError('The last column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(1, 5, 3);
      }).toThrowError('The last column settings cannot overlap the other header layers');
      expect(() => {
        settings.getColumnsSettings(2, 3, 1);
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
        const settings = new SourceSettings([]);

        expect(settings.getLayersCount()).toBe(0);
      }
      {
        const settings = new SourceSettings([
          ['A1', 'A2'],
          [],
          [],
        ]);

        expect(settings.getLayersCount()).toBe(3);
      }
      {
        const settings = new SourceSettings([
          [{ label: 'A1' }, { label: 'A2', colspan: 1 }],
          [],
          [],
        ]);

        expect(settings.getLayersCount()).toBe(3);
      }
      {
        const settings = new SourceSettings([
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
        const settings = new SourceSettings([]);

        expect(settings.getColumnsCount()).toBe(0);
      }
      {
        const settings = new SourceSettings([
          [],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(0);
      }
      {
        const settings = new SourceSettings([
          ['A1', 'A2'],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(2);
      }
      {
        const settings = new SourceSettings([
          [{ label: 'A1' }, { label: 'A2', colspan: 1 }],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(2);
      }
      {
        const settings = new SourceSettings([
          [{ label: 'A1' }, { label: 'A2', colspan: 4 }],
          [],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(5);
      }
      {
        const settings = new SourceSettings([
          [],
          ['A1', 'A2', 'A3'],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(3);
      }
      {
        const settings = new SourceSettings([
          [],
          [{ label: 'A1' }, { label: 'A2', colspan: 4 }, 'A3'],
          [],
        ]);

        expect(settings.getColumnsCount()).toBe(6);
      }
      {
        const settings = new SourceSettings([
          [],
          [],
          ['A1', 'A2', 'A3', 'A4'],
        ]);

        expect(settings.getColumnsCount()).toBe(4);
      }
      {
        const settings = new SourceSettings([
          [],
          [],
          [{ label: 'A1' }, { label: 'A2', colspan: 1 }, { label: 'A3', colspan: 1, foo: 'bar' }, 'A4'],
        ]);

        expect(settings.getColumnsCount()).toBe(4);
      }
      {
        const settings = new SourceSettings([
          [],
          [],
          [{ label: 'A1' }, { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2, foo: 'bar' }, 'A4'],
        ]);

        expect(settings.getColumnsCount()).toBe(8);
      }
    });
  });
});
