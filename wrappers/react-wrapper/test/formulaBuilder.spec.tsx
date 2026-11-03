import { act } from '@testing-library/react';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilderCore from 'hyperformula-ui';
import { registerAllModules } from 'handsontable/registry';
import {
  createSpreadsheetData,
  renderHotTableWithProps,
} from './_helpers';
import { HotTableProps } from '../src/types';

// register Handsontable's modules
registerAllModules();

describe('HotTable `formulaBuilder`', () => {
  it('should keep the formula bar, its focus and the typed address text on a re-render with unchanged settings', () => {
    const baseSettings = {
      licenseKey: 'non-commercial-and-evaluation',
      id: 'hot',
      data: createSpreadsheetData(5, 5),
      formulas: { engine: HyperFormula },
      language: 'en-US',
      autoRowSize: false,
      autoColumnSize: false,
    };
    const hotTableRef = renderHotTableWithProps({
      ...baseSettings,
      formulaBuilder: { builder: formulaBuilderCore, showFormulaBar: true },
    } as HotTableProps, false);
    const addressBox = document.querySelector<HTMLInputElement>('input[aria-label="Cell address"]')!;

    expect(addressBox).not.toBeNull();

    act(() => {
      addressBox.focus();
      addressBox.value = 'C3';
      addressBox.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(document.activeElement).toBe(addressBox);

    act(() => {
      renderHotTableWithProps({
        ...baseSettings,
        // A new object of equal content, the way an inline JSX literal produces one on every render.
        formulaBuilder: { builder: formulaBuilderCore, showFormulaBar: true },
      } as HotTableProps, false, hotTableRef);
    });

    const addressBoxAfter = document.querySelector<HTMLInputElement>('input[aria-label="Cell address"]');

    expect(addressBoxAfter).toBe(addressBox);
    expect(document.activeElement).toBe(addressBox);
    expect(addressBox.value).toBe('C3');
  });
});
