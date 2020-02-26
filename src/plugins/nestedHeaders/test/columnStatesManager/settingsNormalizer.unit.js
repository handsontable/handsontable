import { settingsNormalizer } from 'handsontable/plugins/nestedHeaders/columnStatesManager/settingsNormalizer';

describe('settingsNormalizer', () => {
  it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
    expect(settingsNormalizer([])).toEqual([]);
    expect(settingsNormalizer([[]])).toEqual([[]]);
    expect(settingsNormalizer([['A1']])).toEqual([[{ label: 'A1', colspan: 1, hidden: false }]]);
    expect(settingsNormalizer([
      ['A1'],
      [{ label: true }, 'B2', 4],
      [],
    ])).toEqual([
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

  it('should normalize user-defined settings into known uniform structure data (advanced settings, inconsistent columns length)', () => {
    const settings = [
      ['A', { label: 'B', colspan: 8 }, 'C'],
      ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
      ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
      ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
    ];

    expect(settingsNormalizer(settings)).toEqual([
      [
        { label: 'A', colspan: 1, hidden: false },
        { label: 'B', colspan: 8, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: 'C', colspan: 1, hidden: false },
      ],
      [
        { label: 'D', colspan: 1, hidden: false },
        { label: 'E', colspan: 4, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: 'F', colspan: 4, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: false },
      ],
      [
        { label: 'H', colspan: 1, hidden: false },
        { label: 'I', colspan: 2, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: 'J', colspan: 2, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: 'K', colspan: 2, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: 'L', colspan: 2, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: 'M', colspan: 1, hidden: false },
      ],
      [
        { label: 'N', colspan: 1, hidden: false },
        { label: 'O', colspan: 1, hidden: false },
        { label: 'P', colspan: 1, hidden: false },
        { label: 'Q', colspan: 1, hidden: false },
        { label: 'R', colspan: 1, hidden: false },
        { label: 'S', colspan: 1, hidden: false },
        { label: 'T', colspan: 1, hidden: false },
        { label: 'U', colspan: 1, hidden: false },
        { label: 'V', colspan: 1, hidden: false },
        { label: '', colspan: 1, hidden: false },
      ],
    ]);
  });

  it('should normalize user-defined settings even when it contains overlapping headers', () => {
    const settings = [
      ['A1', 'A2'],
      [{ label: 'B1' }, { label: 'B2', colspan: 4 }],
      ['C1', { label: 'C2', colspan: 3 }, { label: 'C3', colspan: 2 }, 'C4'],
    ];

    expect(settingsNormalizer(settings)).toEqual([
      [
        { label: 'A1', colspan: 1, hidden: false },
        { label: 'A2', colspan: 1, hidden: false },
        { label: '', colspan: 1, hidden: false },
        { label: '', colspan: 1, hidden: false },
        { label: '', colspan: 1, hidden: false },
        { label: '', colspan: 1, hidden: false },
        { label: '', colspan: 1, hidden: false },
      ],
      [
        { label: 'B1', colspan: 1, hidden: false },
        { label: 'B2', colspan: 4, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: false },
        { label: '', colspan: 1, hidden: false },
      ],
      [
        { label: 'C1', colspan: 1, hidden: false },
        { label: 'C2', colspan: 3, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: '', colspan: 1, hidden: true },
        { label: 'C3', colspan: 2, hidden: false },
        { label: '', colspan: 1, hidden: true },
        { label: 'C4', colspan: 1, hidden: false },
      ],
    ]);
  });
});
