import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config({ path: '../.env.local' });
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Use the API key securely from the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/ai/advisor', async (req, res) => {
  try {
    const { context, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: "You are a professional financial advisor for an app called 'Birr Tracker'. Always provide structured, easy-to-read advice. Use bold text for key figures and important points. Use bullet points for lists. Be encouraging and professional.",
      },
      contents: [
        { role: 'user', parts: [{ text: `Context: ${context}. Question: ${message}` }] }
      ]
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('AI Advisor Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response.' });
  }
});

app.post('/api/ai/report', async (req, res) => {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({ error: 'Context is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: `You are a friendly personal finance advisor for 'Birr Tracker', an Ethiopian personal finance app. 
          All amounts are in Ethiopian Birr (ETB). Generate a clear, practical, encouraging financial report in plain English. 
          Use Markdown formatting. Include: 1) Executive summary (2-3 sentences), 2) Key highlights (what went well), 
          3) Areas to improve, 4) Specific actionable tips for next period. Keep it under 400 words.`,
      },
      contents: [{ role: 'user', parts: [{ text: `Generate a financial report for: ${JSON.stringify(context, null, 2)}` }] }],
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('AI Report Error:', error);
    res.status(500).json({ error: 'Failed to generate AI report.' });
  }
});

app.post('/api/ai/receipt', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required' });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Extract the merchant name, total amount, date (in YYYY-MM-DD format), and a suggested category from this receipt.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["merchant", "amount", "date", "category"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error('Receipt Scan Error:', error);
    res.status(500).json({ error: 'Failed to scan receipt.' });
  }
});

app.listen(port, () => {
  console.log(`Birr Tracker API server running on port ${port}`);
});