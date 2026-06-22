const fs = require('fs');
let code = fs.readFileSync('src/data/chipOptions.ts', 'utf-8');

const moodMatch = code.match(/export const moodProfiles = \[([\s\S]*?)\] as const;/);
const ids = [];
if (moodMatch) {
  const regex = /id: "([^"]+)"/g;
  let match;
  while ((match = regex.exec(moodMatch[1])) !== null) {
    ids.push(match[1]);
  }
}
const filteredArrayStr = ids.map(id => `        "${id}",`).join('\n');
const replacement = `      brand_personality: [\n${filteredArrayStr}\n      ],`;

code = code.replace(/      brand_personality: \[\s*[\s\S]*?\s*\],/, replacement);
fs.writeFileSync('src/data/chipOptions.ts', code);
console.log('done');
