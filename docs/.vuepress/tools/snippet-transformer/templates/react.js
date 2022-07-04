const beautify = require('js-beautify').js;
const { indentLines } = require('./helpers');
const { nativeToReactEvent } = require('./helpers/react');

/**
 * TODO, before merging: docs
 */
function replaceOutputLogs(snippetInformation) {
  snippetInformation.globalReplaceOutputLog(message => `setOutput(${message});`);

  // TODO, before merging: probably can be removed
//   const queryRegex = new RegExp(`/${outputVarName}\\.innerText = (.*);/gm`);
//
//   globalReplaceContent(queryRegex, message => `\
// setOutput(${message});
// `);
}

/**
 * Return a default set of imports for the React example.
 *
 * @param {boolean} includeImports `true` if the final snippet should include the imports section.
 * @param {CategorizedData} snippetInformation A CategorizedData instance containing information about the snippet.
 * @returns {string}
 */
function getImportsSection(includeImports, snippetInformation = '') {
  const {
    outputVarName
  } = snippetInformation;
  const additionalImports = snippetInformation.getAdditionalImports() || '';

  return includeImports ? `\
import React, { Fragment, useEffect${outputVarName ? ', useState' : ''} } from 'react';\
${additionalImports.length ? `${additionalImports}` : ''}
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

` : '';
}

/**
 * TODO, before merging: docs
 */
function getStateSection(snippetInformation) {
  const {
    outputVarName
  } = snippetInformation;

  return outputVarName ? `\
const [output, setOutput] = useState('');
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

  return `\
${refDeclarations}\
${getStateSection(snippetInformation)}
${snippetInformation.getInitialExpressions().join('\n')}\
`;
}

/**
 * Get the `<HotTable>` component section.
 *
 * @param {CategorizedData} snippetInformation A CategorizedData instance containing information about the snippet.
 * @returns {string}
 */
function getHotComponentSection(snippetInformation) {
  const selectorToSnippetMap = new Map();

  snippetInformation.getNamedHotInstances().forEach((info, varName) => {
    selectorToSnippetMap.set(info.containerSelector, `\
<HotTable ${info.hasRef ? `ref={${varName}Ref} ` : ''}settings={${info.config}}>
</HotTable>\
`);
  });

  snippetInformation.getUnnamedHotInstances().forEach((info) => {
    selectorToSnippetMap.set(info.containerSelector, `\
<HotTable settings={${info.config}}>
</HotTable>\
`);
  });

  return snippetInformation.getHtmlSnippet(selectorToSnippetMap, (node, type, snippet) => {
    node.setAttribute(`${nativeToReactEvent(type)}={(...args) => ${snippet}(...args)}`, '');
    // node.setAttribute(`on${type[0].toUpperCase() + type.substring(1)}={${snippet}}`, '');
  }, (node, outputVarName) => {

    // TODO, before merging: get rid of outputVarName, seems to not be needed
    // Non-standard method from `node-html-parser`.
    node.set_content('{output}');
  });
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
${`${refDeclarations}${snippetInformation.getRefExpressions().join('\n')}`}
});

` : '';
}

/**
 * Get the application defining section.
 *
 * @param {CategorizedData} snippetInformation A CategorizedData instance containing information about the snippet.
 * @param {string} appContainerId The id of the element being used as the application DOM container.
 * @returns {string}
 */
function getComponentSection(snippetInformation, appContainerId = 'example') {
  // TODO: Keeping the `indentLines` method here, because of an issue with `js-beautify`
  //  (https://github.com/beautify-web/js-beautify/issues/667)
  return `\
const ExampleComponent = () => {
${`${getInitialExpressionsSection(snippetInformation)}\n\n`}\
${getUseEffectSection(snippetInformation)}\
return (
    <Fragment>
${indentLines(getHotComponentSection(snippetInformation), 3)}
    </Fragment>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('${appContainerId}'));
`;
}

/**
 * Return the entire transformed snippet.
 *
 * @param {CategorizedData} snippetInformation The snippet information object.
 * @param {boolean} [includeImports=false] `true` if the final snippet should include the imports section.
 * @param {boolean} [includeComponentWrapper=false] `true` if the final snippet should wrap the component with
 *   application logic.
 * @param {string} [appContainerId] The id of the element being used as the application DOM container.
 * @returns {string}
 */
function render(snippetInformation, includeImports = false, includeComponentWrapper = false, appContainerId) {
  // If any event listeners are declared, it only makes sense to present it as a full component (the events are
  // bound to the rendered DOM elements).
  if (snippetInformation.getEventListeners().size) {
    includeImports = true;
  }

  replaceOutputLogs(snippetInformation);

  return beautify(`\
${getImportsSection(includeImports, snippetInformation)}\
${!includeComponentWrapper ? `${getInitialExpressionsSection(snippetInformation)}\n\n` : ''}\
${!includeComponentWrapper ? `${getUseEffectSection(snippetInformation)}` : ''}\
${
  includeComponentWrapper ?
    getComponentSection(snippetInformation, appContainerId) :
    `${getHotComponentSection(snippetInformation)}`
}
`, {
    brace_style: 'preserve-inline',
    indent_size: 2,
    e4x: true,
  });
}

module.exports = {
  render
};
