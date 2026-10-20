import Handsontable from 'handsontable';
import type { ViewState } from 'handsontable/plugins';
import type {
  GridViewState,
  GridViewStateColumnKey,
  GridViewStateFilterInput,
  GridViewStateInput,
  GridViewStateSortColumnInput,
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

// A column can be named by its property in the sort, the filters, the hidden columns and the widths.
const byProperty: GridViewStateInput = {
  version: 1,
  sort: { columns: [{ column: 'amount', sortOrder: 'desc' }, { column: 2, sortOrder: 'asc' }] },
  filters: [{ column: 'address.city', operation: 'conjunction', conditions: [{ name: 'eq', args: ['x'] }] }],
  hiddenColumns: ['id', 3],
  columnWidths: [['name', 120], [1, 80]],
};

viewStatePlugin.setViewState(byProperty);
viewStatePlugin.validateViewState(byProperty).valid === true;

const key: GridViewStateColumnKey = 'amount';
const sortColumn: GridViewStateSortColumnInput = { column: key, sortOrder: 'asc' };
const filterInput: GridViewStateFilterInput = { column: 0, operation: 'disjunction', conditions: [] };
const inputAlias: Handsontable.plugins.ViewState.Input = { version: 1, hiddenColumns: [sortColumn.column] };
const keyAlias: Handsontable.plugins.ViewState.ColumnKey = filterInput.column;

const sortAlias: Handsontable.plugins.ViewState.SortColumnInput = sortColumn;
const filterAlias: Handsontable.plugins.ViewState.FilterInput = filterInput;

inputAlias.version === 1;
keyAlias === 0;
sortAlias.sortOrder === 'asc';
filterAlias.operation === 'disjunction';

// What getViewState() reports names every column by its physical index.
const reportedHidden: number[] | undefined = viewState.hiddenColumns;
const reportedSort: number | undefined = viewState.sort?.columns[0].column;
// And a reported state can be passed back as it is.
const roundTrip: GridViewStateInput = viewState;

reportedHidden?.length === 0;
reportedSort === 0;
roundTrip.version === 1;

// @ts-expect-error a hidden column is an index or a property
viewStatePlugin.setViewState({ version: 1, hiddenColumns: [true] });
// @ts-expect-error a sort column is an index or a property
viewStatePlugin.setViewState({ version: 1, sort: { columns: [{ column: null, sortOrder: 'asc' }] } });
// @ts-expect-error a column width is keyed by an index or a property
viewStatePlugin.setViewState({ version: 1, columnWidths: [[{}, 80]] });
// @ts-expect-error a filter entry names its column by an index or a property
viewStatePlugin.setViewState({ version: 1, filters: [{ column: false, operation: 'conjunction', conditions: [] }] });
// @ts-expect-error a row is named by its physical index only
viewStatePlugin.setViewState({ version: 1, hiddenRows: ['name'] });
// @ts-expect-error a row height is keyed by its physical row only
viewStatePlugin.setViewState({ version: 1, rowHeights: [['name', 40]] });
// @ts-expect-error the column order is a list of physical indexes only
viewStatePlugin.setViewState({ version: 1, columnOrder: ['id'] });

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
