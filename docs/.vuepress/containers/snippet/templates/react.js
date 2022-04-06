const {
  indentLines
} = require('./helpers');

/**
 * Return a default set of imports for the React example.
 *
 * @returns {string}
 */
function getImportsSection(includeImports) {
  return includeImports ? `\
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

` : '';
}

/**
 * Get the initial expressions section.
 *
 * @param {CategorizedData} snippetInformation A CategorizedData instance containing information about the snippet.
 * @returns {string}
 */
function getInitialExpressionsSection(snippetInformation) {
  let refDeclarations = '';

  snippetInformation.getNamedHotInstances().forEach((info, varName) => {
    if (info.hasRef) {
      refDeclarations += `const ${varName}Ref = React.createRef();\n`;
    }
  });

  return `${refDeclarations}${snippetInformation.getInitialExpressions().join('\n')}`;
}

/**
 * Get the `<HotTable>` component section.
 *
 * @param {CategorizedData} snippetInformation A CategorizedData instance containing information about the snippet.
 * @returns {string}
 */
function getHotComponentSection(snippetInformation) {
  let result = '';

  snippetInformation.getNamedHotInstances().forEach((info, varName) => {
    result += `\
<HotTable ${info.hasRef ? `ref={${varName}Ref} ` : ''}settings={${info.config}}>
</HotTable>
`;
  });

  snippetInformation.getUnnamedHotInstances().forEach((info) => {
    result += `\
<HotTable settings={${info.config}}>
</HotTable>
`;
  });

  return result;
}

/**
 * Get the `useEffect` section.
 *
 * @param {CategorizedData} snippetInformation A CategorizedData instance containing information about the snippet.
 * @returns {string}
 */
function getUseEffectSection(snippetInformation) {
  let refDeclarations = '';

  snippetInformation.getNamedHotInstances().forEach((info, varName) => {
    if (info.hasRef) {
      refDeclarations += `const ${varName} = ${varName}Ref.current.hotInstance;\n\n`;
    }
  });

  return snippetInformation.countExpressions('ref') ? `\
useEffect(() => {
${indentLines(`${refDeclarations}${snippetInformation.getRefExpressions().join('\n')}`, 1)}
});` : '';
}

/**
 * Get the application defining section.
 *
 * @param {CategorizedData} snippetInformation A CategorizedData instance containing information about the snippet.
 * @param {string} appContainerId The id of the element being used as the application DOM container.
 * @returns {string}
 */
function getAppSection(snippetInformation, appContainerId = 'example') {
  return `\

const App = () => {
${indentLines(getUseEffectSection(snippetInformation), 1)}

  return (
    <div>
${indentLines(getHotComponentSection(snippetInformation), 3)}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('${appContainerId}'));
`;
}

/**
 * Return the entire transformed snippet.
 *
 * @param {CategorizedData} snippetInformation The snippet information object.
 * @param {boolean} [includeImports=false] `true` if the final snippet should include the imports section.
 * @param {boolean} [includeApp=false] `true` if the final snippet should wrap the component with application logic.
 * @param {string} [appContainerId] The id of the element being used as the application DOM container.
 * @returns {string}
 */
function render(snippetInformation, includeImports = false, includeApp = false, appContainerId) {
  const insert = (strings, ...sections) => {
    let result = '';

    strings.forEach((string, i) => {
      result += (sections[i] && sections[i].length) ? `\
${string}${sections[i]}\
` : '';
    });

    return result;
  };

  return insert`\
${getImportsSection(includeImports)}\
${getInitialExpressionsSection(snippetInformation)}\

${!includeApp ? `${getUseEffectSection(snippetInformation)}\n\n` : ''}\
${includeApp ? getAppSection(snippetInformation, appContainerId) : getHotComponentSection(snippetInformation)}
`;
}

module.exports = {
  render
};
