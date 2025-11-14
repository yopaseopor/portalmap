const fs = require('fs');
const readline = require('readline');

async function compareFiles(originalFile, translatedFile) {
    const originalStream = fs.createReadStream(originalFile, { encoding: 'utf8' });
    const translatedStream = fs.createReadStream(translatedFile, { encoding: 'utf8' });

    const originalLines = readline.createInterface({
        input: originalStream,
        crlfDelay: Infinity
    });

    const translatedLines = readline.createInterface({
        input: translatedStream,
        crlfDelay: Infinity
    });

    let lineNumber = 0;
    const differences = [];
    const originalLineArray = [];
    const translatedLineArray = [];

    // Read all lines into arrays
    for await (const line of originalLines) {
        originalLineArray.push(line);
    }

    for await (const line of translatedLines) {
        translatedLineArray.push(line);
    }

    // Compare line by line
    const maxLength = Math.max(originalLineArray.length, translatedLineArray.length);
    
    for (let i = 0; i < maxLength; i++) {
        lineNumber++;
        const originalLine = originalLineArray[i] || '';
        const translatedLine = translatedLineArray[i] || '';

        if (originalLine !== translatedLine) {
            differences.push({
                lineNumber,
                original: originalLine,
                translated: translatedLine,
                issue: originalLine && translatedLine ? 'Different content' : 
                       originalLine ? 'Missing in translation' : 'Extra line in translation'
            });
        }

        // Stop after finding 10 differences to avoid overwhelming output
        if (differences.length >= 10) {
            differences.push({
                lineNumber: '...',
                original: '...',
                translated: '...',
                issue: 'More differences exist...'
            });
            break;
        }
    }

    // Output differences
    if (differences.length > 0) {
        console.log('Differences found:');
        console.table(differences);
    } else {
        console.log('No differences found!');
    }

    // Check line counts
    console.log(`\nOriginal file lines: ${originalLineArray.length}`);
    console.log(`Translated file lines: ${translatedLineArray.length}`);
    
    if (originalLineArray.length !== translatedLineArray.length) {
        console.log('\nWarning: Line counts do not match!');
    }
}

// Run the comparison
const originalFile = 'transcript.txt';
const translatedFile = 'transcript_de.txt';

compareFiles(originalFile, translatedFile).catch(console.error);
