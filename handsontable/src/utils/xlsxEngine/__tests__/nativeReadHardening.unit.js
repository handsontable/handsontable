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
import { crc32 } from '../adapters/native/zip/crc32';
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
  it('should refuse a workbook whose parts really inflate above the total budget', async() => {
    // A part that REALLY inflates past the budget, not one that merely declares it: the charge is
    // what the entry produced, so a padded part is the only thing the total can refuse. A decoded
    // part costs its bytes plus its UTF-16 string, which is why 90 MB of padding is over a 256 MB
    // budget, and the archive itself stays a few hundred kilobytes.
    const padding = 90 * 1024 * 1024;

    expect(padding).toBeLessThan(MAX_INFLATED_ENTRY_BYTES);
    expect(padding * 3).toBeGreaterThan(MAX_INFLATED_TOTAL_BYTES);

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
    await expect(read(await repack('values', (part, text) => text))).resolves.toBeDefined();
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
    view.setUint32(offset + 16, crc, true);
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
    // so every one of them is a distinct read. Each costs its bytes plus its decoded string, so a
    // 1.5 MB region reached over 64 such records is charged past the 256 MB budget — which is the
    // point: the charge now follows what the archive produced, so the cache cannot outgrow it.
    const region = encoder.encode('<worksheet/>'.padEnd(1_500_000, ' '));
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
