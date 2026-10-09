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

  it('should write every local header to agree with its central record', async() => {
    // The reader takes the CRC-32 and both sizes from the central directory, so a wrong local field
    // reached no test, while a streaming reader (`bsdtar -xOf -`) and `unzip -t` reject the file.
    // Deflated, so the two sizes differ and a swapped size is visible too.
    const zip = await writeZip(entries, true);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const eocd = endRecordOffset(view, zip);
    const entryCount = view.getUint16(eocd + 10, true);
    let off = view.getUint32(eocd + 16, true);

    for (let i = 0; i < entryCount; i++) {
      const local = view.getUint32(off + 42, true);

      expect(view.getUint32(local, true)).toBe(0x04034b50);
      expect(view.getUint16(local + 6, true)).toBe(view.getUint16(off + 8, true)); // flags
      expect(view.getUint16(local + 8, true)).toBe(view.getUint16(off + 10, true)); // method
      expect(view.getUint32(local + 14, true)).toBe(view.getUint32(off + 16, true)); // CRC-32
      expect(view.getUint32(local + 18, true)).toBe(view.getUint32(off + 20, true)); // compressed size
      expect(view.getUint32(local + 22, true)).toBe(view.getUint32(off + 24, true)); // uncompressed size
      off += 46 + view.getUint16(off + 28, true) + view.getUint16(off + 30, true) + view.getUint16(off + 32, true);
    }
  });

  it('should name the entry, and give a reason, when a part\'s deflate stream is corrupt', async() => {
    const zip = await writeZip([entries[1]], true);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const start = 30 + view.getUint16(26, true) + view.getUint16(28, true);

    // BFINAL set and BTYPE 11: a block type DEFLATE reserves, which every inflater rejects.
    zip[start] = 0x07;

    const archive = await readZip(zip.slice().buffer);

    await expect(archive.text('xl/wörkbook.xml'))
      .rejects.toThrow(/^The archive entry "xl\/wörkbook\.xml" could not be processed: \S/);
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
 * Scans backwards for the end-of-central-directory record and returns its offset.
 * @param view
 * @param zip
 */
function endRecordOffset(view, zip) {
  let eocd = zip.byteLength - 22;

  while (view.getUint32(eocd, true) !== 0x06054b50) {
    eocd -= 1;
  }

  return eocd;
}

/**
 * Returns the central directory's start offset, so the byte-surgery tests below share one EOCD
 * scan instead of repeating it. This returns the FIRST central record's offset; it coincides with
 * the last (and only) one because every caller here builds a single-entry archive, not because it
 * walks to the end.
 * @param view
 * @param zip
 */
function centralDirectoryOffset(view, zip) {
  return view.getUint32(endRecordOffset(view, zip) + 16, true);
}

/**
 * Writes a single-entry archive and hands its bytes, a `DataView` over them and its central
 * directory's offset to `patch`, then detaches the result for `readZip`. Every refusal below is a
 * ONE-FIELD lie told on an otherwise valid archive, so the refusal it triggers is the only thing
 * that differs between them.
 * @param patch
 * @param data
 */
async function patchedArchive(patch, data = new Uint8Array(4)) {
  const zip = await writeZip([{ name: 'x.bin', data }], false);
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

  patch(view, zip, centralDirectoryOffset(view, zip));

  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);
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

  it('should name a Compound File (legacy .xls or a password-protected workbook) instead of the EOCD scan', async() => {
    // An `.xls` and an encrypted `.xlsx` are both OLE Compound Files, not ZIP archives, and were
    // refused with "no ZIP end-of-central-directory record" - true, and useless to the user.
    const cfb = new Uint8Array(4096);

    cfb.set([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);

    await expect(readZip(cfb.buffer)).rejects.toThrow(
      'the file is a legacy Excel 97-2003 workbook (.xls) or a password-protected workbook, '
      + 'which the built-in engine does not read. Save it as an unprotected .xlsx.'
    );
    await expect(readZip(cfb.buffer)).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should keep the end-of-central-directory refusal for bytes that are neither ZIP nor Compound File', async() => {
    // Seven of the eight signature bytes are not the signature: only the whole signature at
    // offset 0 is a Compound File.
    const almost = new Uint8Array(4096);

    almost.set([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0x00]);

    const random = new Uint8Array(4096).map((_, i) => ((i * 7919) + 13) % 251);

    await expect(readZip(almost.buffer)).rejects.toThrow(/no ZIP end-of-central-directory record/);
    await expect(readZip(random.buffer)).rejects.toThrow(/no ZIP end-of-central-directory record/);
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

  it('should accept a deflated entry whose declared size lies HIGH, charging what it produced', async() => {
    // The budget is charged for the bytes an entry really produced, never for the size it claimed:
    // a declaration of 300 MB over a hundred real bytes bounds the inflate (it is the ceiling) and
    // costs the archive a hundred bytes, where charging the claim refused a perfectly readable file.
    const zip = await writeZip([{ name: 'small.xml', data: encoder.encode('<a/>'.repeat(25)) }], true);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const central = centralDirectoryOffset(view, zip);

    // Central header offset 24 holds the uncompressed size; lie UP, far above what the stream holds.
    view.setUint32(central + 24, 300 * 1024 * 1024, true);

    const archive = await readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));

    expect(await archive.text('small.xml')).toBe('<a/>'.repeat(25));
  });

  it('should reject an unknown compression method', async() => {
    const zip = await writeZip([{ name: 'x.bin', data: new Uint8Array(4) }], false);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const central = centralDirectoryOffset(view, zip);

    view.setUint16(central + 10, 12, true);

    await expect(readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength)))
      .rejects.toThrow(/compression method 12/);
  });

  it('should refuse an encrypted entry by name, before its bytes are touched', async() => {
    // General-purpose flag bit 0 is ZipCrypto and bit 6 is strong encryption; the data behind
    // either is not the entry's bytes. Unread, the flag let a ZipCrypto entry reach the inflater
    // and fail as corrupt data (or, stored, read back as ciphertext). Both headers carry the
    // field; the central one is what the reader reads, and the local one is patched for a
    // consistent archive.
    const encrypted = [0x0001, 0x0040].map(flag => patchedArchive((view, zip, central) => {
      view.setUint16(central + 8, flag | view.getUint16(central + 8, true), true); // eslint-disable-line no-bitwise
      view.setUint16(6, flag | view.getUint16(6, true), true); // eslint-disable-line no-bitwise
    }));

    for (const pending of encrypted) {
      const buffer = await pending;

      await expect(readZip(buffer))
        .rejects.toThrow('The ZIP entry "x.bin" is encrypted, which this reader does not accept.');
      await expect(readZip(buffer)).rejects.toMatchObject({ cause: { handsontable: true } });
    }
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

  it('should reject a central directory that is out of bounds or declares ZIP64 offsets', async() => {
    // The ZIP64 half: the end record stores 0xFFFFFFFF in the offset (or the size) field and the
    // real value lives in a ZIP64 locator this reader does not read, so following the marker as if
    // it were an offset would walk to byte 4294967295 of a file that has none.
    const zip64Offset = await patchedArchive((view, zip) => {
      view.setUint32(endRecordOffset(view, zip) + 16, 0xFFFFFFFF, true);
    });
    const zip64Size = await patchedArchive((view, zip) => {
      view.setUint32(endRecordOffset(view, zip) + 12, 0xFFFFFFFF, true);
    });
    // The out-of-bounds half: honest-looking numbers whose sum reaches past the end record, which
    // is where the directory must stop.
    const outOfBounds = await patchedArchive((view, zip) => {
      view.setUint32(endRecordOffset(view, zip) + 12, 0x00FF0000, true);
    });

    for (const buffer of [zip64Offset, zip64Size, outOfBounds]) {
      await expect(readZip(buffer))
        .rejects.toThrow(/central directory is out of bounds or uses ZIP64, which this reader does not accept/);
      await expect(readZip(buffer)).rejects.toMatchObject({ cause: { handsontable: true } });
    }
  });

  it('should reject an entry whose sizes or local offset are declared as ZIP64', async() => {
    // Every one of these three fields is 32-bit in the classic record, and 0xFFFFFFFF is the escape
    // that says "read the real value from the ZIP64 extra field". Taking the marker at face value
    // would mean a 4 GB slice, or a slice starting past the end of the file.
    const compressed = await patchedArchive((view, zip, central) => view.setUint32(central + 20, 0xFFFFFFFF, true));
    const uncompressed = await patchedArchive((view, zip, central) => view.setUint32(central + 24, 0xFFFFFFFF, true));
    const localOffset = await patchedArchive((view, zip, central) => view.setUint32(central + 42, 0xFFFFFFFF, true));

    for (const buffer of [compressed, uncompressed, localOffset]) {
      await expect(readZip(buffer))
        .rejects.toThrow(/The ZIP entry "x.bin" uses ZIP64 sizes, which this reader does not accept/);
      await expect(readZip(buffer)).rejects.toMatchObject({ cause: { handsontable: true } });
    }
  });

  it('should reject a request for an entry the archive does not declare', async() => {
    // The package layer asks for a part by name after `has()` said yes; a caller that skips that
    // check must get this reader's own refusal rather than an internal `undefined` dereference.
    const zip = await writeZip([{ name: 'a.xml', data: encoder.encode('<a/>') }], false);
    const archive = await readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));

    await expect(archive.text('xl/workbook.xml')).rejects.toThrow(/The archive has no entry named "xl\/workbook.xml"/);
    await expect(archive.text('xl/workbook.xml')).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should reject an entry whose local header is malformed', async() => {
    // The central directory is the authoritative record, but the DATA is found through the local
    // offset it names. Pointed anywhere but a local file header, the bytes that follow are not this
    // entry's — they are whatever happened to be there.
    const insideFile = await patchedArchive((view, zip, central) => view.setUint32(central + 42, 1, true));
    // The other shape: an offset so late that the header itself does not fit in the file.
    const pastEnd = await patchedArchive(
      (view, zip, central) => view.setUint32(central + 42, zip.byteLength - 1, true),
    );

    for (const buffer of [insideFile, pastEnd]) {
      const archive = await readZip(buffer);

      await expect(archive.text('x.bin')).rejects.toThrow(/The ZIP entry "x.bin" has a malformed local header/);
      await expect(archive.text('x.bin')).rejects.toMatchObject({ cause: { handsontable: true } });
    }
  });

  it('should reject an entry whose declared compressed size runs past the end of the file', async() => {
    // A truncated (or crafted) archive whose last entry claims more bytes than the file holds. The
    // slice would silently come back short, so the entry is refused instead of read in part.
    const buffer = await patchedArchive((view, zip, central) => view.setUint32(central + 20, 0x0000FF00, true));
    const archive = await readZip(buffer);

    await expect(archive.text('x.bin')).rejects.toThrow(/The ZIP entry "x.bin" runs past the end of the file/);
    await expect(archive.text('x.bin')).rejects.toMatchObject({ cause: { handsontable: true } });
  });
});

describe('writeZip: the fields the classic ZIP format can declare', () => {
  it('should refuse more entries than the end record can count', async() => {
    // The entry count is a 16-bit field; a 65536th entry would wrap it to zero and the archive
    // would open as empty. 65536 empty stored entries are a few megabytes and take well under a
    // second, so the guard is exercised for real rather than through a synthetic count.
    const entries = [];

    for (let i = 0; i <= 0xFFFF; i++) {
      entries.push({ name: `e${i}`, data: new Uint8Array(0) });
    }

    await expect(writeZip(entries, false))
      .rejects.toThrow('The archive would hold 65536 entries, above the 65535 the ZIP format can declare.');
    await expect(writeZip(entries, false)).rejects.toMatchObject({ cause: { handsontable: true } });
    await expect(writeZip(entries.slice(1), false)).resolves.toBeInstanceOf(Uint8Array);
  });
});

describe('crc32: incremental use', () => {
  it('should continue a checksum across chunks to the same value as one pass', () => {
    const whole = encoder.encode('The quick brown fox jumps over the lazy dog');

    expect(crc32(whole.subarray(10), crc32(whole.subarray(0, 10)))).toBe(crc32(whole));
    expect(crc32(whole)).toBe(0x414FA339);
  });
});

describe('readZip: the CRC-32 the central directory declares', () => {
  /**
   * Writes one entry and flips one byte of its stored or compressed data, keeping every size.
   *
   * @param {boolean} compress Whether to deflate the entry.
   * @param {Function} [corrupt] Edits the data region in place.
   * @returns {Promise<ArrayBuffer>}
   */
  async function oneEntry(compress, corrupt = () => {}) {
    const zip = await writeZip([{ name: 'xl/worksheets/sheet1.xml', data: encoder.encode('<a>b</a>'.repeat(64)) }],
      compress);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const start = 30 + view.getUint16(26, true) + view.getUint16(28, true);

    corrupt(zip.subarray(start, start + view.getUint32(18, true)), view);

    return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);
  }

  it('should refuse a stored entry whose bytes do not match the declared CRC-32', async() => {
    // `unzip -t` and Python's `testzip()` both flag one flipped byte; this reader read the part as
    // if nothing had happened and the sheet came back with a wrong cell.
    const archive = await readZip(await oneEntry(false, (data) => {
      data[1] = 'x'.charCodeAt(0);
    }));

    await expect(archive.text('xl/worksheets/sheet1.xml'))
      .rejects.toThrow('The ZIP entry "xl/worksheets/sheet1.xml" fails its CRC-32 check; the archive is corrupt.');
    await expect(archive.text('xl/worksheets/sheet1.xml')).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should refuse a deflated entry whose inflated bytes do not match the declared CRC-32', async() => {
    const zip = await oneEntry(true);
    const view = new DataView(zip);
    const central = view.getUint32(endRecordOffset(view, new Uint8Array(zip)) + 16, true);

    view.setUint32(central + 16, (view.getUint32(central + 16, true) + 1) >>> 0, true); // eslint-disable-line no-bitwise

    const archive = await readZip(zip);

    await expect(archive.text('xl/worksheets/sheet1.xml')).rejects.toThrow(/fails its CRC-32 check/);
  });

  it('should read both kinds when the checksum matches', async() => {
    for (const compress of [false, true]) {
      const archive = await readZip(await oneEntry(compress));

      expect(await archive.text('xl/worksheets/sheet1.xml')).toBe('<a>b</a>'.repeat(64));
    }
  });
});

describe('readZip: an end record signature inside the archive comment', () => {
  it('should pick the end record whose comment reaches the end of the file', async() => {
    // The scan runs backwards and took the first signature it met, so `PK\x05\x06` written into the
    // archive comment hid the real record and the file read as having no workbook part.
    const zip = await writeZip([{ name: 'a.xml', data: encoder.encode('<a/>') }], false);
    const fake = new Uint8Array(22);
    const fakeView = new DataView(fake.buffer);

    fakeView.setUint32(0, 0x06054b50, true);
    fakeView.setUint16(10, 3, true);
    fakeView.setUint32(16, 1, true);

    const comment = new Uint8Array(64);

    comment.set(fake, 20);

    const out = new Uint8Array(zip.byteLength + comment.byteLength);

    out.set(zip);
    out.set(comment, zip.byteLength);
    new DataView(out.buffer).setUint16(zip.byteLength - 2, comment.byteLength, true);

    const archive = await readZip(out.buffer);

    expect(archive.names()).toEqual(['a.xml']);
    expect(await archive.text('a.xml')).toBe('<a/>');
  });
});

describe('readZip: part names are case-insensitive', () => {
  it('should find an entry whatever case the caller spells it in, and list it as written', async() => {
    const zip = await writeZip([{ name: 'xl/worksheets/Sheet1.xml', data: encoder.encode('<s/>') }], false);
    const archive = await readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));

    expect(archive.names()).toEqual(['xl/worksheets/Sheet1.xml']);
    expect(archive.has('xl/worksheets/sheet1.xml')).toBe(true);
    expect(await archive.text('XL/Worksheets/SHEET1.xml')).toBe('<s/>');
  });

  it('should refuse two entries whose names differ only in case, as one name declared twice', async() => {
    const zip = await writeZip([
      { name: 'xl/sheet.xml', data: encoder.encode('FIRST') },
      { name: 'XL/Sheet.xml', data: encoder.encode('SECOND') },
    ], false);

    await expect(readZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength)))
      .rejects.toThrow(/The ZIP entry "XL\/Sheet.xml" is declared twice/);
  });
});
