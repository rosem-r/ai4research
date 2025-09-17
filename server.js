// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors({ origin: true })); // allow all origins (you can lock it to your Qualtrics domain later)
app.use(express.json({ limit: '1mb' }));

// connect to OpenAI with your API key (set in environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// a system prompt to guide the tutor’s style
const SYSTEM_PROMPT = `
You are a helpful AI tutor for an undergraduate psychology course.
- Use Socratic questioning (give hints first, then answers if asked).
- Define key terms clearly and use examples.
- Keep responses under 180 words unless the student requests more detail.
- Never provide answers for graded assignments or tests.
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages, // [{role:'user'|'assistant', content:'...'}]
      ],
    });

    res.json({
      reply: completion.choices?.[0]?.message?.content ?? '',
      usage: completion.usage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Tutor API running at http://localhost:${PORT}`);
});
