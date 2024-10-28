import moment from 'moment';
import { setVersion } from './utils/pre-release.mjs';
import { spawnProcess } from './utils/processes.mjs';
import hotConfig from '../hot.config.js';

const commitSha = (await spawnProcess('git rev-parse HEAD', { silent: true }))
  .stdout
  .toString()
  .slice(0, 7);
const currentDate = moment().format('YYYYMMDD');
const currentBranchName = (await spawnProcess('git rev-parse --abbrev-ref HEAD', { silent: true })).stdout;
let versionNumber = '0.0.0';

if (currentBranchName.startsWith('release/')) {
  versionNumber = hotConfig.HOT_VERSION;
}

const packageVersion = `${versionNumber}-next-${commitSha}-${currentDate}`;

setVersion(packageVersion);
