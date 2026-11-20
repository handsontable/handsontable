import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { RangeType, OverlayType } from 'handsontable/common';

registerAllModules();

export type Area = RangeType;

export const overlay: OverlayType = 'master';

export const hot = new Handsontable(document.body, {});
