export function addLicenseBanner(config) {
  const path = require('path');
  const fs = require('fs');
  const packageBody = require(`./package.json`);

  let licenseBody = fs.readFileSync(path.resolve(__dirname, './LICENSE.txt'), 'utf8');
  licenseBody += `\nVersion: ${packageBody.version} (built at ${new Date().toString()})`;

  config.output.banner = `/*!\n${licenseBody.replace(/^/gm, ' * ')}\n */`;

  return config;
}
