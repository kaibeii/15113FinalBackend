const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.DEDALUS_KEY,
  baseURL: 'https://api.dedaluslabs.ai/v1',
});

async function classifyClothing(imageUrl) {
  try {
    const response = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      max_tokens: 50,
      messages: [
        {
          role: 'system',
          content:
            'You are a clothing classifier. You will be given an image of a clothing item and must classify it. Reply with exactly one word only — no punctuation, no explanation.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: 'What type of clothing is this? Reply with exactly one word: top, bottom, shoes, hat, or other.',
            },
          ],
        },
      ],
    });

    const result = response.choices[0].message.content
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '');

    const valid = ['top', 'bottom', 'shoes', 'hat', 'other'];
    return valid.includes(result) ? result : 'other';
  } catch (err) {
    console.error('Classification error:', err.message);
    return 'other';
  }
}

module.exports = { classifyClothing };
