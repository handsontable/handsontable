/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { crc32 } from '../adapters/native/zip/crc32';
import { readZip } from '../adapters/native/zip/reader';
import { deflateRaw, inflateRaw } from '../adapters/native/zip/streams';
import { writeZip } from '../adapters/native/zip/writer';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe('crc32', () => {
  it('should match the CRC-32 check value for "123456789"', () => {
    expect(crc32(encoder.encode('123456789'))).toBe(0xCBF43926);
  });

  it('should return 0 for an empty input', () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe('deflateRaw / inflateRaw', () => {
  it('should round-trip through the platform streams and be readable by zlib', async() => {
    const input = encoder.encode('abc'.repeat(1000));
    const deflated = await deflateRaw(input);

    expect(deflated.byteLength).toBeLessThan(input.byteLength);
    expect(decoder.decode(inflateRawSync(deflated))).toBe('abc'.repeat(1000));
    expect(decoder.decode(await inflateRaw(deflated, 1024 * 1024))).toBe('abc'.repeat(1000));
  });

  it('should refuse an entry that inflates above the cap', async() => {
    const deflated = await deflateRaw(new Uint8Array(100_000));

    await expect(inflateRaw(deflated, 1000)).rejects.toThrow(/inflates above the 1000-byte limit/);
  });

  it('should reject corrupt deflate data with a Handsontable error', async() => {
    await expect(inflateRaw(new Uint8Array([1, 2, 3, 4, 5]), 1000)).rejects.toMatchObject({
      cause: { handsontable: true },
    });
  });
});

/**
 * Reads the central directory of `zip` and returns `{ name, method, crc, size }` per entry, so the
 * writer is checked against the ZIP layout itself and not only against our own reader.
 * @param zip
 */
function centralDirectory(zip) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let eocd = zip.byteLength - 22;

  while (view.getUint32(eocd, true) !== 0x06054b50) {
    eocd -= 1;
  }

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries = [];

  for (let i = 0; i < count; i++) {
    expect(view.getUint32(offset, true)).toBe(0x02014b50);

    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);

    entries.push({
      name: decoder.decode(zip.subarray(offset + 46, offset + 46 + nameLength)),
      method: view.getUint16(offset + 10, true),
      crc: view.getUint32(offset + 16, true),
      size: view.getUint32(offset + 24, true),
      flags: view.getUint16(offset + 8, true),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

describe('writeZip', () => {
  const entries = [
    { name: '[Content_Types].xml', data: encoder.encode('<Types/>') },
    { name: 'xl/wörkbook.xml', data: encoder.encode('<workbook/>'.repeat(50)) },
  ];

  it('should store every entry uncompressed when compression is off', async() => {
    const zip = await writeZip(entries, false);
    const dir = centralDirectory(zip);

    expect(dir.map(e => e.name)).toEqual(['[Content_Types].xml', 'xl/wörkbook.xml']);
    expect(dir.map(e => e.method)).toEqual([0, 0]);
    expect(dir[0].crc).toBe(crc32(entries[0].data));
    expect(dir[1].size).toBe(entries[1].data.byteLength);
    // Bit 11 marks the file name as UTF-8, which "wörkbook" needs to survive.
    // eslint-disable-next-line no-bitwise
    expect(dir[1].flags & 0x0800).toBe(0x0800);
  });

  it('should deflate every entry when compression is on, and come out smaller', async() => {
    const stored = await writeZip(entries, false);
    const deflated = await writeZip(entries, true);

    expect(centralDirectory(deflated).map(e => e.method)).toEqual([8, 8]);
    expect(deflated.byteLength).toBeLessThan(stored.byteLength);
  });

  it('should write a local header whose data zlib can inflate', async() => {
    const zip = await writeZip([entries[1]], true);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

    expect(view.getUint32(0, true)).toBe(0x04034b50);

    const nameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const compressedSize = view.getUint32(18, true);
    const start = 30 + nameLength + extraLength;
    const data = zip.subarray(start, start + compressedSize);

    expect(decoder.decode(inflateRawSync(data))).toBe('<workbook/>'.repeat(50));
  });
});

function fixtureBuffer(name) {
  const bytes = readFileSync(join(__dirname, 'fixtures', `${name}.xlsx`));

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Scans backwards for the end-of-central-directory record and returns the central directory's
 * start offset, so the byte-surgery tests below share one EOCD scan instead of repeating it.
 * This returns the FIRST central record's offset; it coincides with the last (and only) one
 * because every caller here builds a single-entry archive, not because it walks to the end.
 * @param view
 * @param zip
 */
function centralDirectoryOffset(view, zip) {
  let eocd = zip.byteLength - 22;

  while (view.getUint32(eocd, true) !== 0x06054b50) {
    eocd -= 1;
  }

  return view.getUint32(eocd + 16, true);
}

describe('readZip', () => {
  it('should list and read back the entries our own writer produced, stored and deflated', async() => {
    const entries = [
      { name: 'a.xml', data: encoder.encode('<a/>') },
      { name: 'dir/b.xml', data: encoder.encode('<b>ü</b>'.repeat(20)) },
    ];

    for (const compress of [false, true]) {
      const zip = await writeZip(entries, compress);
      const archive = await readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));

      expect(archive.names()).toEqual(['a.xml', 'dir/b.xml']);
      expect(archive.has('dir/b.xml')).toBe(true);
      expect(archive.has('missing')).toBe(false);
      expect(await archive.text('dir/b.xml')).toBe('<b>ü</b>'.repeat(20));
    }
  });

  it('should open an archive written by ExcelJS (JSZip) and expose the OOXML parts', async() => {
    const archive = await readZip(fixtureBuffer('values'));

    expect(archive.names()).toEqual(expect.arrayContaining([
      '[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml',
    ]));
    expect(await archive.text('xl/workbook.xml')).toMatch(/^<\?xml/);
  });

  it('should strip a UTF-8 byte order mark from a text part', async() => {
    const zip = await writeZip([
      { name: 'bom.xml', data: new Uint8Array([0xEF, 0xBB, 0xBF, 0x3C, 0x61, 0x2F, 0x3E]) },
    ], false);
    const archive = await readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));

    expect(await archive.text('bom.xml')).toBe('<a/>');
  });

  it('should reject a buffer that is not a zip archive', async() => {
    await expect(readZip(new Uint8Array([1, 2, 3]).buffer)).rejects.toThrow(/no ZIP end-of-central-directory record/);
    await expect(readZip(new Uint8Array([1, 2, 3]).buffer)).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should reject an entry whose declared inflated size is above the cap', async() => {
    const zip = await writeZip([{ name: 'big.bin', data: new Uint8Array(10) }], true);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const central = centralDirectoryOffset(view, zip);

    // Central header offset 24 holds the uncompressed size; lie about it.
    view.setUint32(central + 24, 0xFFFFFFF0, true);

    const archive = await readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));

    await expect(archive.text('big.bin')).rejects.toThrow(/declares .* bytes, above the .*-byte limit/);
  });

  it('should cap inflation at the entry\'s OWN declared size, not just the reader ceiling', async() => {
    // A highly-compressible payload whose real inflated size is far above what the central
    // directory will claim: the reader must not trust the ceiling alone and let it through.
    const zip = await writeZip([{ name: 'big.bin', data: new Uint8Array(100_000) }], true);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const central = centralDirectoryOffset(view, zip);

    // Central header offset 24 holds the uncompressed size; lie DOWN, not up — a small declared
    // size that the actual stream inflates past.
    view.setUint32(central + 24, 50, true);

    const archive = await readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));

    await expect(archive.text('big.bin')).rejects.toThrow(/inflates above the 50-byte limit/);
  });

  it('should reject an unknown compression method', async() => {
    const zip = await writeZip([{ name: 'x.bin', data: new Uint8Array(4) }], false);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const central = centralDirectoryOffset(view, zip);

    view.setUint16(central + 10, 12, true);

    await expect(readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength)))
      .rejects.toThrow(/compression method 12/);
  });

  it('should refuse an archive that declares the same entry name twice', async() => {
    // Several ZIP readers resolve the FIRST record and this one kept the LAST, so a crafted archive
    // holding two `dup.xml` entries read differently here than in whatever inspected it upstream.
    const zip = await writeZip([
      { name: 'dup.xml', data: encoder.encode('FIRST') },
      { name: 'dup.xml', data: encoder.encode('SECOND') },
    ], false);

    const buffer = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);

    await expect(readZip(buffer)).rejects.toThrow(/The ZIP entry "dup.xml" is declared twice/);
    await expect(readZip(buffer)).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should reject a central directory record whose length fields run past the end record', async() => {
    const zip = await writeZip([{ name: 'x.bin', data: new Uint8Array(4) }], false);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const central = centralDirectoryOffset(view, zip);

    // Central header offset 28 holds the file name length; lie about it so the last record's
    // declared length runs past the end-of-central-directory record.
    view.setUint16(central + 28, 0xFF00, true);

    await expect(readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength)))
      .rejects.toThrow(/central directory record .* is malformed/);
    await expect(readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength)))
      .rejects.toMatchObject({ cause: { handsontable: true } });
  });
});
