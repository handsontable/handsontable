/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nativeAdapter } from '../adapters/native';
import { DroppedFeatures } from '../capabilities';
import {
  MAX_INFLATED_ENTRY_BYTES, MAX_INFLATED_TOTAL_BYTES, MAX_WORKBOOK_SHEETS,
} from '../limits';
import { assertSheetFits } from '../adapters/native/parts/worksheetReader';
import { readZip } from '../adapters/native/zip/reader';
import { writeZip } from '../adapters/native/zip/writer';

const encoder = new TextEncoder();
const EOCD_SIGNATURE = 0x06054b50;

/**
 * Loads a fixture as an `ArrayBuffer`.
 *
 * @param {string} name The fixture name, without the extension.
 * @returns {ArrayBuffer}
 */
function load(name) {
  const bytes = readFileSync(join(__dirname, 'fixtures', `${name}.xlsx`));

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Repacks a fixture, passing every part through `transform`. Building the hostile input this way
 * keeps it in the kilobytes: the point of each test below is that a cap refuses before the work
 * happens, so the file never has to be as large as the work it asks for.
 *
 * @param {string} name The fixture name.
 * @param {Function} transform Receives the part name and its text, returns the text to write.
 * @returns {Promise<Uint8Array>}
 */
async function repack(name, transform) {
  const zip = await readZip(load(name));
  const entries = [];

  for (const partName of zip.names()) {
    // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
    const text = await zip.text(partName);

    entries.push({ name: partName, data: encoder.encode(transform(partName, text)) });
  }

  return writeZip(entries, true);
}

/**
 * Detaches a `Uint8Array` into the `ArrayBuffer` the adapter takes.
 *
 * @param {Uint8Array} bytes The archive bytes.
 * @returns {ArrayBuffer}
 */
function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
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
  const original = globalThis.DecompressionStream;
  let constructed = 0;

  /**
   * Installs a value under the global name, which `test/cryptoSetup.js` defines as non-writable.
   *
   * @param {Function} value The constructor to install.
   */
  const install = (value) => {
    Object.defineProperty(globalThis, 'DecompressionStream', { value, writable: false, configurable: true });
  };

  install(class CountingDecompressionStream extends original {
    /**
     * @param {string} format The compression format.
     */
    constructor(format) {
      super(format);
      constructed += 1;
    }
  });

  return {
    count: () => constructed,
    restore: () => install(original),
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

      // Exactly the two parts read before the sheet list exists: `_rels/.rels` and
      // `xl/workbook.xml`. No worksheet part, no styles, no shared strings.
      expect(inflates.count()).toBe(2);
    } finally {
      inflates.restore();
    }
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

  it('should charge a sheet that declares nothing at least one unit of the workbook budget', () => {
    const budget = { declaredCells: 0 };

    assertSheetFits('empty', 0, 0, 0, budget);
    assertSheetFits('empty', 0, 0, 0, budget);

    expect(budget.declaredCells).toBe(2);
  });
});

describe('native reader hardening: the inflated-bytes budget', () => {
  it('should refuse a workbook whose parts together inflate above the total budget', async() => {
    // Two parts, each inside the per-entry cap, together past the workbook total. Without a total,
    // `openPackage` alone can hold three parts at once and nothing bounds their sum.
    const half = Math.floor(MAX_INFLATED_TOTAL_BYTES * 0.75);
    let bytes = await repack('values', (part, text) => text);

    bytes = declareInflatedSize(bytes, 'xl/styles.xml', half);
    bytes = declareInflatedSize(bytes, 'xl/worksheets/sheet1.xml', half);

    await expect(read(bytes)).rejects.toThrow(
      new RegExp(`brings the inflated total to \\d+ bytes, above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit`)
    );
  });

  it('should refuse a single part that inflates above the total budget though it is inside the per-entry cap', async() => {
    // The measured case: a 408 kB archive holding one 400 MB part, which was inside every declared
    // cap and cost 1.9 GB of resident memory before it resolved.
    const fourHundredMegabytes = 400 * 1024 * 1024;

    expect(fourHundredMegabytes).toBeLessThan(MAX_INFLATED_ENTRY_BYTES);

    let bytes = await repack('values', (part, text) => text);

    bytes = declareInflatedSize(bytes, 'xl/styles.xml', fourHundredMegabytes);

    await expect(read(bytes)).rejects.toThrow(
      new RegExp(`brings the inflated total to \\d+ bytes, above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit`)
    );
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
    const bytes = await repack('values', (part, text) => (
      part === 'xl/worksheets/sheet1.xml'
        ? text.replace('<sheetData>', '<sheetData><row r="1"><c r="1A"><v>1</v></c><c r=""><v>2</v></c></row>')
        : text
    ));

    await expect(read(bytes)).resolves.toBeDefined();
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
    await expect(read(await repack('values', (part, text) => text))).resolves.toBeDefined();
  });
});
