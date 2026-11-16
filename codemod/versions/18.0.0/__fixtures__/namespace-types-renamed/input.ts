import Handsontable from 'handsontable';

export let editor: Handsontable.EditorType;
export let renderer: Handsontable.RendererType;
export let validator: Handsontable.ValidatorType;
export let cellType: Handsontable.CellType;
export let comment: Handsontable.plugins.Comments.CommentObject;
export let sorting: Handsontable.plugins.MultiColumnSorting.Config;
export let exported: Handsontable.plugins.ExportFile.Settings;
export let create: Handsontable.plugins.DataProvider.RowMutationCreatePayload;
export let mutation: Handsontable.plugins.DataProvider.RowMutationPayload;
export let remove: Handsontable.plugins.DataProvider.RowMutationRemovePayload;
export let update: Handsontable.plugins.DataProvider.RowMutationUpdatePayload;
export let rowUpdate: Handsontable.plugins.DataProvider.RowUpdatePayload;
export let rows: Handsontable.plugins.DataProvider.RowsCreatePayload;
export let before: Handsontable.plugins.DataProvider.BeforeFetchParameters;
export let overrides: Handsontable.plugins.DataProvider.FetchDataOverrides;
export let config: Handsontable.plugins.DataProvider.Config;
