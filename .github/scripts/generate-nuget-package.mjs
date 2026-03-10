import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { spawnProcess } from '../../scripts/utils/processes.mjs';
import { displayInfoMessage, displayConfirmationMessage, displayErrorMessage } from '../../scripts/utils/console.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const NUSPEC_PATH = path.join(REPO_ROOT, 'handsontable', 'Handsontable.nuspec');
const STYLES_DIR = path.join(REPO_ROOT, 'handsontable', 'tmp', 'styles');
const TMP_PACKAGE_JSON = path.join(REPO_ROOT, 'handsontable', 'tmp', 'package.json');

// Read version from handsontable/tmp/package.json
const { version: VERSION } = JSON.parse(fs.readFileSync(TMP_PACKAGE_JSON, 'utf8'));

displayInfoMessage(`Generating NuGet package for Handsontable v${VERSION}...`);

// Build CSS file entries dynamically from tmp/styles/
const cssFileEntries = fs.readdirSync(STYLES_DIR)
  .filter(f => f.endsWith('.css'))
  .map(filename => `    <file src="handsontable/tmp/styles/${filename}" target="Content/handsontable" />`)
  .join('\n');

// Create temporary nuspec file
const nuspecContent = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2010/07/nuspec.xsd">
  <metadata>
    <id>Handsontable</id>
    <version>$version$</version>
    <title>Handsontable</title>
    <authors>Handsoncode</authors>
    <owners>Handsoncode</owners>
    <projectUrl>https://github.com/handsontable/handsontable</projectUrl>
    <licenseUrl>https://github.com/handsontable/handsontable/blob/master/LICENSE.txt</licenseUrl>
    <description>Handsontable is a data grid component with an Excel-like appearance. Built in JavaScript, it integrates with any data source and comes with features like data validation, sorting, grouping, data binding or column ordering.</description>
    <releaseNotes>https://github.com/handsontable/handsontable/releases</releaseNotes>
    <tags>spreadsheet data-grid table-editor table excel handsontable handsoncode</tags>
  </metadata>
  <files>
    <!-- CSS Files -->
${cssFileEntries}
    <!-- JavaScript Files -->
    <file src="handsontable/tmp/dist/handsontable.js" target="Scripts/handsontable" />
    <file src="handsontable/tmp/dist/handsontable.min.js" target="Scripts/handsontable" />
    <file src="handsontable/tmp/dist/handsontable.full.js" target="Scripts/handsontable" />
    <file src="handsontable/tmp/dist/handsontable.full.min.js" target="Scripts/handsontable" />
  </files>
</package>`;

fs.writeFileSync(NUSPEC_PATH, nuspecContent, 'utf8');

// Generate the .nupkg using nuget pack.
// The -Version flag overrides $version$ in the nuspec.
// -OutputDirectory places the nupkg in the repo root.
try {
  execSync(
    `nuget pack ${NUSPEC_PATH} -Version ${VERSION} -OutputDirectory ${REPO_ROOT} -BasePath ${REPO_ROOT}`,
    { stdio: 'inherit' }
  );
  displayConfirmationMessage(`Package generated: ${REPO_ROOT}/Handsontable.${VERSION}.nupkg`);
} catch (error) {
  displayErrorMessage(`Failed to generate NuGet package: ${error.message}`);
  process.exit(1);
} finally {
  fs.unlinkSync(NUSPEC_PATH);
  displayInfoMessage('Removed temporary nuspec file.');
}
