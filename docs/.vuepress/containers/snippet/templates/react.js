/**
 * Return a new line character repeated the desired amount of times.
 *
 * @param {number} [count=1] The amount of the new lines to be returned.
 * @returns {string}
 */
const getNewLine = (count = 1) => '\n'.repeat(count);

/**
 * Return a default set of imports for the React example.
 *
 * @returns {string}
 */
const getImportSection = () => `\
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
`;

// TODO: Decide if each of the helper functions is supposed to end with `Section`
/**
 * Return the section containing declaration of variables representing the component refs.
 *
 * @param {object} snippetInformation The snippet information object.
 * @returns {string}
 */
const getRefDeclarations = (snippetInformation) => {
  const {
    iterateHotConfigs,
    refExpressions
  } = snippetInformation;
  let refDeclarationsResult = '';

  if (Object.keys(refExpressions).length) {
    refDeclarationsResult += '// HotTable component reference\n';

    iterateHotConfigs((varName) => {
      refDeclarationsResult += `const ${varName}Ref = React.createRef();\n`;
    });
  }

  return refDeclarationsResult;
};

/**
 * Return the section containing the variable and function declarations.
 *
 * @param {object} snippetInformation The snippet information object.
 * @returns {string}
 */
const getDeclarations = (snippetInformation) => {
  const {
    handsontableConfigs,
    varDeclarations,
    callExpressions,
    hasExternalConfig,
    hasHotInit,
    iterateHotConfigs,
  } = snippetInformation;
  let declarationsResult = '';

  declarationsResult += getRefDeclarations(snippetInformation);
  declarationsResult += getNewLine();
  declarationsResult += varDeclarations.join('\n');

  if (!hasExternalConfig && hasHotInit) {
    declarationsResult += getNewLine();

    iterateHotConfigs((varName, config) => {
      declarationsResult += `const ${varName}Settings = ${config};\n`;
    });

    // TODO: Allow multiple HOT instances without instance reference.
    if (handsontableConfigs['[no-var]'].length) {
      declarationsResult += `const hotSettings = ${handsontableConfigs['[no-var]'][0]};\n`;
    }
  }

  declarationsResult += getNewLine(2);
  declarationsResult += callExpressions.join('\n');

  return declarationsResult;
};

/**
 * Return the `useEffects` app section containing the operations executed on the Handsontable instance.
 *
 * @param {object} snippetInformation The snippet information object.
 * @returns {string}
 */
const getUseEffectSection = (snippetInformation) => {
  const {
    refExpressions
  } = snippetInformation;

  const declaredRefs = [];
  let refExpressionsList = [];
  let useEffectPart = `\
  useEffect(() => {
`;

  // TODO: IMPORTANT NOTE: in the vanilla demos the ref expressions should be done AFTER all the other
  //  variable declarations and expressions are done, as they'll be moved to `useEffect` section.

  Object.keys(refExpressions).forEach((varName) => {
    refExpressionsList.push(...refExpressions[varName]);

    // Add the Handsontable instance declaration based on the Ref.
    if (!declaredRefs.includes(varName)) {
      useEffectPart += `\
    const ${varName} = ${varName}Ref.current.hotInstance;
`;
      declaredRefs.push(varName);
    }
  });

  useEffectPart += getNewLine();

  // Sort the ref expressions by the order of appearance.
  refExpressionsList = refExpressionsList.sort((a, b) => {
    if (a.refOrderId < b.refOrderId) {
      return -1;
    }

    if (a.refOrderId > b.refOrderId) {
      return 1;
    }

    return 0;
  }).map(el => el.snippet);

  // Print the ref expressions.
  useEffectPart += `\
    ${refExpressionsList.join(';\n\n    ')}
`;

  useEffectPart += '\n  });';

  return useEffectPart;
};

/**
 * Return the component section.
 *
 * @param {object} snippetInformation The snippet information object.
 * @returns {string}
 */
const getHotComponentSection = (snippetInformation) => {
  const {
    handsontableConfigs,
    hasExternalConfig,
    refExpressions,
    iterateHotConfigs
  } = snippetInformation;
  let hotComponentSectionResult = '';

  iterateHotConfigs((varName) => {
    const refPart = refExpressions[varName]?.length > 0 ? `ref={${varName}Ref} ` : '';

    hotComponentSectionResult += `\
<HotTable ${refPart}settings={${hasExternalConfig ? handsontableConfigs : `${varName}Settings`}}>
</HotTable>
`;
  });

  // TODO: Store the `[no-var]` magic string in a constant.
  // Handsontable initialized without the instance reference.
  if (handsontableConfigs['[no-var]'].length) {
    hotComponentSectionResult += `\
<HotTable settings={${hasExternalConfig ? handsontableConfigs : 'hotSettings'}}>
</HotTable>
`;
  }

  return hotComponentSectionResult;
};

/**
 * Return the component section wrapped with the application logic.
 *
 * @param {object} snippetInformation The snippet information object.
 * @returns {string}
 */
const getAppSection = (snippetInformation) => {
  return `\
const App = () => {${getUseEffectSection(snippetInformation)}
  return (
    <div>
${getHotComponentSection(snippetInformation)}
    </div>
  );
`;
};

/**
 * Return the entire transformed snippet.
 *
 * @param {object} snippetInformation The snippet information object.
 * @param {boolean} [includeImports=false] `true` if the final snippet should include the imports section.
 * @param {boolean} [includeApp=false] `true` if the final snippet should wrap the component with application logic.
 * @returns {string}
 */
function render(snippetInformation, includeImports = false, includeApp = false) {
  let result = '';

  if (includeImports) {
    result += getImportSection();
  }

  result += getDeclarations(snippetInformation);

  if (includeApp) {
    result += getAppSection();

  } else if (snippetInformation.hasHotInit) {

    // If there are expressions based on refs
    if (Object.keys(snippetInformation.refExpressions).length) {
      result += getNewLine(2);
      result += getUseEffectSection(snippetInformation);
      result += getNewLine(2);
    }

    result += getHotComponentSection(snippetInformation);
  }

  return result;
}

module.exports = {
  render
};
