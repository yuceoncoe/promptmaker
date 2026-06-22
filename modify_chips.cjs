const fs = require('fs');

const data = fs.readFileSync('src/data/chipOptions.ts', 'utf8');

// We will add aesthetic_options and era_options at the end of the file
const extraExports = `
export const aesthetic_options = [
  "industrial", "graphic", "editorial", "organic", "minimal", "bauhaus", 
  "dieter rams style", "utilitarian design", "brutalism", "conceptual art", 
  "pop art", "surreal", "memphis design", "quiet luxury", "gloss maximalism", 
  "matte restraint", "tactile craft", "avant-garde", "cinematic", "commercial"
];

export const era_options = [
  "y2k", "retro-futuristic", "nostalgic", "90s", "80s synthwave", 
  "mid-century modern", "vaporwave", "frutiger aero", "cyberpunk"
];
`;

fs.writeFileSync('src/data/chipOptions.ts', data + '\n' + extraExports);
console.log('Modified chipOptions.ts');
