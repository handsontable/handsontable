import { copyPassiveContent, visibleText } from '../ui/switchAnimation/passiveContent';

/**
 * Creates a detached cell with the given markup.
 *
 * @param {string} html The cell's markup.
 * @returns {HTMLTableCellElement}
 */
function cellWith(html) {
  const cell = document.createElement('td');

  cell.innerHTML = html;

  return cell;
}

/**
 * Copies a cell's content with no source styles.
 *
 * @param {HTMLElement} cell The cell.
 * @returns {DocumentFragment|null}
 */
function copy(cell) {
  return copyPassiveContent(cell, () => '');
}

describe('SheetsBar switch animation – passive content', () => {
  describe('copyPassiveContent', () => {
    it('copies text, formatting elements, and passive SVG shapes', () => {
      const cell = cellWith('A <b>bold</b><br><a href="https://example.com/">link</a>'
        + '<svg viewBox="0 0 10 10"><path d="M0 0L10 10" fill="red"></path></svg>');
      const fragment = copy(cell);

      expect(fragment.textContent).toBe('A boldlink');
      expect(fragment.querySelector('b').textContent).toBe('bold');
      expect(fragment.querySelector('br')).not.toBeNull();
      expect(fragment.querySelector('a').hasAttribute('href')).toBe(false);
      expect(fragment.querySelector('svg').getAttribute('viewBox')).toBe('0 0 10 10');
      expect(fragment.querySelector('path').namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(fragment.querySelector('path').getAttribute('d')).toBe('M0 0L10 10');
    });

    it.each([
      ['an SVG script', '<svg><script>window.ran = 1;</script></svg>'],
      ['an HTML script', '<span>A</span><script>window.ran = 1;</script>'],
      ['a style element', '<style>td { color: red; }</style>A'],
      ['a link element', '<link rel="stylesheet" href="x.css">A'],
      ['an iframe', '<iframe src="about:blank"></iframe>'],
      ['an object', '<object data="x.swf"></object>'],
      ['an embed', '<embed src="x.swf">'],
      ['a video', '<video src="x.mp4"></video>'],
      ['an audio element', '<audio src="x.mp3"></audio>'],
      ['a template', '<template><b>A</b></template>'],
      ['a custom element', '<x-widget>A</x-widget>'],
      ['a form', '<form><span>A</span></form>'],
      ['a text input', '<input type="text" value="A">'],
      ['a select', '<select><option>A</option></select>'],
      ['an SVG foreignObject', '<svg><foreignObject><span>A</span></foreignObject></svg>'],
      ['an SVG animation', '<svg><rect><animate attributeName="x" to="10"></animate></rect></svg>'],
      ['an SVG set', '<svg><rect><set attributeName="x" to="10"></set></rect></svg>'],
      ['an SVG use', '<svg><use href="sprite.svg#icon"></use></svg>'],
      ['an SVG link', '<svg><a href="https://example.com/"><text>A</text></a></svg>'],
    ])('copies nothing from a cell holding %s', (_, html) => {
      expect(copy(cellWith(html))).toBeNull();
    });

    it('keeps only the styling attributes of an element', () => {
      const fragment = copy(cellWith('<span id="a" class="c" style="color: red" title="t" data-x="1" '
        + 'onclick="x()" dir="rtl" lang="pl" aria-hidden="true" tabindex="0" role="button">A</span>'));
      const span = fragment.querySelector('span');

      expect(Array.from(span.attributes, ({ name }) => name).sort())
        .toEqual(['aria-hidden', 'class', 'dir', 'lang', 'style']);
    });

    it('drops an attribute that references a resource outside the document', () => {
      const fragment = copy(cellWith('<span style="background: url(x.png)">A</span>'
        + '<svg><rect fill="url(#gradient)" stroke="url(&quot;x.svg#paint&quot;)"></rect></svg>'));

      expect(fragment.querySelector('span').hasAttribute('style')).toBe(false);
      expect(fragment.querySelector('rect').getAttribute('fill')).toBe('url(#gradient)');
      expect(fragment.querySelector('rect').hasAttribute('stroke')).toBe(false);
    });

    it('copies a checkbox and a radio button as disabled controls with no name, form, or id', () => {
      const cell = cellWith('<label><input type="checkbox" name="agree" form="f" id="c" checked>A</label>'
        + '<input type="radio" name="group" value="1">');

      cell.querySelector('[type="radio"]').checked = true;

      const fragment = copy(cell);
      const checkbox = fragment.querySelector('[type="checkbox"]');
      const radio = fragment.querySelector('[type="radio"]');

      expect(checkbox.checked).toBe(true);
      expect(checkbox.disabled).toBe(true);
      expect(radio.checked).toBe(true);
      expect(radio.disabled).toBe(true);
      [checkbox, radio].forEach((input) => {
        expect(input.hasAttribute('name')).toBe(false);
        expect(input.hasAttribute('form')).toBe(false);
        expect(input.hasAttribute('id')).toBe(false);
        expect(input.hasAttribute('value')).toBe(false);
      });
      expect(cell.querySelector('[type="radio"]').checked).toBe(true);
    });

    it('copies a button as one that never submits a form', () => {
      const fragment = copy(cellWith('<button class="changeType" name="b">A</button>'));

      expect(fragment.querySelector('button').getAttribute('type')).toBe('button');
      expect(fragment.querySelector('button').hasAttribute('name')).toBe(false);
    });

    it('copies an image as an empty box of its size, which loads nothing', () => {
      const cell = cellWith('A<img src="x.png" class="icon" width="16" height="12" alt="">');
      const fragment = copy(cell);
      const box = fragment.querySelector('.icon');

      expect(fragment.querySelector('img')).toBeNull();
      expect(box.localName).toBe('span');
      expect(box.hasAttribute('src')).toBe(false);
      expect(box.style.display).toBe('inline-block');
      expect(box.style.width).toBe('16px');
      expect(box.style.height).toBe('12px');
    });

    it('writes the source styles onto every copied HTML element and the SVG root', () => {
      const styleOf = jest.fn(source => `color: ${source.localName === 'b' ? 'red' : 'blue'};`);
      const fragment = copyPassiveContent(cellWith('<span><b>A</b></span><svg><rect></rect></svg>'), styleOf);

      expect(fragment.querySelector('b').style.color).toBe('red');
      expect(fragment.querySelector('span').style.color).toBe('blue');
      expect(fragment.querySelector('svg').style.color).toBe('blue');
      expect(styleOf.mock.calls.map(([source]) => source.localName)).toEqual(['span', 'b', 'svg']);
    });

    it('leaves comments out', () => {
      const fragment = copy(cellWith('<span>A</span><!-- note -->'));

      expect(fragment.childNodes).toHaveLength(1);
    });
  });

  describe('visibleText', () => {
    it('joins the text of every node a reader sees', () => {
      expect(visibleText(cellWith('A <b>B</b><svg><text>C</text><title>tip</title></svg>'
        + '<script>s</script><style>t</style><template>u</template>'))).toBe('A BC');
    });
  });
});
