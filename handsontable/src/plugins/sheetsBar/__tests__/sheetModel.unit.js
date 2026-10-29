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

  it('counts a flag and a ZWJ family emoji as one character each when it cuts a name', () => {
    const model = new SheetModel();
    const flag = '🇵🇱';
    const family = '👨‍👩‍👧';
    const flagSheet = model.addSheet(flag.repeat(MAX_SHEET_NAME_LENGTH + 5), [[]]);
    const familySheet = model.addSheet(family.repeat(MAX_SHEET_NAME_LENGTH + 5), [[]]);

    expect(flagSheet.name).toBe(flag.repeat(MAX_SHEET_NAME_LENGTH));
    expect(familySheet.name).toBe(family.repeat(MAX_SHEET_NAME_LENGTH));
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

  it('duplicateSheet copies the settings literals and keeps a class instance by reference', () => {
    class Template {
      constructor() {
        this.self = this;
      }
    }

    const template = new Template();
    const model = new SheetModel();
    const a = model.addSheet('Data', [['x']], { columns: [{ renderer: template, width: 50 }] });
    const copy = model.duplicateSheet(a.id);

    expect(copy.settings.columns[0]).not.toBe(a.settings.columns[0]);
    expect(copy.settings.columns[0].renderer).toBe(template);
    expect(copy.settings.columns[0].width).toBe(50);
  });

  it('duplicateSheet leaves out an own `__proto__` key and keeps the copy a plain object', () => {
    const model = new SheetModel();
    const a = model.addSheet('Data', [['x']], JSON.parse('{ "colHeaders": true, "__proto__": { "polluted": true } }'));
    const copy = model.duplicateSheet(a.id);

    expect(Object.getPrototypeOf(copy.settings)).toBe(Object.prototype);
    expect(copy.settings.polluted).toBeUndefined();
    expect(copy.settings.colHeaders).toBe(true);
  });

  describe('resolveId', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an object', { id: 1 }],
      ['an array', [1]],
      ['a boolean', true],
    ])('answers `null` for %s instead of throwing', (_label, value) => {
      const model = new SheetModel();

      model.addSheet('A', [[]]);

      expect(model.resolveId(value)).toBe(null);
    });
  });

  describe('moveSheet', () => {
    it.each([
      ['NaN', NaN],
      ['a fraction', 0.5],
      ['a numeric string', '1'],
      ['Infinity', Infinity],
    ])('refuses %s as the target index and keeps the order', (_label, index) => {
      const model = new SheetModel();
      const a = model.addSheet('A', [[]]);

      model.addSheet('B', [[]]);
      model.addSheet('C', [[]]);

      expect(model.moveSheet(a.id, index)).toBe(false);
      expect(model.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B', 'C']);
    });
  });

  describe('names with no visible character', () => {
    const invisibleNames = [
      ['a zero-width space', '​'],
      ['zero-width joiners and non-joiners', '‍‌‍'],
      ['bidi marks and isolates', '‎‏⁦⁩'],
      ['a word joiner beside spaces', ' ⁠ '],
      ['a byte order mark', '﻿'],
    ];

    it.each(invisibleNames)('gives %s the default name, like a blank one', (_label, name) => {
      const model = new SheetModel();
      const sheet = model.addSheet(name, [[]]);

      expect(sheet.name).toBe('Sheet1');
    });

    it.each(invisibleNames)('refuses a rename to %s', (_label, name) => {
      const model = new SheetModel();
      const sheet = model.addSheet('A', [[]]);

      expect(model.renameSheet(sheet.id, name)).toBe(false);
      expect(model.getSheetById(sheet.id).name).toBe('A');
    });

    it('keeps an invisible character inside a name that has visible ones', () => {
      const model = new SheetModel();
      const sheet = model.addSheet('Bud​get', [[]]);

      expect(sheet.name).toBe('Bud​get');
      expect(model.renameSheet(sheet.id, 'Q‎1')).toBe(true);
      expect(model.getSheetById(sheet.id).name).toBe('Q‎1');
    });

    it('keeps a look-alike of a taken name as a separate name', () => {
      const model = new SheetModel();

      model.addSheet('Budget', [[]]);

      expect(model.addSheet('Budget​', [[]]).name).toBe('Budget​');
    });
  });

  describe('collision numbering', () => {
    it('keeps a trailing number in parentheses that the requested name carries', () => {
      const model = new SheetModel();

      model.addSheet('Budget (2024)', [[]]);

      expect(model.addSheet('Budget (2024)', [[]]).name).toBe('Budget (2024) (2)');
    });

    it('numbers a taken name that ends in a counter after the whole name', () => {
      const model = new SheetModel();

      model.addSheet('A', [[]]);
      model.addSheet('A (2)', [[]]);

      expect(model.addSheet('A (2)', [[]]).name).toBe('A (2) (2)');
    });

    it('counts duplicates of one sheet up from 2', () => {
      const model = new SheetModel();
      const budget = model.addSheet('Budget (2024)', [[]]);

      expect(model.duplicateSheet(budget.id).name).toBe('Budget (2024) (2)');
      expect(model.duplicateSheet(budget.id).name).toBe('Budget (2024) (3)');
    });

    it('names a duplicate of a numbered copy after the copy', () => {
      const model = new SheetModel();
      const data = model.addSheet('Data', [[]]);
      const copy = model.duplicateSheet(data.id);

      expect(model.duplicateSheet(copy.id).name).toBe('Data (2) (2)');
    });

    it('tells the name a duplicate will get before it is made', () => {
      const model = new SheetModel();
      const data = model.addSheet('Data', [[]]);

      model.addSheet('Data (2)', [[]]);

      expect(model.getDuplicateName(data.id)).toBe('Data (3)');
      expect(model.duplicateSheet(data.id).name).toBe('Data (3)');
      expect(model.getDuplicateName(999)).toBe(null);
    });

    it('tells the name a duplicate will get when shortening leaves only invisible characters', () => {
      const model = new SheetModel();
      const source = model.addSheet(`${'​'.repeat(47)}abc`, [[]]);
      const predicted = model.getDuplicateName(source.id);

      expect(model.duplicateSheet(source.id).name).toBe(predicted);
    });
  });

  describe('names that differ only in case', () => {
    it('resolve to the same sheet, as HyperFormula reads sheet names', () => {
      const model = new SheetModel();
      const budget = model.addSheet('Budget', [[]]);

      expect(model.resolveId('budget')).toBe(budget.id);
      expect(model.resolveId('BUDGET')).toBe(budget.id);
    });

    it('count as taken when another sheet is added', () => {
      const model = new SheetModel();

      model.addSheet('Budget', [[]]);

      expect(model.addSheet('budget', [[]]).name).toBe('budget (2)');
    });

    it('refuse a rename onto another sheet, and allow a case-only rename of the same sheet', () => {
      const model = new SheetModel();
      const a = model.addSheet('Alpha', [[]]);
      const b = model.addSheet('Beta', [[]]);

      expect(model.renameSheet(b.id, 'ALPHA')).toBe(false);
      expect(model.renameSheet(a.id, 'ALPHA')).toBe(true);
      expect(model.getSheetById(a.id).name).toBe('ALPHA');
    });

    it('fold case without the host locale, as the engine does', () => {
      const model = new SheetModel();
      const items = model.addSheet('ITEMS', [[]]);

      expect(model.resolveId('items')).toBe(items.id);
    });
  });

  describe('a duplicate of cells holding objects other than arrays and object literals', () => {
    it('keeps a RegExp, a Map, a Set and a Date as the same kind of value, copied', () => {
      const regExp = /^SKU-\d+$/gi;
      const map = new Map([['currency', 'USD']]);
      const set = new Set(['Q1', 'Q2']);
      const date = new Date(2025, 2, 14);
      const model = new SheetModel();
      const source = model.addSheet('Data', [[regExp, map, set, date]]);
      const [copiedRegExp, copiedMap, copiedSet, copiedDate] = model.duplicateSheet(source.id).data[0];

      expect(copiedRegExp).toBeInstanceOf(RegExp);
      expect(copiedRegExp).not.toBe(regExp);
      expect(copiedRegExp.source).toBe(regExp.source);
      expect(copiedRegExp.flags).toBe(regExp.flags);
      expect(copiedMap).toBeInstanceOf(Map);
      expect(copiedMap).not.toBe(map);
      expect([...copiedMap]).toEqual([['currency', 'USD']]);
      expect(copiedSet).toBeInstanceOf(Set);
      expect(copiedSet).not.toBe(set);
      expect([...copiedSet]).toEqual(['Q1', 'Q2']);
      expect(copiedDate).toBeInstanceOf(Date);
      expect(copiedDate).not.toBe(date);
      expect(copiedDate.getTime()).toBe(date.getTime());
    });

    it('copies a Map in an object row so a change to the copy leaves the original alone', () => {
      const model = new SheetModel();
      const source = model.addSheet('Data', [{ sku: 'SKU-4821', stock: new Map([['Seattle', 142]]) }]);
      const copy = model.duplicateSheet(source.id);

      copy.data[0].stock.set('Seattle', 0);

      expect(source.data[0].stock.get('Seattle')).toBe(142);
      expect(copy.data[0].sku).toBe('SKU-4821');
    });

    it('keeps the holes of a sparse row, so every value stays in its column', () => {
      const row = ['SKU-4821'];

      row[2] = 142;

      const model = new SheetModel();
      const source = model.addSheet('Data', [row]);
      const copiedRow = model.duplicateSheet(source.id).data[0];

      expect(copiedRow).toHaveLength(3);
      expect(1 in copiedRow).toBe(false);
      expect(copiedRow[0]).toBe('SKU-4821');
      expect(copiedRow[2]).toBe(142);
    });

    it('gives a row that is a class instance a copy of its own, with its prototype', () => {
      class Product {
        constructor(sku, stock) {
          this.sku = sku;
          this.stock = stock;
        }
      }

      const model = new SheetModel();
      const source = model.addSheet('Data', [new Product('SKU-4821', 142)]);
      const copiedRow = model.duplicateSheet(source.id).data[0];

      copiedRow.stock = 0;

      expect(copiedRow).not.toBe(source.data[0]);
      expect(copiedRow).toBeInstanceOf(Product);
      expect(copiedRow.sku).toBe('SKU-4821');
      expect(source.data[0].stock).toBe(142);
    });

    it('gives a class-instance row the values its getters read from private fields', () => {
      class Product {
        #stock;

        constructor(sku, stock) {
          this.sku = sku;
          this.#stock = stock;
        }

        get stock() {
          return this.#stock;
        }
      }

      const model = new SheetModel();
      const source = model.addSheet('Data', [new Product('SKU-4821', 142)]);
      const copiedRow = model.duplicateSheet(source.id).data[0];

      expect(() => copiedRow.stock).not.toThrow();
      expect(copiedRow.stock).toBe(142);
      expect(copiedRow.sku).toBe('SKU-4821');
      expect(copiedRow).toBeInstanceOf(Product);

      copiedRow.stock = 0;

      expect(source.data[0].stock).toBe(142);
    });

    it('keeps a class instance in a cell by reference, with its prototype', () => {
      class Money {
        constructor(amount) {
          this.amount = amount;
        }
      }

      const price = new Money(4200000);
      const model = new SheetModel();
      const source = model.addSheet('Data', [[price]]);
      const copied = model.duplicateSheet(source.id).data[0][0];

      expect(copied).toBe(price);
      expect(copied).toBeInstanceOf(Money);
    });
  });

  describe('isNameTaken', () => {
    it('answers whether another sheet already uses a name', () => {
      const model = new SheetModel();
      const a = model.addSheet('A', [[]]);
      const b = model.addSheet('B', [[]]);

      expect(model.isNameTaken('B', a.id)).toBe(true);
      expect(model.isNameTaken('B', b.id)).toBe(false);
      expect(model.isNameTaken('C', a.id)).toBe(false);
    });
  });

  describe('sheet ids', () => {
    it('takes its ids from the allocator it is given, and keeps its own default numbering', () => {
      let lastId = 41;
      const model = new SheetModel(undefined, () => {
        lastId += 1;

        return lastId;
      });
      const first = model.addSheet(null, [[]]);
      const second = model.addSheet(null, [[]]);

      expect([first.id, second.id]).toEqual([42, 43]);
      expect([first.name, second.name]).toEqual(['Sheet1', 'Sheet2']);
    });
  });
});
