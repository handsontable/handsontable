import { expectType, expectAssignable } from 'tsd';
import Core from '../types/core';
import { ColumnSorting, Settings, Config , DetailedSettings} from '../types/plugins/columnSorting';

// Check Settings type
const settings1: Settings = true;
expectAssignable<boolean | DetailedSettings>(settings1);

const settings2: Settings = {
  initialConfig: { column: 0, sortOrder: 'asc' },
  sortEmptyCells: true,
  indicator: true,
  headerAction: true,
  compareFunctionFactory: (sortOrder, columnMeta) => (value, nextValue) => 0,
};
expectAssignable<boolean | DetailedSettings>(settings2);

// Check ColumnSorting class
const coreInstance = {} as Core;
const columnSorting = new ColumnSorting(coreInstance);

expectType<boolean>(columnSorting.isEnabled());
expectType<void>(columnSorting.sort({ column: 0, sortOrder: 'asc' }));
expectType<void>(columnSorting.sort([{ column: 0, sortOrder: 'asc' }, { column: 1, sortOrder: 'desc' }]));
expectType<void>(columnSorting.clearSort());
expectType<boolean>(columnSorting.isSorted());
expectType<Config | Config[]>(columnSorting.getSortConfig());
expectType<Config | Config[]>(columnSorting.getSortConfig(0));
expectType<void>(columnSorting.setSortConfig());
expectType<void>(columnSorting.setSortConfig({ column: 0, sortOrder: 'asc' }));
expectType<void>(columnSorting.setSortConfig([{ column: 0, sortOrder: 'asc' }, { column: 1, sortOrder: 'desc' }]));