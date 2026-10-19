import Handsontable from 'handsontable';
import type { ViewState } from 'handsontable/plugins';
import type {
  GridViewState,
  GridViewStateIssue,
  GridViewStateRestoreResult,
  GridViewStateSetOptions,
  GridViewStateValidationResult,
} from 'handsontable/plugins/viewState';

const hot = new Handsontable(document.createElement('div'), {});
const viewStatePlugin: ViewState = hot.getPlugin('viewState');
const viewState: GridViewState = viewStatePlugin.getViewState();

viewState.version === 1;
viewState.sort?.columns[0].sortOrder === 'asc';
viewState.selection?.ranges[0].from[0] === 0;

const result: GridViewStateRestoreResult = viewStatePlugin.setViewState(viewState);
const issue: GridViewStateIssue = result.skipped[0];

result.applied[0] === 'sort';
result.previous?.version === 1;
result.error?.reason === 'atomicRejected';
issue.part === 'sort';
issue.reason === 'invalid';
issue.path === 'filters[0].column';
issue.message === 'text';

viewStatePlugin.setViewState({
  version: 1,
  hiddenColumns: [1],
  frozen: { rowsTop: 1, rowsBottom: 0, columnsStart: 0, columnsEnd: 0 },
});
viewStatePlugin.setViewState({ version: 1, selection: null }).skipped[0].reason === 'outOfRange';

const options: GridViewStateSetOptions = { undo: 'record', atomic: true };

viewStatePlugin.setViewState(viewState, options);
viewStatePlugin.setViewState(viewState, { undo: 'skip' });

const validation: GridViewStateValidationResult = viewStatePlugin.validateViewState(viewState);

validation.valid === true;
validation.applicable[0] === 'sort';
validation.skipped[0].reason === 'invalid';

// The namespace aliases name the same types as the barrel does.
const state: Handsontable.plugins.ViewState.State = viewState;
const partIssue: Handsontable.plugins.ViewState.Issue = issue;
const setOptions: Handsontable.plugins.ViewState.SetOptions = options;

state.version === 1;
partIssue.path === '';
setOptions.atomic === true;

// @ts-expect-error the undo option takes 'record' or 'skip'
viewStatePlugin.setViewState(viewState, { undo: 'yes' });
// An issue about a key that is not a part carries that key as a plain string.
issue.part === 'unknownPart';
