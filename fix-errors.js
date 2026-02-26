const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('api');
let changedCount = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    content = content.replace(/res\.status\(500\)\.json\(\{ error: '([^']+)' \}\);/g, "res.status(500).json({ error: '$1', details: error instanceof Error ? error.message : String(error) });");
    if (original !== content) {
        fs.writeFileSync(file, content);
        changedCount++;
    }
});
console.log('Fixed errors in', changedCount, 'files out of', files.length);
