import {
  getCaretPosition,
  setCaretPosition,
} from '../../helpers/dom/element';

/**
 * Updates the textarea caret position depends on the action executed on that element.
 *
 * The following actions are supported:
 *  - 'home': Move the caret to the beginning of the current line;
 *  - 'end': Move the caret to the end of the current line.
 *
 * @param {'home'|'end'} actionName The action to perform that modifies the caret behavior.
 * @param {HTMLTextAreaElement} textareaElement The textarea element where the action is supposed to happen.
 */
export function updateCaretPosition(actionName, textareaElement) {
  const caretPosition = getCaretPosition(textareaElement);
  const textLines = textareaElement.value.split('\n');
  let newCaretPosition = caretPosition;
  let lineStartIndex = 0;

  for (let i = 0; i < textLines.length; i++) {
    const textLine = textLines[i];

    if (i !== 0) {
      lineStartIndex += textLines[i - 1].length + 1;
    }

    const lineEndIndex = lineStartIndex + textLine.length;

    if (actionName === 'home') {
      newCaretPosition = lineStartIndex;

    } else if (actionName === 'end') {
      newCaretPosition = lineEndIndex;
    }

    if (caretPosition <= lineEndIndex) {
      break;
    }
  }

  setCaretPosition(textareaElement, newCaretPosition);
}
