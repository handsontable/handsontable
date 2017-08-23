import {registerGlobal as registerGlobalFormatter} from '../formattersController';
import {substitute} from './../../helpers/string';

function substituteVariables(phrases, settings) {
  if (Array.isArray(phrases)) {
    return phrases.map((phrase) => substitute(phrase, settings));
  }

  return substitute(phrases, settings);
};

registerGlobalFormatter(substituteVariables);
