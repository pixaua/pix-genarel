export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ reply: 'Message is required' });
  }

  const API_KEY = process.env.GEMINI_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ reply: 'Vercel-এ API Key সেট করা নেই!' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      // গুগলের আসল এরর মেসেজটা এখানে দেখাবে
      return res.status(500).json({ reply: "গুগল থেকে এরর: " + JSON.stringify(data.error || data) });
    }
  } catch (error) {
    return res.status(500).json({ reply: 'সার্ভার এরর: ' + error.message });
  }
}
