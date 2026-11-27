import type { EditorType, RendererType, ValidatorType, CellType } from 'handsontable';
import type { CommentObject } from 'handsontable/plugins/comments';
import type { ColumnSortingConfig } from 'handsontable/plugins/columnSorting';
import type { ExportFileSettings } from 'handsontable/plugins/exportFile';

import type {
  RowMutationCreatePayload,
  RowMutationPayload,
  RowMutationRemovePayload,
  RowMutationUpdatePayload,
  RowUpdatePayload,
  RowsCreatePayload,
  DataProviderBeforeFetchParameters,
  DataProviderFetchDataOverrides,
  DataProviderConfig,
} from 'handsontable/plugins/dataProvider';

import Handsontable from 'handsontable';

export let editor: EditorType;
export let renderer: RendererType;
export let validator: ValidatorType;
export let cellType: CellType;
export let comment: CommentObject;
export let sorting: ColumnSortingConfig;
export let exported: ExportFileSettings;
export let create: RowMutationCreatePayload;
export let mutation: RowMutationPayload;
export let remove: RowMutationRemovePayload;
export let update: RowMutationUpdatePayload;
export let rowUpdate: RowUpdatePayload;
export let rows: RowsCreatePayload;
export let before: DataProviderBeforeFetchParameters;
export let overrides: DataProviderFetchDataOverrides;
export let config: DataProviderConfig;
