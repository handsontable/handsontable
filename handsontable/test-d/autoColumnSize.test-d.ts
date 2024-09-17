import { expectType, expectAssignable } from 'tsd';
import Core from '../types/core';
import { AutoColumnSize, Settings, DetailedSettings } from '../types/plugins/autoColumnSize';

// Check Settings type
const settings1: Settings = true;
expectAssignable<boolean | DetailedSettings>(settings1);

const settings2: Settings = {
  syncLimit: 10,
  useHeaders: true,
  samplingRatio: 0.5,
  allowSampleDuplicates: false,
};
expectAssignable<boolean | DetailedSettings>(settings2);

// Check AutoColumnSize class
const coreInstance = {} as Core;
const autoColumnSize = new AutoColumnSize(coreInstance);

expectType<boolean>(autoColumnSize.isEnabled());
expectType<void>(autoColumnSize.calculateVisibleColumnsWidth());
expectType<void>(autoColumnSize.calculateColumnsWidth());
expectType<void>(autoColumnSize.calculateColumnsWidth(5));
expectType<void>(autoColumnSize.calculateColumnsWidth({ from: 0, to: 5 }));
expectType<void>(autoColumnSize.calculateColumnsWidth(5, { from: 0, to: 10 }));
expectType<void>(autoColumnSize.calculateColumnsWidth({ from: 0, to: 5 }, { from: 0, to: 10 }, true));
expectType<void>(autoColumnSize.calculateAllColumnsWidth());
expectType<void>(autoColumnSize.calculateAllColumnsWidth({ from: 0, to: 10 }));
expectType<void>(autoColumnSize.recalculateAllColumnsWidth());
expectType<number>(autoColumnSize.getSyncCalculationLimit());
expectType<number>(autoColumnSize.getColumnWidth(0));
expectType<number>(autoColumnSize.getColumnWidth(0, 100));
expectType<number>(autoColumnSize.getColumnWidth(0, 100, true));
expectType<number>(autoColumnSize.getFirstVisibleColumn());
expectType<number>(autoColumnSize.getLastVisibleColumn());
expectType<void>(autoColumnSize.clearCache());
expectType<void>(autoColumnSize.clearCache([0, 1, 2]));
expectType<boolean>(autoColumnSize.isNeedRecalculate());