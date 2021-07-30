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
import { buildTypesLinkingFixers } from './postProcessors/typesLinkingFixers.mjs';
import { unescapeRedundant } from './postProcessors/unescapeRedundant.mjs';
import { jsdocLinksFixer } from './postProcessors/jsdocLinksFixer.mjs';

/// extract commonjs module
const { pathToSource, pathToDist, urlPrefix, seo } = configuration;
const { logger } = utils;

/// build & configure services
const escape = text => text.replace(/[{}<>]/g, '').replace(/~/g, '-')

const header = buildHeaderWriter({ seo, urlPrefix, escape });
const { source, dist } = buildPathsDeterminants({ pathToSource, pathToDist });
const { parseJsdoc, generateMarkdown } = buildJsdocToMarkdownIntegrator({ source });

/// main logic : parse
const parse = function* () {
  const getName = member => escape(
      (member.kind === 'class' && member.name) // if class get class name
      || member.memberof?.split('#')[0]  // if member of a class 
      || 'global' // else (if global)
  );
  const groupMember = (map, member) => map.set(getName(member), [...map.get(getName(member)) || [], member]);

  logger.info("Parsing jsdoc comments...");
  const data = parseJsdoc(`**/*.js`);
  logger.success("Jsdoc comments parsed successfully.");

  const membersPerFile = data.reduce(groupMember, new Map());

  logger.info(`Parsed ${membersPerFile.size} API Refs pages.`);
  
  const parsedTypes = [...membersPerFile.keys()];
  for (const [type, members] of membersPerFile) {
    yield {type, members, metaData: {parsedTypes}};
  }
}


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

const render = (fileName, members, parsedTypes) => {
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
    ...buildTypesLinkingFixers({parsedTypes}),
    unescapeRedundant,
    jsdocLinksFixer,
  ]);
  
  const jsdocData = preProcessor(members);
  return write(dist(fileName), header(fileName, isJsdocPlugin(jsdocData)) +  postProcessor(generateMarkdown(jsdocData)));
}

/// program:
const errors = [];

for (const {type, members, metaData:{parsedTypes}} of parse()) { // eslint-disable-line no-restricted-syntax
  const fileName = `${type}.md`;
  
  logger.log(`Generating \`${type}\` into:`, dist(fileName));
  try {
    render(fileName, members, parsedTypes);
  } catch (e) {
    logger.error('ERROR: ', e);
    errors.push({ type, e });
  }
}

if (errors.length) {
  logger.warn(`Finished with ${errors.length} errors`, errors.map(x => x.file));
  process.exit(1);
}

logger.success('OK!');
process.exit(0);
