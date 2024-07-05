/**
 * @class ViewportBaseCalculator
 */
export class ViewportBaseCalculator {
  #calculationTypes = [];

  constructor(calculationTypes) {
    this.#calculationTypes = calculationTypes;
  }

  _initialize(context) {
    this.#calculationTypes.forEach(calculator => calculator.initialize(context));
  }

  _process(index, context) {
    this.#calculationTypes.forEach(calculator => calculator.process(index, context));
  }

  _finalize(context) {
    this.#calculationTypes.forEach(calculator => calculator.finalize(context));
  }

  getResultsFor(calculatorId) {
    return this.#calculationTypes.get(calculatorId);
  }
}
