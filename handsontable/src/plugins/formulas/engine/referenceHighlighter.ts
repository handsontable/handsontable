import type { HotInstance } from '../../../core/types';
import type { Formulas } from '../formulas';
import { getRegisteredHotInstances } from './register';
import type { HyperFormulaEngine } from './types';
import {
  parseCellReferenceToken,
  referencesFromFormula,
} from '../utils';

/**
 * A resolved formula reference highlight on a single Handsontable instance.
 */
export type FormulaReferenceHighlight = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  colorIndex: number;
  isActive: boolean;
};

/**
 * Clears formula reference highlights on every instance that shares the engine.
 *
 * @param {HyperFormulaEngine} engine HyperFormula engine instance.
 */
export function clearFormulaReferenceHighlights(engine: HyperFormulaEngine): void {
  getRegisteredHotInstances(engine).forEach((hotInstance) => {
    const formulasPlugin = hotInstance.getPlugin('formulas');

    if (formulasPlugin.isEnabled()) {
      formulasPlugin.clearFormulaReferenceHighlights();
    }
  });
}

/**
 * Updates formula reference grid highlights across all instances sharing the engine.
 *
 * @param {HotInstance} editingHot Handsontable instance with the open editor.
 * @param {string} formula Current formula string.
 * @param {number} caretIndex Caret index inside the formula string.
 */
export function updateFormulaReferenceHighlights(
  editingHot: HotInstance,
  formula: string,
  caretIndex: number,
): void {
  const formulasPlugin = editingHot.getPlugin('formulas');
  const { engine } = formulasPlugin;

  if (engine === null) {
    return;
  }

  const highlightsByHot = resolveFormulaReferenceHighlights(editingHot, formula, caretIndex);
  const registeredInstances = getRegisteredHotInstances(engine);

  for (const hotInstance of registeredInstances.values()) {
    const instanceFormulasPlugin = hotInstance.getPlugin('formulas') as Formulas;

    if (!instanceFormulasPlugin.isEnabled()) {
      continue;
    }

    instanceFormulasPlugin.setFormulaReferenceHighlights(highlightsByHot.get(hotInstance) ?? []);
  }
}

/**
 * Resolves cell/range formula tokens into per-instance highlight descriptors.
 *
 * @param {HotInstance} editingHot Handsontable instance with the open editor.
 * @param {string} formula Current formula string.
 * @param {number} caretIndex Caret index inside the formula string.
 * @returns {Map<HotInstance, FormulaReferenceHighlight[]>}
 */
function resolveFormulaReferenceHighlights(
  editingHot: HotInstance,
  formula: string,
  caretIndex: number,
): Map<HotInstance, FormulaReferenceHighlight[]> {
  const formulasPlugin = editingHot.getPlugin('formulas');
  const { engine, sheetName: editingSheetName } = formulasPlugin;
  const highlightsByHot = new Map<HotInstance, FormulaReferenceHighlight[]>();

  if (engine === null) {
    return highlightsByHot;
  }

  referencesFromFormula(formula).forEach((token) => {
    const text = formula.slice(token.start, token.end);
    const parsedReference = parseCellReferenceToken(text);

    if (parsedReference === null) {
      return;
    }

    const { sheetName: referencedSheetName } = parsedReference;
    let targetHot: HotInstance | null = editingHot;

    if (referencedSheetName !== null && referencedSheetName !== editingSheetName) {
      targetHot = engine.doesSheetExist(referencedSheetName) ?
        getRegisteredHotInstances(engine).get(engine.getSheetId(referencedSheetName)) ?? null :
        null;
    }

    if (targetHot === null) {
      return;
    }

    const targetFormulasPlugin = targetHot.getPlugin('formulas') as Formulas;
    const targetSheetName = referencedSheetName ?? editingSheetName;

    if (targetSheetName === null || !engine.doesSheetExist(targetSheetName)) {
      return;
    }

    const { height, width } = engine.getSheetDimensions(engine.getSheetId(targetSheetName));
    const hfFromRow = parsedReference.fromRow;
    const hfToRow = Number.isFinite(parsedReference.toRow) ? parsedReference.toRow : height - 1;
    const hfFromCol = parsedReference.fromCol;
    const hfToCol = Number.isFinite(parsedReference.toCol) ? parsedReference.toCol : width - 1;
    const visualFromRow = targetFormulasPlugin.rowAxisSyncer!.getVisualIndexFromHfIndex(hfFromRow);
    const visualFromCol = targetFormulasPlugin.columnAxisSyncer!.getVisualIndexFromHfIndex(hfFromCol);
    const visualToRow = targetFormulasPlugin.rowAxisSyncer!.getVisualIndexFromHfIndex(hfToRow);
    const visualToCol = targetFormulasPlugin.columnAxisSyncer!.getVisualIndexFromHfIndex(hfToCol);
    const isActive = caretIndex >= token.start && caretIndex < token.end;
    const highlights = highlightsByHot.get(targetHot) ?? [];

    highlights.push({
      fromRow: visualFromRow,
      fromCol: visualFromCol,
      toRow: visualToRow,
      toCol: visualToCol,
      colorIndex: token.colorIndex,
      isActive,
    });

    highlightsByHot.set(targetHot, highlights);
  });

  return highlightsByHot;
}
