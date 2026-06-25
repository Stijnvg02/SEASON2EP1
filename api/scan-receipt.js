// POST /api/scan-receipt
// Proxies an image to the Anthropic Claude Vision API and returns parsed transactions.
// Body: { image: "<base64>", mediaType: "image/jpeg", apiKey: "sk-ant-..." }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { image, mediaType, apiKey } = req.body || {};
  if (!image || !apiKey) {
    return res.status(400).json({ error: 'Missing image or apiKey' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: `Analyseer deze screenshot van een bankapp of financieel overzicht.
Extraheer alle transacties die je ziet.
Geef ALLEEN een JSON-array terug, geen uitleg, geen markdown backticks.
Formaat: [{"naam":"omschrijving","bedrag":12.50,"type":"uitgave","categorie":"Boodschappen","datum":"2026-06-15"}]
Categorieën: Huur/wonen, Boodschappen, Uit eten, Transport, Abonnementen, Salaris, Zorg, Kleding, Vrije tijd, Overig
type: "uitgave" of "inkomst"
Bedragen altijd positief getallen.
Geef ALLEEN de JSON-array terug, niets anders.`
            }
          ]
        }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic error' });
    }
    const raw = data.content?.[0]?.text ?? '[]';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    res.status(200).json({ transactions: JSON.parse(cleaned) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
