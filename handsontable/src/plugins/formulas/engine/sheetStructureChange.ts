import { warn } from '../../../helpers/console';
import { quoteUnreadableSheetNames } from '../../../utils/formulaReferences';
import type { FormulasCellAddress, FormulasCellRange, HyperFormulaEngine, HyperFormulaClass } from './types';

/**
 * The first HyperFormula version that recalculates references to a sheet added or removed later.
 */
const SHEET_REFERENCES_RECALCULATED_SINCE = [3, 1, 1];

/**
 * The functions whose result depends on the list of sheets. HyperFormula does not recalculate them
 * when a sheet is added or removed.
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
 * Checks whether every cell a formula reads is on a sheet the engine still holds. HyperFormula throws
 * when it is handed a formula that reads a removed sheet, and such a cell already reads `#REF!`. A named
 * expression is reported with a negative sheet, and it is not a sheet the formula reads.
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
 * Finds the formula cells that call `SHEET` or `SHEETS`, with formula text the engine can parse again.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} engine The engine instance.
 * @returns {Array}
 */
function findSheetListFormulas(engineClass: HyperFormulaClass, engine: HyperFormulaEngine) {
  const pattern = createFunctionCallPattern(getSheetListFunctionNames(engineClass, engine));
  const readableNames = new Map<string, boolean>();
  const canReadUnquoted = (name: string) => {
    if (!readableNames.has(name)) {
      readableNames.set(name, engine.validateFormula(`=${name}!A1`) !== false);
    }

    return readableNames.get(name)!;
  };
  const cells: { address: FormulasCellAddress; formula: string }[] = [];

  engine.getSheetNames().forEach((sheetName) => {
    const sheet = engine.getSheetId(sheetName);

    engine.getSheetFormulas(sheet).forEach((rowFormulas, row) => {
      rowFormulas.forEach((formula, col) => {
        const address = { sheet, row, col };

        if (formula !== undefined && pattern.test(formula) && readsExistingSheetsOnly(engine, address)) {
          cells.push({ address, formula: quoteUnreadableSheetNames(formula, canReadUnquoted) });
        }
      });
    });
  });

  return cells;
}

/**
 * Writes every formula that calls `SHEET` or `SHEETS` into the engine again, so that it is
 * recalculated against the current list of sheets. A sheet name the engine reads only in quotes is
 * quoted, and a formula that reads a removed sheet is skipped, because it reads `#REF!` either way.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} engine The engine instance.
 */
export function recalculateSheetListFormulas(engineClass: HyperFormulaClass, engine: HyperFormulaEngine) {
  try {
    const cells = findSheetListFormulas(engineClass, engine);

    if (cells.length === 0) {
      return;
    }

    const write = () => {
      cells.forEach(({ address, formula }) => engine.setCellContents(address, formula));
    };

    // `batch()` resumes the evaluation when it ends, so it must not run inside the host's own batch.
    if (engine.isEvaluationSuspended()) {
      write();
    } else {
      engine.batch(write);
    }

  } catch (error) {
    // A throw here would stop the engine's sheet event before the grids' own listeners run.
    warn(error instanceof Error ? error.message : String(error));
  }
}
