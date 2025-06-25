/**
 * Clean the node_modules, dist and package-locks for the framework directories (and thus, the examples).
 */
import rimraf from 'rimraf';
import { promisify } from 'util';

const rimrafPromisified = promisify(rimraf);
const [version] = process.argv.slice(2);

if (version) {
  console.log(`Removing:
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/**/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/**/dist
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/**/.cache
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/package-lock.json
  ${version}/**/(js|ts|angular|angular-*|react|react-wrapper|vue*)/pnpm-lock.yaml
  ${version}/**/(angular|angular-*)/**/.angular`);

  const removes = [];

  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/dist`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/.cache`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/package-lock.json`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/pnpm-lock.yaml`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(angular|angular-*)/@(!(node_modules))/.angular`));

  await Promise.all(removes);

} else {
  console.log('Provide the examples version as an argument.');
}
