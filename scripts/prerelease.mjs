import moment from 'moment';
import { setVersion } from './utils/pre-release.mjs';
import { spawnProcess } from './utils/processes.mjs';

const commitSha = (await spawnProcess('git rev-parse HEAD', { silent: true }))
  .stdout
  .toString()
  .slice(0, 7);
const date = moment().format('YYYYMMDD');
const newVersion = `0.0.0-next-${commitSha}-${date}`;

setVersion(newVersion);

