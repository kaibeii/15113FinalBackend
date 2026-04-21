const ClothingItem = require('../models/ClothingItem');
const { removeBackground } = require('../services/removeBg');
const { uploadBuffer } = require('../services/cloudinary');

const NEUTRALS = ['black', 'white', 'grey', 'beige', 'brown'];

const COLOR_PAIRS = {
  navy:   ['beige', 'white', 'grey', 'brown'],
  blue:   ['white', 'grey', 'beige', 'navy'],
  red:    ['navy', 'white', 'black', 'grey'],
  green:  ['beige', 'white', 'brown', 'navy'],
  yellow: ['navy', 'white', 'black', 'grey'],
  orange: ['navy', 'white', 'black', 'brown'],
  pink:   ['navy', 'white', 'black', 'grey'],
  purple: ['white', 'black', 'grey', 'beige'],
};

function colorsMatch(color1, color2) {
  if (NEUTRALS.includes(color1) || NEUTRALS.includes(color2)) return true;
  if (color1 === 'multicolor' || color1 === 'pattern') return NEUTRALS.includes(color2);
  if (color2 === 'multicolor' || color2 === 'pattern') return NEUTRALS.includes(color1);
  if (color1 === color2) return true;
  const pairs = COLOR_PAIRS[color1] || [];
  return pairs.includes(color2);
}

function pickBestMatch(item, candidates) {
  if (!candidates.length) return null;
  const matches = candidates.filter(c => colorsMatch(item.color, c.color));
  if (matches.length > 0) return matches[Math.floor(Math.random() * matches.length)];
  const neutrals = candidates.filter(c => NEUTRALS.includes(c.color));
  if (neutrals.length > 0) return neutrals[Math.floor(Math.random() * neutrals.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// POST /upload
async function uploadItem(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    console.log('Received image, processing...');

    const cleanBuffer = await removeBackground(req.file.buffer);
    const { imageUrl, color: suggestedColor } = await uploadBuffer(cleanBuffer);

    // Use user-confirmed color if provided, otherwise use Cloudinary suggestion
    const confirmedColor = req.body.color || suggestedColor;
    const confirmedType  = req.body.type || 'other';
    const description    = req.body.description || '';

    const item = await ClothingItem.create({
      imageUrl,
      type: confirmedType,
      color: confirmedColor,
      description,
    });

    console.log('Item saved:', item._id, '| Color:', confirmedColor);

    // Return item AND suggestedColor so frontend can pre-select it
    res.json({ item, suggestedColor });
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

// PATCH /items/:id
async function updateItem(req, res) {
  try {
    const { type, color, description } = req.body;
    const item = await ClothingItem.findByIdAndUpdate(
      req.params.id,
      { type, color, description },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    console.log('Item updated:', item._id);
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /outfit
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

    const top    = tops[Math.floor(Math.random() * tops.length)];
    const bottom = pickBestMatch(top, bottoms);
    const shoe   = pickBestMatch(top, shoes);

    console.log(`Outfit: ${top.color} top + ${bottom.color} bottom + ${shoe.color} shoes`);
    res.json({ outfit: { top, bottom, shoes: shoe } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadItem, getItems, deleteItem, updateItem, generateOutfit };