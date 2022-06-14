/**
 * Clean the node_modules, dist and package-locks for the framework directories (and thus, the examples).
 */
import rimraf from 'rimraf';
import { promisify } from 'util';

const rimrafPromisified = promisify(rimraf);

const [version] = process.argv.slice(2);

(async() => {
  if (!version) {
    console.log(`Removing:
    ./node_modules
    ./package-lock.json`);

    rimraf.sync('./node_modules');
    rimraf.sync('./package-lock.json');
  }

  console.log(`Removing:
  ${version}/**/(js|ts|angular|angular-*|react|vue)/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|vue)/**/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|vue)/**/dist
  ${version}/**/(js|ts|angular|angular-*|react|vue)/**/.cache
  ${version}/**/(js|ts|angular|angular-*|react|vue)/package-lock.json`);

  const removes = [];

  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/node_modules`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/dist`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/.cache`));
  removes.push(rimrafPromisified(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/package-lock.json`));

  await Promise.all(removes);
})();
