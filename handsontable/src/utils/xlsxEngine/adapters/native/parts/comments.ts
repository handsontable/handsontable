import { needsSpacePreserve } from '../xml/escapes';
import { collectRichTextRuns } from '../xml/richText';
import { tokenizeXml } from '../xml/tokenizer';
import { XmlWriter } from '../xml/writer';
import { MAIN_NS } from './package';

/**
 * How many shape ids one VML drawing block holds. A drawing declares the blocks it uses in
 * `<o:idmap data>`, and its shapes are numbered from `1024 * block + 1` upwards, so every drawing
 * of the workbook needs blocks of its own: two notes sharing a shape id across sheets is the usual
 * trigger of Excel's "repaired drawing" prompt. Excel and XlsxWriter allocate them the same way.
 */
const VML_BLOCK_SIZE = 1024;

/**
 * How many VML id blocks a drawing holding `noteCount` notes claims: one, plus one more for every
 * 1024 notes, because the ids run from `1024 * first + 1` upwards and spill into the next block.
 *
 * @param {number} noteCount The number of notes in the drawing.
 * @returns {number}
 */
export function vmlBlockCount(noteCount: number): number {
  return Math.floor(noteCount / VML_BLOCK_SIZE) + 1;
}

/**
 * One cell note. `row` and `col` are 0-based; `ref` is the A1 address the same cell has.
 */
export interface SheetComment {
  ref: string;
  row: number;
  col: number;
  text: string;
}

/**
 * Serializes `xl/comments{N}.xml`. Every note is attributed to one author.
 */
export function commentsXml(comments: SheetComment[], author: string): string {
  const w = new XmlWriter().open('comments', { xmlns: MAIN_NS });

  w.open('authors').leaf('author', undefined, author).close();
  w.open('commentList');
  comments.forEach((comment) => {
    w.open('comment', { ref: comment.ref, authorId: 0 }).open('text').open('r')
      .leaf('t', needsSpacePreserve(comment.text) ? { 'xml:space': 'preserve' } : undefined, comment.text)
      .close().close().close();
  });
  w.close();

  return w.close().toString();
}

/**
 * Serializes `xl/drawings/vmlDrawing{N}.vml`, the legacy drawing Excel needs to show a note.
 * Without it the comment data is in the file and nothing appears on the cell. LibreOffice and
 * Google Sheets read `comments{N}.xml` alone.
 *
 * `firstBlock` is the first VML id block this drawing owns, which the caller allocates across the
 * WHOLE workbook (see `vmlBlockCount`); the drawing claims `vmlBlockCount(comments.length)` blocks
 * from there and numbers its shapes from `1024 * firstBlock + 1`.
 *
 * @param {SheetComment[]} comments The sheet's notes.
 * @param {number} firstBlock The first id block this drawing owns, 1 or more.
 * @returns {string}
 */
export function vmlDrawingXml(comments: SheetComment[], firstBlock: number): string {
  const w = new XmlWriter().open('xml', {
    'xmlns:v': 'urn:schemas-microsoft-com:vml',
    'xmlns:o': 'urn:schemas-microsoft-com:office:office',
    'xmlns:x': 'urn:schemas-microsoft-com:office:excel',
  });

  const blocks = Array.from({ length: vmlBlockCount(comments.length) }, (_unused, index) => firstBlock + index);
  const firstShapeId = (VML_BLOCK_SIZE * firstBlock) + 1;

  w.open('o:shapelayout', { 'v:ext': 'edit' }).leaf('o:idmap', { 'v:ext': 'edit', data: blocks.join(',') }).close();
  w.open('v:shapetype', {
    id: '_x0000_t202', coordsize: '21600,21600', 'o:spt': 202, path: 'm,l,21600r21600,l21600,xe',
  })
    .leaf('v:stroke', { joinstyle: 'miter' })
    .leaf('v:path', { gradientshapeok: 't', 'o:connecttype': 'rect' })
    .close();

  comments.forEach((comment, index) => {
    // The anchor rectangle: two columns to the right of the cell, starting one row above it.
    const left = comment.col + 1;
    const top = Math.max(comment.row - 1, 0);
    const anchor = [left, 6, top, 14, left + 2, 2, top + 4, 16].join(', ');

    w.open('v:shape', {
      id: `_x0000_s${firstShapeId + index}`,
      type: '#_x0000_t202',
      style: 'position:absolute;margin-left:105.3pt;margin-top:10.5pt;'
        + 'width:97.8pt;height:59.1pt;z-index:1;visibility:hidden',
      fillcolor: 'infoBackground [80]',
      strokecolor: 'none [81]',
      'o:insetmode': 'auto',
    });
    w.leaf('v:fill', { color2: 'infoBackground [80]' });
    w.leaf('v:shadow', { color: 'none [81]', obscured: 't' });
    w.leaf('v:path', { 'o:connecttype': 'none' });
    w.open('v:textbox', { style: 'mso-direction-alt:auto', inset: '1.3mm,1.3mm,2.5mm,2.5mm' })
      .leaf('div', { style: 'text-align:left' }).close();
    w.open('x:ClientData', { ObjectType: 'Note' })
      .leaf('x:MoveWithCells')
      .leaf('x:SizeWithCells')
      .leaf('x:Anchor', undefined, anchor)
      .leaf('x:AutoFill', undefined, 'False')
      .leaf('x:Row', undefined, String(comment.row))
      .leaf('x:Column', undefined, String(comment.col))
      .close();
    w.close();
  });

  return w.close().toString();
}

/**
 * Parses `xl/comments{N}.xml` into a `ref → text` map. Runs are joined; phonetic runs skipped.
 */
export function parseComments(xml: string): Map<string, string> {
  const comments = new Map<string, string>();
  let ref: string | null = null;

  tokenizeXml(xml, collectRichTextRuns('comment', (attrs) => {
    ref = attrs.ref ?? null;
  }, (text) => {
    if (ref !== null) {
      comments.set(ref, text);
    }

    ref = null;
  }));

  return comments;
}
