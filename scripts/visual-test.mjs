import { spawnProcess } from './utils/processes.mjs';

process.chdir('./visual-test');
await spawnProcess('npm install');
await spawnProcess('npx playwright install --with-deps');
await spawnProcess('npm install --save-dev @argos-ci/cli');
await spawnProcess('npx playwright test');
