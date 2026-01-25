
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Caption } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY not set");
  return new GoogleGenAI({ apiKey });
};

export const transcribeAudio = async (audioBase64: string, signal?: AbortSignal): Promise<Caption[]> => {
  const ai = getAI();
  
  const prompt = `
    Listen to this audio and transcribe it into captions.
    Return a JSON array where each object has:
    - "id": a unique string ID
    - "start": start time in seconds (number)
    - "end": end time in seconds (number)
    - "text": the transcribed text
    
    Ensure the captions are well-segmented by natural pauses and sentences.
    Do not wrap the JSON in markdown code blocks. Just return the raw JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            start: { type: Type.NUMBER },
            end: { type: Type.NUMBER },
            text: { type: Type.STRING }
          },
          required: ['id', 'start', 'end', 'text']
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No transcription generated");
  
  try {
    return JSON.parse(text) as Caption[];
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("Invalid response format from AI");
  }
};

export const translateCaptions = async (captions: Caption[], targetLanguage: string, signal?: AbortSignal): Promise<Caption[]> => {
  const ai = getAI();
  
  const prompt = `
    Translate the following captions into ${targetLanguage}.
    Maintain the exact "id", "start", and "end" values. Only modify the "text" field.
    
    Input JSON:
    ${JSON.stringify(captions)}
    
    Return the translated JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const text = response.text;
  if (!text) throw new Error("No translation generated");
  
  try {
    return JSON.parse(text) as Caption[];
  } catch (e) {
    throw new Error("Invalid response format from AI during translation");
  }
};

export const generateSpeech = async (text: string, signal?: AbortSignal): Promise<string> => {
  const ai = getAI();
  
  // Text limit check for simple implementation
  const truncatedText = text.slice(0, 4000); 

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: {
      parts: [{ text: truncatedText }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' } 
        }
      }
    }
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error("No audio generated");
  
  return audioData;
};
