import Handsontable from 'handsontable';

class MyEditor extends Handsontable.editors.BaseEditor {
  setValue(value) {
    this.input.value = value;
  }
}

export const RatingEditor = Handsontable.editors.editorFactory({
  init(editor) {},
});

// An editor that extends TextEditor stringifies inside setValue(), so it is not reported.
class Upper extends Handsontable.editors.TextEditor {}
