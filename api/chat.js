export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Vercel Environment Variable থেকে API Key নিবে
  const API_KEY = process.env.GEMINI_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key is missing in Vercel settings' });
  }

  try {
    // Using Gemini 1.5 Flash model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      console.log("Gemini API Error:", data); 
      return res.status(500).json({ error: 'AI did not respond properly', details: data });
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
