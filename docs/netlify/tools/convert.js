/**
 *  This script reads the redirects.conf file and converts it to a JSON file named redirects.json.
 *  Usage: node convert.js
 *  The JSON file will contain an array of objects, each representing a redirect rule.
 *  The object will have the following properties:
 *  - from: The pattern in the rewrite rule (regex pattern as a string)
 *  - to: The destination URL.
 *
 *  The script will save the JSON file in the same directory as the script.
 *  The script assumes that the redirects.conf file is in the same directory as the script.
 *  Adjust the file path as needed if the file is in a different location.
 *  The script will overwrite the existing redirects.json file if it exists.
 */

const fs = require('fs');
const path = require('path');

/**
 * Converts a `redirects.conf` file into a JSON format.
 * Each line in the file that follows the format:
 * `rewrite <fromPattern> <toURL> <redirectType>;`
 * will be converted to a JSON object with `from` and `to` properties.
 *
 * @param {string} filePath - The path to the `redirects.conf` file.
 * @returns {Array<{from: string, to: string}>} - An array of redirect objects in the format `{from: string, to: string}`.
 */
function convertConfToJSON(filePath) {
  // Read the contents of the redirects.conf file
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Split the content by lines
  const lines = fileContent.split('\n');
  const redirectsArray = [];

  // Process each line
  lines.forEach((line) => {
    line = line.trim();

    // Ignore comments and blank lines
    if (line === '' || line.startsWith('#')) return;

    // Regex to extract parts of the rewrite rule
    const rewriteRegex = /^rewrite\s+(.+)\s+(.+)\s+(.+);$/;
    const match = line.match(rewriteRegex);

    if (match) {
      const fromPattern = match[1];
      const toURL = match[2];

      // Convert to JSON format
      redirectsArray.push({
        from: fromPattern,
        to: toURL
      });
    }
  });

  return redirectsArray;
}

// Define the input and output file paths
const inputFilePath = path.join(__dirname, 'redirects.conf'); // Adjust the file path as needed
const outputFilePath = path.join(__dirname, 'redirects.json');

// Convert the conf file to a JSON object
const redirectsArray = convertConfToJSON(inputFilePath);

// Write the JSON array to a file
fs.writeFileSync(outputFilePath, JSON.stringify(redirectsArray, null, 2));
