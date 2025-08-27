// index.js
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

const upload = multer();

const GEMINI_MODEL = 'gemini-2.5-flash';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// helper fallback
function extractText(resp) {
  try {
    if (resp?.response?.text) return resp.response.text();
    const text =
      resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.response?.candidates?.[0]?.content?.text;
    return text ?? JSON.stringify(resp, null, 2);
  } catch (err) {
    console.error('Error extracting text:', err);
    return JSON.stringify(resp, null, 2);
  }
}


// Generate Text
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const resp = await model.generateContent(prompt);
    const text = resp.response.text?.() ?? extractText(resp);
    res.json({ result: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});


// Generate From Image
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!req.file) return res.status(400).json({ error: 'image file is required' });

    const imageBase64 = req.file.buffer.toString('base64');
    const parts = [
      { text: prompt || 'Describe this image.' },
      { inlineData: { mimeType: req.file.mimetype, data: imageBase64 } },
    ];

    const resp = await model.generateContent(parts);
    const text = resp.response.text?.() ?? extractText(resp);
    res.json({ result: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Generate From Audio
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!req.file) return res.status(400).json({ error: 'audio file is required' });

    const audioBase64 = req.file.buffer.toString('base64');
    const parts = [
      { text: prompt || 'Transkrip audio berikut:' },
      { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } },
    ];

    const resp = await model.generateContent(parts);
    const text = resp.response.text?.() ?? extractText(resp);
    res.json({ result: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Generate From Document
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!req.file) return res.status(400).json({ error: 'document file is required' });

    const docBase64 = req.file.buffer.toString('base64');
    const parts = [
      { text: prompt || 'Ringkas dokumen berikut:' },
      { inlineData: { mimeType: req.file.mimetype, data: docBase64 } },
    ];

    const resp = await model.generateContent(parts);
    const text = resp.response.text?.() ?? extractText(resp);
    res.json({ result: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});
