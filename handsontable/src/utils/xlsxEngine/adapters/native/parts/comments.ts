import { tokenizeXml } from '../xml/tokenizer';
import { XmlWriter, decodeOoxmlEscapes, needsSpacePreserve } from '../xml/writer';
import { MAIN_NS } from './package';

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
 */
export function vmlDrawingXml(comments: SheetComment[]): string {
  const w = new XmlWriter().open('xml', {
    'xmlns:v': 'urn:schemas-microsoft-com:vml',
    'xmlns:o': 'urn:schemas-microsoft-com:office:office',
    'xmlns:x': 'urn:schemas-microsoft-com:office:excel',
  });

  w.open('o:shapelayout', { 'v:ext': 'edit' }).leaf('o:idmap', { 'v:ext': 'edit', data: 1 }).close();
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
      id: `_x0000_s${1025 + index}`,
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
  let parts: string[] = [];
  let inText = false;
  let inPhonetic = false;

  tokenizeXml(xml, {
    open(name, attrs, selfClosing) {
      if (name === 'comment') {
        ref = attrs.ref ?? null;
        parts = [];
      } else if (name === 'rPh') {
        inPhonetic = !selfClosing;
      } else if (name === 't' && ref !== null && !inPhonetic) {
        inText = !selfClosing;
      }
    },
    text(text) {
      if (inText) {
        parts.push(text);
      }
    },
    close(name) {
      if (name === 't') {
        inText = false;
      } else if (name === 'rPh') {
        inPhonetic = false;
      } else if (name === 'comment' && ref !== null) {
        comments.set(ref, decodeOoxmlEscapes(parts.join('')));
        ref = null;
      }
    },
  });

  return comments;
}
