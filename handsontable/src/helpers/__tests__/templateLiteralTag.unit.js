import { toSingleLine, html } from 'handsontable/helpers/templateLiteralTag';

describe('Helpers for template literals', () => {
  describe('toSingleLine', () => {
    it('should strip two line string (string with whitespace in both lines)', () => {
      const text = toSingleLine`Hello world\x20
        Hello world`;

      expect(text).toEqual('Hello world Hello world');
    });

    it('should strip two line string (string with whitespace only in the second line)', () => {
      const text = toSingleLine`Hello world
        Hello world`;

      expect(text).toEqual('Hello worldHello world');
    });

    it('should strip two line string (string without whitespace in both lines)', () => {
      const text = toSingleLine`Hello world
Hello world`;

      expect(text).toEqual('Hello worldHello world');
    });

    it('should include literals and not remove whitespaces between them without necessary', () => {
      const a = 'Hello';
      const b = 'world';
      const text = toSingleLine`${a}   ${b}`;

      expect(text).toEqual('Hello   world');
    });

    it('should remove whitespaces from both sides of a string.', () => {
      const a = '   Hello';
      const b = 'world   ';
      const text = toSingleLine`${a} ${b}`;

      expect(text).toEqual('Hello world');
    });
  });

  describe('html', () => {
    it('should generate DOM fragment ready to inject to the DOM', () => {
      const {
        fragment,
        refs,
      } = html`
<div data-ref="container" id="_test_html_helper" class="_test_html_helper_class" style="border: 1px solid red">
  <p>Counter: </p>
  <span data-ref="counter">1</span>
  <button data-ref="countUp" aria-label="click me">Click me</button>
</div>
`;

      document.body.appendChild(fragment);

      const container = document.querySelector('#_test_html_helper');
      const builtHTML = container.outerHTML
        .replace(/(\r\n|\n|\r)/g, '')
        .replace(/>\s+</g, '><');

      expect(builtHTML).toBe('<div id="_test_html_helper" class="_test_html_helper_class" ' +
                             'style="border: 1px solid red"><p>Counter: </p><span>1</span>' +
                             '<button aria-label="click me">Click me</button></div>');
      expect(refs).toEqual({
        container,
        counter: container.querySelector('span'),
        countUp: container.querySelector('button'),
      });

      container.remove();
    });
  });
});
