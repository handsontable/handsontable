/**
 *  This script reads the redirects.conf file and converts it to a JSON file named redirects.json.
 *  Usage: node convert.js
 *  The JSON file will contain an array of objects, each representing a redirect rule.
 *  The object will have the following properties:
 *  - from: The pattern in the rewrite rule (regex pattern as a string)
 *  - to: The destination URL
 *  - status: Redirect type (301 or 302)
 *
 *  The script will save the JSON file in the same directory as the script.
 *  The script assumes that the redirects.conf file is in the same directory as the script.
 *  Adjust the file path as needed if the file is in a different location.
 *  The script will overwrite the existing redirects.json file if it exists.
 *
 */

const fs = require('fs');
const path = require('path');

const STATUS_PERMANENT_REDIRECT = 301;
const STATUS_TEMPORARY_REDIRECT = 302;



function convertConfToJSON(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const lines = fileContent.split('\n');
    const redirectsArray = [];

    lines.forEach(line => {
        line = line.trim();

        // Ignore comments and blank lines
        if (line === '' || line.startsWith('#')) return;

        // Extract parts of the line
        const rewriteRegex = /^rewrite\s+(.+)\s+(.+)\s+(.+);$/;
        const match = line.match(rewriteRegex);

        if (match) {
            const fromPattern = match[1];
            const toURL = match[2];
            const redirectType = match[3];

            // Convert to JSON format, keeping "from" as a string
            redirectsArray.push({
                from: fromPattern,
                to: toURL,
                status: redirectType === 'permanent' ? STATUS_PERMANENT_REDIRECT : STATUS_TEMPORARY_REDIRECT
            });
        }
    });

    return redirectsArray;
}

const inputFilePath = path.join(__dirname, 'redirects.conf'); // Adjust the file path as needed
const outputFilePath = path.join(__dirname, 'redirects.json');

const redirectsArray = convertConfToJSON(inputFilePath);

fs.writeFileSync(outputFilePath, JSON.stringify(redirectsArray, null, 2));

console.log('Conversion completed! JSON saved to redirects.json');
