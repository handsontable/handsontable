import { updateCaretPosition } from '../caretPositioner';
import { setCaretPosition, getCaretPosition } from '../../../helpers/dom/element';

describe('caretPositioner', () => {
  let textarea;

  beforeEach(() => {
    textarea = document.createElement('textarea');
  });

  afterEach(() => {
    textarea.remove();
  });

  describe('updateCaretPosition()', () => {
    describe('should keep the caret position untouched when "actionName" is unknown', () => {
      it('for non-multiline text', () => {
        textarea.value = 'text text';

        setCaretPosition(textarea, 3);
        updateCaretPosition('unknown', textarea);

        expect(getCaretPosition(textarea)).toBe(3);

        updateCaretPosition(undefined, textarea);

        expect(getCaretPosition(textarea)).toBe(3);
      });
    });

    describe('should keep the caret position untouched when "actionName" is unknown', () => {
      it('for multiline text', () => {
        textarea.value = `
text`;

        setCaretPosition(textarea, 1);
        updateCaretPosition('unknown', textarea);

        expect(getCaretPosition(textarea)).toBe(1);

        updateCaretPosition(undefined, textarea);

        expect(getCaretPosition(textarea)).toBe(1);
      });
    });
  });

  describe('updateCaretPosition("home")', () => {
    describe('should move the caret to the beginning of the text within the same line', () => {
      it('for non-multiline text', () => {
        textarea.value = 'text text';

        setCaretPosition(textarea, textarea.value.length - 1);
        updateCaretPosition('home', textarea);

        expect(getCaretPosition(textarea)).toBe(0);

        setCaretPosition(textarea, Math.ceil(textarea.value.length / 2));
        updateCaretPosition('home', textarea);

        expect(getCaretPosition(textarea)).toBe(0);
      });

      it('for multiline text when the current caret position is placed at the beginning of the second line', () => {
        textarea.value = `
  text
  text`;

        setCaretPosition(textarea, 1);
        updateCaretPosition('home', textarea);

        expect(getCaretPosition(textarea)).toBe(1);
      });

      it('for multiline text when the current caret position is placed in the middle of the second line', () => {
        textarea.value = `
  text
  text`;

        setCaretPosition(textarea, 3);
        updateCaretPosition('home', textarea);

        expect(getCaretPosition(textarea)).toBe(1);
      });

      it('for multiline text when the current caret position is placed at the end of the second line', () => {
        textarea.value = `
  text
  text`;

        setCaretPosition(textarea, 5);
        updateCaretPosition('home', textarea);

        expect(getCaretPosition(textarea)).toBe(1);
      });

      it('for multiline text when the current caret position is placed at the line where there is no text (only an empty line)', () => {
        textarea.value = `

  `;

        setCaretPosition(textarea, 1);
        updateCaretPosition('home', textarea);

        expect(getCaretPosition(textarea)).toBe(1);
      });
    });
  });

  describe('updateCaretPosition("end")', () => {
    describe('should move the caret to the end of the text within the same line', () => {
      it('for non-multiline text', () => {
        textarea.value = 'text text';

        setCaretPosition(textarea, 0);
        updateCaretPosition('end', textarea);

        expect(getCaretPosition(textarea)).toBe(textarea.value.length);

        setCaretPosition(textarea, Math.ceil(textarea.value.length / 2));
        updateCaretPosition('end', textarea);

        expect(getCaretPosition(textarea)).toBe(textarea.value.length);
      });

      it('for multiline text when the current caret position is placed at the beginning of the second line', () => {
        textarea.value = `
text
text`;

        setCaretPosition(textarea, 1);
        updateCaretPosition('end', textarea);

        expect(getCaretPosition(textarea)).toBe(5);
      });

      it('for multiline text when the current caret position is placed in the middle of the second line', () => {
        textarea.value = `
text
text`;

        setCaretPosition(textarea, 3);
        updateCaretPosition('end', textarea);

        expect(getCaretPosition(textarea)).toBe(5);
      });

      it('for multiline text when the current caret position is placed at the end of the second line', () => {
        textarea.value = `
text
text`;

        setCaretPosition(textarea, 5);
        updateCaretPosition('end', textarea);

        expect(getCaretPosition(textarea)).toBe(5);
      });

      it('for multiline text when the current caret position is placed at the line where there is no text (only an empty line)', () => {
        textarea.value = `

`;

        setCaretPosition(textarea, 1);
        updateCaretPosition('end', textarea);

        expect(getCaretPosition(textarea)).toBe(1);
      });
    });
  });
});
