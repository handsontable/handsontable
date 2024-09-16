const fs = require('fs');
const path = require('path');

// Constants
const STATUS_PERMANENT_REDIRECT = 301;
const STATUS_TEMPORARY_REDIRECT = 302; // Modify this if needed for temporary redirects

// Function to process the .conf file and convert it to JSON
function convertConfToJSON(filePath) {
    // Read the .conf file
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Split the file content into lines
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
            const fromPattern = match[1];   // The pattern in the rewrite rule (regex pattern as a string)
            const toURL = match[2];         // The destination URL
            const redirectType = match[3];  // Redirect type (could be "permanent" or something else)

            // Convert to JSON format, keeping "from" as a string
            redirectsArray.push({
                from: fromPattern, // This is now kept as a string
                to: toURL,
                status: redirectType === 'permanent' ? STATUS_PERMANENT_REDIRECT : STATUS_TEMPORARY_REDIRECT
            });
        }
    });

    return redirectsArray;
}

// Convert the file and save as a JSON file
const inputFilePath = path.join(__dirname, 'redirects.conf'); // Adjust the file path as needed
const outputFilePath = path.join(__dirname, 'redirects.json');

const redirectsArray = convertConfToJSON(inputFilePath);

// Write the JSON array to a file
fs.writeFileSync(outputFilePath, JSON.stringify(redirectsArray, null, 2));

console.log('Conversion completed! JSON saved to redirects.json');
