import fs from 'fs';
import { buildPreProcessor } from './preProcessor.mjs';
import { sortJsdocMembers } from './preProcessors/sortJsdocMembers.mjs';
import { applyLinkToSource } from './preProcessors/applyLinkToSource.mjs';
import { applyOptionsToPlugins } from './preProcessors/applyOptionsToPlugins.mjs';
import { clearMemberofIfClass } from './postProcessors/clearMemberofIfClass.mjs';
import { applyOwnerIfDoesntExists } from './postProcessors/applyOwnerIfDoesntExists.mjs';
import { buildPostProcessor } from './postProcessor.mjs';
import { outputCleaners } from './postProcessors/outputCleaners.mjs';
import { buildTypesLinkingFixers } from './postProcessors/typesLinkingFixers.mjs';
import { unescapeRedundant } from './postProcessors/unescapeRedundant.mjs';
import { jsdocLinksFixer } from './postProcessors/jsdocLinksFixer.mjs';
import { isJsdocPlugin } from './predictors.mjs';
import { buildHeaderWriter } from './seo.mjs';

export const buildRenderer = ({ dist, generateMarkdown, configuration, logger }) =>
  (fileName, members, parsedTypes) => {
    const header = buildHeaderWriter(configuration);

    const write = (file, output) => {
      if (output.endsWith('[[toc]]\n')) {
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

    const preProcessor = buildPreProcessor([
      sortJsdocMembers,
      applyLinkToSource,
      ...applyOptionsToPlugins,
      clearMemberofIfClass,
      applyOwnerIfDoesntExists
    ]);

    const postProcessor = buildPostProcessor([
      ...outputCleaners,
      ...buildTypesLinkingFixers({ parsedTypes }),
      unescapeRedundant,
      jsdocLinksFixer,
    ]);

    const jsdocData = preProcessor(members);

    return write(
      dist(fileName),
      header(fileName, isJsdocPlugin(jsdocData)) + postProcessor(generateMarkdown(jsdocData))
    );
  };
