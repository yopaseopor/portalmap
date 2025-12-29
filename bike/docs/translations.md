
# Translation System Documentation

This document explains how the translation system works in this application and how to add a new language.

## Overview

The application uses a combination of JavaScript files and CSV files to handle translations.

- **UI Translations**: The user interface (UI) elements are translated using JavaScript files located in the `src/i18n` directory.
- **Taginfo Suggestions**: The suggestions for OpenStreetMap tags are loaded from CSV files located in the root directory.

## UI Translations

The UI translations are managed by the scripts in the `src/i18n` directory.

### Files

-   `src/i18n/index.js`: This is the main file for the i18n system. It handles language switching, loading translations, and updating the UI.
-   `src/i18n/XX.js`: Each language has its own JavaScript file (e.g., `en.js`, `es.js`, `an.js`). These files export an object containing the translations for that language.

### How it works

1.  The `src/i18n/index.js` file imports the translation objects from each language file.
2.  The `setLanguage` function in `src/i18n/index.js` is called to change the current language.
3.  This function updates the UI by finding all elements with the `data-i18n` attribute and setting their content to the corresponding translation.

### Adding a new language

1.  Create a new JavaScript file in the `src/i18n` directory (e.g., `fr.js`).
2.  In this file, export an object with the translations for the new language. You can use another language file as a template.
3.  Import the new language file in `src/i18n/index.js`.
4.  Add the new language to the `languages` array in `src/i18n/index.js`.

## Taginfo Suggestions

The suggestions for OpenStreetMap tags are loaded from CSV files.

### Files

-   `taginfo_simple_XX.csv`: These files contain the tag suggestions for each language. The `XX` is the two-letter language code (e.g., `en`, `es`, `an`).
-   `src/taginfo_api.js`: This file contains the logic for loading and parsing the CSV files.

### How it works

1.  The `getTaginfoCsvPath` function in `src/taginfo_api.js` determines which CSV file to load based on the current language.
2.  The `loadTaginfoDefinitions` function fetches the CSV file and calls `parseCSVDataSimple` to parse it.
3.  The `parseCSVDataSimple` function reads the CSV file and stores the data in the `window.taginfoData` object.

### Adding a new language

1.  Create a new CSV file in the root directory with the name `taginfo_simple_XX.csv`, where `XX` is the two-letter language code for the new language.
2.  The CSV file should have three columns: `key`, `value`, and `definition`.
3.  The application will automatically load this file when the language is switched to the new language.

## Current State of Aragonese Translation

The file `taginfo_simple_an.csv` exists, but its content is mostly in Spanish, with some encoding issues. To properly support Aragonese, this file needs to be translated.
