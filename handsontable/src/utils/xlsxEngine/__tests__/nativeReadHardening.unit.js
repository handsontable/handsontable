/**
 * @jest-environment node
 */
import { nativeAdapter } from '../adapters/native';
import { DroppedFeatures } from '../capabilities';
import {
  MAX_INFLATED_ENTRY_BYTES, MAX_INFLATED_TOTAL_BYTES, MAX_INPUT_BYTES, MAX_WORKBOOK_SHEETS,
} from '../limits';
import { SheetBuilder } from '../builder';
import { createWorkbookSnapshot } from '../model';
import * as worksheetReader from '../adapters/native/parts/worksheetReader';
import { assertSheetFits } from '../adapters/native/parts/worksheetReader';
import { writeWorkbook } from '../adapters/native/write';
import { crc32 } from '../adapters/native/zip/crc32';
import { readZip } from '../adapters/native/zip/reader';
import { writeZip } from '../adapters/native/zip/writer';
import { loadFixture, toArrayBuffer } from './helpers/fixtures';

const encoder = new TextEncoder();
const EOCD_SIGNATURE = 0x06054b50;

/**
 * Repacks a fixture, passing every part through `transform`. Building the hostile input this way
 * keeps it in the kilobytes: the point of each test below is that a cap refuses before the work
 * happens, so the file never has to be as large as the work it asks for.
 *
 * @param {string} name The fixture name.
 * @param {Function} transform Receives the part name and its text, returns the text to write.
 * @param {Array<{ name: string, text: string }>} [extra] More entries to append, as text.
 * @returns {Promise<Uint8Array>}
 */
async function repack(name, transform, extra = []) {
  const zip = await readZip(loadFixture(name));
  const entries = [];

  for (const partName of zip.names()) {
    // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
    const text = await zip.text(partName);

    entries.push({ name: partName, data: encoder.encode(transform(partName, text)) });
  }

  extra.forEach(entry => entries.push({ name: entry.name, data: encoder.encode(entry.text) }));

  return writeZip(entries, true);
}

/**
 * Rewrites the `<sheets>` list so it declares `count` sheets that all resolve to the one worksheet
 * part the fixture carries — the shape of the attack, where every entry costs a full inflate and
 * tokenize of the same part.
 *
 * @param {string} workbookXml The fixture's `xl/workbook.xml`.
 * @param {number} count How many `<sheet>` entries to declare.
 * @returns {string}
 */
function withSheetCount(workbookXml, count) {
  const relId = /r:id="([^"]+)"/.exec(workbookXml)[1];
  const entries = [];

  for (let i = 0; i < count; i++) {
    entries.push(`<sheet name="S${i}" sheetId="${i + 1}" r:id="${relId}"/>`);
  }

  return workbookXml.replace(/<sheets>[\s\S]*?<\/sheets>/, `<sheets>${entries.join('')}</sheets>`);
}

/**
 * Overwrites one entry's uncompressed size in the central directory, which is where the reader
 * takes an entry's inflated size from. A part that declares hundreds of megabytes is then a few
 * bytes of test input instead of a few hundred megabytes of allocation.
 *
 * @param {Uint8Array} bytes The archive bytes, modified in place.
 * @param {string} entryName The entry whose declared size to rewrite.
 * @param {number} size The size to declare.
 * @returns {Uint8Array}
 */
function declareInflatedSize(bytes, entryName, size) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  let endRecord = bytes.byteLength - 22;

  while (view.getUint32(endRecord, true) !== EOCD_SIGNATURE) {
    endRecord -= 1;
  }

  const count = view.getUint16(endRecord + 10, true);
  let offset = view.getUint32(endRecord + 16, true);

  for (let i = 0; i < count; i++) {
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));

    if (name === entryName) {
      view.setUint32(offset + 24, size, true);
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return bytes;
}

/**
 * Counts how many times the reader inflates an entry, by counting `DecompressionStream`
 * constructions — the one thing a part read costs that nothing else in the read does.
 *
 * @returns {{ count: Function, restore: Function }}
 */
function countInflates() {
  // The whole descriptor is kept and put back, so the global leaves this helper exactly as
  // `test/cryptoSetup.js` installed it (writable, so a test can stub it by assignment).
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'DecompressionStream');
  const original = globalThis.DecompressionStream;
  let constructed = 0;

  Object.defineProperty(globalThis, 'DecompressionStream', {
    ...descriptor,
    value: class CountingDecompressionStream extends original {
      /**
       * @param {string} format The compression format.
       */
      constructor(format) {
        super(format);
        constructed += 1;
      }
    },
  });

  return {
    count: () => constructed,
    restore: () => Object.defineProperty(globalThis, 'DecompressionStream', descriptor),
  };
}

/**
 * Reads an archive through the native adapter.
 *
 * @param {Uint8Array} bytes The archive bytes.
 * @returns {Promise<object>}
 */
function read(bytes) {
  return nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());
}

describe('native reader hardening: the workbook sheet count', () => {
  it('should refuse a workbook declaring more sheets than the cap, before a sheet part is inflated', async() => {
    // 2049 `<sheet>` entries, all pointing at the one worksheet part: a few kilobytes of archive
    // that asked the unbounded reader for 2049 inflates and 2049 tokenizes of that part.
    const bytes = await repack('values', (part, text) => (
      part === 'xl/workbook.xml' ? withSheetCount(text, MAX_WORKBOOK_SHEETS + 1) : text
    ));
    const inflates = countInflates();

    try {
      await expect(read(bytes)).rejects.toThrow(
        new RegExp(`declares more than ${MAX_WORKBOOK_SHEETS} sheets, above the limit this reader accepts`)
      );

      // Exactly the three parts read before the sheet list exists: `_rels/.rels`,
      // `[Content_Types].xml` (the main part's declared type is checked before the part is
      // tokenized) and `xl/workbook.xml`. No worksheet part, no styles, no shared strings.
      expect(inflates.count()).toBe(3);
    } finally {
      inflates.restore();
    }
  });

  it('should read a workbook of exactly MAX_WORKBOOK_SHEETS sheets', async() => {
    // The cap is inclusive: a workbook at the limit is legal, and only limit + 1 is refused.
    const bytes = await repack('values', (part, text) => (
      part === 'xl/workbook.xml' ? withSheetCount(text, MAX_WORKBOOK_SHEETS) : text
    ));

    expect((await read(bytes)).sheets.length).toBe(MAX_WORKBOOK_SHEETS);
  });

  it('should read a workbook whose sheets all resolve to one part, inflating that part once', async() => {
    const one = await repack('values', (part, text) => text);
    const many = await repack('values', (part, text) => (
      part === 'xl/workbook.xml' ? withSheetCount(text, 8) : text
    ));
    const inflates = countInflates();

    try {
      const before = inflates.count();
      const single = await read(one);
      const afterSingle = inflates.count();
      const repeated = await read(many);
      const afterRepeated = inflates.count();

      expect(single.sheets.length).toBe(1);
      expect(repeated.sheets.length).toBe(8);
      expect(repeated.sheets[7].rows).toEqual(single.sheets[0].rows);

      // Eight sheets resolving to one part cost exactly what one sheet cost: every part is
      // inflated once per read, and the memo is what makes the eighth sheet free.
      expect(afterRepeated - afterSingle).toBe(afterSingle - before);
    } finally {
      inflates.restore();
    }
  });

  it('should refuse many sheets over one large part before the part is tokenized even once', async() => {
    // 64 `<sheet>`s naming one 2.2 MB part: the memo inflated it once, but every sheet tokenized
    // and parsed it again and paid for the repeat only then, so the read was refused after about
    // twenty full parses (1.4 s and 160 MB of heap on a 6 MB part). The repeats a read is about to
    // make are known from the sheet list, so they are charged with the first read, before any parse.
    const padding = 2_200_000;
    const pad = (part, text) => (
      part === 'xl/worksheets/sheet1.xml'
        ? text.replace('<sheetData>', `<!--${' '.repeat(padding)}--><sheetData>`)
        : text
    );
    const one = await repack('values', pad);
    const many = await repack('values', (part, text) => (
      part === 'xl/workbook.xml' ? withSheetCount(text, 64) : pad(part, text)
    ));
    const inflates = countInflates();
    const parses = jest.spyOn(worksheetReader, 'parseWorksheet');

    try {
      await read(one);

      const inflatesOfOne = inflates.count();
      const parsesOfOne = parses.mock.calls.length;

      await expect(read(many)).rejects.toThrow(
        /The archive entry "xl\/worksheets\/sheet1\.xml" is read again for another sheet/
      );

      // The refused read inflated what the one-sheet read inflated, the shared part once, and
      // parsed nothing.
      expect(inflates.count() - inflatesOfOne).toBe(inflatesOfOne);
      expect(parses.mock.calls.length - parsesOfOne).toBe(0);
    } finally {
      parses.mockRestore();
      inflates.restore();
    }
  });

  it('should charge a sheet that declares nothing at least one unit of the workbook budget', () => {
    const budget = { declaredCells: 0 };

    assertSheetFits('empty', 0, 0, 0, budget);
    assertSheetFits('empty', 0, 0, 0, budget);

    expect(budget.declaredCells).toBe(2);
  });
});

describe('native reader hardening: the inflated-bytes budget', () => {
  it('should read back a built-in export whose sheet part is a hundred megabytes, charging each part once', async() => {
    // The budget charged a text part its produced bytes AND its decoded string (2 bytes per code
    // unit) on top, while the bytes are decoded as they stream and never held: the same live memory
    // counted twice. The engine's own 120 000 x 20 export (about 104 MB of XML) was charged about
    // 312 MB, above the 256 MB total, so the engine could not read its own export back.
    //
    // The sheet here is small and its part is padded to the same size instead: what the case proves
    // is the charge (the sum is over the budget, the larger of the two is under it), and building,
    // writing and reading 2.4 M real cells took 81 s on a cold machine against a 60 s timeout.
    const rows = 2_000;
    const padding = 100 * 1024 * 1024;
    const builder = new SheetBuilder('Big');

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= 20; col++) {
        builder.cell(row, col).value = col % 3 === 0 ? `row ${row} col ${col}` : row * col;
      }
    }

    const written = createWorkbookSnapshot();

    written.sheets.push(builder.toSnapshot());
    written.compression = 6;

    const exported = await writeWorkbook(written, new DroppedFeatures());
    const exportedZip = await readZip(toArrayBuffer(exported));
    const entries = [];
    let inflated = 0;

    for (const name of exportedZip.names()) {
      // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
      const text = await exportedZip.text(name);
      const data = encoder.encode(name === 'xl/worksheets/sheet1.xml'
        ? text.replace('<sheetData>', `<!--${' '.repeat(padding)}--><sheetData>`)
        : text);

      inflated += data.byteLength;
      entries.push({ name, data });
    }

    // The shape the test needs: the old charge (bytes + 2 bytes per character) is over the budget,
    // the new one (the larger of the two, for an ASCII part 2 bytes per character) is under it.
    expect(inflated * 3).toBeGreaterThan(MAX_INFLATED_TOTAL_BYTES);
    expect(inflated * 2).toBeLessThan(MAX_INFLATED_TOTAL_BYTES);

    const snapshot = await read(await writeZip(entries, true));
    const last = snapshot.sheets[0].rows[rows - 1];

    expect(snapshot.sheets[0].rows.length).toBe(rows);
    expect(last.length).toBe(20);
    expect(last[2].value).toBe(`row ${rows} col 3`);
    expect(last[19].value).toBe(rows * 20);
  }, 60_000);

  it('should refuse a workbook whose parts really inflate above the total budget', async() => {
    // A part that REALLY inflates past the budget, not one that merely declares it: the charge is
    // what the entry produced, so a padded part is the only thing the total can refuse. A decoded
    // part costs the larger of its bytes and its UTF-16 string - for ASCII padding, two bytes per
    // character - which is why 130 MB of padding is over a 256 MB budget, and the archive itself
    // stays a few hundred kilobytes.
    const padding = 130 * 1024 * 1024;

    expect(padding).toBeLessThan(MAX_INFLATED_ENTRY_BYTES);
    expect(padding * 2).toBeGreaterThan(MAX_INFLATED_TOTAL_BYTES);

    const bytes = await repack('values', (part, text) => (
      part === 'xl/styles.xml' ? `<!--${' '.repeat(padding)}-->${text}` : text
    ));

    await expect(read(bytes)).rejects.toThrow(
      new RegExp(`brings the inflated total to \\d+ bytes, above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit`)
    );
  });

  it('should read a part whose declared size lies HIGH, charging what it really produced', async() => {
    // The other side of charging the produced bytes: a central directory declaring 400 MB for a
    // part that inflates to a few hundred bytes used to be refused by the total budget, so a
    // readable file was rejected on the strength of its own claim. The declaration still bounds the
    // work (it is the inflate's ceiling); it no longer decides the charge.
    const fourHundredMegabytes = 400 * 1024 * 1024;

    expect(fourHundredMegabytes).toBeLessThan(MAX_INFLATED_ENTRY_BYTES);

    let bytes = await repack('values', (part, text) => text);

    bytes = declareInflatedSize(bytes, 'xl/styles.xml', fourHundredMegabytes);

    const snapshot = await read(bytes);

    expect(snapshot.sheets.length).toBe(1);
  });

  it('should refuse a part that inflates past the remaining budget in the budget\'s own words', async() => {
    // The ceiling used to be `remaining + 1` with the STREAM wording the refusal, so the budget's
    // own message was reachable only on a one-byte overshoot. Anything further over was refused
    // with `MAX_INFLATED_TOTAL_BYTES + 1` — a number that is no declared cap of this reader's — and
    // named no entry. A part declaring 400 MB (inside the per-entry cap) that really inflates far
    // past what the budget still allows is exactly the hostile case that message was written for.
    const almostTheBudget = 126 * 1024 * 1024;
    const overTheRemainder = 8 * 1024 * 1024;

    // An ASCII part costs its UTF-16 string, two bytes per character, so the first one spends
    // twice its size and leaves the budget less than the second one produces.
    expect(almostTheBudget * 2).toBeLessThan(MAX_INFLATED_TOTAL_BYTES);
    expect(MAX_INFLATED_TOTAL_BYTES - (almostTheBudget * 2)).toBeLessThan(overTheRemainder);

    let bytes = await repack('values', (part, text) => {
      if (part === 'xl/styles.xml') {
        return `<!--${' '.repeat(almostTheBudget)}-->${text}`;
      }

      if (part === 'xl/sharedStrings.xml') {
        return `<!--${' '.repeat(overTheRemainder)}-->${text}`;
      }

      return text;
    });

    bytes = declareInflatedSize(bytes, 'xl/sharedStrings.xml', 400 * 1024 * 1024);

    // The decoded string is bounded as it grows, so the part is usually stopped by the charge its
    // text would make (which states the total it reached) before its bytes reach the ceiling.
    await expect(read(bytes)).rejects.toThrow(
      new RegExp('The archive entry "xl/sharedStrings.xml" brings the inflated total (to \\d+ bytes, )?above the '
        + `${MAX_INFLATED_TOTAL_BYTES}-byte limit`)
    );
  });

  it('should read an entry declaring exactly MAX_INFLATED_ENTRY_BYTES', async() => {
    // The per-entry cap is inclusive: only a declaration above it is refused.
    const bytes = declareInflatedSize(
      await repack('values', (part, text) => text), 'xl/styles.xml', MAX_INFLATED_ENTRY_BYTES
    );

    expect((await read(bytes)).sheets.length).toBe(1);
  });

  it('should still refuse a single entry at the per-entry cap, with the per-entry message', async() => {
    let bytes = await repack('values', (part, text) => text);

    bytes = declareInflatedSize(bytes, 'xl/styles.xml', MAX_INFLATED_ENTRY_BYTES + 1);

    await expect(read(bytes)).rejects.toThrow(
      new RegExp(`declares ${MAX_INFLATED_ENTRY_BYTES + 1} bytes, `
        + `above the ${MAX_INFLATED_ENTRY_BYTES}-byte limit this reader accepts`)
    );
  });
});

describe('native reader hardening: the input size', () => {
  it('should hand a file of exactly MAX_INPUT_BYTES to the archive reader', async() => {
    // The input cap is inclusive: a file at the limit passes the size check and reaches the ZIP
    // reader, which refuses an all-zero buffer for its own reason. The buffer goes in as is, with no
    // `toArrayBuffer` copy, so the case allocates the 128 MiB once.
    await expect(nativeAdapter.read(new ArrayBuffer(MAX_INPUT_BYTES), undefined, new DroppedFeatures()))
      .rejects.toThrow(/end-of-central-directory/);
  });
});

describe('native reader hardening: row and column zero', () => {
  it('should refuse a cell anchored at row zero with the reader\'s own message', async() => {
    // `A0` matches the shape of an address, and subtracting 1 from it used to reach `rows[-1]`.
    const bytes = await repack('values', (part, text) => (
      part === 'xl/worksheets/sheet1.xml'
        ? text.replace('<sheetData>', '<sheetData><row r="1"><c r="A0"><v>1</v></c></row>')
        : text
    ));

    await expect(read(bytes)).rejects.toThrow(/The cell reference "A0" is not a valid A1 address/);
    await expect(read(bytes)).rejects.not.toThrow(/Cannot read properties of undefined/);
  });

  it('should refuse a comment anchored at row zero with the reader\'s own message', async() => {
    // The sharper half: the worksheet itself is well formed, and a note anchored at `A0` in
    // `comments1.xml` took the whole import down with an internal `TypeError`.
    const bytes = await repack('styles', (part, text) => (
      part === 'xl/comments1.xml' ? text.replace(/ref="[^"]+"/, 'ref="A0"') : text
    ));

    await expect(read(bytes)).rejects.toThrow(/The cell reference "A0" is not a valid A1 address/);
    await expect(read(bytes)).rejects.not.toThrow(/Cannot read properties of undefined/);
  });

  it('should keep ignoring a reference that is not an address at all', async() => {
    // The two cells sit in rows of their own past the fixture's data (A1:F4), so a reader that
    // placed them anyway — implicitly, after the row's previous cell — would put them at A5 and A6,
    // where nothing else can overwrite them.
    const withRows = cells => repack('values', (part, text) => (
      part === 'xl/worksheets/sheet1.xml' ? text.replace('</sheetData>', `${cells}</sheetData>`) : text
    ));
    const { rows } = (await read(await withRows(
      '<row r="5"><c r="1A"><v>1</v></c></row><row r="6"><c r=""><v>2</v></c></row>'
    ))).sheets[0];

    expect(rows[0].map(cell => cell.value)).toEqual(['Name', 'Amount', 'Active', 'Hired', 'Start', 'Ratio']);
    expect(rows[3][0].value).toBe('Li Wei');
    expect(rows[4]).toEqual([]);
    expect(rows[5]).toEqual([]);
    expect(rows.flat().filter(cell => cell && (cell.value === 1 || cell.value === 2))).toEqual([]);

    // The control: the same rows with NO `r` place their cells implicitly, at exactly the slots
    // inspected above — so the emptiness there is the reader ignoring the reference, not the
    // probe looking in the wrong place.
    const { rows: placed } = (await read(await withRows(
      '<row r="5"><c><v>1</v></c></row><row r="6"><c><v>2</v></c></row>'
    ))).sheets[0];

    expect(placed[4][0].value).toBe(1);
    expect(placed[5][0].value).toBe(2);
  });
});

describe('native reader hardening: the <sheetProtection> attribute allow-list', () => {
  it('should keep the permissions the model declares and drop every other attribute', async() => {
    const bytes = await repack('values', (part, text) => (
      part === 'xl/worksheets/sheet1.xml'
        ? text.replace('</worksheet>', '<sheetProtection sheet="1" formatColumns="0" objects="banana" '
          + 'constructor="1" toString="1" hasOwnProperty="1" hashValue="x"/></worksheet>')
        : text
    ));
    const workbook = await read(bytes);
    const { protection } = workbook.sheets[0];

    // `sheet` is stored as written, `formatColumns` is inverted back to "allowed", and nothing the
    // model does not declare survives — `constructor` and friends used to become own properties,
    // which made `options.hasOwnProperty(…)` throw for a consumer that called it.
    expect(protection.options).toEqual({ sheet: true, formatColumns: true });
    expect(Object.prototype.hasOwnProperty.call(protection.options, 'constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(protection.options, 'toString')).toBe(false);
    expect(protection.options.hasOwnProperty('sheet')).toBe(true); // eslint-disable-line no-prototype-builtins
  });
});

describe('native reader hardening: a package part the workbook names but does not carry', () => {
  it('should refuse a package whose root relationship points at a workbook part that is absent', async() => {
    // The workbook's path is the ROOT relationship's own text, so a package may name any part —
    // including one it does not hold. Without this check the reader asked the archive for the
    // missing part and surfaced the ZIP layer's "no entry named" instead of saying what is wrong
    // with the package.
    const bytes = await repack('values', (part, text) => (
      part === '_rels/.rels' ? text.replace('Target="xl/workbook.xml"', 'Target="xl/absent.xml"') : text
    ));

    await expect(read(bytes)).rejects.toThrow(/The archive has no workbook part at "xl\/absent\.xml"\./);
    await expect(read(bytes)).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should refuse a sheet whose r:id resolves to no relationship at all', async() => {
    // `r:id` is what binds a `<sheet>` to its part. An id no relationship declares leaves the sheet
    // with no path, which must be refused by name rather than read as an empty sheet.
    const bytes = await repack('values', (part, text) => (
      part === 'xl/workbook.xml' ? text.replace('r:id="rId4"', 'r:id="rIdAbsent"') : text
    ));

    await expect(read(bytes)).rejects.toThrow(/the sheet "Values" has no part\./);
    await expect(read(bytes)).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should refuse a sheet whose relationship targets a part the archive does not hold', async() => {
    const bytes = await repack('values', (part, text) => (
      part === 'xl/_rels/workbook.xml.rels'
        ? text.replace('Target="worksheets/sheet1.xml"', 'Target="worksheets/absent.xml"')
        : text
    ));

    await expect(read(bytes)).rejects.toThrow(/the sheet "Values" has no part\./);
  });
});

describe('native reader hardening: the part a sheet resolves to', () => {
  it('should refuse a sheet whose relationship targets a part that is not a worksheet', async() => {
    // A relationship target is the file's own text: `/[Content_Types].xml` resolves back inside the
    // archive and used to be tokenized as a worksheet, yielding an empty sheet with no diagnostic.
    const bytes = await repack('values', (part, text) => (
      part === 'xl/_rels/workbook.xml.rels'
        ? text.replace(/Target="worksheets\/sheet1.xml"/, 'Target="/[Content_Types].xml"')
        : text
    ));

    await expect(read(bytes)).rejects.toThrow(/the sheet "[^"]+" has no worksheet part\./);
  });

  it('should refuse a sheet pointed at the shared strings, and read the honest file it came from', async() => {
    const hostile = await repack('values', (part, text) => (
      part === 'xl/_rels/workbook.xml.rels'
        ? text.replace(/Target="worksheets\/sheet1.xml"/, 'Target="sharedStrings.xml"')
        : text
    ));

    await expect(read(hostile)).rejects.toThrow(/has no worksheet part\./);

    const honest = await read(await repack('values', (part, text) => text));

    // The honest file resolves the same sheet to its worksheet part and reads its cells.
    expect(honest.sheets.map(sheet => sheet.name)).toEqual(['Values']);
    expect(honest.sheets[0].rows[1][0].value).toBe('Ana García');
    expect(honest.sheets[0].rows[1][1].value).toBe(4200.5);
  });
});

describe('native reader hardening: a sheet typed by a <Default> content type', () => {
  it('should refuse a sheet whose relationship targets a .rels part', async() => {
    // `.rels` is typed by `<Default Extension="rels">`, never by an `<Override>`. While the reader
    // read overrides only, such a part had no declared type at all, was not one of the four parts
    // the reader resolves for another purpose, and so passed the worksheet check: the sheet read
    // back EMPTY, with no diagnostic, on a file that pointed a sheet at the package's own plumbing.
    for (const target of ['/_rels/.rels', '_rels/workbook.xml.rels']) {
      const bytes = await repack('values', (part, text) => (
        part === 'xl/_rels/workbook.xml.rels'
          ? text.replace(/Target="worksheets\/sheet1.xml"/, `Target="${target}"`)
          : text
      ));

      await expect(read(bytes)).rejects.toThrow(/the sheet "[^"]+" has no worksheet part\./);
      await expect(read(bytes)).rejects.toMatchObject({ cause: { handsontable: true } });
    }
  });

  it('should still read a sheet whose part carries the worksheet override', async() => {
    // The control for the rule above: honoring `<Default>` must not start refusing the sheets a
    // real package declares, which every writer types with an `<Override>`.
    const snapshot = await read(await repack('values', (part, text) => text));

    expect(snapshot.sheets.length).toBe(1);
  });
});

/**
 * Builds a ZIP by hand: ONE stored local record, plus one central-directory record per alias, all
 * of them pointing at that single local record. `writeZip` cannot produce this — it writes one
 * local record per entry — and the central directory is what an archive's entries are read from, so
 * N differently named records may share one region and each declare its own sizes for it.
 *
 * @param {Uint8Array} data The stored region's bytes.
 * @param {Array} aliases One `{ name, size, uncompressedSize }` per central-directory record; the
 *                        two sizes default to the region's own length.
 * @returns {ArrayBuffer}
 */
function craftAliasedArchive(data, aliases) {
  const names = aliases.map(alias => encoder.encode(alias.name));
  const crc = crc32(data);
  const localSize = 30 + names[0].byteLength + data.byteLength;
  const centralSize = names.reduce((sum, name) => sum + 46 + name.byteLength, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, data.byteLength, true);
  view.setUint32(22, data.byteLength, true);
  view.setUint16(26, names[0].byteLength, true);
  out.set(names[0], 30);
  out.set(data, 30 + names[0].byteLength);

  let offset = localSize;

  aliases.forEach((alias, index) => {
    const compressed = alias.size ?? data.byteLength;

    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, 20, true);
    // Each record declares the checksum of the bytes it really names, so an alias over a shorter
    // slice of the region is a well-formed record and only the case's own subject is under test.
    view.setUint32(offset + 16, compressed === data.byteLength ? crc : crc32(data.subarray(0, compressed)), true);
    view.setUint32(offset + 20, compressed, true);
    view.setUint32(offset + 24, alias.uncompressedSize ?? compressed, true);
    view.setUint16(offset + 28, names[index].byteLength, true);
    view.setUint32(offset + 42, 0, true);
    out.set(names[index], offset + 46);
    offset += 46 + names[index].byteLength;
  });

  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, aliases.length, true);
  view.setUint16(offset + 10, aliases.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, localSize, true);

  return out.buffer;
}

/**
 * Counts `TextDecoder#decode` calls, which is what one part read costs that nothing else does on
 * the stored path — the archive holds no compressed data to count inflates of.
 *
 * @returns {{ count: Function, restore: Function }}
 */
function countDecodes() {
  const original = TextDecoder.prototype.decode;
  let calls = 0;

  TextDecoder.prototype.decode = function countingDecode(...args) {
    calls += 1;

    return original.apply(this, args);
  };

  return {
    count: () => calls,
    restore: () => {
      TextDecoder.prototype.decode = original;
    },
  };
}

describe('native reader hardening: central-directory aliases', () => {
  it('should decode one region once however many names alias it', async() => {
    // The measured bomb: 128 names over one 32 MB stored region killed the process outright, in the
    // decode. The memo is keyed by the REGION an entry points at rather than by its name, so the
    // second alias and every one after it is free.
    const region = encoder.encode('<worksheet/>'.padEnd(300_000, ' '));
    const aliases = [];

    for (let i = 0; i < 64; i++) {
      aliases.push({ name: `xl/worksheets/sheet${i}.xml` });
    }

    const archive = await readZip(craftAliasedArchive(region, aliases));
    const decodes = countDecodes();

    try {
      const texts = [];

      for (const alias of aliases) {
        // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
        texts.push(await archive.text(alias.name));
      }

      expect(texts.length).toBe(64);
      expect(new Set(texts).size).toBe(1);
      expect(decodes.count()).toBe(1);
    } finally {
      decodes.restore();
    }
  });

  it('should charge every alias the memo cannot collapse, and refuse them by the total budget', async() => {
    // Aliases the memo CANNOT collapse: one region, one offset, but a different declared size each,
    // so every one of them is a distinct read. Each costs its decoded string (two bytes per
    // character, more than its bytes), so a 2.5 MB region reached over 64 such records is charged
    // past the 256 MB budget — which is the point: the charge follows what the archive produced,
    // so the cache cannot outgrow it.
    const region = encoder.encode('<worksheet/>'.padEnd(2_500_000, ' '));
    const aliases = [];

    for (let i = 0; i < 64; i++) {
      aliases.push({ name: `xl/worksheets/sheet${i}.xml`, size: region.byteLength - i });
    }

    const archive = await readZip(craftAliasedArchive(region, aliases));
    const readAll = async() => {
      for (const alias of aliases) {
        // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
        await archive.text(alias.name);
      }
    };

    await expect(readAll()).rejects.toThrow(
      new RegExp(`brings the inflated total to \\d+ bytes, above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit`)
    );
  });

  it('should refuse a lying alias read AFTER the honest record over the same region', async() => {
    // The memo sits in front of the checks `entryText()` makes on an entry's declared sizes, so a
    // key built from the region alone made both of them a matter of read ORDER: a crafted directory
    // listing one honest record and one liar over the same bytes served the liar from the cache
    // whenever the honest one was read first. Every declared field is in the key now.
    const region = encoder.encode('<worksheet/>'.padEnd(1500, ' '));
    const archive = await readZip(craftAliasedArchive(region, [
      { name: 'honest.xml', size: region.byteLength },
      { name: 'liar.xml', size: region.byteLength, uncompressedSize: 1 },
    ]));

    expect(await archive.text('honest.xml')).toBe(new TextDecoder().decode(region));
    await expect(archive.text('liar.xml')).rejects.toThrow(/a stored entry's two sizes must agree/);
  });

  it('should refuse a stored entry whose two declared sizes disagree', async() => {
    // The lie that bypassed the budget: a stored entry returns its COMPRESSED bytes, so a record
    // declaring one uncompressed byte beside a 1.5 MB compressed size was charged a single byte for
    // 1.5 MB of output. A well-formed ZIP declares the two equal for a stored entry.
    const region = encoder.encode('<worksheet/>'.padEnd(1500, ' '));
    const archive = await readZip(craftAliasedArchive(region, [
      { name: 'xl/worksheets/sheet1.xml', size: region.byteLength, uncompressedSize: 1 },
    ]));

    await expect(archive.text('xl/worksheets/sheet1.xml'))
      .rejects.toThrow(/a stored entry's two sizes must agree/);
    await expect(archive.text('xl/worksheets/sheet1.xml')).rejects.toMatchObject({ cause: { handsontable: true } });
  });
});

/**
 * The content type a package declares for a worksheet part.
 */
const WORKSHEET_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';

/**
 * Repacks the fixture with a `[Content_Types].xml` that types EVERY `.xml` part as a worksheet
 * through one `<Default>` and declares no `<Override>` but the main part's, optionally pointing
 * the workbook's sheet relationship at another part of the package.
 *
 * @param {string|null} target The sheet relationship's target, or `null` to leave it alone.
 * @returns {Promise<Uint8Array>}
 */
function repackWithWorksheetDefault(target) {
  return repack('values', (part, text) => {
    if (part === '[Content_Types].xml') {
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + `<Default Extension="xml" ContentType="${WORKSHEET_CONTENT_TYPE}"/>`
        // The main part keeps its own type: without it the `<Default>` would type the workbook as
        // a worksheet too, and the main-part check refuses the package before any sheet is looked
        // at - which is not the path these tests pin.
        + '<Override PartName="/xl/workbook.xml" '
        + 'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + '</Types>';
    }

    if (part === 'xl/_rels/workbook.xml.rels' && target !== null) {
      return text.replace(/Target="worksheets\/sheet1.xml"/, `Target="${target}"`);
    }

    return text;
  });
}

describe('native reader hardening: a package that types every .xml part as a worksheet', () => {
  it('should refuse a sheet pointed at the package\'s own plumbing whatever the file types it as', async() => {
    // The package-part test used to be a FALLBACK, consulted only where the file declared no type —
    // and the declaration is the attacker's text too. One `<Default Extension="xml">` carrying the
    // worksheet type answers for every `.xml` part, so a sheet could point back at the workbook,
    // the styles or the shared strings and read as an empty sheet with no diagnostic again. The
    // floor runs first now, and `xl/sharedStrings.xml` is in it whether or not this workbook
    // happens to declare a shared-strings relationship.
    const targets = [
      '/xl/workbook.xml',
      '/xl/styles.xml',
      '/xl/sharedStrings.xml',
      '/_rels/.rels',
      '/[Content_Types].xml',
    ];

    for (const target of targets) {
      const bytes = await repackWithWorksheetDefault(target);

      await expect(read(bytes)).rejects.toThrow(/the sheet "[^"]+" has no worksheet part\./);
      await expect(read(bytes)).rejects.toMatchObject({ cause: { handsontable: true } });
    }
  });

  it('should still read the sheet that same package types through the <Default>', async() => {
    // The control: the floor must refuse the plumbing without refusing a real sheet part, including
    // one a package types through a `<Default>` rather than an `<Override>`.
    const snapshot = await read(await repackWithWorksheetDefault(null));

    expect(snapshot.sheets.length).toBe(1);
  });

  it('should read a sheet whose declared type differs from the constant only in casing', async() => {
    // OPC compares a media type's type and subtype case-insensitively, and `===` refused a package
    // over one capital letter.
    const bytes = await repack('values', (part, text) => (
      part === '[Content_Types].xml'
        ? text.replace('spreadsheetml.worksheet+xml', 'spreadsheetml.Worksheet+xml')
        : text
    ));

    expect((await read(bytes)).sheets.length).toBe(1);
  });
});

/**
 * Builds a STORED archive by hand, with two local-header shapes `writeZip` never writes: a local
 * header carrying general-purpose bit 3 with its CRC and sizes zeroed and a 16-byte data descriptor
 * after the data, and a local header with an `extra` field the central record does not repeat.
 * Both shapes are legal, both are written by real tools (streaming writers, and archivers that put
 * a timestamp extra field on the local record only), and both are the reason the reader takes an
 * entry's sizes from the central directory and the data's start from the LOCAL header's own lengths.
 *
 * @param {Array<{ name: string, data: Uint8Array }>} entries The parts to store.
 * @param {object} shape The local-header shape.
 * @param {boolean} [shape.dataDescriptor=false] Set bit 3 and trail each entry with a descriptor.
 * @param {Uint8Array} [shape.localExtra] An extra field written on the local header only.
 * @returns {ArrayBuffer}
 */
function craftStoredArchive(entries, { dataDescriptor = false, localExtra = new Uint8Array(0) } = {}) {
  const DESCRIPTOR_SIZE = 16;
  const prepared = entries.map(entry => ({ ...entry, nameBytes: encoder.encode(entry.name), crc: crc32(entry.data) }));
  const localSize = prepared.reduce((sum, e) => sum + 30 + e.nameBytes.byteLength + localExtra.byteLength
    + e.data.byteLength + (dataDescriptor ? DESCRIPTOR_SIZE : 0), 0);
  const centralSize = prepared.reduce((sum, e) => sum + 46 + e.nameBytes.byteLength, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);
  const flags = dataDescriptor ? 0x0008 : 0;
  const localOffsets = [];
  let offset = 0;

  prepared.forEach((entry) => {
    localOffsets.push(offset);
    view.setUint32(offset, 0x04034b50, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, flags, true);
    // With bit 3 set the local header's CRC and sizes are zero and the descriptor carries them.
    view.setUint32(offset + 14, dataDescriptor ? 0 : entry.crc, true);
    view.setUint32(offset + 18, dataDescriptor ? 0 : entry.data.byteLength, true);
    view.setUint32(offset + 22, dataDescriptor ? 0 : entry.data.byteLength, true);
    view.setUint16(offset + 26, entry.nameBytes.byteLength, true);
    view.setUint16(offset + 28, localExtra.byteLength, true);
    out.set(entry.nameBytes, offset + 30);
    offset += 30 + entry.nameBytes.byteLength;
    out.set(localExtra, offset);
    offset += localExtra.byteLength;
    out.set(entry.data, offset);
    offset += entry.data.byteLength;

    if (dataDescriptor) {
      view.setUint32(offset, 0x08074b50, true);
      view.setUint32(offset + 4, entry.crc, true);
      view.setUint32(offset + 8, entry.data.byteLength, true);
      view.setUint32(offset + 12, entry.data.byteLength, true);
      offset += DESCRIPTOR_SIZE;
    }
  });

  const centralOffset = offset;

  prepared.forEach((entry, index) => {
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, 20, true);
    view.setUint16(offset + 8, flags, true);
    view.setUint32(offset + 16, entry.crc, true);
    view.setUint32(offset + 20, entry.data.byteLength, true);
    view.setUint32(offset + 24, entry.data.byteLength, true);
    view.setUint16(offset + 28, entry.nameBytes.byteLength, true);
    view.setUint32(offset + 42, localOffsets[index], true);
    out.set(entry.nameBytes, offset + 46);
    offset += 46 + entry.nameBytes.byteLength;
  });

  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, prepared.length, true);
  view.setUint16(offset + 10, prepared.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, centralOffset, true);

  return out.buffer;
}

/**
 * The parts of a fixture as `writeZip` input, so a hand-crafted archive holds a real workbook.
 *
 * @param {string} name The fixture name.
 * @returns {Promise<Array<{ name: string, data: Uint8Array }>>}
 */
async function fixtureParts(name) {
  const zip = await readZip(loadFixture(name));
  const entries = [];

  for (const partName of zip.names()) {
    // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
    entries.push({ name: partName, data: encoder.encode(await zip.text(partName)) });
  }

  return entries;
}

describe('native reader hardening: the local header is not where the sizes come from', () => {
  it('should read an archive whose local headers defer their sizes to a data descriptor', async() => {
    // A streaming writer does not know an entry's sizes when it writes the local header, so it
    // sets bit 3, writes zeros, and trails the data with a descriptor. The central directory is the
    // only record that carries the real sizes, and a reader that took them from the local header
    // would slice zero bytes from every entry.
    const parts = await fixtureParts('values');
    const baseline = await nativeAdapter.read(craftStoredArchive(parts), undefined, new DroppedFeatures());
    const snapshot = await nativeAdapter.read(
      craftStoredArchive(parts, { dataDescriptor: true }), undefined, new DroppedFeatures()
    );

    expect(baseline.sheets[0].rows.length).toBeGreaterThan(0);
    expect(snapshot.sheets).toEqual(baseline.sheets);
  });

  it('should read an archive whose local extra field is longer than the central record\'s', async() => {
    // The two records' extra fields are independent by the spec (a local-only timestamp field is
    // common). The data starts after the LOCAL header's name and extra lengths, so a reader that
    // walked past the central record's lengths instead would start every entry twelve bytes early.
    const parts = await fixtureParts('values');
    const baseline = await nativeAdapter.read(craftStoredArchive(parts), undefined, new DroppedFeatures());
    const snapshot = await nativeAdapter.read(
      craftStoredArchive(parts, { localExtra: new Uint8Array(12).fill(0xAB) }), undefined, new DroppedFeatures()
    );

    expect(snapshot.sheets).toEqual(baseline.sheets);
  });
});

describe('native reader hardening: a relationship id declared twice', () => {
  it('should refuse a sheet whose r:id is declared twice in the workbook relationships', async() => {
    // An id is unique per part by the OPC spec. The first relationship carrying it wins and is
    // then type-filtered, so a styles relationship reusing the sheet's `rId4` ahead of the
    // worksheet one leaves the sheet without a part — refused, where scanning every relationship
    // with that id used to read the sheet from a file that lied about which part it names.
    const bytes = await repack('values', (part, text) => (
      part === 'xl/_rels/workbook.xml.rels'
        ? text.replace(
          '<Relationship Id="rId4"',
          '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"'
            + ' Target="styles.xml"/><Relationship Id="rId4"'
        )
        : text
    ));

    await expect(read(bytes)).rejects.toThrow(/the sheet "Values" has no part\./);
    await expect(read(bytes)).rejects.toMatchObject({ cause: { handsontable: true } });
  });
});

describe('native reader hardening: an entry declaring zero inflated bytes', () => {
  it('should refuse a DEFLATE entry that declares zero bytes but produces some, by name', async() => {
    // The declared size is the inflate's ceiling, so a declaration of zero over a part that
    // inflates to anything at all is refused with the per-entry sentence, before the part is read.
    let bytes = await repack('values', (part, text) => text);

    bytes = declareInflatedSize(bytes, 'xl/styles.xml', 0);

    await expect(read(bytes)).rejects.toThrow(
      'The ZIP entry "xl/styles.xml" inflates above the 0-byte limit this reader accepts.'
    );
    await expect(read(bytes)).rejects.toMatchObject({ cause: { handsontable: true, limit: true } });
  });
});

describe('native reader hardening: one part read for many sheets', () => {
  it('should charge every further sheet that tokenizes a part again, against the inflated budget', async() => {
    // The memo inflates a shared part once, but each `<sheet>` naming it tokenizes it again and an
    // empty sheet charges one cell: 2048 sheets over one 40 MB cell-less part sat inside every
    // budget and extrapolated to about twenty minutes of work. A repeated read now costs what a
    // copy of the part would have.
    const padding = 30 * 1024 * 1024;
    const bytes = await repack('values', (part, text) => {
      if (part === 'xl/workbook.xml') {
        return withSheetCount(text, 8);
      }

      return part === 'xl/worksheets/sheet1.xml'
        ? text.replace('<sheetData>', `<!--${' '.repeat(padding)}--><sheetData>`)
        : text;
    });

    await expect(read(bytes)).rejects.toThrow(new RegExp('The archive entry "xl/worksheets/sheet1.xml" is read '
      + 'again for another sheet, bringing the inflated total to \\d+ bytes, '
      + `above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit`));
    await expect(read(bytes)).rejects.toMatchObject({ cause: { limit: true } });
  });
});

describe('native reader hardening: an absolute relationship target with ..', () => {
  /**
   * The values fixture with every `.xml` part typed as a worksheet by `<Default>` (the main part keeps
   * its own override), its sheet relationship pointed at `target`, and an `alias` entry carrying a
   * copy of the real worksheet.
   *
   * @param {string} target The relationship target.
   * @param {string} alias The name of the extra entry.
   * @returns {Promise<Uint8Array>}
   */
  async function aliased(target, alias) {
    let sheetText = '';
    const bytes = await repack('values', (part, text) => {
      if (part === 'xl/worksheets/sheet1.xml') {
        sheetText = text;
      }

      if (part === '[Content_Types].xml') {
        return text.replace('<Default Extension="xml" ContentType="application/xml"/>',
          '<Default Extension="xml" '
          + 'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
      }

      return part === 'xl/_rels/workbook.xml.rels'
        ? text.replace('Target="worksheets/sheet1.xml"', `Target="${target}"`)
        : text;
    });
    const zip = await readZip(toArrayBuffer(bytes));
    const entries = [];

    for (const name of zip.names()) {
      // eslint-disable-next-line no-await-in-loop -- one entry at a time.
      entries.push({ name, data: encoder.encode(await zip.text(name)) });
    }

    entries.push({ name: alias, data: encoder.encode(sheetText) });

    return writeZip(entries, true);
  }

  it('should collapse the segments before the package floor is checked', async() => {
    // Only a relative target was walked segment by segment; `/xl/../[Content_Types].xml` kept its
    // `..` and so matched an entry carrying that literal name instead of the floor name it means.
    const bytes = await aliased('/xl/../[Content_Types].xml', 'xl/../[Content_Types].xml');

    await expect(read(bytes)).rejects.toThrow(/the sheet "Values" has no worksheet part\./);
  });

  it('should read the sheet an absolute target with .. really names', async() => {
    const bytes = await aliased('/xl/worksheets/../worksheets/sheet1.xml', 'xl/unused.xml');
    const snapshot = await read(bytes);

    expect(snapshot.sheets[0].rows[1][0].value).toBe('Ana Garc\u00EDa');
  });
});
