const fs = require('fs');
const path = require('path');
const dictPath = path.join(__dirname, '../assets/dictionary.json');

if (fs.existsSync(dictPath)) {
    console.log(fs.readFileSync(dictPath, 'utf8'));
} else {
    console.log("{}");
}