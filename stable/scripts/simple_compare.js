const fs = require('fs');

// Read both files
const original = fs.readFileSync('transcript.txt', 'utf8').split('\n');
const translated = fs.readFileSync('transcript_de.txt', 'utf8').split('\n');

console.log(`Original lines: ${original.length}`);
console.log(`Translated lines: ${translated.length}`);

// Find first 10 differences
console.log('\nFirst 10 differences:');
let diffCount = 0;
for (let i = 0; i < Math.max(original.length, translated.length); i++) {
    if (original[i] !== translated[i]) {
        console.log(`\nLine ${i + 1}:`);
        console.log(`  Original: ${original[i] || '[MISSING]'}`);
        console.log(`  Translated: ${translated[i] || '[MISSING]'}`);
        diffCount++;
        if (diffCount >= 10) {
            console.log('\n...and more differences');
            break;
        }
    }
}

if (diffCount === 0) {
    console.log('No differences found!');
}
