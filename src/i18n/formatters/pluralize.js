import {registerGlobal as registerGlobalFormatter} from '../formattersController';

function isNumberLike(phrase) {
  // RegExp which will find for example: `0`, `7`, `20`, '1-20'
  const rangeOfNumbers = /^(0|[1-9][0-9]*)(-(0|[1-9][0-9]*))?$/;

  // RegExp which will find for example: `1, 3', `0, 2, 4`
  const numbersListed = /^(0|[1-9][0-9]*)(, (0|[1-9][0-9]*))+$/;

  return rangeOfNumbers.test(phrase) || numbersListed.test(phrase);
};

function defaultPluralizationFunction(pluralDeterminant) {
  if (pluralDeterminant.toString() === '1') {
    return 0;
  }

  return 1;
}

function pluralizeBy(pluralizationFunction) {
  return function pluralize(phrases, settings) {
    const pluralizeByKey = settings.pluralizeByKey;
    const pluralDeterminant = settings[pluralizeByKey];
    const isPluralDeterminantNumberLike = isNumberLike(pluralDeterminant);

    if (Array.isArray(phrases) && isPluralDeterminantNumberLike) {
      return phrases[pluralizationFunction(pluralDeterminant)];
    }

    return phrases;
  };
};

registerGlobalFormatter(pluralizeBy(defaultPluralizationFunction));
