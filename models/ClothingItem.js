const mongoose = require('mongoose');

const ClothingItemSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['top', 'bottom', 'shoes', 'hat', 'other'],
    required: true,
  },
  color: {
    type: String,
    default: 'other',
  },
  description: {
    type: String,
    default: '',
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ClothingItem', ClothingItemSchema);