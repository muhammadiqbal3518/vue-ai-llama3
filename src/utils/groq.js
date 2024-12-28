import { Groq } from "groq-sdk";

const API_KEY = import.meta.env.VITE_API_KEY;

const groq = new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
});

// Chat completion request
export const requestToIqbalAI = async (content) => {
  const reply = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: 'Balas dalam bahasa indonesia: ' + content,
      },
    ],
    model: 'llama3-8b-8192',
  });
  return reply.choices[0].message.content;
};

// Transcription request
export const transcribeAudio = async (audioFile) => {
  const file = new File([audioFile], "audio.wav", { type: audioFile.type });

  const reply = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
  });

  return reply.text;
};
