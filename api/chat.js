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

  // একাধিক মডেল ট্রাই করবে, যদি একটাতে ভিড় থাকে
  const modelsToTry = ["gemini-3.8-flash", "gemini-1.5-flash-latest", "gemini-pro"];
  let lastError = "";

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
        }
      );

      const data = await response.json();

      // যদি সফলভাবে উত্তর পাওয়া যায়
      if (response.ok && data.candidates && data.candidates.length > 0) {
        return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
      }
      
      // যদি এরর হয়, তবে এরর মেসেজটা সেভ করে রাখবে
      lastError = data.error?.message || "Unknown error";

    } catch (error) {
      lastError = error.message;
    }
  }

  // যদি সব মডেল ব্যস্ত থাকে, তবে শেষ এররটা দেখাবে
  return res.status(500).json({ reply: "গুগলের সার্ভার বর্তমানে ব্যস্ত। ২ মিনিট পর আবার চেষ্টা করুন। (বিস্তারিত: " + lastError + ")" });
};
