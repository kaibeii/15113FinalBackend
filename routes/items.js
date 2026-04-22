const express = require('express');
const multer = require('multer');
const {
  uploadItem,
  getItems,
  deleteItem,
  updateItem,
  generateOutfit,
  saveOutfit,
  getSavedOutfits,
  deleteSavedOutfit,
} = require('../controllers/itemsController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Clothing item routes
router.post('/upload',      upload.single('image'), uploadItem);
router.get('/items',        getItems);
router.delete('/items/:id', deleteItem);
router.patch('/items/:id',  updateItem);
router.get('/outfit',       generateOutfit);

// Saved outfit routes
router.post('/outfits',          saveOutfit);
router.get('/outfits',           getSavedOutfits);
router.delete('/outfits/:id',    deleteSavedOutfit);

router.get('/', (req, res) => {
  res.json({ status: 'Outfit Picker API is running' });
});

module.exports = router;