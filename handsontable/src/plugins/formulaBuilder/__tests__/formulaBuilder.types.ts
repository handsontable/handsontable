import Handsontable from 'handsontable';
import type {
  FormulaBuilderLayoutDirection,
  FormulaBuilderPluginSettings,
  FormulaBuilderPopupsOptions,
  FormulaBuilderStepDirection,
  FormulaEditorHandle,
} from 'handsontable/plugins/formulaBuilder';
import type * as HyperFormulaUi from 'hyperformula-ui';

class FakeBuilderModule {}

new Handsontable(document.createElement('div'), {
  formulaBuilder: { builder: FakeBuilderModule, showFormulaBar: true },
});

new Handsontable(document.createElement('div'), {
  formulaBuilder: true,
});

const fullSettings: FormulaBuilderPluginSettings = {
  builder: FakeBuilderModule,
  showFormulaBar: false,
  direction: 'rtl',
  popups: {
    showClose: true,
    suggestions: { showKeyboardHelp: false, showNamedExpressions: true, container: '#host' },
    fnHelp: { showClose: false, container: document.createElement('div') },
    error: { showClose: true },
  },
};

new Handsontable(document.createElement('div'), { formulaBuilder: fullSettings });

// @ts-expect-error - `direction` takes 'ltr' or 'rtl' only.
const wrongDirection: FormulaBuilderPluginSettings = { builder: FakeBuilderModule, direction: 'up' };

// The public types mirror `hyperformula-ui` so that no published declaration names the package
// (see `types.ts`). Assigning in BOTH directions fails here when the package changes a shape.
declare const packagePopups: HyperFormulaUi.PopupsOptions;
declare const publicPopups: FormulaBuilderPopupsOptions;
const popupsFromPackage: FormulaBuilderPopupsOptions = packagePopups;
const popupsFromPublic: HyperFormulaUi.PopupsOptions = publicPopups;

// Assignability alone cannot see an optional key added to or dropped from one side, so the key
// sets are compared too, one level down as well.
type SameKeys<A, B> = [Exclude<keyof A, keyof B>, Exclude<keyof B, keyof A>] extends [never, never] ?
  true : false;
type PackagePopups = HyperFormulaUi.PopupsOptions;
type PublicPopups = FormulaBuilderPopupsOptions;
const popupKeys: [
  SameKeys<PackagePopups, PublicPopups>,
  SameKeys<NonNullable<PackagePopups['suggestions']>, NonNullable<PublicPopups['suggestions']>>,
  SameKeys<NonNullable<PackagePopups['fnHelp']>, NonNullable<PublicPopups['fnHelp']>>,
  SameKeys<NonNullable<PackagePopups['error']>, NonNullable<PublicPopups['error']>>,
] = [true, true, true, true];

declare const packageLayoutDirection: HyperFormulaUi.LayoutDirection;
declare const publicLayoutDirection: FormulaBuilderLayoutDirection;
const layoutDirectionFromPackage: FormulaBuilderLayoutDirection = packageLayoutDirection;
const layoutDirectionFromPublic: HyperFormulaUi.LayoutDirection = publicLayoutDirection;

declare const packageStepDirection: HyperFormulaUi.Direction;
declare const publicStepDirection: FormulaBuilderStepDirection;
const stepDirectionFromPackage: FormulaBuilderStepDirection = packageStepDirection;
const stepDirectionFromPublic: HyperFormulaUi.Direction = publicStepDirection;

// The plugin hands out the package's editor as the narrower public handle.
declare const packageEditor: HyperFormulaUi.FormulaEditor;
const editorHandle: FormulaEditorHandle = packageEditor;

const plugin = new Handsontable(document.createElement('div'), {}).getPlugin('formulaBuilder');
const activeEditor: FormulaEditorHandle | null = plugin.getActiveEditor();
const rawText: string = plugin.getRawCellText(0, 0);

plugin.commitInlineEdit('=A1', 'down');
plugin.attachSuggestionsHost('#host');
plugin.attachFnHelpHost(document.createElement('div'));

export {
  wrongDirection,
  popupsFromPackage,
  popupsFromPublic,
  popupKeys,
  layoutDirectionFromPackage,
  layoutDirectionFromPublic,
  stepDirectionFromPackage,
  stepDirectionFromPublic,
  editorHandle,
  activeEditor,
  rawText,
};
