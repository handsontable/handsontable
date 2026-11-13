import { warn } from '../../../helpers/console';
import {
  canReadSheetNameUnquoted,
  quoteUnreadableSheetNames,
  rewriteSheetReferences,
} from '../../../utils/formulaReferences';
import { isEvaluationHeld } from './evaluationHold';
import type { FormulasCellAddress, FormulasCellRange, HyperFormulaEngine, HyperFormulaClass } from './types';

/**
 * The first HyperFormula version that recalculates references to a sheet added or removed later.
 */
const SHEET_REFERENCES_RECALCULATED_SINCE = [3, 1, 1];

/**
 * The functions whose result depends on the list of sheets. HyperFormula does not recalculate them
 * when a sheet is added, removed, or renamed.
 */
const SHEET_LIST_FUNCTIONS = ['SHEET', 'SHEETS'];

/**
 * Checks whether a HyperFormula version recalculates references to a sheet that is added or removed
 * after the formula was written. An unknown or unreadable version answers `false`, and so does a
 * prerelease of the first fixed version.
 *
 * @param {unknown} version The `version` static of the engine class.
 * @returns {boolean}
 */
export function recalculatesSheetReferences(version: unknown): boolean {
  const match = typeof version === 'string' ? /^(\d+)\.(\d+)\.(\d+)(-)?/.exec(version) : null;

  if (match === null) {
    return false;
  }

  for (let i = 0; i < SHEET_REFERENCES_RECALCULATED_SINCE.length; i++) {
    const part = Number(match[i + 1]);

    if (part !== SHEET_REFERENCES_RECALCULATED_SINCE[i]) {
      return part > SHEET_REFERENCES_RECALCULATED_SINCE[i];
    }
  }

  return match[4] === undefined;
}

/**
 * Returns the names the engine writes for the sheet list functions. HyperFormula writes the English
 * name of a function its language does not translate, so each such name falls back to it.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} engine The engine instance.
 * @returns {string[]}
 */
function getSheetListFunctionNames(engineClass: HyperFormulaClass, engine: HyperFormulaEngine): string[] {
  const languageCode = engine.getConfig().language;
  const names = new Set(SHEET_LIST_FUNCTIONS);

  if (typeof languageCode === 'string' && typeof engineClass.getLanguage === 'function') {
    SHEET_LIST_FUNCTIONS.forEach((functionId) => {
      const [translation] = engineClass.getLanguage!(languageCode).getFunctionTranslations([functionId]);

      if (translation) {
        names.delete(functionId);
        names.add(translation);
      }
    });
  }

  return Array.from(names);
}

/**
 * Builds a pattern that finds a call to one of the functions in a formula text.
 *
 * @param {string[]} functionNames The function names.
 * @returns {RegExp}
 */
function createFunctionCallPattern(functionNames: string[]): RegExp {
  const names = functionNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  return new RegExp(`(^|[^\\p{L}\\p{N}_.])(${names.join('|')})\\s*\\(`, 'iu');
}

/**
 * Checks whether every cell a formula reads is on a sheet the engine holds. HyperFormula throws when
 * it is handed again a formula that reads a missing sheet. A named expression is reported with a
 * negative sheet, and it is not a sheet the formula reads.
 *
 * @param {object} engine The engine instance.
 * @param {object} address The formula cell.
 * @returns {boolean}
 */
function readsExistingSheetsOnly(engine: HyperFormulaEngine, address: FormulasCellAddress): boolean {
  return engine.getCellPrecedents(address).every((precedent) => {
    const { sheet } = (precedent as FormulasCellRange).start ?? precedent as FormulasCellAddress;

    return sheet < 0 || engine.getSheetName(sheet) !== undefined;
  });
}

/**
 * Checks whether every sheet a formula text names exists in the engine. The engine lists no
 * precedents for a named expression, so its text is read instead.
 *
 * @param {object} engine The engine instance.
 * @param {string} formula The formula text.
 * @returns {boolean}
 */
function namesExistingSheetsOnly(engine: HyperFormulaEngine, formula: string): boolean {
  let allExist = true;

  rewriteSheetReferences(formula, (reference) => {
    allExist = allExist && engine.doesSheetExist(reference.name);

    return null;
  });

  return allExist;
}

/**
 * Finds the formula cells and the named expressions that call `SHEET` or `SHEETS`, and returns a write
 * for each that sets it to its own formula again, with sheet names quoted where the engine needs it.
 * A formula that reads a missing sheet is left out, because the engine throws when it is written.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} engine The engine instance.
 * @returns {Function[]}
 */
function findSheetListFormulaWrites(engineClass: HyperFormulaClass, engine: HyperFormulaEngine): (() => void)[] {
  const pattern = createFunctionCallPattern(getSheetListFunctionNames(engineClass, engine));
  const readableNames = new Map<string, boolean>();
  const quote = (formula: string) => quoteUnreadableSheetNames(formula, (name) => {
    if (!readableNames.has(name)) {
      readableNames.set(name, canReadSheetNameUnquoted(engine, name));
    }

    return readableNames.get(name)!;
  });
  const writes: (() => void)[] = [];
  const sheets = engine.getSheetNames().map(sheetName => engine.getSheetId(sheetName));

  sheets.forEach((sheet) => {
    engine.getSheetFormulas(sheet).forEach((rowFormulas, row) => {
      rowFormulas.forEach((formula, col) => {
        const address = { sheet, row, col };

        if (formula !== undefined && pattern.test(formula) && readsExistingSheetsOnly(engine, address)) {
          writes.push(() => engine.setCellContents(address, quote(formula)));
        }
      });
    });
  });

  [undefined, ...sheets].forEach((scope) => {
    engine.listNamedExpressions(scope).forEach((name) => {
      const formula = engine.getNamedExpressionFormula(name, scope);

      if (formula !== undefined && pattern.test(formula) && namesExistingSheetsOnly(engine, formula)) {
        const options = engine.getNamedExpression(name, scope)?.options;

        writes.push(() => engine.changeNamedExpression(name, quote(formula), scope, options));
      }
    });
  });

  return writes;
}

/**
 * Writes every formula and named expression that calls `SHEET` or `SHEETS` into the engine again, so
 * that it is recalculated against the current list of sheets.
 *
 * The writes run with the evaluation suspended, and the engine's own undo stack is cleared before it
 * resumes, as the rebuild this replaces did, so an `engine.undo()` right after a sheet change does not
 * land on these writes. Inside a batch the host started, the writes join that batch and nothing is
 * cleared. Inside a suspension a grid holds (`formulas.batchEvaluation`), the writes join it and the stack
 * is cleared at once. Only a failing read or write is caught: the `valuesUpdated` emit that the resume makes
 * runs outside it, so an error from a hook listening to it reaches the caller.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} engine The engine instance.
 */
export function recalculateSheetListFormulas(engineClass: HyperFormulaClass, engine: HyperFormulaEngine) {
  const reportFailure = (error: unknown) => {
    warn(`Formulas: the SHEET and SHEETS formulas were not recalculated after a sheet change: ${
      error instanceof Error ? error.message : String(error)}`);
  };
  let writes: (() => void)[];

  try {
    writes = findSheetListFormulaWrites(engineClass, engine);

  } catch (error) {
    reportFailure(error);

    return;
  }

  if (writes.length === 0) {
    return;
  }

  const ownSuspension = !engine.isEvaluationSuspended();
  // A suspension a grid holds (`formulas.batchEvaluation`) is resumed only when the grid releases it, and an
  // `engine.undo()` after that would land on these writes, so the stack is cleared now, without resuming.
  const heldSuspension = isEvaluationHeld(engine);

  if (ownSuspension) {
    engine.suspendEvaluation();
  }

  try {
    writes.forEach(write => write());

  } catch (error) {
    reportFailure(error);

  } finally {
    if (ownSuspension || heldSuspension) {
      engine.clearUndoStack();
    }

    if (ownSuspension) {
      engine.resumeEvaluation();
    }
  }
}
