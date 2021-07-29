/* eslint-disable no-useless-escape */
/// npm dependencies
import fs from 'fs';

/// shared dependencies
import utils from '../utils.js';

/// internal dependencies
import configuration from './configuration.js';
import { isJsdocPlugin } from './predictors.mjs';
import { buildHeaderWriter } from './seo.mjs';
import { buildPathsDeterminants } from './paths.mjs';
import { buildJsdocToMarkdownIntegrator } from './integrations/jsdoc-to-markdown/index.mjs';

import { buildPreProcessor } from './preProcessor.mjs';
import { sortJsdocMembers } from './preProcessors/sortJsdocMembers.mjs';
import { applyLinkToSource } from './preProcessors/applyLinkToSource.mjs';
import { applyOptionsToPlugins } from './preProcessors/applyOptionsToPlugins.mjs';

import { buildPostProcessor } from './postProcessor.mjs';
import { outputCleaners } from './postProcessors/outputCleaners.mjs';
import { typesLinkingFixers } from './postProcessors/typesLinkingFixers.mjs';
import { unescapeRedundant } from './postProcessors/unescapeRedundant.mjs';
import { jsdocLinksFixer } from './postProcessors/jsdocLinksFixer.mjs';

/// extract commonjs module
const { pathToSource, pathToDist, urlPrefix, seo } = configuration;
const { logger } = utils;

/// build & configure services
const escape = text => text.replace(/[{}<>]/g, '').replace(/~/g, '-')

const header = buildHeaderWriter({ seo, urlPrefix, escape });
const { source, dist } = buildPathsDeterminants({ pathToSource, pathToDist });
const preProcessor = buildPreProcessor([
  sortJsdocMembers,
  applyLinkToSource,
  ...applyOptionsToPlugins,
  (data) => { // todo extract; clear class memberof (f.i. BasePlugin is member of BasePlugin)
    data.some(member => {
      if(member.kind === "class") {
        member.memberof = undefined
      }
      return member.kind === "class";
    });
    return data;
  },
  (data) => { // todo extract; add a class data if doesn't exist.
    const first = data[0];
    if(first.kind === 'class'){
      return data; // class element exists, all's right 
    }
    return [
      {
        "id": first.memberof,
        "longname": first.memberof,
        "name": first.memberof,
        "kind": "class",
        "scope": "global",
      },
      ...data
    ];
  }
  ]);

const postProcessor = buildPostProcessor([
  ...outputCleaners,
  ...typesLinkingFixers,
  unescapeRedundant,
  jsdocLinksFixer,
]);
const { parseJsdoc, generateMarkdown } = buildJsdocToMarkdownIntegrator({ source });

/// main logic : parse
const parse = function* () {
  const getFileName = member => escape(
    (
      (member.kind === 'class' && member.name) // if class get class name
      || member.memberof?.split('#')[0]  // if member of a class 
      || 'global' // else (if global)
    )
    +'.md'
  );
  const groupMember = (map, member) => map.set(getFileName(member), [...map.get(getFileName(member)) || [], member]);

  logger.info("Parsing jsdoc comments...");
  const data = parseJsdoc(`**/*.js`);
  logger.success("Jsdoc comments parsed successfully.");

  const membersPerFile = data.reduce(groupMember, new Map());

  logger.info(`Parsed ${membersPerFile.size} API Refs pages.`);
  yield* membersPerFile.entries();
};


/// main logic: render
const write = (file, output) => {
  if(output.endsWith("[[toc]]\n")){
    logger.info(`Empty output detected, file omitted: ${file}`);
    return;
  }
  
  const match = file.match(/(.*\/)/);
  const dir = match && match[1];

  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(file, output);
};

const render = (file, rawJsdocData) => {
  const jsdocData = preProcessor(rawJsdocData);
  return write(dist(file), header(file, isJsdocPlugin(jsdocData)) +  postProcessor(generateMarkdown(jsdocData)));
}

/// program:
const errors = [];

for (const [file, jsdoc] of parse()) { // eslint-disable-line no-restricted-syntax
  logger.log('Generating: ', dist(file));
  try {
    render(file, jsdoc);
  } catch (e) {
    logger.error('ERROR: ', e);
    errors.push({ file, e });
  }
}

if (errors.length) {
  logger.warn(`Finished with ${errors.length} errors`, errors.map(x => x.file));
  process.exit(1);
}

logger.success('OK!');
process.exit(0);
