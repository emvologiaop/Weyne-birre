const API_URL = import.meta.env.VITE_API_URL || '';

export interface ReceiptData {
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

export async function processReceipt(base64Image: string, mimeType: string): Promise<ReceiptData> {
const response = await fetch('/api/ai/receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mimeType })
  });

  if (!response.ok) throw new Error('Failed to process receipt');
  return await response.json();
}
