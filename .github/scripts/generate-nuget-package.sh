#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NUSPEC_PATH="$REPO_ROOT/handsontable/Handsontable.nuspec"
STYLES_DIR="$REPO_ROOT/handsontable/tmp/styles"

# Read version from handsontable/tmp/package.json
VERSION=$(node -p "require('$REPO_ROOT/handsontable/tmp/package.json').version")

echo "Generating NuGet package for Handsontable v$VERSION..."

# Build CSS file entries dynamically from tmp/styles/
CSS_FILES=""
for css_file in "$STYLES_DIR"/*.css; do
  filename=$(basename "$css_file")
  CSS_FILES+="    <file src=\"handsontable/tmp/styles/$filename\" target=\"Content/handsontable\" />\n"
done

# Create temporary nuspec file
cat > "$NUSPEC_PATH" << EOF
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2010/07/nuspec.xsd">
  <metadata>
    <id>Handsontable</id>
    <version>\$version\$</version>
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
$(printf "%b" "$CSS_FILES")
    <!-- JavaScript Files -->
    <file src="handsontable/tmp/dist/handsontable.js" target="Scripts/handsontable" />
    <file src="handsontable/tmp/dist/handsontable.min.js" target="Scripts/handsontable" />
    <file src="handsontable/tmp/dist/handsontable.full.js" target="Scripts/handsontable" />
    <file src="handsontable/tmp/dist/handsontable.full.min.js" target="Scripts/handsontable" />
  </files>
</package>
EOF

# Generate the .nupkg using nuget pack
# The -Version flag overrides $version$ in the nuspec
# -OutputDirectory places the nupkg in the repo root
nuget pack "$NUSPEC_PATH" \
  -Version "$VERSION" \
  -OutputDirectory "$REPO_ROOT" \
  -BasePath "$REPO_ROOT"

echo "Package generated: $REPO_ROOT/Handsontable.$VERSION.nupkg"

# Clean up the temporary nuspec
rm "$NUSPEC_PATH"
echo "Removed temporary nuspec file."