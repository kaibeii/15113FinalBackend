const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const COLOR_FAMILIES = {
  black:   ['#000000', '#1a1a1a', '#2c2c2c', '#333333', '#111111'],
  white:   ['#ffffff', '#f5f5f5', '#fafafa', '#eeeeee', '#e0e0e0'],
  grey:    ['#808080', '#9e9e9e', '#616161', '#757575', '#bdbdbd'],
  navy:    ['#001f3f', '#003366', '#2c3e50', '#1a237e', '#0d47a1'],
  blue:    ['#0000ff', '#2196f3', '#03a9f4', '#1976d2', '#42a5f5'],
  red:     ['#ff0000', '#e74c3c', '#c0392b', '#f44336', '#d32f2f'],
  green:   ['#008000', '#27ae60', '#2ecc71', '#4caf50', '#388e3c'],
  yellow:  ['#ffff00', '#f1c40f', '#ffd700', '#ffeb3b', '#fbc02d'],
  orange:  ['#ff6600', '#e67e22', '#ff9800', '#f57c00', '#ef6c00'],
  pink:    ['#ffc0cb', '#e91e63', '#ff69b4', '#f06292', '#ec407a'],
  purple:  ['#800080', '#9b59b6', '#673ab7', '#7b1fa2', '#ab47bc'],
  brown:   ['#8b4513', '#795548', '#a0522d', '#6d4c41', '#5d4037'],
  beige:   ['#f5f5dc', '#d2b48c', '#c8b89a', '#d7ccc8', '#bcaaa4'],
};

const NEUTRALS = ['black', 'white', 'grey', 'beige', 'brown'];

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function colorDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

function mapToColorFamily(hex) {
  let closestFamily = 'other';
  let closestDistance = Infinity;
  for (const [family, hexValues] of Object.entries(COLOR_FAMILIES)) {
    for (const familyHex of hexValues) {
      const distance = colorDistance(hex, familyHex);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestFamily = family;
      }
    }
  }
  return closestFamily;
}

function determineColorTag(colors) {
  if (!colors || colors.length === 0) return 'other';

  // Filter out near-white background (transparent bg renders as white after removal)
  const filtered = colors.filter(([hex, pct]) => {
    const rgb = hexToRgb(hex);
    const isNearWhite = rgb.r > 240 && rgb.g > 240 && rgb.b > 240;
    return !isNearWhite || pct < 20;
  });

  if (filtered.length === 0) return 'other';

  const dominantPct = filtered[0][1];

  // One color strongly dominates
  if (dominantPct >= 55) {
    return mapToColorFamily(filtered[0][0]);
  }

  // Two colors — if one is neutral use the other
  if (filtered.length === 2) {
    const c1 = mapToColorFamily(filtered[0][0]);
    const c2 = mapToColorFamily(filtered[1][0]);
    if (NEUTRALS.includes(c1) && !NEUTRALS.includes(c2)) return c2;
    if (NEUTRALS.includes(c2) && !NEUTRALS.includes(c1)) return c1;
  }

  // Multiple significant colors
  const significantColors = filtered.filter(([, pct]) => pct > 15);
  if (significantColors.length >= 3) return 'pattern';
  if (significantColors.length === 2) return 'multicolor';

  return mapToColorFamily(filtered[0][0]);
}

async function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'outfit-picker',
        resource_type: 'image',
        format: 'png',
        colors: true,
      },
      (err, result) => {
        if (err) {
          console.error('Cloudinary upload error:', err);
          reject(err);
        } else {
          const color = determineColorTag(result.colors);
          console.log('Upload success:', result.secure_url);
          console.log('Detected color:', color);
          resolve({ imageUrl: result.secure_url, color });
        }
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadBuffer, NEUTRALS };