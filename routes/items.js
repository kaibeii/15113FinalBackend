const express = require('express');
const multer  = require('multer');
const {
  uploadItem,
  getItems,
  deleteItem,
  generateOutfit,
} = require('../controllers/itemsController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload',      upload.single('image'), uploadItem);
router.get('/items',        getItems);
router.delete('/items/:id', deleteItem);
router.get('/outfit',       generateOutfit);

router.get('/', (req, res) => {
  res.json({ status: 'Outfit Picker API is running' });
});

module.exports = router;