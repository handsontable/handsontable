/* eslint max-len: ["error", { "code": 140 }] */
import {
  createColspanSettings,
  createPlaceholder,
} from 'handsontable/plugins/nestedHeaders/__tests__/helpers';
import { normalizeSettings } from 'handsontable/plugins/nestedHeaders/stateManager/settingsNormalizer';

function createColspanSourceSettings(overwriteProps) {
  return {
    ...createColspanSettings(overwriteProps),
    crossHiddenColumns: [],
    isRoot: false,
  };
}

describe('normalizeSettings', () => {
  it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
    expect(normalizeSettings([])).toEqual([]);
    expect(normalizeSettings([[]])).toEqual([[]]);
    expect(normalizeSettings([['A1']])).toEqual([[
      createColspanSourceSettings({ l: 'A1' })
    ]]);
    expect(normalizeSettings([
      ['A1'],
      [{ label: true }, 'B2', 4],
      [],
    ])).toEqual([
      [
        createColspanSourceSettings({ l: 'A1' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'true' }),
        createColspanSourceSettings({ l: 'B2' }),
        createColspanSourceSettings({ l: '4' }),
      ],
      [
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
      ],
    ]);
  });

  it('should normalize user-defined settings into known uniform structure data (advanced settings, inconsistent columns length)', () => {
    const settings = [
      ['A', { label: 'B', colspan: 8 }, 'C'],
      ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
      ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
      ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
    ];

    expect(normalizeSettings(settings)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B', colspan: 8, origColspan: 8 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'C' }),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'F', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'K', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'L', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'M' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
        createColspanSourceSettings({ l: 'P' }),
        createColspanSourceSettings({ l: 'Q' }),
        createColspanSourceSettings({ l: 'R' }),
        createColspanSourceSettings({ l: 'S' }),
        createColspanSourceSettings({ l: 'T' }),
        createColspanSourceSettings({ l: 'U' }),
        createColspanSourceSettings({ l: 'V' }),
        createColspanSourceSettings({ l: '' }),
      ],
    ]);
  });

  it('should normalize user-defined settings with limited columns count with colspan structure preservation', () => {
    const settings = [
      ['A', { label: 'B', colspan: 8 }, 'C'],
      ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
      ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
      ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
    ];

    expect(normalizeSettings(settings, 6)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B', colspan: 5, origColspan: 5 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'F' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'J', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'K' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
        createColspanSourceSettings({ l: 'P' }),
        createColspanSourceSettings({ l: 'Q' }),
        createColspanSourceSettings({ l: 'R' }),
        createColspanSourceSettings({ l: 'S' }),
      ],
    ]);
    expect(normalizeSettings(settings, 4)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'J' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
        createColspanSourceSettings({ l: 'P' }),
        createColspanSourceSettings({ l: 'Q' }),
      ],
    ]);
    expect(normalizeSettings(settings, 1)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
      ],
    ]);
    expect(normalizeSettings(settings, 0)).toEqual([]);
    expect(normalizeSettings(settings, 2)).toEqual([
      [
        createColspanSourceSettings({ l: 'A' }),
        createColspanSourceSettings({ l: 'B' }),
      ],
      [
        createColspanSourceSettings({ l: 'D' }),
        createColspanSourceSettings({ l: 'E' }),
      ],
      [
        createColspanSourceSettings({ l: 'H' }),
        createColspanSourceSettings({ l: 'I' }),
      ],
      [
        createColspanSourceSettings({ l: 'N' }),
        createColspanSourceSettings({ l: 'O' }),
      ],
    ]);
  });

  it('should normalize rowspan property from user-defined settings', () => {
    const settings = [
      [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }, { label: 'C', rowspan: 2 }],
      ['D', 'E'],
    ];

    expect(normalizeSettings(settings)).toEqual([
      [
        createColspanSourceSettings({ l: 'A', rowspan: 2 }),
        createColspanSourceSettings({ l: 'B', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'C', rowspan: 2 }),
      ],
      [
        { ...createColspanSourceSettings({ l: 'D' }), isRowspanPlaceholder: true },
        createColspanSourceSettings({ l: 'E' }),
        createColspanSourceSettings({ l: '' }),
        { ...createColspanSourceSettings({ l: '' }), isRowspanPlaceholder: true },
      ],
    ]);
  });

  it('should mark cells covered by rowspan as isRowspanPlaceholder in lower rows', () => {
    const settings = [
      [{ label: 'A', rowspan: 3 }, 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
    ];

    const result = normalizeSettings(settings);

    // Row 0: A has rowspan=3, B and C are normal
    expect(result[0][0]).toEqual(createColspanSourceSettings({ l: 'A', rowspan: 3 }));
    expect(result[0][1]).toEqual(createColspanSourceSettings({ l: 'B' }));
    expect(result[0][2]).toEqual(createColspanSourceSettings({ l: 'C' }));

    // Row 1: col 0 is covered by A's rowspan, D and E are normal
    expect(result[1][0].isRowspanPlaceholder).toBe(true);
    expect(result[1][1]).toEqual(createColspanSourceSettings({ l: 'E' }));
    expect(result[1][2]).toEqual(createColspanSourceSettings({ l: 'F' }));

    // Row 2: col 0 is covered by A's rowspan, G, H, I are normal
    expect(result[2][0].isRowspanPlaceholder).toBe(true);
    expect(result[2][1]).toEqual(createColspanSourceSettings({ l: 'H' }));
    expect(result[2][2]).toEqual(createColspanSourceSettings({ l: 'I' }));
  });

  it('should clamp rowspan to not exceed the total number of header layers', () => {
    const settings = [
      [{ label: 'A', rowspan: 10 }, 'B'],
      ['C', 'D'],
    ];

    const result = normalizeSettings(settings);

    // Even though rowspan=10, only 2 layers exist, so only row 1 is marked
    expect(result[0][0].rowspan).toBe(10);
    expect(result[1][0].isRowspanPlaceholder).toBe(true);
  });

  it('should support rowspan combined with colspan on the same header', () => {
    const settings = [
      [{ label: 'A', rowspan: 2, colspan: 2 }, 'B'],
      ['C', 'D', 'E'],
    ];

    const result = normalizeSettings(settings);

    // Row 0: A spans 2 cols and 2 rows, B is normal
    expect(result[0][0]).toEqual(createColspanSourceSettings({ l: 'A', colspan: 2, origColspan: 2, rowspan: 2 }));
    expect(result[0][1]).toEqual({ label: '', isPlaceholder: true });
    expect(result[0][2]).toEqual(createColspanSourceSettings({ l: 'B' }));

    // Row 1: cols 0 and 1 are covered by A's rowspan+colspan
    expect(result[1][0].isRowspanPlaceholder).toBe(true);
    expect(result[1][1].isRowspanPlaceholder).toBe(true);
    expect(result[1][2]).toEqual(createColspanSourceSettings({ l: 'E' }));
  });

  it('should ignore rowspan values of 1 or less', () => {
    const settings = [
      [{ label: 'A', rowspan: 1 }, { label: 'B', rowspan: 0 }, { label: 'C', rowspan: -1 }],
      ['D', 'E', 'F'],
    ];

    const result = normalizeSettings(settings);

    expect(result[0][0].rowspan).toBe(1);
    expect(result[0][1].rowspan).toBe(1);
    expect(result[0][2].rowspan).toBe(1);

    // No rowspan placeholders in row 1
    expect(result[1][0].isRowspanPlaceholder).toBe(false);
    expect(result[1][1].isRowspanPlaceholder).toBe(false);
    expect(result[1][2].isRowspanPlaceholder).toBe(false);
  });

  it('should normalize user-defined settings even when it contains overlapping headers', () => {
    const settings = [
      ['A1', 'A2'],
      [{ label: 'B1' }, { label: 'B2', colspan: 4 }],
      ['C1', { label: 'C2', colspan: 3 }, { label: 'C3', colspan: 2 }, 'C4'],
    ];

    expect(normalizeSettings(settings)).toEqual([
      [
        createColspanSourceSettings({ l: 'A1' }),
        createColspanSourceSettings({ l: 'A2' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'B1' }),
        createColspanSourceSettings({ l: 'B2', colspan: 4, origColspan: 4 }),
        createPlaceholder(),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: '' }),
        createColspanSourceSettings({ l: '' }),
      ],
      [
        createColspanSourceSettings({ l: 'C1' }),
        createColspanSourceSettings({ l: 'C2', colspan: 3, origColspan: 3 }),
        createPlaceholder(),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'C3', colspan: 2, origColspan: 2 }),
        createPlaceholder(),
        createColspanSourceSettings({ l: 'C4' }),
      ],
    ]);
  });
});
