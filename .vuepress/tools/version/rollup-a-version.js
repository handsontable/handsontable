/// Usages: `version ${version}`

const semver = require('semver');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const workingDir = path.resolve(__dirname, '../../../');

/// parse and validate argument
const version = process.argv[2];

if(!version)
{
    throw new Error('<version> is required.');
}
else if(version === '--help')
{
    process.stdout.write('Usages: `version <version>`, where version must be a valid semver.\n');
    process.exit(0);
}
else if(!semver.valid(semver.coerce(version)))
{
    throw new Error('<version> must be a valid semver.')
}
else if(fs.existsSync(path.join(workingDir,version)))
{
    throw new Error('<version> should be unique.')
}
(async ()=> {
    const replaceInFiles = require('replace-in-files');
    const helpers = require('../../helpers');

    const lastVersion = helpers.getLatestVersion();

    /// * add `/${getLatestVersion()}/` before each permalink for files from `/${getLatestVersion()}/`
    await replaceInFiles({
        files: path.join(workingDir, lastVersion, '**/*.md'),
        from: /permalink: \/([^0-9])/g,
        to: `permalink: /${lastVersion}/$1`,
    })
        process.stdout.write(`Permalinks for previous latest (${lastVersion}) updated.\n`)


    /// * copy `/next/` to `/${version}/`
    fse.copySync(path.join(workingDir, 'next'), path.join(workingDir, version));

    /// * replace all `/next/` into `/` in dir `/${version}/`
    await replaceInFiles({
        files: path.join(workingDir, version, '**/*.md'),

        from: /permalink: \/next\//g,
        to: `permalink: /`,
    })
        process.stdout.write(`Permalinks for current latest (${version}) updated.\n`)

    /// * update installation guide
    await replaceInFiles({
        files: path.join(workingDir, version, '**/*.md'),
        from: /{##VERSION}/g,
        to: version,
    })
    process.stdout.write(`{##VERSION} replaced into current version (${version}) \n`)

    /// * print kind information, that version was been created.
    process.stdout.write(`Version: ${version} successfully created.\n`);
})();