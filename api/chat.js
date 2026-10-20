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

  // ৮ সেকেন্ড পর রিকোয়েস্ট ক্যানসেল করার সেটআপ
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal, // টাইমআউট সিগন্যাল যুক্ত করা হলো
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: message }] }],
            // প্রম্পট ছোট করা হয়েছে যাতে AI দ্রুত উত্তর দিতে পারে
            systemInstruction: {
                parts: [{ text: "You are 16 AI. Creator: Amaz Uddin Abir (always call him Sir). If asked about Promi, say she is Sir's wife (always call her Ma'am). Answer in user's language, very concisely." }]
            }
        })
      }
    );
    
    clearTimeout(timeoutId); // রেসপন্স আসলে টাইমার বন্ধ করবে

    const data = await response.json();

    if (response.ok && data.candidates && data.candidates.length > 0) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(response.status).json({ reply: "গুগল এরর: " + JSON.stringify(data.error?.message || data) });
    }

  } catch (error) {
    clearTimeout(timeoutId);
    // যদি ৮ সেকেন্ডে উত্তর না আসে, তবে সুন্দর মেসেজ দেখাবে
    if (error.name === 'AbortError') {
        return res.status(504).json({ reply: "⏳ গুগলের সার্ভার অনেক স্লো, ৮ সেকেন্ডেও উত্তর আসেনি। দয়া করে আবার মেসেজ দিন।" });
    }
    return res.status(500).json({ reply: 'সার্ভার এরর: ' + error.message });
  }
};
