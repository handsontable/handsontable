const fs = require('fs');
const path = require("path");

const removeNodeModules = () => {
    const files = fs.readdirSync(path.resolve(__dirname, '..'));
    if (!files.includes('node_modules')) {
        return;
    }
    fs.rmdirSync(path.resolve(__dirname, '..', 'node_modules'), { recursive: true });
}

removeNodeModules();