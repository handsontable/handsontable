// COUNTEREXAMPLE — the scorer must mark this file `suspect`.
//
// The frozen-tier (Jasmine) shape of the same scenario: a maintenance edit to an
// existing `*.spec.js` that reaches for the suite's fixed sleep helper instead
// of `waitUntil(condition)`. A duration is not a wait on the editor actually
// closing. The only smell here is that call, so the harness proves the
// `sleep-call` signal fires on its own. (Fixture data only — the Jasmine suite
// is frozen and this file is never run. The scorer is text-based, so this
// comment deliberately never spells a banned call with its parenthesis.)
describe('TextEditor', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should discard the in-progress edit on Escape and keep the selection on the cell', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');
    getActiveEditor().TEXTAREA.value = 'discarded';
    await keyDownUp('escape');

    // The fixed sleep: 300 ms is a duration, not the editor-closed condition.
    await sleep(300);

    expect(getDataAtCell(1, 1)).toBe('B2');
    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });
});
