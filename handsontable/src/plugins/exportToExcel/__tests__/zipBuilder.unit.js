import { TextEncoder as NodeTextEncoder } from 'util';
import { ZipBuilder } from '../zipBuilder';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = NodeTextEncoder;
}

describe('ZipBuilder', () => {
  it('should produce a valid ZIP structure for a single file', () => {
    const zip = new ZipBuilder();

    zip.addFile('hello.txt', 'Hello World');

    const result = zip.build();

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);

    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);

    expect(view.getUint32(0, true)).toBe(0x04034B50);
  });

  it('should include the correct local file header signature', () => {
    const zip = new ZipBuilder();

    zip.addFile('test.xml', '<root/>');

    const result = zip.build();
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);

    expect(view.getUint32(0, true)).toBe(0x04034B50);
  });

  it('should include the end of central directory signature', () => {
    const zip = new ZipBuilder();

    zip.addFile('file.txt', 'content');

    const result = zip.build();
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);

    const endSigOffset = result.byteLength - 22;

    expect(view.getUint32(endSigOffset, true)).toBe(0x06054B50);
  });

  it('should handle multiple files', () => {
    const zip = new ZipBuilder();

    zip.addFile('a.txt', 'File A');
    zip.addFile('b.txt', 'File B');
    zip.addFile('dir/c.txt', 'File C');

    const result = zip.build();

    expect(result).toBeInstanceOf(Uint8Array);

    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
    const endSigOffset = result.byteLength - 22;
    const entryCount = view.getUint16(endSigOffset + 8, true);

    expect(entryCount).toBe(3);
  });

  it('should produce correct entry count in end of central directory', () => {
    const zip = new ZipBuilder();

    zip.addFile('1.txt', '1');
    zip.addFile('2.txt', '2');
    zip.addFile('3.txt', '3');
    zip.addFile('4.txt', '4');
    zip.addFile('5.txt', '5');

    const result = zip.build();
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
    const endSigOffset = result.byteLength - 22;

    expect(view.getUint16(endSigOffset + 8, true)).toBe(5);
    expect(view.getUint16(endSigOffset + 10, true)).toBe(5);
  });

  it('should handle empty content', () => {
    const zip = new ZipBuilder();

    zip.addFile('empty.txt', '');

    const result = zip.build();

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle unicode content', () => {
    const zip = new ZipBuilder();

    zip.addFile('unicode.txt', 'こんにちは世界 🌍');

    const result = zip.build();

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should use STORE compression method (0)', () => {
    const zip = new ZipBuilder();

    zip.addFile('test.txt', 'Hello');

    const result = zip.build();
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);

    expect(view.getUint16(8, true)).toBe(0);
  });

  it('should store uncompressed data with matching compressed and uncompressed sizes', () => {
    const zip = new ZipBuilder();
    const content = 'Test content here';

    zip.addFile('test.txt', content);

    const result = zip.build();
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
    const compressedSize = view.getUint32(18, true);
    const uncompressedSize = view.getUint32(22, true);

    expect(compressedSize).toBe(uncompressedSize);
    expect(uncompressedSize).toBe(new TextEncoder().encode(content).byteLength);
  });
});
