/**
 * @jest-environment node
 */
import * as packageParts from '../adapters/native/parts/package';
import { nativeAdapter } from '../adapters/native';
import { sheetRelationships } from '../adapters/native/read';
import { writeZip } from '../adapters/native/zip/writer';
import { DroppedFeatures } from '../capabilities';
import { MAX_WORKBOOK_SHEETS } from '../limits';
import { toArrayBuffer } from './helpers/fixtures';

/**
 * Wraps an array in a `Proxy` that counts how many of its elements are read.
 *
 * @param {Array} array The array to wrap.
 * @returns {{ proxy: Array, reads: Function }}
 */
function countingArray(array) {
  let reads = 0;
  const proxy = new Proxy(array, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) {
        reads += 1;
      }

      return Reflect.get(target, key, receiver);
    },
  });

  return { proxy, reads: () => reads };
}

describe('sheetRelationships', () => {
  it('should resolve every sheet in one pass over the relationships, not one pass per sheet', () => {
    // A workbook declaring N sheets and N relationships made a per-sheet `find()` cost
    // O(sheets x rels): measured 0.84 s with the index and 4.9-9.7 s with the scan on a 914 kB file.
    // A wall-clock bound would flake, so the element reads are counted instead.
    const rels = Array.from({ length: 10000 }, (_, index) => ({
      id: `rId${index}`, type: 'worksheet', target: `worksheets/sheet${index}.xml`,
    }));
    const entries = Array.from({ length: 2048 }, (_, index) => ({ relId: `rId${9999 - index}` }));
    const { proxy, reads } = countingArray(rels);
    const resolved = sheetRelationships(entries, proxy);

    expect(resolved[0]).toBe(rels[9999]);
    expect(resolved[2047]).toBe(rels[9999 - 2047]);
    // One read per relationship, give or take the iteration protocol: a scan per sheet reads up to
    // 2048 x 10000 elements.
    expect(reads()).toBeLessThan(20000);
  });

  it('should resolve a duplicated id to the first relationship carrying it, and a missing id to nothing', () => {
    const first = { id: 'rId1', type: 'styles', target: 'styles.xml' };
    const second = { id: 'rId1', type: 'worksheet', target: 'worksheets/sheet1.xml' };

    expect(sheetRelationships([{ relId: 'rId1' }, { relId: 'rId9' }], [first, second])).toEqual([first, undefined]);
  });
});

describe('nativeAdapter.read: the sheet relationship lookup', () => {
  it('should resolve the sheets of a whole workbook in one pass over its relationships', async() => {
    // The test above pins the helper; this one pins the reader's own call site, which a per-sheet
    // `find()` over the workbook's relationships would make quadratic again with every answer right.
    const encoder = new TextEncoder();
    const relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const count = MAX_WORKBOOK_SHEETS;
    const sheets = Array.from({ length: count }, (_, i) => `<sheet name="S${i}" sheetId="${i + 1}" r:id="rId${i}"/>`);
    // Listed in reverse, so a scan per sheet would read most of the list for every sheet.
    const rels = Array.from({ length: count }, (_, i) => (
      `<Relationship Id="rId${count - 1 - i}" Type="${relNs}/worksheet" Target="worksheets/sheet1.xml"/>`
    ));
    const bytes = await writeZip([
      {
        name: '_rels/.rels',
        data: encoder.encode('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + `<Relationship Id="rId1" Type="${relNs}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
      },
      {
        name: 'xl/workbook.xml',
        data: encoder.encode(`<workbook xmlns:r="${relNs}"><sheets>${sheets.join('')}</sheets></workbook>`),
      },
      {
        name: 'xl/_rels/workbook.xml.rels',
        data: encoder.encode('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + `${rels.join('')}</Relationships>`),
      },
      { name: 'xl/worksheets/sheet1.xml', data: encoder.encode('<worksheet><sheetData/></worksheet>') },
    ], true);
    const originalParseRels = packageParts.parseRels;
    let counted = null;
    const spy = jest.spyOn(packageParts, 'parseRels').mockImplementation((xml) => {
      const parsed = originalParseRels(xml);

      if (parsed.length !== count) {
        return parsed;
      }

      counted = countingArray(parsed);

      return counted.proxy;
    });

    try {
      const snapshot = await nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());

      expect(snapshot.sheets).toHaveLength(count);
      expect(counted).not.toBeNull();
      // A few linear passes (the index, the styles, shared-strings and VBA lookups); a scan per
      // sheet reads about count x count / 2, some two million elements.
      expect(counted.reads()).toBeLessThan(count * 10);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('parseWorkbook: the relationships namespace scope', () => {
  const relNs = packageParts.R_NS;

  it('should not carry a self-closing element\'s declaration over to the elements after it', () => {
    // A declaration is scoped to the element carrying it. One on a self-closing element replaced
    // the scope and was never undone, so a later sibling's `q:id` was read under it.
    const { sheets } = packageParts.parseWorkbook(`<workbook xmlns:r="${relNs}"><sheets>`
      + `<ext xmlns:q="${relNs}"/><sheet name="A" q:id="rId9" r:id="rId1"/></sheets></workbook>`);

    expect(sheets.map(sheet => sheet.relId)).toEqual(['rId1']);
  });

  it('should read the id under a declaration on the self-closing element itself', () => {
    const { sheets } = packageParts.parseWorkbook('<workbook><sheets>'
      + `<sheet name="A" xmlns:q="${relNs}" q:id="rId2"/></sheets></workbook>`);

    expect(sheets.map(sheet => sheet.relId)).toEqual(['rId2']);
  });

  it('should prefer the innermost declaration, and drop a declaration once its element closes', () => {
    const { sheets } = packageParts.parseWorkbook(`<workbook xmlns:a="${relNs}"><sheets xmlns:b="${relNs}">`
      + '<sheet name="A" a:id="rId1" b:id="rId2"/></sheets>'
      + '<sheets><sheet name="B" a:id="rId3" b:id="rId4"/></sheets></workbook>');

    expect(sheets.map(sheet => sheet.relId)).toEqual(['rId2', 'rId3']);
  });

  it('should keep the scope linear in the number of declarations', () => {
    // Every declaring element copied the whole list of prefixes in scope: 20,000 nested elements
    // reached about 2 GB, and a million self-closing siblings (278 kB deflated) about six minutes.
    // Before the fix this case took tens of seconds; the bound leaves room for a slow runner. The
    // nesting stays under `MAX_XML_NESTING_DEPTH` (review round 12); deeper is refused, below.
    const nested = 250;
    const siblings = 100000;
    const xml = `<workbook xmlns:r="${relNs}">${`<x xmlns:p="${relNs}">`.repeat(nested)}<sheets>`
      + `${`<y xmlns:p="${relNs}"/>`.repeat(siblings)}<sheet name="A" r:id="rId1"/></sheets>`
      + `${'</x>'.repeat(nested)}</workbook>`;
    const start = Date.now();
    const { sheets } = packageParts.parseWorkbook(xml);

    expect(sheets.map(sheet => sheet.relId)).toEqual(['rId1']);
    expect(Date.now() - start).toBeLessThan(3000);
  });

  it('should refuse 20,000 nested declaring elements as a limit, before the scope grows', () => {
    const nested = 20000;
    const xml = `<workbook xmlns:r="${relNs}">${`<x xmlns:p="${relNs}">`.repeat(nested)}<sheets>`
      + `<sheet name="A" r:id="rId1"/></sheets>${'</x>'.repeat(nested)}</workbook>`;

    expect(() => packageParts.parseWorkbook(xml)).toThrow(/nested more than 256 elements deep/);
  });
});
