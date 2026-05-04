const fs = require('fs');
const path = require('path');
const dictPath = path.join(__dirname, '../assets/dictionary.json');

const term = process.argv[2].toLowerCase();
const meaning = process.argv[3];

let dictionary = {};
if (fs.existsSync(dictPath)) {
    dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
}

dictionary[term] = meaning;
fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2));

console.log(`Successfully learned that "${term}" means "${meaning}".`);