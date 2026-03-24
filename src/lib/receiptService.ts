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

  const contentType = response.headers.get('content-type') || '';
  const rawBody = await response.text();

  if (!response.ok) {
    if (contentType.includes('application/json')) {
      try {
        const err = JSON.parse(rawBody);
        if (err?.error) throw new Error(String(err.error));
      } catch {
        // Fall through to generic error below.
      }
    }

    if (rawBody.trim().startsWith('<')) {
      throw new Error('Receipt endpoint returned HTML instead of JSON. Verify /api backend route.');
    }

    throw new Error('Failed to process receipt');
  }

  if (!contentType.includes('application/json')) {
    throw new Error('Receipt endpoint returned non-JSON response.');
  }

  return JSON.parse(rawBody) as ReceiptData;
}
