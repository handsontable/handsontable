/**
 * Types for validators module
 */

/**
 * Validator function type
 */
export type ValidatorFunction = (value: any, callback: (valid: boolean) => void) => void;

/**
 * Validator with type information
 */
export interface TypedValidator extends Function {
  VALIDATOR_TYPE: string;
}

/**
 * Registry interface for validators
 */
export interface ValidatorRegistry {
  register: (name: string, validator: ValidatorFunction) => void;
  getItem: (name: string) => ValidatorFunction;
  hasItem: (name: string) => boolean;
  getNames: () => string[];
  getValues: () => ValidatorFunction[];
} 