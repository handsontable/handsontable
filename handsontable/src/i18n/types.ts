/**
 * Shared interfaces for the i18n module
 */

/**
 * Dictionary interface for language entries
 */
export interface Dictionary {
  languageCode: string;
  [key: string]: string | string[];
}

/**
 * Formatter function interface for phrase formatting
 */
export type PhraseFormatterFn = (phrasePropositions: string | string[], args?: any) => string | string[];

/**
 * Variables and values for string substitution
 */
export interface VariablesAndValues {
  [variable: string]: string | number;
} 