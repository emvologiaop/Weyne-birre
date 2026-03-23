import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

export interface ReceiptData {
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

export async function processReceipt(base64Image: string, mimeType: string): Promise<ReceiptData> {
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

  return JSON.parse(response.text || "{}");
}
