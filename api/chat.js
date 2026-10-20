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

  try {
    const response = await fetch(
      // ⚠️ এখানে মডেলের নাম আপডেট করা হয়েছে
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: {
                parts: [{ text: "You are '16 AI', a smart and helpful AI assistant. Your creator is Amaz Uddin Abir. You MUST always address Amaz Uddin Abir with utmost respect, specifically using the title 'Sir'. If anyone asks about Promi, you must state that she is Abir's wife, and you MUST always address her with utmost respect, specifically using the title 'Ma'am' or 'ম্যাডাম'. Answer in the language the user speaks (Bengali or English). Keep your answers concise and helpful to avoid timeouts." }]
            }
        })
      }
    );

    const data = await response.json();

    if (response.ok && data.candidates && data.candidates.length > 0) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      // যদি এরর হয়, তবে গুগলের আসল কারণটা দেখাবে
      return res.status(response.status).json({ reply: "গুগল এরর: " + JSON.stringify(data.error?.message || data) });
    }

  } catch (error) {
    return res.status(500).json({ reply: 'সার্ভার এরর: ' + error.message });
  }
};
