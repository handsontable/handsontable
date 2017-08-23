import {registerGlobal} from '../formattersController';
import {substitute} from './../../helpers/string';

function substituteFunction(phrases, settings) {
  if (Array.isArray(phrases)) {
    return phrases.map((phrase) => substitute(phrase, settings));
  }

  return substitute(phrases, settings);
};

registerGlobal(substituteFunction);
