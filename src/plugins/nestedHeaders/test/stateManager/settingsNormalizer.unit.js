import { settingsNormalizer } from 'handsontable/plugins/nestedHeaders/stateManager/settingsNormalizer';

describe('settingsNormalizer', () => {
  it('should normalize user-defined settings into known uniform structure data (simple settings)', () => {
    expect(settingsNormalizer([])).toEqual([]);
    expect(settingsNormalizer([[]])).toEqual([[]]);
    expect(settingsNormalizer([['A1']])).toEqual([[
      { label: 'A1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
    ]]);
    expect(settingsNormalizer([
      ['A1'],
      [{ label: true }, 'B2', 4],
      [],
    ])).toEqual([
      [
        { label: 'A1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'true', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'B2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '4', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
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
        { label: 'A', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'B', colspan: 8, origColspan: 8, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'C', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'D', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'E', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'F', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'H', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'I', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'J', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'K', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'L', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'M', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'N', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'O', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'P', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'Q', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'R', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'S', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'T', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'U', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'V', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
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

    expect(settingsNormalizer(settings, 6)).toEqual([
      [
        { label: 'A', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'B', colspan: 5, origColspan: 5, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'D', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'E', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'F', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'H', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'I', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'J', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'K', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'N', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'O', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'P', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'Q', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'R', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'S', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
    ]);
    expect(settingsNormalizer(settings, 4)).toEqual([
      [
        { label: 'A', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'B', colspan: 3, origColspan: 3, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'D', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'E', colspan: 3, origColspan: 3, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'H', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'I', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'J', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'N', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'O', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'P', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'Q', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
    ]);
    expect(settingsNormalizer(settings, 1)).toEqual([
      [
        { label: 'A', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'D', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'H', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'N', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
    ]);
    expect(settingsNormalizer(settings, 0)).toEqual([]);
    expect(settingsNormalizer(settings, 2)).toEqual([
      [
        { label: 'A', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'B', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'D', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'E', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'H', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'I', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'N', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'O', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
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
        { label: 'A1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'A2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'B1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'B2', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
      [
        { label: 'C1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        { label: 'C2', colspan: 3, origColspan: 3, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'C3', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
        { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
        { label: 'C4', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
      ],
    ]);
  });
});
