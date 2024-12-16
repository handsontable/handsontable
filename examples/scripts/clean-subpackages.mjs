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
  ${version}/**/(angular|angular-*)/**/.angular`);

  const removes = [];

  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/dist`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/@(!(node_modules))/.cache`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|react-wrapper|vue*)/package-lock.json`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(angular|angular-*)/@(!(node_modules))/.angular`));

  await Promise.all(removes);
} else {
  console.log(`Removing:
  ./node_modules
  ./package-lock.json`);

  rimraf.sync('./node_modules');
  rimraf.sync('./package-lock.json');
}
