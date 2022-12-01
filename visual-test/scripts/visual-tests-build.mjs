// import { spawnProcess } from './utils/processes.mjs';
import execa from 'execa';

const wrappers = ['js', 'angular', 'react', 'vue'];
const version = '12.2.0';

await execa.command('npx playwright install --with-deps');

const commands = [];

for (let i = 0; i < wrappers.length; ++i) {
  commands.push(execa.command('npx playwright test', { env: { WRAPPER: wrappers[i], VERSION: version } }));
}

await Promise.all(commands);
