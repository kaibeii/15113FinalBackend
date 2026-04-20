const ClothingItem = require('../models/ClothingItem');
const { removeBackground } = require('../services/removeBg');
const { uploadBuffer, NEUTRALS } = require('../services/cloudinary');

// Color compatibility rules
// Returns true if two colors work together as an outfit
function colorsMatch(color1, color2) {
  // Neutrals go with everything
  if (NEUTRALS.includes(color1) || NEUTRALS.includes(color2)) return true;

  // Multicolor/pattern pairs well with neutrals (already covered above)
  // but not with other multicolor/pattern
  if (
    (color1 === 'multicolor' || color1 === 'pattern') &&
    (color2 === 'multicolor' || color2 === 'pattern')
  ) return false;

  // Multicolor or pattern pairs fine with any solid
  if (color1 === 'multicolor' || color1 === 'pattern') return true;
  if (color2 === 'multicolor' || color2 === 'pattern') return true;

  // Same color family always works
  if (color1 === color2) return true;

  // Known good pairings
  const goodPairs = [
    ['navy', 'beige'],
    ['navy', 'white'],
    ['navy', 'grey'],
    ['red', 'navy'],
    ['red', 'white'],
    ['blue', 'white'],
    ['blue', 'beige'],
    ['green', 'beige'],
    ['green', 'brown'],
    ['brown', 'beige'],
    ['brown', 'green'],
    ['purple', 'grey'],
    ['pink', 'grey'],
    ['pink', 'navy'],
    ['orange', 'navy'],
    ['orange', 'brown'],
    ['yellow', 'navy'],
    ['yellow', 'grey'],
  ];

  return goodPairs.some(
    ([a, b]) =>
      (a === color1 && b === color2) ||
      (a === color2 && b === color1)
  );
}

// Try to find a matching item from a list given a reference color
function findMatchingItem(items, referenceColor) {
  if (!items || items.length === 0) return null;

  // Shuffle items for randomness
  const shuffled = [...items].sort(() => Math.random() - 0.5);

  // First try to find a color match
  const match = shuffled.find((item) => colorsMatch(referenceColor, item.color));
  if (match) return match;

  // Fall back to any item if no match found
  return shuffled[0];
}

// POST /upload
async function uploadItem(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('Received image, processing...');

    // 1. Remove background
    const cleanBuffer = await removeBackground(req.file.buffer);

    // 2. Upload to Cloudinary — returns imageUrl + detected color
    const { imageUrl, color } = await uploadBuffer(cleanBuffer);

    // 3. Use user-confirmed type from app
    const confirmedType = req.body.type || 'other';

    // 4. Save to MongoDB with color
    const item = await ClothingItem.create({
      imageUrl,
      type: confirmedType,
      color,
    });

    console.log(`Item saved: ${item._id} | type: ${confirmedType} | color: ${color}`);

    res.json({ item });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// GET /items
async function getItems(req, res) {
  try {
    const items = await ClothingItem.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /items/:id
async function deleteItem(req, res) {
  try {
    await ClothingItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /outfit — color-aware outfit generation
async function generateOutfit(req, res) {
  try {
    const tops    = await ClothingItem.find({ type: 'top' });
    const bottoms = await ClothingItem.find({ type: 'bottom' });
    const shoes   = await ClothingItem.find({ type: 'shoes' });

    if (!tops.length || !bottoms.length || !shoes.length) {
      return res.status(400).json({
        error: 'Not enough items. Need at least 1 top, 1 bottom, and 1 pair of shoes.',
      });
    }

    // 1. Pick a random top
    const top = tops[Math.floor(Math.random() * tops.length)];

    // 2. Find a bottom that matches the top's color
    const bottom = findMatchingItem(bottoms, top.color);

    // 3. Find shoes that match the bottom's color
    const shoe = findMatchingItem(shoes, bottom.color);

    console.log(
      `Outfit generated: top(${top.color}) + bottom(${bottom.color}) + shoes(${shoe.color})`
    );

    res.json({
      outfit: { top, bottom, shoes: shoe },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadItem, getItems, deleteItem, generateOutfit };