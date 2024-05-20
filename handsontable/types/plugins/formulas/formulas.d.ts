import {
  CellType as HyperFormulaCellType,
  ConfigParams,
  HyperFormula,
  RawCellContent,
  NamedExpressionOptions,
} from 'hyperformula';
import Core from '../../core';
import { CellValue } from '../../common';
import { BasePlugin } from '../base';

type NamedExpressions = {
  name: string;
  expression: RawCellContent;
  scope?: number;
  options?: NamedExpressionOptions;
}

export interface HyperFormulaSettings extends Partial<ConfigParams> {
  hyperformula: typeof HyperFormula | HyperFormula;
}
export interface DetailedSettings {
  engine: typeof HyperFormula | HyperFormula | HyperFormulaSettings;
  sheetName?: string;
  namedExpressions?: NamedExpressions[],
}

export type Settings = DetailedSettings;

export class Formulas extends BasePlugin {
  constructor(hotInstance: Core);

  engine: HyperFormula | null;
  sheetName: string | null;
  get sheetId(): number | null;

  isEnabled(): boolean;
  addSheet(sheetName?: string | null, sheetData?: CellValue[][]): string | boolean;
  switchSheet(sheetName: string): void;
  getCellType(row: number, column: number, sheet?: number): HyperFormulaCellType;
  isFormulaCellType(row: number, column: number, sheet?: number): boolean;
}
