const axios = require('axios');
const FormData = require('form-data');

async function removeBackground(imageBuffer) {
  try {
    const form = new FormData();
    form.append('image_file', imageBuffer, {
      filename: 'upload.jpg',
      contentType: 'image/jpeg',
    });
    form.append('size', 'auto');

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
      headers: {
        ...form.getHeaders(),
        'X-Api-Key': process.env.REMOVE_BG_KEY,
      },
      responseType: 'arraybuffer',
      maxBodyLength: Infinity,
    });

    console.log('Background removed successfully');
    return Buffer.from(response.data);
  } catch (err) {
    console.error('remove.bg error:', err.message);
    return imageBuffer;
  }
}

module.exports = { removeBackground };