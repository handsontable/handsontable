import {
  SheetModel,
  NEW_SHEET_COLUMN_COUNT,
  NEW_SHEET_ROW_COUNT,
  MAX_SHEET_NAME_LENGTH,
} from '../sheetModel';

describe('SheetModel', () => {
  it('creates default sheets with unique incremented names', () => {
    const model = new SheetModel();
    const s1 = model.addSheet(null, [['a']]);
    const s2 = model.addSheet(null, [['b']]);

    expect(s1.name).toBe('Sheet1');
    expect(s2.name).toBe('Sheet2');
    expect(model.getSheets().map(s => s.id)).toEqual([s1.id, s2.id]);
  });

  it('activates the first added sheet by default', () => {
    const model = new SheetModel();
    const s1 = model.addSheet('First', [[]]);

    model.addSheet('Second', [[]]);

    expect(model.getActiveSheet().id).toBe(s1.id);
    expect(model.getActiveSheet().isActive).toBe(true);
  });

  it('setActiveSheet switches and rejects unknown ids', () => {
    const model = new SheetModel();

    model.addSheet('A', [[]]);
    const b = model.addSheet('B', [[]]);

    expect(model.setActiveSheet(b.id)).toBe(true);
    expect(model.getActiveSheet().name).toBe('B');
    expect(model.setActiveSheet(999)).toBe(false);
  });

  it('resolveId accepts id or unique name', () => {
    const model = new SheetModel();
    const a = model.addSheet('Budget', [[]]);

    expect(model.resolveId(a.id)).toBe(a.id);
    expect(model.resolveId('Budget')).toBe(a.id);
    expect(model.resolveId('Nope')).toBe(null);
  });

  it('renameSheet enforces uniqueness and keeps the id stable', () => {
    const model = new SheetModel();
    const a = model.addSheet('A', [[]]);

    model.addSheet('B', [[]]);

    expect(model.renameSheet(a.id, 'B')).toBe(false);
    expect(model.renameSheet(a.id, 'C')).toBe(true);
    expect(model.getSheetById(a.id).name).toBe('C');
  });

  it('caps a name at the length limit, whichever way it arrives', () => {
    const model = new SheetModel();
    const long = 'x'.repeat(MAX_SHEET_NAME_LENGTH + 20);
    const added = model.addSheet(long, [[]]);
    const renamed = model.addSheet('short', [[]]);

    expect(added.name).toHaveLength(MAX_SHEET_NAME_LENGTH);
    expect(MAX_SHEET_NAME_LENGTH).toBe(50);

    // A different letter: clamping the first name already took the 50-`x` variant, and a
    // rename onto a name in use is refused.
    expect(model.renameSheet(renamed.id, 'w'.repeat(MAX_SHEET_NAME_LENGTH + 20))).toBe(true);
    expect(model.getSheetById(renamed.id).name).toBe('w'.repeat(MAX_SHEET_NAME_LENGTH));
  });

  it('gives a blank or whitespace-only requested name the default numbering, like an omitted one', () => {
    const model = new SheetModel();
    const blank = model.addSheet('', [[]]);
    const spaces = model.addSheet('   ', [[]]);

    expect(blank.name).toBe('Sheet1');
    expect(spaces.name).toBe('Sheet2');
  });

  it('counts a name in characters, so an emoji costs one', () => {
    const model = new SheetModel();
    const sheet = model.addSheet('🙂'.repeat(MAX_SHEET_NAME_LENGTH + 5), [[]]);

    expect(Array.from(sheet.name)).toHaveLength(MAX_SHEET_NAME_LENGTH);
    // Cut between characters, never through one — a split pair would render as a replacement
    // glyph rather than as the emoji.
    expect(sheet.name).toBe('🙂'.repeat(MAX_SHEET_NAME_LENGTH));
  });

  it('keeps a collision suffix inside the limit by shortening the base', () => {
    const model = new SheetModel();
    const long = 'y'.repeat(MAX_SHEET_NAME_LENGTH);

    model.addSheet(long, [[]]);

    const second = model.addSheet(long, [[]]);

    expect(second.name).toHaveLength(MAX_SHEET_NAME_LENGTH);
    expect(second.name).toBe(`${'y'.repeat(MAX_SHEET_NAME_LENGTH - 4)} (2)`);
  });

  it('removeSheet refuses to remove the last sheet and re-activates a neighbor', () => {
    const model = new SheetModel();
    const a = model.addSheet('A', [[]]);
    const b = model.addSheet('B', [[]]);

    model.setActiveSheet(b.id);

    expect(model.removeSheet(b.id)).toBe(true);
    expect(model.getActiveSheet().id).toBe(a.id);
    expect(model.removeSheet(a.id)).toBe(false); // last sheet stays
  });

  it('moveSheet reorders tabs', () => {
    const model = new SheetModel();
    const a = model.addSheet('A', [[]]);
    const b = model.addSheet('B', [[]]);
    const c = model.addSheet('C', [[]]);

    expect(model.moveSheet(c.id, 0)).toBe(true);
    expect(model.getSheets().map(s => s.name)).toEqual(['C', 'A', 'B']);
    expect(model.moveSheet(a.id, 99)).toBe(false);
    expect(model.moveSheet(b.id, 2)).toBe(true);
  });

  it('seeds a sheet added without data with a blank A-Z by 1000 grid', () => {
    const model = new SheetModel();
    const sheet = model.addSheet();

    expect(sheet.data).toHaveLength(NEW_SHEET_ROW_COUNT);
    expect(sheet.data[0]).toHaveLength(NEW_SHEET_COLUMN_COUNT);
    expect(NEW_SHEET_COLUMN_COUNT).toBe(26);
    expect(NEW_SHEET_ROW_COUNT).toBe(1000);
    expect(sheet.data.every(row => row.every(cell => cell === null))).toBe(true);
  });

  it('gives each seeded sheet its own rows, so typing in one cannot bleed into another', () => {
    const model = new SheetModel();
    const first = model.addSheet();
    const second = model.addSheet();

    first.data[0][0] = 'typed';

    expect(second.data[0][0]).toBe(null);
    expect(first.data[1][0]).toBe(null);
  });

  it('keeps supplied data untouched instead of padding it to the seed size', () => {
    const model = new SheetModel();
    const sheet = model.addSheet('Given', [['a', 'b']]);

    expect(sheet.data).toEqual([['a', 'b']]);
  });

  it('duplicateSheet places the copy directly after the sheet it copied', () => {
    const model = new SheetModel();
    const a = model.addSheet('A', [['a']]);
    const b = model.addSheet('B', [['b']]);
    const c = model.addSheet('C', [['c']]);
    const copy = model.duplicateSheet(b.id);

    expect(model.getSheets().map(sheet => sheet.id)).toEqual([a.id, b.id, copy.id, c.id]);
  });

  it('duplicateSheet keeps the copy last when the original is last', () => {
    const model = new SheetModel();
    const a = model.addSheet('A', [['a']]);
    const b = model.addSheet('B', [['b']]);
    const copy = model.duplicateSheet(b.id);

    expect(model.getSheets().map(sheet => sheet.id)).toEqual([a.id, b.id, copy.id]);
  });

  it('duplicateSheet deep-copies data and derives a unique name', () => {
    const model = new SheetModel();
    const a = model.addSheet('Data', [['x']]);
    const copy = model.duplicateSheet(a.id);

    expect(copy.name).toBe('Data (2)');
    expect(copy.data).toEqual([['x']]);
    expect(copy.data).not.toBe(model.getSheetById(a.id).data);
    copy.data[0][0] = 'y';
    expect(model.getSheetById(a.id).data[0][0]).toBe('x');
  });
});
