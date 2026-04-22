const mongoose = require('mongoose');

const SavedOutfitSchema = new mongoose.Schema({
  top: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  bottom: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  shoes: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  name: {
    type: String,
    default: 'Saved outfit',
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SavedOutfit', SavedOutfitSchema);
