const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

// Define the directory paths
const inputDir = path.join(__dirname, 'styles');
const outputDir = path.join(__dirname, 'styles_processed');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Read and parse CSS variables from a separate file (variables.scss or define here)
const cssVariables = {
  "--ht-font-size": "14px",
  "--ht-line-height": "20px",
  "--ht-font-weight": "400",
  "--ht-gap-size": "6px",
  "--ht-icon-size": "16px",
  "--ht-table-transition": "0.2s",
  "--ht-border-color": "#e5e5e9",
  "--ht-accent-color": "#37bc6c",
  "--ht-foreground-color": "#353535",
  "--ht-background-color": "#ffffff",
  "--ht-placeholder-color": "#868686",
  "--ht-read-only-color": "#868686",
  "--ht-disabled-color": "#aeaeae",
  "--ht-cell-horizontal-border-color": "rgba(255, 255, 255, 0)",
  "--ht-cell-vertical-border-color": "#e5e5e9",
  "--ht-wrapper-border-width": "0",
  "--ht-wrapper-border-radius": "12px",
  "--ht-wrapper-border-color": "#e5e5e9",
  "--ht-row-header-odd-background-color": "rgba(35, 35, 38, 0)",
  "--ht-row-header-even-background-color": "rgba(35, 35, 38, 0.04)",
  "--ht-row-cell-odd-background-color": "rgba(35, 35, 38, 0)",
  "--ht-row-cell-even-background-color": "rgba(35, 35, 38, 0.04)",
  "--ht-cell-horizontal-padding": "12px",
  "--ht-cell-vertical-padding": "8px",
  "--ht-cell-editor-border-width": "2px",
  "--ht-cell-editor-border-color": "#37bc6c",
  "--ht-cell-editor-foreground-color": "#000000",
  "--ht-cell-editor-background-color": "#ffffff",
  "--ht-cell-editor-shadow-blur-radius": "8px",
  "--ht-cell-editor-shadow-color": "#37bc6c",
  "--ht-cell-success-background-color": "rgba(55, 188, 108, 0.30)",
  "--ht-cell-error-background-color": "rgba(250, 77, 50, 0.30)",
  "--ht-cell-selection-border-color": "#37bc6c",
  "--ht-cell-selection-background-color": "#37bc6c",
  "--ht-cell-autofill-size": "6px",
  "--ht-cell-autofill-border-width": "1px",
  "--ht-cell-autofill-border-radius": "4px",
  "--ht-cell-autofill-border-color": "#ffffff",
  "--ht-cell-autofill-background-color": "#37bc6c",
  "--ht-cell-autofill-fill-border-color": "#353535",
  "--ht-resize-indicator-color": "#868686",
  "--ht-move-backlight-color": "rgba(7, 6, 4, 0.08)",
  "--ht-move-indicator-color": "#37bc6c",
  "--ht-hidden-indicator-color": "#868686",
  "--ht-scrollbar-border-radius": "8px",
  "--ht-scrollbar-track-color": "#f7f7f9",
  "--ht-scrollbar-thumb-color": "#868686",
  "--ht-checkbox-size": "16px",
  "--ht-checkbox-border-radius": "6px",
  "--ht-checkbox-border-color": "rgba(174, 174, 164, 0.64)",
  "--ht-checkbox-background-color": "#ffffff",
  "--ht-checkbox-icon-color": "rgba(255, 255, 255, 0)",
  "--ht-checkbox-focus-border-color": "#aeaea4",
  "--ht-checkbox-focus-background-color": "#ffffff",
  "--ht-checkbox-focus-icon-color": "rgba(255, 255, 255, 0)",
  "--ht-checkbox-focus-ring-color": "#37bc6c",
  "--ht-checkbox-disabled-border-color": "#aeaea4",
  "--ht-checkbox-disabled-background-color": "#e0e0e0",
  "--ht-checkbox-disabled-icon-color": "rgba(255, 255, 255, 0)",
  "--ht-checkbox-checked-border-color": "#57c784",
  "--ht-checkbox-checked-background-color": "#37bc6c",
  "--ht-checkbox-checked-icon-color": "#ffffff",
  "--ht-checkbox-checked-focus-border-color": "#ffffff",
  "--ht-checkbox-checked-focus-background-color": "#37bc6c",
  "--ht-checkbox-checked-focus-icon-color": "#ffffff",
  "--ht-checkbox-checked-disabled-border-color": "#aeaea4",
  "--ht-checkbox-checked-disabled-background-color": "#e0e0e0",
  "--ht-checkbox-checked-disabled-icon-color": "#aeaeae",
  "--ht-header-font-weight": "400",
  "--ht-header-foreground-color": "#353535",
  "--ht-header-background-color": "#f7f7f9",
  "--ht-header-active-border-color": "#2d2d30",
  "--ht-header-active-foreground-color": "#ffffff",
  "--ht-header-active-background-color": "#19191c",
  "--ht-header-highlighted-shadow-size": "1px",
  "--ht-header-highlighted-foreground-color": "#353535",
  "--ht-header-highlighted-background-color": "#ededef",
  "--ht-header-filter-background-color": "rgba(55, 188, 108, 0.30)",
  "--ht-header-row-foreground-color": "#353535",
  "--ht-header-row-background-color": "#ffffff",
  "--ht-header-row-highlighted-foreground-color": "#353535",
  "--ht-header-row-highlighted-background-color": "#ededef",
  "--ht-header-row-active-foreground-color": "#ffffff",
  "--ht-header-row-active-background-color": "#19191c",
  "--ht-icon-button-border-radius": "16px",
  "--ht-icon-button-border-color": "#f7f7f9",
  "--ht-icon-button-background-color": "#f7f7f9",
  "--ht-icon-button-icon-color": "rgba(53, 53, 53, 0.60)",
  "--ht-icon-button-hover-border-color": "#e4e4e5",
  "--ht-icon-button-hover-background-color": "#e4e4e5",
  "--ht-icon-button-hover-icon-color": "rgba(53, 53, 53, 0.60)",
  "--ht-icon-active-button-border-color": "#19191c",
  "--ht-icon-active-button-background-color": "#19191c",
  "--ht-icon-active-button-icon-color": "#ffffff",
  "--ht-icon-active-button-hover-border-color": "#ffffff",
  "--ht-icon-active-button-hover-background-color": "#182721",
  "--ht-icon-active-button-hover-icon-color": "#ffffff",
  "--ht-collapse-button-border-radius": "16px",
  "--ht-collapse-button-open-border-color": "rgba(255, 255, 255, 0)",
  "--ht-collapse-button-open-background-color": "rgba(255, 255, 255, 0)",
  "--ht-collapse-button-open-icon-color": "rgba(34, 34, 34, 0.40)",
  "--ht-collapse-button-open-icon-active-color": "rgba(255, 255, 255, 0.60)",
  "--ht-button-border-radius": "24px",
  "--ht-button-horizontal-padding": "16px",
  "--ht-button-vertical-padding": "8px",
  "--ht-primary-button-border-color": "rgba(255, 255, 255, 0)",
  "--ht-primary-button-foreground-color": "#ffffff",
  "--ht-primary-button-background-color": "#37bc6c",
  "--ht-secondary-button-border-color": "#e5e5e9",
  "--ht-secondary-button-foreground-color": "#37bc6c",
  "--ht-secondary-button-background-color": "#ffffff",
  "--ht-input-border-width": "1px",
  "--ht-input-border-radius": "6px",
  "--ht-input-horizontal-padding": "16px",
  "--ht-input-vertical-padding": "8px",
  "--ht-input-border-color": "#e5e5e9",
  "--ht-input-foreground-color": "#353535",
  "--ht-input-background-color": "#f7f7f9",
  "--ht-link-color": "#37bc6c",
  "--ht-link-hover-color": "#23a858",
};

// Function to replace CSS variables with actual values
const replaceVariables = (scssContent) => {
    return scssContent.replace(/var\((--[^)]+)\)/g, (match, variable) => {
        return cssVariables[variable] || match; // Replace if found, else keep original
    });
};

// Function to process all SCSS files in a directory
const processScssFiles = (dir) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const outputFilePath = path.join(outputDir, file);

        if (fs.statSync(filePath).isDirectory()) {
            // Create corresponding directory in output if necessary
            if (!fs.existsSync(outputFilePath)) {
                fs.mkdirSync(outputFilePath, { recursive: true });
            }
            processScssFiles(filePath); // Recursively process subdirectories
        } else if (file.endsWith('.scss')) {
            const scssContent = fs.readFileSync(filePath, 'utf8');
            const updatedContent = replaceVariables(scssContent);
            const output = filePath.replace('/styles/', '/styles_processed/');

            fse.ensureDirSync(path.dirname(output));
            fs.writeFileSync(output, updatedContent, 'utf8');
            console.log(`Processed: ${filePath} → ${outputFilePath}`);
        }
    });
};

// Start processing
processScssFiles(inputDir);

console.log('SCSS variable replacement complete!');
