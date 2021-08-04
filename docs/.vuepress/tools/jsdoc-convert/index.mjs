/// npm dependencies
import jsdoc2md from 'jsdoc-to-markdown';
import dmd from 'dmd';
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';

/// shared dependencies
import utils from '../utils.js';

/// internal dependencies
import configuration from './configuration.js';
import { isPlugin } from './predictors.mjs';
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
import { buildJsdocLinksFixer } from './postProcessors/jsdocLinksFixer.mjs';

/// extract commonjs module
const { pathToSource, pathToDist, urlPrefix, whitelist, seo, linkAliases } = configuration;
const { logger } = utils;

/// build & configure services
const header = buildHeaderWriter({ seo, urlPrefix, isPlugin });
const { source, dist } = buildPathsDeterminants({ pathToSource, pathToDist });
const preProcessor = buildPreProcessor([
  sortJsdocMembers,
  applyLinkToSource,
  ...applyOptionsToPlugins
]);
const postProcessor = buildPostProcessor([
  ...outputCleaners,
  ...typesLinkingFixers,
  unescapeRedundant,
  buildJsdocLinksFixer({ linkAliases }),
]);
const { parseJsdoc, generateMarkdown } = buildJsdocToMarkdownIntegrator({ source });

/// main logic
const parse = file => postProcessor(generateMarkdown(preProcessor(parseJsdoc(file))));

const write = (file, output) => {
  const match = file.match(/(.*\/)/);
  const dir = match && match[1];

  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(file, output);
};

const render = file => write(dist(file), header(file) + parse(file));

/// traverse files:
const traversePlugins = function* () {
  const items = fs.readdirSync(source('plugins'));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (['base', '__tests__', /* privates: */ 'touchScroll', 'multipleSelectionHandles'].includes(item)) {
      continue; // eslint-disable-line no-continue
    }

    if (fs.statSync(source(path.join('plugins', item))).isDirectory()) {
      yield path.join('plugins', item, `${item}.js`);
    }
  }
};

const traverse = function* () {
  yield* whitelist;
  yield* traversePlugins();
};

/// program:
const errors = [];

for (const file of traverse()) { // eslint-disable-line no-restricted-syntax
  logger.log('Generating: ', source(file));
  try {
    render(file);
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
