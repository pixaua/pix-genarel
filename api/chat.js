module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method Not Allowed' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: 'Message is required' });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ reply: 'Vercel-এ API Key সেট করা নেই!' });

  // ৩ বার চেষ্টা করার লজিক (503 Error ফিক্স করার জন্য)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates && data.candidates.length > 0) {
        return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
      } 
      
      if (response.status === 503 && attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue; 
      }

      return res.status(response.status).json({ reply: "গুগল এরর: " + JSON.stringify(data.error?.message || data) });

    } catch (error) {
      if (attempt === 3) {
        return res.status(500).json({ reply: 'সার্ভার এরর: ' + error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
