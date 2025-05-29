import { OpenAI } from 'openai';
import path from 'path';
import fs from 'fs/promises';

const openai = new OpenAI();

const VOICE_MAP = {
  angry: "onyx",
  annoyed: "onyx",
  sad: "alloy",
  grumpy: "onyx",
  dramatic: "fable",
  jealous: "nova",
  sleepy: "shimmer",
  lazy: "shimmer",
  happy: "echo",
  content: "echo",
  sarcastic: "fable",
  cute: "nova",
  mysterious: "alloy",
  curious: "echo",
  default: "echo",
};

// Step 1: Detect tone from image URL
export async function detectCatToneFromImage(imageUrl) {
  const prompt = `You are a professional cat psychologist. Look at the cat in this photo and describe the tone of voice it would use if it could talk.
Return just ONE word like: sarcastic, sleepy, angry, cute, flirty, dramatic, grumpy, mysterious.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 10
  });

  return response.choices[0].message.content.trim().toLowerCase();
}

// Step 2: Generate persona
export async function generatePromptFromImage(imageUrl, tone) {
  const prompt = `You're an imaginative and humorous AI cat. Look at this image of yourself and create a storytelling persona based on your expression and surroundings.
Write a 1-sentence instruction describing your role today. Be creative and tone-aligned.
Tone: ${tone}
Return just the instruction.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 100
  });

  return response.choices[0].message.content.trim();
}

// Step 3: Generate diary
export async function generateCatDiary(personaPrompt, imageUrl) {
  const prompt = `${personaPrompt}\nNow write a dramatic, cute, sarcastic, or poetic diary entry (max 80 words) in that voice, from the cat's point of view. Be expressive.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 200
  });

  return response.choices[0].message.content.trim();
}

// Step 4: Map tone to voice
export function chooseVoiceFromTone(tone) {
  tone = tone.toLowerCase();
  for (const key in VOICE_MAP) {
    if (tone.includes(key)) {
      return VOICE_MAP[key];
    }
  }
  return VOICE_MAP.default;
}

// Step 5: Generate audio file
export async function generateAudio(text, voice, outputPath) {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    response_format: "mp3"
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

// Step 6: Full pipeline
export async function generateCatDiaryAllFromImage(imageUrl, outputDir='', generateAudioFlag = false) {
  const tone = await detectCatToneFromImage(imageUrl);
  const persona = await generatePromptFromImage(imageUrl, tone);
  const diaryText = await generateCatDiary(persona, imageUrl);
  const voice = chooseVoiceFromTone(tone);

  let audioPath = null;

  if (generateAudioFlag) {
    const fileName = 'diary_' + Date.now() + '.mp3';
    audioPath = path.join(outputDir, fileName);
    await generateAudio(diaryText, voice, audioPath);
  }

  return {
    tone,
    persona,
    text: diaryText,
    voice,
    audio_path: audioPath // can be null if audio not generated
  };
}


// Test:
// const imageUrl = "https://res.cloudinary.com/dwmldyqmt/image/upload/v1748466752/oxqq2jhdql8q9g7pnvb3.jpg"
// const resultWithAudio = await generateCatDiaryAllFromImage(imageUrl, './audio', true);
// const resultWithoutAudio = await generateCatDiaryAllFromImage(imageUrl);
// console.log(resultWithoutAudio)