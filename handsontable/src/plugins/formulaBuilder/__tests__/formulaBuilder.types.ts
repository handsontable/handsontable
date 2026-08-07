import Handsontable from 'handsontable';

class FakeBuilderModule {}

new Handsontable(document.createElement('div'), {
  formulaBuilder: { builder: FakeBuilderModule, showFormulaBar: true },
});

new Handsontable(document.createElement('div'), {
  formulaBuilder: true,
});
