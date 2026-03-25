import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: '../.env.local' });
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve the static React files from 'dist' directory in production
app.use(express.static(path.join(__dirname, '../dist')));
app.get('/api/health', (req, res) => {
    res.send('Birr Tracker API Server is running');
});
function createAiClient() {
    const apiKey = process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new Mistral({ apiKey });
}
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.post('/api/ai/advisor', async (req, res) => {
    try {
        const { context, message } = req.body;
        const ai = createAiClient();
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        if (!ai) {
            return res.status(503).json({ error: 'AI service is not configured. Set MISTRAL_API_KEY in the server environment.' });
        }
        const response = await ai.chat.complete({
            model: "mistral-large-latest",
            messages: [
                {
                    role: 'system',
                    content: "You are a professional financial advisor for an app called 'Birr Tracker'. Always provide structured, easy-to-read advice. Use bold text for key figures and important points. Use bullet points for lists. Be encouraging and professional."
                },
                {
                    role: 'user',
                    content: `Context: ${context}. Question: ${message}`
                }
            ]
        });
        res.json({ text: response.choices?.[0]?.message?.content || '' });
    }
    catch (error) {
        console.error('AI Advisor Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to generate AI response.';
        res.status(500).json({ error: message });
    }
});
app.post('/api/ai/report', async (req, res) => {
    try {
        const { context } = req.body;
        const ai = createAiClient();
        if (!context) {
            return res.status(400).json({ error: 'Context is required' });
        }
        if (!ai) {
            return res.status(503).json({ error: 'AI service is not configured. Set MISTRAL_API_KEY in the server environment.' });
        }
        const response = await ai.chat.complete({
            model: 'mistral-large-latest',
            messages: [
                {
                    role: 'system',
                    content: `You are a friendly personal finance advisor for 'Birr Tracker', an Ethiopian personal finance app.
          All amounts are in Ethiopian Birr (ETB). Generate a clear, practical, encouraging financial report in plain English.
          Use Markdown formatting. Include: 1) Executive summary (2-3 sentences), 2) Key highlights (what went well),
          3) Areas to improve, 4) Specific actionable tips for next period. Keep it under 400 words.`
                },
                {
                    role: 'user',
                    content: `Generate a financial report for: ${JSON.stringify(context, null, 2)}`
                }
            ]
        });
        res.json({ text: response.choices?.[0]?.message?.content || '' });
    }
    catch (error) {
        console.error('AI Report Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to generate AI report.';
        res.status(500).json({ error: message });
    }
});
app.post('/api/ai/receipt', async (req, res) => {
    try {
        const { base64Image, mimeType } = req.body;
        const ai = createAiClient();
        if (!base64Image || !mimeType) {
            return res.status(400).json({ error: 'Image data and mimeType are required' });
        }
        if (!ai) {
            return res.status(503).json({ error: 'AI service is not configured. Set MISTRAL_API_KEY in the server environment.' });
        }
        const response = await ai.chat.complete({
            model: "pixtral-large-latest",
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            imageUrl: `data:${mimeType};base64,${base64Image}`
                        },
                        {
                            type: 'text',
                            text: "Extract the merchant name, total amount, date (in YYYY-MM-DD format), and a suggested category from this receipt. Return the result as a JSON object with keys: merchant (string), amount (number), date (string), and category (string)."
                        }
                    ]
                }
            ],
            responseFormat: { type: 'json_object' }
        });
        const content = response.choices?.[0]?.message?.content;
        const jsonContent = typeof content === 'string' ? content : '';
        res.json(JSON.parse(jsonContent || "{}"));
    }
    catch (error) {
        console.error('Receipt Scan Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to scan receipt.';
        res.status(500).json({ error: message });
    }
});
// Any other GET request that doesn't hit /api/ should return the React index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});
app.listen(port, () => {
    console.log(`Birr Tracker API server running on port ${port}`);
});
